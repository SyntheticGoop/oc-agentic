/**
 * @fileoverview Zod-based validation system for parsed document output
 * Provides cascading validation with proper error reporting while maintaining discriminated union types
 */

import { z } from "zod";
import type { ParsedResult } from "./parse.js";

// Scope pattern from design specification
const SCOPE_PATTERN = /^[a-z][a-z0-9/.-]*$/;

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
	z.object({
		type: ValidatedCommitType,
		scope: ValidatedScope.optional(),
		breaking: z.boolean(),
		title: z.never().optional(),
	}),
	z.object({
		type: ValidatedCommitType,
		scope: ValidatedScope,
		breaking: z.boolean(),
		title: ValidatedTitle,
	}),
]);
export type ValidatedHeaderPartial = z.infer<typeof ValidatedHeaderPartial>;

const ValidatedHeader = z.union([
	z.strictObject({
		type: ValidatedCommitType,
		scope: ValidatedScope,
		breaking: z.boolean(),
		title: ValidatedTitle,
	}),
]);
export type ValidatedHeader = z.infer<typeof ValidatedHeader>;

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
export type ValidatedTask = [boolean, string, ValidatedTask[]];

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
const ValidatedParsed = z.union([
	// Stage 0: { state: "parsed" | "halted"; stage: 0 }
	z.object({
		state: ValidatedState,
		stage: z.literal(0),
		header: z.never().optional(),
		description: z.never().optional(),
		constraints: z.never().optional(),
		tasks: z.never().optional(),
		directive: z.string().uppercase().optional(),
	}),
	// Stage 1: { state: "parsed" | "halted"; stage: 1; header: ParsedHeaderPartial; ... }
	z.object({
		state: ValidatedState,
		stage: z.literal(1),
		header: ValidatedHeaderPartial,
		description: z.never().optional(),
		constraints: z.never().optional(),
		tasks: z.never().optional(),
		directive: z.string().uppercase().optional(),
	}),
	// Stage 2: { state: "parsed" | "halted"; stage: 2; header: ParsedHeader; description: string; ... }
	z.object({
		state: ValidatedState,
		stage: z.literal(2),
		header: ValidatedHeader,
		description: z.string(),
		constraints: z.never().optional(),
		tasks: z.never().optional(),
		directive: z.string().uppercase().optional(),
	}),
	// Stage 3: { state: "parsed" | "halted"; stage: 3; header: ParsedHeader; description: string; ... }
	z.object({
		state: ValidatedState,
		stage: z.literal(3),
		header: ValidatedHeader,
		description: z.string(),
		constraints: z.never().optional(),
		tasks: z.never().optional(),
		directive: z.string().uppercase().optional(),
	}),
	// Stage 4: { state: "parsed" | "halted"; stage: 4; header: ParsedHeader; description: string; constraints: Array<[string, string]>; ... }
	z.object({
		state: ValidatedState,
		stage: z.literal(4),
		header: ValidatedHeader,
		description: z.string(),
		constraints: z.array(ValidatedConstraint),
		tasks: z.never().optional(),
		directive: z.string().uppercase().optional(),
	}),
	// Stage 5: { state: "parsed" | "halted"; stage: 5; header: ParsedHeader; description: string; constraints: Array<[string, string]>; tasks: Task[]; ... }
	z.object({
		state: ValidatedState,
		stage: z.literal(5),
		header: ValidatedHeader,
		description: z.string(),
		constraints: z.array(ValidatedConstraint),
		tasks: z
			.array(ValidatedTask)
			.refine((tasks) => validateTaskNestingDepth(tasks), {
				message: "Task nesting exceeds maximum depth of 4",
			}),
		directive: z.string().uppercase().optional(),
	}),
	// Stage 6: { state: "parsed" | "halted"; stage: 6; header: ParsedHeader; description: string; constraints: Array<[string, string]>; tasks: Task[]; direction: string }
	z.object({
		state: ValidatedState,
		stage: z.literal(6),
		header: ValidatedHeader,
		description: z.string(),
		constraints: z.array(ValidatedConstraint),
		tasks: z
			.array(ValidatedTask)
			.refine((tasks) => validateTaskNestingDepth(tasks), {
				message: "Task nesting exceeds maximum depth of 4",
			}),
		directive: z.string().uppercase().optional(),
	}),
]);
export type ValidatedParsed = z.infer<typeof ValidatedParsed>;

// Validation result types
export type ValidationError = {
	field: string;
	message: string;
	code: string;
};

export type ValidationResult =
	| {
			isValid: false;
			errors: ValidationError[];
			warnings?: string[];
	  }
	| {
			isValid: true;
			data: ValidatedParsed;
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

	// Validate with Zod schema
	const result = ValidatedParsed.safeParse(parsed);

	if (result.success) {
		const validationResult: ValidationResult = {
			isValid: true,
			data: result.data,
		};

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
