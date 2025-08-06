import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";
import { WorkflowParser } from "./parser";

describe("Parser E2E Tests", () => {
  it("should parse the entire PLANNER file", () => {
    const plannerPath = join(__dirname, "PLANNER");
    const content = readFileSync(plannerPath, "utf8");

    const lexer = new WorkflowLexer(content);
    const tokens = lexer.tokenize();

    const parser = new WorkflowParser(tokens);
    const result = parser.parse();
    expect(result).toMatchInlineSnapshot(`
      {
        "initialState": "initial_loaded",
        "states": {
          "*": {
            "guidance": "Call \`planner_get_project\` to load current project state and wait for load success. Display current project status to the user.",
            "name": "*",
          },
          "all_tasks_complete": {
            "guidance": "Call \`planner_get_project\` to get full project details. Present reply to user",
            "name": "all_tasks_complete",
          },
          "check_tasks": {
            "guidance": "Format input for \`planner_update_task\` and pass ONLY THAT INPUT to \`plan-task-alignment\`. Wait for reply from \`plan-task-alignment\`. Present reply to user and interrogate them with the response questions.",
            "name": "check_tasks",
          },
          "continue_project": {
            "guidance": "",
            "name": "continue_project",
          },
          "create_project": {
            "guidance": "Format input for \`planner_create_project\` and present that to the user. Confirm if the user wants to create the project.",
            "name": "create_project",
          },
          "define_project": {
            "guidance": "Ask user to define project - what will the project do?",
            "name": "define_project",
          },
          "delete_task": {
            "guidance": "Call \`planner_delete_task\` to delete task in question. Wait for reply.",
            "name": "delete_task",
          },
          "execution": {
            "guidance": "Call \`planner_get_project\` to get full task details",
            "name": "execution",
          },
          "final_check": {
            "guidance": "Get full project state with \`planner_get_project\`. Pass ONLY THAT PROJECT STATE to \`plan-task-alignment\`. Wait for reply from \`plan-task-alignment\`. Present reply to user and interrogate them with the response questions.",
            "name": "final_check",
          },
          "initial_loaded": {
            "guidance": "Call \`planner_get_project\` to load current project state and wait for load success. Display current project status to the user.",
            "name": "initial_loaded",
          },
          "maybe_create_project": {
            "guidance": "Format input for \`planner_create_project\` and present that to the user. Confirm if the user wants to create the project.",
            "name": "maybe_create_project",
          },
          "parallel_update": {
            "guidance": "Update any changes in project with \`planner_update_project\` Update any changes in tasks with \`planner_update_task\` Update any changes in task order with \`planner_reoder_tasks\` Update any changes in task deletion with \`planner_delete_task\`",
            "name": "parallel_update",
          },
          "refine_project": {
            "guidance": "Format input for \`planner_create_project\` and pass ONLY THAT INPUT to \`plan-task-alignment\`. Wait for reply from \`plan-task-alignment\`. Present reply to user and interrogate them with the response questions.",
            "name": "refine_project",
          },
          "refine_tasks": {
            "guidance": "Get current project with \`planner_get_project\`. Display current tasks. Interrogate user on if the tasks match their intent.",
            "name": "refine_tasks",
          },
          "reorder_tasks": {
            "guidance": "Call \`planner_reorder_tasks\` to reorder tasks. Wait for reply.",
            "name": "reorder_tasks",
          },
          "run_task": {
            "guidance": "Go to first incomplete task with \`planner_goto\`. Execute the task.",
            "name": "run_task",
          },
          "update_task": {
            "guidance": "Pass input to \`planner_update_task\`. Wait for reply.",
            "name": "update_task",
          },
        },
        "transitions": {
          "*": {
            "initial_loaded": {
              "guidance": undefined,
              "target": "initial_loaded",
            },
          },
          "all_tasks_complete": {
            "*": {
              "guidance": "User is unsatisfied with output",
              "target": "*",
            },
            "initial_loaded": {
              "guidance": "User is satisfied with output",
              "target": "initial_loaded",
            },
          },
          "check_tasks": {
            "check_tasks": {
              "guidance": "User responds to questions",
              "target": "check_tasks",
            },
            "update_task": {
              "guidance": "There are no questions",
              "target": "update_task",
            },
          },
          "continue_project": {},
          "create_project": {
            "refine_tasks": {
              "guidance": undefined,
              "target": "refine_tasks",
            },
          },
          "define_project": {
            "refine_project": {
              "guidance": undefined,
              "target": "refine_project",
            },
          },
          "delete_task": {
            "refine_tasks": {
              "guidance": undefined,
              "target": "refine_tasks",
            },
          },
          "execution": {
            "all_tasks_complete": {
              "guidance": "All tasks complete",
              "target": "all_tasks_complete",
            },
            "run_task": {
              "guidance": "Some tasks incomplete",
              "target": "run_task",
            },
          },
          "final_check": {
            "execution": {
              "guidance": "User wants to proceed",
              "target": "execution",
            },
            "parallel_update": {
              "guidance": "There are no questions",
              "target": "parallel_update",
            },
          },
          "initial_loaded": {
            "continue_project": {
              "guidance": "User wants to continue the project",
              "target": "continue_project",
            },
            "define_project": {
              "guidance": "User wants to start a new project",
              "target": "define_project",
            },
          },
          "maybe_create_project": {
            "create_project": {
              "guidance": "User agrees",
              "target": "create_project",
            },
            "refine_project": {
              "guidance": "User disagrees",
              "target": "refine_project",
            },
          },
          "parallel_update": {
            "final_check": {
              "guidance": undefined,
              "target": "final_check",
            },
          },
          "refine_project": {
            "create_project": {
              "guidance": "There are no questions",
              "target": "create_project",
            },
            "maybe_create_project": {
              "guidance": "User wants to proceed",
              "target": "maybe_create_project",
            },
            "refine_project": {
              "guidance": "User responds to questions",
              "target": "refine_project",
            },
          },
          "refine_tasks": {
            "check_tasks": {
              "guidance": "User presents refinement of specific task",
              "target": "check_tasks",
            },
            "delete_task": {
              "guidance": "User presents deletion of specific task",
              "target": "delete_task",
            },
            "final_check": {
              "guidance": "User wants to proceed",
              "target": "final_check",
            },
            "reorder_tasks": {
              "guidance": "User presents reordering of tasks",
              "target": "reorder_tasks",
            },
          },
          "reorder_tasks": {
            "refine_tasks": {
              "guidance": undefined,
              "target": "refine_tasks",
            },
          },
          "run_task": {
            "*": {
              "guidance": "If task is incomplete",
              "target": "*",
            },
            "execution": {
              "guidance": "If task is complete",
              "target": "execution",
            },
          },
          "update_task": {
            "refine_tasks": {
              "guidance": undefined,
              "target": "refine_tasks",
            },
          },
        },
      }
    `);
  });
});
