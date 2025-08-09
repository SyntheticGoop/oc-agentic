import { describe, it, expect } from 'vitest';
import { generateTag, isValidTag } from './crypto';

describe('crypto tag generation', () => {
  describe('generateTag()', () => {
    it('should generate valid 4-character lowercase tags', () => {
      const tag = generateTag();
      expect(tag).toMatch(/^[a-z]{4}$/);
      expect(tag).toHaveLength(4);
      expect(isValidTag(tag)).toBe(true);
    });


    it('should ensure uniform distribution across character positions', () => {
      const iterations = 1000;
      const charCounts = [new Map(), new Map(), new Map(), new Map()];

      for (let i = 0; i < iterations; i++) {
        const tag = generateTag();
        for (let pos = 0; pos < 4; pos++) {
          const char = tag[pos];
          charCounts[pos].set(char, (charCounts[pos].get(char) || 0) + 1);
        }
      }

      // Each position should have reasonable character distribution
      for (let pos = 0; pos < 4; pos++) {
        const counts = charCounts[pos];
        expect(counts.size).toBeGreaterThan(15); // Should see most letters

        // No character should dominate (rough uniformity check)
        const maxCount = Math.max(...Array.from(counts.values()));
        const minCount = Math.min(...Array.from(counts.values()));
        const ratio = maxCount / minCount;
        expect(ratio).toBeLessThan(5); // Reasonable distribution variance
      }
    });

    it('should handle crypto.getRandomValues failures gracefully', () => {
      const originalGetRandomValues = crypto.getRandomValues;

      // Mock getRandomValues to throw an error
      crypto.getRandomValues = (() => {
        throw new Error('Crypto operation failed');
      }) as typeof crypto.getRandomValues;

      expect(() => generateTag()).toThrow('Failed to generate cryptographic tag: Crypto operation failed');

      // Restore original function
      crypto.getRandomValues = originalGetRandomValues;
    });

    it('should generate tags within expected character range', () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const tag = generateTag();
        for (const char of tag) {
          const charCode = char.charCodeAt(0);
          expect(charCode).toBeGreaterThanOrEqual(97); // 'a'
          expect(charCode).toBeLessThanOrEqual(122);   // 'z'
        }
      }
    });
  });

  describe('isValidTag()', () => {
    it('should validate correct tag formats', () => {
      expect(isValidTag('abcd')).toBe(true);
      expect(isValidTag('wxyz')).toBe(true);
      expect(isValidTag('hdrz')).toBe(true);
      expect(isValidTag('mnpq')).toBe(true);
    });


    it('should reject tags with uppercase characters', () => {
      expect(isValidTag('Abcd')).toBe(false);
      expect(isValidTag('ABCD')).toBe(false);
      expect(isValidTag('aBcd')).toBe(false);
      expect(isValidTag('abcD')).toBe(false);
    });

    it('should reject tags with numbers', () => {
      expect(isValidTag('1bcd')).toBe(false);
      expect(isValidTag('a2cd')).toBe(false);
      expect(isValidTag('ab3d')).toBe(false);
      expect(isValidTag('abc4')).toBe(false);
    });

    it('should reject tags with special characters', () => {
      expect(isValidTag('a-cd')).toBe(false);
      expect(isValidTag('ab_d')).toBe(false);
      expect(isValidTag('ab.d')).toBe(false);
      expect(isValidTag('ab@d')).toBe(false);
    });

    it('should reject tags with incorrect length', () => {
      expect(isValidTag('abc')).toBe(false);    // too short
      expect(isValidTag('abcde')).toBe(false);  // too long
      expect(isValidTag('')).toBe(false);       // empty
      expect(isValidTag('a')).toBe(false);      // single char
    });

    it('should reject non-string inputs', () => {
      // @ts-ignore - intentionally testing non-string inputs
      expect(isValidTag(null)).toBe(false);
      // @ts-ignore - intentionally testing non-string inputs
      expect(isValidTag(undefined)).toBe(false);
      // @ts-ignore - intentionally testing non-string inputs
      expect(isValidTag(1234)).toBe(false);
      // @ts-ignore - intentionally testing non-string inputs
      expect(isValidTag(['a', 'b', 'c', 'd'])).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidTag('    ')).toBe(false);   // whitespace
      expect(isValidTag('\n\t\r ')).toBe(false); // control chars
      expect(isValidTag('ab cd')).toBe(false);   // space in middle
    });
  });

  describe('integration with existing patterns', () => {
    it('should generate tags compatible with loader regex patterns', () => {
      // This regex pattern is used in loader.ts for tag validation
      const loaderTagPattern = /^[a-z]{4}$/;

      const iterations = 20;
      for (let i = 0; i < iterations; i++) {
        const tag = generateTag();
        expect(tag).toMatch(loaderTagPattern);
      }
    });

    it('should generate tags suitable for commit format integration', () => {
      const tag = generateTag();

      // Test begin commit format
      const beginFormat = `begin(${tag}):: implement user authentication`;
      expect(beginFormat).toMatch(/^begin\([a-z]{4}\):: .+/);

      // Test end commit format  
      const endFormat = `end(${tag}):: implement user authentication`;
      expect(endFormat).toMatch(/^end\([a-z]{4}\):: .+/);
    });
  });
});
