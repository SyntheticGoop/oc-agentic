import type { Jujutsu } from "../../src/jujutsu";
import { Err, Ok } from "../../src/result";
import {
  type Loader,
  parseCommitBody,
  parseCommitHeader,
  type ValidatedCommitType,
} from "./loader";

type Task = {
  task_key?: string;
  type: ValidatedCommitType;
  scope: string | null;
  title: string;
  intent: string;
  objectives: string[];
  constraints: string[];
  completed: boolean;
};

export type SavingPlanData = {
  tag: string;
  new?: "current" | "auto";
  tasks: [Task, ...Task[]];
};

function formatTask(tag: string, data: SavingPlanData["tasks"][number]) {
  const head = `${data.type}(${data.scope ?? ""}:${tag}):${data.completed ? "" : "~"} ${data.title.trim()}`;
  const body = `${
    data.intent.trim().length === 0 ? "" : `\n\n${data.intent.trim()}`
  }${
    data.objectives.length === 0
      ? ""
      : `\n\n## Objectives\n${data.objectives.map((objective) => `- ${objective.trim()}`).join("\n")}`
  }${
    data.constraints.length === 0
      ? ""
      : `\n\n## Constraints\n${data.constraints.map((constraints) => `- ${constraints.trim()}`).join("\n")}`
  }`.trim();

  const parseHeader = parseCommitHeader(head);
  if (parseHeader.err) return parseHeader;
  const parseBody = parseCommitBody(body);
  if (parseBody.err) return parseBody;
  if (body.length > 0) {
    return Ok(`${head}\n\n${body}`);
  } else {
    return Ok(head);
  }
}

export class Saver {
  constructor(
    private jj: ReturnType<(typeof Jujutsu)["cwd"]>,
    private loader: Loader,
  ) {}

  public async drop() {
    const current = await this.loader.loadPlan();
    if (current.err) return current;

    const keys = current.ok.tasks.map((task) => task.task_key);

    for (const key of keys) {
      const empty = await this.jj.empty(key);
      if (empty.err) return empty;
      if (!empty.ok) return Err("Safety Error: Commit contains data");
    }

    for (const key of keys) {
      const abandon = await this.jj.abandon(key);
      if (abandon.err) return abandon;
    }
    return Ok(true);
  }

  private async saveNewPlan(plan: SavingPlanData) {
    if (plan.tasks.length === 0)
      return Err("Structure Error: Empty task not allowed");

    // Task-only persistence: create individual task commits without plan structure
    let active: string | null = null;

    const desc = await this.jj.description.get();
    const summary = await this.jj.diff.summary();
    const id = await this.jj.changeId();
    if (desc.err) return desc;
    if (summary.err) return summary;
    if (id.err) return id;

    let useId: string | null =
      summary.ok.length === 0 && desc.ok === "" ? id.ok : null;

    let jump: string | null = null;

    // Create task commits sequentially
    for (const task of plan.tasks) {
      const taskMsg = formatTask(plan.tag, task);
      if (taskMsg.err) return taskMsg;

      if (useId === null) {
        const createOptions = active
          ? { after: active, noEdit: true }
          : { noEdit: true };

        const create = await this.jj.new(createOptions);
        if (create.err) return create;

        const update = await this.jj.description.replace(
          taskMsg.ok,
          create.ok.change,
        );
        if (update.err) return update;
        active = create.ok.change;
        if (jump === null && !task.completed) jump = create.ok.change;
      } else {
        const update = await this.jj.description.replace(taskMsg.ok, useId);
        if (update.err) return update;
        active = useId;
        useId = null;
        if (jump === null && !task.completed) {
          jump = useId;
        }
      }
    }

    // Position at the last task commit
    if (jump !== null) {
      const moved = await this.jj.navigate.to(jump);
      if (moved.err) return moved;
    }

    return Ok(void 0);
  }

  private async saveCurrentPlan(plan: SavingPlanData) {
    if (plan.tasks.length === 0)
      return Err("Structure Error: Empty task not allowed");

    // For new="current", we bypass empty commit and message checks
    // and use the current commit to document work already done
    const desc = await this.jj.description.get();
    const id = await this.jj.changeId();
    if (desc.err) return desc;
    if (id.err) return id;

    const task = plan.tasks[0];
    const taskMsg = formatTask(plan.tag, task);
    if (taskMsg.err) return taskMsg;

    // Update current commit description with task documentation
    const update = await this.jj.description.replace(taskMsg.ok, id.ok);
    if (update.err) return update;

    return Ok(void 0);
  }

  public async savePlan(plan: SavingPlanData) {
    if (plan.tasks.length === 0)
      return Err("Structure Error: Empty task not allowed");
    if (plan.new === "auto") return this.saveNewPlan(plan);
    if (plan.new === "current") return this.saveCurrentPlan(plan);

    const current = await this.loader.loadPlan();
    if (current.err) return current;

    const currentActivePos = await this.jj.changeId();
    if (currentActivePos.err) return currentActivePos;

    // Guard: Entries to remove must be empty
    const removed: (typeof plan.tasks)[number][] = [];
    for (const task of current.ok.tasks) {
      // Removed
      if (!plan.tasks.some((planTask) => planTask.task_key === task.task_key)) {
        const changedFiles = await this.jj.empty(task.task_key);
        if (changedFiles.err) return changedFiles;
        if (!changedFiles.ok)
          return Err("Safety Error: Cannot remove commit that has files");
        removed.push(task);
      }
    }

    // If trying to move non-existent task key
    if (
      plan.tasks.some(
        (planTask) =>
          !!planTask.task_key &&
          !current.ok.tasks.some((task) => task.task_key === planTask.task_key),
      )
    ) {
      return Err("Invocation Error: Cannot move non-existent task key");
    }

    // Create anchor for task reordering
    const currentHead = current.ok.tasks[0].task_key;
    const head = await this.jj.new({ before: currentHead, noEdit: true });
    if (head.err) return head;
    const anchorHead = head.ok.change;
    const tail = await this.jj.new({
      noEdit: true,
      after: anchorHead,
    });
    if (tail.err) return tail;
    const anchorTail = tail.ok.change;

    let active = anchorHead;

    // Handle tasks - task-only persistence
    for (const task of plan.tasks) {
      if (task.task_key) {
        const move = await this.jj.rebase.slideCommit({
          after: active,
          before: anchorTail,
          commit: task.task_key,
        });
        if (move.err) return move;
        const taskMsg = formatTask(plan.tag, task);
        if (taskMsg.err) return taskMsg;
        const update = await this.jj.description.replace(
          taskMsg.ok,
          task.task_key,
        );
        if (update.err) return update;
        active = task.task_key;
      } else {
        const create = await this.jj.new({
          after: active,
          before: anchorTail,
          noEdit: true,
        });
        if (create.err) return create;

        const taskMsg = formatTask(plan.tag, task);
        if (taskMsg.err) return taskMsg;
        const update = await this.jj.description.replace(
          taskMsg.ok,
          create.ok.change,
        );
        if (update.err) return update;
        active = create.ok.change;
      }
    }

    // Reposition head
    if (
      removed.some(
        (task) =>
          task.task_key === currentActivePos.ok ||
          task.task_key?.startsWith(currentActivePos.ok),
      )
    ) {
      // Current task was deleted, find next logical task to position at
      const remainingTasks = plan.tasks.filter((task) => task.task_key);

      if (remainingTasks.length > 0) {
        // Prefer incomplete tasks, then any task
        const nextTask =
          remainingTasks.find((task) => !task.completed) ??
          remainingTasks.at(0);
        if (typeof nextTask?.task_key !== "string")
          throw Error("Invariant violation");
        const moved = await this.jj.navigate.to(nextTask.task_key);
        if (moved.err) return moved;
      }
      // If no tasks remain, stay at current position
    } else {
      // Position at the last task
      if (plan.tasks.length > 0 && plan.tasks[plan.tasks.length - 1].task_key) {
        const moved = await this.jj.navigate.to(
          plan.tasks[plan.tasks.length - 1].task_key!,
        );
        if (moved.err) return moved;
      }
    }

    // Drop anchor
    const dropAnchorHead = await this.jj.abandon(anchorHead);
    if (dropAnchorHead.err) return dropAnchorHead;

    const dropAnchorTail = await this.jj.abandon(anchorTail);
    if (dropAnchorTail.err) return dropAnchorTail;

    // Drop removed commits
    for (const task of removed) {
      if (typeof task.task_key === "string")
        await this.jj.abandon(task.task_key);
    }

    return Ok(void 0);
  }
}
