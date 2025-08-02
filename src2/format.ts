import type {
	ValidatedConstraint,
	ValidatedHeader,
	ValidatedHeaderPartial,
	ValidatedParsed,
	ValidatedTask,
} from "./validate";

export function format(commit: ValidatedParsed): string {
	switch (true) {
		case !commit.header:
			return "";
		case !commit.description:
			return `${formatHeader(commit.header)}

${formatDirective(commit.directive)}`.trim();
		case !commit.constraints && !commit.tasks:
			return `${formatHeader(commit.header)}

${commit.description}

${formatDirective(commit.directive)}`.trim();
		case !commit.tasks:
			return `${formatHeader(commit.header)}

${commit.description}

${formatConstraints(commit.constraints).join("\n")}

${formatDirective(commit.directive)}`.trim();
		default: {
			const parts = [formatHeader(commit.header), commit.description];

			if (commit.constraints) {
				const constraints = formatConstraints(commit.constraints);
				if (constraints.length > 0) {
					parts.push(constraints.join("\n"));
				}
			}

			if (commit.tasks) {
				const tasks = formatTasks(commit.tasks);
				if (tasks.length > 0) {
					parts.push(tasks.join("\n"));
				}
			}

			const directive = formatDirective(commit.directive);
			if (directive) {
				parts.push(directive);
			}

			return parts.join("\n\n");
		}
	}
}

function formatDirective(directive?: string) {
	if (typeof directive === "string")
		return `~~~ ${directive.toUpperCase()} ~~~`;
	return "";
}

function formatHeader(header: ValidatedHeader | ValidatedHeaderPartial) {
	const type = `${header.type}${typeof header.scope === "string" ? `(${header.scope.toLowerCase()})` : ""}${header.breaking ? "!" : ""}:`;
	if (typeof header.title === "string") {
		return `${type} ${header.title.toLowerCase()}`;
	}
	return type;
}

function formatConstraints(constraints: ValidatedConstraint[]) {
	return constraints.map(([type, constraint]) => `- ${type}: ${constraint}`);
}

function formatTasks(tasks: ValidatedTask[]): string[] {
	function* walkTasks(tasks: ValidatedTask[]): Generator<ValidatedTask> {
		for (const task of tasks) {
			yield task;
			for (const t of walkTasks(task[2])) {
				yield t;
			}
		}
	}

	return tasks.flatMap(([state, task, subtask]) => {
		// Calculate effective state: parent is only checked if all children are checked
		let effectiveState = state;
		if (effectiveState && subtask.length > 0) {
			// If parent is marked as checked, verify all children are also checked
			for (const [childState] of walkTasks(subtask)) {
				if (!childState) {
					effectiveState = false;
					break;
				}
			}
		}

		return [
			`- [${effectiveState ? "x" : " "}]: ${task}`,
			...formatTasks(subtask).map((task) => `  ${task}`),
		];
	});
}
