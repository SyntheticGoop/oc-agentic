import { describe, expect, it } from "vitest";
import {
	ParseError,
	parseCommit,
	parseConstraints,
	parseHeader,
	parseTasks,
} from "./parser.js";

describe("parseHeader", () => {
	describe("valid headers", () => {
		it("should parse all valid commit types", () => {
			const types = [
				"feat",
				"fix",
				"refactor",
				"build",
				"chore",
				"docs",
				"lint",
				"infra",
				"spec",
			];

			for (const type of types) {
				const result = parseHeader(`${type}: test summary`);
				expect(result.type).toBe(type);
				expect(result.summary).toBe("test summary");
				expect(result.breaking).toBe(false);
				expect(result.scope).toBeUndefined();
			}
		});

		it("should parse headers with scopes", () => {
			const testCases = [
				{ input: "feat(auth): test", expected: "auth" },
				{ input: "fix(api-v2): test", expected: "api-v2" },
				{ input: "chore(deps): test", expected: "deps" },
				{ input: "spec(parser): test", expected: "parser" },
				{ input: "infra(ci): test", expected: "ci" },
			];

			for (const { input, expected } of testCases) {
				const result = parseHeader(input);
				expect(result.scope).toBe(expected);
			}
		});

		it("should auto-convert scope to lowercase", () => {
			const testCases = [
				{ input: "feat(AUTH): test", expected: "auth" },
				{ input: "fix(API-V2): test", expected: "api-v2" },
				{ input: "chore(MyScope): test", expected: "myscope" },
			];

			for (const { input, expected } of testCases) {
				const result = parseHeader(input);
				expect(result.scope).toBe(expected);
			}
		});

		it("should parse breaking changes", () => {
			const testCases = [
				"feat!: breaking change",
				"feat(api)!: breaking change",
				"fix(auth)!: breaking fix",
			];

			for (const input of testCases) {
				const result = parseHeader(input);
				expect(result.breaking).toBe(true);
			}
		});

		it("should handle whitespace variations", () => {
			const testCases = [
				"feat:test",
				"feat: test",
				"feat:  test  ",
				"feat(scope):test",
				"feat(scope): test",
				"feat(scope):  test  ",
			];

			for (const input of testCases) {
				const result = parseHeader(input);
				expect(result.summary).toBe("test");
			}
		});

		it("should handle summary at exactly 120 characters", () => {
			const summary120 = "a".repeat(120);
			const result = parseHeader(`feat: ${summary120}`);
			expect(result.summary).toBe(summary120);
		});

		it("should handle single character scope", () => {
			const result = parseHeader("fix(a): test");
			expect(result.scope).toBe("a");
		});

		it("should handle scope with numbers", () => {
			const result = parseHeader("feat(v2): test");
			expect(result.scope).toBe("v2");
		});
	});

	describe("invalid headers", () => {
		it("should reject invalid commit types", () => {
			const invalidTypes = ["feature", "bugfix", "update", "change", "invalid"];

			for (const type of invalidTypes) {
				expect(() => parseHeader(`${type}: test`)).toThrow(ParseError);
				expect(() => parseHeader(`${type}: test`)).toThrow(
					"Invalid header format",
				);
			}
		});

		it("should reject missing colon", () => {
			expect(() => parseHeader("feat add feature")).toThrow(ParseError);
			expect(() => parseHeader("feat(scope) add feature")).toThrow(ParseError);
		});

		it("should reject empty summary", () => {
			const emptyCases = [
				"feat:",
				"feat: ",
				"feat:   ",
				"feat(scope):",
				"feat(scope): ",
			];

			for (const input of emptyCases) {
				expect(() => parseHeader(input)).toThrow(ParseError);
				expect(() => parseHeader(input)).toThrow("Empty summary not allowed");
			}
		});

		it("should reject summary over 120 characters", () => {
			const longSummary = "a".repeat(121);
			expect(() => parseHeader(`feat: ${longSummary}`)).toThrow(ParseError);
			expect(() => parseHeader(`feat: ${longSummary}`)).toThrow(
				"Summary exceeds 120 characters",
			);
		});

		it("should reject invalid scope patterns", () => {
			const invalidScopes = [
				"feat(123): test", // starts with number
				"feat(-auth): test", // starts with hyphen
				"feat(auth_test): test", // contains underscore
			];

			for (const input of invalidScopes) {
				expect(() => parseHeader(input)).toThrow(ParseError);
				expect(() => parseHeader(input)).toThrow("Invalid scope pattern");
			}
		});

		it("should reject empty scope", () => {
			expect(() => parseHeader("feat(): test")).toThrow(ParseError);
			expect(() => parseHeader("feat(): test")).toThrow(
				"Invalid header format",
			);
		});

		it("should reject malformed breaking change syntax", () => {
			// These should be caught by the main regex
			const malformed = [
				"feat!(scope): test", // ! before scope
				"feat(scope)!!: test", // double !
			];

			for (const input of malformed) {
				expect(() => parseHeader(input)).toThrow(ParseError);
			}
		});
	});
});

describe("parseConstraints", () => {
	describe("valid constraints", () => {
		it("should parse 'Constraints: none' variations", () => {
			const variations = [
				"Constraints: none",
				"  Constraints: none  ",
				"Constraints:none",
			];

			for (const input of variations) {
				const result = parseConstraints(input);
				expect(result).toEqual([]);
			}
		});

		it("should parse all valid prefixes", () => {
			const prefixes = [
				"Do not:",
				"Never:",
				"Avoid:",
				"Decide against:",
				"Must not:",
				"Cannot:",
				"Forbidden:",
			];

			for (const prefix of prefixes) {
				const input = `Constraints:\n- ${prefix} test constraint`;
				const result = parseConstraints(input);
				expect(result).toEqual([`${prefix} test constraint`]);
			}
		});

		it("should parse multiple constraints", () => {
			const input = `Constraints:
- Do not: break backward compatibility
- Never: expose sensitive data
- Must not: modify core functionality
- Avoid: breaking changes
- Cannot: access external services
- Forbidden: hardcoded credentials
- Decide against: major refactoring`;

			const result = parseConstraints(input);
			expect(result).toHaveLength(7);
			expect(result[0]).toBe("Do not: break backward compatibility");
			expect(result[6]).toBe("Decide against: major refactoring");
		});

		it("should handle whitespace variations", () => {
			const input = `Constraints:
  - Do not:   modify database schema  
  - Never:  break tests   
    - Must not: change behavior`;

			const result = parseConstraints(input);
			expect(result).toEqual([
				"Do not:   modify database schema",
				"Never:  break tests",
				"Must not: change behavior",
			]);
		});

		it("should ignore empty lines", () => {
			const input = `Constraints:
- Do not: modify API

- Never: break tests


- Must not: change behavior`;

			const result = parseConstraints(input);
			expect(result).toHaveLength(3);
		});

		it("should handle constraints with colons in content", () => {
			const input = `Constraints:
- Do not: modify API: version 2.0 endpoints
- Never: access https://external-api.com:8080/data`;

			const result = parseConstraints(input);
			expect(result).toEqual([
				"Do not: modify API: version 2.0 endpoints",
				"Never: access https://external-api.com:8080/data",
			]);
		});

		it("should handle empty constraints section", () => {
			const variations = ["Constraints:", "Constraints:\n", "Constraints:\n\n"];

			for (const input of variations) {
				const result = parseConstraints(input);
				expect(result).toEqual([]);
			}
		});
	});

	describe("invalid constraints", () => {
		it("should reject missing 'Constraints:' header", () => {
			const invalid = [
				"- Do not: test",
				"Invalid format",
				"Constraint: Do not test",
			];

			for (const input of invalid) {
				expect(() => parseConstraints(input)).toThrow(ParseError);
				expect(() => parseConstraints(input)).toThrow(
					"must start with 'Constraints:'",
				);
			}
		});

		it("should reject constraints without dash prefix", () => {
			const input = `Constraints:
Do not: test constraint
Never: another constraint`;

			expect(() => parseConstraints(input)).toThrow(ParseError);
			expect(() => parseConstraints(input)).toThrow("must start with '- '");
		});

		it("should reject invalid prefixes", () => {
			const invalidPrefixes = [
				"Should not:",
				"Will not:",
				"Don't:",
				"Shouldn't:",
				"Won't:",
				"No:",
				"Not:",
			];

			for (const prefix of invalidPrefixes) {
				const input = `Constraints:\n- ${prefix} test constraint`;
				expect(() => parseConstraints(input)).toThrow(ParseError);
				expect(() => parseConstraints(input)).toThrow(
					"must start with valid prefix",
				);
			}
		});

		it("should reject constraints without any prefix", () => {
			const input = `Constraints:
- modify database schema
- break existing functionality`;

			expect(() => parseConstraints(input)).toThrow(ParseError);
		});
	});
});

describe("parseTasks", () => {
	describe("valid tasks", () => {
		it("should parse empty tasks sections", () => {
			const variations = [
				"Tasks [ ]:",
				"Tasks [ ]: ",
				"Tasks [ ]:\n",
				"Tasks [X]:",
			];

			for (const input of variations) {
				const result = parseTasks(input);
				expect(result.tasks).toEqual([]);
				expect(result.isComplete).toBe(input.includes("[X]"));
			}
		});

		it("should parse single tasks", () => {
			const testCases = [
				{
					input: "Tasks [ ]:\n- [ ] Simple task",
					expected: { summary: "Simple task", details: "", completed: false },
				},
				{
					input: "Tasks [ ]:\n- [x] Completed task",
					expected: { summary: "Completed task", details: "", completed: true },
				},
				{
					input: "Tasks [ ]:\n- [ ] Task with details: implementation notes",
					expected: {
						summary: "Task with details",
						details: "implementation notes",
						completed: false,
					},
				},
			];

			for (const { input, expected } of testCases) {
				const result = parseTasks(input);
				expect(result.tasks).toHaveLength(1);
				expect(result.tasks[0].summary).toBe(expected.summary);
				expect(result.tasks[0].details).toBe(expected.details);
				expect(result.tasks[0].completed).toBe(expected.completed);
				expect(result.tasks[0].level).toBe(0);
				expect(result.tasks[0].parent_id).toBeUndefined();
			}
		});

		it("should parse complex nested hierarchies", () => {
			const input = `Tasks [ ]:
- [ ] Level 0 task A: root task
  - [x] Level 1 task A1: first child
    - [ ] Level 2 task A1a: grandchild
      - [x] Level 3 task A1a1: great-grandchild
    - [x] Level 2 task A1b: another grandchild
  - [ ] Level 1 task A2: second child
- [x] Level 0 task B: another root task
  - [ ] Level 1 task B1: child of B`;

			const result = parseTasks(input);

			// Verify structure
			expect(result.tasks).toHaveLength(2);

			const taskA = result.tasks[0];
			expect(taskA.summary).toBe("Level 0 task A");
			expect(taskA.children).toHaveLength(2);

			const taskA1 = taskA.children[0];
			expect(taskA1.completed).toBe(true);
			expect(taskA1.children).toHaveLength(2);
			expect(taskA1.parent_id).toBe("level-0-task-a");

			const taskA1a = taskA1.children[0];
			expect(taskA1a.children).toHaveLength(1);
			expect(taskA1a.parent_id).toBe("level-1-task-a1");

			const taskA1a1 = taskA1a.children[0];
			expect(taskA1a1.level).toBe(3);
			expect(taskA1a1.completed).toBe(true);
			expect(taskA1a1.parent_id).toBe("level-2-task-a1a");
		});

		it("should generate unique IDs for duplicate summaries", () => {
			const input = `Tasks [ ]:
- [ ] Test task: first instance
- [ ] Test task: second instance
- [ ] Test task: third instance
- [ ] Different task: unique
- [ ] Test task: fourth instance`;

			const result = parseTasks(input);

			expect(result.tasks[0].id).toBe("test-task");
			expect(result.tasks[1].id).toBe("test-task-1");
			expect(result.tasks[2].id).toBe("test-task-2");
			expect(result.tasks[3].id).toBe("different-task");
			expect(result.tasks[4].id).toBe("test-task-3");
		});

		it("should handle special characters in summaries", () => {
			const testCases = [
				{ input: "Fix API v2.0 (auth)", expected: "fix-api-v20-auth" },
				{
					input: "Update @types/node dependency",
					expected: "update-typesnode-dependency",
				},
				{
					input: "Handle edge-case: null values",
					expected: "handle-edge-case",
				},
				{
					input: "Implement OAuth2.0 flow!",
					expected: "implement-oauth20-flow",
				},
				{
					input: "Test with spaces   and   tabs",
					expected: "test-with-spaces-and-tabs",
				},
			];

			for (const { input, expected } of testCases) {
				const taskInput = `Tasks [ ]:\n- [ ] ${input}: details`;
				const result = parseTasks(taskInput);
				expect(result.tasks[0].id).toBe(expected);
			}
		});

		it("should handle whitespace variations in task content", () => {
			const input = `Tasks [ ]:
- [ ]   Task with spaces   :   details with spaces   
- [x]Task without spaces:details without spaces
- [ ] 	Tab indented task	: 	tab separated details	`;

			const result = parseTasks(input);

			expect(result.tasks[0].summary).toBe("Task with spaces");
			expect(result.tasks[0].details).toBe("details with spaces");
			expect(result.tasks[1].summary).toBe("Task without spaces");
			expect(result.tasks[1].details).toBe("details without spaces");
			expect(result.tasks[2].summary).toBe("Tab indented task");
			expect(result.tasks[2].details).toBe("tab separated details");
		});

		it("should handle tasks with multiple colons", () => {
			const input = `Tasks [ ]:
- [ ] Configure API: set endpoint to https://api.example.com:8080/v1: with auth
- [ ] Update docs: section 2.1: subsection A: final notes`;

			const result = parseTasks(input);

			expect(result.tasks[0].summary).toBe("Configure API");
			expect(result.tasks[0].details).toBe(
				"set endpoint to https://api.example.com:8080/v1: with auth",
			);
			expect(result.tasks[1].summary).toBe("Update docs");
			expect(result.tasks[1].details).toBe(
				"section 2.1: subsection A: final notes",
			);
		});
	});

	describe("invalid tasks", () => {
		it("should reject invalid Tasks headers", () => {
			const invalidHeaders = [
				"Task [ ]:",
				"Tasks[]:",
				"Tasks [Y]:",
				"Tasks [ ] :",
				"- [ ] task without header",
			];

			for (const input of invalidHeaders) {
				expect(() => parseTasks(input)).toThrow(ParseError);
				expect(() => parseTasks(input)).toThrow("must start with 'Tasks");
			}
		});

		it("should reject invalid task formats", () => {
			const invalidFormats = [
				"Tasks [ ]:\ninvalid task format",
				"Tasks [ ]:\n- [y] invalid checkbox character",
			];

			for (const input of invalidFormats) {
				expect(() => parseTasks(input)).toThrow(ParseError);
				expect(() => parseTasks(input)).toThrow("Invalid task format");
			}
		});

		it("should reject nesting too deep", () => {
			const input = `Tasks [ ]:
- [ ] Level 0: root
  - [ ] Level 1: child
    - [ ] Level 2: grandchild
      - [ ] Level 3: great-grandchild
        - [ ] Level 4: too deep`;

			expect(() => parseTasks(input)).toThrow(ParseError);
			expect(() => parseTasks(input)).toThrow("nesting too deep");
		});

		it("should reject invalid nesting jumps", () => {
			const invalidNesting = [
				`Tasks [ ]:
- [ ] Level 0: root
    - [ ] Level 2: skipped level 1`,
				`Tasks [ ]:
- [ ] Level 0: root
      - [ ] Level 3: skipped levels 1 and 2`,
			];

			for (const input of invalidNesting) {
				expect(() => parseTasks(input)).toThrow(ParseError);
				expect(() => parseTasks(input)).toThrow("Invalid task nesting");
			}
		});

		it("should reject tasks without summary", () => {
			const input = `Tasks [ ]:
- [ ] : details without summary`;

			expect(() => parseTasks(input)).toThrow(ParseError);
		});
	});
});

describe("parseCommit", () => {
	describe("integration tests", () => {
		it("should parse complete commit with all sections", () => {
			const input = `feat(auth)!: implement OAuth2 authentication

Add comprehensive OAuth2 authentication system with token refresh capabilities. This change breaks existing API authentication methods and requires client updates.

Constraints:
- Do not: store tokens in localStorage
- Never: expose client secrets in frontend code

Tasks [ ]:
- [x] OAuth2 implementation: core authentication flow
  - [x] Token endpoint: handle authorization code exchange
  - [x] Refresh endpoint: implement token refresh logic
- [ ] Client integration: update existing clients
  - [ ] Frontend client: migrate from basic auth
  - [ ] Mobile app: implement OAuth2 flow`;

			const result = parseCommit(input);

			expect(result.header).toEqual({
				type: "feat",
				scope: "auth",
				breaking: true,
				summary: "implement OAuth2 authentication",
			});

			expect(result.description).toBe(
				"Add comprehensive OAuth2 authentication system with token refresh capabilities. This change breaks existing API authentication methods and requires client updates.",
			);

			expect(result.constraints).toEqual([
				"Do not: store tokens in localStorage",
				"Never: expose client secrets in frontend code",
			]);

			expect(result.tasks).toHaveLength(2);
			expect(result.tasks[0].completed).toBe(true);
			expect(result.tasks[0].children).toHaveLength(2);
			expect(result.tasks[1].completed).toBe(false);
			expect(result.tasks[1].children).toHaveLength(2);

			expect(result.metadata).toEqual({
				totalTasks: 6,
				completedTasks: 3,
				isComplete: false,
			});
		});

		it("should parse commit with tasks before constraints", () => {
			const input = `refactor(core): restructure module system

Reorganize core modules for better maintainability.

Tasks [X]:
- [x] Module restructure: reorganize files
- [x] Update imports: fix all references

Constraints:
- Do not: break existing public APIs
- Must not: change module loading behavior`;

			const result = parseCommit(input);

			expect(result.tasks).toHaveLength(2);
			expect(result.constraints).toHaveLength(2);
			expect(result.metadata.isComplete).toBe(true);
		});

		it("should parse commit with only header and description", () => {
			const input = `fix(api): resolve timeout issues

Fixed connection timeout problems by increasing default timeout values and implementing retry logic for failed requests.`;

			const result = parseCommit(input);

			expect(result.header.type).toBe("fix");
			expect(result.description).toBe(
				"Fixed connection timeout problems by increasing default timeout values and implementing retry logic for failed requests.",
			);
			expect(result.constraints).toEqual([]);
			expect(result.tasks).toEqual([]);
			expect(result.metadata.totalTasks).toBe(0);
			expect(result.metadata.isComplete).toBe(false);
		});

		it("should parse commit with constraints but no tasks", () => {
			const input = `refactor(core): restructure module system

Reorganize core modules for better maintainability and performance.

Constraints:
- Do not: break existing public APIs
- Must not: change module loading behavior`;

			const result = parseCommit(input);

			expect(result.constraints).toHaveLength(2);
			expect(result.tasks).toEqual([]);
			expect(result.metadata.isComplete).toBe(false);
		});

		it("should parse commit with tasks but no constraints", () => {
			const input = `feat(ui): add dark mode support

Implement comprehensive dark mode theming across the application.

Tasks [X]:
- [x] Theme system: create dark mode variables
- [x] Component updates: apply dark mode styles`;

			const result = parseCommit(input);

			expect(result.constraints).toEqual([]);
			expect(result.tasks).toHaveLength(2);
			expect(result.metadata.totalTasks).toBe(2);
			expect(result.metadata.completedTasks).toBe(2);
			expect(result.metadata.isComplete).toBe(true);
		});

		it("should handle constraints: none", () => {
			const input = `chore(deps): update dependencies

Update all dependencies to latest versions.

Constraints: none

Tasks [ ]:
- [ ] Update package.json: bump version numbers
- [ ] Test compatibility: run full test suite`;

			const result = parseCommit(input);

			expect(result.constraints).toEqual([]);
			expect(result.tasks).toHaveLength(2);
		});

		it("should parse commit with complex nested tasks and metadata", () => {
			const input = `feat(api): implement GraphQL endpoint

Add GraphQL API endpoint with comprehensive schema and resolvers.

Constraints: none

Tasks [ ]:
- [ ] Schema definition: create GraphQL schema
  - [x] User types: define user-related types
  - [ ] Query resolvers: implement data fetching
    - [x] User queries: basic user data retrieval
    - [ ] Advanced queries: filtering and pagination
  - [ ] Mutation resolvers: implement data modification
- [x] Server setup: configure GraphQL server`;

			const result = parseCommit(input);

			expect(result.tasks).toHaveLength(2);
			expect(result.metadata.totalTasks).toBe(7);
			expect(result.metadata.completedTasks).toBe(3);
			expect(result.metadata.isComplete).toBe(false);
		});

		it("should handle whitespace variations", () => {
			const input = `feat: test feature


Description with extra spacing.


Constraints: none


Tasks [ ]:
- [ ] Task: details`;

			const result = parseCommit(input);

			expect(result.description).toBe("Description with extra spacing.");
			expect(result.tasks).toHaveLength(1);
		});

		it("should calculate completion metadata correctly", () => {
			const testCases = [
				{
					input: `feat: test\n\nTasks [X]:\n- [x] Task 1: completed\n- [x] Task 2: also completed`,
					expectedComplete: true,
				},
				{
					input: `feat: test\n\nTasks [ ]:\n- [x] Task 1: completed\n- [ ] Task 2: incomplete`,
					expectedComplete: false,
				},
				{
					input: `feat: test\n\nTasks [X]:\n- [x] Task 1: completed\n  - [x] Subtask: also completed`,
					expectedComplete: true,
				},
			];

			for (const { input, expectedComplete } of testCases) {
				const result = parseCommit(input);
				expect(result.metadata.isComplete).toBe(expectedComplete);
			}
		});
	});

	describe("error handling", () => {
		it("should reject empty commit messages", () => {
			const emptyCases = ["", "   ", "\n\n", "\t"];

			for (const input of emptyCases) {
				expect(() => parseCommit(input)).toThrow(ParseError);
				expect(() => parseCommit(input)).toThrow("Empty commit message");
			}
		});

		it("should reject commits with invalid headers", () => {
			const invalidHeaders = [
				"invalid header format\n\nSome description here.",
				"feature: test\n\nDescription.",
				"fix without colon\n\nDescription.",
			];

			for (const input of invalidHeaders) {
				expect(() => parseCommit(input)).toThrow(ParseError);
			}
		});

		it("should reject commits with malformed constraints", () => {
			const input = `feat: test feature

Description here.

Constraints:
- Should not: test`;

			expect(() => parseCommit(input)).toThrow(ParseError);
		});
		it("should reject commits with malformed tasks", () => {
			const input = `feat: test feature

Description here.

Tasks [ ]:
invalid task format`;

			expect(() => parseCommit(input)).toThrow(ParseError);
		});

		it("should propagate all parser errors", () => {
			const errorCases = [
				{
					input: `feat: ${"a".repeat(121)}`,
					expectedError: "Summary exceeds 120 characters",
				},
				{
					input: `feat(123): test\n\nDescription.`,
					expectedError: "Invalid scope pattern",
				},
				{
					input: `feat: test\n\nConstraints:\n- Should not: invalid prefix`,
					expectedError: "must start with valid prefix",
				},
				{
					input: `feat: test\n\nTasks [ ]:\n- [y] Invalid checkbox`,
					expectedError: "Invalid task format",
				},
			];

			for (const { input, expectedError } of errorCases) {
				expect(() => parseCommit(input)).toThrow(ParseError);
				expect(() => parseCommit(input)).toThrow(expectedError);
			}
		});
	});

	describe("edge cases", () => {
		it("should handle commit with only header", () => {
			const result = parseCommit("feat: simple feature");

			expect(result.header.summary).toBe("simple feature");
			expect(result.description).toBe("");
			expect(result.constraints).toEqual([]);
			expect(result.tasks).toEqual([]);
		});

		it("should handle commits with section keywords in description", () => {
			const input = `feat: test feature

This description mentions Tasks and Constraints as concepts but they are not actual sections.

The word "Constraints:" appears here but not at line start.
Similarly "Tasks [ ]:" might appear in text.`;

			const result = parseCommit(input);

			expect(result.description).toContain("Tasks and Constraints");
			expect(result.constraints).toEqual([]);
			expect(result.tasks).toEqual([]);
		});

		it("should handle mixed line endings", () => {
			const input =
				"feat: test\r\n\r\nDescription with CRLF.\r\n\r\nTasks [ ]:\r\n- [ ] Task: details";

			const result = parseCommit(input);
			expect(result.description).toBe("Description with CRLF.");
			expect(result.tasks).toHaveLength(1);
		});
	});
});
