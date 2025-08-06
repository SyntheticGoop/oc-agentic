import type { Token, TokenType } from "./lexer";

export type StateDefinition = {
  name: string;
  guidance: string;
};

export type TransitionDefinition = {
  target: string;
  guidance?: string;
};

export type WorkflowDefinition = {
  states: Record<string, StateDefinition>;
  transitions: Record<string, Partial<Record<string, TransitionDefinition>>>;
  initialState: string;
};

// Parser for workflow syntax
export class WorkflowParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset: number = 0): Token {
    const pos = this.position + offset;
    return pos < this.tokens.length
      ? this.tokens[pos]
      : this.tokens[this.tokens.length - 1];
  }

  private advance(): Token {
    const token = this.peek();
    if (this.position < this.tokens.length - 1) {
      this.position++;
    }
    return token;
  }

  private expect(type: TokenType): Token {
    const token = this.peek();
    if (token.type !== type) {
      throw new Error(
        `Expected ${type} but got ${token.type} at line ${token.line}, column ${token.column}`,
      );
    }
    return this.advance();
  }

  private skipNewlines(): void {
    while (this.peek().type === "newline") {
      this.advance();
    }
  }

  private parseState(): string {
    const token = this.peek();
    if (token.type === "star") {
      this.advance();
      return "*";
    }
    if (token.type === "state") {
      return this.advance().value;
    }
    throw new Error(
      `Expected state or * at line ${token.line}, column ${token.column}`,
    );
  }

  private ensureState(
    name: string,
    states: Record<string, StateDefinition>,
    transitions: Record<string, Partial<Record<string, TransitionDefinition>>>,
    guidance = "",
  ): void {
    if (!states[name]) {
      states[name] = { name, guidance };
      transitions[name] = {};
    }
  }

  parse(): WorkflowDefinition {
    const states: Record<string, StateDefinition> = {};
    const transitions: Record<
      string,
      Partial<Record<string, TransitionDefinition>>
    > = {};
    let initialState = "*"; // Default, will be updated when we see * > state

    this.skipNewlines();

    while (this.peek().type !== "eof") {
      if (this.peek().type === "newline") {
        this.advance();
        continue;
      }

      // Parse: [: transition_guidance] from_state to to_state [: state_guidance]

      // Check if line starts with colon (transition guidance)
      let transitionGuidance: string | null = null;
      if (this.peek().type === "colon") {
        this.advance(); // consume :

        // Parse transition guidance until we hit a state
        const guidanceParts: string[] = [];
        while (
          this.peek().type !== "state" &&
          this.peek().type !== "star" &&
          this.peek().type !== "eof"
        ) {
          if (this.peek().type !== "newline") {
            guidanceParts.push(this.advance().value);
          } else {
            this.advance(); // skip newlines
          }
        }
        transitionGuidance = guidanceParts.join(" ").trim();
      }

      const fromState = this.parseState();
      this.expect("to");
      const toState = this.parseState();

      // Parse optional state guidance
      let stateGuidance = "";
      if (this.peek().type === "colon") {
        this.advance();
        // Check if guidance is on the same line
        if (this.peek().type === "content") {
          stateGuidance = this.advance().value;
        }
      }

      // Skip newlines after colon
      this.skipNewlines();

      // Check if the next token is content (multi-line state guidance)
      if (this.peek().type === "content") {
        // This is multi-line state guidance
        if (!stateGuidance) {
          stateGuidance = this.advance().value;
        }
      }
      // Update initial state if we see * > state
      if (fromState === "*") {
        initialState = toState;
      }

      // Ensure both states exist
      this.ensureState(
        fromState,
        states,
        transitions,
        fromState === "*" ? stateGuidance : "",
      );
      this.ensureState(
        toState,
        states,
        transitions,
        toState !== "*" ? stateGuidance : "",
      );

      // Action name: use target state name
      const action = toState;

      // Create transition with guidance
      transitions[fromState][action] = {
        target: toState,
        guidance: transitionGuidance ?? undefined,
      };

      this.skipNewlines();
    }

    // Ensure * state exists (it should always be present)
    if (!states["*"]) {
      throw new Error("No initial state (*) found in workflow file");
    }

    return { states, transitions, initialState };
  }
}
