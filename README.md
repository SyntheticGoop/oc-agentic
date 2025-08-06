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
```bash
yarn build
```

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
