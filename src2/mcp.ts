#!/usr/bin/env -S yarn tsx

import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP({
	name: "requirements enforcer",
	version: "0.1.0",
	instructions:
		"Requirement enforcer MCP server with single gather_requirements tool",
});

// Single tool: gather_requirements
server.addTool({
	name: "gather_requirements",
	description: "Gather and organize project requirements from various sources",
	parameters: z.object({}),
	execute: async (args) => {
		return {
			type: "text",
			text: "requirements gathered",
		};
	},
});

server.start({
	transportType: "stdio",
});
