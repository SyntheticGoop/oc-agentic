# Workflow System

A TypeScript-based workflow state machine system with lexer, parser, and MCP server integration for defining and executing complex state transitions.

## Overview

The workflow system consists of:
- **Lexer** (`lexer.ts`): Tokenizes workflow definition files
- **Parser** (`parser.ts`): Parses tokens into workflow definitions
- **Workflow Engine** (`workflow.ts`): Executes state transitions and validates moves
- **MCP Server** (`mcp.ts`): Provides Model Context Protocol integration
- **PLANNER** file: Example workflow definition for project planning

## Workflow Syntax

The system uses a simplified syntax for defining state machines:

### Basic Structure
```
from_state to to_state
```

### With Transition Guidance
```
: Guidance text explaining when this transition occurs
from_state to to_state
```

### With State Guidance
```
from_state to to_state:
  Detailed instructions for what to do in the target state.
  Can span multiple indented lines.
```

### Complete Example
```
: User wants to continue the project
initial_loaded to continue_project:
  Display current project status to the user.
  Ask if they want to proceed with existing tasks.
```

## Grammar Definition

```ebnf
workflow       ::= transition_list
transition_list ::= transition+
transition     ::= (guidance_line)? state "to" state (state_guidance)? newline
guidance_line  ::= ":" content newline
state_guidance ::= ":" (content | indented_content)
state          ::= identifier | "*"
content        ::= [^\n:]+
indented_content ::= newline (whitespace content newline)+
identifier     ::= [a-zA-Z_][a-zA-Z0-9_]*
comment        ::= ("#" | "//") [^\n]* newline
newline        ::= "\n" | "\r\n"
whitespace     ::= [ \t]+
```

## Key Features

### States
- **Regular states**: Alphanumeric identifiers with underscores (e.g., `initial_loaded`, `define_project`)
- **Initial state**: `*` represents the workflow entry point
- **Terminal state**: `*` can also be used as an exit point
- **Auto-creation**: All referenced states are automatically created

### Guidance System
- **Transition guidance**: Lines starting with `:` explain when a transition should occur
- **State guidance**: Text after `:` on transition lines explains what to do in the target state
- **Multi-line support**: State guidance can span multiple indented lines

### Comments
- Line comments start with `#` or `//`
- Comments are ignored during parsing
- Block comments are not supported

## API Usage

### Creating a Workflow
```typescript
import { Workflow } from './workflow';

const workflowContent = `
* to initial_loaded:
  Load project state and display to user.

: User wants to continue
initial_loaded to continue_project
`;

const workflow = new Workflow(workflowContent);
```

### Executing Transitions
```typescript
const result = workflow.transition('initial_loaded', 'continue_project');

if (result.move === 'success') {
  console.log(`Moved to: ${result.nextState}`);
  console.log(`Guidance: ${result.guidance}`);
  console.log('Valid next actions:', result.validActions);
} else {
  console.log('Invalid transition');
  console.log('Valid actions:', result.validActions);
}
```

### Validating States
```typescript
if (workflow.isValidState('some_state')) {
  // State exists in the workflow
}
```

## MCP Server Integration

The workflow system includes an MCP (Model Context Protocol) server for integration with AI systems:

### Starting the Server
```bash
yarn tsx workflow/mcp.ts --workflow=path/to/workflow/file
```

### MCP Tool: `transition`
Validates and executes workflow state transitions with parameters:
- `current_state`: Current workflow state
- `next_state`: Desired next state
- `planner_operation` (optional): Operation context
- `validation_result` (optional): Validation context
- `task_status` (optional): Task status context
- `user_response` (optional): User input context
- `project_data` (optional): Project data context

### Response Format
```
status: success|error
current state: <state_name>
valid transitions:
  - action: <action_name>
    when: <guidance_text>
guidance: <state_guidance>
```

## Example: PLANNER Workflow

The included `PLANNER` file demonstrates a complete project planning workflow with states like:
- `initial_loaded`: Entry point, loads project state
- `define_project`: Collects project requirements
- `refine_project`: Iterative project refinement
- `create_project`: Project creation
- `refine_tasks`: Task management
- `execution`: Task execution
- `all_tasks_complete`: Completion handling

## Testing

The system includes comprehensive tests:
- **Unit tests**: `lexer.test.ts`, `parser.test.ts`, `workflow.test.ts`
- **E2E tests**: `lexer-e2e.test.ts`, `parser-e2e.test.ts`, `workflow-e2e.test.ts`

Run tests with:
```bash
yarn test workflow/
```

## Architecture

### Lexer (`lexer.ts`)
- Tokenizes workflow files into structured tokens
- Handles comments, whitespace, and multi-line content
- Supports line continuations with indentation

### Parser (`parser.ts`)
- Converts tokens into `WorkflowDefinition` objects
- Creates state and transition mappings
- Handles guidance text and multi-line content

### Workflow Engine (`workflow.ts`)
- Executes state transitions
- Validates moves and provides feedback
- Returns available actions and guidance

### Type System
- `WorkflowState`: Branded string type for type safety
- `TransitionResult`: Union type for success/failure results
- `WorkflowDefinition`: Complete workflow structure