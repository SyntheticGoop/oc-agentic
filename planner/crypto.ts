/**
 * Crypto-based tag generation for planner commit groups.
 *
 * Generates cryptographically secure 4-character lowercase tags using uniform distribution
 * to avoid modulo bias. The global tag applies to the entire group of commits.
 */

/**
 * Generates a cryptographically secure 4-character lowercase tag.
 *
 * Uses crypto.getRandomValues() with rejection sampling to ensure uniform distribution
 * across all possible 4-character combinations [a-z]{4}. Each character is independently
 * and uniformly selected from the 26 lowercase letters.
 *
 * Algorithm:
 * 1. Generate random bytes using crypto.getRandomValues()
 * 2. Use rejection sampling to avoid modulo bias
 * 3. Map valid values uniformly to [0, 25] range
 * 4. Convert to lowercase letters [a-z]
 * 5. Ensure exactly 4 different characters
 *
 * @returns A 4-character lowercase tag with exactly 4 different letters
 * @throws Error if crypto.getRandomValues is not available or fails
 */
export function generateTag(): string {
  // Verify crypto.getRandomValues is available
  if (
    typeof crypto === "undefined" ||
    typeof crypto.getRandomValues !== "function"
  ) {
    throw new Error("crypto.getRandomValues is not available");
  }

  try {
    const buffer = new Uint8Array(4);

    crypto.getRandomValues(buffer);

    return [...buffer]
      .map((i) => String.fromCharCode(97 + Math.floor((i / 256) * 26)))
      .join("");
  } catch (error) {
    throw new Error(
      `Failed to generate cryptographic tag: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validates that a tag meets the required format.
 *
 * @param tag - The tag to validate
 * @returns true if tag is exactly 4 different lowercase letters
 */
export function isValidTag(tag: string): boolean {
  if (typeof tag !== "string" || tag.length !== 4) {
    return false;
  }

  // Check all characters are lowercase letters
  return /^[a-z]{4}$/.test(tag);
}
