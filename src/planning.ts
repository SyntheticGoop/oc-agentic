import type {
	LoadedPlanData,
	PlanPersistence,
	SavingPlanData,
} from "./persistence/persistence";
import type { ValidatedCommitType } from "./persistence/loader";
import { Err, Ok } from "./result";

export class PlanningLibrary {
	private persistence: PlanPersistence;

	constructor({ persistence }: { persistence: PlanPersistence }) {
		this.persistence = persistence;
	}

	private convertLoadedToSaving(loaded: LoadedPlanData): SavingPlanData {
		// Extract type from first task (LoadedPlanData doesn't have a top-level type)
		const firstTask = loaded.tasks[0];
		if (!firstTask) {
			throw new Error("Cannot convert plan with no tasks");
		}

		return {
			scope: loaded.scope,
			intent: loaded.intent,
			title: loaded.title,
			objectives: loaded.objectives,
			constraints: loaded.constraints,
			tasks: loaded.tasks as [typeof firstTask, ...typeof loaded.tasks],
		};
	}

	async update_plan({
		intent,
		objectives,
		constraints,
	}: {
		intent?: string;
		objectives?: string[];
		constraints?: string[];
	}): Promise<Ok<void> | Err<string>> {
		// Load fresh plan data
		const planResult = await this.persistence.load();
		if (planResult.err) {
			return Err(planResult.err);
		}
		const loadedPlan = planResult.ok;
		if (!loadedPlan) {
			return Err("Failed to load plan data");
		}

		// Convert to saving format
		const savingPlan = this.convertLoadedToSaving(loadedPlan);

		// Update plan data
		if (intent !== undefined) {
			savingPlan.intent = intent;
			savingPlan.title = intent.toLowerCase();
		}
		if (objectives !== undefined) {
			savingPlan.objectives = objectives;
		}
		if (constraints !== undefined) {
			savingPlan.constraints = constraints;
		}

		// Auto-persist
		const saveResult = await this.persistence.save(savingPlan);
		if (saveResult.err) {
			return Err(saveResult.err);
		}

		return Ok(undefined);
	}

	async add_task({
		task_key,
		type,
		scope,
		title,
		intent,
		objectives,
		constraints,
	}: {
		task_key?: string;
		type: ValidatedCommitType;
		scope: string | null;
		title: string;
		intent: string;
		objectives: string[];
		constraints: string[];
	}): Promise<Ok<string> | Err<"task_key_exists" | string>> {
		// Load fresh plan data
		const planResult = await this.persistence.load();
		if (planResult.err) {
			return Err(planResult.err);
		}
		const loadedPlan = planResult.ok;
		if (!loadedPlan) {
			return Err("Failed to load plan data");
		}

		// Check if task_key already exists
		if (
			task_key &&
			loadedPlan.tasks.some((task) => task.task_key === task_key)
		) {
			return Err("task_key_exists");
		}

		// Convert to saving format
		const savingPlan = this.convertLoadedToSaving(loadedPlan);

		// Add new task
		const newTask = {
			task_key,
			type,
			scope,
			title,
			intent,
			objectives,
			constraints,
			completed: false,
		};

		savingPlan.tasks.push(newTask);

		// Auto-persist
		const saveResult = await this.persistence.save(savingPlan);
		if (saveResult.err) {
			return Err(saveResult.err);
		}

		return Ok(task_key || "generated_key");
	}

	async update_task({
		task_key,
		intent,
		objectives,
		constraints,
	}: {
		task_key: string;
		intent?: string;
		objectives?: string[];
		constraints?: string[];
	}): Promise<Ok<void> | Err<"task_not_found" | string>> {
		// Load fresh plan data
		const planResult = await this.persistence.load();
		if (planResult.err) {
			return Err(planResult.err);
		}
		const loadedPlan = planResult.ok;
		if (!loadedPlan) {
			return Err("Failed to load plan data");
		}

		const task = loadedPlan.tasks.find((t) => t.task_key === task_key);

		if (!task) {
			return Err("task_not_found");
		}

		// Convert to saving format
		const savingPlan = this.convertLoadedToSaving(loadedPlan);
		const savingTask = savingPlan.tasks.find((t) => t.task_key === task_key);

		if (!savingTask) {
			return Err("task_not_found");
		}

		// Update task properties
		if (intent !== undefined) {
			savingTask.intent = intent;
			savingTask.title = intent.toLowerCase();
		}
		if (objectives !== undefined) {
			savingTask.objectives = objectives;
		}
		if (constraints !== undefined) {
			savingTask.constraints = constraints;
		}

		// Auto-persist
		const saveResult = await this.persistence.save(savingPlan);
		if (saveResult.err) {
			return Err(saveResult.err);
		}

		return Ok(undefined);
	}

	async remove_task({
		task_key,
	}: {
		task_key: string;
	}): Promise<Ok<void> | Err<"task_not_found" | string>> {
		// Load fresh plan data
		const planResult = await this.persistence.load();
		if (planResult.err) {
			return Err(planResult.err);
		}
		const loadedPlan = planResult.ok;
		if (!loadedPlan) {
			return Err("Failed to load plan data");
		}

		const taskIndex = loadedPlan.tasks.findIndex(
			(t) => t.task_key === task_key,
		);

		if (taskIndex === -1) {
			return Err("task_not_found");
		}

		// Convert to saving format
		const savingPlan = this.convertLoadedToSaving(loadedPlan);
		const savingTaskIndex = savingPlan.tasks.findIndex(
			(t) => t.task_key === task_key,
		);

		if (savingTaskIndex === -1) {
			return Err("task_not_found");
		}

		// Remove task
		savingPlan.tasks.splice(savingTaskIndex, 1);

		// Auto-persist
		const saveResult = await this.persistence.save(savingPlan);
		if (saveResult.err) {
			return Err(saveResult.err);
		}

		return Ok(undefined);
	}

	async mark_task_complete({
		task_key,
		completed,
	}: {
		task_key: string;
		completed: boolean;
	}): Promise<Ok<void> | Err<"task_not_found" | string>> {
		// Load fresh plan data
		const planResult = await this.persistence.load();
		if (planResult.err) {
			return Err(planResult.err);
		}
		const loadedPlan = planResult.ok;
		if (!loadedPlan) {
			return Err("Failed to load plan data");
		}

		const task = loadedPlan.tasks.find((t) => t.task_key === task_key);

		if (!task) {
			return Err("task_not_found");
		}

		// Convert to saving format
		const savingPlan = this.convertLoadedToSaving(loadedPlan);
		const savingTask = savingPlan.tasks.find((t) => t.task_key === task_key);

		if (!savingTask) {
			return Err("task_not_found");
		}

		// Update completion status
		savingTask.completed = completed;

		// Auto-persist
		const saveResult = await this.persistence.save(savingPlan);
		if (saveResult.err) {
			return Err(saveResult.err);
		}

		return Ok(undefined);
	}

	async get_task_status({
		task_key,
	}: {
		task_key: string;
	}): Promise<Ok<boolean> | Err<"task_not_found" | string>> {
		// Load fresh plan data
		const planResult = await this.persistence.load();
		if (planResult.err) {
			return Err(planResult.err);
		}
		const loadedPlan = planResult.ok;
		if (!loadedPlan) {
			return Err("Failed to load plan data");
		}

		const task = loadedPlan.tasks.find((t) => t.task_key === task_key);

		if (!task) {
			return Err("task_not_found");
		}

		return Ok(task.completed);
	}

	async get_plan(): Promise<Ok<LoadedPlanData> | Err<string>> {
		// Load fresh plan data
		const planResult = await this.persistence.load();
		if (planResult.err) {
			return Err(planResult.err);
		}

		const plan = planResult.ok;
		if (!plan) {
			return Err("Failed to load plan data");
		}
		return Ok(plan);
	}

	async get_task({ task_key }: { task_key: string }): Promise<
		| Ok<{
				task_key: string;
				type: ValidatedCommitType;
				scope: string | null;
				title: string;
				intent: string;
				objectives: string[];
				constraints: string[];
				completed: boolean;
		  }>
		| Err<"task_not_found" | string>
	> {
		// Load fresh plan data
		const planResult = await this.persistence.load();
		if (planResult.err) {
			return Err(planResult.err);
		}
		const loadedPlan = planResult.ok;
		if (!loadedPlan) {
			return Err("Failed to load plan data");
		}

		const task = loadedPlan.tasks.find((t) => t.task_key === task_key);

		if (!task) {
			return Err("task_not_found");
		}

		return Ok(task);
	}

	async validate_plan_complete(): Promise<
		Ok<void> | Err<"validation_failed" | string, string[]>
	> {
		// Load fresh plan data
		const planResult = await this.persistence.load();
		if (planResult.err) {
			return Err(planResult.err);
		}
		const loadedPlan = planResult.ok;
		if (!loadedPlan) {
			return Err("Failed to load plan data");
		}

		const errors: string[] = [];

		// Check plan fields
		if (!loadedPlan.intent || loadedPlan.intent.trim() === "") {
			errors.push("Plan intent is required");
		}
		if (!loadedPlan.objectives || loadedPlan.objectives.length === 0) {
			errors.push("Plan objectives are required");
		}
		if (!loadedPlan.constraints || loadedPlan.constraints.length === 0) {
			errors.push("Plan constraints are required");
		}

		// Check tasks
		if (loadedPlan.tasks.length === 0) {
			errors.push("At least one task is required");
		}

		for (const task of loadedPlan.tasks) {
			if (!task.intent || task.intent.trim() === "") {
				errors.push(`Task '${task.task_key}' intent is required`);
			}
			if (!task.objectives || task.objectives.length === 0) {
				errors.push(`Task '${task.task_key}' objectives are required`);
			}
			if (!task.constraints || task.constraints.length === 0) {
				errors.push(`Task '${task.task_key}' constraints are required`);
			}
		}

		if (errors.length > 0) {
			return Err("validation_failed", errors);
		}

		return Ok(undefined);
	}
}
