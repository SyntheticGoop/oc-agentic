import { describe, expect, it } from "vitest";
import type { ParsedResult } from "./parse.js";
import { validate } from "./validate.js";

describe("validation", () => {
	describe("Invalid States", () => {
		it("validates empty state", () => {
			const input = { state: "empty" } as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						field: "root",
						message: "Invalid input",
						code: "INVALID_UNION",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});

		it("validates unknown state", () => {
			const input = { state: "unknown" } as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						field: "root",
						message: "Invalid input",
						code: "INVALID_UNION",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});

		it("validates halted state", () => {
			const input = { state: "halted", stage: 0 } as ParsedResult;
			const expected = {
				isValid: true,
				data: { state: "halted", stage: 0 },
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Missing Header", () => {
		it("validates parsed state without header", () => {
			const input = { state: "parsed", stage: 0 } as ParsedResult;
			const expected = {
				isValid: true,
				data: { state: "parsed", stage: 0 },
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Valid Headers", () => {
		it("validates basic header", () => {
			const input = {
				state: "parsed",
				stage: 1,
				header: { type: "feat", breaking: false },
			} as ParsedResult;
			const expected = {
				isValid: true,
				data: {
					state: "parsed",
					stage: 1,
					header: { type: "feat", breaking: false },
				},
			};
			expect(validate(input)).toEqual(expected);
		});

		it("validates header with scope", () => {
			const input = {
				state: "parsed",
				stage: 1,
				header: { type: "fix", scope: "auth", breaking: false },
			} as ParsedResult;
			const expected = {
				isValid: true,
				data: {
					state: "parsed",
					stage: 1,
					header: { type: "fix", scope: "auth", breaking: false },
				},
			};
			expect(validate(input)).toEqual(expected);
		});

		it("validates header with scope, breaking, and title", () => {
			const input = {
				state: "parsed",
				stage: 2,
				header: {
					type: "refactor",
					scope: "api-v2",
					breaking: true,
					title: "restructure endpoints",
				},
				description: "",
			} as ParsedResult;
			const expected = {
				isValid: true,
				data: {
					state: "parsed",
					stage: 2,
					header: {
						type: "refactor",
						scope: "api-v2",
						breaking: true,
						title: "restructure endpoints",
					},
					description: "",
				},
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Invalid Commit Types", () => {
		it("rejects feature type", () => {
			const input = {
				state: "parsed",
				header: { type: "feature", breaking: false },
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						field: "root",
						message: "Invalid input",
						code: "INVALID_UNION",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});

		it("rejects bugfix type", () => {
			const input = {
				state: "parsed",
				header: { type: "bugfix", breaking: false },
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						field: "root",
						message: "Invalid input",
						code: "INVALID_UNION",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Invalid Scope Patterns", () => {
		it("rejects scope starting with number", () => {
			const input = {
				state: "parsed",
				stage: 1,
				header: { type: "feat", scope: "123invalid", breaking: false },
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						field: "header.scope",
						message:
							"Scope must start with a letter and contain only lowercase letters, numbers, and hyphens",
						code: "INVALID_FORMAT",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});

		it("rejects scope with underscore", () => {
			const input = {
				state: "parsed",
				stage: 1,
				header: { type: "chore", scope: "auth_test", breaking: false },
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						field: "header.scope",
						message:
							"Scope must start with a letter and contain only lowercase letters, numbers, and hyphens",
						code: "INVALID_FORMAT",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Title Validation", () => {
		it("rejects title over 120 characters", () => {
			const input = {
				state: "parsed",
				stage: 2,
				header: {
					type: "feat",
					scope: "auth",
					breaking: false,
					title: "a".repeat(121),
				},
				description: "",
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						field: "header.title",
						message: "Title exceeds 120 characters",
						code: "TOO_BIG",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});

		it("rejects title with whitespace", () => {
			const input = {
				state: "parsed",
				stage: 2,
				header: {
					type: "fix",
					scope: "api",
					breaking: false,
					title: "  whitespace title  ",
				},
				description: "",
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						field: "header.title",
						message: "Title should not have leading or trailing whitespace",
						code: "CUSTOM",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});

		it("accepts title at exactly 120 characters", () => {
			const input = {
				state: "parsed",
				stage: 2,
				header: {
					type: "docs",
					scope: "readme",
					breaking: false,
					title: "a".repeat(120),
				},
				description: "",
			} as ParsedResult;
			const expected = {
				isValid: true,
				data: {
					state: "parsed",
					stage: 2,
					header: {
						type: "docs",
						scope: "readme",
						breaking: false,
						title: "a".repeat(120),
					},
					description: "",
				},
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Valid Constraints", () => {
		it("validates single constraint", () => {
			const input = {
				state: "parsed",
				stage: 4,
				header: { type: "feat", scope: "test", breaking: false, title: "test" },
				description: "test description",
				constraints: [["Do not", "break existing functionality"]],
			} as ParsedResult;
			const expected = {
				isValid: true,
				data: {
					state: "parsed",
					stage: 4,
					header: {
						type: "feat",
						scope: "test",
						breaking: false,
						title: "test",
					},
					description: "test description",
					constraints: [["Do not", "break existing functionality"]],
				},
			};
			expect(validate(input)).toEqual(expected);
		});

		it("validates multiple constraints", () => {
			const input = {
				state: "parsed",
				stage: 4,
				header: { type: "fix", scope: "test", breaking: false, title: "test" },
				description: "test description",
				constraints: [
					["Never", "expose sensitive data"],
					["Must not", "modify core behavior"],
					["Cannot", "access external services"],
					["Forbidden", "hardcoded credentials"],
					["Avoid", "breaking changes"],
					["Decide against", "major refactoring"],
				],
			} as ParsedResult;
			const expected = {
				isValid: true,
				data: {
					state: "parsed",
					stage: 4,
					header: {
						type: "fix",
						scope: "test",
						breaking: false,
						title: "test",
					},
					description: "test description",
					constraints: [
						["Never", "expose sensitive data"],
						["Must not", "modify core behavior"],
						["Cannot", "access external services"],
						["Forbidden", "hardcoded credentials"],
						["Avoid", "breaking changes"],
						["Decide against", "major refactoring"],
					],
				},
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Invalid Constraint Prefixes", () => {
		it("rejects invalid prefix", () => {
			const input = {
				state: "parsed",
				header: { type: "feat", breaking: false },
				description: "test description",
				constraints: [["Should not", "do something"] as [string, string]],
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						code: "INVALID_UNION",
						field: "root",
						message: "Invalid input",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Constraint Value Validation", () => {
		it("rejects uppercase constraint value", () => {
			const input = {
				state: "parsed",
				stage: 4,
				header: {
					type: "feat",
					breaking: false,
					scope: "test",
					title: "test feature",
				},
				description: "test description",
				constraints: [["Do not", "Break existing functionality"]],
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						code: "CUSTOM",
						field: "constraints.0.1",
						message: "Constraint value should start with lowercase",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});

		it("rejects empty constraint value", () => {
			const input = {
				state: "parsed",
				stage: 4,
				header: {
					type: "fix",
					breaking: false,
					scope: "test",
					title: "test fix",
				},
				description: "test description",
				constraints: [["Never", ""]],
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						code: "TOO_SMALL",
						field: "constraints.0.1",
						message: "Constraint value cannot be empty",
					},
					{
						code: "CUSTOM",
						field: "constraints.0.1",
						message: "Constraint value should start with lowercase",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Valid Tasks", () => {
		it("validates simple task", () => {
			const input = {
				state: "parsed",
				stage: 5,
				header: {
					type: "feat",
					breaking: false,
					scope: "test",
					title: "test feature",
				},
				description: "test description",
				constraints: [],
				tasks: [[false, "Simple task", []]],
			} as ParsedResult;
			const expected = {
				isValid: true,
				data: input,
			};
			expect(validate(input)).toEqual(expected);
		});

		it("validates nested tasks", () => {
			const input = {
				state: "parsed",
				stage: 5,
				header: {
					type: "fix",
					breaking: false,
					scope: "test",
					title: "test fix",
				},
				description: "test description",
				constraints: [],
				tasks: [
					[true, "Parent task", []],
					[false, "Child task", [[false, "Grandchild task", []]]],
				],
			} as ParsedResult;
			const expected = {
				isValid: true,
				data: input,
			};
			expect(validate(input)).toEqual(expected);
		});

		it("validates maximum nesting depth", () => {
			const input = {
				state: "parsed",
				stage: 5,
				header: {
					type: "refactor",
					breaking: false,
					scope: "test",
					title: "test refactor",
				},
				description: "test description",
				constraints: [],
				tasks: [
					[
						false,
						"Level 0",
						[
							[
								false,
								"Level 1",
								[
									[
										false,
										"Level 2",
										[[false, "Level 3", [[false, "Level 4", []]]]],
									],
								],
							],
						],
					],
				],
			} as ParsedResult;
			const expected = {
				isValid: true,
				data: input,
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Invalid Task Structure", () => {
		it("rejects invalid completion flag", () => {
			const input = {
				state: "parsed",
				stage: 5,
				header: { type: "feat", breaking: false, scope: undefined, title: "" },
				description: "test description",
				constraints: [],
				// biome-ignore lint/suspicious/noExplicitAny: testing invalid type
				tasks: [["not_boolean" as any, "Invalid completion flag", []]],
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						code: "INVALID_UNION",
						field: "root",
						message: "Invalid input",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});

		it("rejects empty task description", () => {
			const input = {
				state: "parsed",
				stage: 5,
				header: {
					type: "fix",
					breaking: false,
					scope: "test",
					title: "test fix",
				},
				description: "test description",
				constraints: [],
				tasks: [[true, "", []]],
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						code: "TOO_SMALL",
						field: "tasks.0.1",
						message: "Task description must be a non-empty string",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});

		it("rejects non-string task description", () => {
			const input = {
				state: "parsed",
				stage: 5,
				header: { type: "chore", breaking: false, scope: undefined, title: "" },
				description: "test description",
				constraints: [],
				// biome-ignore lint/suspicious/noExplicitAny: testing invalid type
				tasks: [[false, 123 as any, []]],
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						code: "INVALID_UNION",
						field: "root",
						message: "Invalid input",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Task Nesting Depth", () => {
		it("rejects excessive nesting", () => {
			const input = {
				state: "parsed",
				stage: 5,
				header: {
					type: "feat",
					breaking: false,
					scope: "test",
					title: "test feature",
				},
				description: "test description",
				constraints: [],
				tasks: [
					[
						false,
						"Level 0",
						[
							[
								false,
								"Level 1",
								[
									[
										false,
										"Level 2",
										[
											[
												false,
												"Level 3",
												[
													[
														false,
														"Level 4",
														[[false, "Level 5 - Too deep", []]],
													],
												],
											],
										],
									],
								],
							],
						],
					],
				],
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						code: "CUSTOM",
						field: "tasks",
						message: "Task nesting exceeds maximum depth of 4",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Type Validation", () => {
		it("rejects non-string description", () => {
			const input = {
				state: "parsed",
				header: { type: "feat", breaking: false },
				// biome-ignore lint/suspicious/noExplicitAny: testing invalid type
				description: 123 as any,
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						code: "INVALID_UNION",
						field: "root",
						message: "Invalid input",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});

		it("rejects non-string direction", () => {
			const input = {
				state: "parsed",
				stage: 5,
				header: {
					type: "feat",
					breaking: false,
					scope: "test",
					title: "test feature",
				},
				description: "test description",
				constraints: [],
				tasks: [],
				// biome-ignore lint/suspicious/noExplicitAny: testing invalid type
				directive: 456 as any,
			} as ParsedResult;
			const expected = {
				isValid: false,
				errors: [
					{
						code: "INVALID_UNION",
						field: "root",
						message: "Invalid input",
					},
				],
			};
			expect(validate(input)).toEqual(expected);
		});
	});

	describe("Complex Valid Document", () => {
		it("validates complete document", () => {
			const input = {
				state: "parsed",
				stage: 5,
				header: {
					type: "feat",
					scope: "auth",
					breaking: true,
					title: "implement OAuth2 flow",
				},
				description:
					"Add comprehensive OAuth2 authentication with token refresh capabilities.",
				constraints: [
					["Do not", "store tokens in localStorage"],
					["Never", "expose client secrets"],
				],
				tasks: [
					[
						true,
						"OAuth2 implementation",
						[
							[true, "Token endpoint", []],
							[false, "Refresh endpoint", []],
						],
					],
					[
						false,
						"Client integration",
						[
							[false, "Frontend client", []],
							[false, "Mobile app", []],
						],
					],
				],
				directive: "CONTINUE WITH TESTING PHASE",
			} as ParsedResult;
			const expected = {
				isValid: true,
				data: input,
			};
			expect(validate(input)).toEqual(expected);
		});
	});
});
