#!/usr/bin/env -S yarn tsx
process.chdir(process.env.INIT_CWD ?? process.cwd());

import { FastMCP } from "fastmcp";
import { isEqual } from "lodash";
import { z } from "zod";
import { format } from "./format";
import { Jujutsu } from "./jujutsu";
import { parse } from "./parse";
import { Err, Ok } from "./result";
import { ValidatedHeader, ValidatedTask, validate } from "./validate";

function formatError(error: Err) {
	return `An internal error ocurred: ${error.err} \`${JSON.stringify(error.meta)}\``;
}

function composeTextOutput(
	content:
		| {
				type: "error";
				error: Err<string, unknown>;
		  }
		| {
				type: "instruct";
				instruct: string;
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
		case "instruct":
			return {
				type: "text",
				text: content.instruct,
			};
	}
}

const PROMPTS = {
	DEFINE_OVERARCHING_GOAL: `You are an expert project director. Your expertise is root goal extraction, vague objective bisection, possibility exploration and self reflective goal realignment.

IMPORTANT: This is your workflow. DO NOT DEVIATE.
1. Get the user to establish a clear overarching goal.
2. Work with the user to explore and narrow the goal, giving creative suggestions and hypothesis.
3. Decide on the finalized goal.

A goal will consist of 4 parts. Ensure that these parts are thoroughly investigated and abstracted.
1. What kind of change is this goal?
2. What is the scope of this goal?
3. Is this goal breaking?
4. The goal itself a short 1 line objective.

FORMAT: You need to store to call the set_overarching_goal tool. Ensure that you have all the inputs necessary to call the tool.
EXPLICIT ACKNOWLEDGEMENT: You are only done once the user acknowledges with "PROCEED"

NAVIGATION: You are at the beginning - no previous steps to jump to.`,
	DEFINE_DETAILED_GOAL: `You are an assmebly of domain experts brought together to interrogate and critique plans. Your expertise is vague objective bisection, possibility exploration and self reflective goal realignment.

YOUR CORE TONE IS STRICT AND DEMANDING. YOU SEEK JUSTIFICATION. YOU EVALUATE BASED ON EXECUTION COST, PRIORITIZING LOWER COSTS.

IMPORTANT: This is your workflow. DO NOT DEVIATE.
1. Understand the overarching goal.
2. Work with the user to explore and expand the requirements of the goal, giving creative suggestions and hypothesis while pruning unwanted suggestions.
3. Decide on the the fine details of the goal

A goal will consist of 2 parts. Ensure that these parts are thoroughly investigated and abstracted.

The first part is the details of the change. A detail consists of the following:
1. Reasons for change - any change must be directed by a fundamental need to be fulfilled. Ensure that this is clear and indisputable. It is also required to provide grounding context to enhance explanation.
2. Targets of change - what parts must be changed in order to satisfy the goal. This must be exhaustive.
3. Approach to change - how are you going to change things? What techniques, strategies, patterns, sequencing.

The second part is constraints. A goal will ofter have infinite solutions. Define strategically place constraints to narrow the scope.
The strategy to find constraints is to systematically explore the goal and propose a range of distinct solutions within the goal and existing constraints.
The user will then pick a few proposals to follow. Your job is to then decide on bisecting constraints that will satisfy extracting only the chosen solutions from this group.

FORMAT: You need to store to call the set_detailed_goal tool. Ensure that you have all the inputs necessary to call the tool. Your description must be in english paragraphs without headers or points.
EXPLICIT ACKNOWLEDGEMENT: You are only done once the user acknowledges with "PROCEED"

NAVIGATION: You can jump back to:
- jump("goal") - Revise the overarching goal`,

	DEFINE_PLAN: `You are an expert requirements implementer. Your expertise is in breaking down an objective into clear distinct steps to execute on.

YOU WILL UNRELENTLESSLY PURSUE THE IDEAL APPROACH TO SATISFY THE CURRENT REQUIREMENT.
YOU WILL PRIORITIZE SIMPLE OVER COMPLEX.
YOU WILL PURSUE DECOUPLING OF TASKS.
YOU WILL ENSURE STREAMLINING OF DIFFICULT DATAFLOWS.

IMPORTANT: This is your workflow. DO NOT DEVIATE.
1. Completely comprehend the requirements and constraints.
2. Ask refining questions as necessary.
3. Present a plan of action.
4. Iterate on the plan with the user.

Plans are formatted with the following pattern. You MUST follow the plan pattern.
\`\`\`md plan pattern
- [ ] First step
  - [ ] Nested first step
    - [ ] Nested nested first step
      - [ ] Nested nested nested first step
- [ ] Second step
- [x] Completed step
\`\`\`

Plans are lists of tasks. Each task can be broken down subtasks. You may only be 4 subtasks deep.

ALWAYS favor a deep over a shallow plan.
ALWAYS reletlessly refine the plan.

FORMAT: You need to store to call the set_plan tool. Ensure that you have all the inputs necessary to call the tool.
EXPLICIT ACKNOWLEDGEMENT: You are only done once the user acknowledges with "PROCEED"

NAVIGATION: You can jump back to:
- jump("goal") - Revise the overarching goal
- jump("detailed") - Revise detailed requirements`,
	EXECUTE: `You are an expert task executor. Your expertise is in executing tasks to specification..

YOU WILL ADHERE TO ALL QUALITY STANDARDS.
YOU WILL ADHERE TO ALL CODE STANDARDS.
YOU WILL EXECUTE TASKS SEQUETIALLY AND IN ORDER.
YOU WILL MARK TASKS AS DONE USING THE mark_task TOOL.
YOU WILL BE SYSTEMATIC.
YOU WILL GROUND YOUR WORK IN EXISTING CODE.
ALWAYS READ AND FOLLOW EXISTING PATTERNS.
NEVER MAKE ASSUMPTIONS.
ALWAYS MAKE CHANGES BY MODIFYING EXISTING CODE IN STRUCTURE BEFORE BUILDING NEW THINGS.

WORKFLOW COMPLETION: When all tasks are complete, the workflow will automatically finish. Use gather_requirements() to see completion status and get guidance for starting a new cycle.

BEFORE EXECUTING A TASK ALWAYS SAY THIS OUT LOUD:
\`\`\`md
I am going to do THE_NAME_OF_THE_TASK.
This is how I will do things: ...
I will keep in mind these edge cases: ...
\`\`\`

THEN YOU WILL READ THE PREVIOUS LINE AND SAY THIS:
\`\`\`md
Is that accurate?
These points are accurate: ...
These points are inaccurate: ...
\`\`\`

THEN YOU WILL REPEAT AND REFINE UNTIL THERE ARE NO INACCURATE POINTS.

UNLESS EXPLICITLY STOPPED, NEVER STOP EXECUTING.

NAVIGATION: You can jump back to:
- jump("goal") - Revise the overarching goal
- jump("detailed") - Revise detailed requirements
- jump("plan") - Revise the plan`,
	SELF_REINFORCEMENT: `DO THE FOLLOWING:
1. Introsepect and ensure that the agreed upon has been fully captured in this input.
2. If it is not fully captured, update it again to satisfy it.
3. Ensure that every part of the plan is cohesive.
4. Only when fully fully captured then you may stop retrying and proceed.`,
};

async function loadCommit(jj: ReturnType<(typeof Jujutsu)["cwd"]>) {
	return await jj.description
		.get()
		.then((result) => {
			if (result.err) return result;
			const parseResult = validate(parse(result.ok));
			if (parseResult.isValid) return Ok(parseResult.data);
			return Err("commit validation failed");
		})
		.catch((error) => Err("unknown error", { error }));
}

async function reinforceWithContext(
	jj: ReturnType<(typeof Jujutsu)["cwd"]>,
	driver: string,
): Promise<Array<{ type: "text"; text: string }>> {
	return [
		{ type: "text", text: driver },
		{
			type: "text",
			text: `FILES CHANGED:\n${await jj.diff.summary().then((summary) => {
				if (summary.err) return formatError(summary);
				return summary.ok.map((s) => `${s.type} ${s.file}`).join();
			})}`,
		},
		...(await jj.diff.files().then((files) => {
			if (files.err)
				return [{ type: "text" as const, text: formatError(files) ?? "" }];
			return files.ok
				.map(
					(f) =>
						`WARNING: DIFF PRESENTED MAY LOOK LIKE THERE ARE SYNTAX ERRORS, BUT THAT IS JUST AN ARTIFACT OF DIFFING\nDIFF: ${f.file}\n${f.diff}`,
				)
				.map((text) => ({ type: "text" as const, text }));
		})),
	];
}

function start() {
	const server = new FastMCP({
		name: "requirements enforcer",
		version: "0.1.0",
		instructions: `I am requirements enforcer. I am designed to guide the cyclical process of making changes from start to finish and back to start.

A change is any action that caused code to alter from one state to another.

CYCLICAL WORKFLOW:
1. gather_requirements() - Assess current state and get appropriate guidance
2. Follow the guided workflow: goal → detailed → plan → execute
3. When all tasks complete, gather_requirements() will detect completion
4. Use new_commit() to start fresh cycle
5. Return to step 1

WORKFLOW STAGES:
1. Before any change is made, when declaring the intent to change
2. During the planning stage of a change when deciding on the requirements  
3. During the execution stage of a change when implementing the requirements
4. Automatic completion when all tasks are done
5. Fresh cycle initiation for continuous development

Always start with "gather_requirements"
`,
	});

	const jj = Jujutsu.cwd(process.cwd());

	// Single tool: gather_requirements
	server.addTool({
		name: "gather_requirements",
		description: `Use me to gather requirements of the change. I am always the first step.

Calling me will return our current state.`,
		annotations: {
			title: "Gather Requirements",
			destructiveHint: false,
			readOnlyHint: true,
			idempotentHint: false,
			openWorldHint: false,
			streamingHint: false,
		},
		execute: async (): Promise<
			| { content: Array<{ type: "text"; text: string }> }
			| { type: "text"; text: string }
		> => {
			const commitResult = await loadCommit(jj);

			if (commitResult.err) {
				return composeTextOutput({
					type: "error",
					error: commitResult,
				});
			}

			const isEmptyResult = await jj
				.empty()
				.catch((error) => Err("unknown error", { error }));

			if (isEmptyResult.err) {
				return composeTextOutput({
					type: "error",
					error: isEmptyResult,
				});
			}

			const currentRequirements = format(commitResult.ok);

			const mergeChangeContent = isEmptyResult.ok
				? []
				: await reinforceWithContext(
						jj,
						`There are already existing changes. You MUST integrate everything necessary in satisfying those changes into your requirements.

INTROSPECT the changes thoroughly. Be aware that changes are presented with as diffs. Diffs do not fully adhere to the original file format of what is being presented.`,
					);

			switch (commitResult.ok.stage) {
				case 0:
					return {
						content: [
							...mergeChangeContent,
							composeTextOutput({
								type: "instruct",
								instruct: `You need to define or update the overarching goal before you are allowed to do anything else. 

${PROMPTS.DEFINE_OVERARCHING_GOAL}`,
							}),
						],
					};

				case 1:
					return {
						content: [
							...mergeChangeContent,
							composeTextOutput({
								type: "instruct",
								instruct: `The current requirements are as follows:
${currentRequirements}

Work with the user to ensure that is accurate.

${PROMPTS.DEFINE_OVERARCHING_GOAL}`,
							}),
						],
					};

				case 2:
				case 3:
					return {
						content: [
							...mergeChangeContent,
							composeTextOutput({
								type: "instruct",
								instruct: `The current requirements are as follows:
${currentRequirements}

Work with the user to ensure that is accurate.

${PROMPTS.DEFINE_DETAILED_GOAL}`,
							}),
						],
					};
				case 4:
					return {
						content: [
							...mergeChangeContent,
							composeTextOutput({
								type: "instruct",
								instruct: `The current requirements are as follows:
${currentRequirements}

Work with the user to ensure that is accurate.

${PROMPTS.DEFINE_PLAN}`,
							}),
						],
					};
				case 5:
				case 6: {
					// Check if all tasks are complete
					function allTasksComplete(tasks: ValidatedTask[]): boolean {
						for (const [completed, , children] of tasks) {
							if (!completed || !allTasksComplete(children)) {
								return false;
							}
						}
						return true;
					}

					if (
						commitResult.ok.tasks &&
						allTasksComplete(commitResult.ok.tasks)
					) {
						return {
							content: [
								...mergeChangeContent,
								composeTextOutput({
									type: "instruct",
									instruct: `WORKFLOW COMPLETED SUCCESSFULLY! All requirements have been satisfied and all tasks are complete.

The current requirements were:
${currentRequirements}

Use new_commit() to start a fresh requirements cycle.`,
								}),
							],
						};
					}

					return {
						content: [
							...mergeChangeContent,
							composeTextOutput({
								type: "instruct",
								instruct: `The current requirements are as follows:
${currentRequirements}

Work with the user to ensure that is accurate.

${PROMPTS.EXECUTE}`,
							}),
						],
					};
				}
			}
		},
	});

	server.addTool({
		name: "set_overarching_goal",
		description: `Use me to set the intial goal of the change.

An overarching goal is the grounding objective of all other parts of the requirements.

Call me whenever you have decided on updated goal.`,
		annotations: {
			title: "Set Overarching Goal",
			destructiveHint: true,
			readOnlyHint: false,
			idempotentHint: true,
			openWorldHint: false,
			streamingHint: false,
		},
		parameters: z.object({ goal: ValidatedHeader }),
		execute: async (args) => {
			const commitResult = await loadCommit(jj);
			if (commitResult.err) {
				return composeTextOutput({
					type: "error",
					error: commitResult,
				});
			}

			commitResult.ok.header = args.goal;

			// Validate roundtrip before storing
			const processedExpectation = validate(parse(format(commitResult.ok)));

			if (
				!processedExpectation.isValid ||
				!isEqual(processedExpectation.data.header, commitResult.ok.header)
			) {
				return composeTextOutput({
					type: "error",
					error: Err("incorrect input format", {
						input: commitResult.ok,
						output: processedExpectation,
					}),
				});
			}

			const result = await jj.description.replace(format(commitResult.ok));
			if (result.err)
				return composeTextOutput({
					type: "error",
					error: result,
				});

			return composeTextOutput({
				type: "instruct",
				instruct: `The overarching goal has been set to: ${JSON.stringify(processedExpectation.data)}

${PROMPTS.SELF_REINFORCEMENT}

${PROMPTS.DEFINE_DETAILED_GOAL}
`,
			});
		},
	});

	server.addTool({
		name: "set_detailed_goal",
		description: `Use me to set the detailed goals of the change.

A detailed goal is the specifics of the overarching goal, and consists of the reasons, targets, approach and constraints of a change.

Call me whenever you have decided on updated goal.`,
		annotations: {
			title: "Set Detailed Goal",
			destructiveHint: true,
			readOnlyHint: false,
			idempotentHint: true,
			openWorldHint: false,
			streamingHint: false,
		},
		parameters: z.object({ description: z.string() }),
		execute: async (args) => {
			const commitResult = await loadCommit(jj);
			if (commitResult.err) {
				return composeTextOutput({
					type: "error",
					error: commitResult,
				});
			}

			commitResult.ok.description = args.description;

			// Validate roundtrip before storing
			const processedExpectation = validate(parse(format(commitResult.ok)));

			if (
				!processedExpectation.isValid ||
				!isEqual(
					processedExpectation.data.description,
					commitResult.ok.description,
				)
			) {
				return composeTextOutput({
					type: "error",
					error: Err("incorrect input format", {
						input: commitResult.ok,
						output: processedExpectation,
					}),
				});
			}

			const result = await jj.description.replace(format(commitResult.ok));
			if (result.err)
				return composeTextOutput({
					type: "error",
					error: result,
				});

			return composeTextOutput({
				type: "instruct",
				instruct: `The detailed goal has been set to: ${JSON.stringify(processedExpectation.data)}

${PROMPTS.SELF_REINFORCEMENT}

${PROMPTS.DEFINE_PLAN}`,
			});
		},
	});

	server.addTool({
		name: "set_plan",
		description: `Use me to set the plan of how to implement the requirements of the change.

A plan is a nested list of items to complete.

\`\`\`md plan pattern
- [ ] First step
  - [ ] Nested first step
    - [ ] Nested nested first step
      - [ ] Nested nested nested first step
- [ ] Second step
- [x] Completed step
\`\`\`

Plans are lists of tasks. Each task can be broken down subtasks. You may only be 4 subtasks deep.

Call me whenever you need to update tasks.`,
		annotations: {
			title: "Set Plan",
			destructiveHint: true,
			readOnlyHint: false,
			idempotentHint: true,
			openWorldHint: false,
			streamingHint: false,
		},
		parameters: z.object({ plan: z.array(ValidatedTask) }),
		execute: async (args) => {
			const commitResult = await loadCommit(jj);
			if (commitResult.err) {
				return composeTextOutput({
					type: "error",
					error: commitResult,
				});
			}

			commitResult.ok.tasks = args.plan;

			// Validate roundtrip before storing
			const processedExpectation = validate(parse(format(commitResult.ok)));

			if (
				!processedExpectation.isValid ||
				!isEqual(processedExpectation.data.tasks, commitResult.ok.tasks)
			) {
				return composeTextOutput({
					type: "error",
					error: Err("incorrect input format", {
						input: commitResult.ok,
						output: processedExpectation,
					}),
				});
			}

			const result = await jj.description.replace(format(commitResult.ok));
			if (result.err)
				return composeTextOutput({
					type: "error",
					error: result,
				});

			return composeTextOutput({
				type: "instruct",
				instruct: `The plan has been set to: ${JSON.stringify(processedExpectation.data)}

${PROMPTS.SELF_REINFORCEMENT}

${PROMPTS.EXECUTE}
`,
			});
		},
	});

	server.addTool({
		name: "mark_task",
		description: `Use me to mark tasks as complete or incomplete during execution.

Parent tasks are automatically completed once all child tasks are complete. They cannot be manually marked.

Call me whenever you complete a task or need to update task status.`,
		annotations: {
			title: "Mark Task",
			destructiveHint: true,
			readOnlyHint: false,
			idempotentHint: true,
			openWorldHint: false,
			streamingHint: false,
		},
		parameters: z.object({
			task_id: z.string(),
			completed: z.boolean().optional(),
		}),
		execute: async (args) => {
			const commitResult = await loadCommit(jj);
			if (commitResult.err) {
				return composeTextOutput({
					type: "error",
					error: commitResult,
				});
			}

			// Find and update the task
			if (!commitResult.ok.tasks) {
				return composeTextOutput({
					type: "error",
					error: Err("no tasks found", {}),
				});
			}

			// Simple task marking logic - find task by description match
			function markTaskInArray(
				tasks: ValidatedTask[],
				taskId: string,
				completed: boolean,
			): boolean {
				for (const task of tasks) {
					if (task[1].includes(taskId)) {
						task[0] = completed;
						return true;
					}
					if (markTaskInArray(task[2], taskId, completed)) {
						return true;
					}
				}
				return false;
			}

			const completed = args.completed ?? true;
			const found = markTaskInArray(
				commitResult.ok.tasks,
				args.task_id,
				completed,
			);

			if (!found) {
				return composeTextOutput({
					type: "error",
					error: Err("task not found", { task_id: args.task_id }),
				});
			}

			// Validate roundtrip before storing
			const processedExpectation = validate(parse(format(commitResult.ok)));

			if (
				!processedExpectation.isValid ||
				!isEqual(processedExpectation.data.tasks, commitResult.ok.tasks)
			) {
				return composeTextOutput({
					type: "error",
					error: Err("incorrect input format", {
						input: commitResult.ok,
						output: processedExpectation,
					}),
				});
			}

			const result = await jj.description.replace(format(commitResult.ok));
			if (result.err)
				return composeTextOutput({
					type: "error",
					error: result,
				});

			return composeTextOutput({
				type: "instruct",
				instruct: `Task "${args.task_id}" marked as ${completed ? "complete" : "incomplete"}.

Continue with the next task in sequence.`,
			});
		},
	});

	server.addTool({
		name: "jump",
		description: `Use me to jump to any previous stage and get the appropriate guiding prompt.
		
		This allows you to revise earlier decisions in the requirements workflow.`,
		annotations: {
			title: "Jump to Stage",
			destructiveHint: false,
			readOnlyHint: true,
			idempotentHint: false,
			openWorldHint: false,
			streamingHint: false,
		},
		parameters: z.object({
			stage: z.enum(["goal", "detailed", "plan", "execute"]),
		}),
		execute: async (
			args,
		): Promise<
			| { content: Array<{ type: "text"; text: string }> }
			| { type: "text"; text: string }
		> => {
			const commitResult = await loadCommit(jj);
			if (commitResult.err) {
				return composeTextOutput({
					type: "error",
					error: commitResult,
				});
			}

			const isEmptyResult = await jj
				.empty()
				.catch((error) => Err("unknown error", { error }));

			if (isEmptyResult.err) {
				return composeTextOutput({
					type: "error",
					error: isEmptyResult,
				});
			}

			const currentRequirements = format(commitResult.ok);

			const mergeChangeContent = isEmptyResult.ok
				? []
				: await reinforceWithContext(
						jj,
						`There are already existing changes. You MUST integrate everything necessary in satisfying those changes into your requirements.

INTROSPECT the changes thoroughly. Be aware that changes are presented with as diffs. Diffs do not fully adhere to the original file format of what is being presented.`,
					);

			switch (args.stage) {
				case "goal":
					return {
						content: [
							...mergeChangeContent,
							composeTextOutput({
								type: "instruct",
								instruct: `The current requirements are as follows:
${currentRequirements}

Work with the user to ensure that is accurate.

${PROMPTS.DEFINE_OVERARCHING_GOAL}`,
							}),
						],
					};
				case "detailed":
					return {
						content: [
							...mergeChangeContent,
							composeTextOutput({
								type: "instruct",
								instruct: `The current requirements are as follows:
${currentRequirements}

Work with the user to ensure that is accurate.

${PROMPTS.DEFINE_DETAILED_GOAL}`,
							}),
						],
					};
				case "plan":
					return {
						content: [
							...mergeChangeContent,
							composeTextOutput({
								type: "instruct",
								instruct: `The current requirements are as follows:
${currentRequirements}

Work with the user to ensure that is accurate.

${PROMPTS.DEFINE_PLAN}`,
							}),
						],
					};
				case "execute":
					return {
						content: [
							...mergeChangeContent,
							composeTextOutput({
								type: "instruct",
								instruct: `The current requirements are as follows:
${currentRequirements}

Work with the user to ensure that is accurate.

${PROMPTS.EXECUTE}`,
							}),
						],
					};
			}
		},
	});

	server.addTool({
		name: "new_commit",
		description: `Use me to start a fresh requirements cycle after completing the current workflow.

This resets all state and begins a new commit planning process.`,
		annotations: {
			title: "New Commit",
			destructiveHint: true,
			readOnlyHint: false,
			idempotentHint: false,
			openWorldHint: false,
			streamingHint: false,
		},
		parameters: z.object({}),
		execute: async () => {
			// Reset commit state by creating empty commit description
			const result = await jj.new();
			if (result.err)
				return composeTextOutput({
					type: "error",
					error: result,
				});

			return composeTextOutput({
				type: "instruct",
				instruct: `NEW COMMIT CREATED SUCCESSFULLY.

YOU MUST IMMEDIATELY CALL gather_requirements() TO BEGIN THE REQUIREMENTS PROCESS.

DO NOT PERFORM ANY OTHER ACTIONS. DO NOT LINGER IN THIS STATE.

CALL gather_requirements() NOW.`,
			});
		},
	});

	return server.start({
		transportType: "stdio",
	});
}
start();
