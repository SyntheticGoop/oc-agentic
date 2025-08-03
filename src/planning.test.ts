import { describe, expect, it } from "vitest";
import { PlanningLibrary } from "./planning";

describe("PlanningLibrary", () => {
	describe("constructor", () => {
		it("should create instance with plan_key", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});
			expect(planner).toBeInstanceOf(PlanningLibrary);
		});
	});

	describe("update_plan", () => {
		it("should update plan fields", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			const result = planner.update_plan({
				intent: "Build user auth",
				objectives: ["secure login", "password reset"],
				constraints: ["use OAuth"],
			});

			expect(result.err).toBeUndefined();

			const planResult = planner.get_plan();
			if (planResult.ok) {
				expect(planResult.ok.intent).toBe("Build user auth");
				expect(planResult.ok.objectives).toEqual([
					"secure login",
					"password reset",
				]);
				expect(planResult.ok.constraints).toEqual(["use OAuth"]);
			}
		});

		it("should update partial plan fields", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.update_plan({ intent: "Initial intent" });
			planner.update_plan({ objectives: ["obj1", "obj2"] });

			const planResult = planner.get_plan();
			if (planResult.ok) {
				expect(planResult.ok.intent).toBe("Initial intent");
				expect(planResult.ok.objectives).toEqual(["obj1", "obj2"]);
				expect(planResult.ok.constraints).toBeUndefined();
			}
		});
	});

	describe("add_task", () => {
		it("should add task with provided key", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			const result = planner.add_task({
				task_key: "setup",
				intent: "Configure auth provider",
				objectives: ["create OAuth app"],
				constraints: ["must use Google"],
			});

			expect(result.ok).toBe("setup");

			const planResult = planner.get_plan();
			if (planResult.ok) {
				expect(planResult.ok.tasks).toHaveLength(1);
				expect(planResult.ok.tasks[0].task_key).toBe("setup");
				expect(planResult.ok.tasks[0].intent).toBe("Configure auth provider");
				expect(planResult.ok.tasks[0].completed).toBe(false);
			}
		});

		it("should return error for duplicate task_key", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.add_task({ task_key: "setup" });
			const result = planner.add_task({ task_key: "setup" });

			expect(result.err).toBe("task_key_exists");
		});
	});

	describe("update_task", () => {
		it("should update existing task", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.add_task({ task_key: "setup", intent: "Initial intent" });

			const result = planner.update_task({
				task_key: "setup",
				intent: "Updated intent",
				objectives: ["new objective"],
			});

			expect(result.err).toBeUndefined();

			const taskResult = planner.get_task({ task_key: "setup" });
			if (taskResult.ok) {
				expect(taskResult.ok.intent).toBe("Updated intent");
				expect(taskResult.ok.objectives).toEqual(["new objective"]);
			}
		});

		it("should return error for non-existent task", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			const result = planner.update_task({
				task_key: "nonexistent",
				intent: "Some intent",
			});

			expect(result.err).toBe("task_not_found");
		});
	});

	describe("remove_task", () => {
		it("should remove existing task", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.add_task({ task_key: "setup" });
			planner.add_task({ task_key: "deploy" });

			const result = planner.remove_task({ task_key: "setup" });

			expect(result.err).toBeUndefined();

			const planResult = planner.get_plan();
			if (planResult.ok) {
				expect(planResult.ok.tasks).toHaveLength(1);
				expect(planResult.ok.tasks[0].task_key).toBe("deploy");
			}
		});

		it("should return error for non-existent task", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			const result = planner.remove_task({ task_key: "nonexistent" });

			expect(result.err).toBe("task_not_found");
		});
	});

	describe("mark_task_complete", () => {
		it("should mark task as complete", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.add_task({ task_key: "setup" });

			const result = planner.mark_task_complete({
				task_key: "setup",
				completed: true,
			});

			expect(result.err).toBeUndefined();

			const statusResult = planner.get_task_status({ task_key: "setup" });
			expect(statusResult.ok).toBe(true);
		});

		it("should mark task as incomplete", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.add_task({ task_key: "setup" });
			planner.mark_task_complete({ task_key: "setup", completed: true });

			const result = planner.mark_task_complete({
				task_key: "setup",
				completed: false,
			});

			expect(result.err).toBeUndefined();

			const statusResult = planner.get_task_status({ task_key: "setup" });
			expect(statusResult.ok).toBe(false);
		});

		it("should return error for non-existent task", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			const result = planner.mark_task_complete({
				task_key: "nonexistent",
				completed: true,
			});

			expect(result.err).toBe("task_not_found");
		});
	});

	describe("get_task_status", () => {
		it("should return task completion status", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.add_task({ task_key: "setup" });

			const result = planner.get_task_status({ task_key: "setup" });
			expect(result.ok).toBe(false);
		});

		it("should return error for non-existent task", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			const result = planner.get_task_status({ task_key: "nonexistent" });

			expect(result.err).toBe("task_not_found");
		});
	});

	describe("get_plan", () => {
		it("should return complete plan structure", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.update_plan({
				intent: "Build auth",
				objectives: ["login", "logout"],
				constraints: ["secure"],
			});
			planner.add_task({ task_key: "setup", intent: "Setup task" });

			const result = planner.get_plan();

			expect(result.err).toBeUndefined();
			if (result.ok) {
				expect(result.ok.plan_key).toEqual(["project-x", "phase-1"]);
				expect(result.ok.intent).toBe("Build auth");
				expect(result.ok.objectives).toEqual(["login", "logout"]);
				expect(result.ok.constraints).toEqual(["secure"]);
				expect(result.ok.tasks).toHaveLength(1);
				expect(result.ok.tasks[0].task_key).toBe("setup");
			}
		});
	});

	describe("get_task", () => {
		it("should return specific task", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.add_task({
				task_key: "setup",
				intent: "Setup task",
				objectives: ["obj1"],
				constraints: ["constraint1"],
			});

			const result = planner.get_task({ task_key: "setup" });

			expect(result.err).toBeUndefined();
			if (result.ok) {
				expect(result.ok.task_key).toBe("setup");
				expect(result.ok.intent).toBe("Setup task");
				expect(result.ok.objectives).toEqual(["obj1"]);
				expect(result.ok.constraints).toEqual(["constraint1"]);
				expect(result.ok.completed).toBe(false);
			}
		});

		it("should return error for non-existent task", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			const result = planner.get_task({ task_key: "nonexistent" });

			expect(result.err).toBe("task_not_found");
		});
	});

	describe("validate_plan_complete", () => {
		it("should validate complete plan", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.update_plan({
				intent: "Build auth",
				objectives: ["login"],
				constraints: ["secure"],
			});
			planner.add_task({
				task_key: "setup",
				intent: "Setup task",
				objectives: ["obj1"],
				constraints: ["constraint1"],
			});

			const result = planner.validate_plan_complete();

			expect(result.err).toBeUndefined();
		});

		it("should return errors for incomplete plan", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			const result = planner.validate_plan_complete();

			expect(result.err).toBe("validation_failed");
			if (result.err && result.meta) {
				expect(result.meta).toContain("Plan intent is required");
				expect(result.meta).toContain("Plan objectives are required");
				expect(result.meta).toContain("Plan constraints are required");
				expect(result.meta).toContain("At least one task is required");
			}
		});

		it("should return errors for incomplete tasks", () => {
			const planner = new PlanningLibrary({
				plan_key: ["project-x", "phase-1"],
			});

			planner.update_plan({
				intent: "Build auth",
				objectives: ["login"],
				constraints: ["secure"],
			});
			planner.add_task({ task_key: "setup" }); // Missing required fields

			const result = planner.validate_plan_complete();

			expect(result.err).toBe("validation_failed");
			if (result.err && result.meta) {
				expect(result.meta).toContain("Task 'setup' intent is required");
				expect(result.meta).toContain("Task 'setup' objectives are required");
				expect(result.meta).toContain("Task 'setup' constraints are required");
			}
		});
	});
});
