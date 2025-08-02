# planner-mcp

## Cyclical Workflow

The requirements enforcer implements a cyclical development workflow that enables continuous development cycles:

### 5-Step Process

1. **gather_requirements()** - Assess current state and get appropriate guidance
2. **Follow guided workflow** - Progress through: goal → detailed → plan → execute
3. **Automatic completion detection** - When all tasks complete, gather_requirements() detects completion
4. **new_commit()** - Start fresh cycle and reset state
5. **Return to step 1** - Begin new requirements cycle

### Workflow Stages

1. **Intent Declaration** - Before any change is made, when declaring the intent to change
2. **Planning Stage** - During the planning stage of a change when deciding on requirements
3. **Execution Stage** - During the execution stage of a change when implementing requirements
4. **Automatic Completion** - When all tasks are done
5. **Fresh Cycle Initiation** - For continuous development

### Usage

Always start with `gather_requirements()` to begin or continue the workflow. The system will guide you through each stage and automatically detect when it's time to start a new cycle.

#### Example Workflow Cycle

```
1. gather_requirements() 
   → "You need to define or update the overarching goal..."

2. set_overarching_goal({type: "feat", scope: "api", breaking: false, title: "add user authentication"})
   → "Work with the user to explore and expand the requirements..."

3. set_detailed_goal({description: "Implement JWT-based authentication..."})
   → "Present a plan of action..."

4. set_plan({plan: [...]})
   → "Execute tasks sequentially..."

5. mark_task({task_id: "implement jwt", completed: true})
   → "Continue with next task..."

6. [All tasks complete]
   gather_requirements()
   → "WORKFLOW COMPLETED SUCCESSFULLY! Use new_commit() to start fresh cycle."

7. new_commit()
   → "NEW COMMIT CREATED SUCCESSFULLY. CALL gather_requirements() NOW."

8. gather_requirements()
   → [New cycle begins...]
```

### Tools

#### new_commit()

The `new_commit()` tool enables the cyclical workflow by resetting the system state and preparing for a new development cycle.

**Purpose:**
- Transitions from completed workflow to fresh cycle
- Resets all requirements, plans, and task states
- Creates a clean slate for new development work

**When to use:**
- After `gather_requirements()` indicates "WORKFLOW COMPLETED SUCCESSFULLY"
- When you want to start working on a completely new change
- To begin a fresh requirements cycle

**Technical behavior:**
- Calls `jj.new()` to reset commit state
- Clears all previous requirements and task data
- Immediately prompts to call `gather_requirements()` to begin new cycle

**Note:** This tool should only be used when the current workflow is complete. Using it mid-workflow will lose all current progress.
