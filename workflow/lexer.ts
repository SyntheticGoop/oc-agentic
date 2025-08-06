// Token types for the workflow grammar
export type TokenType =
  | "state"
  | "star"
  | "to"
  | "colon"
  | "content"
  | "newline"
  | "eof";
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// Lexer for workflow syntax with preprocessing
export class WorkflowLexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input; // No preprocessing
  }

  private peekN(count: number): string {
    let result = "";
    for (let i = 0; i < count; i++) {
      const pos = this.position + i;
      result += pos < this.input.length ? this.input[pos] : "";
    }
    return result;
  }

  private advance(): string {
    const char = this.peekN(1);
    this.position++;
    if (char === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private skipWhitespace(): void {
    let char = this.peekN(1);
    while (char && /[ \t]/.test(char)) {
      this.advance();
      char = this.peekN(1);
    }
  }

  private readIdentifier(): string {
    let result = "";
    let char = this.peekN(1);
    while (char && /[a-zA-Z0-9_]/.test(char)) {
      result += this.advance();
      char = this.peekN(1);
    }
    return result;
  }

  private readContent(): string {
    let content = "";

    // Read until newline or colon
    while (this.peekN(1) && this.peekN(1) !== "\n" && this.peekN(1) !== ":") {
      content += this.advance();
    }

    // After reading the first line of content, check if the next lines are indented continuations
    while (this.peekN(1) === "\n") {
      // Look ahead to see if the next line starts with whitespace (continuation)
      let tempPos = this.position + 1; // Skip the newline
      let hasIndent = false;
      let nextLineContent = "";

      // Check if next line starts with whitespace
      while (tempPos < this.input.length && /[ \t]/.test(this.input[tempPos])) {
        hasIndent = true;
        tempPos++;
      }

      // If indented, read the content of that line
      if (
        hasIndent &&
        tempPos < this.input.length &&
        this.input[tempPos] !== "\n"
      ) {
        // Read the indented line content
        while (tempPos < this.input.length && this.input[tempPos] !== "\n") {
          nextLineContent += this.input[tempPos];
          tempPos++;
        }

        // Check if this looks like a workflow statement (state to state)
        const trimmedNext = nextLineContent.trim();
        const isWorkflowStatement = trimmedNext.match(
          /^(\*|\w+)\s+to\s+(\*|\w+)/,
        );

        if (!isWorkflowStatement) {
          // This is a continuation line - consume it
          this.advance(); // consume newline
          while (this.peekN(1) && /[ \t]/.test(this.peekN(1))) {
            this.advance(); // consume indentation
          }
          content += ` ${trimmedNext}`;

          // Continue reading this line
          while (this.peekN(1) && this.peekN(1) !== "\n") {
            this.advance(); // already added to content above
          }
        } else {
          // This is a new workflow statement, stop reading content
          break;
        }
      } else {
        // No indentation or empty line, stop reading content
        break;
      }
    }

    return content.trim();
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.input.length) {
      const startLine = this.line;
      const startColumn = this.column;

      // Check if we're at the start of an indented line (whitespace at column 1)
      if (startColumn === 1 && /[ \t]/.test(this.peekN(1))) {
        // This is an indented line - treat entire line as content
        const content = this.readContent();
        if (content) {
          tokens.push({
            type: "content",
            value: content,
            line: startLine,
            column: startColumn,
          });
        }
        continue;
      }

      // Skip whitespace
      this.skipWhitespace();

      const char = this.peekN(1);

      // End of input
      if (!char) break;

      // Check for comment lines (# or //)
      if (char === "#" || (char === "/" && this.peekN(2) === "//")) {
        // Skip entire comment line including newline
        while (this.peekN(1) && this.peekN(1) !== "\n") {
          this.advance();
        }
        if (this.peekN(1) === "\n") {
          this.advance(); // consume newline
        }
        continue;
      }

      // Newlines
      if (char === "\n") {
        this.advance();
        tokens.push({
          type: "newline",
          value: "\n",
          line: startLine,
          column: startColumn,
        });
        continue;
      }

      // Star (*)
      if (char === "*") {
        this.advance();
        tokens.push({
          type: "star",
          value: "*",
          line: startLine,
          column: startColumn,
        });
        continue;
      }

      // Colon (:)
      if (char === ":") {
        this.advance();
        tokens.push({
          type: "colon",
          value: ":",
          line: startLine,
          column: startColumn,
        });
        continue;
      }

      // Check for identifiers and content
      if (/[a-zA-Z_]/.test(char)) {
        // Peek ahead to see what follows this word
        let tempPos = this.position;
        let word = "";
        while (
          tempPos < this.input.length &&
          /[a-zA-Z0-9_]/.test(this.input[tempPos])
        ) {
          word += this.input[tempPos];
          tempPos++;
        }

        // Skip whitespace after the word
        while (
          tempPos < this.input.length &&
          /[ \t]/.test(this.input[tempPos])
        ) {
          tempPos++;
        }

        const nextChar = this.input[tempPos];

        // Check if this is "to" keyword
        if (word === "to") {
          this.readIdentifier(); // consume the word
          tokens.push({
            type: "to",
            value: word,
            line: startLine,
            column: startColumn,
          });
          continue;
        }

        // Check if this is a state (followed by colon, newline, EOF, or "to")
        if (nextChar === ":" || nextChar === "\n" || !nextChar) {
          this.readIdentifier(); // consume the word
          tokens.push({
            type: "state",
            value: word,
            line: startLine,
            column: startColumn,
          });
          continue;
        }

        // Check if this word is followed by "to" (making it a state)
        let tempPos2 = tempPos;
        while (
          tempPos2 < this.input.length &&
          /[ \t]/.test(this.input[tempPos2])
        ) {
          tempPos2++;
        }
        const nextWord = this.input.slice(tempPos2, tempPos2 + 2);
        if (nextWord === "to") {
          this.readIdentifier(); // consume the word
          tokens.push({
            type: "state",
            value: word,
            line: startLine,
            column: startColumn,
          });
          continue;
        }
      }

      // Read as content
      const content = this.readContent();
      if (content) {
        tokens.push({
          type: "content",
          value: content,
          line: startLine,
          column: startColumn,
        });
      }
    }

    tokens.push({
      type: "eof",
      value: "",
      line: this.line,
      column: this.column,
    });

    return tokens;
  }
}
