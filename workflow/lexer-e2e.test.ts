import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";

describe("Lexer E2E Tests", () => {
  it("should correctly tokenize the PLANNER file", () => {
    const plannerPath = join(__dirname, "PLANNER");
    const content = readFileSync(plannerPath, "utf8");

    const lexer = new WorkflowLexer(content);
    const tokens = lexer.tokenize();

    // Snapshot the tokens for easy comparison
    expect(tokens).toMatchInlineSnapshot(`
      [
        {
          "column": 1,
          "line": 2,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 3,
          "type": "star",
          "value": "*",
        },
        {
          "column": 2,
          "line": 3,
          "type": "to",
          "value": "to",
        },
        {
          "column": 5,
          "line": 3,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 20,
          "line": 3,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 21,
          "line": 3,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 4,
          "type": "content",
          "value": "Call \`planner_get_project\` to load current project state and wait for load success. Display current project status to the user.",
        },
        {
          "column": 46,
          "line": 5,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 6,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 7,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 7,
          "type": "content",
          "value": "User wants to continue the project",
        },
        {
          "column": 37,
          "line": 7,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 8,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 15,
          "line": 8,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 8,
          "type": "state",
          "value": "continue_project",
        },
        {
          "column": 35,
          "line": 8,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 36,
          "line": 8,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 9,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 10,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 10,
          "type": "content",
          "value": "User wants to start a new project",
        },
        {
          "column": 36,
          "line": 10,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 11,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 15,
          "line": 11,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 11,
          "type": "state",
          "value": "define_project",
        },
        {
          "column": 33,
          "line": 11,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 34,
          "line": 11,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 12,
          "type": "content",
          "value": "Ask user to define project - what will the project do?",
        },
        {
          "column": 57,
          "line": 12,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 13,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 14,
          "type": "state",
          "value": "define_project",
        },
        {
          "column": 15,
          "line": 14,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 14,
          "type": "state",
          "value": "refine_project",
        },
        {
          "column": 33,
          "line": 14,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 34,
          "line": 14,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 15,
          "type": "content",
          "value": "Format input for \`planner_create_project\` and pass ONLY THAT INPUT to \`plan-task-alignment\`. Wait for reply from \`plan-task-alignment\`. Present reply to user and interrogate them with the response questions.",
        },
        {
          "column": 74,
          "line": 17,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 18,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 19,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 19,
          "type": "content",
          "value": "User responds to questions",
        },
        {
          "column": 29,
          "line": 19,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 20,
          "type": "state",
          "value": "refine_project",
        },
        {
          "column": 15,
          "line": 20,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 20,
          "type": "state",
          "value": "refine_project",
        },
        {
          "column": 33,
          "line": 20,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 21,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 22,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 22,
          "type": "content",
          "value": "There are no questions",
        },
        {
          "column": 25,
          "line": 22,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 23,
          "type": "state",
          "value": "refine_project",
        },
        {
          "column": 15,
          "line": 23,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 23,
          "type": "state",
          "value": "create_project",
        },
        {
          "column": 33,
          "line": 23,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 34,
          "line": 23,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 24,
          "type": "content",
          "value": "Format input for \`planner_create_project\` and present that to the user. Confirm if the user wants to create the project.",
        },
        {
          "column": 51,
          "line": 25,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 26,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 27,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 27,
          "type": "content",
          "value": "User wants to proceed",
        },
        {
          "column": 24,
          "line": 27,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 28,
          "type": "state",
          "value": "refine_project",
        },
        {
          "column": 15,
          "line": 28,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 28,
          "type": "state",
          "value": "maybe_create_project",
        },
        {
          "column": 39,
          "line": 28,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 40,
          "line": 28,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 29,
          "type": "content",
          "value": "Format input for \`planner_create_project\` and present that to the user. Confirm if the user wants to create the project.",
        },
        {
          "column": 51,
          "line": 30,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 31,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 32,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 32,
          "type": "content",
          "value": "User agrees",
        },
        {
          "column": 14,
          "line": 32,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 33,
          "type": "state",
          "value": "maybe_create_project",
        },
        {
          "column": 21,
          "line": 33,
          "type": "to",
          "value": "to",
        },
        {
          "column": 24,
          "line": 33,
          "type": "state",
          "value": "create_project",
        },
        {
          "column": 39,
          "line": 33,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 40,
          "line": 33,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 34,
          "type": "content",
          "value": "Pass input to \`planner_create_project\`. Wait for successful reply.",
        },
        {
          "column": 29,
          "line": 35,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 36,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 37,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 37,
          "type": "content",
          "value": "User disagrees",
        },
        {
          "column": 17,
          "line": 37,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 38,
          "type": "state",
          "value": "maybe_create_project",
        },
        {
          "column": 21,
          "line": 38,
          "type": "to",
          "value": "to",
        },
        {
          "column": 24,
          "line": 38,
          "type": "state",
          "value": "refine_project",
        },
        {
          "column": 39,
          "line": 38,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 39,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 40,
          "type": "state",
          "value": "create_project",
        },
        {
          "column": 15,
          "line": 40,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 40,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 31,
          "line": 40,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 32,
          "line": 40,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 41,
          "type": "content",
          "value": "Get current project with \`planner_get_project\`. Display current tasks. Interrogate user on if the tasks match their intent.",
        },
        {
          "column": 55,
          "line": 43,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 44,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 45,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 45,
          "type": "content",
          "value": "User presents refinement of specific task",
        },
        {
          "column": 44,
          "line": 45,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 46,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 46,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 46,
          "type": "state",
          "value": "check_tasks",
        },
        {
          "column": 28,
          "line": 46,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 46,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 47,
          "type": "content",
          "value": "Format input for \`planner_update_task\` and pass ONLY THAT INPUT to \`plan-task-alignment\`. Wait for reply from \`plan-task-alignment\`. Present reply to user and interrogate them with the response questions.",
        },
        {
          "column": 74,
          "line": 49,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 50,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 51,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 51,
          "type": "content",
          "value": "User responds to questions",
        },
        {
          "column": 29,
          "line": 51,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 52,
          "type": "state",
          "value": "check_tasks",
        },
        {
          "column": 12,
          "line": 52,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 52,
          "type": "state",
          "value": "check_tasks",
        },
        {
          "column": 27,
          "line": 52,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 53,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 54,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 54,
          "type": "content",
          "value": "There are no questions",
        },
        {
          "column": 25,
          "line": 54,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 55,
          "type": "state",
          "value": "check_tasks",
        },
        {
          "column": 12,
          "line": 55,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 55,
          "type": "state",
          "value": "update_task",
        },
        {
          "column": 27,
          "line": 55,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 28,
          "line": 55,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 56,
          "type": "content",
          "value": "Pass input to \`planner_update_task\`. Wait for reply.",
        },
        {
          "column": 18,
          "line": 57,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 58,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 59,
          "type": "state",
          "value": "update_task",
        },
        {
          "column": 12,
          "line": 59,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 59,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 28,
          "line": 59,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 60,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 61,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 61,
          "type": "content",
          "value": "User presents deletion of specific task",
        },
        {
          "column": 42,
          "line": 61,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 62,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 62,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 62,
          "type": "state",
          "value": "delete_task",
        },
        {
          "column": 28,
          "line": 62,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 62,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 63,
          "type": "content",
          "value": "Call \`planner_delete_task\` to delete task in question. Wait for reply.",
        },
        {
          "column": 18,
          "line": 64,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 65,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 66,
          "type": "state",
          "value": "delete_task",
        },
        {
          "column": 12,
          "line": 66,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 66,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 28,
          "line": 66,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 67,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 68,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 68,
          "type": "content",
          "value": "User presents reordering of tasks",
        },
        {
          "column": 36,
          "line": 68,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 69,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 69,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 69,
          "type": "state",
          "value": "reorder_tasks",
        },
        {
          "column": 30,
          "line": 69,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 31,
          "line": 69,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 70,
          "type": "content",
          "value": "Call \`planner_reorder_tasks\` to reorder tasks. Wait for reply.",
        },
        {
          "column": 18,
          "line": 71,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 72,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 73,
          "type": "state",
          "value": "reorder_tasks",
        },
        {
          "column": 14,
          "line": 73,
          "type": "to",
          "value": "to",
        },
        {
          "column": 17,
          "line": 73,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 30,
          "line": 73,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 74,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 75,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 75,
          "type": "content",
          "value": "User wants to proceed",
        },
        {
          "column": 24,
          "line": 75,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 76,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 76,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 76,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 28,
          "line": 76,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 76,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 77,
          "type": "content",
          "value": "Get full project state with \`planner_get_project\`. Pass ONLY THAT PROJECT STATE to \`plan-task-alignment\`. Wait for reply from \`plan-task-alignment\`. Present reply to user and interrogate them with the response questions.",
        },
        {
          "column": 74,
          "line": 80,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 81,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 82,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 82,
          "type": "content",
          "value": "User answers to questions",
        },
        {
          "column": 28,
          "line": 82,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 83,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 12,
          "line": 83,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 83,
          "type": "state",
          "value": "parallel_update",
        },
        {
          "column": 31,
          "line": 83,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 32,
          "line": 83,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 84,
          "type": "content",
          "value": "Update any changes in project with \`planner_update_project\` Update any changes in tasks with \`planner_update_task\` Update any changes in task order with \`planner_reoder_tasks\` Update any changes in task deletion with \`planner_delete_task\`",
        },
        {
          "column": 65,
          "line": 87,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 88,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 89,
          "type": "state",
          "value": "parallel_update",
        },
        {
          "column": 16,
          "line": 89,
          "type": "to",
          "value": "to",
        },
        {
          "column": 19,
          "line": 89,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 31,
          "line": 89,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 90,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 91,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 91,
          "type": "content",
          "value": "There are no questions",
        },
        {
          "column": 25,
          "line": 91,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 92,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 12,
          "line": 92,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 92,
          "type": "state",
          "value": "parallel_update",
        },
        {
          "column": 31,
          "line": 92,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 93,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 94,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 94,
          "type": "content",
          "value": "User wants to proceed",
        },
        {
          "column": 24,
          "line": 94,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 95,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 12,
          "line": 95,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 95,
          "type": "state",
          "value": "execution",
        },
        {
          "column": 25,
          "line": 95,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 26,
          "line": 95,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 96,
          "type": "content",
          "value": "Call \`planner_get_project\` to get full task details",
        },
        {
          "column": 54,
          "line": 96,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 97,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 98,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 98,
          "type": "content",
          "value": "All tasks complete",
        },
        {
          "column": 21,
          "line": 98,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 99,
          "type": "state",
          "value": "execution",
        },
        {
          "column": 10,
          "line": 99,
          "type": "to",
          "value": "to",
        },
        {
          "column": 13,
          "line": 99,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 32,
          "line": 99,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 33,
          "line": 99,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 100,
          "type": "content",
          "value": "Call \`planner_get_project\` to get full project details. Present reply to user",
        },
        {
          "column": 24,
          "line": 101,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 102,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 103,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 103,
          "type": "content",
          "value": "User is satisfied with output",
        },
        {
          "column": 32,
          "line": 103,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 104,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 19,
          "line": 104,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 104,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 37,
          "line": 104,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 105,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 106,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 106,
          "type": "content",
          "value": "User is unsatisfied with output",
        },
        {
          "column": 34,
          "line": 106,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 107,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 19,
          "line": 107,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 107,
          "type": "star",
          "value": "*",
        },
        {
          "column": 24,
          "line": 107,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 25,
          "line": 107,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 108,
          "type": "content",
          "value": "Program execution broken",
        },
        {
          "column": 27,
          "line": 108,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 109,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 110,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 110,
          "type": "content",
          "value": "Some tasks incomplete",
        },
        {
          "column": 24,
          "line": 110,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 111,
          "type": "state",
          "value": "execution",
        },
        {
          "column": 10,
          "line": 111,
          "type": "to",
          "value": "to",
        },
        {
          "column": 13,
          "line": 111,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 22,
          "line": 111,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 23,
          "line": 111,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 112,
          "type": "content",
          "value": "Go to first incomplete task with \`planner_goto\`. Execute the task.",
        },
        {
          "column": 20,
          "line": 113,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 3,
          "line": 114,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 115,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 115,
          "type": "content",
          "value": "If task is complete",
        },
        {
          "column": 22,
          "line": 115,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 116,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 9,
          "line": 116,
          "type": "to",
          "value": "to",
        },
        {
          "column": 12,
          "line": 116,
          "type": "state",
          "value": "execution",
        },
        {
          "column": 22,
          "line": 116,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 117,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 118,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 118,
          "type": "content",
          "value": "If task is incomplete",
        },
        {
          "column": 24,
          "line": 118,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 119,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 9,
          "line": 119,
          "type": "to",
          "value": "to",
        },
        {
          "column": 12,
          "line": 119,
          "type": "star",
          "value": "*",
        },
        {
          "column": 14,
          "line": 119,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 15,
          "line": 119,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 120,
          "type": "content",
          "value": "Program execution broken",
        },
        {
          "column": 27,
          "line": 120,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 121,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 122,
          "type": "eof",
          "value": "",
        },
      ]
    `);
  });
});
