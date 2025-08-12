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
          "value": "Ask: Do you want to start a fresh project with new tasks?",
        },
        {
          "column": 60,
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
          "value": "Ask to define the specifics of the first task for your new project. These specifics will be used to create the first task of your new independent project with \`create_task\` with (new="auto"). Detail the task specifics including type, scope, title, intent, objectives, and constraints.",
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
          "value": "Only fetch current commit changes using \`jj diff --summary -r @\` to understand what files have changed. Use \`oc-agentic-investigator\` to extract task details from actual file changes and commit context. You must explictly instruct for the following: Changes must be based off why a file was changed from its previous code to its current code. That change can be extracted using \`jj diff --context 0 --git -r @ FILENAME\` for the current changes. Ground your full understading of final outcomes with \`jj file show -r @ FILENAME\` for the file without diffs. YOU MUST NOT BASE IT OFF THE ENTIRE FILE'S CONTENT BLINDLY. Announce the investigator conclusions out loud. Use \`oc-agentic-inquisitor\` for iterative plan refinement until task specification accurately reflects completed work. Announce the inquisitor conclusions out loud. Create task documentation using \`create_task\` with (new="current") based on analysis of completed, not planned work. Completed work MUST ONLY BE COMPOSED OF ACTUAL CHANGES. ALL CHANGES MUST ONLY OCCUPY ONE TASK. ENSURE you ground your decisions the change of contents.",
        },
        {
          "column": 59,
          "line": 33,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 34,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 35,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 35,
          "type": "content",
          "value": "Do: When user is done clarifying their task.",
        },
        {
          "column": 47,
          "line": 35,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 36,
          "type": "state",
          "value": "create_task",
        },
        {
          "column": 12,
          "line": 36,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 36,
          "type": "state",
          "value": "checked_task",
        },
        {
          "column": 28,
          "line": 36,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 36,
          "type": "content",
          "value": "Format input for \`update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. \`THE_TASK_SPECIFICATION\` needs to have its multiple lines compressed into a single line. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is where I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your contextual understanding and ability to investigate to accept or reject points, synthesize new points, or make adjustments to the task. Clearly mark remaining uncertainties for the user to resolve. Present the reply including all automatic adjustments and uncertainties, then ask the user whether to apply or ignore recommendations.",
        },
        {
          "column": 137,
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
          "value": "Ask: Can you provide clarity on all the above points?",
        },
        {
          "column": 56,
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
          "value": "checked_task",
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
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 48,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 48,
          "type": "content",
          "value": "Ask: Would you like to proceed (anyway) to updating the task?",
        },
        {
          "column": 64,
          "line": 48,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 49,
          "type": "state",
          "value": "checked_task",
        },
        {
          "column": 13,
          "line": 49,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 49,
          "type": "state",
          "value": "commit_create_task",
        },
        {
          "column": 35,
          "line": 49,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 36,
          "line": 49,
          "type": "content",
          "value": "Consolidate everything discussed in detail, without missing anything, and use it to call \`create_task\` with (new="auto"). Wait for reply.",
        },
        {
          "column": 18,
          "line": 51,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 52,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 53,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 53,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 53,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 54,
          "type": "state",
          "value": "document_work_done",
        },
        {
          "column": 19,
          "line": 54,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 54,
          "type": "state",
          "value": "analyze_commit_changes",
        },
        {
          "column": 45,
          "line": 54,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 46,
          "line": 54,
          "type": "content",
          "value": "Run \`jj diff --summary -r @\` to get summary of current commit changes. Changes must be based off why a file was changed from its previous code to its current code. That change can be extracted using \`jj diff --context 0 --git -r @ FILENAME\` for the current changes. Ground your full understading of final outcomes with \`jj file show -r @ FILENAME\` for the file without diffs YOU MUST NOT BASE IT OFF THE ENTIRE FILE'S CONTENT BLINDLY. Extract file paths, change types, and modification patterns from diff output. Prepare context for commit analysis including changed files and their purposes.",
        },
        {
          "column": 82,
          "line": 60,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 61,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 62,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 62,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 62,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 63,
          "type": "state",
          "value": "analyze_commit_changes",
        },
        {
          "column": 23,
          "line": 63,
          "type": "to",
          "value": "to",
        },
        {
          "column": 26,
          "line": 63,
          "type": "state",
          "value": "investigate_changes",
        },
        {
          "column": 46,
          "line": 63,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 47,
          "line": 63,
          "type": "content",
          "value": "Pass commit analysis context to \`oc-agentic-investigator\`. Your message format will be \`I need to understand the work completed in this commit. Here are the file changes: DIFF_SUMMARY. I want to extract task details including type, scope, title, intent, objectives, and constraints based on actual changes made, not planned work. Can you help analyze what was actually accomplished?\`. Wait for investigator analysis of actual changes and their business impact. Extract technical details, scope of changes, and implementation approach from analysis.",
        },
        {
          "column": 90,
          "line": 67,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 68,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 69,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 69,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 69,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 70,
          "type": "state",
          "value": "investigate_changes",
        },
        {
          "column": 20,
          "line": 70,
          "type": "to",
          "value": "to",
        },
        {
          "column": 23,
          "line": 70,
          "type": "state",
          "value": "refine_task_spec",
        },
        {
          "column": 40,
          "line": 70,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 41,
          "line": 70,
          "type": "content",
          "value": "Format extracted task details and pass to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This task specification needs to accurately reflect completed work for retroactive documentation. The specification must be based on actual file changes and implementation details, not planned work. It MUST NOT overstate the scope and work done. Remember that we are supposed to state the CHANGES, not THE FINAL STATE  [specification] EXTRACTED_TASK_DETAILS\`. \`EXTRACTED_TASK_DETAILS\` needs to have its multiple lines compressed into a single line. Wait for inquisitor refinement of task specification. Iterate with inquisitor until task specification accurately captures completed work. Completed work MUST ONLY BE COMPOSED OF ACTUAL CHANGES. Ensure task type, scope, title, intent, objectives, and constraints reflect actual implementation.",
        },
        {
          "column": 101,
          "line": 75,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 76,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 77,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 77,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 77,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 78,
          "type": "state",
          "value": "refine_task_spec",
        },
        {
          "column": 17,
          "line": 78,
          "type": "to",
          "value": "to",
        },
        {
          "column": 20,
          "line": 78,
          "type": "state",
          "value": "create_documentation_task",
        },
        {
          "column": 46,
          "line": 78,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 47,
          "line": 78,
          "type": "content",
          "value": "Use refined task specification to call \`create_task\` with (new="current"). This will document the current commit with the analyzed task details. Ensure all task fields accurately reflect the completed work based on commit analysis. Wait for successful task creation.",
        },
        {
          "column": 37,
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
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 84,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 85,
          "type": "state",
          "value": "create_documentation_task",
        },
        {
          "column": 26,
          "line": 85,
          "type": "to",
          "value": "to",
        },
        {
          "column": 29,
          "line": 85,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 44,
          "line": 85,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 86,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 87,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 87,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 87,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 88,
          "type": "state",
          "value": "commit_create_task",
        },
        {
          "column": 19,
          "line": 88,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 88,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 35,
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
          "value": "Ask: Would you like to create a new task?",
        },
        {
          "column": 44,
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
          "value": "create_task",
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
          "value": "Ask to define the specifics of the task. These specifics will be used to create the task with \`create_task\` (without new parameter). Detail the task specifics including type, scope, title, intent, objectives, and constraints.",
        },
        {
          "column": 95,
          "line": 94,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 95,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 96,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 96,
          "type": "content",
          "value": "Ask: Are there any tasks you want to update?",
        },
        {
          "column": 47,
          "line": 96,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 97,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 97,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 97,
          "type": "state",
          "value": "update_task",
        },
        {
          "column": 28,
          "line": 97,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 97,
          "type": "content",
          "value": "Ask the details of the task the user wants to update. Create the new expected task details. Await for user to confirm or continue refining the task. On confirmation, proceed to update the task with \`update_task\`.",
        },
        {
          "column": 66,
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
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 103,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 104,
          "type": "state",
          "value": "update_task",
        },
        {
          "column": 12,
          "line": 104,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 104,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 28,
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
          "value": "Ask: Would you like to delete a specific task or tasks?",
        },
        {
          "column": 58,
          "line": 106,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 107,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 107,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 107,
          "type": "state",
          "value": "delete_task",
        },
        {
          "column": 28,
          "line": 107,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 107,
          "type": "content",
          "value": "Call \`delete_task\` to delete task in question. Wait for reply.",
        },
        {
          "column": 18,
          "line": 109,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 110,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 111,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 111,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 111,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 112,
          "type": "state",
          "value": "delete_task",
        },
        {
          "column": 12,
          "line": 112,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 112,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 28,
          "line": 112,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 113,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 114,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 114,
          "type": "content",
          "value": "Ask: Would you like to reorder specific tasks?",
        },
        {
          "column": 49,
          "line": 114,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 115,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 115,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 115,
          "type": "state",
          "value": "reorder_tasks",
        },
        {
          "column": 30,
          "line": 115,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 31,
          "line": 115,
          "type": "content",
          "value": "Call \`reorder_tasks\` to reorder tasks. Wait for reply.",
        },
        {
          "column": 18,
          "line": 117,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 118,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 119,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 119,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 119,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 120,
          "type": "state",
          "value": "reorder_tasks",
        },
        {
          "column": 14,
          "line": 120,
          "type": "to",
          "value": "to",
        },
        {
          "column": 17,
          "line": 120,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 30,
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
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 122,
          "type": "content",
          "value": "Ask: Would you like to proceed to do a final check?",
        },
        {
          "column": 54,
          "line": 122,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 123,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 123,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 123,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 28,
          "line": 123,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 123,
          "type": "content",
          "value": "NEVER SKIP THIS EVEN IF IT WAS DONE BEFORE. QUESTIONS CAN CHANGE. Get full task list with \`get_project\`. Format output of \`get_project\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This is a full task list. Every part needs to be internally coherent and logically sound. Each part must build up to a cohesive whole and no contradictions are allowed. Work done must be atomic. Planning must be exhaustive. [specification] THE_TASK_LIST_SPECIFICATION\`. \`THE_TASK_LIST_SPECIFICATION\` needs to have its multiple lines compressed into a single line. Wait for reply from \`oc-agentic-inquisitor\`. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task list, leaving points with uncertainty as an exercise to the user to clarify. Present the synthesized full task list to the user, leaving no details out.",
        },
        {
          "column": 78,
          "line": 132,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 133,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 134,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 134,
          "type": "content",
          "value": "Ask: Do you accept these changes as the full task list?",
        },
        {
          "column": 58,
          "line": 134,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 135,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 12,
          "line": 135,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 135,
          "type": "state",
          "value": "parallel_update",
        },
        {
          "column": 31,
          "line": 135,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 32,
          "line": 135,
          "type": "content",
          "value": "Update any tasks with any points that the user clarifies. Commit these changes in tasks with \`update_task\` Commit these changes in task order with \`reorder_tasks\` Commit these changes in task deletion with \`delete_task\`",
        },
        {
          "column": 59,
          "line": 139,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 140,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 141,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 141,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 141,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 142,
          "type": "state",
          "value": "parallel_update",
        },
        {
          "column": 16,
          "line": 142,
          "type": "to",
          "value": "to",
        },
        {
          "column": 19,
          "line": 142,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 31,
          "line": 142,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 143,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 144,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 144,
          "type": "content",
          "value": "Ask: Do want to continue on?",
        },
        {
          "column": 31,
          "line": 144,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 145,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 12,
          "line": 145,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 145,
          "type": "state",
          "value": "execution",
        },
        {
          "column": 25,
          "line": 145,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 26,
          "line": 145,
          "type": "content",
          "value": "Update any tasks with any points that the user clarifies. Commit these changes in tasks with \`update_task\` Commit these changes in task order with \`reorder_tasks\` Commit these changes in task deletion with \`delete_task\` Call \`get_project\` to get full task details.",
        },
        {
          "column": 47,
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
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 152,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 153,
          "type": "state",
          "value": "execution",
        },
        {
          "column": 10,
          "line": 153,
          "type": "to",
          "value": "to",
        },
        {
          "column": 13,
          "line": 153,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 24,
          "line": 153,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 25,
          "line": 153,
          "type": "content",
          "value": "Find first unfinished task. Go to first incomplete task with \`goto\`. Extract all current task details from \`get_project\`.",
        },
        {
          "column": 55,
          "line": 156,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 157,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 158,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 158,
          "type": "content",
          "value": "Introspect: Has unfinished task.",
        },
        {
          "column": 35,
          "line": 158,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 159,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 11,
          "line": 159,
          "type": "to",
          "value": "to",
        },
        {
          "column": 14,
          "line": 159,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 23,
          "line": 159,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 24,
          "line": 159,
          "type": "content",
          "value": "Pass the task to \`oc-agentic-executor\`. Your message format will be \`Do TASK_DETAILS\` where TASK_DETAILS is the full specification of the current active task verbatim. Wait for execution to complete. Pass the task to \`oc-agentic-reviewer\`. Your message format will be \`Based on TASK_DETAILS review the current changes as reported by EXECUTION_REVIEW\` where TASK_DETAILS is the full specification of the current active task verbatim and EXECUTION_REVIEW is the output produced by the executor. Wait for review to complete.",
        },
        {
          "column": 31,
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
          "value": "Introspect: Task is complete. IMPORTANT: THIS IS STRICT 100% COMPLETION. YOU ARE NOT ALLOWED TO BYPASS THIS REQUIREMENT. DOING SO WILL CAUSE SERIOUS PROGRAM CORRUPTION.",
        },
        {
          "column": 171,
          "line": 167,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 168,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 9,
          "line": 168,
          "type": "to",
          "value": "to",
        },
        {
          "column": 12,
          "line": 168,
          "type": "state",
          "value": "mark_task",
        },
        {
          "column": 22,
          "line": 168,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 23,
          "line": 168,
          "type": "content",
          "value": "Synthesize current task specification with actual work done to produce updated task. Be precise with your editing. Call \`update_task\` to update the task as completed with new details.",
        },
        {
          "column": 71,
          "line": 171,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 172,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 173,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 173,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 173,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 174,
          "type": "state",
          "value": "mark_task",
        },
        {
          "column": 10,
          "line": 174,
          "type": "to",
          "value": "to",
        },
        {
          "column": 13,
          "line": 174,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 24,
          "line": 174,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 175,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 176,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 176,
          "type": "content",
          "value": "Introspect: Task not yet successfully completed.",
        },
        {
          "column": 51,
          "line": 176,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 177,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 9,
          "line": 177,
          "type": "to",
          "value": "to",
        },
        {
          "column": 12,
          "line": 177,
          "type": "state",
          "value": "redefine_task",
        },
        {
          "column": 26,
          "line": 177,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 27,
          "line": 177,
          "type": "content",
          "value": "Generate new sub plan that would satisfy task requirements. Format sub plan for \`update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. \`THE_TASK_SPECIFICATION\` needs to have its multiple lines compressed into a single line. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task. Ensure that your plan remains within the constraints of the sub problems to solve. This synthesized task plan MUST contain the following: 1. It must contain all the work already done. These sub-tasks should be classified as tasks that must be evaluated and reattempted if the evaluation failed. Evaluation means ensuring that the task is actually complete. 2. It must append all the new sub-tasks that must be completed. 3. It must not drop uncompleted sub-tasks from the current main task. Those must still be enforced.",
        },
        {
          "column": 102,
          "line": 188,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 189,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 190,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 190,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 190,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 191,
          "type": "state",
          "value": "redefine_task",
        },
        {
          "column": 14,
          "line": 191,
          "type": "to",
          "value": "to",
        },
        {
          "column": 17,
          "line": 191,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 26,
          "line": 191,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 192,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 193,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 193,
          "type": "content",
          "value": "Introspect: All tasks complete",
        },
        {
          "column": 33,
          "line": 193,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 194,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 11,
          "line": 194,
          "type": "to",
          "value": "to",
        },
        {
          "column": 14,
          "line": 194,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 33,
          "line": 194,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 34,
          "line": 194,
          "type": "content",
          "value": "Call \`get_project\` to get full task details. Present reply to user",
        },
        {
          "column": 24,
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
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 198,
          "type": "content",
          "value": "User is satisfied with output",
        },
        {
          "column": 32,
          "line": 198,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 199,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 19,
          "line": 199,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 199,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 37,
          "line": 199,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 200,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 201,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 201,
          "type": "content",
          "value": "User is unsatisfied with output",
        },
        {
          "column": 34,
          "line": 201,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 202,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 19,
          "line": 202,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 202,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 35,
          "line": 202,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
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
          "value": "Ask: Do you want to run an automated one-shot task (fully automated, no further human interaction)?",
        },
        {
          "column": 102,
          "line": 205,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 206,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 15,
          "line": 206,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 206,
          "type": "state",
          "value": "automated_one_shot_define_task",
        },
        {
          "column": 49,
          "line": 206,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 50,
          "line": 206,
          "type": "content",
          "value": "Ask to define the specifics of the single task. These specifics will be used to fulfill the arguments to \`create_task\` with (new="auto"). This automated flow will create a single task and fully execute it without human interaction.",
        },
        {
          "column": 96,
          "line": 209,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 210,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 211,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 211,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 211,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 212,
          "type": "state",
          "value": "automated_one_shot_define_task",
        },
        {
          "column": 31,
          "line": 212,
          "type": "to",
          "value": "to",
        },
        {
          "column": 34,
          "line": 212,
          "type": "state",
          "value": "automated_one_shot_create_task",
        },
        {
          "column": 65,
          "line": 212,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 66,
          "line": 212,
          "type": "content",
          "value": "Synthesize the single-task specifics. Pass the task specifics to agent \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how plans will be formed during execution. Plans that derive from this must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. \`THE_TASK_SPECIFICATION\` needs to have its multiple lines compressed into a single line. THE_TASK_SPECIFICATION is the contents of the task specifics you would have passed to \`create_task\` with (new="auto"). Wait for reply from \`oc-agentic-inquisitor\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task. Present the synthesized single-task specifics. Update the task specifics based on the inquisitor reply. Pass the updated single-task specification to \`oc-agentic-inquisitor\` again using the same message format as above. Use \`oc-agentic-investigator\` as needed for codebase checks. Present final synthesized single-task specification ready for creation. Call \`create_task\` with (new="auto") with the final synthesized single-task specifics. Wait for successful reply.",
        },
        {
          "column": 29,
          "line": 228,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 229,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 230,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 230,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 230,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 231,
          "type": "state",
          "value": "automated_one_shot_create_task",
        },
        {
          "column": 31,
          "line": 231,
          "type": "to",
          "value": "to",
        },
        {
          "column": 34,
          "line": 231,
          "type": "state",
          "value": "automated_one_shot_final_check",
        },
        {
          "column": 65,
          "line": 231,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 66,
          "line": 231,
          "type": "content",
          "value": "Call \`get_project\` to load created task and confirm it exists. Find the newly created task in the task list. Call \`goto\` with the task_key of the newly created task to position to it. Wait for successful positioning. Format output and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\` for a final internal consistency check. Your message format will be \`[requirements] This is a single task. Every part needs to be internally coherent and logically sound. Each part must build up to a cohesive whole and no contradictions are allowed. Work done must be atomic. Planning must be exhaustive. [specification] THE_TASK_SPECIFICATION\`. \`THE_TASK_SPECIFICATION\` needs to have its multiple lines compressed into a single line. Wait for reply. Use \`oc-agentic-investigator\` as needed. Present synthesized final single-task.",
        },
        {
          "column": 41,
          "line": 240,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 241,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 242,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 242,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 242,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 243,
          "type": "state",
          "value": "automated_one_shot_final_check",
        },
        {
          "column": 31,
          "line": 243,
          "type": "to",
          "value": "to",
        },
        {
          "column": 34,
          "line": 243,
          "type": "state",
          "value": "automated_one_shot_execution",
        },
        {
          "column": 63,
          "line": 243,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 64,
          "line": 243,
          "type": "content",
          "value": "Proceed to execution of the single task without human intervention.",
        },
        {
          "column": 70,
          "line": 244,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 245,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 246,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 246,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 246,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 247,
          "type": "state",
          "value": "automated_one_shot_execution",
        },
        {
          "column": 29,
          "line": 247,
          "type": "to",
          "value": "to",
        },
        {
          "column": 32,
          "line": 247,
          "type": "state",
          "value": "automated_one_shot_loop_tasks",
        },
        {
          "column": 62,
          "line": 247,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 63,
          "line": 247,
          "type": "content",
          "value": "Extract all current task details from \`get_project\`. Verify the task is positioned correctly and ready for execution.",
        },
        {
          "column": 67,
          "line": 249,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 250,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 251,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 251,
          "type": "content",
          "value": "Introspect: Has unfinished task.",
        },
        {
          "column": 35,
          "line": 251,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 252,
          "type": "state",
          "value": "automated_one_shot_loop_tasks",
        },
        {
          "column": 30,
          "line": 252,
          "type": "to",
          "value": "to",
        },
        {
          "column": 33,
          "line": 252,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 61,
          "line": 252,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 62,
          "line": 252,
          "type": "content",
          "value": "Pass the task to \`oc-agentic-executor\`. Your message format will be \`Do TASK_DETAILS\` where TASK_DETAILS is the full specification of the current active task verbatim. Wait for execution to complete. Pass the task and execution review to \`oc-agentic-reviewer\`. Your message format will be \`Based on TASK_DETAILS review the current changes as reported by EXECUTION_REVIEW\` where TASK_DETAILS is the full specification of the current active task verbatim and EXECUTION_REVIEW is the output produced by the executor. Wait for review to complete.",
        },
        {
          "column": 31,
          "line": 258,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 259,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 260,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 260,
          "type": "content",
          "value": "Introspect: Task not yet successfully completed.",
        },
        {
          "column": 51,
          "line": 260,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 261,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 28,
          "line": 261,
          "type": "to",
          "value": "to",
        },
        {
          "column": 31,
          "line": 261,
          "type": "state",
          "value": "automated_one_shot_redefine_task",
        },
        {
          "column": 64,
          "line": 261,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 65,
          "line": 261,
          "type": "content",
          "value": "Synthesize new sub plan that would satisfy task requirements. Format sub plan for \`update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. \`THE_TASK_SPECIFICATION\` needs to have its multiple lines compressed into a single line. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task plan. Ensure that your plan remains within the constraints of the sub problems to solve. Call \`update_task\` to update the task as with refined requirements. Ensure that you do not override previous requirements, only add or refine them. Wait for successful task update.",
        },
        {
          "column": 35,
          "line": 270,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 271,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 272,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 272,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 272,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 273,
          "type": "state",
          "value": "automated_one_shot_redefine_task",
        },
        {
          "column": 33,
          "line": 273,
          "type": "to",
          "value": "to",
        },
        {
          "column": 36,
          "line": 273,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 64,
          "line": 273,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 274,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 275,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 275,
          "type": "content",
          "value": "Introspect: Task is complete. IMPORTANT: THIS IS STRICT 100% COMPLETION. YOU ARE NOT ALLOWED TO BYPASS THIS REQUIREMENT. DOING SO WILL CAUSE SERIOUS PROGRAM CORRUPTION.",
        },
        {
          "column": 171,
          "line": 275,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 276,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 28,
          "line": 276,
          "type": "to",
          "value": "to",
        },
        {
          "column": 31,
          "line": 276,
          "type": "state",
          "value": "automated_one_shot_all_tasks_complete",
        },
        {
          "column": 69,
          "line": 276,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 70,
          "line": 276,
          "type": "content",
          "value": "Synthesize current task specification with actual work done to produce updated task. Be precise with your editing. Call \`update_task\` to update the task as completed with new details. Wait for successful task update. Call \`get_project\` to get full task details. Decide acceptability automatically using previously gathered validation results. Present completed work to human for review. Show synthesized execution summary and diffs. Provide the user with three choices: - Quick review: human inspects, provides concise feedback; system will synthesize comments and attempt automated fixes then resume automated execution. - Precise review: human will hand off to the main review chain for deeper human-driven acceptance and possible merge into the main workflow (all_tasks_complete). - Finish: accept and return to initial_loaded.",
        },
        {
          "column": 49,
          "line": 286,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 287,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 288,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 288,
          "type": "content",
          "value": "Ask: Do you want to perform a quick review?",
        },
        {
          "column": 47,
          "line": 288,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 289,
          "type": "state",
          "value": "automated_one_shot_all_tasks_complete",
        },
        {
          "column": 38,
          "line": 289,
          "type": "to",
          "value": "to",
        },
        {
          "column": 41,
          "line": 289,
          "type": "state",
          "value": "human_review_quick",
        },
        {
          "column": 60,
          "line": 289,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 61,
          "line": 289,
          "type": "content",
          "value": "Collect human feedback. Ask the user for explicit review notes and any blockers. Wait for user input. Synthesize feedback into concrete changelist This synthesized task plan MUST contain the following: 1. It must contain all the work already done. These sub-tasks should be classified as tasks that must be evaluated and reattempted if the evaluation failed. Evaluation means ensuring that the task is actually complete. 2. It must append all the new sub-tasks that must be completed. 3. It must not drop uncompleted sub-tasks from the current main task. Those must still be enforced. This list will be used in the next task execution Call \`update_task\` to update the task as with refined requirements. Ensure that you do not override previous requirements, only add or refine them.",
        },
        {
          "column": 150,
          "line": 297,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 298,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 299,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 299,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 299,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 300,
          "type": "state",
          "value": "human_review_quick",
        },
        {
          "column": 19,
          "line": 300,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 300,
          "type": "state",
          "value": "automated_one_shot_loop_tasks",
        },
        {
          "column": 52,
          "line": 300,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 301,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 302,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 302,
          "type": "content",
          "value": "Ask: Do you want to perform a detailed review?",
        },
        {
          "column": 49,
          "line": 302,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 303,
          "type": "state",
          "value": "automated_one_shot_all_tasks_complete",
        },
        {
          "column": 38,
          "line": 303,
          "type": "to",
          "value": "to",
        },
        {
          "column": 41,
          "line": 303,
          "type": "state",
          "value": "human_review_detailed",
        },
        {
          "column": 63,
          "line": 303,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 64,
          "line": 303,
          "type": "content",
          "value": "Collect human feedback. Ask the user for explicit review notes and any blockers. Wait for user input. Synthesize feedback into concrete changelist This list will be used in the next task execution Call \`update_task\` to update the task as with refined requirements. Ensure that you do not override previous requirements, only add or refine them.",
        },
        {
          "column": 150,
          "line": 307,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 308,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 309,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 309,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 309,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 310,
          "type": "state",
          "value": "human_review_detailed",
        },
        {
          "column": 22,
          "line": 310,
          "type": "to",
          "value": "to",
        },
        {
          "column": 25,
          "line": 310,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 34,
          "line": 310,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 311,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 312,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 312,
          "type": "content",
          "value": "Ask: Do you want to finish?",
        },
        {
          "column": 30,
          "line": 312,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 313,
          "type": "state",
          "value": "automated_one_shot_all_tasks_complete",
        },
        {
          "column": 38,
          "line": 313,
          "type": "to",
          "value": "to",
        },
        {
          "column": 41,
          "line": 313,
          "type": "state",
          "value": "task_finished",
        },
        {
          "column": 55,
          "line": 313,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 56,
          "line": 313,
          "type": "content",
          "value": "Call \`update_task\` to mark the task as completed.",
        },
        {
          "column": 52,
          "line": 314,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 315,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 316,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 316,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 316,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 317,
          "type": "state",
          "value": "task_finished",
        },
        {
          "column": 14,
          "line": 317,
          "type": "to",
          "value": "to",
        },
        {
          "column": 17,
          "line": 317,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 32,
          "line": 317,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 318,
          "type": "eof",
          "value": "",
        },
      ]
    `);
  });
});
