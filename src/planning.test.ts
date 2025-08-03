import { describe, expect, it } from "vitest";
import type { PlanData, PlanPersistence } from "./persistence/persistence";
import { PlanningLibrary } from "./planning";
import { Ok } from "./result";

// Mock persistence for testing
class MockPersistence implements PlanPersistence {
	type = "mock" as const;
	private data: PlanData = { tasks: [] };

	async load() {
		return Ok(structuredClone(this.data));
	}

	async save(plan: PlanData) {
		this.data = structuredClone(plan);
		return Ok(undefined);
	}

	async beginPlan(scope: string, title: string) {
		return Ok(undefined);
	}

	async endPlan(scope: string, title: string, planData: PlanData) {
		this.data = structuredClone(planData);
		return Ok(undefined);
	}

	async createShortPlan(
		commitType: string,
		scope: string,
		title: string,
		planData: PlanData,
		completed: boolean,
	) {
		this.data = structuredClone(planData);
		return Ok(undefined);
	}

	async createTask(
		commitType: string,
		scope: string,
		title: string,
		taskData: Partial<PlanData>,
		completed: boolean,
	) {
		// Generate a mock commit hash
		const mockHash = Math.random().toString(36).substring(2, 15);
		return Ok(mockHash);
	}
}

describe("PlanningLibrary", () => {
	describe("constructor", () => {
		it("should create instance", () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});
			expect(planner).toBeInstanceOf(PlanningLibrary);
		});
	});

	describe("update_plan", () => {
		it("should update plan fields", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			const result = await planner.update_plan({
				intent: "Build user auth",
				objectives: ["secure login", "password reset"],
				constraints: ["use OAuth"],
			});

			expect(result.err).toBeUndefined();

			const planResult = await planner.get_plan();
			if (planResult.ok) {
				expect(planResult.ok.intent).toBe("Build user auth");
				expect(planResult.ok.objectives).toEqual([
					"secure login",
					"password reset",
				]);
				expect(planResult.ok.constraints).toEqual(["use OAuth"]);
			}
		});

		it("should update partial plan fields", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.update_plan({ intent: "Initial intent" });
			await planner.update_plan({ objectives: ["obj1", "obj2"] });

			const planResult = await planner.get_plan();
			if (planResult.ok) {
				expect(planResult.ok.intent).toBe("Initial intent");
				expect(planResult.ok.objectives).toEqual(["obj1", "obj2"]);
				expect(planResult.ok.constraints).toBeUndefined();
			}
		});
	});

	describe("add_task", () => {
		it("should add task with provided key", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			const result = await planner.add_task({
				task_key: "setup",
				intent: "Setup project",
				objectives: ["create repo", "setup CI"],
				constraints: ["use GitHub"],
			});

			expect(result.ok).toBe("setup");

			const planResult = await planner.get_plan();
			if (planResult.ok) {
				expect(planResult.ok.tasks).toHaveLength(1);
				expect(planResult.ok.tasks[0].task_key).toBe("setup");
				expect(planResult.ok.tasks[0].intent).toBe("Setup project");
				expect(planResult.ok.tasks[0].objectives).toEqual([
					"create repo",
					"setup CI",
				]);
				expect(planResult.ok.tasks[0].constraints).toEqual(["use GitHub"]);
			}
		});

		it("should return error for duplicate task_key", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.add_task({ task_key: "setup" });
			const result = await planner.add_task({ task_key: "setup" });

			expect(result.err).toBe("task_key_exists");
		});
	});

	describe("update_task", () => {
		it("should update existing task", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.add_task({
				task_key: "setup",
				intent: "Initial setup",
			});

			const result = await planner.update_task({
				task_key: "setup",
				intent: "Updated setup",
				objectives: ["new objective"],
			});

			expect(result.err).toBeUndefined();

			const taskResult = await planner.get_task({ task_key: "setup" });
			if (taskResult.ok) {
				expect(taskResult.ok.intent).toBe("Updated setup");
				expect(taskResult.ok.objectives).toEqual(["new objective"]);
			}
		});

		it("should return error for non-existent task", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			const result = await planner.update_task({
				task_key: "nonexistent",
				intent: "Some intent",
			});

			expect(result.err).toBe("task_not_found");
		});
	});

	describe("remove_task", () => {
		it("should remove existing task", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.add_task({ task_key: "setup" });
			const result = await planner.remove_task({ task_key: "setup" });

			expect(result.err).toBeUndefined();

			const planResult = await planner.get_plan();
			if (planResult.ok) {
				expect(planResult.ok.tasks).toHaveLength(0);
			}
		});

		it("should return error for non-existent task", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			const result = await planner.remove_task({ task_key: "nonexistent" });

			expect(result.err).toBe("task_not_found");
		});
	});

	describe("mark_task_complete", () => {
		it("should mark task as complete", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.add_task({ task_key: "setup" });
			const result = await planner.mark_task_complete({
				task_key: "setup",
				completed: true,
			});

			expect(result.err).toBeUndefined();

			const statusResult = await planner.get_task_status({ task_key: "setup" });
			expect(statusResult.ok).toBe(true);
		});

		it("should mark task as incomplete", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.add_task({ task_key: "setup" });
			await planner.mark_task_complete({ task_key: "setup", completed: true });
			const result = await planner.mark_task_complete({
				task_key: "setup",
				completed: false,
			});

			expect(result.err).toBeUndefined();

			const statusResult = await planner.get_task_status({ task_key: "setup" });
			expect(statusResult.ok).toBe(false);
		});

		it("should return error for non-existent task", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			const result = await planner.mark_task_complete({
				task_key: "nonexistent",
				completed: true,
			});

			expect(result.err).toBe("task_not_found");
		});
	});

	describe("get_task_status", () => {
		it("should return task completion status", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.add_task({ task_key: "setup" });

			const result = await planner.get_task_status({ task_key: "setup" });
			expect(result.ok).toBe(false);
		});

		it("should return error for non-existent task", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			const result = await planner.get_task_status({ task_key: "nonexistent" });

			expect(result.err).toBe("task_not_found");
		});
	});

	describe("get_plan", () => {
		it("should return complete plan structure", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.update_plan({
				intent: "Build app",
				objectives: ["obj1"],
				constraints: ["const1"],
			});
			await planner.add_task({ task_key: "setup" });

			const result = await planner.get_plan();

			expect(result.err).toBeUndefined();
			if (result.ok) {
				expect(result.ok.intent).toBe("Build app");
				expect(result.ok.objectives).toEqual(["obj1"]);
				expect(result.ok.constraints).toEqual(["const1"]);
				expect(result.ok.tasks).toHaveLength(1);
				expect(result.ok.tasks[0].task_key).toBe("setup");
			}
		});
	});

	describe("get_task", () => {
		it("should return specific task", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.add_task({
				task_key: "setup",
				intent: "Setup project",
				objectives: ["obj1"],
				constraints: ["const1"],
			});

			const result = await planner.get_task({ task_key: "setup" });

			expect(result.err).toBeUndefined();
			if (result.ok) {
				expect(result.ok.task_key).toBe("setup");
				expect(result.ok.intent).toBe("Setup project");
				expect(result.ok.objectives).toEqual(["obj1"]);
				expect(result.ok.constraints).toEqual(["const1"]);
				expect(result.ok.completed).toBe(false);
			}
		});

		it("should return error for non-existent task", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			const result = await planner.get_task({ task_key: "nonexistent" });

			expect(result.err).toBe("task_not_found");
		});
	});

	describe("validate_plan_complete", () => {
		it("should validate complete plan", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.update_plan({
				intent: "Build app",
				objectives: ["obj1"],
				constraints: ["const1"],
			});
			await planner.add_task({
				task_key: "setup",
				intent: "Setup",
				objectives: ["obj1"],
				constraints: ["const1"],
			});

			const result = await planner.validate_plan_complete();

			expect(result.err).toBeUndefined();
		});

		it("should return errors for incomplete plan", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			const result = await planner.validate_plan_complete();

			expect(result.err).toBe("validation_failed");
			if (result.err && result.meta) {
				expect(result.meta).toContain("Plan intent is required");
				expect(result.meta).toContain("Plan objectives are required");
				expect(result.meta).toContain("Plan constraints are required");
				expect(result.meta).toContain("At least one task is required");
			}
		});

		it("should return errors for incomplete tasks", async () => {
			const planner = new PlanningLibrary({
				persistence: new MockPersistence(),
			});

			await planner.update_plan({
				intent: "Build app",
				objectives: ["obj1"],
				constraints: ["const1"],
			});
			await planner.add_task({ task_key: "setup" });

			const result = await planner.validate_plan_complete();

			expect(result.err).toBe("validation_failed");
			if (result.err && result.meta) {
				expect(result.meta).toContain("Task 'setup' intent is required");
				expect(result.meta).toContain("Task 'setup' objectives are required");
				expect(result.meta).toContain("Task 'setup' constraints are required");
			}
		});
	});
});
