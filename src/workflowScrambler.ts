import { createHash } from "crypto";
import type {
  StateDefinition,
  TransitionDefinition,
  WorkflowDefinition,
} from "../workflow/parser";

/**
 * scrambleWorkflowDefinition
 *
 * Deterministically obfuscates state names in a WorkflowDefinition while
 * preserving the workflow structure, guidance, and relationships. The
 * transformation is reversible only by recreating the exact hashing algorithm
 * and input names; it is intended for anonymization and test fixtures.
 *
 * Behavior
 * - The special initial state token "*" is preserved and never scrambled.
 * - All other state identifiers (keys in `states`, transition keys, and
 *   transition targets) are replaced with a short deterministic hash
 *   (prefixed with "s_").
 * - All references to state names inside the definition are updated to the
 *   scrambled names so the resulting definition remains consistent.
 * - The function uses a SHA-256-based hashing strategy for determinism.
 *
 * Validation
 * - This function performs runtime validation of the input shape and will
 *   throw a TypeError if the provided `definition` does not conform to the
 *   expected WorkflowDefinition structure.
 *
 * Note: The function preserves all guidance and other fields exactly as they
 * appear in the input; only state identifiers are changed.
 *
 * @param definition - A WorkflowDefinition object to be scrambled. Must be a
 *   non-null object with `states`, `transitions`, and `initialState` keys.
 * @returns A new WorkflowDefinition with scrambled state identifiers.
 * @throws {TypeError} If the input does not match the expected structure.
 */
export function obfuscateName(name: string): string {
  if (name === "*") return "*";
  const h = createHash("sha256").update(name).digest("hex");
  return `s_${h.slice(0, 10)}`;
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

  // Simple deterministic hash -> short hex string
  const hashName = (name: string): string => {
    if (name === "*") return "*";
    const h = createHash("sha256").update(name).digest("hex");
    return `s_${h.slice(0, 10)}`; // prefix to avoid starting with digit
  };

  // Build mapping from original state name -> scrambled name
  const nameMap: Record<string, string> = {};
  for (const orig of Object.keys(definition.states)) {
    nameMap[orig] = hashName(orig);
  }

  // Ensure we also map any state names that appear in transitions but not in states
  // (defensive, though parser should have populated states for all referenced names)
  for (const from of Object.keys(definition.transitions)) {
    if (!(from in nameMap)) nameMap[from] = hashName(from);
    const nested = definition.transitions[from] as
      | Partial<Record<string, TransitionDefinition>>
      | undefined;
    if (!nested) continue;
    for (const action of Object.keys(nested)) {
      if (!(action in nameMap)) nameMap[action] = hashName(action);
      const t = nested[action];
      if (t && t.target && !(t.target in nameMap)) {
        nameMap[t.target] = hashName(t.target);
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
