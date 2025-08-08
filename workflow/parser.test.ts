import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";
import { WorkflowParser } from "./parser";
import { scrambleWorkflowDefinition, obfuscateName } from "../src/workflowScrambler";

function parseWorkflow(input: string) {
  const lexer = new WorkflowLexer(input);
  const tokens = lexer.tokenize();
  const parser = new WorkflowParser(tokens);
  const parsed = parser.parse();
  return scrambleWorkflowDefinition(parsed);
}

// Deterministic obfuscation map used in tests to avoid depending on internal helper
const obfuscationMap: Record<string, string> = {
  start: "KwIJJ9",
  end: "epLz0m",
  only: "-JaaGK",
  initial: "itfSHH",
  middle: "hcJ0kp",
  back: "YbuNKb",
  option1: "6B66bp",
  option2: "XKejg6",
  option3: "IZIELU",
};

function obfuscateNameDeterministic(name: string) {
  if (name === "*") return "*";
  return obfuscationMap[name];
}


describe("WorkflowParser", () => {
  it("should validate deterministic obfuscation map against obfuscateName", () => {
    // Ensure our hard-coded obfuscationMap values remain in sync with the
    // real obfuscation implementation. This guards against accidental
    // changes to the hashing algorithm used in tests.
    for (const [plain, expected] of Object.entries(obfuscationMap)) {
      expect(obfuscateName(plain)).toBe(expected);
    }
    // '*' should map to itself
    expect(obfuscateName("*")).toBe("*");
  });
  describe("debug", () => {
    it("should debug token parsing", () => {
      const input = `* to start: Initial state
start to end: Final state`;
      const lexer = new WorkflowLexer(input);
      const tokens = lexer.tokenize();

      const parser = new WorkflowParser(tokens);
      parser.parse();
    });
  });

  describe("basic parsing", () => {
  it("should parse initial state definition", () => {
    const workflow = parseWorkflow("* to start: Initial state");
    const s = obfuscateNameDeterministic;

    expect(workflow.initialState).toBe(s("start"));
    expect(workflow.states[s("start")]).toEqual({
      name: s("start"),
      guidance: "Initial state",
    });
    expect(workflow.transitions).toEqual({
      "*": { [s("start")]: { target: s("start"), guidance: undefined } },
      [s("start")]: {},
    });
  });
    it("should parse simple transition", () => {
      const workflow = parseWorkflow(`* to start: Initial state
start to end: Final state`);
      const s = obfuscateNameDeterministic;

      expect(workflow.initialState).toBe(s("start"));
      expect(workflow.states).toEqual({
        "*": { name: "*", guidance: "Initial state" },
        [s("start")]: { name: s("start"), guidance: "Initial state" },
        [s("end")]: { name: s("end"), guidance: "Final state" },
      });
      expect(workflow.transitions).toEqual({
        "*": { [s("start")]: { target: s("start"), guidance: undefined } },
        [s("start")]: { [s("end")]: { target: s("end"), guidance: undefined } },
        [s("end")]: {},
      });
    });

    it("should parse transition with colon", () => {
      const workflow = parseWorkflow(`* to start
start to end: Some guidance`);
      const s = obfuscateNameDeterministic;
      expect(workflow.states[s("end")].guidance).toBe("Some guidance");
    });

    it("should parse transition without colon", () => {
      const workflow = parseWorkflow(`* to start
start to end`);
      const s = obfuscateNameDeterministic;
      expect(workflow.states[s("end")].guidance).toBe("");
    });
  });

  describe("transition guidance", () => {
    it("should parse transition with guidance", () => {
      const workflow = parseWorkflow(`* to start: Initial state
: User wants to continue
start to end: Final state`);
      const s = obfuscateNameDeterministic;

      expect(workflow.transitions[s("start")]).toEqual({
        [s("end")]: { target: s("end"), guidance: "User wants to continue" },
      });
    });

    it("should parse multi-line guidance", () => {
      const workflow = parseWorkflow(`* to start: Initial state
: User wants to continue the project
start to end: Final state`);
      const s = obfuscateNameDeterministic;

      expect(workflow.transitions[s("start")]).toEqual({
        [s("end")]: { target: s("end"), guidance: "User wants to continue the project" },
      });
    });

    it("should handle transitions without guidance", () => {
      const workflow = parseWorkflow(`* to start: Initial state
start to end: Final state`);
      const s = obfuscateNameDeterministic;

      expect(workflow.transitions[s("start")]).toEqual({
        [s("end")]: { target: s("end"), guidance: undefined },
      });
    });
  });

  describe("end state transitions", () => {
    it("should handle transition to end state (*)", () => {
      const workflow = parseWorkflow(`* to start: Initial state
start to *: Back to start`);
      const s = obfuscateNameDeterministic;

      expect(workflow.transitions[s("start")]).toEqual({
        "*": { target: "*", guidance: undefined },
      });
    });

    it("should handle conditional transition to end state", () => {
      const workflow = parseWorkflow(`* to start: Initial state
: Done condition
start to *: Complete`);
      const s = obfuscateNameDeterministic;

      expect(workflow.transitions[s("start")]).toEqual({
        "*": { target: "*", guidance: "Done condition" },
      });
    });
  });

  describe("complex workflows", () => {
    it("should parse multi-state workflow", () => {
      const workflow = parseWorkflow(`* to initial: Start here
initial to middle: Go to middle
: Condition met
middle to end: Conditional end
middle to back: Go back
back to initial: Return to start
end to *: Complete`);
      const s = obfuscateNameDeterministic;

      expect(workflow.initialState).toBe(s("initial"));
      expect(Object.keys(workflow.states)).toEqual([
        "*",
        s("initial"),
        s("middle"),
        s("end"),
        s("back"),
      ]);
      expect(workflow.transitions).toEqual({
        "*": { [s("initial")]: { target: s("initial"), guidance: undefined } },
        [s("initial")]: { [s("middle")]: { target: s("middle"), guidance: undefined } },
        [s("middle")]: {
          [s("end")]: { target: s("end"), guidance: "Condition met" },
          [s("back")]: { target: s("back"), guidance: undefined },
        },
        [s("back")]: { [s("initial")]: { target: s("initial"), guidance: undefined } },
        [s("end")]: { "*": { target: "*", guidance: undefined } },
      });
    });

    it("should handle multiple transitions from same state", () => {
      const workflow = parseWorkflow(`* to start: Initial
start to option1: First option
start to option2: Second option
: Special case
start to option3: Third option`);
      const s = obfuscateNameDeterministic;

      expect(workflow.transitions[s("start")]).toEqual({
        [s("option1")]: { target: s("option1"), guidance: undefined },
        [s("option2")]: { target: s("option2"), guidance: undefined },
        [s("option3")]: { target: s("option3"), guidance: "Special case" },
      });
    });
  });

  describe("whitespace and formatting", () => {
    it("should handle extra whitespace", () => {
      const workflow = parseWorkflow(`

* to start : Initial state

start   to   end   :   Final state

`);
      const s = obfuscateNameDeterministic;
      expect(workflow.states[s("start")].guidance).toBe("Initial state");
      expect(workflow.states[s("end")].guidance).toBe("Final state");
    });

    it("should handle empty lines", () => {
      const workflow = parseWorkflow(`* to start: Initial

start to end: Final`);
      const s = obfuscateNameDeterministic;
      expect(workflow.transitions[s("start")]).toEqual({
        [s("end")]: { target: s("end"), guidance: undefined },
      });
    });
  });

  describe("content parsing", () => {
    it("should handle content with special characters", () => {
      const workflow = parseWorkflow(`* to start: Content with * and if keywords
start to end: More content with to arrows`);
      const s = obfuscateNameDeterministic;
      expect(workflow.states[s("start")].guidance).toBe(
        "Content with * and if keywords",
      );
      expect(workflow.states[s("end")].guidance).toBe("More content with to arrows");
    });

    it("should handle empty content", () => {
      const workflow = parseWorkflow(`* to start:
start to end`);
      const s = obfuscateNameDeterministic;
      expect(workflow.states[s("start")].guidance).toBe("");
      expect(workflow.states[s("end")].guidance).toBe("");
    });

    it("should handle multi-token content", () => {
      const workflow = parseWorkflow(`* to start
start to end: This is a long guidance message with many words`);
      const s = obfuscateNameDeterministic;
      expect(workflow.states[s("end")].guidance).toBe(
        "This is a long guidance message with many words",
      );
    });
  });

  describe("error handling", () => {
    it("should throw error for missing initial state", () => {
      expect(() => parseWorkflow("start to end")).toThrow(
        "No initial state (*) found in workflow file",
      );
    });

    it("should throw error for invalid from state", () => {
      expect(() => parseWorkflow("123 to end")).toThrow("Expected state or *");
    });

    it("should throw error for missing arrow", () => {
      expect(() => parseWorkflow("start end")).toThrow("Expected state or *");
    });

    it("should throw error for invalid to state", () => {
      expect(() => parseWorkflow("start to 123")).toThrow(
        "Expected state or *",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle single state workflow", () => {
      const workflow = parseWorkflow("* to only: Only state");
      const s = obfuscateNameDeterministic;

      expect(workflow.initialState).toBe(s("only"));
      expect(workflow.states).toEqual({
        "*": { name: "*", guidance: "Only state" },
        [s("only")]: { name: s("only"), guidance: "Only state" },
      });
      expect(workflow.transitions).toEqual({
        "*": { [s("only")]: { target: s("only"), guidance: undefined } },
        [s("only")]: {},
      });
    });

    it("should handle self-referencing transition", () => {
      const workflow = parseWorkflow(`* to start: Initial
start to start: Loop back`);
      const s = obfuscateNameDeterministic;

      expect(workflow.transitions[s("start")]).toEqual({
        [s("start")]: { target: s("start"), guidance: undefined },
      });
    });

    it("should handle states without explicit guidance", () => {
      const workflow = parseWorkflow(`* to start: Initial
start to middle
middle to end: Final`);
      const s = obfuscateNameDeterministic;

      expect(workflow.states[s("middle")].guidance).toBe("");
      expect(workflow.states[s("end")].guidance).toBe("Final");
    });
  });
});
