#!/usr/bin/env -S yarn tsx
process.chdir(process.env.INIT_CWD ?? process.cwd());

import { readFileSync } from "node:fs";
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { Workflow } from "./workflow";

function start() {
  // Parse CLI arguments for workflow file
  const workflowArg = process.argv.find((arg) => arg.startsWith("--workflow="));
  const workflowFile = workflowArg ? workflowArg.split("=")[1] : null;

  if (workflowFile === null) throw Error("Missing workflow");
  const workflowContent = readFileSync(workflowFile, "utf-8");
  const WORKFLOW = new Workflow(workflowContent);

  const server = new FastMCP({
    name: "workflow",
    version: "0.1.0",
  });
  server.addTool({
    name: "transition",
    description: "Validates workflow state transitions",
    parameters: z.object({
      current_state: z.string(),
      next_state: z.string(),
      planner_operation: z.string().optional(),
      validation_result: z.string().optional(),
      task_status: z.string().optional(),
      user_response: z.string().optional(),
      project_data: z.string().optional(),
    }),
    execute: async (args) => {
      if (!WORKFLOW.isValidState(args.current_state)) {
        return {
          type: "text" as const,
          text: [
            "status: error",
            "reason: unknown state",
            `state: ${args.current_state}`,
          ].join("\n"),
        };
      }
      if (!WORKFLOW.isValidState(args.next_state)) {
        return {
          type: "text" as const,
          text: [
            "status: error",
            "reason: unknown state",
            `state: ${args.next_state}`,
          ].join("\n"),
        };
      }

      const transition = WORKFLOW.transition(
        args.current_state,
        args.next_state,
      );

      switch (transition.move) {
        case "invalid":
          return {
            type: "text" as const,
            text: [
              "status: error",
              "reason: invalid transition",
              `from state: ${args.current_state}`,
              `invalid transition: ${args.next_state}`,
              ...[
                "valid transitions:",
                ...transition.validActions.flatMap((transition) => [
                  `  - action: ${transition.action}`,
                  `    when: ${transition.guidance ?? "automatically"}`,
                ]),
              ],
              `guidance: ${transition.guidance}`,
            ].join("\n"),
          };
        case "success":
          return {
            type: "text" as const,
            text: [
              "status: success",
              `current state: ${transition.nextState}`,
              ...[
                "valid transitions:",
                ...transition.validActions.flatMap((transition) => [
                  `  - action: ${transition.action}`,
                  `    when: ${transition.guidance ?? "automatically"}`,
                ]),
              ],
              `guidance: ${transition.guidance}`,
            ].join("\n"),
          };
      }
    },
  });

  return server.start({
    transportType: "stdio",
  });
}

start();
