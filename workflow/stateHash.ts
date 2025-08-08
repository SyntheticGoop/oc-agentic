import { createHash } from "crypto";

/**
 * Deterministically obfuscate workflow state names by returning
 * the first 8 hex characters of the SHA1 digest for the input.
 *
 * Special-case: the initial/terminal state "*" is preserved unchanged.
 *
 * Constraints satisfied:
 * - Uses Node's crypto.createHash synchronously
 * - Returns exactly 8 hex characters for non-* states
 * - Deterministic: same input -> same output across runs
 */
export function obfuscateState(state: string): string {
  if (state === "*") return "*";
  const hash = createHash("sha1").update(state, "utf8").digest("hex");
  // Truncate to exactly 8 hex digits
  return hash.slice(0, 8);
}
