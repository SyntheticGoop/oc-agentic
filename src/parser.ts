import type { CommitPlan, CommitType, TaskNode } from "./types.js";

export class ParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ParseError";
	}
}

const VALID_COMMIT_TYPES = new Set([
	"feat",
	"fix",
	"refactor",
	"build",
	"chore",
	"docs",
	"lint",
	"infra",
	"spec",
] as const);

const SCOPE_PATTERN = /^[a-z][a-z0-9-]*$/;

function parseCommitType(input: string): CommitType {
	if (!VALID_COMMIT_TYPES.has(input as CommitType)) {
		throw new ParseError(
			`Invalid commit type: ${input}. Valid types: ${Array.from(VALID_COMMIT_TYPES).join(", ")}`,
		);
	}
	return input as CommitType;
}

function parseScope(rawScope: string): string {
	const normalizedScope = rawScope.toLowerCase();
	if (!SCOPE_PATTERN.test(normalizedScope)) {
		throw new ParseError(
			`Invalid scope pattern: ${rawScope}. Scope must start with a letter and contain only lowercase letters, numbers, and hyphens`,
		);
	}
	return normalizedScope;
}

export function parseHeader(headerLine: string): {
	type: CommitType;
	scope?: string;
	breaking: boolean;
	summary: string;
} {
	// More robust parsing: split by colon first, then parse components
	const colonIndex = headerLine.indexOf(":");
	if (colonIndex === -1) {
		throw new ParseError(
			`Invalid header format: missing colon in "${headerLine}"`,
		);
	}

	const prefix = headerLine.substring(0, colonIndex).trim();
	const summary = headerLine.substring(colonIndex + 1).trim();

	if (!summary) {
		throw new ParseError(`Empty summary not allowed`);
	}

	if (summary.length > 120) {
		throw new ParseError(`Summary exceeds 120 characters: ${summary.length}`);
	}

	// Parse breaking change indicator
	const breaking = prefix.endsWith("!");
	const prefixWithoutBreaking = breaking ? prefix.slice(0, -1) : prefix;

	// Parse scope
	let type: string;
	let scope: string | undefined;

	const scopeMatch = prefixWithoutBreaking.match(/^([a-z]+)\(([^)]*)\)$/);
	if (scopeMatch) {
		type = scopeMatch[1];
		const rawScope = scopeMatch[2];
		if (!rawScope) {
			throw new ParseError(
				`Invalid header format: empty scope in "${headerLine}"`,
			);
		}
		scope = parseScope(rawScope);
	} else {
		type = prefixWithoutBreaking;
	}

	return {
		type: parseCommitType(type),
		scope,
		breaking,
		summary,
	};
}

export function parseConstraints(constraintsSection: string): string[] {
	if (constraintsSection.trim() === "Constraints: none") {
		return [];
	}

	if (!constraintsSection.startsWith("Constraints:")) {
		throw new ParseError("Constraints section must start with 'Constraints:'");
	}

	const content = constraintsSection.substring("Constraints:".length).trim();

	if (content === "none") {
		return [];
	}

	const lines = content
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	const constraints: string[] = [];
	const validPrefixes = [
		"Do not:",
		"Never:",
		"Avoid:",
		"Decide against:",
		"Must not:",
		"Cannot:",
		"Forbidden:",
	];

	for (const line of lines) {
		if (!line.startsWith("- ")) {
			throw new ParseError(`Constraint must start with '- ': ${line}`);
		}

		const constraintText = line.substring(2).trim();

		const hasValidPrefix = validPrefixes.some((prefix) =>
			constraintText.startsWith(prefix),
		);
		if (!hasValidPrefix) {
			throw new ParseError(
				`Constraint must start with valid prefix (${validPrefixes.join(", ")}): ${constraintText}`,
			);
		}

		constraints.push(constraintText);
	}

	return constraints;
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function parseTasksHeader(headerLine: string): boolean {
	const trimmed = headerLine.trim();

	// Check for valid completed format
	if (trimmed === "Tasks [X]:" || trimmed === "Tasks[X]:") {
		return true;
	}

	// Check for valid incomplete format
	if (trimmed === "Tasks [ ]:" || trimmed === "Tasks[ ]:") {
		return false;
	}

	// All other formats are invalid
	throw new ParseError(
		"Tasks section must start with 'Tasks [ ]:' or 'Tasks [X]:'",
	);
}

function parseTaskLine(line: string): {
	indent: number;
	completed: boolean;
	taskText: string;
} | null {
	// More robust task line parsing
	const trimmedLine = line.trimEnd();

	// Count leading whitespace
	const leadingWhitespace = trimmedLine.match(/^(\s*)/)?.[1] || "";
	const indent = leadingWhitespace.length;

	// Remove leading whitespace
	const withoutIndent = trimmedLine.substring(indent);

	// Check for task marker
	if (!withoutIndent.startsWith("- ")) {
		return null;
	}

	// Remove task marker
	const afterMarker = withoutIndent.substring(2);

	// Parse checkbox - be more flexible with whitespace
	const checkboxMatch = afterMarker.match(/^\[\s*([x\s])\s*\]\s*(.*)$/);
	if (!checkboxMatch) {
		return null;
	}

	const completed = checkboxMatch[1].toLowerCase() === "x";
	const taskText = checkboxMatch[2];

	return { indent, completed, taskText };
}

export function parseTasks(tasksSection: string): {
	tasks: TaskNode[];
	isComplete: boolean;
} {
	const lines = tasksSection.split(/\r?\n/);
	if (lines.length === 0) {
		throw new ParseError("Empty tasks section");
	}

	const isComplete = parseTasksHeader(lines[0]);

	// Get content after header
	const contentLines = lines
		.slice(1)
		.map((line) => line.trimEnd())
		.filter((line) => line.trim().length > 0);

	if (contentLines.length === 0) {
		return { tasks: [], isComplete };
	}

	const tasks: TaskNode[] = [];
	const taskStack: { task: TaskNode; level: number }[] = [];

	for (const line of contentLines) {
		const parsed = parseTaskLine(line);
		if (!parsed) {
			throw new ParseError(`Invalid task format: ${line}`);
		}

		const { indent, completed, taskText } = parsed;
		const level = Math.floor(indent / 2);

		if (level > 3) {
			throw new ParseError(`Task nesting too deep (max 4 levels): ${line}`);
		}

		if (level > 0 && taskStack.length < level) {
			throw new ParseError(`Invalid task nesting at level ${level}: ${line}`);
		}

		// Parse task content
		const colonIndex = taskText.indexOf(":");
		let summary: string;
		let details: string;

		if (colonIndex === -1) {
			summary = taskText.trim();
			details = "";
		} else {
			summary = taskText.substring(0, colonIndex).trim();
			details = taskText.substring(colonIndex + 1).trim();
		}

		if (!summary) {
			throw new ParseError(`Task summary cannot be empty: ${line}`);
		}

		// Generate unique ID
		const baseId = slugify(summary);
		let id = baseId;
		let counter = 1;

		const sameLevel =
			level === 0 ? tasks : taskStack[level - 1]?.task.children || [];
		while (sameLevel.some((task) => task.id === id)) {
			id = `${baseId}-${counter}`;
			counter++;
		}

		const task: TaskNode = {
			id,
			summary,
			details,
			completed,
			children: [],
			level,
			parent_id: level > 0 ? taskStack[level - 1]?.task.id : undefined,
		};

		// Update task stack
		taskStack.splice(level);
		taskStack.push({ task, level });

		// Add to appropriate parent
		if (level === 0) {
			tasks.push(task);
		} else {
			const parent = taskStack[level - 1];
			if (!parent) {
				throw new ParseError(`Invalid task nesting at level ${level}: ${line}`);
			}
			parent.task.children.push(task);
		}
	}

	return { tasks, isComplete };
}

function countTasks(tasks: TaskNode[]): { total: number; completed: number } {
	let total = 0;
	let completed = 0;

	for (const task of tasks) {
		total++;
		if (task.completed) {
			completed++;
		}

		const childCounts = countTasks(task.children);
		total += childCounts.total;
		completed += childCounts.completed;
	}

	return { total, completed };
}

function findSectionBoundaries(content: string): {
	constraintsStart: number;
	constraintsEnd: number;
	tasksStart: number;
	tasksEnd: number;
} {
	const lines = content.split(/\r?\n/);
	let constraintsStart = -1;
	let constraintsEnd = -1;
	let tasksStart = -1;
	let tasksEnd = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		// Look for section headers at start of line
		if (line.startsWith("Constraints:")) {
			constraintsStart = i;
		} else if (line.match(/^Tasks\s*\[[X\s]\]:/)) {
			tasksStart = i;
		}
	}

	// Calculate section boundaries
	if (constraintsStart !== -1) {
		if (tasksStart !== -1 && tasksStart > constraintsStart) {
			constraintsEnd = tasksStart;
		} else {
			constraintsEnd = lines.length;
		}
	}

	if (tasksStart !== -1) {
		if (constraintsStart !== -1 && constraintsStart > tasksStart) {
			tasksEnd = constraintsStart;
		} else {
			tasksEnd = lines.length;
		}
	}

	return { constraintsStart, constraintsEnd, tasksStart, tasksEnd };
}

export function parseCommit(commitMessage: string): CommitPlan {
	if (!commitMessage || commitMessage.trim().length === 0) {
		throw new ParseError("Empty commit message");
	}

	const lines = commitMessage.split(/\r?\n/);
	const headerLine = lines[0];
	const header = parseHeader(headerLine);

	// Get content after header (skip empty lines)
	let contentStartIndex = 1;
	while (
		contentStartIndex < lines.length &&
		lines[contentStartIndex].trim() === ""
	) {
		contentStartIndex++;
	}

	if (contentStartIndex >= lines.length) {
		// Only header, no content
		return {
			header,
			description: "",
			constraints: [],
			tasks: [],
			metadata: {
				totalTasks: 0,
				completedTasks: 0,
				isComplete: false,
			},
		};
	}

	const contentLines = lines.slice(contentStartIndex);
	const { constraintsStart, constraintsEnd, tasksStart, tasksEnd } =
		findSectionBoundaries(contentLines.join("\n"));

	let description = "";
	let constraintsSection = "";
	let tasksSection = "";

	// Extract sections based on boundaries
	if (constraintsStart !== -1 && tasksStart !== -1) {
		if (constraintsStart < tasksStart) {
			description = contentLines.slice(0, constraintsStart).join("\n").trim();
			constraintsSection = contentLines
				.slice(constraintsStart, constraintsEnd)
				.join("\n");
			tasksSection = contentLines.slice(tasksStart, tasksEnd).join("\n");
		} else {
			description = contentLines.slice(0, tasksStart).join("\n").trim();
			tasksSection = contentLines.slice(tasksStart, tasksEnd).join("\n");
			constraintsSection = contentLines
				.slice(constraintsStart, constraintsEnd)
				.join("\n");
		}
	} else if (constraintsStart !== -1) {
		description = contentLines.slice(0, constraintsStart).join("\n").trim();
		constraintsSection = contentLines
			.slice(constraintsStart, constraintsEnd)
			.join("\n");
	} else if (tasksStart !== -1) {
		description = contentLines.slice(0, tasksStart).join("\n").trim();
		tasksSection = contentLines.slice(tasksStart, tasksEnd).join("\n");
	} else {
		description = contentLines.join("\n").trim();
	}

	const constraints = constraintsSection
		? parseConstraints(constraintsSection)
		: [];
	const { tasks, isComplete } = tasksSection
		? parseTasks(tasksSection)
		: { tasks: [], isComplete: false };
	const { total, completed } = countTasks(tasks);

	return {
		header,
		description,
		constraints,
		tasks,
		metadata: {
			totalTasks: total,
			completedTasks: completed,
			isComplete: isComplete && total > 0 && completed === total,
		},
	};
}
