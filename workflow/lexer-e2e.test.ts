import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";

describe("Lexer E2E Tests", () => {
  it("should correctly tokenize the scoped-execution.flow file", () => {
    const plannerPath = join(__dirname, "scoped-execution.flow");
    const content = readFileSync(plannerPath, "utf8");

    const lexer = new WorkflowLexer(content);
    const tokens = lexer.tokenize();

    // Validate core tokenization properties to avoid brittle snapshots
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(20);

    // Verify the file contains the initial starred transition and the specific added line
    const hasStar = tokens.some((t) => t.type === "star");
    expect(hasStar).toBe(true);

    // Find the content token for the initial state's guidance and ensure it includes our added line
    const initialContent = tokens.find(
      (t) => t.type === "content" && typeof t.value === "string" && t.value.includes("planner_get_project"),
    );
    expect(initialContent).toBeDefined();
    expect(String(initialContent?.value)).toMatch(/List summary of files changed/);

    // Ensure colon guidance lines exist
    const colonExists = tokens.some((t) => t.type === "colon");
    expect(colonExists).toBe(true);

  });
});
