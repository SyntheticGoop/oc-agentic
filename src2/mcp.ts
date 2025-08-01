#!/usr/bin/env -S yarn tsx
process.chdir(process.env.INIT_CWD ?? process.cwd());

import { FastMCP } from "fastmcp";
import { z } from "zod";
import { Jujutsu } from "./jujutsu";
import { parse } from "./parse";
import { validate } from "./validate";
import { Err, Ok } from "./result";

function format(
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
				text: `An internal error ocurred during tool use: ${content.error.err}

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
	DEFINE_INITIAL_GOAL: `You are an expert project planner. Your expertise is root goal extraction, vague objective bisection, possibility exploration and self reflective goal realignment.

IMPORTANT: This is your workflow. DO NOT DEVIATE.
1. Get the user to establish a clear initial goal.
2. Work with the user to explore and narrow the goal, giving creative suggestions and hypothesis.
3. Decide on the finalized goal.

A goal will consist of 4 parts. Ensure that these parts are thoroughly investigated and abstracted.
1. What kind of change is this goal?
2. What is the scope of this goal?
3. Is this goal breaking?
4. The goal itself a short 1 line objective.

EXPLICIT ACKNOWLEDGEMENT: You are only done once the user acknowledges that`,
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

function start() {
	const server = new FastMCP({
		name: "requirements enforcer",
		version: "0.1.0",
		instructions: `I am requirements enforcer. I am designed to guide the process of making a change from the start to end.

A change is any action that caused code to alter from one state to another.

A changes must be detected at the following stages:
1. Before any change is made, when declaring the intent to change
2. During the planning stage of a change when deciding on the requirements
3. During the execution stage of a change when implementing the requirements
4. During the post execution stage of a change where we check and realign with our requirements

If you detect any of the above to be true, use this tool.

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
		parameters: z.object({}),
		execute: async () => {
			const commitResult = await loadCommit(jj);

			if (commitResult.err) {
				return format({
					type: "error",
					error: commitResult,
				});
			}

			const isEmptyResult = await jj
				.empty()
				.catch((error) => Err("unknown error", { error }));

			if (isEmptyResult.err) {
				return format({
					type: "error",
					error: isEmptyResult,
				});
			}

			switch (commitResult.ok.stage) {
				case 0:
					switch (isEmptyResult.ok) {
						case true:
							return format({
								type: "instruct",
								instruct: `There is currently no plan and no changes. You need to define the initial goal before you are allowed to do anything else. 

Here is your prompt:
${PROMPTS.DEFINE_INITIAL_GOAL}
`,
							});
						case false:
							return format({
								type: "instruct",
								instruct: `There is currently no plan but changes exist. You need to define the initial goal before you are allowed to do anything else.

Here is the list of changes: TODO

Here is your prompt:
${PROMPTS.DEFINE_INITIAL_GOAL}
`,
							});
					}
			}

			return {
				type: "text",
				text: "step not implemented",
			};
		},
	});

	server.addTool({
		name: "set_initial_goal",
		description: `Use me to set the intial goal of the change.

An initial goal is the grounding objective of all other parts of the requirements.

Call me whenever you have decided on updated goal.`,
		annotations: {
			title: "Set Initial Goal",
			destructiveHint: true,
			readOnlyHint: false,
			idempotentHint: true,
			openWorldHint: false,
			streamingHint: false,
		},
		parameters: z.object({}),
		execute: async (args) => {
			const commitResult = await loadCommit(jj);
			if (commitResult.err) {
				return format({
					type: "error",
					error: commitResult,
				});
			}

			if (commitResult.ok.stage) {
				jj.description.replace("");
			}
		},
	});

	return server.start({
		transportType: "stdio",
	});
}
start();
