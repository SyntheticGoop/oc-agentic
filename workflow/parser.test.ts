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
      const input = `* > start: Initial state
start > end: Final state`;
      const lexer = new WorkflowLexer(input);
      const tokens = lexer.tokenize();

      console.log("Tokens:");
      tokens.forEach((t, i) => console.log(`${i}: ${t.type} "${t.value}"`));

      const parser = new WorkflowParser(tokens);
      const workflow = parser.parse();

      console.log("States:", Object.keys(workflow.states));
      console.log("Transitions:", workflow.transitions);
    });
  });

  describe("basic parsing", () => {
    it("should parse initial state definition", () => {
      const workflow = parseWorkflow("* > start: Initial state");

      expect(workflow.initialState).toBe("start");
      expect(workflow.states.start).toEqual({
        name: "start",
        guidance: "Initial state",
      });
      expect(workflow.transitions.start).toEqual({});
    });

    it("should parse simple transition", () => {
      const workflow = parseWorkflow(`
				* > start: Initial state
				start > end: Final state
			`);

      expect(workflow.initialState).toBe("start");
      expect(workflow.states).toEqual({
        start: { name: "start", guidance: "Initial state" },
        end: { name: "end", guidance: "Final state" },
      });
      expect(workflow.transitions).toEqual({
        start: { end: "end" },
        end: {},
      });
    });

    it("should parse transition with colon", () => {
      const workflow = parseWorkflow("start > end: Some guidance");

      expect(workflow.states.end.guidance).toBe("Some guidance");
    });

    it("should parse transition without colon", () => {
      const workflow = parseWorkflow("start > end Some guidance");

      expect(workflow.states.end.guidance).toBe("Some guidance");
    });
  });

  describe("conditional transitions", () => {
    it("should parse conditional transition", () => {
      const workflow = parseWorkflow(`
				* > start: Initial state
				start if condition > end: Final state
			`);

      expect(workflow.transitions.start).toEqual({
        condition: "end",
      });
    });

    it("should parse multi-word conditional", () => {
      const workflow = parseWorkflow(`
				* > start: Initial state
				start if user approves request > end: Final state
			`);

      expect(workflow.transitions.start).toEqual({
        "user approves request": "end",
      });
    });

    it("should use conditional as action name", () => {
      const workflow = parseWorkflow(`
				* > start: Initial state
				start if custom_action > end: Final state
			`);

      expect(workflow.transitions.start).toEqual({
        custom_action: "end",
      });
    });
  });

  describe("end state transitions", () => {
    it("should handle transition to end state (*)", () => {
      const workflow = parseWorkflow(`
				* > start: Initial state
				start > *: Back to start
			`);

      expect(workflow.transitions.start).toEqual({
        start: "start", // * resolves to initial state
      });
    });

    it("should handle conditional transition to end state", () => {
      const workflow = parseWorkflow(`
				* > start: Initial state
				start if done > *: Complete
			`);

      expect(workflow.transitions.start).toEqual({
        done: "start",
      });
    });
  });

  describe("complex workflows", () => {
    it("should parse multi-state workflow", () => {
      const workflow = parseWorkflow(`
				* > initial: Start here
				initial > middle: Go to middle
				middle if condition > end: Conditional end
				middle > back: Go back
				back > initial: Return to start
				end > *: Complete
			`);

      expect(workflow.initialState).toBe("initial");
      expect(Object.keys(workflow.states)).toEqual([
        "initial",
        "middle",
        "back",
        "end",
      ]);
      expect(workflow.transitions).toEqual({
        initial: { middle: "middle" },
        middle: {
          condition: "end",
          back: "back",
        },
        back: { initial: "initial" },
        end: { initial: "initial" }, // * resolves to initial
      });
    });

    it("should handle multiple transitions from same state", () => {
      const workflow = parseWorkflow(`
				* > start: Initial
				start > option1: First option
				start > option2: Second option
				start if special > option3: Special case
			`);

      expect(workflow.transitions.start).toEqual({
        option1: "option1",
        option2: "option2",
        special: "option3",
      });
    });
  });

  describe("whitespace and formatting", () => {
    it("should handle extra whitespace", () => {
      const workflow = parseWorkflow(`
				
				* > start : Initial state
				
				start   >   end   :   Final state
				
			`);

      expect(workflow.states.start.guidance).toBe("Initial state");
      expect(workflow.states.end.guidance).toBe("Final state");
    });

    it("should handle empty lines", () => {
      const workflow = parseWorkflow(`
				* > start: Initial

				start > end: Final
			`);

      expect(workflow.transitions.start).toEqual({ end: "end" });
    });
  });

  describe("content parsing", () => {
    it("should handle content with special characters", () => {
      const workflow = parseWorkflow(`
				* > start: Content with * and if keywords
				start > end: More content with > arrows
			`);

      expect(workflow.states.start.guidance).toBe(
        "Content with * and if keywords",
      );
      expect(workflow.states.end.guidance).toBe("More content with > arrows");
    });

    it("should handle empty content", () => {
      const workflow = parseWorkflow(`
				* > start:
				start > end
			`);

      expect(workflow.states.start.guidance).toBe("");
      expect(workflow.states.end.guidance).toBe("");
    });

    it("should handle multi-token content", () => {
      const workflow = parseWorkflow(`
				start > end: This is a long guidance message with many words
			`);

      expect(workflow.states.end.guidance).toBe(
        "This is a long guidance message with many words",
      );
    });
  });

  describe("error handling", () => {
    it("should throw error for missing initial state", () => {
      expect(() => parseWorkflow("start > end")).toThrow(
        "No initial state found in workflow file",
      );
    });

    it("should throw error for invalid from state", () => {
      expect(() => parseWorkflow("123 > end")).toThrow("Expected state or *");
    });

    it("should throw error for missing arrow", () => {
      expect(() => parseWorkflow("start end")).toThrow(
        "Expected arrow but got state",
      );
    });

    it("should throw error for invalid to state", () => {
      expect(() => parseWorkflow("start > 123")).toThrow("Expected state or *");
    });
  });

  describe("edge cases", () => {
    it("should handle single state workflow", () => {
      const workflow = parseWorkflow("* > only: Only state");

      expect(workflow.initialState).toBe("only");
      expect(workflow.states).toEqual({
        only: { name: "only", guidance: "Only state" },
      });
      expect(workflow.transitions).toEqual({
        only: {},
      });
    });

    it("should handle self-referencing transition", () => {
      const workflow = parseWorkflow(`
				* > start: Initial
				start > start: Loop back
			`);

      expect(workflow.transitions.start).toEqual({
        start: "start",
      });
    });

    it("should handle states without explicit guidance", () => {
      const workflow = parseWorkflow(`
				* > start: Initial
				start > middle
				middle > end: Final
			`);

      expect(workflow.states.middle.guidance).toBe("");
      expect(workflow.states.end.guidance).toBe("Final");
    });
  });
});
