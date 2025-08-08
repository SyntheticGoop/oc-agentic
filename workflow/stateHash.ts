import { createHash } from "crypto";

/**
 * Deterministically obfuscate workflow state names by returning
 * a 6-character base64url string derived from the SHA1 digest.
 *
 * Special-case: the initial/terminal state "*" is preserved unchanged.
 *
 * Behavior:
 * - Uses Node's crypto.createHash synchronously (SHA1)
 * - Encodes digest as base64url (RFC4648 §5) and truncates to 6 chars
 * - Deterministic: same input -> same output across runs
 */
export function obfuscateState(state: string): string {
  if (state === "*") return "*";
  const digest = createHash("sha1").update(state, "utf8").digest();
  // base64url encode (replace +/ with -_ and strip padding) and truncate
  const b64 = digest
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return b64.slice(0, 6);
}
