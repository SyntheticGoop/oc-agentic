#!/usr/bin/env -S yarn tsx
process.chdir(process.env.INIT_CWD ?? process.cwd());

import { FastMCP } from "fastmcp";
import { z } from "zod";
import { Jujutsu } from "../src/jujutsu";
import { Err } from "../src/result";
import type { SavingPlanData } from "./persistence/saver";
import { PlanningLibrary } from "./planning";

class PlanningLibraryQueue {
  private queue: Array<{
    // biome-ignore lint/suspicious/noExplicitAny: Generic type definition
    operation: (library: PlanningLibrary) => Promise<any>;
    // biome-ignore lint/suspicious/noExplicitAny: Generic type definition
    resolve: (value: any) => void;
    // biome-ignore lint/suspicious/noExplicitAny: Generic type definition
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private jj: ReturnType<typeof Jujutsu.cwd>;

  constructor(jujutsuInstance: ReturnType<typeof Jujutsu.cwd>) {
    this.jj = jujutsuInstance;
  }

  async enqueue<T>(
    operation: (library: PlanningLibrary) => Promise<T>,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        operation,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) throw Error("Invariant violation");
      const { operation, resolve, reject } = next;

      try {
        const library = new PlanningLibrary(this.jj);
        const result = await operation(library);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }
}

// Schema validation patterns from loader.ts and validate.ts
const SCOPE_PATTERN = /^[a-z][a-z0-9/.-]*$/;

const ValidatedCommitType = z.enum([
  "feat",
  "fix",
  "refactor",
  "build",
  "chore",
  "docs",
  "lint",
  "infra",
  "spec",
]);

const ValidatedScope = z
  .string()
  .regex(
    SCOPE_PATTERN,
    "Scope must start with lowercase letter and contain only lowercase letters, numbers, hyphens, dots, and slashes (e.g., 'auth', 'user/profile', 'api.v2')",
  )
  .nullable();

const ValidatedTitle = z
  .string()
  .min(1, "Title cannot be empty")
  .max(120, "Title must not exceed 120 characters")
  .refine(
    (val) => val === val.trim(),
    "Title must not have leading or trailing whitespace",
  )
  .refine(
    (val) =>
      val.trim().at(0) === "" ||
      val.trim().at(0)?.toLowerCase() === val.trim().at(0),
    "Title must start with lowercase letter",
  );

const ValidatedIntent = z
  .string()
  .min(
    1,
    "Intent cannot be empty - explain WHY this exists and what problem it solves",
  );

const ValidatedObjectives = z
  .array(z.string().min(1, "Objective cannot be empty"))
  .min(1, "At least one objective is required - specify measurable outcomes");

const ValidatedConstraints = z
  .array(z.string().min(1, "Constraint cannot be empty"))
  .default([]);

const ValidatedNewParameter = z.enum(["current", "auto"]).optional();

// TASK-CENTRIC MCP INTERFACE
// ==========================
//
// This MCP server now operates purely on tasks, with project-level metadata operations removed.
// All operations work through task creation and management, making the interface task-centric.
//
// AVAILABLE OPERATIONS:
// - get_project: Returns task list only (no project metadata)
// - create_task: Creates new tasks
// - update_task: Updates existing tasks
// - delete_task: Removes tasks
// - reorder_tasks: Changes task execution order
// - goto: Navigates to specific tasks
//
// RATIONALE:
// This completes the migration to a purely task-based external API, removing project metadata
// concepts from the MCP interface while preserving full task management functionality.

function formatError(error: Err) {
  // Provide helpful error messages with recovery guidance
  switch (error.err) {
    case "task_not_found":
      return `Task '${error.meta?.task_key}' not found. Use get_project to see available tasks, or create a new task with create_task.`;
    case "invalid_task_keys":
      return `Invalid task keys provided. Available tasks: [${error.meta?.existing?.join(", ")}]. You provided: [${error.meta?.provided?.join(", ")}]. Use get_project to see current tasks.`;
    case "empty task not allowed":
      return `Cannot save project with no tasks. Add at least one task using create_task before saving.`;
    case "Cannot remove commit that has files":
      return `Cannot delete task '${error.meta?.task_key}' because it contains uncommitted changes. Commit or discard changes first.`;
    case "Cannot move non-existent task key":
      return `Cannot reorder tasks: some task keys don't exist. Use get_project to see available tasks.`;
    default:
      return `Error: ${error.err}. ${error.meta ? `Details: ${JSON.stringify(error.meta)}` : ""}`;
  }
}

function composeTextOutput(
  content:
    | {
        type: "error";
        error: Err<string, unknown>;
      }
    | {
        type: "success";
        message: string;
      },
): { type: "text"; text: string } {
  switch (content.type) {
    case "error":
      return {
        type: "text",
        text: `${formatError(content.error)}

Metadata:
${JSON.stringify(content.error.meta, null, 2)}

This is a CRITICAL ISSUE. Surface this to the user immediately AND STOP. RESOLVING THIS ISSUE REQUIRES MANUAL USER INTERVENTION.`,
      };
    case "success": {
      return {
        type: "text",
        text: content.message,
      };
    }
  }
}

function start() {
  const server = new FastMCP({
    name: "planner",
    version: "0.1.0",
    instructions: `I am a planning library MCP server for managing project plans and tasks.`,
  });

  const jj = Jujutsu.cwd(process.cwd());
  const libraryQueue = new PlanningLibraryQueue(jj);

  // Task-Only Operations
  server.addTool({
    name: "get_project",
    description: `Returns the current task list and project state. ALWAYS CALL THIS FIRST.`,
    parameters: z.object({}),
    execute: async () => {
      return libraryQueue.enqueue(async (library) => {
        const project = await library.project();

        if (project.err)
          return composeTextOutput({
            type: "error",
            error: project,
          });

        if (project.ok === null)
          return composeTextOutput({
            type: "success",
            message: `No existing tasks. Create your first task using create_task.`,
          });

        // Return only task data - project metadata is no longer exposed
        const taskOnlyData = {
          tasks: project.ok.tasks,
        };

        return composeTextOutput({
          type: "success",
          message: `Tasks retrieved. EXAMINE THE RESULT: ${JSON.stringify(taskOnlyData, null, 2)}

TASK-CENTRIC INTERFACE: This system now operates purely on tasks:
- Project metadata operations have been removed from the MCP interface
- All operations work through task creation and management
- Use create_task to add new tasks to your workflow

REQUIRED: You must analyze this task data and determine if it matches your expectations:
- Task data should be accurate and functional - verify task details carefully
- If task data doesn't match your expectations, you MUST take corrective action immediately.

IMPORTANT: WITHIN THE CONTEXT OF USING THIS TOOL, YOU ARE REQUIRED TO ENGAGE IN PERSISTENT CLARIFICATION BEFORE ANY CREATE/UPDATE/DELETE OPERATION. You must ask specific questions about missing details and continue asking until the user explicitly says "proceed", "go ahead", or "that's enough". DO NOT ASSUME ANY DETAILS. DO NOT PROCEED WITHOUT EXPLICIT USER PERMISSION.`,
        });
      });
    },
  });

  // Task CRUD Operations
  server.addTool({
    name: "create_task",
    description: `Creates a new task and adds it to the project. Requires an existing project (call get_project first).

PARAMETER GUIDE:

SCOPE: Same as project scope or more specific:
- Project scope "auth" → Task scope "auth/login" or "auth/signup"
- Project scope "api" → Task scope "api/users" or "api/posts"

TITLE: What work will be done (lowercase start):
- "implement user registration form"
- "fix password validation bug"
- "refactor database connection logic"

INTENT: WHY this specific task is needed:
✅ GOOD: "Users need a way to create accounts before they can access protected features. Registration form is the entry point for new users."
❌ BAD: "Add registration" (doesn't explain why)

OBJECTIVES: Specific outcomes for this task:
✅ GOOD: ["Registration form accepts email/password", "Form validates input in real-time", "Success redirects to dashboard"]
❌ BAD: ["Better registration"] (not specific)

TASK TYPE GUIDE (choose the right type):
- feat: New user-facing features ("add login form", "implement search")
- fix: Bug repairs ("fix memory leak", "resolve crash on startup") 
- refactor: Code improvements without changing behavior ("reorganize auth module")
- build: Build system changes ("update webpack config", "add CI pipeline")
- chore: Maintenance tasks ("update dependencies", "clean up logs")
- docs: Documentation ("add API docs", "update README")
- lint: Code style/formatting ("fix eslint errors", "format with prettier")
- infra: Infrastructure changes ("deploy to AWS", "setup monitoring")
- spec: Specifications/requirements ("define API contract", "write test cases")

Parameters:
- type: feat/fix/refactor/build/chore/docs/lint/infra/spec
- scope: Area of change (can be more specific than project scope, or null)
- title: What work will be done (lowercase start, max 120 chars)
- intent: WHY this task is needed (detailed explanation)
- objectives: Specific outcomes for this task (at least one required)
- constraints: Task-specific limitations (optional)
- completed: false (default for new tasks)
- new: "current" | "auto" (optional - "auto" creates new project, "current" documents existing work) `,
    parameters: z.object({
      type: ValidatedCommitType,
      scope: ValidatedScope,
      title: ValidatedTitle,
      intent: ValidatedIntent,
      objectives: ValidatedObjectives,
      constraints: ValidatedConstraints,
      completed: z.boolean().default(false),
      new: ValidatedNewParameter,
    }),
    execute: async (args) => {
      return libraryQueue.enqueue(async (library) => {
        const project = await library.project(
          args.new ? { new: args.new } : {},
        );

        if (project.err)
          return composeTextOutput({
            type: "error",
            error: project,
          });

        if (project.ok === null)
          return composeTextOutput({
            type: "error",
            error: Err("Tool Error: There is no existing project to update."),
          });

        // Add new task (task_key will be auto-assigned by saver)
        const newTask = {
          type: args.type,
          scope: args.scope,
          title: args.title,
          intent: args.intent,
          objectives: args.objectives,
          constraints: args.constraints,
          completed: args.completed,
        };

        if (args.new === "auto") {
          project.ok.tasks = [newTask];
        } else if (args.new === "current") {
          // For "current" mode, replace the empty placeholder task with the actual task
          project.ok.tasks = [newTask];
        } else {
          project.ok.tasks.push(newTask);
        }

        const saveResult = await project.ok.save();

        if (saveResult.err) {
          return composeTextOutput({
            type: "error",
            error: saveResult as Err<string, unknown>,
          });
        }

        return composeTextOutput({
          type: "success",
          message: `Task '${newTask.title}' created successfully. VERIFY THE RESULT: ${JSON.stringify(project.ok, null, 2)}\n\nDEBUG LOG: .debug.mcp.log contains detailed debug output to investigate header serialization if needed.\n\nREQUIRED: Confirm the task was created correctly with the right details.\n- Verify that the entire project scope and task order MUST BE coherent\n- If the result doesn't match your expectations, YOU MUST investigate and correct immediately.`,
        });
      });
    },
  });

  server.addTool({
    name: "update_task",
    description: `Updates an existing task with partial changes. Requires task_key from get_project.

Parameters:
- task_key: REQUIRED - Exact task_key from get_project (cannot be empty)
- type: Optional - feat/fix/refactor/build/chore/docs/lint/infra/spec
- scope: Optional - Area of change (can be more specific, or null)
- title: Optional - What work will be done (lowercase start, max 120 chars)
- intent: Optional - WHY this task is needed (if provided, cannot be empty)
- objectives: Optional - Specific outcomes (if provided, at least one required)
- constraints: Optional - Task-specific limitations
- completed: Optional - true when task is finished`,
    parameters: z.object({
      task_key: z.string().min(1, "Task key cannot be empty"),
      type: ValidatedCommitType.optional(),
      scope: ValidatedScope.optional(),
      title: ValidatedTitle.optional(),
      intent: ValidatedIntent.optional(),
      objectives: ValidatedObjectives.optional(),
      constraints: ValidatedConstraints.optional(),
      completed: z.boolean().optional(),
    }),
    execute: async (args) => {
      return libraryQueue.enqueue(async (library) => {
        const project = await library.project();
        if (project.err)
          return composeTextOutput({
            type: "error",
            error: project,
          });

        if (project.ok === null)
          return composeTextOutput({
            type: "error",
            error: Err("Tool Error: There is no existing project to update."),
          });

        // Find task to update
        const task = project.ok.tasks.find((t) => t.task_key === args.task_key);
        if (!task) {
          return composeTextOutput({
            type: "error",
            error: {
              err: "task_not_found",
              meta: { task_key: args.task_key },
            } as Err<string, unknown>,
          });
        }

        // Update only provided fields
        if (args.type !== undefined) task.type = args.type;
        if (args.scope !== undefined) task.scope = args.scope;
        if (args.title !== undefined) task.title = args.title;
        if (args.intent !== undefined) task.intent = args.intent;
        if (args.objectives !== undefined) task.objectives = args.objectives;
        if (args.constraints !== undefined) task.constraints = args.constraints;
        if (args.completed !== undefined) task.completed = args.completed;

        const saveResult = await project.ok.save();
        if (saveResult.err) {
          return composeTextOutput({
            type: "error",
            error: saveResult as Err<string, unknown>,
          });
        }

        return composeTextOutput({
          type: "success",
          message: `Task update completed. VERIFY THE CHANGES: ${JSON.stringify(project.ok, null, 2)}

REQUIRED: You must verify your task update was applied correctly:
- Check that the changes you made were in line with the agreed upon changes.
- Verify that the entire project scope and task order MUST BE coherent
- If the result doesn't match your expectations, YOU MUST investigate and correct immediately.`,
        });
      });
    },
  });

  server.addTool({
    name: "delete_task",
    description: `Removes a task from the project.`,
    parameters: z.object({
      task_key: z.string().min(1, "Task key cannot be empty"),
    }),
    execute: async (args) => {
      return libraryQueue.enqueue(async (library) => {
        const project = await library.project();
        if (project.err)
          return composeTextOutput({
            type: "error",
            error: project,
          });

        if (project.ok === null)
          return composeTextOutput({
            type: "error",
            error: Err("Tool Error: There is no existing project to update."),
          });

        // Find task index
        const taskIndex = project.ok.tasks.findIndex(
          (t) => t.task_key === args.task_key,
        );
        if (taskIndex === -1) {
          return composeTextOutput({
            type: "error",
            error: {
              err: "task_not_found",
              meta: { task_key: args.task_key },
            } as Err<string, unknown>,
          });
        }

        // Remove task
        project.ok.tasks.splice(taskIndex, 1);

        const saveResult = await project.ok.save();
        if (saveResult.err) {
          return composeTextOutput({
            type: "error",
            error: saveResult as Err<string, unknown>,
          });
        }

        return composeTextOutput({
          type: "success",
          message: `Task deletion completed. VERIFY THE RESULT: ${JSON.stringify(project.ok.tasks, null, 2)}

REQUIRED: You must verify the task was deleted correctly:
- Confirm that task has been removed
- If the result doesn't match your expectations, YOU MUST investigate and correct immediately.`,
        });
      });
    },
  });

  server.addTool({
    name: "reorder_tasks",
    description: `Reorders tasks in the project according to dependency sequence.`,
    parameters: z.object({
      task_keys: z
        .array(z.string().min(1, "Task key cannot be empty"))
        .min(1, "At least one task key is required"),
    }),
    execute: async (args) => {
      return libraryQueue.enqueue(async (library) => {
        const project = await library.project();
        if (project.err)
          return composeTextOutput({
            type: "error",
            error: project,
          });

        if (project.ok === null)
          return composeTextOutput({
            type: "error",
            error: Err("Tool Error: There is no existing project to update."),
          });

        // Validate all task keys exist
        const existingKeys = project.ok.tasks
          .map((t) => t.task_key)
          .filter((key): key is string => Boolean(key));
        const providedKeys = new Set(args.task_keys);

        if (
          existingKeys.length !== providedKeys.size ||
          !existingKeys.every((key) => providedKeys.has(key))
        ) {
          return composeTextOutput({
            type: "error",
            error: {
              err: "invalid_task_keys",
              meta: {
                existing: Array.from(existingKeys),
                provided: args.task_keys,
              },
            } as Err<string, unknown>,
          });
        }

        // Reorder tasks
        const reorderedTasks = args.task_keys.map((key) =>
          project.ok.tasks.find((t) => t.task_key === key),
        );
        project.ok.tasks = reorderedTasks as [
          SavingPlanData["tasks"][0],
          ...SavingPlanData["tasks"],
        ];

        const saveResult = await project.ok.save();
        if (saveResult.err) {
          return composeTextOutput({
            type: "error",
            error: saveResult as Err<string, unknown>,
          });
        }

        return composeTextOutput({
          type: "success",
          message: `Task reordering completed. VERIFY THE ORDER: ${JSON.stringify(project.ok.tasks, null, 2)}

REQUIRED: You must verify the tasks are in the correct order:
- Check that the tasks array matches the order you specified
- If the result doesn't match your expectations, YOU MUST investigate and correct immediately.`,
        });
      });
    },
  });

  // Navigation and Context Tools
  server.addTool({
    name: "goto",
    description: `Navigate to a specific task (forward-only movement)`,
    parameters: z.object({
      task_key: z.string().min(1, "Task key cannot be empty"),
    }),
    execute: async (args) => {
      return libraryQueue.enqueue(async (library) => {
        const project = await library.project();
        if (project.err)
          return composeTextOutput({
            type: "error",
            error: project,
          });

        if (project.ok === null)
          return composeTextOutput({
            type: "error",
            error: Err("Tool Error: There is no existing project to navigate."),
          });

        const gotoResult = await project.ok.goto(args.task_key);
        if (gotoResult?.err) {
          return composeTextOutput({
            type: "error",
            error: gotoResult as Err<string, unknown>,
          });
        }

        return composeTextOutput({
          type: "success",
          message: `Navigation completed. You are now positioned on ${JSON.stringify(
            project.ok.tasks.find((task) => task.task_key === args.task_key),
            null,
            2,
          )}

REQUIRED: You must verify navigation was successful:
- Confirm you are now positioned on the expected task
- Verify the task has the expected properties
- If the result doesn't match your expectations, YOU MUST investigate and correct immediately.`,
        });
      });
    },
  });

  return server.start({
    transportType: "stdio",
  });
}

start();
