import z from "zod";
import type { Jujutsu } from "../../src/jujutsu.ts";
import { Err, Ok } from "../../src/result";

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
  tag: string;
  type: ValidatedCommitType;
  scope: string | null;
  intent: string;
  objectives: string[];
  constraints: string[];
  completed: boolean;
};

export type LoadedPlanData = {
  tasks: [Task, ...Task[]];
};

export function parseCommitHeader(header: string) {
  const task =
    /^(?<type>[a-z]+)\((?<scope>[a-z0-9/.-]+)?:(?<tag>[a-z0-9]{4})\):(?<not>~)? (?<title>[a-z0-9].*)$/;

  const taskMatch = task.exec(header);
  if (taskMatch?.groups) {
    const type = ValidatedCommitType.safeParse(taskMatch.groups.type);
    if (type.error) return Err("Parse Error: Invalid commit type");

    const title = taskMatch.groups.title.trim();
    if (title.length > 120)
      return Err("Parse Error: Task commit title exceeds maximum length");

    return Ok({
      type: type.data,
      tag: taskMatch.groups.tag,
      scope: taskMatch.groups.scope ?? null,
      title,
      completed: !taskMatch.groups.not,
    });
  }
  return Err("Parse Error: Invalid header format");
}

export function parseCommitBody(body: string) {
  const lines = body.split("\n");

  const intent: string[] = [];
  const constraints: string[] = [];
  const objectives: string[] = [];
  let stage: "intent" | "constraint" | "objective" = "intent";
  for (const line of lines) {
    const trimmedLine = line.trim();
    switch (stage) {
      case "intent":
        if (trimmedLine === "## Objectives") {
          stage = "objective";
          break;
        }
        if (trimmedLine === "## Constraints") {
          stage = "constraint";
          break;
        }
        intent.push(line);
        break;
      case "objective":
        if (trimmedLine === "## Constraints") {
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

  const finalConstraints: string[] = [];
  for (const constraint of constraints.filter((x) => x !== "")) {
    if (constraint === "- ")
      return Err("Parse Error: Invalid constraint format");
    if (!constraint.startsWith("- "))
      return Err("Parse Error: Invalid constraint format");
    const content = constraint.slice(2).trim();
    if (content.length === 0)
      return Err("Parse Error: Invalid constraint format");
    finalConstraints.push(content);
  }

  const finalObjectives: string[] = [];
  for (const objective of objectives.filter((x) => x !== "")) {
    if (objective === "- ") return Err("Parse Error: Invalid objective format");
    if (!objective.startsWith("- "))
      return Err("Parse Error: Invalid objective format");
    const content = objective.slice(2).trim();
    if (content.length === 0)
      return Err("Parse Error: Invalid objective format");
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
    // Task-only persistence: Load individual task commits without plan structure
    const linearHistory = await this.jj.history
      .linear()
      .then((historyResult) => {
        if (historyResult.err) return historyResult;
        if (!historyResult.ok.current) {
          return Err("VCS Error: No current commit found in repository");
        }
        const header = parseCommitHeader(historyResult.ok.current.message);
        if (header.err) return header;

        const tag = header.ok.tag;
        const future: Array<{
          header: typeof header.ok;
          changeId: string;
          hash: string;
        }> = [];
        for (const commit of historyResult.ok.future) {
          const header = parseCommitHeader(commit.message);
          if (header.err) break;
          if (header.ok.tag !== tag) break;
          future.push({
            header: header.ok,
            changeId: commit.changeId,
            hash: commit.hash,
          });
        }

        const history: Array<{
          header: typeof header.ok;
          changeId: string;
          hash: string;
        }> = [];
        for (const commit of historyResult.ok.history.reverse()) {
          const header = parseCommitHeader(commit.message);
          if (header.err) break;
          if (header.ok.tag !== tag) break;
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

    // Task-only persistence: Handle multi-task commits as individual tasks
    const taskCommits = [];

    // Add current commit if it's a task
    const commitDescription = await this.jj.description.get(
      linearHistory.ok.current.changeId,
    );
    if (commitDescription.err) return commitDescription;
    const body = parseCommitBody(
      commitDescription.ok.split("\n").slice(1).join("\n"),
    );
    if (body.err) return body;
    taskCommits.push({
      entry: linearHistory.ok.current,
      header: linearHistory.ok.current.header,
      body: body.ok,
    });

    // Add future task commits
    for (const commit of linearHistory.ok.future) {
      const commitDescription = await this.jj.description.get(commit.changeId);
      if (commitDescription.err) return commitDescription;
      const body = parseCommitBody(
        commitDescription.ok.split("\n").slice(1).join("\n"),
      );
      if (body.err) return body;
      taskCommits.push({
        entry: commit,
        header: commit.header,
        body: body.ok,
      });
    }

    // Add historical task commits
    for (const commit of linearHistory.ok.history.reverse()) {
      const commitDescription = await this.jj.description.get(commit.changeId);
      if (commitDescription.err) return commitDescription;
      const body = parseCommitBody(
        commitDescription.ok.split("\n").slice(1).join("\n"),
      );
      if (body.err) return body;
      taskCommits.unshift({
        entry: commit,
        header: commit.header,
        body: body.ok,
      });
    }

    if (taskCommits.length === 0)
      return Err("Structure Error: There must be at least one task");

    return Ok({
      tasks: taskCommits.map((taskCommit) => ({
        task_key: taskCommit.entry.changeId,
        tag: taskCommit.header.tag,
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
