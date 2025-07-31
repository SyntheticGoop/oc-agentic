export type CommitType =
	| "feat"
	| "fix"
	| "refactor"
	| "build"
	| "chore"
	| "docs"
	| "lint"
	| "infra"
	| "spec";

export type TaskNode = {
	id: string;
	summary: string;
	details: string;
	completed: boolean;
	children: TaskNode[];
	level: number;
	parent_id?: string;
};

export type CommitPlan = {
	header: {
		type: CommitType;
		scope?: string;
		breaking: boolean;
		summary: string;
	};
	description: string;
	constraints: string[];
	tasks: TaskNode[];
	metadata: {
		totalTasks: number;
		completedTasks: number;
		isComplete: boolean;
	};
};

export type PlanState = {
	phase: "uninitialized" | "planning" | "executing" | "complete";
	has_goal: boolean;
	has_description: boolean;
	has_constraints: boolean;
	has_tasks: boolean;
	current_task_id?: string;
	total_tasks: number;
	completed_tasks: number;
};

export type ToolResponse = {
	status: "success" | "error";
	action_taken: string;
	current_state: PlanState;
	next_actions: {
		recommended: string[];
		blocked: string[];
		available: string[];
	};
	alignment_check?: {
		question: string;
		required_confirmation: boolean;
	};
	raw_commit_content?: string;
};
