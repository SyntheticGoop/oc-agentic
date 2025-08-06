import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";
import { WorkflowParser } from "./parser";
import { Workflow, type WorkflowState } from "./workflow";

describe("Workflow E2E Tests", () => {
  it("should parse PLANNER_MARKOV file with new simplified syntax", () => {
    // Read the PLANNER_MARKOV file
    const plannerMarkovPath = join(__dirname, "PLANNER");
    const content = readFileSync(plannerMarkovPath, "utf8");

    // Parse the workflow
    const lexer = new WorkflowLexer(content);
    const tokens = lexer.tokenize();
    const parser = new WorkflowParser(tokens);
    const workflowDef = parser.parse();

    // Basic validation
    expect(workflowDef.initialState).toBe("initial_loaded");
    expect(workflowDef.states).toBeDefined();
    expect(workflowDef.transitions).toBeDefined();

    // Verify we have the expected states
    const expectedStates = [
      "*",
      "initial_loaded",
      "continue_project",
      "define_project",
      "refine_project",
      "create_project",
      "maybe_create_project",
      "refine_tasks",
      "check_tasks",
      "update_task",
      "delete_task",
      "reorder_tasks",
      "final_check",
      "parallel_update",
      "execution",
      "all_tasks_complete",
      "run_task",
    ];

    expectedStates.forEach((state) => {
      expect(workflowDef.states[state]).toBeDefined();
      expect(workflowDef.states[state]?.name).toBe(state);
    });

    // Verify initial transition exists
    expect(workflowDef.transitions["*"]).toBeDefined();
    expect(workflowDef.transitions["*"]?.initial_loaded).toBeDefined();
    expect(workflowDef.transitions["*"]?.initial_loaded?.target).toBe(
      "initial_loaded",
    );

    // Verify some key transitions with guidance
    expect(workflowDef.transitions.initial_loaded).toBeDefined();
    expect(
      workflowDef.transitions.initial_loaded?.continue_project,
    ).toBeDefined();
    expect(
      workflowDef.transitions.initial_loaded?.continue_project?.guidance,
    ).toBe("User wants to continue the project");

    expect(
      workflowDef.transitions.initial_loaded?.define_project,
    ).toBeDefined();
    expect(
      workflowDef.transitions.initial_loaded?.define_project?.guidance,
    ).toBe("User wants to start a new project");

    // Verify self-referencing transitions work
    expect(
      workflowDef.transitions.refine_project?.refine_project,
    ).toBeDefined();
    expect(
      workflowDef.transitions.refine_project?.refine_project?.guidance,
    ).toBe("User responds to questions");

    // Verify transitions to end state work
    expect(workflowDef.transitions.all_tasks_complete?.["*"]).toBeDefined();
    expect(workflowDef.transitions.all_tasks_complete?.["*"]?.guidance).toBe(
      "User is unsatisfied with output",
    );

    const stateCount = Object.keys(workflowDef.states).length;
    const transitionCount = Object.values(workflowDef.transitions).reduce(
      (sum, t) => sum + Object.keys(t || {}).length,
      0,
    );
    console.log(
      `✅ Successfully parsed PLANNER_MARKOV with ${stateCount} states and ${transitionCount} transitions`,
    );
  });

  it("should create a Workflow instance from PLANNER_MARKOV", () => {
    // Read the PLANNER_MARKOV file
    const plannerMarkovPath = join(__dirname, "PLANNER");
    const content = readFileSync(plannerMarkovPath, "utf8");

    // Create a Workflow instance
    const workflow = new Workflow(content);

    // Test state transitions using the correct API
    const initialState = "initial_loaded" as WorkflowState;
    const continueProject = "continue_project" as WorkflowState;

    // Test state transitions
    const result1 = workflow.transition(initialState, continueProject);
    expect(result1.move).toBe("success");
    if (result1.move === "success") {
      expect(result1.nextState).toBe("continue_project");
      expect(result1.guidance).toBe("User wants to continue the project");
    }

    console.log(
      "✅ Successfully created and tested Workflow instance from PLANNER_MARKOV",
    );
  });

  it("should handle all transition types in PLANNER_MARKOV", () => {
    const plannerMarkovPath = join(__dirname, "PLANNER");
    const content = readFileSync(plannerMarkovPath, "utf8");

    const lexer = new WorkflowLexer(content);
    const tokens = lexer.tokenize();
    const parser = new WorkflowParser(tokens);
    const workflowDef = parser.parse();

    // Count different types of transitions
    let transitionsWithGuidance = 0;
    let transitionsWithoutGuidance = 0;
    let selfReferencingTransitions = 0;
    let transitionsToEndState = 0;

    Object.entries(workflowDef.transitions).forEach(
      ([fromState, transitions]) => {
        if (transitions) {
          Object.entries(transitions).forEach(([, transition]) => {
            if (transition?.guidance) {
              transitionsWithGuidance++;
            } else {
              transitionsWithoutGuidance++;
            }

            if (fromState === transition?.target) {
              selfReferencingTransitions++;
            }

            if (transition?.target === "*") {
              transitionsToEndState++;
            }
          });
        }
      },
    );

    expect(transitionsWithGuidance).toBeGreaterThan(0);
    expect(transitionsWithoutGuidance).toBeGreaterThan(0);
    expect(selfReferencingTransitions).toBeGreaterThan(0);
    expect(transitionsToEndState).toBeGreaterThan(0);

    console.log(`✅ Transition analysis:
		- With guidance: ${transitionsWithGuidance}
		- Without guidance: ${transitionsWithoutGuidance}  
		- Self-referencing: ${selfReferencingTransitions}
		- To end state: ${transitionsToEndState}`);
  });

  it("should verify no old syntax remains in PLANNER_MARKOV", () => {
    const plannerMarkovPath = join(__dirname, "PLANNER");
    const content = readFileSync(plannerMarkovPath, "utf8");

    // Check that old syntax patterns are not present in transitions (not in guidance text)
    // Look for the old pattern: "state if condition to state"
    expect(content).not.toMatch(/\w+\s+if\s+\w+\s+to\s+\w+/); // No old conditional syntax
    expect(content).not.toMatch(/>/); // No ">" arrows

    // Check that new syntax patterns are present
    expect(content).toMatch(/\sto\s/); // "to" keywords present
    expect(content).toMatch(/^:/m); // Lines starting with ":" for guidance

    console.log("✅ Verified PLANNER_MARKOV uses only new simplified syntax");
  });
  it("should produce consistent parsing results", () => {
    const plannerMarkovPath = join(__dirname, "PLANNER");
    const content = readFileSync(plannerMarkovPath, "utf8");

    // Parse the same content multiple times
    const results = [];
    for (let i = 0; i < 3; i++) {
      const lexer = new WorkflowLexer(content);
      const tokens = lexer.tokenize();
      const parser = new WorkflowParser(tokens);
      const workflowDef = parser.parse();
      results.push(workflowDef);
    }

    // Verify all results are identical
    const firstResult = results[0];
    results.slice(1).forEach((result) => {
      expect(result.initialState).toBe(firstResult.initialState);
      expect(Object.keys(result.states)).toEqual(
        Object.keys(firstResult.states),
      );
      expect(Object.keys(result.transitions)).toEqual(
        Object.keys(firstResult.transitions),
      );
    });

    console.log("✅ Parsing results are consistent across multiple runs");
  });
});
