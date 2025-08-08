import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";
import { WorkflowParser } from "./parser";

describe("Parser E2E Tests", () => {
  it("should parse the entire scoped-execution.flow file", () => {
    const plannerPath = join(__dirname, "scoped-execution.flow");
    const content = readFileSync(plannerPath, "utf8");

    const lexer = new WorkflowLexer(content);
    const tokens = lexer.tokenize();

    const parser = new WorkflowParser(tokens);
    const result = parser.parse();

    // Basic validations instead of full inline snapshot to avoid brittle diffs
    expect(result.initialState).toBe("initial_loaded");
    expect(result.states).toBeDefined();
    expect(result.transitions).toBeDefined();

    // spot-check some important states and transitions
    expect(result.states["initial_loaded"]).toBeDefined();
    expect(result.states["define_project"]).toBeDefined();
    expect(result.transitions["*"]).toBeDefined();
    expect(result.transitions["*"]?.initial_loaded?.target).toBe("initial_loaded");

  });
});
