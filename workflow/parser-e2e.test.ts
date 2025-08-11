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

    // Snapshot the parsed result for comprehensive validation
    expect(result).toMatchInlineSnapshot(`
      {
        "initialState": "initial_loaded",
        "states": {
          "*": {
            "guidance": "Call \`get_project\` to load current task list. List summary of files changed with \`jj diff --summary -r @\`. Display detailed list of current task status to the user. Ask what the user wants to do and only proceed on explicit confirmation.",
            "name": "*",
          },
          "all_tasks_complete": {
            "guidance": "Call \`get_project\` to get full task details. Present reply to user",
            "name": "all_tasks_complete",
          },
          "analyze_commit_changes": {
            "guidance": "Run \`jj diff --summary -r @\` to get summary of current commit changes. Extract file paths, change types, and modification patterns from diff output. Prepare context for commit analysis including changed files and their purposes.",
            "name": "analyze_commit_changes",
          },
          "automated_one_shot_all_tasks_complete": {
            "guidance": "Synthesize current task specification with actual work done to produce updated task. Be precise with your editing. Call \`update_task\` to update the task as completed with new details. Wait for successful task update. Call \`get_project\` to get full task details. Decide acceptability automatically using previously gathered validation results. Present completed work to human for review. Show synthesized execution summary and diffs. Provide the user with three choices: - Quick review: human inspects, provides concise feedback; system will synthesize comments and attempt automated fixes then resume automated execution. - Precise review: human will hand off to the main review chain for deeper human-driven acceptance and possible merge into the main workflow (all_tasks_complete). - Finish: accept and return to initial_loaded.",
            "name": "automated_one_shot_all_tasks_complete",
          },
          "automated_one_shot_create_task": {
            "guidance": "Synthesize the single-task specifics. Pass the task specifics to agent \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how plans will be formed during execution. Plans that derive from this must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. \`THE_TASK_SPECIFICATION\` needs to have its multiple lines compressed into a single line. THE_TASK_SPECIFICATION is the contents of the task specifics you would have passed to \`create_task\` with (new="auto"). Wait for reply from \`oc-agentic-inquisitor\`. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task. Present the synthesized single-task specifics. Update the task specifics based on the inquisitor reply. Pass the updated single-task specification to \`oc-agentic-inquisitor\` again using the same message format as above. Use \`oc-agentic-investigator\` as needed for codebase checks. Present final synthesized single-task specification ready for creation. Call \`create_task\` with (new="auto") with the final synthesized single-task specifics. Wait for successful reply.",
            "name": "automated_one_shot_create_task",
          },
          "automated_one_shot_define_task": {
            "guidance": "Ask to define the specifics of the single task. These specifics will be used to fulfill the arguments to \`create_task\` with (new="auto"). This automated flow will create a single task and fully execute it without human interaction.",
            "name": "automated_one_shot_define_task",
          },
          "automated_one_shot_execution": {
            "guidance": "Proceed to execution of the single task without human intervention.",
            "name": "automated_one_shot_execution",
          },
          "automated_one_shot_final_check": {
            "guidance": "Call \`get_project\` to load created task and confirm it exists. Find the newly created task in the task list. Call \`goto\` with the task_key of the newly created task to position to it. Wait for successful positioning. Format output and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\` for a final internal consistency check. Your message format will be \`[requirements] This is a single task. Every part needs to be internally coherent and logically sound. Each part must build up to a cohesive whole and no contradictions are allowed. Work done must be atomic. Planning must be exhaustive. [specification] THE_TASK_SPECIFICATION\`. \`THE_TASK_SPECIFICATION\` needs to have its multiple lines compressed into a single line. Wait for reply. Use \`oc-agentic-investigator\` as needed. Present synthesized final single-task.",
            "name": "automated_one_shot_final_check",
          },
          "automated_one_shot_loop_tasks": {
            "guidance": "Extract all current task details from \`get_project\`. Verify the task is positioned correctly and ready for execution.",
            "name": "automated_one_shot_loop_tasks",
          },
          "automated_one_shot_redefine_task": {
            "guidance": "Generate new sub plan that would satisfy task requirements. Format sub plan for \`update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. \`THE_TASK_SPECIFICATION\` needs to have its multiple lines compressed into a single line. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task plan. Ensure that your plan remains within the constraints of the sub problems to solve. Call \`update_task\` with the refined task specification to update the current task. Wait for successful task update.",
            "name": "automated_one_shot_redefine_task",
          },
          "automated_one_shot_run_task": {
            "guidance": "Pass the task to \`oc-agentic-executor\`. Your message format will be \`Do TASK_DETAILS\` where TASK_DETAILS is the full specification of the current active task verbatim. Wait for execution to complete. Pass the task and execution review to \`oc-agentic-reviewer\`. Your message format will be \`Based on TASK_DETAILS review the current changes as reported by EXECUTION_REVIEW\` where TASK_DETAILS is the full specification of the current active task verbatim and EXECUTION_REVIEW is the output produced by the executor. Wait for review to complete.",
            "name": "automated_one_shot_run_task",
          },
          "checked_task": {
            "guidance": "Format input for \`update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. \`THE_TASK_SPECIFICATION\` needs to have its multiple lines compressed into a single line. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is where I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your contextual understanding and ability to investigate to accept or reject points, synthesize new points, or make adjustments to the task. Clearly mark remaining uncertainties for the user to resolve. Present the reply including all automatic adjustments and uncertainties, then ask the user whether to apply or ignore recommendations.",
            "name": "checked_task",
          },
          "commit_create_task": {
            "guidance": "Consolidate everything discussed in detail, without missing anything, and use it to call \`create_task\` with (new="auto"). Wait for reply.",
            "name": "commit_create_task",
          },
          "create_documentation_task": {
            "guidance": "Use refined task specification to call \`create_task\` with (new="current"). This will document the current commit with the analyzed task details. Ensure all task fields accurately reflect the completed work based on commit analysis. Wait for successful task creation.",
            "name": "create_documentation_task",
          },
          "create_task": {
            "guidance": "Ask to define the specifics of the first task for your new project. These specifics will be used to create the first task of your new independent project with \`create_task\` with (new="auto"). Detail the task specifics including type, scope, title, intent, objectives, and constraints.",
            "name": "create_task",
          },
          "delete_task": {
            "guidance": "Call \`delete_task\` to delete task in question. Wait for reply.",
            "name": "delete_task",
          },
          "document_work_done": {
            "guidance": "Analyze current commit changes using \`jj diff --summary -r @\` to understand what work has been completed. Use \`oc-agentic-investigator\` to extract task details from actual file changes and commit context. Use \`oc-agentic-inquisitor\` for iterative plan refinement until task specification accurately reflects completed work. Create task documentation using \`create_task\` with (new="current") based on analysis of actual changes, not planned work. Loop back to initial_loaded state after completion without human interaction.",
            "name": "document_work_done",
          },
          "execution": {
            "guidance": "Update any tasks with any points that the user clarifies. Commit these changes in tasks with \`update_task\` Commit these changes in task order with \`reorder_tasks\` Commit these changes in task deletion with \`delete_task\` Call \`get_project\` to get full task details.",
            "name": "execution",
          },
          "final_check": {
            "guidance": "NEVER SKIP THIS EVEN IF IT WAS DONE BEFORE. QUESTIONS CAN CHANGE. Get full task list with \`get_project\`. Format output of \`get_project\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This is a full task list. Every part needs to be internally coherent and logically sound. Each part must build up to a cohesive whole and no contradictions are allowed. Work done must be atomic. Planning must be exhaustive. [specification] THE_TASK_LIST_SPECIFICATION\`. Wait for reply from \`oc-agentic-inquisitor\`. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task list, leaving points with uncertainty as an exercise to the user to clarify. Present the synthesized full task list to the user, leaving no details out.",
            "name": "final_check",
          },
          "human_review_detailed": {
            "guidance": "Collect human feedback. Ask the user for explicit review notes and any blockers. Wait for user input. Synthesize feedback into concrete changelist This list will be used in the next task execution",
            "name": "human_review_detailed",
          },
          "human_review_quick": {
            "guidance": "Collect human feedback. Ask the user for explicit review notes and any blockers. Wait for user input. Synthesize feedback into concrete changelist This synthesized task plan MUST contain the following: 1. It must contain all the work already done. These sub-tasks should be classified as tasks that must be evaluated and reattempted if the evaluation failed. Evaluation means ensuring that the task is actually complete. 2. It must append all the new sub-tasks that must be completed. 3. It must not drop uncompleted sub-tasks from the current main task. Those must still be enforced. This list will be used in the next task execution",
            "name": "human_review_quick",
          },
          "initial_loaded": {
            "guidance": "Call \`get_project\` to load current task list. List summary of files changed with \`jj diff --summary -r @\`. Display detailed list of current task status to the user. Ask what the user wants to do and only proceed on explicit confirmation.",
            "name": "initial_loaded",
          },
          "investigate_changes": {
            "guidance": "Pass commit analysis context to \`oc-agentic-investigator\`. Your message format will be \`I need to understand the work completed in this commit. Here are the file changes: DIFF_SUMMARY. I want to extract task details including type, scope, title, intent, objectives, and constraints based on actual changes made, not planned work. Can you help analyze what was actually accomplished?\`. Wait for investigator analysis of actual changes and their business impact. Extract technical details, scope of changes, and implementation approach from analysis.",
            "name": "investigate_changes",
          },
          "loop_tasks": {
            "guidance": "Find first unfinished task. Go to first incomplete task with \`goto\`. Extract all current task details from \`get_project\`.",
            "name": "loop_tasks",
          },
          "mark_task": {
            "guidance": "Synthesize current task specification with actual work done to produce updated task. Be precise with your editing. Call \`update_task\` to update the task as completed with new details.",
            "name": "mark_task",
          },
          "parallel_update": {
            "guidance": "Update any tasks with any points that the user clarifies. Commit these changes in tasks with \`update_task\` Commit these changes in task order with \`reorder_tasks\` Commit these changes in task deletion with \`delete_task\`",
            "name": "parallel_update",
          },
          "redefine_task": {
            "guidance": "Generate new sub plan that would satisfy task requirements. Format sub plan for \`update_task\` and pass ONLY THAT INPUT to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This needs clarity how execution will be carried out. Execution on this task must be strictly deterministic [specification] THE_TASK_SPECIFICATION\`. \`THE_TASK_SPECIFICATION\` needs to have its multiple lines compressed into a single line. Perform secondary research on any questions raised. You may use \`oc-agentic-investigator\` to research about any concerns, in parallel, that deal directly with the codebase. \`oc-agentic-investigator\` should be called with the following format: \`I am uncertain about these THE_POINT. This is my current assumption THE_ASSUMPTION. Here is the CONTEXT. This is were I would begin: INVESTIGATION_ENTRY_POINT. Can you help provide factual clarity?\`. Use your enhanced contextual understanding and ability to investigate to immediately reject or accept points, synthesizing new points, or making any other adjustments to the task. Ensure that your plan remains within the constraints of the sub problems to solve. This synthesized task plan MUST contain the following: 1. It must contain all the work already done. These sub-tasks should be classified as tasks that must be evaluated and reattempted if the evaluation failed. Evaluation means ensuring that the task is actually complete. 2. It must append all the new sub-tasks that must be completed. 3. It must not drop uncompleted sub-tasks from the current main task. Those must still be enforced.",
            "name": "redefine_task",
          },
          "refine_task_spec": {
            "guidance": "Format extracted task details and pass to \`oc-agentic-inquisitor\`. Your message format will be \`[requirements] This task specification needs to accurately reflect completed work for retroactive documentation. The specification must be based on actual file changes and implementation details, not planned work. [specification] EXTRACTED_TASK_DETAILS\`. Wait for inquisitor refinement of task specification. Iterate with inquisitor until task specification accurately captures completed work. Ensure task type, scope, title, intent, objectives, and constraints reflect actual implementation.",
            "name": "refine_task_spec",
          },
          "refine_tasks": {
            "guidance": "Ask if the user would like to create, update, delete, reorder or skip to execution.",
            "name": "refine_tasks",
          },
          "reorder_tasks": {
            "guidance": "Call \`reorder_tasks\` to reorder tasks. Wait for reply.",
            "name": "reorder_tasks",
          },
          "run_task": {
            "guidance": "Pass the task to \`oc-agentic-executor\`. Your message format will be \`Do TASK_DETAILS\` where TASK_DETAILS is the full specification of the current active task verbatim. Wait for execution to complete. Pass the task to \`oc-agentic-reviewer\`. Your message format will be \`Based on TASK_DETAILS review the current changes as reported by EXECUTION_REVIEW\` where TASK_DETAILS is the full specification of the current active task verbatim and EXECUTION_REVIEW is the output produced by the executor. Wait for review to complete.",
            "name": "run_task",
          },
          "update_task": {
            "guidance": "Ask the details of the task the user wants to update. Create the new expected task details. Await for user to confirm or continue refining the task. On confirmation, proceed to update the task with \`update_task\`.",
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
          "analyze_commit_changes": {
            "investigate_changes": {
              "guidance": "Do immediately",
              "target": "investigate_changes",
            },
          },
          "automated_one_shot_all_tasks_complete": {
            "human_review_detailed": {
              "guidance": "Ask: Do you want to perform a detailed review?",
              "target": "human_review_detailed",
            },
            "human_review_quick": {
              "guidance": "Ask: Do you want to perform a quick review?",
              "target": "human_review_quick",
            },
            "initial_loaded": {
              "guidance": "Ask: Do you want to finish?",
              "target": "initial_loaded",
            },
          },
          "automated_one_shot_create_task": {
            "automated_one_shot_final_check": {
              "guidance": "Do immediately",
              "target": "automated_one_shot_final_check",
            },
          },
          "automated_one_shot_define_task": {
            "automated_one_shot_create_task": {
              "guidance": "Do immediately",
              "target": "automated_one_shot_create_task",
            },
          },
          "automated_one_shot_execution": {
            "automated_one_shot_loop_tasks": {
              "guidance": "Do immediately",
              "target": "automated_one_shot_loop_tasks",
            },
          },
          "automated_one_shot_final_check": {
            "automated_one_shot_execution": {
              "guidance": "Do immediately",
              "target": "automated_one_shot_execution",
            },
          },
          "automated_one_shot_loop_tasks": {
            "automated_one_shot_run_task": {
              "guidance": "Introspect: Has unfinished task.",
              "target": "automated_one_shot_run_task",
            },
          },
          "automated_one_shot_redefine_task": {
            "automated_one_shot_run_task": {
              "guidance": "Do immediately",
              "target": "automated_one_shot_run_task",
            },
          },
          "automated_one_shot_run_task": {
            "automated_one_shot_all_tasks_complete": {
              "guidance": "Introspect: Task is complete. IMPORTANT: THIS IS STRICT 100% COMPLETION. YOU ARE NOT ALLOWED TO BYPASS THIS REQUIREMENT. DOING SO WILL CAUSE SERIOUS PROGRAM CORRUPTION.",
              "target": "automated_one_shot_all_tasks_complete",
            },
            "automated_one_shot_redefine_task": {
              "guidance": "Introspect: Task not yet successfully completed.",
              "target": "automated_one_shot_redefine_task",
            },
          },
          "checked_task": {
            "checked_task": {
              "guidance": "Ask: Can you provide clarity on all the above points?",
              "target": "checked_task",
            },
            "commit_create_task": {
              "guidance": "Ask: Would you like to proceed (anyway) to updating the task?",
              "target": "commit_create_task",
            },
          },
          "commit_create_task": {
            "refine_tasks": {
              "guidance": "Do immediately",
              "target": "refine_tasks",
            },
          },
          "create_documentation_task": {
            "initial_loaded": {
              "guidance": "Do immediately",
              "target": "initial_loaded",
            },
          },
          "create_task": {
            "checked_task": {
              "guidance": "Do: When user is done clarifying their task.",
              "target": "checked_task",
            },
          },
          "delete_task": {
            "refine_tasks": {
              "guidance": "Do immediately",
              "target": "refine_tasks",
            },
          },
          "document_work_done": {
            "analyze_commit_changes": {
              "guidance": "Do immediately",
              "target": "analyze_commit_changes",
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
              "guidance": "Ask: Do you accept these changes as the full task list?",
              "target": "parallel_update",
            },
          },
          "human_review_detailed": {
            "run_task": {
              "guidance": "Do immediately",
              "target": "run_task",
            },
          },
          "human_review_quick": {
            "automated_one_shot_loop_tasks": {
              "guidance": "Do immediately",
              "target": "automated_one_shot_loop_tasks",
            },
          },
          "initial_loaded": {
            "automated_one_shot_define_task": {
              "guidance": "Ask: Do you want to run an automated one-shot task (fully automated, no further human interaction)?",
              "target": "automated_one_shot_define_task",
            },
            "create_task": {
              "guidance": "Ask: Do you want to start a fresh project with new tasks?",
              "target": "create_task",
            },
            "document_work_done": {
              "guidance": "Ask: Do you want to document work already done?",
              "target": "document_work_done",
            },
            "refine_tasks": {
              "guidance": "Ask: Do you want to continue with existing tasks?",
              "target": "refine_tasks",
            },
          },
          "investigate_changes": {
            "refine_task_spec": {
              "guidance": "Do immediately",
              "target": "refine_task_spec",
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
          "refine_task_spec": {
            "create_documentation_task": {
              "guidance": "Do immediately",
              "target": "create_documentation_task",
            },
          },
          "refine_tasks": {
            "create_task": {
              "guidance": "Ask: Would you like to create a new task?",
              "target": "create_task",
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
            "update_task": {
              "guidance": "Ask: Are there any tasks you want to update?",
              "target": "update_task",
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
