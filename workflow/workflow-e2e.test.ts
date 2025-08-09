import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";
import { WorkflowParser } from "./parser";
import { Workflow } from "./workflow";

describe("Workflow E2E Tests", () => {
  it("should parse scoped-execution.flow file with new simplified syntax", () => {
    // Read the scoped-execution.flow file
    const plannerMarkovPath = join(__dirname, "scoped-execution.flow");
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
      "refine_tasks",
      "check_tasks",
      "update_task",
      "delete_task",
      "reorder_tasks",
      "final_check",
      "parallel_update",
      "execution",
      "loop_tasks",
      "run_task",
      "mark_task",
      "redefine_task",
      "all_tasks_complete",
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
    expect(workflowDef.transitions.initial_loaded?.refine_tasks).toBeDefined();
    expect(workflowDef.transitions.initial_loaded?.refine_tasks?.guidance).toBe(
      "Ask: Do you want to continue with existing tasks?",
    );


    // Verify transitions to initial state work
    expect(
      workflowDef.transitions.all_tasks_complete?.initial_loaded,
    ).toBeDefined();
    expect(
      workflowDef.transitions.all_tasks_complete?.initial_loaded?.guidance,
    ).toBe("User is satisfied with output");
  });

  it("should create a Workflow instance from scoped-execution.flow", () => {
    // Read the scoped-execution.flow file
    const plannerMarkovPath = join(__dirname, "scoped-execution.flow");
    const content = readFileSync(plannerMarkovPath, "utf8");

    // Create a Workflow instance
    const workflow = new Workflow(content);

    // Test state transitions using the public API
    const result1 = workflow.transitionPlain("initial_loaded", "refine_tasks");
    expect(result1.move).toBe("success");
    if (result1.move === "success") {
      expect(result1.nextState).toBe("refine_tasks");
    }
  });

  it("should handle all transition types in scoped-execution.flow", () => {
    const plannerMarkovPath = join(__dirname, "scoped-execution.flow");
    const content = readFileSync(plannerMarkovPath, "utf8");

    const lexer = new WorkflowLexer(content);
    const tokens = lexer.tokenize();
    const parser = new WorkflowParser(tokens);
    const workflowDef = parser.parse();

    // Count different types of transitions
    let transitionsWithGuidance = 0;
    let transitionsWithoutGuidance = 0;
    let selfReferencingTransitions = 0;
    let _transitionsToEndState = 0;

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
              _transitionsToEndState++;
            }
          });
        }
      },
    );

    expect(transitionsWithGuidance).toBeGreaterThan(0);
    expect(transitionsWithoutGuidance).toBeGreaterThan(0);
    expect(selfReferencingTransitions).toBe(0);
    // Note: scoped-execution.flow doesn't have transitions to end state (*)
  });

  it("should verify no old syntax remains in scoped-execution.flow", () => {
    const plannerMarkovPath = join(__dirname, "scoped-execution.flow");
    const content = readFileSync(plannerMarkovPath, "utf8");

    // Check that old syntax patterns are not present in transitions (not in guidance text)
    // Look for the old pattern: "state if condition to state"
    expect(content).not.toMatch(/\w+\s+if\s+\w+\s+to\s+\w+/); // No old conditional syntax
    expect(content).not.toMatch(/>/); // No ">" arrows

    // Check that new syntax patterns are present
    expect(content).toMatch(/\sto\s/); // "to" keywords present
    expect(content).toMatch(/^:/m); // Lines starting with ":" for guidance
  });
  it("should produce consistent parsing results", () => {
    const plannerMarkovPath = join(__dirname, "scoped-execution.flow");
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
  });
});
