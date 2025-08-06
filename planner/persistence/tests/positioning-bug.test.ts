/**
 * Focused test to reproduce the positioning bug scenario described by the user.
 * This test follows the exact steps:
 * 1. Create single plan
 * 2. Add 2 more tasks in a single save
 * 3. Move jj position to first task
 * 4. Update first task to be complete
 * 5. Move jj position to next task
 * 6. Update next task to be complete
 * 7. Move jj position to final task
 * 8. Update that to be complete
 * Throughout, assert that contents and position of all tasks are correct and within same tree.
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
  });
}

async function cleanupTestRepo(repoPath: string): Promise<void> {
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch (_error) {
    // Ignore cleanup errors
  }
}

describe("Positioning Bug Reproduction", () => {
  let testRepoPath: string;
  let jj: ReturnType<(typeof Jujutsu)["cwd"]>;
  let loader: Loader;
  let saver: Saver;

  beforeEach(async () => {
    testRepoPath = await createTestRepo(`positioning-bug-${Date.now()}`);
    jj = Jujutsu.cwd(testRepoPath);
    loader = new Loader(jj);
    saver = new Saver(jj, loader);
  });

  afterEach(async () => {
    await cleanupTestRepo(testRepoPath);
  });

  it("should reproduce positioning bug through complete workflow", async () => {
    // Step 1: Create single plan
    const singlePlan: SavingPlanData = {
      new: true,
      scope: "workflow",
      intent: "test complete workflow positioning",
      title: "workflow positioning test",
      objectives: ["track positioning throughout workflow"],
      constraints: [],
      tasks: [
        {
          type: "feat",
          scope: "workflow",
          title: "initial task",
          intent: "initial task intent",
          objectives: ["initial objective"],
          constraints: [],
          completed: false,
        },
      ],
    };

    const step1Result = await saver.savePlan(singlePlan);
    expect(step1Result.err).toBeUndefined();

    // Verify step 1 - should be SHORT format
    const step1Load = await loader.loadPlan();
    expect(step1Load.err).toBeUndefined();
    expect(step1Load.ok).toBeDefined();
    if (!step1Load.ok) throw new Error("Failed to load plan");

    expect(step1Load.ok.plan_key).toBeNull(); // SHORT format has no plan_key
    expect(step1Load.ok.tasks).toHaveLength(1);
    expect(step1Load.ok.tasks[0]).toBeDefined();
    const initialTaskKey = step1Load.ok.tasks[0].task_key;

    // Step 2: Add 2 more tasks in a single save (should transition to LONG format)
    const expandedPlan: SavingPlanData = {
      scope: "workflow",
      intent: "test complete workflow positioning",
      title: "workflow positioning test",
      objectives: ["track positioning throughout workflow"],
      constraints: [],
      tasks: [
        {
          task_key: initialTaskKey,
          type: "feat",
          scope: "workflow",
          title: "first task",
          intent: "first task intent",
          objectives: ["first objective"],
          constraints: [],
          completed: false,
        },
        {
          type: "fix",
          scope: "workflow",
          title: "second task",
          intent: "second task intent",
          objectives: ["second objective"],
          constraints: [],
          completed: false,
        },
        {
          type: "refactor",
          scope: "workflow",
          title: "third task",
          intent: "third task intent",
          objectives: ["third objective"],
          constraints: [],
          completed: false,
        },
      ],
    };

    const step2Result = await saver.savePlan(expandedPlan);
    expect(step2Result.err).toBeUndefined();

    // Verify step 2 - should be LONG format with 3 tasks
    const step2Load = await loader.loadPlan();
    expect(step2Load.err).toBeUndefined();
    expect(step2Load.ok).toBeDefined();
    if (!step2Load.ok) throw new Error("Failed to load plan");

    expect(step2Load.ok.plan_key).not.toBeNull(); // LONG format has plan_key
    expect(step2Load.ok.tasks).toHaveLength(3);
    expect(step2Load.ok.tasks[0]).toBeDefined();
    expect(step2Load.ok.tasks[1]).toBeDefined();
    expect(step2Load.ok.tasks[2]).toBeDefined();

    const firstTaskKey = step2Load.ok.tasks[0]?.task_key;
    const secondTaskKey = step2Load.ok.tasks[1]?.task_key;
    const thirdTaskKey = step2Load.ok.tasks[2]?.task_key;

    console.log("Original task keys from step 2:");
    console.log("First:", firstTaskKey);
    console.log("Second:", secondTaskKey);
    console.log("Third:", thirdTaskKey);
    // Verify all tasks are in the same tree structure
    const step2History = await jj.history.linear();
    expect(step2History.err).toBeUndefined();
    expect(step2History.ok).toBeDefined();
    if (!step2History.ok) throw new Error("Failed to get history");

    const step2Messages = [
      ...(step2History.ok as any).history.map((h: any) => h.message),
      (step2History.ok as any).current.message,
      ...(step2History.ok as any).future.map((h: any) => h.message),
    ];
    console.log("Step 2 commit history:");
    step2Messages.forEach((msg, i) => console.log(`${i + 1}: ${msg}`));

    expect(step2Messages.some((m) => m.includes("begin(workflow)"))).toBe(true);
    expect(step2Messages.some((m) => m.includes("end(workflow)"))).toBe(true);
    // Step 3: Move jj position to first task
    console.log("Moving to first task with key:", firstTaskKey);
    const moveToFirstResult = await jj.navigate.to(firstTaskKey);
    expect(moveToFirstResult.err).toBeUndefined();

    // Verify we're positioned at first task
    const currentDesc = await jj.description.get();
    expect(currentDesc.err).toBeUndefined();
    expect(currentDesc.ok).toBeDefined();
    if (!currentDesc.ok) throw new Error("Failed to get description");

    console.log("Current description after move:", currentDesc.ok);
    expect(currentDesc.ok).toContain("feat(workflow)::~");
    expect(currentDesc.ok).toContain("first task");

    // Check what the loader sees from this position
    const step3Load = await loader.loadPlan();
    console.log(
      "Step 3 load result:",
      step3Load.err
        ? `Error: ${step3Load.err}`
        : `Success: ${step3Load.ok?.tasks.length} tasks`,
    );
    if (step3Load.ok) {
      console.log(
        "Step 3 task keys:",
        step3Load.ok.tasks.map((t) => t.task_key),
      );
    } // Step 4: Update first task to be complete
    const step4Plan: SavingPlanData = {
      scope: "workflow",
      intent: "test complete workflow positioning",
      title: "workflow positioning test",
      objectives: ["track positioning throughout workflow"],
      constraints: [],
      tasks: [
        {
          task_key: firstTaskKey,
          type: "feat",
          scope: "workflow",
          title: "first task",
          intent: "first task intent",
          objectives: ["first objective"],
          constraints: [],
          completed: true, // Mark complete
        },
        {
          task_key: secondTaskKey,
          type: "fix",
          scope: "workflow",
          title: "second task",
          intent: "second task intent",
          objectives: ["second objective"],
          constraints: [],
          completed: false,
        },
        {
          task_key: thirdTaskKey,
          type: "refactor",
          scope: "workflow",
          title: "third task",
          intent: "third task intent",
          objectives: ["third objective"],
          constraints: [],
          completed: false,
        },
      ],
    };

    const step4Result = await saver.savePlan(step4Plan);
    expect(step4Result.err).toBeUndefined();

    // Verify step 4 - first task should be complete, still in LONG format
    const step4Load = await loader.loadPlan();
    expect(step4Load.err).toBeUndefined();
    expect(step4Load.ok).toBeDefined();
    if (!step4Load.ok) throw new Error("Failed to load plan");

    expect(step4Load.ok.plan_key).not.toBeNull(); // Still LONG format
    expect(step4Load.ok.tasks).toHaveLength(3);
    expect(step4Load.ok.tasks[0]).toBeDefined();
    expect(step4Load.ok.tasks[1]).toBeDefined();
    expect(step4Load.ok.tasks[2]).toBeDefined();
    expect(step4Load.ok.tasks[0]?.completed).toBe(true);
    expect(step4Load.ok.tasks[1]?.completed).toBe(false);
    expect(step4Load.ok.tasks[2]?.completed).toBe(false);
    // Step 5: Move jj position to next task (second task)
    const moveToSecondResult = await jj.navigate.to(secondTaskKey);
    expect(moveToSecondResult.err).toBeUndefined();

    // Verify we're positioned at second task
    const step5Desc = await jj.description.get();
    expect(step5Desc.err).toBeUndefined();
    expect(step5Desc.ok).toBeDefined();
    if (!step5Desc.ok) throw new Error("Failed to get description");

    expect(step5Desc.ok).toContain("fix(workflow)::~");
    expect(step5Desc.ok).toContain("second task");
    // Step 6: Update next task to be complete
    const step6Plan: SavingPlanData = {
      scope: "workflow",
      intent: "test complete workflow positioning",
      title: "workflow positioning test",
      objectives: ["track positioning throughout workflow"],
      constraints: [],
      tasks: [
        {
          task_key: firstTaskKey,
          type: "feat",
          scope: "workflow",
          title: "first task",
          intent: "first task intent",
          objectives: ["first objective"],
          constraints: [],
          completed: true,
        },
        {
          task_key: secondTaskKey,
          type: "fix",
          scope: "workflow",
          title: "second task",
          intent: "second task intent",
          objectives: ["second objective"],
          constraints: [],
          completed: true, // Mark complete
        },
        {
          task_key: thirdTaskKey,
          type: "refactor",
          scope: "workflow",
          title: "third task",
          intent: "third task intent",
          objectives: ["third objective"],
          constraints: [],
          completed: false,
        },
      ],
    };

    const step6Result = await saver.savePlan(step6Plan);
    expect(step6Result.err).toBeUndefined();

    // Verify step 6 - first two tasks complete, still in LONG format
    const step6Load = await loader.loadPlan();
    expect(step6Load.err).toBeUndefined();
    expect(step6Load.ok).toBeDefined();
    if (!step6Load.ok) throw new Error("Failed to load plan");

    expect(step6Load.ok.plan_key).not.toBeNull(); // Still LONG format
    expect(step6Load.ok.tasks).toHaveLength(3);
    expect(step6Load.ok.tasks[0]).toBeDefined();
    expect(step6Load.ok.tasks[1]).toBeDefined();
    expect(step6Load.ok.tasks[2]).toBeDefined();
    expect(step6Load.ok.tasks[0]?.completed).toBe(true);
    expect(step6Load.ok.tasks[1]?.completed).toBe(true);
    expect(step6Load.ok.tasks[2]?.completed).toBe(false);
    // Step 7: Move jj position to final task (third task)
    const moveToThirdResult = await jj.navigate.to(thirdTaskKey);
    expect(moveToThirdResult.err).toBeUndefined();

    // Verify we're positioned at third task
    const step7Desc = await jj.description.get();
    expect(step7Desc.err).toBeUndefined();
    expect(step7Desc.ok).toBeDefined();
    if (!step7Desc.ok) throw new Error("Failed to get description");

    expect(step7Desc.ok).toContain("refactor(workflow)::~");
    expect(step7Desc.ok).toContain("third task");
    // Step 8: Update final task to be complete
    const step8Plan: SavingPlanData = {
      scope: "workflow",
      intent: "test complete workflow positioning",
      title: "workflow positioning test",
      objectives: ["track positioning throughout workflow"],
      constraints: [],
      tasks: [
        {
          task_key: firstTaskKey,
          type: "feat",
          scope: "workflow",
          title: "first task",
          intent: "first task intent",
          objectives: ["first objective"],
          constraints: [],
          completed: true,
        },
        {
          task_key: secondTaskKey,
          type: "fix",
          scope: "workflow",
          title: "second task",
          intent: "second task intent",
          objectives: ["second objective"],
          constraints: [],
          completed: true,
        },
        {
          task_key: thirdTaskKey,
          type: "refactor",
          scope: "workflow",
          title: "third task",
          intent: "third task intent",
          objectives: ["third objective"],
          constraints: [],
          completed: true, // Mark complete
        },
      ],
    };

    const step8Result = await saver.savePlan(step8Plan);
    expect(step8Result.err).toBeUndefined();

    // FINAL VERIFICATION: All tasks complete, still in LONG format, all in same tree
    const finalLoad = await loader.loadPlan();
    expect(finalLoad.err).toBeUndefined();
    expect(finalLoad.ok).toBeDefined();
    if (!finalLoad.ok) throw new Error("Failed to load plan");

    expect(finalLoad.ok.plan_key).not.toBeNull(); // Still LONG format
    expect(finalLoad.ok.tasks).toHaveLength(3);
    expect(finalLoad.ok.tasks[0]).toBeDefined();
    expect(finalLoad.ok.tasks[1]).toBeDefined();
    expect(finalLoad.ok.tasks[2]).toBeDefined();
    expect(finalLoad.ok.tasks[0]?.completed).toBe(true);
    expect(finalLoad.ok.tasks[1]?.completed).toBe(true);
    expect(finalLoad.ok.tasks[2]?.completed).toBe(true);
    // CRITICAL: Verify all commits are still in the same tree structure
    const finalHistory = await jj.history.linear();
    expect(finalHistory.err).toBeUndefined();
    expect(finalHistory.ok).toBeDefined();
    if (!finalHistory.ok) throw new Error("Failed to get history");

    const allFinalMessages = [
      ...(finalHistory.ok as any).history.map((h: any) => h.message),
      (finalHistory.ok as any).current.message,
      ...(finalHistory.ok as any).future.map((h: any) => h.message),
    ];

    // Filter out empty commits (like initial repo commit)
    const finalMessages = allFinalMessages.filter(
      (msg: string) => msg.trim() !== "",
    );

    console.log("Final commit history:");
    finalMessages.forEach((msg, i) => console.log(`${i + 1}: ${msg}`));

    // Should have: begin, task1 (no ~), task2 (no ~), task3 (no ~), end (5 commits)
    expect(finalMessages).toHaveLength(5);
    expect(finalMessages.some((m) => m.includes("begin(workflow)"))).toBe(true);
    expect(finalMessages.some((m) => m.includes("end(workflow)"))).toBe(true);
    expect(
      finalMessages.some(
        (m) => m.includes("feat(workflow)::") && !m.includes("~"),
      ),
    ).toBe(true);
    expect(
      finalMessages.some(
        (m) => m.includes("fix(workflow)::") && !m.includes("~"),
      ),
    ).toBe(true);
    expect(
      finalMessages.some(
        (m) => m.includes("refactor(workflow)::") && !m.includes("~"),
      ),
    ).toBe(true);

    // Verify no orphaned commits or broken tree structure
    expect(finalMessages.filter((m) => m.includes("~"))).toHaveLength(0); // No incomplete tasks

    console.log("Final commit history:");
    finalMessages.forEach((msg, i) => console.log(`${i + 1}: ${msg}`));
  });
});
