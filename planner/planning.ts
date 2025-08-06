import type { Jujutsu } from "../src/jujutsu";
import { Err, Ok } from "../src/result";
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
    new: true;
  }): Promise<
    | Ok<ReturnType<typeof createProject>>
    | Err<`${"VCS" | "Structure"} Error: ${string}`>
  >;
  async project(options?: {
    new?: true;
  }): Promise<
    | Ok<ReturnType<typeof createProject>>
    | Ok<null>
    | Err<`${"VCS" | "Structure"} Error: ${string}`>
  > {
    const plan = await this.persistence.loader.loadPlan();
    if (options?.new) {
      return Ok(
        createProject(
          {
            constraints: [],
            intent: "",
            objectives: [],
            scope: "",
            title: "",
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
    if (plan.err) {
      switch (plan.err) {
        // VCS should not fail
        case "VCS Error: Command failed":
        case "VCS Error: Unexpected commit format":
        case "VCS Error: Command non zero exit":
        case "VCS Error: No current commit found in repository":

        // Structure should not be corrupted if present.
        case "Structure Error: Unexpected terminating header in task position":
        case "Structure Error: Invalid LONG format plan: insufficient commits":
        case "Structure Error: Invalid LONG format plan: expected end commit":
        case "Structure Error: Invalid LONG format plan: expected begin commit":
        case "Structure Error: Failed to find end commit":
        case "Structure Error: There must be at least one task":
          return plan;

        // Parse errors on load indicate inability to detect current structure
        // or that it doesn't exist
        case "Parse Error: Begin commit title exceeds maximum length":
        case "Parse Error: End commit title exceeds maximum length":
        case "Parse Error: Invalid commit type":
        case "Parse Error: Task commit title exceeds maximum length":
        case "Parse Error: Single task commit title exceeds maximum length":
        case "Parse Error: Invalid header format":
        case "Parse Error: Invalid constraint format":
        case "Parse Error: Invalid objective format":
          return Ok(null);
      }
    }

    return Ok(createProject(plan.ok, this.persistence.saver, this.jujutsu));
  }
}
