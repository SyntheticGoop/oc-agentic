/**
 * @fileoverview Zod-based validation system for parsed document output
 * Provides cascading validation with proper error reporting while maintaining discriminated union types
 */

import { z } from "zod";
import type { ParsedResult } from "./parse.js";

// Scope pattern from design specification
const SCOPE_PATTERN = /^[a-z][a-z0-9-]*$/;

// Base Zod schemas
const ValidatedCommitType = z.enum([
	"feat",
	"fix",
	"refactor",
	"build",
	"chore",
	"docs",
	"lint",
	"infra",
	"spec",
]);
export type ValidatedCommitType = z.infer<typeof ValidatedCommitType>;
const ValidatedConstraintPrefix = z.enum([
	"Do not",
	"Never",
	"Avoid",
	"Decide against",
	"Must not",
	"Cannot",
	"Forbidden",
]);
export type ValidatedConstraintPrefix = z.infer<
	typeof ValidatedConstraintPrefix
>;

// Header schema - validate all possible header structures
const ValidatedScope = z
	.string()
	.regex(
		SCOPE_PATTERN,
		"Scope must start with a letter and contain only lowercase letters, numbers, and hyphens",
	);
const ValidatedTitle = z
	.string()
	.max(120, "Title exceeds 120 characters")
	.refine(
		(val) => val === val.trim(),
		"Title should not have leading or trailing whitespace",
	);

const ValidatedHeaderPartial = z.union([
	z
		.object({
			type: ValidatedCommitType,
			breaking: z.boolean(),
		})
		.strict(),
	z
		.object({
			type: ValidatedCommitType,
			scope: ValidatedScope,
			breaking: z.boolean(),
		})
		.strict(),
	z
		.object({
			type: ValidatedCommitType,
			scope: ValidatedScope,
			breaking: z.boolean(),
			title: ValidatedTitle,
		})
		.strict(),
]);
export type ValidatedHeader = z.infer<typeof ValidatedHeader>;

const ValidatedHeader = z.union([
	z.strictObject({
		type: ValidatedCommitType,
		scope: ValidatedScope,
		breaking: z.boolean(),
		title: ValidatedTitle,
	}),
]);

const ValidatedConstraint = z.tuple([
	ValidatedConstraintPrefix,
	z
		.string()
		.min(1, "Constraint value cannot be empty")
		.refine(
			(val) => val.length > 0 && val[0] === val[0].toLowerCase(),
			"Constraint value should start with lowercase",
		),
]);
export type ValidatedConstraint = z.infer<typeof ValidatedConstraint>;

// Recursive task schema
const ValidatedTask: z.ZodType<ValidatedTask> = z.lazy(() =>
	z.tuple([
		z.boolean(),
		z.string().min(1, "Task description must be a non-empty string"),
		z.array(ValidatedTask),
	]),
);
type ValidatedTask = [boolean, string, ValidatedTask[]];

// Custom validation for task nesting depth
const validateTaskNestingDepth = (
	tasks: ValidatedTask[],
	maxDepth: number = 4,
	currentDepth: number = 0,
): boolean => {
	if (currentDepth > maxDepth) {
		return false;
	}

	for (const [, , children] of tasks) {
		if (
			children.length > 0 &&
			!validateTaskNestingDepth(children, maxDepth, currentDepth + 1)
		) {
			return false;
		}
	}

	return true;
};

const ValidatedState = z.enum(["parsed", "halted"]);
// Main validation schema - validates the content structure
const ValidatedParsedResult = z.union([
	// Branch 1: { state: "empty" }
	z.strictObject({
		state: z.literal("empty"),
	}),
	// Branch 2: { state: "unknown" }
	z.strictObject({
		state: z.literal("unknown"),
	}),
	// Branch 3: { state: "parsed" | "halted" }
	z.strictObject({
		state: ValidatedState,
	}),
	// Branch 4: { state: "parsed" | "halted"; header: ParsedHeaderPartial; ... }
	z.strictObject({
		state: ValidatedState,
		header: ValidatedHeaderPartial,
	}),
	// Branch 5: { state: "parsed" | "halted"; header: ParsedHeader; description: string; ... }
	z.strictObject({
		state: ValidatedState,
		header: ValidatedHeader,
		description: z.string(),
	}),
	// Branch 6: { state: "parsed" | "halted"; header: ParsedHeader; description: string; constraints: Array<[string, string]>; ... }
	z.strictObject({
		state: ValidatedState,
		header: ValidatedHeader,
		description: z.string(),
		constraints: z.array(ValidatedConstraint),
	}),
	// Branch 7: { state: "parsed" | "halted"; header: ParsedHeader; description: string; constraints: Array<[string, string]>; tasks: Task[]; ... }
	z.strictObject({
		state: ValidatedState,
		header: ValidatedHeader,
		description: z.string(),
		constraints: z.array(ValidatedConstraint),
		tasks: z
			.array(ValidatedTask)
			.refine((tasks) => validateTaskNestingDepth(tasks), {
				message: "Task nesting exceeds maximum depth of 4",
			}),
	}),
	// Branch 8: { state: "parsed" | "halted"; header: ParsedHeader; description: string; constraints: Array<[string, string]>; tasks: Task[]; direction: string }
	z.strictObject({
		state: ValidatedState,
		header: ValidatedHeader,
		description: z.string(),
		constraints: z.array(ValidatedConstraint),
		tasks: z
			.array(ValidatedTask)
			.refine((tasks) => validateTaskNestingDepth(tasks), {
				message: "Task nesting exceeds maximum depth of 4",
			}),
		direction: z.string(),
	}),
	// Additional branches for partial headers with content
	// Branch 9: { state: "parsed" | "halted"; header: ParsedHeaderPartial; description: string; ... }
	z.strictObject({
		state: ValidatedState,
		header: ValidatedHeaderPartial,
		description: z.string(),
	}),
	// Branch 10: { state: "parsed" | "halted"; header: ParsedHeaderPartial; description: string; constraints: Array<[string, string]>; ... }
	z.strictObject({
		state: ValidatedState,
		header: ValidatedHeaderPartial,
		description: z.string(),
		constraints: z.array(ValidatedConstraint),
	}),
	// Branch 11: { state: "parsed" | "halted"; header: ParsedHeaderPartial; description: string; constraints: Array<[string, string]>; tasks: Task[]; ... }
	z.strictObject({
		state: ValidatedState,
		header: ValidatedHeaderPartial,
		description: z.string(),
		constraints: z.array(ValidatedConstraint),
		tasks: z
			.array(ValidatedTask)
			.refine((tasks) => validateTaskNestingDepth(tasks), {
				message: "Task nesting exceeds maximum depth of 4",
			}),
	}),
	// Branch 12: { state: "parsed" | "halted"; header: ParsedHeaderPartial; description: string; constraints: Array<[string, string]>; tasks: Task[]; direction: string }
	z.strictObject({
		state: ValidatedState,
		header: ValidatedHeaderPartial,
		description: z.string(),
		constraints: z.array(ValidatedConstraint),
		tasks: z
			.array(ValidatedTask)
			.refine((tasks) => validateTaskNestingDepth(tasks), {
				message: "Task nesting exceeds maximum depth of 4",
			}),
		direction: z.string(),
	}),
]);

// Validation result types
export type ValidationError = {
	field: string;
	message: string;
	code: string;
};

export type ValidationResult = {
	isValid: boolean;
	errors: ValidationError[];
	warnings?: string[];
};

// Convert Zod errors to our ValidationError format
function convertZodErrors(zodErrors: z.ZodError): ValidationError[] {
	return zodErrors.issues.map((error) => ({
		field: error.path.join(".") || "root",
		message: error.message,
		code: error.code.toUpperCase(),
	}));
}

// Main validation function
export function validate(parsed: ParsedResult): ValidationResult {
	const warnings: string[] = [];

	// Special handling for non-parsed states
	if (parsed.state !== "parsed") {
		return {
			isValid: false,
			errors: [
				{
					field: "state",
					message: `Cannot validate non-parsed result with state: ${parsed.state}`,
					code: "INVALID_PARSE_STATE",
				},
			],
		};
	}

	// Special handling for parsed state without header
	if (!("header" in parsed) || !parsed.header) {
		return {
			isValid: false,
			errors: [
				{
					field: "header",
					message: "Header is required for parsed documents",
					code: "MISSING_HEADER",
				},
			],
		};
	}

	// Add warnings for best practices
	if ("scope" in parsed.header && parsed.header.scope) {
		const scope = parsed.header.scope;
		if (scope !== scope.toLowerCase()) {
			warnings.push(`Scope should be lowercase: ${scope}`);
		}
	}

	// Validate with Zod schema
	const result = ValidatedParsedResult.safeParse(parsed);

	if (result.success) {
		const validationResult: ValidationResult = {
			isValid: true,
			errors: [],
		};

		if (warnings.length > 0) {
			validationResult.warnings = warnings;
		}

		return validationResult;
	} else {
		const validationResult: ValidationResult = {
			isValid: false,
			errors: convertZodErrors(result.error),
		};

		if (warnings.length > 0) {
			validationResult.warnings = warnings;
		}

		return validationResult;
	}
}
