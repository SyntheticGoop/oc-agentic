import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";

describe("Lexer E2E Tests", () => {
  it("should correctly tokenize the scoped-execution.flow file", () => {
    const plannerPath = join(__dirname, "scoped-execution.flow");
    const content = readFileSync(plannerPath, "utf8");

    const lexer = new WorkflowLexer(content);
    const tokens = lexer.tokenize();

    // Snapshot the tokens for easy comparison
    expect(tokens).toMatchInlineSnapshot(`
      [
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
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 7,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 8,
          "type": "star",
          "value": "*",
        },
        {
          "column": 2,
          "line": 8,
          "type": "to",
          "value": "to",
        },
        {
          "column": 5,
          "line": 8,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 20,
          "line": 8,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 21,
          "line": 8,
          "type": "content",
          "value": "Call \`get_project\` to load current task list. List summary of files changed with \`jj diff --summary -r @\`. Display detailed list of current task status to the user. Ask what the user wants to do and only proceed on explicit confirmation.",
        },
        {
          "column": 75,
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
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 14,
          "type": "content",
          "value": "Ask: Do you want to continue with existing tasks?",
        },
        {
          "column": 52,
          "line": 14,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 15,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 15,
          "line": 15,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 15,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 31,
          "line": 15,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 32,
          "line": 15,
          "type": "content",
          "value": "Ask if the user would like to create, update, delete, reorder or skip to execution.",
        },
        {
          "column": 86,
          "line": 16,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 17,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 18,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 18,
          "type": "content",
          "value": "Ask: Do you want to create a new tasks?",
        },
        {
          "column": 42,
          "line": 18,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 19,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 15,
          "line": 19,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 19,
          "type": "state",
          "value": "create_task",
        },
        {
          "column": 30,
          "line": 19,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 31,
          "line": 19,
          "type": "content",
          "value": "Ask to define the specifics of the task. These specifics will be used to create the task with \`create_task\` with (new="auto"). Detail the task specifics including type, scope, title, intent, objectives, and constraints.",
        },
        {
          "column": 95,
          "line": 22,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 23,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 24,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 24,
          "type": "content",
          "value": "Ask: Do you want to document work already done?",
        },
        {
          "column": 50,
          "line": 24,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 25,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 15,
          "line": 25,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 25,
          "type": "state",
          "value": "document_work_done",
        },
        {
          "column": 37,
          "line": 25,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 38,
          "line": 25,
          "type": "content",
          "value": "Analyze current commit changes using \`jj diff --summary -r @\` to understand what work has been completed. Use \`oc-agentic-investigator\` to extract task details from actual file changes and commit context. Use \`oc-agentic-inquisitor\` for iterative plan refinement until task specification accurately reflects completed work. Create task documentation using \`create_task\` with (new="current") based on analysis of actual changes, not planned work. Loop back to initial_loaded state after completion without human interaction.",
        },
        {
          "column": 80,
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
          "value": "Do: When user is done clarifying their task.",
        },
        {
          "column": 47,
          "line": 32,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 33,
          "type": "state",
          "value": "create_task",
        },
        {
          "column": 12,
          "line": 33,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 33,
          "type": "state",
          "value": "checked_task",
        },
        {
          "column": 28,
          "line": 33,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 33,
          "type": "content",
          "value": "Format input for \`update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is where I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your contextual understanding and ability to investigate to accept or reject points, synthesize new points, or make adjustments to the task. Clearly mark remaining uncertainties for the user to resolve. Present the reply including all automatic adjustments and uncertainties, then ask the user whether to apply or ignore recommendations.",
        },
        {
          "column": 137,
          "line": 40,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 41,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 42,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 42,
          "type": "content",
          "value": "Ask: Can you provide clarity on all the above points?",
        },
        {
          "column": 56,
          "line": 42,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 43,
          "type": "state",
          "value": "checked_task",
        },
        {
          "column": 13,
          "line": 43,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 43,
          "type": "state",
          "value": "checked_task",
        },
        {
          "column": 29,
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
          "value": "Ask: Would you like to proceed (anyway) to updating the task?",
        },
        {
          "column": 64,
          "line": 45,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 46,
          "type": "state",
          "value": "checked_task",
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
          "value": "commit_create_task",
        },
        {
          "column": 35,
          "line": 46,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 36,
          "line": 46,
          "type": "content",
          "value": "Consolidate everything discussed in detail, without missing anything, and use it to call \`create_task\` with (new="auto"). Wait for reply.",
        },
        {
          "column": 18,
          "line": 48,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 49,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 50,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 50,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 50,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 51,
          "type": "state",
          "value": "document_work_done",
        },
        {
          "column": 19,
          "line": 51,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 51,
          "type": "state",
          "value": "analyze_commit_changes",
        },
        {
          "column": 45,
          "line": 51,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 46,
          "line": 51,
          "type": "content",
          "value": "Run \`jj diff --summary -r @\` to get summary of current commit changes. Extract file paths, change types, and modification patterns from diff output. Prepare context for commit analysis including changed files and their purposes.",
        },
        {
          "column": 82,
          "line": 54,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 55,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 56,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 56,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 56,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 57,
          "type": "state",
          "value": "analyze_commit_changes",
        },
        {
          "column": 23,
          "line": 57,
          "type": "to",
          "value": "to",
        },
        {
          "column": 26,
          "line": 57,
          "type": "state",
          "value": "investigate_changes",
        },
        {
          "column": 46,
          "line": 57,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 47,
          "line": 57,
          "type": "content",
          "value": "Pass commit analysis context to \`oc-agentic-investigator\`. Your message format will be \`I need to understand the work completed in this commit. Here are the file changes: DIFF_SUMMARY. I want to extract task details including type, scope, title, intent, objectives, and constraints based on actual changes made, not planned work. Can you help analyze what was actually accomplished?\`. Wait for investigator analysis of actual changes and their business impact. Extract technical details, scope of changes, and implementation approach from analysis.",
        },
        {
          "column": 90,
          "line": 61,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 62,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 63,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 63,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 63,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 64,
          "type": "state",
          "value": "investigate_changes",
        },
        {
          "column": 20,
          "line": 64,
          "type": "to",
          "value": "to",
        },
        {
          "column": 23,
          "line": 64,
          "type": "state",
          "value": "refine_task_spec",
        },
        {
          "column": 40,
          "line": 64,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 41,
          "line": 64,
          "type": "content",
          "value": "Format extracted task details and pass to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This task specification needs to accurately reflect completed work for retroactive documentation. The specification must be based on actual file changes and implementation details, not planned work. [specification] EXTRACTED_TASK_DETAILS\`. Wait for inquisitor refinement of task specification. Iterate with inquisitor until task specification accurately captures completed work. Ensure task type, scope, title, intent, objectives, and constraints reflect actual implementation.",
        },
        {
          "column": 101,
          "line": 69,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 70,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 71,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 71,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 71,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 72,
          "type": "state",
          "value": "refine_task_spec",
        },
        {
          "column": 17,
          "line": 72,
          "type": "to",
          "value": "to",
        },
        {
          "column": 20,
          "line": 72,
          "type": "state",
          "value": "create_documentation_task",
        },
        {
          "column": 46,
          "line": 72,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 47,
          "line": 72,
          "type": "content",
          "value": "Use refined task specification to call \`create_task\` with (new="current"). This will document the current commit with the analyzed task details. Ensure all task fields accurately reflect the completed work based on commit analysis. Wait for successful task creation.",
        },
        {
          "column": 37,
          "line": 76,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 77,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 78,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 78,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 78,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 79,
          "type": "state",
          "value": "create_documentation_task",
        },
        {
          "column": 26,
          "line": 79,
          "type": "to",
          "value": "to",
        },
        {
          "column": 29,
          "line": 79,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 44,
          "line": 79,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 80,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 81,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 81,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 81,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 82,
          "type": "state",
          "value": "commit_create_task",
        },
        {
          "column": 19,
          "line": 82,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 82,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 35,
          "line": 82,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 83,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 84,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 84,
          "type": "content",
          "value": "Ask: Would you like to create a new task?",
        },
        {
          "column": 44,
          "line": 84,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 85,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 85,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 85,
          "type": "state",
          "value": "create_task",
        },
        {
          "column": 28,
          "line": 85,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 85,
          "type": "content",
          "value": "Ask to define the specifics of the task. These specifics will be used to create the task with \`create_task\` (without new parameter). Detail the task specifics including type, scope, title, intent, objectives, and constraints.",
        },
        {
          "column": 95,
          "line": 88,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 89,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 90,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 90,
          "type": "content",
          "value": "Ask: Are there any tasks you want to update?",
        },
        {
          "column": 47,
          "line": 90,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 91,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 91,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 91,
          "type": "state",
          "value": "update_task",
        },
        {
          "column": 28,
          "line": 91,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 91,
          "type": "content",
          "value": "Ask the details of the task the user wants to update. Create the new expected task details. Await for user to confirm or continue refining the task. On confirmation, proceed to update the task with \`update_task\`.",
        },
        {
          "column": 66,
          "line": 95,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 96,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 97,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 97,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 97,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 98,
          "type": "state",
          "value": "update_task",
        },
        {
          "column": 12,
          "line": 98,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 98,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 28,
          "line": 98,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 99,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 100,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 100,
          "type": "content",
          "value": "Ask: Would you like to delete a specific task or tasks?",
        },
        {
          "column": 58,
          "line": 100,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 101,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 101,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 101,
          "type": "state",
          "value": "delete_task",
        },
        {
          "column": 28,
          "line": 101,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 101,
          "type": "content",
          "value": "Call \`delete_task\` to delete task in question. Wait for reply.",
        },
        {
          "column": 18,
          "line": 103,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 104,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 105,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 105,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 105,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 106,
          "type": "state",
          "value": "delete_task",
        },
        {
          "column": 12,
          "line": 106,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 106,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 28,
          "line": 106,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 107,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 108,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 108,
          "type": "content",
          "value": "Ask: Would you like to reorder specific tasks?",
        },
        {
          "column": 49,
          "line": 108,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 109,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 109,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 109,
          "type": "state",
          "value": "reorder_tasks",
        },
        {
          "column": 30,
          "line": 109,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 31,
          "line": 109,
          "type": "content",
          "value": "Call \`reorder_tasks\` to reorder tasks. Wait for reply.",
        },
        {
          "column": 18,
          "line": 111,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 112,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 113,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 113,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 113,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 114,
          "type": "state",
          "value": "reorder_tasks",
        },
        {
          "column": 14,
          "line": 114,
          "type": "to",
          "value": "to",
        },
        {
          "column": 17,
          "line": 114,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 30,
          "line": 114,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 115,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 116,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 116,
          "type": "content",
          "value": "Ask: Would you like to proceed to do a final check?",
        },
        {
          "column": 54,
          "line": 116,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 117,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 117,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 117,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 28,
          "line": 117,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 117,
          "type": "content",
          "value": "NEVER SKIP THIS EVEN IF IT WAS DONE BEFORE. QUESTIONS CAN CHANGE. Get full task list with \`get_project\`. Format output of \`get_project\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This is a full task list. Every part needs to be internally coherent and logically sound. Each part must build up to a cohesive whole and no contradictions are allowed. Work done must be atomic. Planning must be exhaustive. [specification] THE_TASK_LIST_SPECIFICATION\`. Wait for reply from \`oc-agentic-inquisitor\`. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task list, leaving points with uncertainty as an exercise to the user to clarify. Present the synthesized full task list to the user, leaving no details out.",
        },
        {
          "column": 78,
          "line": 126,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 127,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 128,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 128,
          "type": "content",
          "value": "Ask: Do you accept these changes as the full task list?",
        },
        {
          "column": 58,
          "line": 128,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 129,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 12,
          "line": 129,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 129,
          "type": "state",
          "value": "parallel_update",
        },
        {
          "column": 31,
          "line": 129,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 32,
          "line": 129,
          "type": "content",
          "value": "Update any tasks with any points that the user clarifies. Commit these changes in tasks with \`update_task\` Commit these changes in task order with \`reorder_tasks\` Commit these changes in task deletion with \`delete_task\`",
        },
        {
          "column": 59,
          "line": 133,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 134,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 135,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 135,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 135,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 136,
          "type": "state",
          "value": "parallel_update",
        },
        {
          "column": 16,
          "line": 136,
          "type": "to",
          "value": "to",
        },
        {
          "column": 19,
          "line": 136,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 31,
          "line": 136,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 137,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 138,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 138,
          "type": "content",
          "value": "Ask: Do want to continue on?",
        },
        {
          "column": 31,
          "line": 138,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 139,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 12,
          "line": 139,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 139,
          "type": "state",
          "value": "execution",
        },
        {
          "column": 25,
          "line": 139,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 26,
          "line": 139,
          "type": "content",
          "value": "Update any tasks with any points that the user clarifies. Commit these changes in tasks with \`update_task\` Commit these changes in task order with \`reorder_tasks\` Commit these changes in task deletion with \`delete_task\` Call \`get_project\` to get full task details.",
        },
        {
          "column": 47,
          "line": 144,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 145,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 146,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 146,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 146,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 147,
          "type": "state",
          "value": "execution",
        },
        {
          "column": 10,
          "line": 147,
          "type": "to",
          "value": "to",
        },
        {
          "column": 13,
          "line": 147,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 24,
          "line": 147,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 25,
          "line": 147,
          "type": "content",
          "value": "Find first unfinished task. Go to first incomplete task with \`goto\`. Extract all current task details from \`get_project\`.",
        },
        {
          "column": 55,
          "line": 150,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 151,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 152,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 152,
          "type": "content",
          "value": "Introspect: Has unfinished task.",
        },
        {
          "column": 35,
          "line": 152,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 153,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 11,
          "line": 153,
          "type": "to",
          "value": "to",
        },
        {
          "column": 14,
          "line": 153,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 23,
          "line": 153,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 24,
          "line": 153,
          "type": "content",
          "value": "Pass the task to \`oc-agentic-executor\`. Your message format will be \`Do TASK_DETAILS\` where TASK_DETAILS is the full specification of the current active task verbatim. Wait for execution to complete. Pass the task to \`oc-agentic-reviewer\`. Your message format will be \`Based on TASK_DETAILS review the current changes as reported by EXECUTION_REVIEW\` where TASK_DETAILS is the full specification of the current active task verbatim and EXECUTION_REVIEW is the output produced by the executor. Wait for review to complete.",
        },
        {
          "column": 31,
          "line": 159,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 160,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 161,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 161,
          "type": "content",
          "value": "Introspect: Task is complete. IMPORTANT: THIS IS STRICT 100% COMPLETION. YOU ARE NOT ALLOWED TO BYPASS THIS REQUIREMENT. DOING SO WILL CAUSE SERIOUS PROGRAM CORRUPTION.",
        },
        {
          "column": 171,
          "line": 161,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 162,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 9,
          "line": 162,
          "type": "to",
          "value": "to",
        },
        {
          "column": 12,
          "line": 162,
          "type": "state",
          "value": "mark_task",
        },
        {
          "column": 22,
          "line": 162,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 23,
          "line": 162,
          "type": "content",
          "value": "Synthesize current task specification with actual work done to produce updated task. Be precise with your editing. Call \`update_task\` to update the task as completed with new details.",
        },
        {
          "column": 71,
          "line": 165,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 166,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 167,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 167,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 167,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 168,
          "type": "state",
          "value": "mark_task",
        },
        {
          "column": 10,
          "line": 168,
          "type": "to",
          "value": "to",
        },
        {
          "column": 13,
          "line": 168,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 24,
          "line": 168,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 169,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 170,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 170,
          "type": "content",
          "value": "Introspect: Task not yet successfully completed.",
        },
        {
          "column": 51,
          "line": 170,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 171,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 9,
          "line": 171,
          "type": "to",
          "value": "to",
        },
        {
          "column": 12,
          "line": 171,
          "type": "state",
          "value": "redefine_task",
        },
        {
          "column": 26,
          "line": 171,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 27,
          "line": 171,
          "type": "content",
          "value": "Generate new sub plan that would satisfy task requirements. Format sub plan for \`update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task. Ensure that your plan remains within the constraints of the sub problems to solve. This synthesized task plan MUST contain the following: 1. It must contain all the work already done. These sub-tasks should be classified as tasks that must be evaluated and reattempted if the evaluation failed. Evaluation means ensuring that the task is actually complete. 2. It must append all the new sub-tasks that must be completed. 3. It must not drop uncompleted sub-tasks from the current main task. Those must still be enforced.",
        },
        {
          "column": 102,
          "line": 182,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 183,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 184,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 184,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 184,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 185,
          "type": "state",
          "value": "redefine_task",
        },
        {
          "column": 14,
          "line": 185,
          "type": "to",
          "value": "to",
        },
        {
          "column": 17,
          "line": 185,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 26,
          "line": 185,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 186,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 187,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 187,
          "type": "content",
          "value": "Introspect: All tasks complete",
        },
        {
          "column": 33,
          "line": 187,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 188,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 11,
          "line": 188,
          "type": "to",
          "value": "to",
        },
        {
          "column": 14,
          "line": 188,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 33,
          "line": 188,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 34,
          "line": 188,
          "type": "content",
          "value": "Call \`get_project\` to get full task details. Present reply to user",
        },
        {
          "column": 24,
          "line": 190,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 191,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 192,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 192,
          "type": "content",
          "value": "User is satisfied with output",
        },
        {
          "column": 32,
          "line": 192,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 193,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 19,
          "line": 193,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 193,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 37,
          "line": 193,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 194,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 195,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 195,
          "type": "content",
          "value": "User is unsatisfied with output",
        },
        {
          "column": 34,
          "line": 195,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 196,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 19,
          "line": 196,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 196,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 35,
          "line": 196,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 197,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 198,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 199,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 199,
          "type": "content",
          "value": "Ask: Do you want to run an automated one-shot task (fully automated, no further human interaction)?",
        },
        {
          "column": 102,
          "line": 199,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 200,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 15,
          "line": 200,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 200,
          "type": "state",
          "value": "automated_one_shot_define_task",
        },
        {
          "column": 49,
          "line": 200,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 50,
          "line": 200,
          "type": "content",
          "value": "Ask to define the specifics of the single task. These specifics will be used to fulfill the arguments to \`create_task\` with (new="auto"). This automated flow will create a single task and fully execute it without human interaction.",
        },
        {
          "column": 96,
          "line": 203,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 204,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 205,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 205,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 205,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 206,
          "type": "state",
          "value": "automated_one_shot_define_task",
        },
        {
          "column": 31,
          "line": 206,
          "type": "to",
          "value": "to",
        },
        {
          "column": 34,
          "line": 206,
          "type": "state",
          "value": "automated_one_shot_create_task",
        },
        {
          "column": 65,
          "line": 206,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 66,
          "line": 206,
          "type": "content",
          "value": "Synthesize the single-task specifics. Pass the task specifics to agent \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how plans will be formed during execution. Plans that derive from this must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. THE_TASK_SPECIFICATION is the contents of the task specifics you would have passed to \`create_task\` with (new="auto"). Wait for reply from \`oc-agentic-inquisitor\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task. Present the synthesized single-task specifics. Update the task specifics based on the inquisitor reply. Pass the updated single-task specification to \`oc-agentic-inquisitor\` again using the same message format as above. Use \`oc-agentic-investigator\` as needed for codebase checks. Present final synthesized single-task specification ready for creation. Call \`create_task\` with (new="auto") with the final synthesized single-task specifics. Wait for successful reply.",
        },
        {
          "column": 29,
          "line": 222,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 223,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 224,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 224,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 224,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 225,
          "type": "state",
          "value": "automated_one_shot_create_task",
        },
        {
          "column": 31,
          "line": 225,
          "type": "to",
          "value": "to",
        },
        {
          "column": 34,
          "line": 225,
          "type": "state",
          "value": "automated_one_shot_final_check",
        },
        {
          "column": 65,
          "line": 225,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 66,
          "line": 225,
          "type": "content",
          "value": "Call \`get_project\` to load created task and confirm it exists. Format output and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\` for a final internal consistency check. Your message format will be \`[requirements] This is a single task. Every part needs to be internally coherent and logically sound. Each part must build up to a cohesive whole and no contradictions are allowed. Work done must be atomic. Planning must be exhaustive. [specification] THE_TASK_SPECIFICATION\`. Wait for reply. Use \`oc-agentic-investigator\` as needed. Present synthesized final single-task.",
        },
        {
          "column": 41,
          "line": 231,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 232,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 233,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 233,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 233,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 234,
          "type": "state",
          "value": "automated_one_shot_final_check",
        },
        {
          "column": 31,
          "line": 234,
          "type": "to",
          "value": "to",
        },
        {
          "column": 34,
          "line": 234,
          "type": "state",
          "value": "automated_one_shot_execution",
        },
        {
          "column": 63,
          "line": 234,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 64,
          "line": 234,
          "type": "content",
          "value": "Proceed to execution of the single task without human intervention.",
        },
        {
          "column": 70,
          "line": 235,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 236,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 237,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 237,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 237,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 238,
          "type": "state",
          "value": "automated_one_shot_execution",
        },
        {
          "column": 29,
          "line": 238,
          "type": "to",
          "value": "to",
        },
        {
          "column": 32,
          "line": 238,
          "type": "state",
          "value": "automated_one_shot_loop_tasks",
        },
        {
          "column": 62,
          "line": 238,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 63,
          "line": 238,
          "type": "content",
          "value": "Find first (and only) unfinished task. Go to the task with \`goto\`. Extract all current task details from \`get_project\`.",
        },
        {
          "column": 55,
          "line": 241,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 242,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 243,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 243,
          "type": "content",
          "value": "Introspect: Has unfinished task.",
        },
        {
          "column": 35,
          "line": 243,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 244,
          "type": "state",
          "value": "automated_one_shot_loop_tasks",
        },
        {
          "column": 30,
          "line": 244,
          "type": "to",
          "value": "to",
        },
        {
          "column": 33,
          "line": 244,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 61,
          "line": 244,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 62,
          "line": 244,
          "type": "content",
          "value": "Pass the task to \`oc-agentic-executor\`. Your message format will be \`Do TASK_DETAILS\` where TASK_DETAILS is the full specification of the current active task verbatim. Wait for execution to complete. Pass the task and execution review to \`oc-agentic-reviewer\`. Your message format will be \`Based on TASK_DETAILS review the current changes as reported by EXECUTION_REVIEW\` where TASK_DETAILS is the full specification of the current active task verbatim and EXECUTION_REVIEW is the output produced by the executor. Wait for review to complete.",
        },
        {
          "column": 31,
          "line": 250,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 251,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 252,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 252,
          "type": "content",
          "value": "Introspect: Task not yet successfully completed.",
        },
        {
          "column": 51,
          "line": 252,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 253,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 28,
          "line": 253,
          "type": "to",
          "value": "to",
        },
        {
          "column": 31,
          "line": 253,
          "type": "state",
          "value": "automated_one_shot_redefine_task",
        },
        {
          "column": 64,
          "line": 253,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 65,
          "line": 253,
          "type": "content",
          "value": "Generate new sub plan that would satisfy task requirements. Format sub plan for \`update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task plan. Ensure that your plan remains within the constraints of the sub problems to solve.",
        },
        {
          "column": 270,
          "line": 260,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 261,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 262,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 262,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 262,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 263,
          "type": "state",
          "value": "automated_one_shot_redefine_task",
        },
        {
          "column": 33,
          "line": 263,
          "type": "to",
          "value": "to",
        },
        {
          "column": 36,
          "line": 263,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 64,
          "line": 263,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 264,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 265,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 265,
          "type": "content",
          "value": "Introspect: Task is complete. IMPORTANT: THIS IS STRICT 100% COMPLETION. YOU ARE NOT ALLOWED TO BYPASS THIS REQUIREMENT. DOING SO WILL CAUSE SERIOUS PROGRAM CORRUPTION.",
        },
        {
          "column": 171,
          "line": 265,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 266,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 28,
          "line": 266,
          "type": "to",
          "value": "to",
        },
        {
          "column": 31,
          "line": 266,
          "type": "state",
          "value": "automated_one_shot_all_tasks_complete",
        },
        {
          "column": 69,
          "line": 266,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 70,
          "line": 266,
          "type": "content",
          "value": "Call \`get_project\` to get full task details. Decide acceptability automatically using previously gathered validation results. Present completed work to human for review. Show synthesized execution summary and diffs. Provide the user with three choices: - Quick review: human inspects, provides concise feedback; system will synthesize comments and attempt automated fixes then resume automated execution. - Precise review: human will hand off to the main review chain for deeper human-driven acceptance and possible merge into the main workflow (all_tasks_complete). - Finish: accept and return to initial_loaded.",
        },
        {
          "column": 49,
          "line": 272,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 273,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 274,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 274,
          "type": "content",
          "value": "Ask: Do you want to perform a quick review?",
        },
        {
          "column": 47,
          "line": 274,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 275,
          "type": "state",
          "value": "automated_one_shot_all_tasks_complete",
        },
        {
          "column": 38,
          "line": 275,
          "type": "to",
          "value": "to",
        },
        {
          "column": 41,
          "line": 275,
          "type": "state",
          "value": "human_review_quick",
        },
        {
          "column": 60,
          "line": 275,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 61,
          "line": 275,
          "type": "content",
          "value": "Collect human feedback. Ask the user for explicit review notes and any blockers. Wait for user input. Synthesize feedback into concrete changelist This synthesized task plan MUST contain the following: 1. It must contain all the work already done. These sub-tasks should be classified as tasks that must be evaluated and reattempted if the evaluation failed. Evaluation means ensuring that the task is actually complete. 2. It must append all the new sub-tasks that must be completed. 3. It must not drop uncompleted sub-tasks from the current main task. Those must still be enforced. This list will be used in the next task execution",
        },
        {
          "column": 52,
          "line": 282,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 283,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 284,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 284,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 284,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 285,
          "type": "state",
          "value": "human_review_quick",
        },
        {
          "column": 19,
          "line": 285,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 285,
          "type": "state",
          "value": "automated_one_shot_loop_tasks",
        },
        {
          "column": 52,
          "line": 285,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 286,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 287,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 287,
          "type": "content",
          "value": "Ask: Do you want to perform a detailed review?",
        },
        {
          "column": 49,
          "line": 287,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 288,
          "type": "state",
          "value": "automated_one_shot_all_tasks_complete",
        },
        {
          "column": 38,
          "line": 288,
          "type": "to",
          "value": "to",
        },
        {
          "column": 41,
          "line": 288,
          "type": "state",
          "value": "human_review_detailed",
        },
        {
          "column": 63,
          "line": 288,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 64,
          "line": 288,
          "type": "content",
          "value": "Collect human feedback. Ask the user for explicit review notes and any blockers. Wait for user input. Synthesize feedback into concrete changelist This list will be used in the next task execution",
        },
        {
          "column": 52,
          "line": 291,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 292,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 293,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 293,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 293,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 294,
          "type": "state",
          "value": "human_review_detailed",
        },
        {
          "column": 22,
          "line": 294,
          "type": "to",
          "value": "to",
        },
        {
          "column": 25,
          "line": 294,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 34,
          "line": 294,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 295,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 296,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 296,
          "type": "content",
          "value": "Ask: Do you want to finish?",
        },
        {
          "column": 30,
          "line": 296,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 297,
          "type": "state",
          "value": "automated_one_shot_all_tasks_complete",
        },
        {
          "column": 38,
          "line": 297,
          "type": "to",
          "value": "to",
        },
        {
          "column": 41,
          "line": 297,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 56,
          "line": 297,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 298,
          "type": "eof",
          "value": "",
        },
      ]
    `);
  });
});
