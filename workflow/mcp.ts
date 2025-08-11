#!/usr/bin/env -S yarn tsx
process.chdir(process.env.INIT_CWD ?? process.cwd());

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { Workflow } from "./workflow";

function start() {
  // Parse CLI arguments for workflow file
  const workflows = Object.fromEntries(
    process.argv
      .filter((arg) => arg.startsWith("--workflow="))
      .map((workflow) => workflow.split("=").at(1))
      .filter((file) => typeof file === "string")
      .map((file) => {
        const workflowContent = readFileSync(file, "utf-8");
        return [
          basename(file, ".flow"),
          new Workflow(workflowContent),
        ] as const;
      }),
  );

  const server = new FastMCP({
    name: "workflow",
    version: "0.1.0",
  });

  server.addTool({
    name: "transition",
    description: "Validates workflow state transitions",
    parameters: z.object({
      workflow: z.enum(Object.keys(workflows)),
      current_state: z.string(),
      next_state: z.string(),
    }),
    execute: async (args) => {
      const workflow = workflows[args.workflow];

      // Validate obfuscated state tokens only
      if (!workflow.isValidState(args.current_state)) {
        return {
          type: "text" as const,
          text: `state: "${args.current_state}"; status = "error"; reason = "unknown state"`,
        };
      }
      if (!workflow.isValidState(args.next_state)) {
        return {
          type: "text" as const,
          text: `state: "${args.next_state}"; status = "error"; reason = "unknown state"`,
        };
      }

      const transition = workflow.transition(
        args.current_state as any,
        args.next_state as any,
      );

      switch (transition.move) {
        case "invalid":
        case "success":
          return {
            type: "text" as const,
            text: `state = "${transition.nextState}"; command = "${transition.guidance}"; [when]; ${transition.validActions.map((action) => `"${action.guidance}" = "${action.action}"`).join("; ")}`,
          };
      }
    },
  });

  server.addTool({
    name: "find",
    description: `Get first state of flow. Flows: available = [ ${Object.keys(
      workflows,
    )
      .map((key) => `"${key}"`)
      .join(" ")} ]`,
    parameters: z.object({
      workflow: z.enum(Object.keys(workflows)).optional(),
    }),
    async execute(args) {
      if (!args.workflow)
        return {
          type: "text",
          text: `"available = [ ${Object.keys(workflows)
            .map((key) => `"${key}"`)
            .join(" ")} ]`,
        };

      const workflow = workflows[args.workflow];
      return {
        type: "text",
        // Return internal obfuscated initial state for external callers
        text: `start = "${workflow.getInternalInitialState()}"`,
      };
    },
  });

  return server.start({
    transportType: "stdio",
  });
}

start();
