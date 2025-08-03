import { Loader, type LoadedPlanData } from "./loader";
import { Saver, type SavingPlanData } from "./saver";

export type PlanPersistence = {
  readonly type: string;
  load(): Promise<Ok<LoadedPlanData> | Err<string>>;
  save(plan: SavingPlanData): Promise<Ok<void> | Err<string>>;
};

// Re-export the data types for external use
export type { LoadedPlanData, SavingPlanData };

export type PersistenceConfig = {
  repositoryPath?: string;
  author?: {
    name: string;
    email: string;
  };
  [key: string]: unknown;
};

export class JujutsuPlanPersistence implements PlanPersistence {
  readonly type = "jujutsu";
  private loader: Loader;
  private saver: Saver;

  constructor(
    private jujutsu: ReturnType<typeof import("../jujutsu").Jujutsu.cwd>,
  ) {
    this.loader = new Loader(this.jujutsu);
    this.saver = new Saver(this.jujutsu, this.loader);
  }

  async save(plan: SavingPlanData): Promise<Ok<void> | Err<string>> {
    return await this.saver.savePlan(plan);
  }

  async load(): Promise<Ok<LoadedPlanData> | Err<string>> {
    return await this.loader.loadPlan();
  }
}
