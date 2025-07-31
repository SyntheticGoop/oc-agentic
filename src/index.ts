#!/usr/bin/env -S yarn tsx

import { cwd } from "node:process";
import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP({
	name: "commit planner",
	version: "0.0.1",
	instructions: "When asked to 'edit commit', use this tool",
});

server.addTool({
	name: "edit",
	description: "Edit planner definition with advanced logging and validation",
	parameters: z.object({
		name: z.string().min(1, "Name must not be empty"),
		details: z
			.object({
				description: z.string().optional(),
				priority: z.enum(["low", "medium", "high"]).optional(),
			})
			.optional(),
	}),
	execute: async (args) => {
		return `Edited planner definition for: ${args.name}`;
	},
});

server.start({
	transportType: "stdio",
});

// Move to actual execution location
process.chdir(process.env.INIT_CWD ?? cwd());
