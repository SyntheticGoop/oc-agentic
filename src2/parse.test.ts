import { describe, expect, it } from "vitest";
import { parse } from "./parse";

describe.each([
	[
		"Unknown",
		[
			["", { state: "parsed" }],
			["random garbage", { state: "halted" }],
		],
	],
	[
		"Header",
		[
			["feat:", { state: "parsed", header: { type: "feat", breaking: false } }],
			["fix:", { state: "parsed", header: { type: "fix", breaking: false } }],
			["Fix:", { state: "halted" }],
			["fix :", { state: "halted" }],
			[
				"fix(scope):",
				{
					state: "parsed",
					header: { type: "fix", scope: "scope", breaking: false },
				},
			],
			["fix (scope):", { state: "halted" }],
			["fix (scope)", { state: "halted" }],
			[
				"fix(sc/ope):",
				{
					state: "parsed",
					header: { type: "fix", scope: "sc/ope", breaking: false },
				},
			],
			["fix( sc/ope):", { state: "halted" }],
			["fix(sc /ope):", { state: "halted" }],
			["fix(sc/ope ):", { state: "halted" }],
			[
				"fix(sc/ope)!:",
				{
					state: "parsed",
					header: { type: "fix", scope: "sc/ope", breaking: true },
				},
			],
			[
				"fix: Description",
				{ state: "parsed", header: { type: "fix", breaking: false } },
			],
			[
				"fix(scope): description",
				{
					state: "parsed",
					header: {
						type: "fix",
						scope: "scope",
						title: "description",
						breaking: false,
					},
				},
			],
			[
				"fix(scope): descr iption",
				{
					state: "parsed",
					header: {
						type: "fix",
						scope: "scope",
						title: "descr iption",
						breaking: false,
					},
				},
			],
			[
				"fix(scope): descr iption\n",
				{
					state: "parsed",
					header: {
						type: "fix",
						scope: "scope",
						title: "descr iption",
						breaking: false,
					},
				},
			],
			["\nfix(scope): descr iption", { state: "halted" }],
			[
				"fix(scope): aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
				{
					state: "parsed",
					header: {
						type: "fix",
						scope: "scope",
						title:
							"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
						breaking: false,
					},
				},
			],
			[
				"fix(scope): aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
				{
					state: "halted",
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
					header: {
						type: "f",
						scope: "s",
						title: "t",
						breaking: false,
					},
				},
			],
			[
				"f(s): t\n\ndes\ncript\nion",
				{
					state: "parsed",
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
		"Direction",
		[
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task\n  - [ ]: Task2\n- [ ]: Task3\n\n",
				{
					state: "parsed",
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
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task\n  - [ ]: Task2\n- [ ]: Task3\n\nStop",
				{
					state: "parsed",
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
					direction: "Stop",
				},
			],
			[
				"f(s): t\n\ndesc\nription\n- D: d\n- D: d\n- [x]: Task\n  - [ ]: Task2\n- [ ]: Task3\n\nSto\np",
				{
					state: "halted",
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
					direction: "Sto",
				},
			],
		],
	],
] satisfies Array<[string, Array<[string, unknown]>]>)(
	"stage %#: %s",
	(_, test) => {
		it.each(test)("parses %s", (from, into) => {
			expect(parse(from)).toEqual(into);
		});
	},
);
