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

When state obfuscation is enabled, the externalized workflow may present opaque tokens instead of the human-readable names. For example:
```
: User wants to continue the project
obf_a1b2c3 to obf_d4e5f6:
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

### State Obfuscation
The workflow engine supports an optional state obfuscation feature that replaces human-readable state identifiers with opaque, externally-facing names. This is intended for deployments where workflow state names are considered sensitive (for example, when workflows expose states through public APIs or logs).

Key points:
- Purpose: Obfuscation hides meaningful state identifiers from external observers while preserving workflow behavior for authorized callers.
- Security benefits: By removing semantic cues from exported state names, obfuscation reduces information leakage (e.g., revealing internal process names or system structure) and makes it harder for attackers to infer system behavior from state names alone.
- High-level operation: When enabled, the system deterministically maps each internal state identifier to an opaque token used in external interfaces (MCP responses, serialized outputs, and public logs). The mapping is stable for a given workflow instance but not reversible without access to the workflow's secure mapping material.
- Privacy-preserving: The obfuscated names do not contain readable fragments of the original identifiers and are designed to avoid revealing structure (such as meaningful prefixes).

Usage and considerations:
- Obfuscation is opt-in and can be enabled when loading or publishing a workflow. When enabled, external communication (MCP responses, saved exported workflow files, etc.) will display obfuscated state names instead of the human-readable identifiers.
- Authorized tools and services that need to operate on the workflow can either:
  - Use the original human-readable identifiers when interacting with the local workflow API (the engine keeps the original names internally), or
  - Use the provided mapping facility to translate obfuscated names back to the canonical internal names (access to this mapping is restricted to components with appropriate privileges).
- Backwards compatibility: Internally the workflow still uses the original state identifiers, so existing code that operates within the same runtime is unaffected. Only externalized representations change when obfuscation is enabled.
- Performance: The obfuscation layer is lightweight and deterministic; it is designed to add minimal overhead to state lookup and transition validation.

Security note (no implementation leakage): The README intentionally avoids low-level implementation details (specific algorithms, salts, or storage formats). This prevents accidental disclosure of sensitive design choices while describing the feature's high-level behavior and trade-offs.

Examples that display state names in this README have been updated to show obfuscated tokens alongside human-readable names where appropriate so readers can see how external output appears when obfuscation is enabled.

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

// Create the workflow normally (internal names shown here)
const workflow = new Workflow(workflowContent);

// Note: if state obfuscation is enabled when this workflow is published/exported,
// external interfaces will present opaque tokens instead of the human-readable names.
// For example, the same transition above may appear externally as:
// `obf_a1b2c3 to obf_d4e5f6` in exported files or logs.
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