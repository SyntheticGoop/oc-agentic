/**
 * @fileoverview End-to-end tests for format → parse → validate → format cycle stability
 * Tests that the round-trip conversion maintains data integrity and produces stable output
 */

import { describe, it, expect } from "vitest";
import { format } from "./format.js";
import { parse } from "./parse.js";
import { validate } from "./validate.js";

describe("E2E Format Cycle Tests", () => {
	describe("Round-trip Stability", () => {
		it("maintains stability for empty input", () => {
			const input = "";

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				const formatted = format(validated.data);
				expect(formatted).toBe(input);

				// Test second round-trip
				const parsed2 = parse(formatted);
				const validated2 = validate(parsed2);
				expect(validated2.isValid).toBe(true);
				if (validated2.isValid) {
					const formatted2 = format(validated2.data);
					expect(formatted2).toBe(formatted);
				}
			}
		});

		it("maintains stability for header only", () => {
			const input = "feat:";

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				const formatted = format(validated.data);
				expect(formatted).toBe(input);

				// Test second round-trip
				const parsed2 = parse(formatted);
				const validated2 = validate(parsed2);
				expect(validated2.isValid).toBe(true);
				if (validated2.isValid) {
					const formatted2 = format(validated2.data);
					expect(formatted2).toBe(formatted);
				}
			}
		});

		it("maintains stability for header with scope and title", () => {
			const input = "fix(auth): resolve login timeout\n\n";

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				const formatted = format(validated.data);
				expect(formatted).toBe(input.trim());

				// Test second round-trip
				const parsed2 = parse(formatted);
				const validated2 = validate(parsed2);
				expect(validated2.isValid).toBe(true);
				if (validated2.isValid) {
					const formatted2 = format(validated2.data);
					expect(formatted2).toBe(formatted);
				}
			}
		});

		it("maintains stability for complete document with description", () => {
			const input = `refactor(api)!: restructure authentication flow

Completely redesign the authentication system to use OAuth2 with proper token management and refresh capabilities.`;

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				const formatted = format(validated.data);
				expect(formatted).toBe(input);

				// Test second round-trip
				const parsed2 = parse(formatted);
				const validated2 = validate(parsed2);
				expect(validated2.isValid).toBe(true);
				if (validated2.isValid) {
					const formatted2 = format(validated2.data);
					expect(formatted2).toBe(formatted);
				}
			}
		});

		it("maintains stability for document with constraints", () => {
			const input = `feat(security): add rate limiting

Implement comprehensive rate limiting across all API endpoints to prevent abuse and ensure system stability.

- Do not: break existing api contracts
- Never: store rate limit data in memory only
- Avoid: blocking legitimate users`;

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				const formatted = format(validated.data);
				expect(formatted).toBe(input);

				// Test second round-trip
				const parsed2 = parse(formatted);
				const validated2 = validate(parsed2);
				expect(validated2.isValid).toBe(true);
				if (validated2.isValid) {
					const formatted2 = format(validated2.data);
					expect(formatted2).toBe(formatted);
				}
			}
		});

		it("maintains stability for document with tasks", () => {
			const input = `feat(dashboard): implement user analytics

Add comprehensive user analytics dashboard with real-time metrics and historical data visualization.

- Do not: expose sensitive user data
- Never: store analytics data longer than 90 days

- [ ]: Backend analytics API
  - [x]: Data collection endpoints
  - [ ]: Aggregation service
  - [x]: Export functionality
- [ ]: Frontend dashboard
  - [ ]: Chart components
  - [ ]: Real-time updates
- [ ]: Documentation and testing`;

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				const formatted = format(validated.data);
				expect(formatted).toBe(input);

				// Test second round-trip
				const parsed2 = parse(formatted);
				const validated2 = validate(parsed2);
				expect(validated2.isValid).toBe(true);
				if (validated2.isValid) {
					const formatted2 = format(validated2.data);
					expect(formatted2).toBe(formatted);
				}
			}
		});

		it("maintains stability for document with directive", () => {
			const input = `feat(payment)!: integrate stripe payment system

Complete integration with Stripe payment processing including webhooks, subscription management, and invoice generation.

- Do not: store credit card information locally
- Never: process payments without proper validation
- Must not: expose payment tokens in logs

- [ ]: Stripe API integration
  - [x]: Payment intent creation
  - [x]: Webhook handling
  - [ ]: Subscription management
- [ ]: Frontend payment forms
  - [ ]: Credit card input component
  - [ ]: Payment confirmation flow
- [ ]: Testing and security audit

~~~ PROCEED WITH SECURITY REVIEW ~~~`;

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				const formatted = format(validated.data);
				expect(formatted).toBe(input);

				// Test second round-trip
				const parsed2 = parse(formatted);
				const validated2 = validate(parsed2);
				expect(validated2.isValid).toBe(true);
				if (validated2.isValid) {
					const formatted2 = format(validated2.data);
					expect(formatted2).toBe(formatted);
				}
			}
		});
	});

	describe("Multiple Round-trips", () => {
		it("remains stable after multiple format cycles", () => {
			const input = `fix(database): optimize query performance

Improve database query performance by adding proper indexes and optimizing slow queries identified in production monitoring.

- Do not: break existing query interfaces
- Avoid: adding unnecessary indexes

- [ ]: Query analysis and optimization
  - [x]: Identify slow queries
  - [ ]: Add missing indexes
  - [ ]: Optimize complex joins
- [ ]: Performance testing

~~~ CONTINUE WITH MONITORING ~~~`;

			let current = input;

			// Perform 5 round-trips
			for (let i = 0; i < 5; i++) {
				const parsed = parse(current);
				const validated = validate(parsed);

				expect(validated.isValid).toBe(true);
				if (!validated.isValid) break;

				const formatted = format(validated.data);

				// Each cycle should produce identical results
				expect(formatted).toBe(current);

				current = formatted;
			}
		});
	});

	describe("Edge Cases", () => {
		it("handles empty constraints and tasks correctly", () => {
			const input = `chore(deps): update dependencies

Update all project dependencies to their latest stable versions.



`;

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				const formatted = format(validated.data);
				// Should normalize to remove extra empty lines
				expect(formatted).toBe(
					"chore(deps): update dependencies\n\nUpdate all project dependencies to their latest stable versions.",
				);

				// Test second round-trip
				const parsed2 = parse(formatted);
				const validated2 = validate(parsed2);
				expect(validated2.isValid).toBe(true);
				if (validated2.isValid) {
					const formatted2 = format(validated2.data);
					expect(formatted2).toBe(formatted);
				}
			}
		});

		it("handles deeply nested tasks correctly", () => {
			const input = `feat(ui): implement component library

Create a comprehensive component library with proper documentation and testing.

- Do not: break existing component apis

- [ ]: Core components
  - [ ]: Form components
    - [ ]: Input components
      - [ ]: Text input
      - [ ]: Number input
      - [ ]: Date picker
    - [ ]: Validation system
  - [ ]: Layout components
- [ ]: Documentation and examples`;

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				const formatted = format(validated.data);
				expect(formatted).toBe(input);

				// Test second round-trip
				const parsed2 = parse(formatted);
				const validated2 = validate(parsed2);
				expect(validated2.isValid).toBe(true);
				if (validated2.isValid) {
					const formatted2 = format(validated2.data);
					expect(formatted2).toBe(formatted);
				}
			}
		});
	});

	describe("Format Output Validation", () => {
		it("formats directives correctly", () => {
			const input = `feat(test): add test directive

Test directive formatting.

~~~ CONTINUE WITH TESTING ~~~`;

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				expect(validated.data.directive).toBe("CONTINUE WITH TESTING");

				const formatted = format(validated.data);
				expect(formatted).toContain("~~~ CONTINUE WITH TESTING ~~~");
				expect(formatted).toBe(input);
			}
		});

		it("handles case conversion correctly", () => {
			// Test that the format function properly converts case
			const input = `FIX(AUTH)!: RESOLVE LOGIN ISSUE

THIS IS A DESCRIPTION WITH UPPERCASE.`;

			const parsed = parse(input);
			const validated = validate(parsed);

			expect(validated.isValid).toBe(true);
			if (validated.isValid) {
				const formatted = format(validated.data);
				// Should convert to lowercase as per format function
				expect(formatted).toBe(
					"fix(auth)!: resolve login issue\n\nTHIS IS A DESCRIPTION WITH UPPERCASE.",
				);
			}
		});
	});
});
