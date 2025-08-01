/**
 * @fileoverview Generic state machine parser for structured text documents
 */

export type ParsedHeader =
	| {
			type: string;
			scope?: never;
			breaking: boolean;
			title?: never;
	  }
	| {
			type: string;
			scope: string;
			breaking: boolean;
			title?: never;
	  }
	| {
			type: string;
			scope: string;
			breaking: boolean;
			title: string;
	  };

export type Task = [boolean, string, Task[]];

export type ParsedResult =
	| {
			state: "empty";
	  }
	| {
			state: "unknown";
	  }
	| {
			state: "parsed" | "halted";
	  }
	| {
			state: "parsed" | "halted";
			header: ParsedHeader;
			description?: never;
			constraints?: never;
			tasks?: never;
			direction?: never;
	  }
	| {
			state: "parsed" | "halted";
			header: ParsedHeader;
			description: string;
			constraints?: never;
			tasks?: never;
			direction?: never;
	  }
	| {
			state: "parsed" | "halted";
			header: ParsedHeader;
			description: string;
			constraints: Array<[string, string]>;
			tasks?: never;
			direction?: never;
	  }
	| {
			state: "parsed" | "halted";
			header: ParsedHeader;
			description: string;
			constraints: Array<[string, string]>;
			tasks: Task[];
			direction?: never;
	  }
	| {
			state: "parsed" | "halted";
			header: ParsedHeader;
			description: string;
			constraints: Array<[string, string]>;
			tasks: Task[];
			direction: string;
	  };

export type ParserConfig = {
	maxTitleLength: number;
	indentSize: number;
	taskPattern: RegExp;
	constraintPattern: RegExp;
	directionHaltLength?: number;
	maxInputLength: number;
	maxNestingDepth: number;
	maxTaskCount: number;
	headerPatterns: {
		complete: RegExp;
		typeScopeBreaking: RegExp;
		typeScope: RegExp;
		type: RegExp;
	};
};

export const DEFAULT_CONFIG: ParserConfig = {
	maxTitleLength: 120,
	indentSize: 2,
	taskPattern: /^(\s*)- \[([x ])\]: (.+)$/,
	constraintPattern: /^- ([A-Z][a-z ]*): ([a-z].*)$/,
	directionHaltLength: 3,
	maxInputLength: 100000,
	maxNestingDepth: 4,
	maxTaskCount: 1000,
	headerPatterns: {
		complete: /^([a-z]+)\(([^)\s]+)\)(!)?:\s*(.+)$/,
		typeScopeBreaking: /^([a-z]+)\(([^)\s]+)\)!:$/,
		typeScope: /^([a-z]+)\(([^)\s]+)\):$/,
		type: /^([a-z]+):.*$/,
	},
};

// Helper function to create custom configurations
export function createConfig(overrides: Partial<ParserConfig>): ParserConfig {
	return {
		...DEFAULT_CONFIG,
		...overrides,
		headerPatterns: {
			...DEFAULT_CONFIG.headerPatterns,
			...(overrides.headerPatterns || {}),
		},
	};
}

// Validation function for configuration
export function validateConfig(config: ParserConfig): string[] {
	const errors: string[] = [];

	if (config.maxTitleLength <= 0) {
		errors.push("maxTitleLength must be positive");
	}

	if (config.indentSize <= 0) {
		errors.push("indentSize must be positive");
	}

	if (config.maxInputLength <= 0) {
		errors.push("maxInputLength must be positive");
	}

	if (config.maxNestingDepth < 0) {
		errors.push("maxNestingDepth must be non-negative");
	}

	if (config.maxTaskCount <= 0) {
		errors.push("maxTaskCount must be positive");
	}

	if (
		config.directionHaltLength !== undefined &&
		config.directionHaltLength < 0
	) {
		errors.push("directionHaltLength must be non-negative");
	}

	return errors;
}

// Utility function to check if input contains unsafe characters
function containsUnsafeCharacters(input: string): boolean {
	// Check for null bytes or other potentially problematic characters
	return /\0/.test(input);
}

// Helper function to create valid ParsedHeader according to discriminated union
function createParsedHeader(
	type: string,
	scope?: string,
	breaking?: boolean,
	title?: string,
): ParsedHeader {
	if (title) {
		// Must have scope and breaking when title is present
		return {
			type,
			scope: scope!,
			breaking: breaking!,
			title,
		};
	} else if (scope) {
		// Has scope and breaking but no title
		return {
			type,
			scope,
			breaking: breaking ?? false,
		};
	} else {
		// Only type and breaking
		return {
			type,
			breaking: breaking ?? false,
		};
	}
}

// Helper function to create valid ParsedResult according to discriminated union
function createParsedResult(
	state: "parsed" | "halted",
	header: ParsedHeader,
	description?: string,
	constraints?: Array<[string, string]>,
	tasks?: Task[],
	direction?: string,
): ParsedResult {
	if (direction) {
		// Must have all fields when direction is present
		return {
			state,
			header,
			description: description!,
			constraints: constraints!,
			tasks: tasks!,
			direction,
		};
	} else if (tasks && tasks.length > 0) {
		// Has tasks but no direction
		return {
			state,
			header,
			description: description!,
			constraints: constraints!,
			tasks,
		};
	} else if (constraints && constraints.length > 0) {
		// Has constraints but no tasks or direction
		return {
			state,
			header,
			description: description!,
			constraints,
		};
	} else if (description) {
		// Has description but no constraints, tasks, or direction
		return {
			state,
			header,
			description,
		};
	} else {
		// Only header
		return {
			state,
			header,
		};
	}
}

// Predefined configurations for common use cases
export const CONFIGS = {
	// Default commit message format
	COMMIT_MESSAGE: DEFAULT_CONFIG,

	// Markdown task list format
	MARKDOWN_TASKS: createConfig({
		taskPattern: /^(\s*)- \[([x ])\] (.+)$/, // No colon after checkbox
		constraintPattern: /^> ([^:]+): (.+)$/, // Use blockquotes for constraints
		headerPatterns: {
			complete: /^# (.+)$/, // Markdown header
			typeScopeBreaking: /^$/, // Not applicable
			typeScope: /^$/, // Not applicable
			type: /^$/, // Not applicable
		},
		directionHaltLength: undefined, // No direction halt
	}),

	// YAML-like format
	YAML_LIKE: createConfig({
		taskPattern: /^(\s*)- task: (.+) \(([x ])\)$/, // YAML-style tasks
		constraintPattern: /^(\w+): (.+)$/, // YAML key-value
		indentSize: 4, // 4-space indentation
		headerPatterns: {
			complete: /^title: (.+)$/,
			typeScopeBreaking: /^$/,
			typeScope: /^$/,
			type: /^$/,
		},
	}),

	// Strict validation config
	STRICT: createConfig({
		maxTitleLength: 50,
		maxInputLength: 10000,
		maxNestingDepth: 3,
		maxTaskCount: 50,
		directionHaltLength: 1, // Very strict direction validation
	}),
} as const;

export function parse(
	input: string,
	config: ParserConfig = DEFAULT_CONFIG,
): ParsedResult {
	// Validate configuration
	const configErrors = validateConfig(config);
	if (configErrors.length > 0) {
		return { state: "halted" };
	}

	// Handle empty input
	if (!input.trim()) {
		return { state: "parsed" };
	}

	// Check if input starts with newline (should be halted)
	if (input.startsWith("\n")) {
		return { state: "halted" };
	}

	// Validate input length and safety
	if (input.length > config.maxInputLength || containsUnsafeCharacters(input)) {
		return { state: "halted" };
	}

	const lines = input.split("\n");
	const firstLine = lines[0];

	// Try to parse header
	const headerResult = parseHeader(firstLine, config);
	if (!headerResult) {
		return { state: "halted" };
	}

	// If it's just a header line (no description), return it
	if (lines.length === 1 || (lines.length === 2 && lines[1] === "")) {
		// Check if title is too long for halted state
		if (headerResult.titleTooLong) {
			return {
				state: "halted",
				header: headerResult.header,
			};
		}

		return {
			state: "parsed",
			header: headerResult.header,
		};
	}

	// Handle multiline content
	if (lines.length >= 2) {
		const secondLine = lines[1];

		// Single newline without empty line should be halted
		if (secondLine !== "") {
			return {
				state: "halted",
				header: createParsedHeader(
					headerResult.header.type,
					headerResult.header.scope,
					headerResult.header.breaking,
					headerResult.header.title,
				),
			};
		}

		// Must have empty line after header for valid description
		if (secondLine === "" && lines.length >= 3) {
			const contentLines = lines.slice(2);
			return parseContent(contentLines, headerResult.header, config);
		}
	}

	return { state: "halted" };
}

function parseContent(
	contentLines: string[],
	header: ParsedHeader,
	config: ParserConfig,
): ParsedResult {
	let description: string | undefined;
	let constraints: Array<[string, string]> = [];
	let tasks: Task[] = [];
	let direction: string | undefined;

	// Simple parsing approach - find sections sequentially
	let currentIndex = 0;

	// Parse description (until we hit constraints or tasks)
	const descriptionLines: string[] = [];
	while (currentIndex < contentLines.length) {
		const line = contentLines[currentIndex];

		// Stop if we hit constraints or tasks
		if (
			line.startsWith("- ") &&
			(line.includes(": ") || line.match(config.taskPattern))
		) {
			break;
		}

		// Check for empty line in description
		if (line === "") {
			// Look ahead to see if there are tasks after this empty line
			let hasTasksAfter = false;
			for (let j = currentIndex + 1; j < contentLines.length; j++) {
				const nextLine = contentLines[j];
				if (nextLine.match(config.taskPattern)) {
					hasTasksAfter = true;
					break;
				}
				if (nextLine.trim() !== "") break;
			}

			if (hasTasksAfter) {
				// Empty line before tasks is allowed
				description = descriptionLines.join("\n");
				currentIndex++;
				break;
			} else {
				// Empty line in middle of description - halt
				return {
					state: "halted",
					header: createParsedHeader(
						header.type,
						header.scope,
						header.breaking,
						header.title,
					),
					description: descriptionLines.join("\n"),
				};
			}
		}

		descriptionLines.push(line);
		currentIndex++;
	}

	if (descriptionLines.length > 0 && !description) {
		description = descriptionLines.join("\n");
	}

	// Parse constraints
	while (currentIndex < contentLines.length) {
		const line = contentLines[currentIndex];

		// Skip empty lines
		if (line === "") {
			currentIndex++;
			continue;
		}

		// Check for task format
		if (line.match(config.taskPattern)) {
			break;
		}

		// Check for constraint format
		const constraintMatch = line.match(config.constraintPattern);
		if (constraintMatch) {
			const [, key, value] = constraintMatch;
			constraints.push([key, value]);
			currentIndex++;
			continue;
		}

		// If it looks like a constraint (starts with "- " and contains ": ") but doesn't match the pattern, skip it
		if (
			line.startsWith("- ") &&
			line.includes(": ") &&
			!line.match(config.taskPattern)
		) {
			currentIndex++;
			continue;
		}

		// Not a constraint, might be direction or other content
		break;
	}

	// Parse tasks
	const taskLines: string[] = [];
	while (currentIndex < contentLines.length) {
		const line = contentLines[currentIndex];

		// Check for invalid task formats that should halt
		if (
			line.match(/^\[[x ]\]: /) ||
			line === "-" ||
			line.match(/^- \[[x ]\]:?\s*$/)
		) {
			// Invalid task format - should halt
			return createParsedResult(
				"halted",
				createParsedHeader(
					header.type,
					header.scope,
					header.breaking,
					header.title,
				),
				description,
				constraints.length > 0 ? constraints : undefined,
			);
		}

		// Check if this is a task
		if (line.match(config.taskPattern)) {
			taskLines.push(line);
			currentIndex++;
		} else if (line === "") {
			// Empty line in tasks
			taskLines.push(line);
			currentIndex++;
		} else {
			// Not a task - might be direction
			break;
		}
	}

	if (taskLines.length > 0) {
		const result = parseTasks(taskLines, config);
		if (result.halted) {
			return createParsedResult(
				"halted",
				createParsedHeader(
					header.type,
					header.scope,
					header.breaking,
					header.title,
				),
				description,
				constraints.length > 0 ? constraints : undefined,
			);
		}
		tasks = result.tasks;
	}

	// Parse direction (remaining content)
	if (currentIndex < contentLines.length) {
		const directionLines = contentLines.slice(currentIndex);
		const directionText = directionLines.join("\n").trim();

		if (directionText) {
			// Check if direction contains newlines - if so, only consider first part
			const firstLine = directionText.split("\n")[0];

			// Check if direction is incomplete (should halt when exactly configured length)
			if (
				config.directionHaltLength &&
				firstLine.length === config.directionHaltLength
			) {
				return createParsedResult(
					"halted",
					createParsedHeader(
						header.type,
						header.scope,
						header.breaking,
						header.title,
					),
					description,
					constraints.length > 0 ? constraints : [],
					tasks.length > 0 ? tasks : [],
					firstLine,
				);
			}
			direction = directionText;
		}
	}

	// Handle special case: empty constraints when tasks exist but no constraints were found
	const shouldIncludeEmptyConstraints =
		tasks.length > 0 && constraints.length === 0 && description;

	const finalConstraints =
		constraints.length > 0
			? constraints
			: shouldIncludeEmptyConstraints
				? []
				: undefined;

	return createParsedResult(
		"parsed",
		header,
		description,
		finalConstraints,
		tasks.length > 0 ? tasks : undefined,
		direction,
	);
}

function parseTasks(
	lines: string[],
	config: ParserConfig,
): { tasks: Task[]; halted?: boolean } {
	// Check for invalid task formats that should halt
	for (const line of lines) {
		if (line === "") continue;
		if (
			line.match(/^- \[[x ]\]:?\s*$/) ||
			line === "-" ||
			line.match(/^\[[x ]\]: /)
		) {
			return { tasks: [], halted: true };
		}
	}

	// Validate task count limit
	const taskCount = lines.filter((line) =>
		line.match(config.taskPattern),
	).length;
	if (taskCount > config.maxTaskCount) {
		return { tasks: [], halted: true };
	}

	// Parse all tasks into a flat structure with levels
	const flatTasks: Array<{
		level: number;
		checked: boolean;
		text: string;
		lineIndex: number;
	}> = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line === "") continue;

		const taskMatch = line.match(config.taskPattern);
		if (!taskMatch) break;

		const [, indent, checked, taskText] = taskMatch;
		const level = indent.length / config.indentSize;
		const isChecked = checked === "x";

		// Validate nesting depth
		if (level > config.maxNestingDepth) {
			return { tasks: [], halted: true };
		}

		flatTasks.push({
			level,
			checked: isChecked,
			text: taskText,
			lineIndex: i,
		});
	}

	// Convert flat structure to hierarchical
	return { tasks: buildTaskHierarchy(flatTasks, -1) };
}

function buildTaskHierarchy(
	flatTasks: Array<{
		level: number;
		checked: boolean;
		text: string;
		lineIndex: number;
	}>,
	parentLevel: number,
): Task[] {
	const tasks: Task[] = [];
	let i = 0;

	while (i < flatTasks.length) {
		const task = flatTasks[i];

		// Stop if we encounter a task at or above parent level
		if (task.level <= parentLevel) {
			break;
		}

		// Find the next task at the same or higher level to determine children range
		let nextSameLevelIndex = i + 1;
		while (
			nextSameLevelIndex < flatTasks.length &&
			flatTasks[nextSameLevelIndex].level > task.level
		) {
			nextSameLevelIndex++;
		}

		// Extract children (all tasks between current and next same level)
		const childTasks = flatTasks.slice(i + 1, nextSameLevelIndex);
		const children = buildTaskHierarchy(childTasks, task.level);

		tasks.push([task.checked, task.text, children]);

		// Move to the next task at same or higher level
		i = nextSameLevelIndex;
	}

	return tasks;
}

function parseHeader(
	line: string,
	config: ParserConfig,
): { header: ParsedHeader; titleTooLong?: boolean } | null {
	// Pattern for complete commit with description: type(scope): description
	const completeMatch = line.match(config.headerPatterns.complete);
	if (completeMatch) {
		const [, type, scope, breaking, title] = completeMatch;

		// Check title length
		if (title.length > config.maxTitleLength) {
			return {
				header: createParsedHeader(type, scope, breaking === "!", undefined),
				titleTooLong: true,
			};
		}

		return {
			header: createParsedHeader(type, scope, breaking === "!", title),
		};
	}

	// Pattern for type with breaking and scope: type(scope)!:
	const typeScopeBreakingMatch = line.match(
		config.headerPatterns.typeScopeBreaking,
	);
	if (typeScopeBreakingMatch) {
		const [, type, scope] = typeScopeBreakingMatch;
		return {
			header: createParsedHeader(type, scope, true, undefined),
		};
	}

	// Pattern for type with scope: type(scope):
	const typeScopeMatch = line.match(config.headerPatterns.typeScope);
	if (typeScopeMatch) {
		const [, type, scope] = typeScopeMatch;
		return {
			header: createParsedHeader(type, scope, false, undefined),
		};
	}

	// Pattern for basic type: type:
	const typeMatch = line.match(config.headerPatterns.type);
	if (typeMatch) {
		const [, type] = typeMatch;
		return {
			header: createParsedHeader(type, undefined, undefined, undefined),
		};
	}

	return null;
}
