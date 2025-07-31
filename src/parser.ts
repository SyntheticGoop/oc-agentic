import type { CommitType, TaskNode, CommitPlan } from "./types.js";

export class ParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ParseError";
	}
}

export function parseHeader(headerLine: string): {
	type: CommitType;
	scope?: string;
	breaking: boolean;
	summary: string;
} {
	const headerRegex =
		/^(feat|fix|refactor|build|chore|docs|lint|infra|spec)(\(([^)]+)\))?(!)?:\s*(.*)$/;

	const match = headerLine.match(headerRegex);
	if (!match) {
		throw new ParseError(`Invalid header format: ${headerLine}`);
	}

	const [, type, , rawScope, breaking, summary] = match;

	if (!summary || summary.trim().length === 0) {
		throw new ParseError(`Empty summary not allowed`);
	}

	if (summary.length > 120) {
		throw new ParseError(`Summary exceeds 120 characters: ${summary.length}`);
	}

	let validatedScope: string | undefined;
	if (rawScope) {
		validatedScope = rawScope.toLowerCase();
		if (!/^[a-z][a-z0-9-]*$/.test(validatedScope)) {
			throw new ParseError(`Invalid scope pattern: ${rawScope}`);
		}
	}

	return {
		type: type as CommitType,
		scope: validatedScope,
		breaking: !!breaking,
		summary: summary.trim(),
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

export function parseTasks(tasksSection: string): {
	tasks: TaskNode[];
	isComplete: boolean;
} {
	const headerMatch = tasksSection.match(/^Tasks\s*\[([X\s])\]:/);
	if (!headerMatch) {
		throw new ParseError(
			"Tasks section must start with 'Tasks [ ]:' or 'Tasks [X]:'",
		);
	}

	const isComplete = headerMatch[1] === "X";

	const content = tasksSection.substring(tasksSection.indexOf(":") + 1).trim();

	if (!content) {
		return { tasks: [], isComplete };
	}

	const lines = content
		.split("\n")
		.map((line) => line.trimEnd())
		.filter((line) => line.trim().length > 0);

	const tasks: TaskNode[] = [];
	const taskStack: { task: TaskNode; level: number }[] = [];

	for (const line of lines) {
		const indentMatch = line.match(/^(\s*)-\s*\[([x\s])\]\s*(.+)$/);
		if (!indentMatch) {
			throw new ParseError(`Invalid task format: ${line}`);
		}

		const indent = indentMatch[1].length;
		const level = Math.floor(indent / 2);
		const completed = indentMatch[2] === "x";
		const taskText = indentMatch[3];

		if (level > 3) {
			throw new ParseError(`Task nesting too deep (max 4 levels): ${line}`);
		}

		if (level > 0 && taskStack.length < level) {
			throw new ParseError(`Invalid task nesting at level ${level}: ${line}`);
		}

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

		// Validate summary is not empty
		if (!summary || summary.length === 0) {
			throw new ParseError(`Task summary cannot be empty: ${line}`);
		}

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

		taskStack.splice(level);
		taskStack.push({ task, level });

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

export function parseCommit(commitMessage: string): CommitPlan {
	if (!commitMessage || commitMessage.trim().length === 0) {
		throw new ParseError("Empty commit message");
	}

	const headerLine = commitMessage.split(/\r?\n/)[0];
	const header = parseHeader(headerLine);

	let description = "";
	let constraintsSection = "";
	let tasksSection = "";

	const fullContent = commitMessage.substring(headerLine.length).trim();

	// Find constraints section - must be at start of line
	const constraintsMatch = fullContent.match(/^Constraints:/m);
	const tasksMatch = fullContent.match(/^Tasks\s*\[[X\s]\]:/m);

	const constraintsIndex = constraintsMatch?.index ?? -1;
	const tasksIndex = tasksMatch?.index ?? -1;

	if (constraintsIndex !== -1 && tasksIndex !== -1) {
		if (constraintsIndex < tasksIndex) {
			description = fullContent.substring(0, constraintsIndex).trim();
			constraintsSection = fullContent
				.substring(constraintsIndex, tasksIndex)
				.trim();
			tasksSection = fullContent.substring(tasksIndex).trim();
		} else {
			description = fullContent.substring(0, tasksIndex).trim();
			tasksSection = fullContent.substring(tasksIndex, constraintsIndex).trim();
			constraintsSection = fullContent.substring(constraintsIndex).trim();
		}
	} else if (constraintsIndex !== -1) {
		description = fullContent.substring(0, constraintsIndex).trim();
		constraintsSection = fullContent.substring(constraintsIndex).trim();
	} else if (tasksIndex !== -1) {
		description = fullContent.substring(0, tasksIndex).trim();
		tasksSection = fullContent.substring(tasksIndex).trim();
	} else {
		description = fullContent;
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
		description: description.trim(),
		constraints,
		tasks,
		metadata: {
			totalTasks: total,
			completedTasks: completed,
			isComplete: isComplete && total > 0 && completed === total,
		},
	};
}
