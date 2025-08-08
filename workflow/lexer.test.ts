import { describe, expect, it } from "vitest";
import { WorkflowLexer } from "./lexer";

describe("WorkflowLexer", () => {
  describe("basic tokenization", () => {
    it("should tokenize empty input", () => {
      const lexer = new WorkflowLexer("");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe("eof");
    });

    it("should tokenize whitespace only", () => {
      const lexer = new WorkflowLexer("   \t  ");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe("eof");
    });

    it("should tokenize newlines", () => {
      const lexer = new WorkflowLexer("\n\n");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe("newline");
      expect(tokens[1].type).toBe("newline");
      expect(tokens[2].type).toBe("eof");
    });
  });

  describe("token types", () => {
    it("should tokenize star", () => {
      const lexer = new WorkflowLexer("*");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({
        type: "star",
        value: "*",
        line: 1,
        column: 1,
      });
    });

    it("should tokenize to keyword", () => {
      const lexer = new WorkflowLexer("to");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({
        type: "to",
        value: "to",
        line: 1,
        column: 1,
      });
    });
    it("should tokenize colon", () => {
      const lexer = new WorkflowLexer(":");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(3); // colon, content (empty), eof
      expect(tokens[0]).toEqual({
        type: "colon",
        value: ":",
        line: 1,
        column: 1,
      });
    });

    it("should tokenize if as state identifier", () => {
      const lexer = new WorkflowLexer("if");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({
        type: "state",
        value: "if",
        line: 1,
        column: 1,
      });
    });
    it("should tokenize state identifiers", () => {
      const lexer = new WorkflowLexer("start_state");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({
        type: "state",
        value: "start_state",
        line: 1,
        column: 1,
      });
    });

    it("should tokenize content", () => {
      const lexer = new WorkflowLexer("some content here");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({
        type: "content",
        value: "some content here",
        line: 1,
        column: 1,
      });
    });
  });

  describe("comments", () => {
    it("should skip hash comments", () => {
      const lexer = new WorkflowLexer("# this is a comment\nstart");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe("state");
      expect(tokens[0].value).toBe("start");
    });

    it("should skip double slash comments", () => {
      const lexer = new WorkflowLexer("// this is a comment\nstart");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe("state");
      expect(tokens[0].value).toBe("start");
    });

    it("should handle comments at end of file", () => {
      const lexer = new WorkflowLexer("start # comment");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe("content");
      expect(tokens[0].value).toBe("start # comment");
    });
  });

  describe("line continuations", () => {
    it("should handle simple line continuation", () => {
      const lexer = new WorkflowLexer("content line\n  continued");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe("content");
      expect(tokens[0].value).toBe("content line continued");
    });

    it("should handle multiple line continuations", () => {
      const lexer = new WorkflowLexer(
        "first line\n  second line\n    third line",
      );
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe("content");
      expect(tokens[0].value).toBe("first line second line third line");
    });

    it("should handle tab continuations", () => {
      const lexer = new WorkflowLexer("content\n\tcontinued");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(4); // state, newline, content, eof
      expect(tokens[0].type).toBe("state");
      expect(tokens[0].value).toBe("content");
      expect(tokens[2].type).toBe("content");
      expect(tokens[2].value).toBe("continued");
    });

    it("should not treat non-indented newlines as continuations", () => {
      const lexer = new WorkflowLexer("first line\nsecond line");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(4);
      expect(tokens[0].type).toBe("content");
      expect(tokens[0].value).toBe("first line");
      expect(tokens[1].type).toBe("newline");
      expect(tokens[2].type).toBe("content");
      expect(tokens[2].value).toBe("second line");
    });
  });

  describe("complex workflows", () => {
    it("should tokenize a complete workflow", () => {
      const input = `* to start: initial state
start to end: final state`;
      const lexer = new WorkflowLexer(input);
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(12); // star, to, state, colon, content, newline, state, to, state, colon, content, eof
      expect(tokens[0].type).toBe("star");
      expect(tokens[1].type).toBe("to");
      expect(tokens[2].type).toBe("state");
      expect(tokens[2].value).toBe("start");
      expect(tokens[3].type).toBe("colon");
      expect(tokens[4].type).toBe("content");
      expect(tokens[4].value).toBe("initial state");
    });
    it("should handle workflow with guidance and to keyword", () => {
      const input = `: guidance
start to end`;
      const lexer = new WorkflowLexer(input);
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(7); // colon, content, newline, state, to, state, eof
      expect(tokens[0].type).toBe("colon");
      expect(tokens[1].type).toBe("content");
      expect(tokens[1].value).toBe("guidance");
      expect(tokens[3].type).toBe("state");
      expect(tokens[3].value).toBe("start");
      expect(tokens[4].type).toBe("to");
      expect(tokens[5].type).toBe("state");
      expect(tokens[5].value).toBe("end");
    });
  });

  describe("position tracking", () => {
    it("should track line and column positions", () => {
      const lexer = new WorkflowLexer("start\nmiddle\nend");
      const tokens = lexer.tokenize();

      expect(tokens[0].line).toBe(1);
      expect(tokens[0].column).toBe(1);
      expect(tokens[1].line).toBe(1); // newline position
      expect(tokens[2].line).toBe(2); // middle starts on line 2
    });

    it("should handle column positions correctly", () => {
      const lexer = new WorkflowLexer("  start  to  end");
      const tokens = lexer.tokenize();

      expect(tokens[0].column).toBe(1); // content starts at column 1
      expect(tokens[0].type).toBe("content");
      expect(tokens[0].value).toBe("start  to  end");
    });
  });
  describe("edge cases", () => {
    it("should handle mixed whitespace", () => {
      const lexer = new WorkflowLexer(" \t * \t start \t ");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2); // content (everything as one token), eof
      expect(tokens[0].type).toBe("content");
      expect(tokens[0].value).toBe("* \t start");
    });

    it("should handle empty content", () => {
      const lexer = new WorkflowLexer("start:");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(4); // state, colon, content (empty), eof
      expect(tokens[0].type).toBe("state");
      expect(tokens[1].type).toBe("colon");
    });

    it("should handle content with special characters", () => {
      const lexer = new WorkflowLexer("content with (parens) and [brackets]");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe("content");
      expect(tokens[0].value).toBe("content with (parens) and [brackets]");
    });

    it("should stop content at colons", () => {
      const lexer = new WorkflowLexer("some content: more content");
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2); // content (entire line), eof
      expect(tokens[0].type).toBe("content");
      expect(tokens[0].value).toBe("some content: more content");
    });
  });

  it("should handle 'if' keyword in content", () => {
    const lexer = new WorkflowLexer("start to end: content with if keyword");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(6); // state, to, state, colon, content, eof
    expect(tokens[0].type).toBe("state");
    expect(tokens[0].value).toBe("start");
    expect(tokens[1].type).toBe("to");
    expect(tokens[2].type).toBe("state");
    expect(tokens[2].value).toBe("end");
    expect(tokens[4].type).toBe("content");
    expect(tokens[4].value).toBe("content with if keyword");
  });
  it("should handle '*' in content", () => {
    const lexer = new WorkflowLexer("start to end: content with * asterisk");
    const tokens = lexer.tokenize();
    expect(tokens).toHaveLength(6); // state, to, state, colon, content, eof
    expect(tokens[0].type).toBe("state");
    expect(tokens[0].value).toBe("start");
    expect(tokens[1].type).toBe("to");
    expect(tokens[2].type).toBe("state");
    expect(tokens[2].value).toBe("end");
    expect(tokens[4].type).toBe("content");
    expect(tokens[4].value).toBe("content with * asterisk");
  });
});
