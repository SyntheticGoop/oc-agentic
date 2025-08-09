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
          "line": 2,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 3,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 3,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 3,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 4,
          "type": "star",
          "value": "*",
        },
        {
          "column": 2,
          "line": 4,
          "type": "to",
          "value": "to",
        },
        {
          "column": 5,
          "line": 4,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 20,
          "line": 4,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 21,
          "line": 4,
          "type": "content",
          "value": "Call \`planner_get_project\` to load current scope of work. List summary of files changed with \`jj diff --summary -r @\` Wait for scope of work. Display current scope of work status to the user.",
        },
        {
          "column": 52,
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
          "value": "Ask: Do you want to continue the scope of work?",
        },
        {
          "column": 50,
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
          "value": "refine_tasks",
        },
        {
          "column": 31,
          "line": 11,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 12,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 13,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 13,
          "type": "content",
          "value": "Ask: Do you want to start a new scope of work?",
        },
        {
          "column": 49,
          "line": 13,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 14,
          "type": "state",
          "value": "initial_loaded",
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
          "value": "define_project",
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
          "type": "content",
          "value": "Ask to define the specifics of the scope of work. These specifics will be used to fulfill the arguments to \`planner_create_project\`. Detail the specifics.",
        },
        {
          "column": 24,
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
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 19,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 20,
          "type": "state",
          "value": "define_project",
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
          "type": "colon",
          "value": ":",
        },
        {
          "column": 34,
          "line": 20,
          "type": "content",
          "value": "Synthesize the scope of work specifics. Pass the scope of work specifics to agent \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how plans will be formed during execution. Plans that derive from this must be strictly deterministic [specification] THE_PROJECT_SPECIFICATION\`. THE_SCOPE_OF_WORK_SPECIFICATION is the contents of the scope of work specifics you would have passed to \`planner_create_project\`. Wait for reply from \`oc-agentic-inquisitor\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the project, leaving points with uncertainty as an exercise to the user to clarify. Present the scope of work specifics with updated points.",
        },
        {
          "column": 59,
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
          "value": "Ask: Can you provide clarity on all the above points?",
        },
        {
          "column": 56,
          "line": 32,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 33,
          "type": "state",
          "value": "refine_project",
        },
        {
          "column": 15,
          "line": 33,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 33,
          "type": "state",
          "value": "refine_project",
        },
        {
          "column": 33,
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
          "value": "Ask: Would you like to proceed (anyway) to creating the scope of work?",
        },
        {
          "column": 73,
          "line": 35,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 36,
          "type": "state",
          "value": "refine_project",
        },
        {
          "column": 15,
          "line": 36,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 36,
          "type": "state",
          "value": "create_project",
        },
        {
          "column": 33,
          "line": 36,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 34,
          "line": 36,
          "type": "content",
          "value": "Call \`planner_create_project\` with the final synthesized project specifics from all the clarifications. Wait for successful reply.",
        },
        {
          "column": 29,
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
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 40,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 40,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 41,
          "type": "state",
          "value": "create_project",
        },
        {
          "column": 15,
          "line": 41,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 41,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 31,
          "line": 41,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 32,
          "line": 41,
          "type": "content",
          "value": "Get current scope of work with \`planner_get_project\`. Display current tasks.",
        },
        {
          "column": 25,
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
          "value": "Ask: Is there a task you want to alter? What are the details?",
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
          "type": "content",
          "value": "Format input for \`planner_update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the scope of work, leaving points with uncertainty as an exercise to the user to clarify. Present reply and interrogate them with the response questions.",
        },
        {
          "column": 66,
          "line": 53,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 54,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 55,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 55,
          "type": "content",
          "value": "Ask: Can you provide clarity on all the above points",
        },
        {
          "column": 55,
          "line": 55,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 56,
          "type": "state",
          "value": "check_tasks",
        },
        {
          "column": 12,
          "line": 56,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 56,
          "type": "state",
          "value": "check_tasks",
        },
        {
          "column": 27,
          "line": 56,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 57,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 58,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 58,
          "type": "content",
          "value": "Ask: Would you like to proceed (anyway) to updating the task?",
        },
        {
          "column": 64,
          "line": 58,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 59,
          "type": "state",
          "value": "check_tasks",
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
          "value": "update_task",
        },
        {
          "column": 27,
          "line": 59,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 28,
          "line": 59,
          "type": "content",
          "value": "Pass input to \`planner_update_task\`. Wait for reply.",
        },
        {
          "column": 18,
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
          "value": "update_task",
        },
        {
          "column": 12,
          "line": 64,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 64,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 28,
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
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 66,
          "type": "content",
          "value": "Ask: Would you like to delete a specific task or tasks?",
        },
        {
          "column": 58,
          "line": 66,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 67,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 67,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 67,
          "type": "state",
          "value": "delete_task",
        },
        {
          "column": 28,
          "line": 67,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 67,
          "type": "content",
          "value": "Call \`planner_delete_task\` to delete task in question. Wait for reply.",
        },
        {
          "column": 18,
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
          "type": "state",
          "value": "delete_task",
        },
        {
          "column": 12,
          "line": 71,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 71,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 28,
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
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 73,
          "type": "content",
          "value": "Ask: Would you like to reorder specific tasks?",
        },
        {
          "column": 49,
          "line": 73,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 74,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 74,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 74,
          "type": "state",
          "value": "reorder_tasks",
        },
        {
          "column": 30,
          "line": 74,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 31,
          "line": 74,
          "type": "content",
          "value": "Call \`planner_reorder_tasks\` to reorder tasks. Wait for reply.",
        },
        {
          "column": 18,
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
          "value": "reorder_tasks",
        },
        {
          "column": 14,
          "line": 79,
          "type": "to",
          "value": "to",
        },
        {
          "column": 17,
          "line": 79,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 30,
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
          "value": "Ask: Would you like to proceed to do a final check?",
        },
        {
          "column": 54,
          "line": 81,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 82,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 13,
          "line": 82,
          "type": "to",
          "value": "to",
        },
        {
          "column": 16,
          "line": 82,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 28,
          "line": 82,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 29,
          "line": 82,
          "type": "content",
          "value": "NEVER SKIP THIS EVEN IF IT WAS DONE BEFORE. QUESTIONS CAN CHANGE. Get full scope of work state with \`planner_get_project\`. Format output of \`planner_get_project\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This is a full scope of work. Every part needs to be internally coherent and logically sound. Each part must build up to a cohesive whole and no contradictions are allowed. Work done must be atomic. Planning must be exhaustive. [specification] THE_SCOPE_OF_WORK_SPECIFICATION\`. Wait for reply from \`oc-agentic-inquisitor\`. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the scope of work, leaving points with uncertainty as an exercise to the user to clarify. Present the synthesized full scope of work to the user, leaving no details out.",
        },
        {
          "column": 82,
          "line": 91,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 92,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 93,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 93,
          "type": "content",
          "value": "Ask: Do you accept these changes as the full scope of work??",
        },
        {
          "column": 63,
          "line": 93,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 94,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 12,
          "line": 94,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 94,
          "type": "state",
          "value": "parallel_update",
        },
        {
          "column": 31,
          "line": 94,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 32,
          "line": 94,
          "type": "content",
          "value": "Update any scope with any points that the user clarifies. Commit these changes in project with \`planner_update_project\` Commit these changes in tasks with \`planner_update_task\` Commit these changes in task order with \`planner_reoder_tasks\` Commit these changes in task deletion with \`planner_delete_task\`",
        },
        {
          "column": 67,
          "line": 99,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 100,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 101,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 101,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 101,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 102,
          "type": "state",
          "value": "parallel_update",
        },
        {
          "column": 16,
          "line": 102,
          "type": "to",
          "value": "to",
        },
        {
          "column": 19,
          "line": 102,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 31,
          "line": 102,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 103,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 104,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 104,
          "type": "content",
          "value": "Ask: Do want to continue on?",
        },
        {
          "column": 31,
          "line": 104,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 105,
          "type": "state",
          "value": "final_check",
        },
        {
          "column": 12,
          "line": 105,
          "type": "to",
          "value": "to",
        },
        {
          "column": 15,
          "line": 105,
          "type": "state",
          "value": "execution",
        },
        {
          "column": 25,
          "line": 105,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 26,
          "line": 105,
          "type": "content",
          "value": "Update any scope with any points that the user clarifies. Commit these changes in project with \`planner_update_project\` Commit these changes in tasks with \`planner_update_task\` Commit these changes in task order with \`planner_reoder_tasks\` Commit these changes in task deletion with \`planner_delete_task\` Call \`planner_get_project\` to get full project details.",
        },
        {
          "column": 58,
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
          "value": "execution",
        },
        {
          "column": 10,
          "line": 114,
          "type": "to",
          "value": "to",
        },
        {
          "column": 13,
          "line": 114,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 24,
          "line": 114,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 25,
          "line": 114,
          "type": "content",
          "value": "Find first unfinished task. Go to first incomplete task with \`planner_goto\`. Extract all current task details from \`planner_get_project\`.",
        },
        {
          "column": 63,
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
          "value": "Introspect: Has unfinished task.",
        },
        {
          "column": 35,
          "line": 119,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 120,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 11,
          "line": 120,
          "type": "to",
          "value": "to",
        },
        {
          "column": 14,
          "line": 120,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 23,
          "line": 120,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 24,
          "line": 120,
          "type": "content",
          "value": "Pass the task to \`oc-agentic-executor\`. Your message format will be \`Do TASK_DETAILS\` where TASK_DETAILS is the full specification of the current active task verbatim. Wait for execution to complete. Pass the task to \`oc-agentic-reiviewer\`. Your message format will be \`Based on TASK_DETAILS review the current changes as reported by EXECUTION_REVIEW\` where TASK_DETAILS is the full specification of the current active task verbatim and EXECUTION_REVIEW is the output produced by the executor. Wait for review to complete.",
        },
        {
          "column": 31,
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
          "value": "Introspect: Task is complete. IMPORTANT: THIS IS STRICT 100% COMPLETION. YOU ARE NOT ALLOWED TO BYPASS THIS REQUIREMENT. DOING SO WILL CAUSE SERIOUS PROGRAM CORRUPTION.",
        },
        {
          "column": 171,
          "line": 128,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 129,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 9,
          "line": 129,
          "type": "to",
          "value": "to",
        },
        {
          "column": 12,
          "line": 129,
          "type": "state",
          "value": "mark_task",
        },
        {
          "column": 22,
          "line": 129,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 23,
          "line": 129,
          "type": "content",
          "value": "Synthesize current task specification with actual work done to produce updated task. Be precise with your editing. Call \`planner_update_task\` to update the task as completed with new details.",
        },
        {
          "column": 79,
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
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 134,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 135,
          "type": "state",
          "value": "mark_task",
        },
        {
          "column": 10,
          "line": 135,
          "type": "to",
          "value": "to",
        },
        {
          "column": 13,
          "line": 135,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 24,
          "line": 135,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 136,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 137,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 137,
          "type": "content",
          "value": "Introspect: Task not yet successfully completed.",
        },
        {
          "column": 51,
          "line": 137,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 138,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 9,
          "line": 138,
          "type": "to",
          "value": "to",
        },
        {
          "column": 12,
          "line": 138,
          "type": "state",
          "value": "redefine_task",
        },
        {
          "column": 26,
          "line": 138,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 27,
          "line": 138,
          "type": "content",
          "value": "Generate new sub plan that would satisfy task requirements. Format sub plan for \`planner_update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the scope of work. Ensure that your plan remains within the constraints of the sub problems to solve.",
        },
        {
          "column": 274,
          "line": 145,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 146,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 147,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 147,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 147,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 148,
          "type": "state",
          "value": "redefine_task",
        },
        {
          "column": 14,
          "line": 148,
          "type": "to",
          "value": "to",
        },
        {
          "column": 17,
          "line": 148,
          "type": "state",
          "value": "run_task",
        },
        {
          "column": 26,
          "line": 148,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 149,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 150,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 150,
          "type": "content",
          "value": "Introspect: All tasks complete",
        },
        {
          "column": 33,
          "line": 150,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 151,
          "type": "state",
          "value": "loop_tasks",
        },
        {
          "column": 11,
          "line": 151,
          "type": "to",
          "value": "to",
        },
        {
          "column": 14,
          "line": 151,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 33,
          "line": 151,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 34,
          "line": 151,
          "type": "content",
          "value": "Call \`planner_get_project\` to get full project details. Present reply to user",
        },
        {
          "column": 24,
          "line": 153,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 154,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 155,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 155,
          "type": "content",
          "value": "User is satisfied with output",
        },
        {
          "column": 32,
          "line": 155,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 156,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 19,
          "line": 156,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 156,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 37,
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
          "value": "User is unsatisfied with output",
        },
        {
          "column": 34,
          "line": 158,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 159,
          "type": "state",
          "value": "all_tasks_complete",
        },
        {
          "column": 19,
          "line": 159,
          "type": "to",
          "value": "to",
        },
        {
          "column": 22,
          "line": 159,
          "type": "state",
          "value": "refine_tasks",
        },
        {
          "column": 35,
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
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 162,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 162,
          "type": "content",
          "value": "Ask: Do you want to run an automated one-shot scope of work (fully automated, no further human interaction)?",
        },
        {
          "column": 111,
          "line": 162,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 163,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 15,
          "line": 163,
          "type": "to",
          "value": "to",
        },
        {
          "column": 18,
          "line": 163,
          "type": "state",
          "value": "automated_one_shot_define_project",
        },
        {
          "column": 52,
          "line": 163,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 53,
          "line": 163,
          "type": "content",
          "value": "Ask to define the specifics of the single-task scope of work. These specifics will be used to fulfill the arguments to \`planner_create_project\`. This automated flow will create a single-task project and fully execute it without human interaction.",
        },
        {
          "column": 104,
          "line": 166,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 167,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 168,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 168,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 168,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 169,
          "type": "state",
          "value": "automated_one_shot_define_project",
        },
        {
          "column": 34,
          "line": 169,
          "type": "to",
          "value": "to",
        },
        {
          "column": 37,
          "line": 169,
          "type": "state",
          "value": "automated_one_shot_create_project",
        },
        {
          "column": 71,
          "line": 169,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 72,
          "line": 169,
          "type": "content",
          "value": "Synthesize the single-task scope of work specifics. Pass the scope of work specifics to agent \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how plans will be formed during execution. Plans that derive from this must be strictly deterministic [specification] THE_PROJECT_SPECIFICATION\`. THE_SCOPE_OF_WORK_SPECIFICATION is the contents of the scope of work specifics you would have passed to \`planner_create_project\`. Wait for reply from \`oc-agentic-inquisitor\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the project. Present the synthesized single-task project specifics. Update the project specifics based on the inquisitor reply. Pass the updated single-task specification to \`oc-agentic-inquisitor\` again using the same message format as above. Use \`oc-agentic-investigator\` as needed for codebase checks. Present final synthesized single-task specification ready for creation. Call \`planner_create_project\` with the final synthesized single-task project specifics ensuring the project contains exactly one task. Wait for successful reply.",
        },
        {
          "column": 29,
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
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 187,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 188,
          "type": "state",
          "value": "automated_one_shot_create_project",
        },
        {
          "column": 34,
          "line": 188,
          "type": "to",
          "value": "to",
        },
        {
          "column": 37,
          "line": 188,
          "type": "state",
          "value": "automated_one_shot_final_check",
        },
        {
          "column": 68,
          "line": 188,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 69,
          "line": 188,
          "type": "content",
          "value": "Call \`planner_get_project\` to load created project and confirm it contains a single task. Format output and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\` for a final internal consistency check. Your message format will be \`[requirements] This is a full single-task scope of work. Every part needs to be internally coherent and logically sound. Each part must build up to a cohesive whole and no contradictions are allowed. Work done must be atomic. Planning must be exhaustive. [specification] THE_SCOPE_OF_WORK_SPECIFICATION\`. Wait for reply. Use \`oc-agentic-investigator\` as needed. Present synthesized final single-task project.",
        },
        {
          "column": 49,
          "line": 194,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 195,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 196,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 196,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 196,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 197,
          "type": "state",
          "value": "automated_one_shot_final_check",
        },
        {
          "column": 31,
          "line": 197,
          "type": "to",
          "value": "to",
        },
        {
          "column": 34,
          "line": 197,
          "type": "state",
          "value": "automated_one_shot_execution",
        },
        {
          "column": 63,
          "line": 197,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 64,
          "line": 197,
          "type": "content",
          "value": "Proceed to execution of the single task without human intervention.",
        },
        {
          "column": 70,
          "line": 198,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 199,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 200,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 200,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 200,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 201,
          "type": "state",
          "value": "automated_one_shot_execution",
        },
        {
          "column": 29,
          "line": 201,
          "type": "to",
          "value": "to",
        },
        {
          "column": 32,
          "line": 201,
          "type": "state",
          "value": "automated_one_shot_loop_tasks",
        },
        {
          "column": 62,
          "line": 201,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 63,
          "line": 201,
          "type": "content",
          "value": "Find first (and only) unfinished task. Go to the task with \`planner_goto\`. Extract all current task details from \`planner_get_project\`.",
        },
        {
          "column": 63,
          "line": 204,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 205,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 206,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 206,
          "type": "content",
          "value": "Introspect: Has unfinished task.",
        },
        {
          "column": 35,
          "line": 206,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 207,
          "type": "state",
          "value": "automated_one_shot_loop_tasks",
        },
        {
          "column": 30,
          "line": 207,
          "type": "to",
          "value": "to",
        },
        {
          "column": 33,
          "line": 207,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 61,
          "line": 207,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 62,
          "line": 207,
          "type": "content",
          "value": "Pass the task to \`oc-agentic-executor\`. Your message format will be \`Do TASK_DETAILS\` where TASK_DETAILS is the full specification of the current active task verbatim. Wait for execution to complete. Pass the task and execution review to \`oc-agentic-reiviewer\`. Your message format will be \`Based on TASK_DETAILS review the current changes as reported by EXECUTION_REVIEW\` where TASK_DETAILS is the full specification of the current active task verbatim and EXECUTION_REVIEW is the output produced by the executor. Wait for review to complete.",
        },
        {
          "column": 31,
          "line": 213,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 214,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 215,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 215,
          "type": "content",
          "value": "Introspect: Task is complete. IMPORTANT: THIS IS STRICT 100% COMPLETION. YOU ARE NOT ALLOWED TO BYPASS THIS REQUIREMENT. DOING SO WILL CAUSE SERIOUS PROGRAM CORRUPTION.",
        },
        {
          "column": 171,
          "line": 215,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 216,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 28,
          "line": 216,
          "type": "to",
          "value": "to",
        },
        {
          "column": 31,
          "line": 216,
          "type": "state",
          "value": "automated_one_shot_mark_task",
        },
        {
          "column": 60,
          "line": 216,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 61,
          "line": 216,
          "type": "content",
          "value": "Synthesize current task specification with actual work done to produce updated task. Be precise with your editing. Call \`planner_update_task\` to update the task as completed with new details.",
        },
        {
          "column": 79,
          "line": 219,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 220,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 221,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 221,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 221,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 222,
          "type": "state",
          "value": "automated_one_shot_mark_task",
        },
        {
          "column": 29,
          "line": 222,
          "type": "to",
          "value": "to",
        },
        {
          "column": 32,
          "line": 222,
          "type": "state",
          "value": "automated_one_shot_loop_tasks",
        },
        {
          "column": 62,
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
          "value": "Introspect: Task not yet successfully completed.",
        },
        {
          "column": 51,
          "line": 224,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 225,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 28,
          "line": 225,
          "type": "to",
          "value": "to",
        },
        {
          "column": 31,
          "line": 225,
          "type": "state",
          "value": "automated_one_shot_redefine_task",
        },
        {
          "column": 64,
          "line": 225,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 65,
          "line": 225,
          "type": "content",
          "value": "Generate new sub plan that would satisfy task requirements. Format sub plan for \`planner_update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task plan. Ensure that your plan remains within the constraints of the sub problems to solve.",
        },
        {
          "column": 270,
          "line": 232,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 233,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 234,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 2,
          "line": 234,
          "type": "content",
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 234,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 235,
          "type": "state",
          "value": "automated_one_shot_redefine_task",
        },
        {
          "column": 33,
          "line": 235,
          "type": "to",
          "value": "to",
        },
        {
          "column": 36,
          "line": 235,
          "type": "state",
          "value": "automated_one_shot_run_task",
        },
        {
          "column": 64,
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
          "value": "Introspect: All tasks complete",
        },
        {
          "column": 33,
          "line": 237,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 238,
          "type": "state",
          "value": "automated_one_shot_loop_tasks",
        },
        {
          "column": 30,
          "line": 238,
          "type": "to",
          "value": "to",
        },
        {
          "column": 33,
          "line": 238,
          "type": "state",
          "value": "automated_one_shot_all_tasks_complete",
        },
        {
          "column": 71,
          "line": 238,
          "type": "colon",
          "value": ":",
        },
        {
          "column": 72,
          "line": 238,
          "type": "content",
          "value": "Call \`planner_get_project\` to get full project details. Present reply to agent (no human). Decide acceptability automatically using previously gathered validation results.",
        },
        {
          "column": 83,
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
          "value": "Do immediately",
        },
        {
          "column": 17,
          "line": 243,
          "type": "newline",
          "value": "
      ",
        },
        {
          "column": 1,
          "line": 244,
          "type": "state",
          "value": "automated_one_shot_all_tasks_complete",
        },
        {
          "column": 38,
          "line": 244,
          "type": "to",
          "value": "to",
        },
        {
          "column": 41,
          "line": 244,
          "type": "state",
          "value": "initial_loaded",
        },
        {
          "column": 56,
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
          "type": "eof",
          "value": "",
        },
      ]
    `);
  });
});
