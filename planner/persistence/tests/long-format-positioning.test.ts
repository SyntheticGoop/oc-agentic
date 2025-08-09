/**
 * Test for LONG format positioning behavior when creating new tasks.
 *
 * Expected behavior:
 * - When creating a new task in a LONG format plan, position should STAY at the current task
 * - When modifying an existing task in a LONG format plan, position should STAY at the current task
 * - This preserves the user's current working context during plan modifications
 */

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Jujutsu } from "../../../src/jujutsu";
import { Loader } from "../loader";
import { Saver, type SavingPlanData } from "../saver";

const MOCK_ENV_DIR = join(__dirname, "mock-env");

async function createTestRepo(name: string): Promise<string> {
  const repoPath = join(MOCK_ENV_DIR, name);
  await fs.mkdir(repoPath, { recursive: true });

  return new Promise((resolve, reject) => {
    const child = spawn("jj", ["git", "init"], {
      cwd: repoPath,
      stdio: "pipe",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(repoPath);
      } else {
        reject(new Error(`Failed to initialize jj repo: ${code}`));
      }
    });

    child.on("error", reject);
  });
}

async function cleanupTestRepo(repoPath: string): Promise<void> {
  await fs.rm(repoPath, { recursive: true, force: true });
}

describe("LONG Format Positioning Behavior", () => {
  let testRepoPath: string;
  let jj: ReturnType<(typeof Jujutsu)["cwd"]>;
  let loader: Loader;
  let saver: Saver;

  beforeEach(async () => {
    testRepoPath = await createTestRepo(`long-positioning-${Date.now()}`);
    jj = Jujutsu.cwd(testRepoPath);
    loader = new Loader(jj);
    saver = new Saver(jj, loader);
  });

  afterEach(async () => {
    await cleanupTestRepo(testRepoPath);
  });

  it("should stay at current task when creating new task in LONG format", async () => {
    // Step 1: Create initial LONG format plan with 2 tasks
    const initialPlan: SavingPlanData = {
      new: true,
      scope: "longtest",
      title: "long format positioning test",
      intent: "test positioning behavior in long format",
      objectives: ["verify end positioning"],
      constraints: [],
      tasks: [
        {
          task_key: undefined,
          type: "feat",
          scope: "longtest",
          title: "first task",
          intent: "first task intent",
          objectives: ["first objective"],
          constraints: [],
          completed: false,
        },
        {
          task_key: undefined,
          type: "fix",
          scope: "longtest",
          title: "second task",
          intent: "second task intent",
          objectives: ["second objective"],
          constraints: [],
          completed: false,
        },
      ],
    };

    const step1Result = await saver.savePlan(initialPlan);
    expect(step1Result.err).toBeUndefined();

    // Verify we're positioned at the end commit after initial creation
    const step1Desc = await jj.description.get();
    expect(step1Desc.err).toBeUndefined();
    expect(step1Desc.ok).toBeDefined();
    if (!step1Desc.ok) throw new Error("Failed to get description");

    // Should be positioned at end commit
    expect(step1Desc.ok).toContain("end(longtest)::");
    expect(step1Desc.ok).toContain("long format positioning test");

    // Step 2: Load the plan to get task keys
    const step1Load = await loader.loadPlan();
    expect(step1Load.err).toBeUndefined();
    expect(step1Load.ok).toBeDefined();
    if (!step1Load.ok) throw new Error("Failed to load plan");

    expect(step1Load.ok.tasks).toHaveLength(2);
    const firstTaskKey = step1Load.ok.tasks[0]?.task_key;
    const secondTaskKey = step1Load.ok.tasks[1]?.task_key;
    expect(firstTaskKey).toBeDefined();
    expect(secondTaskKey).toBeDefined();

    // Step 3: Navigate to the first task (move away from end)
    const navResult = await jj.navigate.to(firstTaskKey!);
    expect(navResult.err).toBeUndefined();

    // Verify we're now at the first task
    const step2Desc = await jj.description.get();
    expect(step2Desc.err).toBeUndefined();
    expect(step2Desc.ok).toBeDefined();
    if (!step2Desc.ok) throw new Error("Failed to get description");


    // Should be at first task, not end commit
    expect(step2Desc.ok).toContain("feat(longtest)::");
    expect(step2Desc.ok).toContain("first task");
    expect(step2Desc.ok).not.toContain("end(longtest)::");

    // Step 4: Add a third task to the existing LONG format plan
    const expandedPlan: SavingPlanData = {
      scope: "longtest",
      title: "long format positioning test",
      intent: "test positioning behavior in long format",
      objectives: ["verify end positioning"],
      constraints: [],
      tasks: [
        {
          task_key: firstTaskKey,
          type: "feat",
          scope: "longtest",
          title: "first task",
          intent: "first task intent",
          objectives: ["first objective"],
          constraints: [],
          completed: false,
        },
        {
          task_key: secondTaskKey,
          type: "fix",
          scope: "longtest",
          title: "second task",
          intent: "second task intent",
          objectives: ["second objective"],
          constraints: [],
          completed: false,
        },
        {
          task_key: undefined, // New task
          type: "refactor",
          scope: "longtest",
          title: "third task",
          intent: "third task intent",
          objectives: ["third objective"],
          constraints: [],
          completed: false,
        },
      ],
    };

    const step3Result = await saver.savePlan(expandedPlan);
    expect(step3Result.err).toBeUndefined();

    // Step 5: Verify we're still positioned at the first task (preserving current context)
    const step3Desc = await jj.description.get();
    expect(step3Desc.err).toBeUndefined();
    expect(step3Desc.ok).toBeDefined();
    if (!step3Desc.ok) throw new Error("Failed to get description");


    // Should still be positioned at the first task where we were before adding the third task
    expect(step3Desc.ok).toContain("feat(longtest)::");
    expect(step3Desc.ok).toContain("first task");
    expect(step3Desc.ok).not.toContain("end(longtest)::");
    expect(step3Desc.ok).not.toContain("third task");

    // Step 6: Verify the plan structure is correct
    const step3Load = await loader.loadPlan();
    expect(step3Load.err).toBeUndefined();
    expect(step3Load.ok).toBeDefined();
    if (!step3Load.ok) throw new Error("Failed to load plan");

    expect(step3Load.ok.tasks).toHaveLength(3);
    expect(step3Load.ok.tasks[0]?.title).toBe("first task");
    expect(step3Load.ok.tasks[1]?.title).toBe("second task");
    expect(step3Load.ok.tasks[2]?.title).toBe("third task");

    // Verify commit history structure
    const historyResult = await jj.history.linear();
    expect(historyResult.err).toBeUndefined();
    expect(historyResult.ok).toBeDefined();
    if (!historyResult.ok) throw new Error("Failed to get history");

    const allCommits = [
      ...historyResult.ok.history.reverse(),
      historyResult.ok.current,
      ...historyResult.ok.future,
    ];


    // Should have: begin -> first -> second -> third -> end (5 commits, empty commit reused)
    expect(allCommits).toHaveLength(5);
    expect(allCommits[0]?.message).toContain("begin(longtest)::");
    // Empty commit was reused as begin commit
    expect(allCommits[1]?.message).toContain("feat(longtest)::");
    expect(allCommits[1]?.message).toContain("first task");
    expect(allCommits[2]?.message).toContain("fix(longtest)::");
    expect(allCommits[2]?.message).toContain("second task");
    expect(allCommits[3]?.message).toContain("refactor(longtest)::");
    expect(allCommits[3]?.message).toContain("third task");
    expect(allCommits[4]?.message).toContain("end(longtest)::");
  });

  it("should stay at current task when modifying existing task in LONG format", async () => {
    // Step 1: Create initial LONG format plan
    const initialPlan: SavingPlanData = {
      new: true,
      scope: "modify",
      title: "task modification test",
      intent: "test positioning when modifying tasks",
      objectives: ["verify end positioning on modification"],
      constraints: [],
      tasks: [
        {
          task_key: undefined,
          type: "feat",
          scope: "modify",
          title: "original task",
          intent: "original intent",
          objectives: ["original objective"],
          constraints: [],
          completed: false,
        },
      ],
    };

    const step1Result = await saver.savePlan(initialPlan);
    expect(step1Result.err).toBeUndefined();

    // Step 2: Load and navigate to the task
    const step1Load = await loader.loadPlan();
    expect(step1Load.err).toBeUndefined();
    expect(step1Load.ok).toBeDefined();
    if (!step1Load.ok) throw new Error("Failed to load plan");

    const taskKey = step1Load.ok.tasks[0]?.task_key;
    expect(taskKey).toBeDefined();

    const navResult = await jj.navigate.to(taskKey!);
    expect(navResult.err).toBeUndefined();

    // Verify we're at the task
    const step2Desc = await jj.description.get();
    expect(step2Desc.err).toBeUndefined();
    expect(step2Desc.ok).toBeDefined();
    if (!step2Desc.ok) throw new Error("Failed to get description");

    expect(step2Desc.ok).toContain("feat(modify):");
    expect(step2Desc.ok).toContain("original task");

    // Step 3: Modify the task (change title and mark as completed)
    const modifiedPlan: SavingPlanData = {
      scope: "modify",
      title: "task modification test",
      intent: "test positioning when modifying tasks",
      objectives: ["verify end positioning on modification"],
      constraints: [],
      tasks: [
        {
          task_key: taskKey,
          type: "feat",
          scope: "modify",
          title: "modified task", // Changed title
          intent: "modified intent", // Changed intent
          objectives: ["modified objective"], // Changed objective
          constraints: [],
          completed: true, // Changed completion status
        },
      ],
    };

    const step3Result = await saver.savePlan(modifiedPlan);
    expect(step3Result.err).toBeUndefined();

    // Step 4: Verify we're still positioned at the same task (preserving current context)
    const step3Desc = await jj.description.get();
    expect(step3Desc.err).toBeUndefined();
    expect(step3Desc.ok).toBeDefined();
    if (!step3Desc.ok) throw new Error("Failed to get description");


    // Should still be at the same task where we were before modification
    expect(step3Desc.ok).toContain("feat(modify):");
    expect(step3Desc.ok).toContain("modified task"); // Content should be updated
    expect(step3Desc.ok).not.toContain("end(modify)::");
    expect(step3Desc.ok).not.toContain("original task"); // Old content should be gone

    // Step 5: Verify the task was actually modified
    const step3Load = await loader.loadPlan();
    expect(step3Load.err).toBeUndefined();
    expect(step3Load.ok).toBeDefined();
    if (!step3Load.ok) throw new Error("Failed to load plan");

    expect(step3Load.ok.tasks).toHaveLength(1);
    expect(step3Load.ok.tasks[0]?.title).toBe("modified task");
    expect(step3Load.ok.tasks[0]?.intent).toBe("modified intent");
    expect(step3Load.ok.tasks[0]?.objectives).toEqual(["modified objective"]);
    expect(step3Load.ok.tasks[0]?.completed).toBe(true);
  });
});
