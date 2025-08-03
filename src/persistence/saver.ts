import type { Jujutsu } from "../jujutsu";
import { Err, Ok } from "../result";
import {
  parseCommitBody,
  parseCommitHeader,
  type Loader,
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
  new?: boolean;
  scope: string | null;
  intent: string;
  title: string;
  objectives: string[];
  constraints: string[];
  tasks: [Task, ...Task[]];
};

function formatBegin(data: SavingPlanData) {
  data.title = data.title.trim();
  data.intent = data.intent.trim();
  const head = `begin${data.scope === null ? "" : `(${data.scope})`}: ${data.title}`;
  const parsed = parseCommitHeader(head);
  if (parsed.err) return parsed;
  return Ok(head);
}

function formatEnd(data: SavingPlanData) {
  const head = `end${data.scope === null ? "" : `(${data.scope})`}: ${data.title}`;
  const body = `${data.intent.trim().length === 0 ? "" : `\n\n${data.intent.trim()}`
    }${data.objectives.length === 0
      ? ""
      : `\n\n## Objectives\n${data.objectives.map((objective) => `- ${objective.trim()}`).join("\n")}`
    }${data.constraints.length === 0
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

function formatTask(
  data: SavingPlanData["tasks"][number],
  isMulti: "multi" | "single",
) {
  const head = `${data.type}${data.scope === null ? "" : `(${data.scope})`}${isMulti === "single" ? "::" : ":"}${data.completed ? "" : "~"} ${data.title.trim()}`;
  const body = `${data.intent.trim().length === 0 ? "" : `\n\n${data.intent.trim()}`
    }${data.objectives.length === 0
      ? ""
      : `\n\n## Objectives\n${data.objectives.map((objective) => `- ${objective.trim()}`).join("\n")}`
    }${data.constraints.length === 0
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
  ) { }

  private async saveNewPlan(plan: SavingPlanData) {
    if (plan.tasks.length === 0) return Err("empty task not allowed");

    // Find the end of any existing plan to anchor our new plan after it
    let anchorPoint: string | null = null;

    try {
      const currentPlan = await this.loader.loadPlan();
      if (currentPlan.ok) {
        // We're inside an existing plan, find the end of it
        if (currentPlan.ok.plan_key !== null) {
          // LONG format plan - anchor after the end commit
          anchorPoint = currentPlan.ok.plan_key[1];
        } else if (currentPlan.ok.tasks.length === 1) {
          // SHORT format plan - anchor after the single task commit
          anchorPoint = currentPlan.ok.tasks[0].task_key;
        }
      }
    } catch {
      // If loading fails, we're probably not in a plan, continue without anchoring
    }

    const isMulti = plan.tasks.length === 1 ? "single" : "multi";

    // For single task, create just one commit
    if (plan.tasks.length === 1) {
      const createOptions = anchorPoint
        ? { after: anchorPoint, noEdit: true }
        : { noEdit: true };
      const create = await this.jj.new(createOptions);
      if (create.err) return create;

      const taskMsg = formatTask(plan.tasks[0], isMulti);
      if (taskMsg.err) return taskMsg;

      const update = await this.jj.description.replace(
        taskMsg.ok,
        create.ok.change,
      );
      if (update.err) return update;

      // Position at the task commit
      const moved = await this.jj.navigate.to(create.ok.change);
      if (moved.err) return moved;

      return Ok(void 0);
    }

    // For multi-task, create begin/tasks/end structure
    let active: string;

    // Create begin commit
    const createBeginOptions = anchorPoint
      ? { after: anchorPoint, noEdit: true }
      : { noEdit: true };
    const createBegin = await this.jj.new(createBeginOptions);
    if (createBegin.err) return createBegin;

    const begin = formatBegin(plan);
    if (begin.err) return begin;

    const updateBegin = await this.jj.description.replace(
      begin.ok,
      createBegin.ok.change,
    );
    if (updateBegin.err) return updateBegin;
    active = createBegin.ok.change;

    // Create task commits - each anchored to the previous commit
    for (const task of plan.tasks) {
      const create = await this.jj.new({ after: active, noEdit: true });
      if (create.err) return create;

      const taskMsg = formatTask(task, isMulti);
      if (taskMsg.err) return taskMsg;

      const update = await this.jj.description.replace(
        taskMsg.ok,
        create.ok.change,
      );
      if (update.err) return update;
      active = create.ok.change;
    }

    // Create end commit - anchored to the last task commit
    const createEnd = await this.jj.new({ after: active, noEdit: true });
    if (createEnd.err) return createEnd;

    const endMsg = formatEnd(plan);
    if (endMsg.err) return endMsg;

    const updateEnd = await this.jj.description.replace(
      endMsg.ok,
      createEnd.ok.change,
    );
    if (updateEnd.err) return updateEnd;
    active = createEnd.ok.change;

    // Position at end commit
    const moved = await this.jj.navigate.to(active);
    if (moved.err) return moved;

    return Ok(void 0);
  }
  public async savePlan(plan: SavingPlanData) {
    if (plan.tasks.length === 0) return Err("empty task not allowed");
    if (plan.new === true) return this.saveNewPlan(plan);
    const current = await this.loader.loadPlan();
    if (current.err) return current;

    const currentActivePos = await this.jj.changeId();
    if (currentActivePos.err) return currentActivePos;

    // Guard: Existing start/end must have correct format
    if (current.ok.plan_key !== null) {
      const startDiff = await this.jj.empty(current.ok.plan_key[0]);
      if (startDiff.err) return startDiff;
      if (!startDiff.ok) return Err("Unexpected change in start diff");

      const endDiff = await this.jj.empty(current.ok.plan_key[1]);
      if (endDiff.err) return endDiff;
      if (!endDiff.ok) return Err("Unexpected change in start diff");
    }

    // Guard: Entries to remove must be empty
    const removed = [];
    for (const task of current.ok.tasks) {
      // Removed
      if (!plan.tasks.some((planTask) => planTask.task_key === task.task_key)) {
        const changedFiles = await this.jj.empty(task.task_key);
        if (changedFiles.err) return changedFiles;
        if (!changedFiles.ok) return Err("Cannot remove commit that has files");
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
      return Err("Cannot move non-existent task key");
    }

    // Create anchor
    const currentHead =
      current.ok.plan_key?.[0] ?? current.ok.tasks[0].task_key;
    const head = await this.jj.new({ before: currentHead, noEdit: true });
    if (head.err) return head;
    const anchorHead = head.ok.change;
    const tail = await this.jj.new({
      noEdit: true,
    });
    if (tail.err) return tail;
    const anchorTail = tail.ok.change;

    let active = anchorHead;
    // Handle before
    if (plan.tasks.length > 1) {
      if (current.ok.plan_key !== null) {
        const move = await this.jj.rebase.slideCommit({
          after: active,
          before: anchorTail,
          commit: current.ok.plan_key[0],
        });
        if (move.err) return move;

        const begin = formatBegin(plan);
        if (begin.err) return begin;
        const update = await this.jj.description.replace(
          begin.ok,
          current.ok.plan_key[0],
        );
        if (update.err) return update;
        active = current.ok.plan_key[0];
      } else {
        const create = await this.jj.new({
          after: active,
          before: anchorTail,
          noEdit: true,
        });
        if (create.err) return create;
        const begin = formatBegin(plan);
        if (begin.err) return begin;
        const update = await this.jj.description.replace(
          begin.ok,
          create.ok.change,
        );
        if (update.err) return update;
        active = create.ok.change;
      }
    }

    // Handle tasks
    const isMulti = plan.tasks.length === 1 ? "single" : "multi";

    for (const task of plan.tasks) {
      if (task.task_key) {
        const move = await this.jj.rebase.slideCommit({
          after: active,
          before: anchorTail,
          commit: task.task_key,
        });
        if (move.err) return move;
        const taskMsg = formatTask(task, isMulti);
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

        const taskMsg = formatTask(task, isMulti);
        if (taskMsg.err) return taskMsg;
        const update = await this.jj.description.replace(
          taskMsg.ok,
          create.ok.change,
        );
        if (update.err) return update;
        active = create.ok.change;
      }
    }

    // Handle after
    if (plan.tasks.length > 1) {
      if (current.ok.plan_key !== null) {
        const move = await this.jj.rebase.slideCommit({
          after: active,
          before: anchorTail,
          commit: current.ok.plan_key[1],
        });
        if (move.err) return move;

        const endMsg = formatEnd(plan);
        if (endMsg.err) return endMsg;
        const update = await this.jj.description.replace(
          endMsg.ok,
          current.ok.plan_key[1],
        );
        if (update.err) return update;
        active = current.ok.plan_key[1];
      } else {
        const create = await this.jj.new({
          after: active,
          before: anchorTail,
          noEdit: true,
        });
        if (create.err) return create;

        const endMsg = formatEnd(plan);
        if (endMsg.err) return endMsg;
        const update = await this.jj.description.replace(
          endMsg.ok,
          create.ok.change,
        );
        if (update.err) return update;
        active = create.ok.change;
      }
    }

    // Reposition head
    if (removed.some((task) => task.task_key === currentActivePos.ok)) {
      const moved = await this.jj.navigate.to(`${anchorHead}+`);
      if (moved.err) return moved;
    } else {
      // For single-task scenarios, ensure we're positioned at the task commit
      if (plan.tasks.length === 1 && plan.tasks[0].task_key) {
        const moved = await this.jj.navigate.to(plan.tasks[0].task_key);
        if (moved.err) return moved;
      }
    }

    // Drop anchor
    const dropAnchorHead = await this.jj.abandon(anchorHead);
    if (dropAnchorHead.err) return dropAnchorHead;

    const dropAnchorTail = await this.jj.abandon(anchorTail);
    if (dropAnchorTail.err) return dropAnchorTail;

    // Ensure current commit is positioned correctly
    if (plan.tasks.length === 1) {
      // For single-task scenarios, position at the task commit
      // Use the active commit, which should be the task commit
      const moved = await this.jj.navigate.to(active);
      if (moved.err) return moved;
    } else {
      // For multi-task scenarios, position at the end commit
      // Use the active commit, which should be the last commit in the sequence
      const moved = await this.jj.navigate.to(active);
      if (moved.err) return moved;
    }

    // Drop commits
    for (const task of removed) {
      await this.jj.abandon(task.task_key);
    }

    return Ok(void 0);
  }
}
