import type { Jujutsu } from "../src/jujutsu";
import { Err, Ok } from "../src/result";
import { generateTag } from "./crypto";
import { Loader } from "./persistence/loader";
import { Saver, type SavingPlanData } from "./persistence/saver";

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

      // Handle JSON serialization by intercepting toJSON method
      // This ensures JSON.stringify() operations return only task data
      if (p === "toJSON") {
        return () => ({
          tasks: target.tasks,
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
    new?: "current" | "auto";
  }): Promise<
    | Ok<ReturnType<typeof createProject>>
    | Err<`${"VCS" | "Structure"} Error: ${string}`>
  >;
  async project(options?: {
    new?: "current" | "auto";
  }): Promise<
    | Ok<ReturnType<typeof createProject>>
    | Ok<null>
    | Err<`${"VCS" | "Structure"} Error: ${string}`>
  > {
    if (options?.new) {
      // Handle both "auto" and "current" modes properly
      const newMode = options.new;

      return Ok(
        createProject(
          {
            tag: generateTag(),
            new: newMode, // Use the actual enum value passed in
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
