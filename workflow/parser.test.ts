import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";
import { WorkflowParser } from "./parser";

function parseWorkflow(input: string) {
  const lexer = new WorkflowLexer(input);
  const tokens = lexer.tokenize();
  const parser = new WorkflowParser(tokens);
  return parser.parse();
}

describe("WorkflowParser", () => {
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

      expect(workflow.initialState).toBe("start");
      expect(workflow.states.start).toEqual({
        name: "start",
        guidance: "Initial state",
      });
      expect(workflow.transitions).toEqual({
        "*": { start: { target: "start", guidance: undefined } },
        start: {},
      });
    });

    it("should parse simple transition", () => {
      const workflow = parseWorkflow(`* to start: Initial state
start to end: Final state`);

      expect(workflow.initialState).toBe("start");
      expect(workflow.states).toEqual({
        "*": { name: "*", guidance: "Initial state" },
        start: { name: "start", guidance: "Initial state" },
        end: { name: "end", guidance: "Final state" },
      });
      expect(workflow.transitions).toEqual({
        "*": { start: { target: "start", guidance: undefined } },
        start: { end: { target: "end", guidance: undefined } },
        end: {},
      });
    });

    it("should parse transition with colon", () => {
      const workflow = parseWorkflow(`* to start
start to end: Some guidance`);

      expect(workflow.states.end.guidance).toBe("Some guidance");
    });

    it("should parse transition without colon", () => {
      const workflow = parseWorkflow(`* to start
start to end`);

      expect(workflow.states.end.guidance).toBe("");
    });
  });

  describe("transition guidance", () => {
    it("should parse transition with guidance", () => {
      const workflow = parseWorkflow(`* to start: Initial state
: User wants to continue
start to end: Final state`);

      expect(workflow.transitions.start).toEqual({
        end: { target: "end", guidance: "User wants to continue" },
      });
    });

    it("should parse multi-line guidance", () => {
      const workflow = parseWorkflow(`* to start: Initial state
: User wants to continue the project
start to end: Final state`);

      expect(workflow.transitions.start).toEqual({
        end: { target: "end", guidance: "User wants to continue the project" },
      });
    });

    it("should handle transitions without guidance", () => {
      const workflow = parseWorkflow(`* to start: Initial state
start to end: Final state`);

      expect(workflow.transitions.start).toEqual({
        end: { target: "end", guidance: undefined },
      });
    });
  });

  describe("end state transitions", () => {
    it("should handle transition to end state (*)", () => {
      const workflow = parseWorkflow(`* to start: Initial state
start to *: Back to start`);

      expect(workflow.transitions.start).toEqual({
        "*": { target: "*", guidance: undefined },
      });
    });

    it("should handle conditional transition to end state", () => {
      const workflow = parseWorkflow(`* to start: Initial state
: Done condition
start to *: Complete`);

      expect(workflow.transitions.start).toEqual({
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

      expect(workflow.initialState).toBe("initial");
      expect(Object.keys(workflow.states)).toEqual([
        "*",
        "initial",
        "middle",
        "end",
        "back",
      ]);
      expect(workflow.transitions).toEqual({
        "*": { initial: { target: "initial", guidance: undefined } },
        initial: { middle: { target: "middle", guidance: undefined } },
        middle: {
          end: { target: "end", guidance: "Condition met" },
          back: { target: "back", guidance: undefined },
        },
        back: { initial: { target: "initial", guidance: undefined } },
        end: { "*": { target: "*", guidance: undefined } },
      });
    });

    it("should handle multiple transitions from same state", () => {
      const workflow = parseWorkflow(`* to start: Initial
start to option1: First option
start to option2: Second option
: Special case
start to option3: Third option`);

      expect(workflow.transitions.start).toEqual({
        option1: { target: "option1", guidance: undefined },
        option2: { target: "option2", guidance: undefined },
        option3: { target: "option3", guidance: "Special case" },
      });
    });
  });

  describe("whitespace and formatting", () => {
    it("should handle extra whitespace", () => {
      const workflow = parseWorkflow(`

* to start : Initial state

start   to   end   :   Final state

`);

      expect(workflow.states.start.guidance).toBe("Initial state");
      expect(workflow.states.end.guidance).toBe("Final state");
    });

    it("should handle empty lines", () => {
      const workflow = parseWorkflow(`* to start: Initial

start to end: Final`);

      expect(workflow.transitions.start).toEqual({
        end: { target: "end", guidance: undefined },
      });
    });
  });

  describe("content parsing", () => {
    it("should handle content with special characters", () => {
      const workflow = parseWorkflow(`* to start: Content with * and if keywords
start to end: More content with to arrows`);

      expect(workflow.states.start.guidance).toBe(
        "Content with * and if keywords",
      );
      expect(workflow.states.end.guidance).toBe("More content with to arrows");
    });

    it("should handle empty content", () => {
      const workflow = parseWorkflow(`* to start:
start to end`);

      expect(workflow.states.start.guidance).toBe("");
      expect(workflow.states.end.guidance).toBe("");
    });

    it("should handle multi-token content", () => {
      const workflow = parseWorkflow(`* to start
start to end: This is a long guidance message with many words`);

      expect(workflow.states.end.guidance).toBe(
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

      expect(workflow.initialState).toBe("only");
      expect(workflow.states).toEqual({
        "*": { name: "*", guidance: "Only state" },
        only: { name: "only", guidance: "Only state" },
      });
      expect(workflow.transitions).toEqual({
        "*": { only: { target: "only", guidance: undefined } },
        only: {},
      });
    });

    it("should handle self-referencing transition", () => {
      const workflow = parseWorkflow(`* to start: Initial
start to start: Loop back`);

      expect(workflow.transitions.start).toEqual({
        start: { target: "start", guidance: undefined },
      });
    });

    it("should handle states without explicit guidance", () => {
      const workflow = parseWorkflow(`* to start: Initial
start to middle
middle to end: Final`);

      expect(workflow.states.middle.guidance).toBe("");
      expect(workflow.states.end.guidance).toBe("Final");
    });
  });
});
