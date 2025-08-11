import { describe, expect, it } from "vitest";
import { Workflow } from "./workflow";
import { obfuscateState } from "./stateHash";

describe("Workflow", () => {
  it("should create a workflow from definition content", () => {
    const content = `
* to start: Initial state
start to end: Final state
`;

    const workflow = new Workflow(content);

    // * is the initial state - verify it has valid actions via internal transition
    const obfStart = workflow.getInternalInitialState();
    const initialResult = workflow.transition(obfStart as any, obfStart as any);
    expect(initialResult.move).toBe("invalid");
    expect(initialResult.validActions).toContainEqual({
      action: workflow.definition.transitions[obfStart] ? Object.keys(workflow.definition.transitions[obfStart])[0] as any : obfStart as any,
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

    // Map plain names to obfuscated tokens using the state's name mapping
    const obfStart = obfuscateState("start");
    const obfMiddle = obfuscateState("middle");
    const result = workflow.transition(obfStart as any, obfMiddle as any);
    expect(result.move).toBe("success");
    if (result.move === "success") {
      const obfMiddle = obfuscateState("middle");
      const obfEnd = obfuscateState("end");
      expect(result.nextState).toBe(obfMiddle);
      expect(result.validActions).toContainEqual({
        action: obfEnd,
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

    const obfStart = obfuscateState("start");
    const invalidResult = workflow.transition(obfStart as any, "invalid" as any);
    expect(invalidResult.move).toBe("invalid");
    expect(invalidResult.validActions).toEqual([
      { action: Object.keys(workflow.definition.transitions[obfStart])[0] as any, guidance: undefined },
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
    const obfStart = obfuscateState("start");
    const obfApproved = obfuscateState("approved");
    const obfRejected = obfuscateState("rejected");

    const approveResult = workflow.transition(obfStart as any, obfApproved as any);
    expect(approveResult.move).toBe("success");
    if (approveResult.move === "success") {
      expect(approveResult.nextState).toBe(obfApproved);
      expect(approveResult.guidance).toBe("Action was approved"); // Should use state guidance
    }

    // Test other transition with guidance
    const rejectResult = workflow.transition(obfStart as any, obfRejected as any);
    expect(rejectResult.move).toBe("success");
    if (rejectResult.move === "success") {
      expect(rejectResult.nextState).toBe(obfRejected);
      expect(rejectResult.guidance).toBe("Action was rejected"); // Should use state guidance
    }

    // Test invalid action
    const invalidResult = workflow.transition(obfStart as any, "invalid" as any);
    expect(invalidResult.move).toBe("invalid");
    expect(invalidResult.validActions).toEqual([
      { action: obfApproved, guidance: "User approved the action" },
      { action: obfRejected, guidance: "User rejected the action" },
    ]);
  });
  it("should validate states", () => {
    const workflow = new Workflow("* to start: Initial state");

    expect(workflow.isValidState("*")).toBe(true);
    // isValidState accepts plain names (and '*' or obfuscated names)
    // Plain names are no longer accepted; obfuscated tokens must be used
    expect(workflow.isValidState(obfuscateState("start"))).toBe(true);
    expect(workflow.isValidState("start")).toBe(false);
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
    const obfStart = obfuscateState("start");
    const obfMiddle = obfuscateState("middle");
    const obfEnd = obfuscateState("end");

    const simpleResult = workflow.transition(obfStart as any, obfMiddle as any);
    expect(simpleResult.move).toBe("success");
    if (simpleResult.move === "success") {
      expect(simpleResult.nextState).toBe(obfMiddle);
      expect(simpleResult.guidance).toBe("Simple transition"); // State guidance
    }

    // Test transition with guidance
    const conditionalResult = workflow.transition(obfMiddle as any, obfEnd as any);
    expect(conditionalResult.move).toBe("success");
    if (conditionalResult.move === "success") {
      expect(conditionalResult.nextState).toBe(obfEnd);
      expect(conditionalResult.guidance).toBe("Final state"); // State guidance
    }
  });
});
