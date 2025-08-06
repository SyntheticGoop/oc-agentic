import { WorkflowLexer } from "./lexer";
import { type WorkflowDefinition, WorkflowParser } from "./parser";

declare const Brand: unique symbol;
declare class StateBrand {
  private [Brand]: typeof Brand;
}

export type WorkflowState = string & StateBrand;

export type TransitionResult =
  | {
      move: "success";
      nextState: WorkflowState;
      validActions: Array<{
        action: WorkflowState;
        guidance: string | undefined;
      }>;
      guidance: string;
    }
  | {
      move: "invalid";
      validActions: Array<{
        action: WorkflowState;
        guidance: string | undefined;
      }>;
      guidance: string;
    };

export class Workflow {
  private definition: WorkflowDefinition;

  constructor(definitionContent: string) {
    this.definition = this.parseDefinition(definitionContent);
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

  private getValidActions(state: WorkflowState) {
    const transitions = this.definition.transitions[state];
    return Object.entries(transitions || {}).map(([action, definition]) => {
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

  transition(
    currentState: WorkflowState,
    nextState: WorkflowState,
  ): TransitionResult {
    const transitions = this.definition.transitions[currentState];
    const transitionDef = transitions?.[nextState];

    if (!transitionDef) {
      return {
        move: "invalid",
        validActions: this.getValidActions(currentState),
        guidance: this.getStateGuidance(currentState),
      };
    }

    const finalState = transitionDef.target as WorkflowState;

    return {
      move: "success",
      nextState: finalState,
      validActions: this.getValidActions(finalState),
      guidance: this.getStateGuidance(finalState),
    };
  }
  isValidState(state: string): state is WorkflowState {
    return state in this.definition.transitions;
  }
}
