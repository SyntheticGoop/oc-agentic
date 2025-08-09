import type { Jujutsu } from "../src/jujutsu";
import { Err, Ok } from "../src/result";
import { generateTag } from "./crypto";
import { Loader } from "./persistence/loader";
import { Saver, type SavingPlanData } from "./persistence/saver";

// Stub data constants for project metadata removal
// These values replace actual project data during the inside-out migration
const STUB_PROJECT_DATA = {
  scope: "stub" as const,
  title: "stubbed project data",
  intent:
    "Project metadata has been stubbed during API migration. Task data remains functional.",
  objectives: ["Maintain interface compatibility during migration"],
  constraints: ["Project-level data is no longer available"],
} as const;

function createProject(
  project: SavingPlanData,
  saver: Saver,
  jujutsu: ReturnType<(typeof Jujutsu)["cwd"]>,
) {
  return new Proxy(project, {
    get(target, p) {
      if (p === "save") return () => saver.savePlan(target);
      if (p === "drop") return () => saver.drop();
      if (p === "goto")
        return async (hash: string) => {
          if (target.tasks.every((task) => task.task_key !== hash))
            return Err("Invocation Error: Task doesn't exist");
          jujutsu.navigate.to(hash);
        };

      // Stub project-level metadata fields during inside-out migration
      // This ensures all external access to project metadata returns stub values
      // while preserving the actual data for internal operations like save()
      if (p === "scope") return STUB_PROJECT_DATA.scope;
      if (p === "title") return STUB_PROJECT_DATA.title;
      if (p === "intent") return STUB_PROJECT_DATA.intent;
      if (p === "objectives") return STUB_PROJECT_DATA.objectives;
      if (p === "constraints") return STUB_PROJECT_DATA.constraints;

      // Handle JSON serialization by intercepting toJSON method
      // This ensures JSON.stringify() operations also return stubbed data
      if (p === "toJSON") {
        return () => ({
          // Return stubbed project metadata
          scope: STUB_PROJECT_DATA.scope,
          title: STUB_PROJECT_DATA.title,
          intent: STUB_PROJECT_DATA.intent,
          objectives: STUB_PROJECT_DATA.objectives,
          constraints: STUB_PROJECT_DATA.constraints,
          // Preserve functional task data (not stubbed)
          tasks: target.tasks,
          // Include other non-project fields that may be needed
          tag: target.tag,
          new: target.new,
        });
      }

      return target[p as keyof typeof target];
    },
  }) as SavingPlanData & {
    save(): ReturnType<typeof saver.savePlan>;
    drop(): ReturnType<typeof saver.drop>;
    goto(
      taskId: string,
    ):
      | ReturnType<typeof jujutsu.navigate.to>
      | Promise<Err<"Task doesn't exist">>;
  };
}

export class PlanningLibrary {
  private persistence;
  constructor(private jujutsu: ReturnType<(typeof Jujutsu)["cwd"]>) {
    const loader = new Loader(jujutsu);
    const saver = new Saver(jujutsu, loader);
    this.persistence = {
      loader,
      saver,
    };
  }

  async project(): Promise<
    | Ok<ReturnType<typeof createProject>>
    | Ok<null>
    | Err<`${"VCS" | "Structure"} Error: ${string}`>
  >;
  async project(options: {
    new: boolean;
  }): Promise<
    | Ok<ReturnType<typeof createProject>>
    | Err<`${"VCS" | "Structure"} Error: ${string}`>
  >;
  async project(options?: {
    new?: boolean;
  }): Promise<
    | Ok<ReturnType<typeof createProject>>
    | Ok<null>
    | Err<`${"VCS" | "Structure"} Error: ${string}`>
  > {
    if (options?.new) {
      return Ok(
        createProject(
          {
            tag: generateTag(),
            new: true,
            tasks: [
              {
                constraints: [],
                intent: "",
                objectives: [],
                scope: "",
                title: "",
                completed: false,
                type: "chore",
              },
            ],
          },
          this.persistence.saver,
          this.jujutsu,
        ),
      );
    }
    const plan = await this.persistence.loader.loadPlan();
    if (plan.err) {
      switch (plan.err) {
        // VCS should not fail
        case "VCS Error: Command failed":
        case "VCS Error: Unexpected commit format":
        case "VCS Error: Command non zero exit":
        case "VCS Error: No current commit found in repository":

        // Structure should not be corrupted if present.
        case "Structure Error: There must be at least one task":
          return plan;

        // Parse errors on load indicate inability to detect current structure
        // or that it doesn't exist
        case "Parse Error: Invalid commit type":
        case "Parse Error: Task commit title exceeds maximum length":
        case "Parse Error: Invalid header format":
        case "Parse Error: Invalid constraint format":
        case "Parse Error: Invalid objective format":
          return Ok(null);
      }
    }

    // Ensure plan.ok exists before creating project
    if (!plan.ok) {
      return Ok(null);
    }

    const tag = plan.ok.tasks[0].tag;
    return Ok(
      createProject({ tag, ...plan.ok }, this.persistence.saver, this.jujutsu),
    );
  }
}
