# Commit Planner MCP Tool - Design Specification

## Overview

The Commit Planner is an MCP (Model Context Protocol) tool designed to work with the jujutsu version control system to systematically plan and execute tasks. It uses the current commit description to store planning and task information in a structured format.

## Commit Structure Format

```
type(scope)!: summary description

long description

Constraints:
- constraint 1
- constraint n

Tasks [ ]:
- [ ] Step 1 summary: more details
  - [ ] Step 1.1 summary: more details
    - [ ] Step 1.1.1 summary: more details
- [ ] Step 2 summary: more details
- [x] Step n summary: more details
```

### Header Format: `type(scope)!: summary description`

**Type Decision Matrix:**
1. If any change is a `feat`, the type is `feat`
2. If any change is a `fix`, and there are no `feat`, the type is `fix`
3. If any change is a `refactor`, and there are no `feat` or `fix`, the type is `refactor`
4. Priority order: `ci` > `build` > `docs` > `chore` > `lint`
5. If changes can be cleanly broken up, create multiple commits

**Valid Types:**
- `feat`: Adding or modifying functionality visible to the user
- `fix`: Change that aligns behavior with promised behavior
- `refactor`: Code restructuring without altering behavior
- `build`: Changes to build process
- `chore`: Configuration file modifications
- `docs`: Documentation updates
- `lint`: File formatting
- `ci`: CI-related file modifications

**Scope Rules:**
- Lowercase noun describing affected program part
- Can be services, libraries, HTTP resource prefixes, or conceptual names
- If all changes can't be captured by one noun, split the commit

**Breaking Changes:**
- Add `!` after scope for breaking changes
- Breaking = significant behavior change making previous API incompatible

**Summary:**
- Core intent of change in imperative active voice
- Single line instruction someone else could follow

### Long Description
Must contain:
1. Reason for change - why it was necessary
2. What needed to be changed - high level process
3. How things were changed
4. Important context for code readers

### Constraints
- Optional section
- If no constraints: `Constraints: none` (literal text required)
- Enforced prefixes: "Do not:", "Never:", "Avoid:", "Decide against:", "Must not:", "Cannot:", "Forbidden:"
- Absolute constraints that cannot be violated

### Tasks
- Detailed, sequential steps
- Up to 4 levels of nesting
- Format: `summary: details`
- Only leaf nodes contain actual work
- Parent tasks group work only
- Checkbox format: `[ ]` incomplete, `[x]` complete
- Tasks header: `Tasks [ ]` incomplete, `Tasks [X]` complete (boolean)

## Data Structure

```typescript
type CommitPlan = {
  header: {
    type: CommitType;
    scope?: string;
    breaking: boolean;
    summary: string;
  };
  description: string;
  constraints: string[];
  tasks: TaskNode[];
  metadata: {
    totalTasks: number;
    completedTasks: number;
    isComplete: boolean;
  };
}

type TaskNode = {
  id: string; // derived from summary (slugified)
  summary: string; // unique within same level
  details: string;
  completed: boolean;
  children: TaskNode[];
  level: number; // 0-3 (4 levels max)
  parent_id?: string;
}

type CommitType = "feat" | "fix" | "refactor" | "build" | "chore" | "docs" | "lint" | "ci";

type PlanState = {
  phase: "uninitialized" | "planning" | "executing" | "complete";
  has_goal: boolean;
  has_description: boolean;
  has_constraints: boolean;
  has_tasks: boolean;
  current_task_id?: string;
  total_tasks: number;
  completed_tasks: number;
}

type ToolResponse = {
  status: "success" | "error";
  action_taken: string;
  current_state: PlanState;
  next_actions: {
    recommended: string[];
    blocked: string[];
    available: string[];
  };
  alignment_check?: {
    question: string;
    required_confirmation: boolean;
  };
  raw_commit_content?: string; // For malformed commits
}
```

## Jujutsu Integration

**Commands Used:**
- `jj desc -m "message"` - Edit commit descriptions
- `jj log -r @ -T builtin_log_compact_full_description` - Read current commit
- `jj log -r @ --summary` - Check for modifications (empty commit detection)
- `jj new` - Create new commits

**Error Handling:**
- If jujutsu commands fail, return strong error message that halts all work
- Error response must be severe enough that user stops to fix jujutsu issues
- All tools become non-functional until jujutsu is resolved

## Tool Set (12 Tools)

### Core Planning Tools
1. **start_planning** - Initialize new structured commit plan
2. **get_plan** - Read and parse current commit structure
3. **update_goal** - Modify header section (type/scope/summary)
4. **update_description** - Modify long description section

### Constraint Management
5. **get_constraints** - Read current constraints
6. **set_constraints** - Set/update constraints list

### Task Management
7. **get_tasks** - Read current task hierarchy
8. **set_tasks** - Define/update task hierarchy
9. **mark_task** - Toggle task completion status

### Completion Management
10. **finish_job** - Mark entire scope as complete (requires all tasks done)
11. **unfinish_job** - Mark scope as incomplete
12. **verify_plan** - Migration tool and final alignment check

## Workflow States

**Stateless Operation:**
- All state derived from current commit content only
- No memory between tool calls
- Single active plan enforcement based on commit completion status
- Any state can transition to any other state with guidance

**Typical Flow:**
1. `start_planning()` - Define type(scope): summary
2. `update_description()` - Explain why/what/how
3. `set_constraints()` - Define limitations (optional)
4. `set_tasks()` - Break into actionable steps
5. `mark_task()` - Complete tasks sequentially
6. `finish_job()` - Mark entire scope complete

## Validation Rules

**Commit Format:**
- Strict regex parsing required before writing
- All-or-nothing validation: any parsing failure = invalid commit
- Auto-convert scope to lowercase, warn about convention
- Summary max length: 120 characters
- Scope pattern: `^[a-z][a-z0-9-]*$`

**Task IDs:**
- Generated from task summary (slugified)
- Must be unique within same nesting level
- Tool prevents ID conflicts, user-created conflicts = invalid commit
- Used for stable task references

**Task Counting:**
- Count all tasks at all levels (not just leaf nodes)
- Parent task complete only if ALL children complete
- Nested completion propagates upward

**Completion Logic:**
- `finish_job()` only succeeds when all tasks complete
- Tasks header updates from `[ ]` to `[X]` only on completion
- Commits without tasks never considered complete

**Empty Commit Detection:**
- If `jj log` returns empty, check `jj log -r @ --summary` for modifications
- Only uninitialized if commit is truly empty (no description, no modifications)

## Migration & Alignment

**Malformed Commits:**
- Use sampling prompt to request user reformatting
- Provide structured format examples
- Offer choice: A) Reformat this commit, or B) Work with current message as read-only context
- If A chosen: Tool guides through validation process in subsequent calls
- If B chosen: All tools provide raw commit content for LLM context but remain non-functional

**Alignment Strategy:**
- Every response reinforces next actions and blocked actions
- After plan updates, reset and question LLM on status of each task
- Status reconciliation through explicit confirmation
- All state derived from commit analysis, no memory between calls
- Workflow guidance based on what's missing in current commit structure

**Sampling Prompt Template:**
```
Current commit message does not follow structured format.

CURRENT MESSAGE:
${rawMessage}

Please reformat into this structure:
type(scope)!: summary

long description

Constraints:
- Do not: [constraint]

Tasks [ ]:
- [ ] summary: details

Choose: A) Reformat this commit, or B) Work with current message as read-only context
```

## LLM Guidance

**Initial Prompt Structure:**
- Include ideal workflow example
- Provide planning best practices
- Emphasize flexibility while maintaining structure
- Include constraint formatting guidelines

**Response Strategy:**
- Always include current state and next recommended actions
- List blocked actions with reasons
- Provide alignment checks when plan changes
- Guide LLM back to structured workflow without forcing

**Key Principles:**
- Completely stateless operation - all state from commit content
- Trust LLM self-reporting (tool cannot detect actual work done)
- Maintain structural communication requirements
- Drive alignment through guidance, not blocking
- Support any path that leads to complete, valid structure
- Single active plan enforcement based on completion status in commit
- Provide raw commit content for context even when malformed