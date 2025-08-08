# opencode-agentic

A collection of tools and utilities designed to enable agentic workflows for opencode, providing structured approaches to software development tasks.

## Overview

This project provides MCP (Model Context Protocol) servers that implement agentic workflow patterns for software development. It includes tools for planning, task management, and workflow orchestration that help AI agents work more effectively on complex development tasks.

## Components

### Planner MCP Server
Located in `planner/`, this component provides:
- Task planning and management capabilities
- Persistent state management for development workflows
- Integration with version control systems (Jujutsu)

### Workflow MCP Server  
Located in `workflow/`, this component provides:
- Workflow definition and execution
- Structured development process management
- Customizable workflow patterns

## Getting Started

### Prerequisites
- Node.js and Yarn package manager
- TypeScript support

### Installation
```bash
yarn install
```

### Running MCP Servers

**Planner Server:**
```bash
yarn run:mcp:planner
```

**Workflow Server:**
```bash
yarn run:mcp:workflow --workflow=path/to/workflow/file
```

### Development

**Run tests:**
```bash
yarn test
```

**Lint and format:**
```bash
yarn lint
```

**Build:**
The project provides targeted build scripts and a unified build that outputs to the dist/ directory. The build is split into focused sub-commands so each MCP server and static assets can be bundled independently and then combined for distribution.

- Build the planner MCP server (bundles planner/mcp.ts to dist/planner/):
```bash
yarn build:mcp:planner
```

- Build the workflow MCP server (bundles workflow/mcp.ts to dist/workflow-mcp/):
```bash
yarn build:mcp:workflow
```

- Build the workflow LSP server (bundles workflow/lsp-server.ts to dist/workflow/):
```bash
yarn build:workflow:lsp
```

- Copy deliverable assets (prompts and .flow files) into dist/:
```bash
yarn build:assets
```

- Run a build validation that verifies copied assets and flow files exist:
```bash
yarn build:validate
```

- Run the unified build (runs all of the above in sequence):
```bash
yarn build
```

Expected distribution directory structure after a successful run:

- dist/
  - planner/         (bundled planner MCP server)
  - workflow-mcp/    (bundled workflow MCP server)
  - workflow/        (bundled workflow LSP server and any .flow files)
  - prompts/         (copied prompts with subdirectories preserved, e.g. system/, agent/)

Notes and validation steps:
- The build uses tsup to bundle the TypeScript entry points. The workflow MCP bundle is placed in dist/workflow-mcp/ to avoid colliding with the existing LSP build placed in dist/workflow/.
- The assets copy preserves the prompts/ subdirectory structure (prompts/system, prompts/agent) and copies .flow files from the workflow/ folder into dist/workflow/.
- To perform a full build and validate it locally:
  1. Install dependencies: yarn install
  2. Run the unified build: yarn build
  3. Run the quick validation: yarn build:validate

If validation fails, inspect the dist/ directory to see which step did not produce the expected files or directories. The build scripts are intentionally permissive (use of || true) for the assets copy to avoid failing in environments that may not have specific files present; adjust as needed for stricter CI checks.

## Project Structure

- `planner/` - Planning and task management MCP server
- `workflow/` - Workflow execution MCP server  
- `src/` - Shared utilities and core functionality
- `prompts/` - System prompts and agent guidelines

## Contributing

This project uses:
- TypeScript with strict mode
- Biome for formatting and linting
- Vitest for testing
- Yarn 4.9.2 for package management
