# Planner MCP Server

## Overview

The Planner MCP Server is a Model Context Protocol (MCP) server that provides project planning and task management capabilities. It enables structured project planning with persistent state management through Jujutsu version control integration.

## Core Functionality

### Project Management
- **Project CRUD Operations**: Create, read, update, and delete projects with metadata
- **Task Management**: Create, update, delete, and reorder tasks within projects
- **State Persistence**: All project data is stored in Jujutsu commit structures
- **Navigation**: Move between tasks and track project progress

### Key Features
- **Structured Project Data**: Projects include scope, title, intent, objectives, and constraints
- **Task Hierarchy**: Support for complex task structures with dependencies
- **Version Control Integration**: Leverages Jujutsu for atomic operations and history
- **Type Safety**: Comprehensive Zod schema validation for all operations
- **Error Recovery**: Robust error handling with detailed user feedback

## Architecture

### Core Components

#### MCP Server (`mcp.ts`)
- FastMCP-based server implementation
- 8 MCP tools for complete project lifecycle management
- Queue-based operation processing for consistency
- Comprehensive parameter validation using Zod schemas

#### Planning Library (`planning.ts`)
- Core business logic for project operations
- Proxy-based project interface with save/drop/goto methods
- Integration layer between MCP tools and persistence layer

#### Persistence Layer (`persistence/`)
- **Loader** (`loader.ts`): Parses Jujutsu commit structures into project data
- **Saver** (`saver.ts`): Serializes project data back to Jujutsu commits
- Support for both single-task (SHORT) and multi-task (LONG) formats

### Data Model

#### Project Structure
```typescript
type Project = {
  scope: string | null;           // Area of change (e.g., "auth", "api/v2")
  title: string;                  // Brief project description
  intent: string;                 // WHY the project exists
  objectives: string[];           // Measurable outcomes
  constraints: string[];          // Limitations and requirements
  tasks: Task[];                  // Executable task breakdown
}
```

#### Task Structure
```typescript
type Task = {
  task_key?: string;              // Unique identifier (commit hash)
  type: CommitType;               // feat/fix/refactor/build/chore/docs/lint/infra/spec
  scope: string | null;           // Task-specific scope
  title: string;                  // What work will be done
  intent: string;                 // WHY this task is needed
  objectives: string[];           // Task-specific outcomes
  constraints: string[];          // Task-specific limitations
  completed: boolean;             // Completion status
}
```

### Jujutsu Integration

#### Commit Structure Formats

**SHORT Format** (Single Task):
```
feat(auth): implement user login

User authentication is required to protect user data and enable personalized features.

## Objectives
- Users can log in with email/password
- Login session persists for 24 hours
- Failed login attempts are rate limited

## Constraints
- Must use existing PostgreSQL database
- Cannot store passwords in plain text
```

**LONG Format** (Multiple Tasks):
```
begin(auth):: implement user authentication system
  ↓
feat(auth/login):: implement login form
  ↓
feat(auth/signup):: implement registration form
  ↓
fix(auth/validation):: fix password validation
  ↓
end(auth):: implement user authentication system
```

#### Atomic Operations
- All project changes are atomic through Jujutsu commits
- Failed operations don't corrupt existing state
- Full history tracking of project evolution
- Safe concurrent access through operation queue

## MCP Tools

### Project Operations

#### `get_project`
**Purpose**: Retrieve current project state
- **Parameters**: None
- **Returns**: Complete project data with verification prompts
- **Usage**: Always call first to understand current state

#### `create_project`
**Purpose**: Create new project with metadata
- **Parameters**: `scope`, `title`, `intent`, `objectives`, `constraints`, `type`
- **Validation**: Comprehensive schema validation for all fields
- **Effect**: Creates initial project structure with first task

#### `update_project`
**Purpose**: Update project metadata (not tasks)
- **Parameters**: Partial project fields (all optional)
- **Effect**: Updates only provided fields, preserves others

#### `delete_project`
**Purpose**: Remove project completely
- **Safety**: Validates no uncommitted changes exist
- **Effect**: Abandons all project commits

### Task Operations

#### `create_task`
**Purpose**: Add new task to existing project
- **Parameters**: `type`, `scope`, `title`, `intent`, `objectives`, `constraints`, `completed`
- **Validation**: Task-specific validation with project context
- **Effect**: Appends task to project task list

#### `update_task`
**Purpose**: Modify existing task
- **Parameters**: `task_key` (required) + partial task fields
- **Safety**: Validates task exists before modification
- **Effect**: Updates specified task fields only

#### `delete_task`
**Purpose**: Remove task from project
- **Parameters**: `task_key`
- **Safety**: Ensures task has no uncommitted changes
- **Effect**: Removes task and abandons associated commit

#### `reorder_tasks`
**Purpose**: Change task execution order
- **Parameters**: `task_keys` (complete ordered list)
- **Validation**: Ensures all existing tasks are included
- **Effect**: Reorders tasks according to dependency sequence

### Navigation

#### `goto`
**Purpose**: Navigate to specific task
- **Parameters**: `task_key`
- **Effect**: Positions working directory at specified task commit
- **Usage**: Forward-only movement for task execution

## Usage Patterns

### Project Creation Workflow
```typescript
// 1. Check current state
await mcpClient.callTool("get_project", {});

// 2. Create new project
await mcpClient.callTool("create_project", {
  scope: "auth",
  title: "implement user authentication system",
  intent: "Users need secure access to protected features...",
  objectives: ["Users can register with email/password", "Login sessions persist"],
  constraints: ["Must use existing PostgreSQL database"],
  type: "feat"
});

// 3. Add additional tasks
await mcpClient.callTool("create_task", {
  type: "feat",
  scope: "auth/signup",
  title: "implement registration form",
  intent: "New users need a way to create accounts...",
  objectives: ["Registration form accepts email/password"],
  constraints: []
});
```

### Task Execution Workflow
```typescript
// 1. Review current project
await mcpClient.callTool("get_project", {});

// 2. Navigate to first task
await mcpClient.callTool("goto", { task_key: "abc123" });

// 3. Complete task and mark done
await mcpClient.callTool("update_task", {
  task_key: "abc123",
  completed: true
});

// 4. Move to next task
await mcpClient.callTool("goto", { task_key: "def456" });
```

## Validation and Error Handling

### Schema Validation
- **Commit Types**: `feat`, `fix`, `refactor`, `build`, `chore`, `docs`, `lint`, `infra`, `spec`
- **Scope Pattern**: `^[a-z][a-z0-9/.-]*$` (lowercase, letters/numbers/hyphens/dots/slashes)
- **Title Requirements**: 1-120 characters, lowercase start, no leading/trailing whitespace
- **Intent/Objectives**: Non-empty strings with meaningful content

### Error Recovery
- **Detailed Error Messages**: Specific guidance for each error type
- **State Verification**: All operations include verification prompts
- **Safety Checks**: Prevents data loss through uncommitted change detection
- **Atomic Operations**: Failed operations don't corrupt existing state

### Common Error Types
- `task_not_found`: Task key doesn't exist in project
- `invalid_task_keys`: Reorder operation with missing/extra keys
- `empty task not allowed`: Attempt to save project with no tasks
- `Cannot remove commit that has files`: Delete task with uncommitted changes

## Development and Testing

### Running the Server
```bash
# Start MCP server
yarn run:mcp:planner

# Run tests
yarn test

# Lint and format
yarn biome check --write .
```

### Dependencies
- **FastMCP**: MCP protocol implementation
- **Zod**: Schema validation and type inference
- **Jujutsu**: Version control integration (via `../src/jujutsu.ts`)
- **TypeScript**: Type safety and development experience

### Code Quality
- **Type Safety**: Comprehensive TypeScript usage with strict mode
- **Schema Validation**: All inputs validated with Zod schemas
- **Error Handling**: Result types for explicit error management
- **Documentation**: Extensive inline documentation and examples

## Integration

### Jujutsu Requirements
- Working Jujutsu repository
- Proper commit structure for project data
- Empty commits for metadata storage

### MCP Client Integration
- Standard MCP protocol compatibility
- Tool parameter validation
- Structured response formats
- Error handling patterns

This planner provides a robust foundation for structured project management with version control integration, type safety, and comprehensive error handling.