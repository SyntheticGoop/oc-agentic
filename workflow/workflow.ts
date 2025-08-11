import {
  obfuscateName,
  scrambleWorkflowDefinition,
} from "../src/workflowScrambler";
import { WorkflowLexer } from "./lexer";
import { type WorkflowDefinition, WorkflowParser } from "./parser";

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

  // isValidState accepts obfuscated names only
  isValidState(state: string): state is WorkflowState {
    if (typeof state !== "string") return false;
    if (state === "*") return true;
    return state in this.definition.transitions;
  }

  /**
   * getInternalInitialState
   *
   * Returns the internal obfuscated initial state token as stored in the
   * scrambled workflow definition. This replaces the previous plain-facing
   * helper.
   */
  getInternalInitialState(): string {
    const obf = this.definition.initialState;
    if (typeof obf !== "string")
      throw new TypeError("internal initialState is not a string");
    if (!this.isObfuscatedState(obf))
      throw new Error("internal initialState is not a known obfuscated state");
    return obf as string;
  }
}
