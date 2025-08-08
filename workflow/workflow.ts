import { WorkflowLexer } from "./lexer";
import { type WorkflowDefinition, WorkflowParser } from "./parser";
import {
  scrambleWorkflowDefinition,
  obfuscateName,
} from "../src/workflowScrambler";

declare const Brand: unique symbol;
declare class StateBrand {
  private [Brand]: typeof Brand;
}

export type WorkflowState = string & StateBrand;

export type TransitionResult = {
  move: "success" | "invalid";
  nextState: WorkflowState;
  validActions: Array<{
    action: WorkflowState;
    guidance: string | undefined;
  }>;
  guidance: string;
};

/**
 * PublicTransitionResult
 *
 * The public-facing transition result returns plain (unobfuscated) state
 * identifiers for interoperability with callers. This type describes the
 * response shape returned by Workflow.transitionPlain.
 */
export type PublicTransitionResult = {
  move: "success" | "invalid";
  nextState: string; // plain (unobfuscated) state name or "*"
  validActions: Array<{
    action: string; // plain state name
    guidance: string | undefined;
  }>;
  guidance: string;
};

export class Workflow {
  readonly definition: WorkflowDefinition;
  // Maps to translate between plain state names and obfuscated internal names
  private plainToObf: Record<string, WorkflowState> = {};
  private obfToPlain: Record<string, string> = {};

  constructor(definitionContent: string) {
    // Parse original definition
    const parsed = this.parseDefinition(definitionContent);

    // Scramble the internal definition first (we will validate mapping against it)
    const scrambled = scrambleWorkflowDefinition(parsed);
    this.definition = scrambled;

    // Build mapping using the same obfuscation function used by the scrambler
    for (const name of Object.keys(parsed.states)) {
      const obf = obfuscateName(name);
      // Validate that the scrambled definition contains the obfuscated name
      if (!this.isObfuscatedState(obf)) {
        throw new Error(
          `Internal error: obfuscated state '${obf}' missing from scrambled definition`,
        );
      }
      this.plainToObf[name] = obf;
      this.obfToPlain[obf] = name;
    }

    // Ensure the special initial token '*' is mapped to itself
    this.plainToObf["*"] = "*" as WorkflowState;
    this.obfToPlain["*"] = "*";
  }

  private parseDefinition(content: string): WorkflowDefinition {
    try {
      const lexer = new WorkflowLexer(content);
      const tokens = lexer.tokenize();
      const parser = new WorkflowParser(tokens);
      return parser.parse();
    } catch (error) {
      if (error instanceof Error)
        throw new Error(
          `Failed to parse workflow definition: ${error.message}`,
        );
      throw error;
    }
  }

  private isObfuscatedState(s: string): s is WorkflowState {
    if (s === "*") return true;
    return typeof s === "string" && s in this.definition.states;
  }

  private getValidActions(state: WorkflowState) {
    const transitions = this.definition.transitions[state];
    return Object.entries(transitions || {})
      .filter(([action]) => this.isObfuscatedState(action))
      .map(([action, definition]) => {
        return {
          action: action as WorkflowState,
          guidance: definition?.guidance,
        };
      });
  }

  private getStateGuidance(state: WorkflowState): string {
    const stateDefinition = this.definition.states[state];
    return stateDefinition?.guidance ?? "No guidance available for this state";
  }

  // Internal transition that operates on obfuscated (internal) state names
  transition(
    currentState: WorkflowState,
    nextState: WorkflowState,
  ): TransitionResult {
    const transitions = this.definition.transitions[currentState];
    const transitionDef = transitions?.[nextState];

    if (!transitionDef) {
      return {
        move: "invalid",
        nextState: currentState,
        validActions: this.getValidActions(currentState),
        guidance: this.getStateGuidance(currentState),
      };
    }

    const finalStateRaw = transitionDef.target;
    if (
      typeof finalStateRaw !== "string" ||
      !this.isObfuscatedState(finalStateRaw)
    ) {
      throw new Error(
        "Invalid workflow: transition target is not a known obfuscated state",
      );
    }
    const finalState = finalStateRaw as WorkflowState;

    return {
      move: "success",
      nextState: finalState,
      validActions: this.getValidActions(finalState),
      guidance: this.getStateGuidance(finalState),
    };
  }

  // Convert a caller-provided plain state name or obfuscated name to internal obfuscated name
  private toObf(state: string): WorkflowState | undefined {
    if (typeof state !== "string") return undefined;
    if (state === "*") return "*" as WorkflowState;
    if (state in this.plainToObf) return this.plainToObf[state];
    // If the caller passed an already-obfuscated name, accept it if present in definition
    if (state in this.definition.transitions && this.isObfuscatedState(state))
      return state;
    return undefined;
  }

  private toPlain(obf: WorkflowState): string {
    return this.obfToPlain[obf] ?? (obf as string);
  }

  /**
   * transitionPlain
   *
   * Public wrapper for performing a transition using plain (unobfuscated)
   * state identifiers. Inputs are validated to be strings and converted to the
   * internal obfuscated representation before performing the transition. The
   * returned result contains plain state names.
   *
   * @param currentStatePlain - Plain current state name or '*' (string)
   * @param nextStatePlain - Plain next state name or '*' (string)
   * @returns PublicTransitionResult with plain state names
   */
  transitionPlain(
    currentStatePlain: string,
    nextStatePlain: string,
  ): PublicTransitionResult {
    // Input validation
    if (
      typeof currentStatePlain !== "string" ||
      typeof nextStatePlain !== "string"
    ) {
      throw new TypeError("state parameters must be strings");
    }

    const obfCurrent = this.toObf(currentStatePlain);
    const obfNext = this.toObf(nextStatePlain);

    // If current state is unknown, return invalid with minimal info
    if (!obfCurrent) {
      return {
        move: "invalid",
        nextState: currentStatePlain,
        validActions: [],
        guidance: "Unknown current state",
      };
    }

    // If next state is unknown, do not perform the transition; return invalid
    if (!obfNext) {
      // Call transition with same current state to produce a well-typed invalid result
      const internal = this.transition(obfCurrent, obfCurrent);
      return {
        move: internal.move,
        nextState: this.toPlain(internal.nextState),
        validActions: internal.validActions.map((a) => ({
          action: this.toPlain(a.action),
          guidance: a.guidance,
        })),
        guidance: internal.guidance,
      };
    }

    const internal = this.transition(obfCurrent, obfNext);

    // Map internal result back to plain names
    return {
      move: internal.move,
      nextState: this.toPlain(internal.nextState),
      validActions: internal.validActions.map((a) => ({
        action: this.toPlain(a.action),
        guidance: a.guidance,
      })),
      guidance: internal.guidance,
    };
  }

  // isValidState accepts either plain or obfuscated names for convenience
  isValidState(state: string): state is WorkflowState {
    if (typeof state !== "string") return false;
    if (state === "*") return true;
    if (state in this.plainToObf) return true;
    return state in this.definition.transitions;
  }

  /**
   * getInitialStatePlain
   *
   * Returns the public (plain/unobfuscated) initial state name for this
   * workflow. The internal scrambled initialState is validated before being
   * converted to a plain identifier.
   *
   * @returns plain state name string (or "*" for the special initial token)
   * @throws {TypeError} if the internal initial state is malformed
   */
  getInitialStatePlain(): string {
    const obf = this.definition.initialState;
    if (typeof obf !== "string")
      throw new TypeError("internal initialState is not a string");
    if (!this.isObfuscatedState(obf))
      throw new Error("internal initialState is not a known obfuscated state");
    return this.toPlain(obf as WorkflowState);
  }
}
