import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";
import { WorkflowParser } from "./parser";

describe("Parser E2E Tests", () => {
  it("should parse the entire scoped-execution.flow file", () => {
    const plannerPath = join(__dirname, "scoped-execution.flow");
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
            "guidance": "Call \`planner_get_project\` to load current scope of work. Wait for scope of work. Display current scope of work status to the user.",
            "name": "*",
          },
          "all_tasks_complete": {
            "guidance": "Call \`planner_get_project\` to get full project details. Present reply to user",
            "name": "all_tasks_complete",
          },
          "check_tasks": {
            "guidance": "Format input for \`planner_update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the scope of work, leaving points with uncertainty as an exercise to the user to clarify. Present reply and interrogate them with the response questions.",
            "name": "check_tasks",
          },
          "create_project": {
            "guidance": "Call \`planner_create_project\` with the final synthesized project specifics from all the clarifications. Wait for successful reply.",
            "name": "create_project",
          },
          "define_project": {
            "guidance": "Ask to define the specifics of the scope of work. These specifics will be used to fulfill the arguments to \`planner_create_project\`. Detail the specifics.",
            "name": "define_project",
          },
          "delete_task": {
            "guidance": "Call \`planner_delete_task\` to delete task in question. Wait for reply.",
            "name": "delete_task",
          },
          "execution": {
            "guidance": "Update any scope with any points that the user clarifies. Commit these changes in project with \`planner_update_project\` Commit these changes in tasks with \`planner_update_task\` Commit these changes in task order with \`planner_reoder_tasks\` Commit these changes in task deletion with \`planner_delete_task\` Call \`planner_get_project\` to get full project details.",
            "name": "execution",
          },
          "final_check": {
            "guidance": "NEVER SKIP THIS EVEN IF IT WAS DONE BEFORE. QUESTIONS CAN CHANGE. Get full scope of work state with \`planner_get_project\`. Format output of \`planner_get_project\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This is a full scope of work. Every part needs to be internally coherent and logically sound. Each part must build up to a cohesive whole and no contradictions are allowed. Work done must be atomic. Planning must be exhaustive. [specification] THE_SCOPE_OF_WORK_SPECIFICATION\`. Wait for reply from \`oc-agentic-inquisitor\`. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the scope of work, leaving points with uncertainty as an exercise to the user to clarify. Present the synthesized full scope of work to the user, leaving no details out.",
            "name": "final_check",
          },
          "initial_loaded": {
            "guidance": "Call \`planner_get_project\` to load current scope of work. Wait for scope of work. Display current scope of work status to the user.",
            "name": "initial_loaded",
          },
          "loop_tasks": {
            "guidance": "Find first unfinished task. Go to first incomplete task with \`planner_goto\`. Extract all current task details from \`planner_get_project\`.",
            "name": "loop_tasks",
          },
          "mark_task": {
            "guidance": "Synthesize current task specification with actual work done to produce updated task. Be precise with your editing. Call \`planner_update_task\` to update the task as completed with new details.",
            "name": "mark_task",
          },
          "parallel_update": {
            "guidance": "Update any scope with any points that the user clarifies. Commit these changes in project with \`planner_update_project\` Commit these changes in tasks with \`planner_update_task\` Commit these changes in task order with \`planner_reoder_tasks\` Commit these changes in task deletion with \`planner_delete_task\`",
            "name": "parallel_update",
          },
          "redefine_task": {
            "guidance": "Generate new sub plan that would satisfy task requirements. Format sub plan for \`planner_update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the scope of work. Ensure that your plan remains within the constraints of the sub problems to solve.",
            "name": "redefine_task",
          },
          "refine_project": {
            "guidance": "Synthesize the scope of work specifics. Pass the scope of work specifics to agent \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how plans will be formed during execution. Plans that derive from this must be strictly deterministic [specification] THE_PROJECT_SPECIFICATION\`. THE_SCOPE_OF_WORK_SPECIFICATION is the contents of the scope of work specifics you would have passed to \`planner_create_project\`. Wait for reply from \`oc-agentic-inquisitor\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the project, leaving points with uncertainty as an exercise to the user to clarify. Present the scope of work specifics with updated points.",
            "name": "refine_project",
          },
          "refine_tasks": {
            "guidance": "",
            "name": "refine_tasks",
          },
          "reorder_tasks": {
            "guidance": "Call \`planner_reorder_tasks\` to reorder tasks. Wait for reply.",
            "name": "reorder_tasks",
          },
          "run_task": {
            "guidance": "Pass the task to \`oc-agentic-executor\`. Your message format will be \`Do TASK_DETAILS\` where TASK_DETAILS is the full specification of the current active task verbatim. Wait for execution to complete. Pass the task to \`oc-agentic-reiviewer\`. Your message format will be \`Based on TASK_DETAILS review the current changes as reported by EXECUTION_REVIEW\` where TASK_DETAILS is the full specification of the current active task verbatim and EXECUTION_REVIEW is the output produced by the executor. Wait for review to complete.",
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
              "guidance": "Do immediately",
              "target": "initial_loaded",
            },
          },
          "all_tasks_complete": {
            "initial_loaded": {
              "guidance": "User is satisfied with output",
              "target": "initial_loaded",
            },
            "refine_tasks": {
              "guidance": "User is unsatisfied with output",
              "target": "refine_tasks",
            },
          },
          "check_tasks": {
            "check_tasks": {
              "guidance": "Ask: Can you provide clarity on all the above points",
              "target": "check_tasks",
            },
            "update_task": {
              "guidance": "Ask: Would you like to proceed (anyway) to updating the task?",
              "target": "update_task",
            },
          },
          "create_project": {
            "refine_tasks": {
              "guidance": "Do immediately",
              "target": "refine_tasks",
            },
          },
          "define_project": {
            "refine_project": {
              "guidance": "Do immediately",
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
            "loop_tasks": {
              "guidance": "Do immediately",
              "target": "loop_tasks",
            },
          },
          "final_check": {
            "execution": {
              "guidance": "Ask: Do want to continue on?",
              "target": "execution",
            },
            "parallel_update": {
              "guidance": "Ask: Do you accept these changes as the full scope of work??",
              "target": "parallel_update",
            },
          },
          "initial_loaded": {
            "define_project": {
              "guidance": "Ask: Do you want to start a new scope of work?",
              "target": "define_project",
            },
            "refine_tasks": {
              "guidance": "Ask: Do you want to continue the scope of work?",
              "target": "refine_tasks",
            },
          },
          "loop_tasks": {
            "all_tasks_complete": {
              "guidance": "Introspect: All tasks complete",
              "target": "all_tasks_complete",
            },
            "run_task": {
              "guidance": "Introspect: Has unfinished task.",
              "target": "run_task",
            },
          },
          "mark_task": {
            "loop_tasks": {
              "guidance": "Do immediately",
              "target": "loop_tasks",
            },
          },
          "parallel_update": {
            "final_check": {
              "guidance": "Do immediately",
              "target": "final_check",
            },
          },
          "redefine_task": {
            "run_task": {
              "guidance": "Do immediately",
              "target": "run_task",
            },
          },
          "refine_project": {
            "create_project": {
              "guidance": "Ask: Would you like to proceed (anyway) to creating the scope of work?",
              "target": "create_project",
            },
            "refine_project": {
              "guidance": "Ask: Can you provide clarity on all the above points?",
              "target": "refine_project",
            },
          },
          "refine_tasks": {
            "check_tasks": {
              "guidance": "Ask: Is there a task you want to alter? What are the details?",
              "target": "check_tasks",
            },
            "delete_task": {
              "guidance": "Ask: Would you like to delete a specific task or tasks?",
              "target": "delete_task",
            },
            "final_check": {
              "guidance": "Ask: Would you like to proceed to do a final check?",
              "target": "final_check",
            },
            "reorder_tasks": {
              "guidance": "Ask: Would you like to reorder specific tasks?",
              "target": "reorder_tasks",
            },
          },
          "reorder_tasks": {
            "refine_tasks": {
              "guidance": "Do immediately",
              "target": "refine_tasks",
            },
          },
          "run_task": {
            "mark_task": {
              "guidance": "Introspect: Task is complete. IMPORTANT: THIS IS STRICT 100% COMPLETION. YOU ARE NOT ALLOWED TO BYPASS THIS REQUIREMENT. DOING SO WILL CAUSE SERIOUS PROGRAM CORRUPTION.",
              "target": "mark_task",
            },
            "redefine_task": {
              "guidance": "Introspect: Task not yet successfully completed.",
              "target": "redefine_task",
            },
          },
          "update_task": {
            "refine_tasks": {
              "guidance": "Do immediately",
              "target": "refine_tasks",
            },
          },
        },
      }
    `);
  });
});
