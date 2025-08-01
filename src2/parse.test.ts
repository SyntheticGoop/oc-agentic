import { describe, expect, it } from "vitest";
import { parse } from "./parse";

describe.each([
	[
		"Unknown",
		[
			["", { state: "parsed", stage: 0 }],
			["random garbage", { state: "halted", stage: 0 }],
		],
	],
	[
		"Header",
		[
			[
				"feat:",
				{
					state: "parsed",
					stage: 1,
					header: {
						type: "feat",
						breaking: false,
						scope: undefined,
						title: undefined,
					},
				},
			],
			[
				"fix:",
				{
					state: "parsed",
					stage: 1,
					header: {
						type: "fix",
						breaking: false,
						scope: undefined,
						title: undefined,
					},
				},
			],
			[
				"Fix:",
				{
					state: "parsed",
					stage: 1,
					header: {
						type: "fix",
						breaking: false,
						scope: undefined,
						title: undefined,
					},
				},
			],
			["fix :", { state: "halted", stage: 0 }],
			[
				"fix(scope):",
				{
					state: "parsed",
					stage: 1,
					header: { type: "fix", scope: "scope", breaking: false },
				},
			],
			["fix (scope):", { state: "halted", stage: 0 }],
			["fix (scope)", { state: "halted", stage: 0 }],
			[
				"fix(sc/ope):",
				{
					state: "parsed",
					stage: 1,
					header: { type: "fix", scope: "sc/ope", breaking: false },
				},
			],
			["fix( sc/ope):", { state: "halted", stage: 0 }],
			["fix(sc /ope):", { state: "halted", stage: 0 }],
			["fix(sc/ope ):", { state: "halted", stage: 0 }],
			[
				"fix(sc/ope)!:",
				{
					state: "parsed",
					stage: 1,
					header: { type: "fix", scope: "sc/ope", breaking: true },
				},
			],
			[
				"fix: Description",
				{
					state: "parsed",
					stage: 1,
					header: {
						type: "fix",
						breaking: false,
						scope: undefined,
						title: undefined,
					},
				},
			],
			[
				"fix(scope): description",
				{
					state: "parsed",
					stage: 2,
					header: {
						type: "fix",
						scope: "scope",
						title: "description",
						breaking: false,
					},
					description: "",
				},
			],
			[
				"fix(scope): descr iption",
				{
					state: "parsed",
					stage: 2,
					header: {
						type: "fix",
						scope: "scope",
						title: "descr iption",
						breaking: false,
					},
					description: "",
				},
			],
			[
				"fix(scope): descr iption\n",
				{
					state: "parsed",
					stage: 2,
					header: {
						type: "fix",
						scope: "scope",
						title: "descr iption",
						breaking: false,
					},
					description: "",
				},
			],
			["\nfix(scope): descr iption", { state: "halted", stage: 0 }],
			[
				"fix(scope): aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
				{
					state: "parsed",
					stage: 2,
					header: {
						type: "fix",
						scope: "scope",
						title:
							"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
						breaking: false,
					},
					description: "",
				},
			],
			[
				"fix(scope): aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
				{
					state: "halted",
					stage: 1,
					header: {
						type: "fix",
						scope: "scope",
						breaking: false,
					},
				},
			],
		],
	],
	[
		"Description",
		[
			[
				"f(s): t\n\ndescription",
				{
					state: "parsed",
					stage: 3,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "description",
				},
			],
			[
				"f(s): t\ndescription",
				{
					state: "halted",
					stage: 1,
					header: {
						type: "f",
						scope: "s",
						breaking: false,
					},
				},
			],
			[
				"f(s): t\n\ndes\ncript\nion",
				{
					state: "parsed",
					stage: 3,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "des\ncript\nion",
				},
			],
			[
				"f(s): t\n\ndes\ncript\n\nion",
				{
					state: "halted",
					stage: 3,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "des\ncript",
				},
			],
		],
	],
	[
		"Constraints",
		[
			[
				"f(s): t\n\ndesc\nription\n- Do not: do something",
				{
					state: "parsed",
					stage: 4,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [["Do not", "do something"]],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- Do not: do something\n- Never: do that",
				{
					state: "parsed",
					stage: 4,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["Do not", "do something"],
						["Never", "do that"],
					],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- Do not: do something\n- n.ever: do that",
				{
					state: "parsed",
					stage: 4,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [["Do not", "do something"]],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- Do not: do something\n- N.ev-er: do that",
				{
					state: "parsed",
					stage: 4,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [["Do not", "do something"]],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- Do not: do something\n- Never: Do that",
				{
					state: "parsed",
					stage: 4,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [["Do not", "do something"]],
				},
			],
		],
	],
	[
		"Tasks",
		[
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [ ]: Task",
				{
					state: "parsed",
					stage: 5,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
					tasks: [[false, "Task", []]],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n\n- [ ]: Task",
				{
					state: "parsed",
					stage: 5,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [],
					tasks: [[false, "Task", []]],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task",
				{
					state: "parsed",
					stage: 5,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
					tasks: [[true, "Task", []]],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n[x]: Task",
				{
					state: "halted",
					stage: 4,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n-",
				{
					state: "halted",
					stage: 4,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [ ]:",
				{
					state: "halted",
					stage: 4,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task\n- [ ]: Task2\n- [ ]: Task3",
				{
					state: "parsed",
					stage: 5,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
					tasks: [
						[true, "Task", []],
						[false, "Task2", []],
						[false, "Task3", []],
					],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task\n  - [ ]: Task2\n- [ ]: Task3",
				{
					state: "parsed",
					stage: 5,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
					tasks: [
						[true, "Task", [[false, "Task2", []]]],
						[false, "Task3", []],
					],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task\n  - [ ]: Task2\n- [ ]: Task3\n  - [ ]: Task4\n      - [x]: Task5\n        - [ ]: Task6",
				{
					state: "parsed",
					stage: 5,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
					tasks: [
						[true, "Task", [[false, "Task2", []]]],
						[
							false,
							"Task3",
							[[false, "Task4", [[true, "Task5", [[false, "Task6", []]]]]]],
						],
					],
				},
			],
		],
	],
	[
		"Directive",
		[
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task\n  - [ ]: Task2\n- [ ]: Task3\n\n",
				{
					state: "parsed",
					stage: 5,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
					tasks: [
						[true, "Task", [[false, "Task2", []]]],
						[false, "Task3", []],
					],
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task\n  - [ ]: Task2\n- [ ]: Task3\n\n~~~ STOP ~~~",
				{
					state: "parsed",
					stage: 5,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
					tasks: [
						[true, "Task", [[false, "Task2", []]]],
						[false, "Task3", []],
					],
					directive: "STOP",
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task\n  - [ ]: Task2\n- [ ]: Task3\n\n~~~ CONTINUE WITH TESTING ~~~",
				{
					state: "parsed",
					stage: 5,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
					tasks: [
						[true, "Task", [[false, "Task2", []]]],
						[false, "Task3", []],
					],
					directive: "CONTINUE WITH TESTING",
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task\n  - [ ]: Task2\n- [ ]: Task3\n\nInvalid directive format",
				{
					state: "halted",
					stage: 5,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "desc\nription",
					constraints: [
						["D", "d"],
						["D", "d"],
					],
					tasks: [
						[true, "Task", [[false, "Task2", []]]],
						[false, "Task3", []],
					],
				},
			],
			[
				"f(s): t\n\ndescription\n\n~~~ PROCEED ~~~",
				{
					state: "parsed",
					stage: 3,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "description",
					directive: "PROCEED",
				},
			],
			[
				"f(s): t\n\ndescription\n- Do not: break things\n\n~~~ HALT ~~~",
				{
					state: "parsed",
					stage: 4,
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
					description: "description",
					constraints: [["Do not", "break things"]],
					directive: "HALT",
				},
			],
			[
				"feat:\n\n~~~ START ~~~",
				{
					state: "halted",
					stage: 1,
					header: {
						type: "feat",
						breaking: false,
						scope: undefined,
						title: undefined,
					},
				},
			],
		],
	],
] satisfies Array<[string, Array<[string, unknown]>]>)(
	"stage %#: %s",
	(_, test) => {
		it.each(test)("parses %#", (from, into) => {
			expect(parse(from)).toEqual(into);
		});
	},
);
