import z from "zod";
import type { Jujutsu } from "../jujutsu.ts";
import { Err, Ok } from "../result";

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

type Task = {
	task_key: string;
	title: string;
	type: ValidatedCommitType;
	scope: string | null;
	intent: string;
	objectives: string[];
	constraints: string[];
	completed: boolean;
};

export type LoadedPlanData = {
	scope: string | null;
	plan_key: [string, string] | null;
	title: string;
	intent: string;
	objectives: string[];
	constraints: string[];
	tasks: [Task, ...Task[]];
};

export function parseCommitHeader(header: string) {
	const begin = /^begin(\((?<scope>[a-z0-9/.-]+)\))?: (?<title>[a-z0-9].*)$/;
	const end = /^end(\((?<scope>[a-z0-9/.-]+)\))?: (?<title>[a-z0-9].*)$/;
	const task =
		/^(?<type>[a-z]+)(\((?<scope>[a-z0-9/.-]+)\))?:(?<not>~)? (?<title>[a-z0-9].*)$/;
	const singletask =
		/^(?<type>[a-z]+)(\((?<scope>[a-z0-9/.-]+)\))?::(?<not>~)? (?<title>[a-z0-9].*)$/;

	const beginMatch = begin.exec(header);
	const endMatch = end.exec(header);
	const taskMatch = task.exec(header);
	const standaloneTaskMatch = singletask.exec(header);
	if (beginMatch?.groups) {
		const title = beginMatch.groups.title.trim();
		if (title.length > 120)
			return Err("Begin commit title exceeds maximum length");
		return Ok({
			class: "multi" as const,
			type: "begin" as const,
			scope: beginMatch.groups.scope ?? null,
			title,
		});
	}
	if (endMatch?.groups) {
		const title = endMatch.groups.title.trim();
		if (title.length > 120)
			return Err("End commit title exceeds maximum length");
		return Ok({
			class: "multi" as const,
			type: "end" as const,
			scope: endMatch.groups.scope ?? null,
			title,
		});
	}
	if (taskMatch?.groups) {
		const type = ValidatedCommitType.safeParse(taskMatch.groups.type);
		if (type.error) return Err("Invalid commit type");
		const title = taskMatch.groups.title.trim();
		if (title.length > 120)
			return Err("Task commit title exceeds maximum length");
		return Ok({
			class: "multi" as const,
			type: type.data,
			scope: taskMatch.groups.scope ?? null,
			title,
			completed: !taskMatch.groups.not,
		});
	}
	if (standaloneTaskMatch?.groups) {
		const type = ValidatedCommitType.safeParse(standaloneTaskMatch.groups.type);
		if (type.error) return Err("Invalid commit type");
		const title = standaloneTaskMatch.groups.title.trim();
		if (title.length > 120)
			return Err("Single task commit title exceeds maximum length");
		return Ok({
			class: "single" as const,
			type: type.data,
			scope: standaloneTaskMatch.groups.scope ?? null,
			title,
			completed: !standaloneTaskMatch.groups.not,
		});
	}
	return Err("Invalid header format");
}

export function parseCommitBody(body: string) {
	const lines = body.split("\n");

	const intent: string[] = [];
	const constraints: string[] = [];
	const objectives: string[] = [];
	let stage: "intent" | "constraint" | "objective" = "intent";
	for (const line of lines) {
		switch (stage) {
			case "intent":
				if (line === "## Objectives") {
					stage = "objective";
					break;
				}
				if (line === "## Constraints") {
					stage = "constraint";
					break;
				}
				intent.push(line);
				break;
			case "objective":
				if (line === "## Constraints") {
					stage = "constraint";
					break;
				}
				objectives.push(line);
				break;
			case "constraint":
				constraints.push(line);

				break;
		}
	}

	const finalIntent = intent.join("\n").trim();

	const finalConstraints = [];
	for (const constraint of constraints.filter((x) => x !== "")) {
		if (constraint === "- ") return Err("Invalid constraint format");
		if (!constraint.startsWith("- ")) return Err("Invalid constraint format");
		const content = constraint.slice(2).trim();
		if (content.length === 0) return Err("Invalid constraint format");
		finalConstraints.push(content);
	}

	const finalObjectives = [];
	for (const objective of objectives.filter((x) => x !== "")) {
		if (objective === "- ") return Err("Invalid objective format");
		if (!objective.startsWith("- ")) return Err("Invalid objective format");
		const content = objective.slice(2).trim();
		if (content.length === 0) return Err("Invalid objective format");
		finalObjectives.push(content);
	}

	return Ok({
		intent: finalIntent,
		constraints: finalConstraints,
		objectives: finalObjectives,
	});
}

export class Loader {
	constructor(private jj: ReturnType<(typeof Jujutsu)["cwd"]>) {}

	public async loadPlan() {
		// Parse headers to get all possible markers
		const linearHistory = await this.jj.history
			.linear()
			.then((historyResult) => {
				if (historyResult.err) return historyResult;
				if (!historyResult.ok.current) {
					return Err("No current commit found in repository");
				}
				const header = parseCommitHeader(historyResult.ok.current.message);
				if (header.err) return header;

				const future = [];
				for (const commit of historyResult.ok.future) {
					const header = parseCommitHeader(commit.message);
					if (header.err) break;
					future.push({
						header: header.ok,
						changeId: commit.changeId,
						hash: commit.hash,
					});
				}

				const history = [];
				for (const commit of historyResult.ok.history.reverse()) {
					const header = parseCommitHeader(commit.message);
					if (header.err) break;
					history.push({
						header: header.ok,
						changeId: commit.changeId,
						hash: commit.hash,
					});
				}
				history.reverse();

				return Ok({
					history,
					current: {
						header: header.ok,
						changeId: historyResult.ok.current.changeId,
						hash: historyResult.ok.current.hash,
					},
					future,
				});
			});
		if (linearHistory.err) return linearHistory;
		// Identify if current is single
		if (linearHistory.ok.current.header.class === "single") {
			const commitDescription = await this.jj.description.get(
				linearHistory.ok.current.changeId,
			);
			if (commitDescription.err) return commitDescription;
			const body = parseCommitBody(
				commitDescription.ok.split("\n").slice(1).join("\n"),
			);
			if (body.err) return body;
			return Ok({
				scope: linearHistory.ok.current.header.scope,
				title: linearHistory.ok.current.header.title,
				plan_key: null,
				intent: body.ok.intent,
				constraints: body.ok.constraints,
				objectives: body.ok.objectives,
				tasks: [
					{
						task_key: linearHistory.ok.current.changeId,
						type: linearHistory.ok.current.header.type,
						scope: linearHistory.ok.current.header.scope,
						title: linearHistory.ok.current.header.title,
						intent: body.ok.intent,
						constraints: body.ok.constraints,
						objectives: body.ok.objectives,
						completed: linearHistory.ok.current.header.completed,
					},
				],
			} satisfies LoadedPlanData);
		}
		const planCommits = [];
		if (linearHistory.ok.current.header.type === "begin") {
			planCommits.push(linearHistory.ok.current);
			for (const commit of linearHistory.ok.future) {
				if (commit.header.type === "begin") {
					return Err("Unexpected terminating header in task position");
				}
				planCommits.push(commit);
				if (commit.header.type === "end") {
					break;
				}
			}
		} else if (linearHistory.ok.current.header.type === "end") {
			const start = linearHistory.ok.history.findLastIndex(
				(commit) => commit.header.type === "begin",
			);
			planCommits.push(...linearHistory.ok.history.slice(start));
			planCommits.push(linearHistory.ok.current);
		} else {
			const start = linearHistory.ok.history.findLastIndex(
				(commit) => commit.header.type === "begin",
			);
			const end = linearHistory.ok.future.findIndex(
				(commit) => commit.header.type === "end",
			);
			planCommits.push(...linearHistory.ok.history.slice(start));
			planCommits.push(linearHistory.ok.current);
			planCommits.push(...linearHistory.ok.future.slice(0, end));
		}
		if (planCommits.length < 3)
			return Err("Invalid LONG format plan: insufficient commits");
		if (planCommits.filter((c) => c.header.type === "end").length > 1)
			return Err("Invalid LONG format plan: expected end commit");
		if (planCommits.filter((c) => c.header.type === "begin").length > 1)
			return Err("Invalid LONG format plan: expected begin commit");
		const taskCommits = [];
		for (const taskCommit of planCommits.slice(1, -1)) {
			const commitDescription = await this.jj.description.get(
				taskCommit.changeId,
			);
			if (commitDescription.err) return commitDescription;
			const body = parseCommitBody(
				commitDescription.ok.split("\n").slice(1).join("\n"),
			);
			if (body.err) return body;
			if (
				taskCommit.header.type === "begin" ||
				taskCommit.header.type === "end"
			)
				return Err("Unexpected terminating header in task position");
			taskCommits.push({
				entry: taskCommit,
				header: taskCommit.header,
				body: body.ok,
			});
		}
		const startCommit = planCommits.at(0);
		if (!startCommit) return Err("Failed to find end commit");

		const endCommit = planCommits.at(-1);
		if (!endCommit) return Err("Failed to find end commit");
		const commitDescription = await this.jj.description.get(endCommit.changeId);
		if (commitDescription.err) return commitDescription;
		const body = parseCommitBody(
			commitDescription.ok.split("\n").slice(1).join("\n"),
		);
		if (body.err) return body;

		if (taskCommits.length === 0) return Err("There must be at least one task");

		return Ok({
			scope: endCommit.header.scope,
			title: endCommit.header.title,
			intent: body.ok.intent,
			constraints: body.ok.constraints,
			plan_key: [startCommit.changeId, endCommit.changeId],
			objectives: body.ok.objectives,
			tasks: taskCommits.map((taskCommit) => ({
				task_key: taskCommit.entry.changeId,
				type: taskCommit.header.type,
				scope: taskCommit.header.scope,
				title: taskCommit.header.title,
				intent: taskCommit.body.intent,
				constraints: taskCommit.body.constraints,
				objectives: taskCommit.body.objectives,
				completed: taskCommit.header.completed,
			})) as [Task, ...Task[]],
		} satisfies LoadedPlanData);
	}
}
