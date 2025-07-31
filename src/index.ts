#!/usr/bin/env -S yarn tsx

import { cwd } from "node:process";
import { FastMCP } from "fastmcp";
import { z } from "zod";
import {
	getCurrentCommit,
	JujutsuError,
	updateCommitDescription,
} from "./jujutsu.js";
import { ParseError, parseCommit } from "./parser.js";
import { derivePlanState, deriveToolResponse } from "./state.js";
import type { CommitPlan, TaskNode, ToolResponse } from "./types.js";

const server = new FastMCP({
	name: "commit planner",
	version: "0.0.1",
	instructions: "Structured commit planning with jujutsu integration",
});

// Helper function to handle jujutsu errors
function handleJujutsuError(error: unknown): string {
	if (error instanceof JujutsuError) {
		return `CRITICAL: Jujutsu command failed - ${error.message}. All tools non-functional until jujutsu is resolved.`;
	}
	throw error;
}

// Helper function to format tool response for FastMCP
function formatToolResponse(response: ToolResponse): string {
	const parts = [
		`Status: ${response.status}`,
		`Action: ${response.action_taken}`,
		`Phase: ${response.current_state.phase}`,
		`Tasks: ${response.current_state.completed_tasks}/${response.current_state.total_tasks}`,
	];

	if (response.next_actions.recommended.length > 0) {
		parts.push(`Recommended: ${response.next_actions.recommended.join(", ")}`);
	}

	if (response.next_actions.blocked.length > 0) {
		parts.push(`Blocked: ${response.next_actions.blocked.join(", ")}`);
	}

	if (response.alignment_check) {
		parts.push(`Question: ${response.alignment_check.question}`);
	}

	if (response.raw_commit_content) {
		parts.push(`Raw commit:\n${response.raw_commit_content}`);
	}

	return parts.join("\n");
}

// Helper function to get current commit and derive state
async function getCurrentState(): Promise<{
	commitContent: string;
	state: ReturnType<typeof derivePlanState>;
}> {
	try {
		const commitContent = await getCurrentCommit();
		const state = derivePlanState(commitContent);
		return { commitContent, state };
	} catch (error) {
		if (error instanceof JujutsuError) {
			throw error;
		}
		// Handle empty commits
		const state = derivePlanState("");
		return { commitContent: "", state };
	}
}

// Helper function to find task by ID
function findTaskById(tasks: TaskNode[], taskId: string): TaskNode | null {
	for (const task of tasks) {
		if (task.id === taskId) {
			return task;
		}
		const found = findTaskById(task.children, taskId);
		if (found) {
			return found;
		}
	}
	return null;
}

// Helper function to update task completion recursively
function updateTaskCompletion(
	tasks: TaskNode[],
	taskId: string,
	completed: boolean,
): boolean {
	for (const task of tasks) {
		if (task.id === taskId) {
			task.completed = completed;
			return true;
		}
		if (updateTaskCompletion(task.children, taskId, completed)) {
			// Update parent completion based on children
			task.completed = task.children.every((child) => child.completed);
			return true;
		}
	}
	return false;
}

// Helper function to serialize commit plan back to string
function serializeCommitPlan(plan: CommitPlan): string {
	let result = "";

	// Header
	const breaking = plan.header.breaking ? "!" : "";
	const scope = plan.header.scope ? `(${plan.header.scope})` : "";
	result += `${plan.header.type}${scope}${breaking}: ${plan.header.summary}\n\n`;

	// Description
	if (plan.description) {
		result += `${plan.description}\n\n`;
	}

	// Constraints
	if (plan.constraints.length > 0) {
		result += "Constraints:\n";
		for (const constraint of plan.constraints) {
			result += `- ${constraint}\n`;
		}
		result += "\n";
	} else {
		result += "Constraints: none\n\n";
	}

	// Tasks
	if (plan.tasks.length > 0) {
		const tasksComplete = plan.metadata.isComplete ? "X" : " ";
		result += `Tasks [${tasksComplete}]:\n`;
		result += serializeTasks(plan.tasks, 0);
	}

	return result.trim();
}

function serializeTasks(tasks: TaskNode[], level: number): string {
	let result = "";
	const indent = "  ".repeat(level);

	for (const task of tasks) {
		const checkbox = task.completed ? "x" : " ";
		const details = task.details ? `: ${task.details}` : "";
		result += `${indent}- [${checkbox}] ${task.summary}${details}\n`;

		if (task.children.length > 0) {
			result += serializeTasks(task.children, level + 1);
		}
	}

	return result;
}

// 1. start_planning - Initialize new structured commit plan
server.addTool({
	name: "start_planning",
	description: "Initialize new structured commit plan",
	parameters: z.object({
		type: z.enum([
			"feat",
			"fix",
			"refactor",
			"build",
			"chore",
			"docs",
			"lint",
			"infra",
			"spec",
		]),
		scope: z.string().optional(),
		summary: z.string().min(1).max(120),
		breaking: z.boolean().default(false),
	}),
	execute: async (args) => {
		try {
			// Create initial commit structure
			const breaking = args.breaking ? "!" : "";
			const scope = args.scope ? `(${args.scope.toLowerCase()})` : "";
			const header = `${args.type}${scope}${breaking}: ${args.summary}`;

			const initialCommit = `${header}\n\nConstraints: none\n\nTasks [ ]:\n`;

			await updateCommitDescription(initialCommit);

			const { commitContent, state } = await getCurrentState();
			const response = deriveToolResponse(
				state,
				"start_planning",
				`Created new structured commit plan: ${header}`,
				commitContent,
			);
			return formatToolResponse(response);
		} catch (error) {
			return handleJujutsuError(error);
		}
	},
});

// 2. get_plan - Read and parse current commit structure
server.addTool({
	name: "get_plan",
	description: "Read and parse current commit structure",
	parameters: z.object({}),
	execute: async () => {
		try {
			const { commitContent, state } = await getCurrentState();

			// Check if commit is malformed
			if (commitContent && state.phase === "uninitialized") {
				return `Error: Found malformed commit that cannot be parsed\nRecommended: Reformat commit to structured format\nRaw commit:\n${commitContent}`;
			}

			const response = deriveToolResponse(
				state,
				"get_plan",
				state.phase === "uninitialized"
					? "No structured commit found"
					: "Successfully parsed current commit structure",
				commitContent,
			);
			return formatToolResponse(response);
		} catch (error) {
			return handleJujutsuError(error);
		}
	},
});

// 3. update_goal - Modify header section (type/scope/summary)
server.addTool({
	name: "update_goal",
	description: "Modify header section (type/scope/summary)",
	parameters: z.object({
		type: z
			.enum([
				"feat",
				"fix",
				"refactor",
				"build",
				"chore",
				"docs",
				"lint",
				"infra",
				"spec",
			])
			.optional(),
		scope: z.string().optional(),
		summary: z.string().min(1).max(120).optional(),
		breaking: z.boolean().optional(),
	}),
	execute: async (args) => {
		try {
			const { commitContent } = await getCurrentState();

			if (!commitContent) {
				return "Error: Cannot update goal - no commit found. Use start_planning first.";
			}

			const parsed = parseCommit(commitContent);

			// Update header fields
			if (args.type !== undefined) parsed.header.type = args.type;
			if (args.scope !== undefined)
				parsed.header.scope = args.scope?.toLowerCase();
			if (args.summary !== undefined) parsed.header.summary = args.summary;
			if (args.breaking !== undefined) parsed.header.breaking = args.breaking;

			const updatedCommit = serializeCommitPlan(parsed);
			await updateCommitDescription(updatedCommit);

			const { state } = await getCurrentState();
			const response = deriveToolResponse(
				state,
				"update_goal",
				"Updated commit header successfully",
			);
			return formatToolResponse(response);
		} catch (error) {
			if (error instanceof ParseError) {
				return `Error: Cannot update goal - commit format error: ${error.message}`;
			}
			return handleJujutsuError(error);
		}
	},
});

// 4. update_description - Modify long description section
server.addTool({
	name: "update_description",
	description: "Modify long description section",
	parameters: z.object({
		description: z.string(),
	}),
	execute: async (args) => {
		try {
			const { commitContent } = await getCurrentState();

			if (!commitContent) {
				return "Error: Cannot update description - no commit found. Use start_planning first.";
			}

			const parsed = parseCommit(commitContent);
			parsed.description = args.description;

			const updatedCommit = serializeCommitPlan(parsed);
			await updateCommitDescription(updatedCommit);

			const { state } = await getCurrentState();
			const response = deriveToolResponse(
				state,
				"update_description",
				"Updated commit description successfully",
			);
			return formatToolResponse(response);
		} catch (error) {
			if (error instanceof ParseError) {
				return `Error: Cannot update description - commit format error: ${error.message}`;
			}
			return handleJujutsuError(error);
		}
	},
});

// 5. get_constraints - Read current constraints
server.addTool({
	name: "get_constraints",
	description: "Read current constraints",
	parameters: z.object({}),
	execute: async () => {
		try {
			const { commitContent, state } = await getCurrentState();

			if (!commitContent || state.phase === "uninitialized") {
				return "No constraints found - no structured commit";
			}

			const parsed = parseCommit(commitContent);
			const constraintsText =
				parsed.constraints.length > 0
					? parsed.constraints.join("\n- ")
					: "none";

			return `Current constraints:\n- ${constraintsText}`;
		} catch (error) {
			if (error instanceof ParseError) {
				return `Error: Cannot read constraints - commit format error: ${error.message}`;
			}
			return handleJujutsuError(error);
		}
	},
});

// 6. set_constraints - Set/update constraints list
server.addTool({
	name: "set_constraints",
	description: "Set/update constraints list",
	parameters: z.object({
		constraints: z.array(z.string()),
	}),
	execute: async (args) => {
		try {
			const { commitContent } = await getCurrentState();

			if (!commitContent) {
				return "Error: Cannot set constraints - no commit found. Use start_planning first.";
			}

			const parsed = parseCommit(commitContent);
			parsed.constraints = args.constraints;

			const updatedCommit = serializeCommitPlan(parsed);
			await updateCommitDescription(updatedCommit);

			return `Updated constraints: ${args.constraints.length} constraints set`;
		} catch (error) {
			if (error instanceof ParseError) {
				return `Error: Cannot set constraints - commit format error: ${error.message}`;
			}
			return handleJujutsuError(error);
		}
	},
});

// 7. get_tasks - Read current task hierarchy
server.addTool({
	name: "get_tasks",
	description: "Read current task hierarchy",
	parameters: z.object({}),
	execute: async () => {
		try {
			const { commitContent, state } = await getCurrentState();

			if (!commitContent || state.phase === "uninitialized") {
				return "No tasks found - no structured commit";
			}

			const parsed = parseCommit(commitContent);
			return `Found ${parsed.metadata.totalTasks} tasks (${parsed.metadata.completedTasks} completed)`;
		} catch (error) {
			if (error instanceof ParseError) {
				return `Error: Cannot read tasks - commit format error: ${error.message}`;
			}
			return handleJujutsuError(error);
		}
	},
});

// 8. set_tasks - Define/update task hierarchy
server.addTool({
	name: "set_tasks",
	description: "Define/update task hierarchy",
	parameters: z.object({
		tasks: z.array(
			z.object({
				summary: z.string(),
				details: z.string().default(""),
				level: z.number().min(0).max(3),
				completed: z.boolean().default(false),
			}),
		),
	}),
	execute: async (args) => {
		try {
			const { commitContent } = await getCurrentState();

			if (!commitContent) {
				return "Error: Cannot set tasks - no commit found. Use start_planning first.";
			}

			const parsed = parseCommit(commitContent);

			// Convert flat task list to hierarchical structure
			const taskNodes: TaskNode[] = [];
			const taskStack: TaskNode[] = [];

			for (const taskInput of args.tasks) {
				const id = taskInput.summary
					.toLowerCase()
					.replace(/[^a-z0-9\s-]/g, "")
					.replace(/\s+/g, "-")
					.replace(/-+/g, "-")
					.replace(/^-|-$/g, "");

				const task: TaskNode = {
					id,
					summary: taskInput.summary,
					details: taskInput.details,
					completed: taskInput.completed,
					children: [],
					level: taskInput.level,
					parent_id:
						taskInput.level > 0
							? taskStack[taskInput.level - 1]?.id
							: undefined,
				};

				// Adjust stack to current level
				taskStack.splice(taskInput.level);
				taskStack.push(task);

				if (taskInput.level === 0) {
					taskNodes.push(task);
				} else {
					const parent = taskStack[taskInput.level - 1];
					if (parent) {
						parent.children.push(task);
					}
				}
			}

			parsed.tasks = taskNodes;

			// Recalculate metadata
			const totalTasks = args.tasks.length;
			const completedTasks = args.tasks.filter((t) => t.completed).length;
			parsed.metadata = {
				totalTasks,
				completedTasks,
				isComplete: totalTasks > 0 && completedTasks === totalTasks,
			};

			const updatedCommit = serializeCommitPlan(parsed);
			await updateCommitDescription(updatedCommit);

			return `Updated task hierarchy: ${totalTasks} tasks defined`;
		} catch (error) {
			if (error instanceof ParseError) {
				return `Error: Cannot set tasks - commit format error: ${error.message}`;
			}
			return handleJujutsuError(error);
		}
	},
});

// 9. mark_task - Toggle task completion status
server.addTool({
	name: "mark_task",
	description: "Toggle task completion status",
	parameters: z.object({
		task_id: z.string(),
		completed: z.boolean().optional(),
	}),
	execute: async (args) => {
		try {
			const { commitContent } = await getCurrentState();

			if (!commitContent) {
				return "Error: Cannot mark task - no commit found. Use start_planning first.";
			}

			const parsed = parseCommit(commitContent);
			const task = findTaskById(parsed.tasks, args.task_id);

			if (!task) {
				return `Error: Task not found: ${args.task_id}`;
			}

			const newCompleted = args.completed ?? !task.completed;
			updateTaskCompletion(parsed.tasks, args.task_id, newCompleted);

			// Recalculate metadata
			function countTasks(tasks: TaskNode[]): {
				total: number;
				completed: number;
			} {
				let total = 0;
				let completed = 0;

				for (const t of tasks) {
					total++;
					if (t.completed) completed++;

					const childCounts = countTasks(t.children);
					total += childCounts.total;
					completed += childCounts.completed;
				}

				return { total, completed };
			}

			const { total, completed } = countTasks(parsed.tasks);
			parsed.metadata = {
				totalTasks: total,
				completedTasks: completed,
				isComplete: total > 0 && completed === total,
			};

			const updatedCommit = serializeCommitPlan(parsed);
			await updateCommitDescription(updatedCommit);

			return `Task ${args.task_id} marked as ${newCompleted ? "completed" : "incomplete"}`;
		} catch (error) {
			if (error instanceof ParseError) {
				return `Error: Cannot mark task - commit format error: ${error.message}`;
			}
			return handleJujutsuError(error);
		}
	},
});

// 10. finish_job - Mark entire scope as complete
server.addTool({
	name: "finish_job",
	description: "Mark entire scope as complete (requires all tasks done)",
	parameters: z.object({}),
	execute: async () => {
		try {
			const { commitContent, state } = await getCurrentState();

			if (!commitContent || state.phase === "uninitialized") {
				return "Error: Cannot finish job - no structured commit found";
			}

			if (state.total_tasks === 0) {
				return "Error: Cannot finish job - no tasks defined";
			}

			if (state.completed_tasks !== state.total_tasks) {
				return `Error: Cannot finish job - ${state.total_tasks - state.completed_tasks} tasks remaining`;
			}

			const parsed = parseCommit(commitContent);
			parsed.metadata.isComplete = true;

			const updatedCommit = serializeCommitPlan(parsed);
			await updateCommitDescription(updatedCommit);

			return "Job completed successfully - all tasks finished";
		} catch (error) {
			if (error instanceof ParseError) {
				return `Error: Cannot finish job - commit format error: ${error.message}`;
			}
			return handleJujutsuError(error);
		}
	},
});

// 11. unfinish_job - Mark scope as incomplete
server.addTool({
	name: "unfinish_job",
	description: "Mark scope as incomplete for continued work",
	parameters: z.object({}),
	execute: async () => {
		try {
			const { commitContent, state } = await getCurrentState();

			if (!commitContent || state.phase === "uninitialized") {
				return "Error: Cannot unfinish job - no structured commit found";
			}

			const parsed = parseCommit(commitContent);
			parsed.metadata.isComplete = false;

			const updatedCommit = serializeCommitPlan(parsed);
			await updateCommitDescription(updatedCommit);

			return "Job marked as incomplete - ready for continued work";
		} catch (error) {
			if (error instanceof ParseError) {
				return `Error: Cannot unfinish job - commit format error: ${error.message}`;
			}
			return handleJujutsuError(error);
		}
	},
});

// 12. verify_plan - Migration tool and final alignment check
server.addTool({
	name: "verify_plan",
	description: "Migration tool and final alignment check",
	parameters: z.object({}),
	execute: async () => {
		try {
			const { commitContent, state } = await getCurrentState();

			if (!commitContent) {
				return "No commit found - ready to start planning";
			}

			// Try to parse the commit
			try {
				parseCommit(commitContent); // Just validate, don't use result
				return "Commit format is valid and properly structured";
			} catch (error) {
				if (error instanceof ParseError) {
					// Return malformed commit with sampling prompt
					return `Current commit message does not follow structured format.

CURRENT MESSAGE:
${commitContent}

Please reformat into this structure:
type(scope)!: summary

long description

Constraints:
- Do not: [constraint]

Tasks [ ]:
- [ ] summary: details

Choose: A) Reformat this commit, or B) Work with current message as read-only context`;
				}
				throw error;
			}
		} catch (error) {
			return handleJujutsuError(error);
		}
	},
});

server.start({
	transportType: "stdio",
});

// Move to actual execution location
process.chdir(process.env.INIT_CWD ?? cwd());
