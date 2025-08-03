import { Err, Ok } from "./result";

export class PlanningLibrary {
	private plan: {
		plan_key: [string, string];
		intent?: string;
		objectives?: string[];
		constraints?: string[];
		tasks: Array<{
			task_key: string;
			intent?: string;
			objectives?: string[];
			constraints?: string[];
			completed: boolean;
		}>;
	};

	constructor({ plan_key }: { plan_key: [string, string] }) {
		this.plan = {
			plan_key,
			intent: undefined,
			objectives: undefined,
			constraints: undefined,
			tasks: [],
		};
	}

	update_plan({
		intent,
		objectives,
		constraints,
	}: {
		intent?: string;
		objectives?: string[];
		constraints?: string[];
	}): Ok<void> {
		if (intent !== undefined) {
			this.plan.intent = intent;
		}
		if (objectives !== undefined) {
			this.plan.objectives = objectives;
		}
		if (constraints !== undefined) {
			this.plan.constraints = constraints;
		}
		return Ok(undefined);
	}

	add_task({
		task_key,
		intent,
		objectives,
		constraints,
	}: {
		task_key: string;
		intent?: string;
		objectives?: string[];
		constraints?: string[];
	}): Ok<string> | Err<"task_key_exists"> {
		// Check if task_key already exists
		if (this.plan.tasks.some((task) => task.task_key === task_key)) {
			return Err("task_key_exists");
		}

		this.plan.tasks.push({
			task_key,
			intent,
			objectives,
			constraints,
			completed: false,
		});

		return Ok(task_key);
	}

	update_task({
		task_key,
		intent,
		objectives,
		constraints,
	}: {
		task_key: string;
		intent?: string;
		objectives?: string[];
		constraints?: string[];
	}): Ok<void> | Err<"task_not_found"> {
		const task = this.plan.tasks.find((t) => t.task_key === task_key);

		if (!task) {
			return Err("task_not_found");
		}

		if (intent !== undefined) {
			task.intent = intent;
		}
		if (objectives !== undefined) {
			task.objectives = objectives;
		}
		if (constraints !== undefined) {
			task.constraints = constraints;
		}

		return Ok(undefined);
	}

	remove_task({
		task_key,
	}: {
		task_key: string;
	}): Ok<void> | Err<"task_not_found"> {
		const taskIndex = this.plan.tasks.findIndex((t) => t.task_key === task_key);

		if (taskIndex === -1) {
			return Err("task_not_found");
		}

		this.plan.tasks.splice(taskIndex, 1);
		return Ok(undefined);
	}

	mark_task_complete({
		task_key,
		completed,
	}: {
		task_key: string;
		completed: boolean;
	}): Ok<void> | Err<"task_not_found"> {
		const task = this.plan.tasks.find((t) => t.task_key === task_key);

		if (!task) {
			return Err("task_not_found");
		}

		task.completed = completed;
		return Ok(undefined);
	}

	get_task_status({
		task_key,
	}: {
		task_key: string;
	}): Ok<boolean> | Err<"task_not_found"> {
		const task = this.plan.tasks.find((t) => t.task_key === task_key);

		if (!task) {
			return Err("task_not_found");
		}

		return Ok(task.completed);
	}

	get_plan(): Ok<{
		plan_key: [string, string];
		intent?: string;
		objectives?: string[];
		constraints?: string[];
		tasks: Array<{
			task_key: string;
			intent?: string;
			objectives?: string[];
			constraints?: string[];
			completed: boolean;
		}>;
	}> {
		return Ok({
			plan_key: this.plan.plan_key,
			intent: this.plan.intent,
			objectives: this.plan.objectives,
			constraints: this.plan.constraints,
			tasks: this.plan.tasks,
		});
	}

	get_task({ task_key }: { task_key: string }):
		| Ok<{
				task_key: string;
				intent?: string;
				objectives?: string[];
				constraints?: string[];
				completed: boolean;
		  }>
		| Err<"task_not_found"> {
		const task = this.plan.tasks.find((t) => t.task_key === task_key);

		if (!task) {
			return Err("task_not_found");
		}

		return Ok(task);
	}

	validate_plan_complete(): Ok<void> | Err<"validation_failed", string[]> {
		const errors: string[] = [];

		// Check plan fields
		if (this.plan.intent === undefined || this.plan.intent === null) {
			errors.push("Plan intent is required");
		}
		if (this.plan.objectives === undefined || this.plan.objectives === null) {
			errors.push("Plan objectives are required");
		}
		if (this.plan.constraints === undefined || this.plan.constraints === null) {
			errors.push("Plan constraints are required");
		}

		// Check tasks
		if (this.plan.tasks.length === 0) {
			errors.push("At least one task is required");
		}

		for (const task of this.plan.tasks) {
			if (task.intent === undefined || task.intent === null) {
				errors.push(`Task '${task.task_key}' intent is required`);
			}
			if (task.objectives === undefined || task.objectives === null) {
				errors.push(`Task '${task.task_key}' objectives are required`);
			}
			if (task.constraints === undefined || task.constraints === null) {
				errors.push(`Task '${task.task_key}' constraints are required`);
			}
		}

		if (errors.length > 0) {
			return Err("validation_failed", errors);
		}

		return Ok(undefined);
	}
}
