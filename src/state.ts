import { ParseError, parseCommit } from "./parser.js";
import type { CommitPlan, PlanState, ToolResponse } from "./types.js";

export function derivePlanState(commitContent: string): PlanState {
	// Handle empty commit
	if (!commitContent || commitContent.trim().length === 0) {
		return {
			phase: "uninitialized",
			has_goal: false,
			has_description: false,
			has_constraints: false,
			has_tasks: false,
			current_task_id: undefined,
			total_tasks: 0,
			completed_tasks: 0,
		};
	}

	try {
		// Parse the commit using our existing parser
		const parsed = parseCommit(commitContent);

		// Determine phase based on content and completion
		const phase = determinePhase(parsed);

		// Find current task (first incomplete task)
		const currentTaskId = findCurrentTask(parsed);

		return {
			phase,
			has_goal: true, // If we can parse it, it has a valid header
			has_description: parsed.description.length > 0,
			has_constraints: parsed.constraints.length > 0,
			has_tasks: parsed.tasks.length > 0,
			current_task_id: currentTaskId,
			total_tasks: parsed.metadata.totalTasks,
			completed_tasks: parsed.metadata.completedTasks,
		};
	} catch (error) {
		// Malformed commit - can't parse properly
		if (error instanceof ParseError) {
			return {
				phase: "uninitialized",
				has_goal: false,
				has_description: false,
				has_constraints: false,
				has_tasks: false,
				current_task_id: undefined,
				total_tasks: 0,
				completed_tasks: 0,
			};
		}
		throw error;
	}
}

function determinePhase(parsed: CommitPlan): PlanState["phase"] {
	// If no tasks, we're still planning
	if (parsed.tasks.length === 0) {
		return "planning";
	}

	// If all tasks complete and marked as complete, we're done
	if (parsed.metadata.isComplete) {
		return "complete";
	}

	// If we have tasks but some are incomplete, we're executing
	if (parsed.metadata.completedTasks > 0) {
		return "executing";
	}

	// Have tasks but none started yet, still planning
	return "planning";
}

function findCurrentTask(parsed: CommitPlan): string | undefined {
	// Find the first incomplete task (depth-first search)
	function findIncompleteTask(tasks: typeof parsed.tasks): string | undefined {
		for (const task of tasks) {
			if (!task.completed) {
				return task.id;
			}
			// Check children
			const childResult = findIncompleteTask(task.children);
			if (childResult) {
				return childResult;
			}
		}
		return undefined;
	}

	return findIncompleteTask(parsed.tasks);
}

export function deriveNextActions(state: PlanState): {
	recommended: string[];
	blocked: string[];
	available: string[];
} {
	const recommended: string[] = [];
	const blocked: string[] = [];
	const available: string[] = [];

	// Always available actions
	available.push("get_plan", "verify_plan");

	if (state.phase === "uninitialized") {
		recommended.push("start_planning");
		available.push("start_planning");

		blocked.push(
			"update_goal",
			"update_description",
			"set_constraints",
			"set_tasks",
			"mark_task",
			"finish_job",
			"unfinish_job",
		);
	} else {
		// Has valid structure
		available.push(
			"update_goal",
			"update_description",
			"get_constraints",
			"set_constraints",
			"get_tasks",
			"set_tasks",
		);

		if (state.has_tasks) {
			available.push("mark_task");

			if (state.phase === "planning" && state.completed_tasks === 0) {
				recommended.push("mark_task");
			}

			if (
				state.total_tasks > 0 &&
				state.completed_tasks === state.total_tasks
			) {
				if (state.phase !== "complete") {
					recommended.push("finish_job");
				}
				available.push("finish_job");
			} else {
				blocked.push("finish_job");
			}
			if (state.phase === "complete") {
				available.push("unfinish_job");
			}
		} else {
			blocked.push("mark_task", "finish_job", "unfinish_job");
			recommended.push("set_tasks");
		}

		// Phase-specific recommendations
		if (state.phase === "planning") {
			if (!state.has_description) {
				recommended.push("update_description");
			}
			if (!state.has_tasks) {
				recommended.push("set_tasks");
			}
		}
	}

	return { recommended, blocked, available };
}

export function deriveToolResponse(
	state: PlanState,
	action: string,
	actionResult: string,
	commitContent?: string,
): ToolResponse {
	const nextActions = deriveNextActions(state);
	const alignmentCheck = deriveAlignmentCheck(state, action);

	return {
		status: "success",
		action_taken: actionResult,
		current_state: state,
		next_actions: nextActions,
		alignment_check: alignmentCheck,
		raw_commit_content: commitContent,
	};
}

export function deriveAlignmentCheck(
	state: PlanState,
	lastAction: string,
): ToolResponse["alignment_check"] {
	// Alignment checks for specific scenarios
	if (state.phase === "uninitialized" && lastAction === "get_plan") {
		return {
			question:
				"No structured commit format found. Would you like to create a structured plan?",
			required_confirmation: false,
		};
	}

	if (state.phase === "complete" && lastAction === "finish_job") {
		return {
			question:
				"All tasks completed successfully. Ready to start new commit for next phase?",
			required_confirmation: false,
		};
	}

	if (
		state.has_tasks &&
		state.completed_tasks === state.total_tasks &&
		state.phase !== "complete"
	) {
		return {
			question:
				"All individual tasks complete. Ready to finalize this commit scope?",
			required_confirmation: false,
		};
	}

	return undefined;
}
