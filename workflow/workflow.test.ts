import { describe, expect, it } from "vitest";
import { Workflow } from "./workflow";

describe("Workflow", () => {
  it("should create a workflow from definition content", () => {
    const content = `
* to start: Initial state
start to end: Final state
`;

    const workflow = new Workflow(content);

    // * is the initial state - verify it has valid actions via transitionPlain
    const initialResult = workflow.transitionPlain("*", "dummy");
    expect(initialResult.move).toBe("invalid");
    expect(initialResult.validActions).toContainEqual({
      action: "start",
      guidance: undefined,
    });
    expect(initialResult.guidance).toBe("Initial state");
  });
  it("should handle transitions correctly", () => {
    const content = `
* to start: Initial state
start to middle: Go to middle
middle to end: Go to end
`;

    const workflow = new Workflow(content);

    const result = workflow.transitionPlain("start", "middle");
    expect(result.move).toBe("success");
    if (result.move === "success") {
      expect(result.nextState).toBe("middle");
      expect(result.validActions).toContainEqual({
        action: "end",
        guidance: undefined,
      });
    }
  });
  it("should reject invalid transitions", () => {
    const content = `
* to start: Initial state
start to end: Final state
`;

    const workflow = new Workflow(content);

    const result = workflow.transitionPlain("start", "invalid");
    expect(result.move).toBe("invalid");
    expect(result.validActions).toEqual([
      { action: "end", guidance: undefined },
    ]);
  });
  it("should handle transition guidance", () => {
    const content = `
* to start: Initial state
: User approved the action
start to approved: Action was approved
: User rejected the action  
start to rejected: Action was rejected
`;

    const workflow = new Workflow(content);

    // Test successful transition with guidance
    const approveResult = workflow.transitionPlain("start", "approved");
    expect(approveResult.move).toBe("success");
    if (approveResult.move === "success") {
      expect(approveResult.nextState).toBe("approved");
      expect(approveResult.guidance).toBe("Action was approved"); // Should use state guidance
    }

    // Test other transition with guidance
    const rejectResult = workflow.transitionPlain("start", "rejected");
    expect(rejectResult.move).toBe("success");
    if (rejectResult.move === "success") {
      expect(rejectResult.nextState).toBe("rejected");
      expect(rejectResult.guidance).toBe("Action was rejected"); // Should use state guidance
    }

    // Test invalid action
    const invalidResult = workflow.transitionPlain("start", "invalid");
    expect(invalidResult.move).toBe("invalid");
    expect(invalidResult.validActions).toEqual([
      { action: "approved", guidance: "User approved the action" },
      { action: "rejected", guidance: "User rejected the action" },
    ]);
  });
  it("should validate states", () => {
    const workflow = new Workflow("* to start: Initial state");

    expect(workflow.isValidState("*")).toBe(true);
    // isValidState accepts plain names (and '*' or obfuscated names)
    expect(workflow.isValidState("start")).toBe(true);
    expect(workflow.isValidState("invalid")).toBe(false);
  });
  it("should handle transition guidance precedence", () => {
    const content = `
* to start: Initial state
start to middle: Simple transition
: Conditional guidance
middle to end: Final state
`;

    const workflow = new Workflow(content);

    // Test simple transition
    const simpleResult = workflow.transitionPlain("start", "middle");
    expect(simpleResult.move).toBe("success");
    if (simpleResult.move === "success") {
      expect(simpleResult.nextState).toBe("middle");
      expect(simpleResult.guidance).toBe("Simple transition"); // State guidance
    }

    // Test transition with guidance
    const conditionalResult = workflow.transitionPlain("middle", "end");
    expect(conditionalResult.move).toBe("success");
    if (conditionalResult.move === "success") {
      expect(conditionalResult.nextState).toBe("end");
      expect(conditionalResult.guidance).toBe("Final state"); // State guidance
    }
  });
});
