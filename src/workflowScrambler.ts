import type {
  StateDefinition,
  TransitionDefinition,
  WorkflowDefinition,
} from "../workflow/parser";
import { obfuscateState } from "../workflow/stateHash";

/**
 * scrambleWorkflowDefinition
 *
 * Deterministically obfuscates state names in a WorkflowDefinition while
 * preserving the workflow structure, guidance, and relationships. The
 * transformation delegates to the centralized obfuscation function so tests
 * and other consumers get a single canonical mapping.
 *
 * Behavior
 * - The special initial state token "*" is preserved and never scrambled.
 * - All other state identifiers are replaced with the 6-char base64url
 *   tokens produced by obfuscateState.
 * - All references to state names inside the definition are updated to the
 *   scrambled names so the resulting definition remains consistent.
 *
 * Validation
 * - This function performs runtime validation of the input shape and will
 *   throw a TypeError if the provided `definition` does not conform to the
 *   expected WorkflowDefinition structure.
 */
export function obfuscateName(name: string): string {
  return obfuscateState(name);
}

export function scrambleWorkflowDefinition(
  definition: WorkflowDefinition,
): WorkflowDefinition {
  // Runtime validation to guard against incorrect inputs at runtime.
  if (!definition || typeof definition !== "object") {
    throw new TypeError("definition must be a non-null object");
  }
  if (
    typeof definition.initialState !== "string" ||
    !definition.states ||
    typeof definition.states !== "object" ||
    !definition.transitions ||
    typeof definition.transitions !== "object"
  ) {
    throw new TypeError(
      "definition must have 'states' (object), 'transitions' (object) and 'initialState' (string)",
    );
  }

  // Ensure states shape is valid
  for (const [k, v] of Object.entries(definition.states)) {
    if (!v || typeof v !== "object") {
      throw new TypeError(`state '${k}' must be an object`);
    }
    const sd = v as StateDefinition;
    if (typeof sd.name !== "string" || typeof sd.guidance !== "string") {
      throw new TypeError(
        `state '${k}' must have string 'name' and 'guidance' properties`,
      );
    }
  }

  // Ensure transitions shape is valid
  for (const [from, nested] of Object.entries(definition.transitions)) {
    if (nested && typeof nested !== "object") {
      throw new TypeError(`transitions['${from}'] must be an object`);
    }
    if (!nested) continue;
    for (const [action, td] of Object.entries(nested)) {
      if (!td || typeof td !== "object") {
        throw new TypeError(
          `transition '${from}' -> '${action}' must be an object`,
        );
      }
      const trans = td as TransitionDefinition;
      if (typeof trans.target !== "string") {
        throw new TypeError(
          `transition '${from}' -> '${action}' must have a string 'target'`,
        );
      }
      if (trans.guidance !== undefined && typeof trans.guidance !== "string") {
        throw new TypeError(
          `transition '${from}' -> '${action}' guidance must be a string if provided`,
        );
      }
    }
  }

  // Build mapping from original state name -> scrambled name
  const nameMap: Record<string, string> = {};
  for (const orig of Object.keys(definition.states)) {
    nameMap[orig] = obfuscateState(orig);
  }

  // Ensure we also map any state names that appear in transitions but not in states
  for (const from of Object.keys(definition.transitions)) {
    if (!(from in nameMap)) nameMap[from] = obfuscateState(from);
    const nested = definition.transitions[from] as
      | Partial<Record<string, TransitionDefinition>>
      | undefined;
    if (!nested) continue;
    for (const action of Object.keys(nested)) {
      if (!(action in nameMap)) nameMap[action] = obfuscateState(action);
      const t = nested[action];
      if (t && t.target && !(t.target in nameMap)) {
        nameMap[t.target] = obfuscateState(t.target);
      }
    }
  }

  // Build scrambled states record
  const scrambledStates: Record<string, StateDefinition> = {};
  for (const [orig, def] of Object.entries(definition.states)) {
    const newName = nameMap[orig];
    scrambledStates[newName] = {
      // copy guidance, update name
      name: newName,
      guidance: def.guidance,
    };
  }

  // Build scrambled transitions
  const scrambledTransitions: Record<
    string,
    Partial<Record<string, TransitionDefinition>>
  > = {};
  for (const [fromOrig, nested] of Object.entries(
    definition.transitions,
  ) as Array<
    [string, Partial<Record<string, TransitionDefinition>> | undefined]
  >) {
    const fromNew = nameMap[fromOrig];
    scrambledTransitions[fromNew] = {};
    if (!nested) continue;
    for (const [actionOrig, transDef] of Object.entries(nested)) {
      const actionNew = nameMap[actionOrig];
      const targetNew =
        transDef && transDef.target ? nameMap[transDef.target] : undefined;
      // Build a safe TransitionDefinition; transition target is required by type
      const targetValue =
        targetNew !== undefined ? targetNew : transDef ? transDef.target : "";
      scrambledTransitions[fromNew][actionNew] = {
        target: targetValue,
        guidance: transDef && transDef.guidance,
      };
    }
  }

  const scrambledInitial =
    nameMap[definition.initialState] ?? definition.initialState;

  return {
    states: scrambledStates,
    transitions: scrambledTransitions,
    initialState: scrambledInitial,
  };
}
