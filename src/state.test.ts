import { describe, expect, it } from "vitest";
import {
	deriveAlignmentCheck,
	deriveNextActions,
	derivePlanState,
	deriveToolResponse,
} from "./state.js";

describe("derivePlanState", () => {
	describe("uninitialized state", () => {
		it("should detect empty commit", () => {
			const state = derivePlanState("");
			expect(state).toEqual({
				phase: "uninitialized",
				has_goal: false,
				has_description: false,
				has_constraints: false,
				has_tasks: false,
				current_task_id: undefined,
				total_tasks: 0,
				completed_tasks: 0,
			});
		});

		it("should detect whitespace-only commit", () => {
			const state = derivePlanState("   \n\n  ");
			expect(state.phase).toBe("uninitialized");
			expect(state.has_goal).toBe(false);
		});

		it("should detect malformed commit", () => {
			const malformed = "invalid header format\n\nsome description";
			const state = derivePlanState(malformed);
			expect(state.phase).toBe("uninitialized");
			expect(state.has_goal).toBe(false);
		});

		it("should handle ParseError exceptions", () => {
			// Test various malformed commits that throw ParseError
			const malformedCommits = [
				"invalid: header",
				"feat: test\n\nConstraints:\n- Invalid prefix: test",
				"feat: test\n\nTasks [ ]:\n- [y] invalid checkbox",
			];

			for (const commit of malformedCommits) {
				const state = derivePlanState(commit);
				expect(state.phase).toBe("uninitialized");
				expect(state.has_goal).toBe(false);
			}
		});
	});

	describe("planning phase", () => {
		it("should detect basic planning state", () => {
			const commit = "feat: test feature\n\nBasic description of the feature.";
			const state = derivePlanState(commit);

			expect(state.phase).toBe("planning");
			expect(state.has_goal).toBe(true);
			expect(state.has_description).toBe(true);
			expect(state.has_constraints).toBe(false);
			expect(state.has_tasks).toBe(false);
			expect(state.total_tasks).toBe(0);
		});

		it("should detect planning with constraints", () => {
			const commit = `feat: test feature

Description here.

Constraints:
- Do not: break existing functionality`;

			const state = derivePlanState(commit);
			expect(state.phase).toBe("planning");
			expect(state.has_constraints).toBe(true);
			expect(state.has_tasks).toBe(false);
		});

		it("should detect planning with tasks but none started", () => {
			const commit = `feat: test feature

Description here.

Tasks [ ]:
- [ ] Task 1: first task
- [ ] Task 2: second task`;

			const state = derivePlanState(commit);
			expect(state.phase).toBe("planning");
			expect(state.has_tasks).toBe(true);
			expect(state.total_tasks).toBe(2);
			expect(state.completed_tasks).toBe(0);
			expect(state.current_task_id).toBe("task-1");
		});
	});

	describe("executing phase", () => {
		it("should detect executing with some tasks complete", () => {
			const commit = `feat: test feature

Description here.

Tasks [ ]:
- [x] Task 1: completed task
- [ ] Task 2: incomplete task
- [ ] Task 3: another incomplete task`;

			const state = derivePlanState(commit);
			expect(state.phase).toBe("executing");
			expect(state.total_tasks).toBe(3);
			expect(state.completed_tasks).toBe(1);
			expect(state.current_task_id).toBe("task-2");
		});

		it("should detect executing with nested tasks", () => {
			const commit = `feat: test feature

Description here.

Tasks [ ]:
- [x] Parent task: completed
  - [x] Child 1: done
  - [x] Child 2: done
- [ ] Another parent: incomplete
  - [ ] Child 3: not started`;

			const state = derivePlanState(commit);
			expect(state.phase).toBe("executing");
			expect(state.total_tasks).toBe(5);
			expect(state.completed_tasks).toBe(3);
			expect(state.current_task_id).toBe("another-parent");
		});
	});

	describe("complete phase", () => {
		it("should detect complete state", () => {
			const commit = `feat: test feature

Description here.

Tasks [X]:
- [x] Task 1: completed
- [x] Task 2: also completed`;

			const state = derivePlanState(commit);
			expect(state.phase).toBe("complete");
			expect(state.total_tasks).toBe(2);
			expect(state.completed_tasks).toBe(2);
			expect(state.current_task_id).toBeUndefined();
		});

		it("should detect complete with nested tasks", () => {
			const commit = `feat: test feature

Description here.

Tasks [X]:
- [x] Parent task: completed
  - [x] Child 1: done
  - [x] Child 2: done`;

			const state = derivePlanState(commit);
			expect(state.phase).toBe("complete");
			expect(state.total_tasks).toBe(3);
			expect(state.completed_tasks).toBe(3);
		});
	});

	describe("edge cases", () => {
		it("should handle constraints: none", () => {
			const commit = `feat: test

Description.

Constraints: none

Tasks [ ]:
- [ ] Task: details`;

			const state = derivePlanState(commit);
			expect(state.has_constraints).toBe(false); // "none" means no constraints
			expect(state.has_tasks).toBe(true);
		});

		it("should handle empty description", () => {
			const commit = "feat: test feature";
			const state = derivePlanState(commit);
			expect(state.has_description).toBe(false);
			expect(state.phase).toBe("planning");
		});

		it("should find current task in deep nesting", () => {
			const commit = `feat: test

Description.

Tasks [ ]:
- [x] Level 1: done
  - [x] Level 2a: done
  - [ ] Level 2b: incomplete
    - [ ] Level 3: not started`;

			const state = derivePlanState(commit);
			expect(state.current_task_id).toBe("level-2b");
		});

		it("should return undefined when all tasks complete but header not [X]", () => {
			const commit = `feat: test

Description.

Tasks [ ]:
- [x] Task 1: done
- [x] Task 2: done`;

			const state = derivePlanState(commit);
			expect(state.current_task_id).toBeUndefined();
			expect(state.phase).toBe("executing"); // Has completed tasks but not marked complete
		});

		it("should find current task in complex nested structure", () => {
			const commit = `feat: test

Description.

Tasks [ ]:
- [x] Parent 1: done
  - [x] Child 1a: done
  - [x] Child 1b: done
- [x] Parent 2: done  
  - [x] Child 2a: done
- [ ] Parent 3: incomplete
  - [x] Child 3a: done
  - [ ] Child 3b: incomplete
    - [ ] Grandchild: not started`;

			const state = derivePlanState(commit);
			expect(state.current_task_id).toBe("parent-3");
			// Count: Parent1(x) + Child1a(x) + Child1b(x) + Parent2(x) + Child2a(x) + Parent3( ) + Child3a(x) + Child3b( ) + Grandchild( ) = 9 total
			// Completed: Parent1, Child1a, Child1b, Parent2, Child2a, Child3a = 6 completed
			expect(state.total_tasks).toBe(9);
			expect(state.completed_tasks).toBe(6);
		});

		it("should handle all tasks completed in nested structure", () => {
			const commit = `feat: test

Description.

Tasks [ ]:
- [x] Parent: done
  - [x] Child 1: done
  - [x] Child 2: done
    - [x] Grandchild: done`;

			const state = derivePlanState(commit);
			expect(state.current_task_id).toBeUndefined();
			expect(state.total_tasks).toBe(4);
			expect(state.completed_tasks).toBe(4);
			expect(state.phase).toBe("executing"); // Not marked [X] yet
		});

		it("should handle empty tasks array", () => {
			const commit = `feat: test

Description.

Tasks [ ]:`;

			const state = derivePlanState(commit);
			expect(state.has_tasks).toBe(false);
			expect(state.total_tasks).toBe(0);
			expect(state.current_task_id).toBeUndefined();
			expect(state.phase).toBe("planning");
		});
	});
});

describe("deriveNextActions", () => {
	describe("uninitialized state", () => {
		it("should recommend start_planning", () => {
			const state = derivePlanState("");
			const actions = deriveNextActions(state);

			expect(actions.recommended).toContain("start_planning");
			expect(actions.available).toContain("start_planning");
			expect(actions.blocked).toContain("mark_task");
			expect(actions.blocked).toContain("finish_job");
		});
	});

	describe("planning state", () => {
		it("should recommend description when missing", () => {
			const state = derivePlanState("feat: test");
			const actions = deriveNextActions(state);

			expect(actions.recommended).toContain("update_description");
			expect(actions.recommended).toContain("set_tasks");
			expect(actions.available).toContain("update_goal");
		});

		it("should recommend mark_task when tasks exist but none started", () => {
			const commit = `feat: test

Description.

Tasks [ ]:
- [ ] Task 1: details`;

			const state = derivePlanState(commit);
			const actions = deriveNextActions(state);

			expect(actions.recommended).toContain("mark_task");
			expect(actions.available).toContain("mark_task");
			expect(actions.blocked).toContain("finish_job");
		});
	});

	describe("executing state", () => {
		it("should not recommend specific actions during execution", () => {
			const commit = `feat: test

Description.

Tasks [ ]:
- [x] Task 1: done
- [ ] Task 2: in progress`;

			const state = derivePlanState(commit);
			const actions = deriveNextActions(state);

			expect(actions.recommended).toHaveLength(0);
			expect(actions.available).toContain("mark_task");
			expect(actions.blocked).toContain("finish_job");
		});
	});

	describe("ready for completion", () => {
		it("should recommend finish_job when all tasks complete", () => {
			const commit = `feat: test

Description.

Tasks [ ]:
- [x] Task 1: done
- [x] Task 2: done`;

			const state = derivePlanState(commit);
			const actions = deriveNextActions(state);

			expect(actions.recommended).toContain("finish_job");
			expect(actions.available).toContain("finish_job");
		});

		it("should recommend finish_job for nested tasks all complete", () => {
			const commit = `feat: test

Description.

Tasks [ ]:
- [x] Parent: done
  - [x] Child 1: done
  - [x] Child 2: done`;

			const state = derivePlanState(commit);
			const actions = deriveNextActions(state);

			expect(actions.recommended).toContain("finish_job");
			expect(actions.available).toContain("finish_job");
			expect(actions.blocked).not.toContain("finish_job");
		});
	});
	describe("complete state", () => {
		it("should allow unfinish_job", () => {
			const commit = `feat: test

Description.

Tasks [X]:
- [x] Task 1: done
- [x] Task 2: done`;

			const state = derivePlanState(commit);
			const actions = deriveNextActions(state);

			expect(actions.available).toContain("unfinish_job");
		});

		it("should not recommend any actions in complete state", () => {
			const commit = `feat: test

Description.

Tasks [X]:
- [x] Task 1: done
- [x] Task 2: done`;

			const state = derivePlanState(commit);
			const actions = deriveNextActions(state);

			// Complete state should not recommend finish_job since it's already complete
			expect(actions.recommended).not.toContain("finish_job");
			expect(actions.available).toContain("unfinish_job");
		});
	});
	describe("always available actions", () => {
		it("should always include get_plan and verify_plan", () => {
			const states = [
				derivePlanState(""),
				derivePlanState("feat: test"),
				derivePlanState("feat: test\n\nTasks [X]:\n- [x] done"),
			];

			for (const state of states) {
				const actions = deriveNextActions(state);
				expect(actions.available).toContain("get_plan");
				expect(actions.available).toContain("verify_plan");
			}
		});
	});

	describe("edge cases and boundary conditions", () => {
		it("should handle state with no tasks but has_tasks false", () => {
			const state = derivePlanState("feat: test\n\nDescription only.");
			const actions = deriveNextActions(state);

			expect(actions.blocked).toContain("mark_task");
			expect(actions.blocked).toContain("finish_job");
			expect(actions.recommended).toContain("set_tasks");
		});

		it("should handle executing state with partial completion", () => {
			const commit = `feat: test

Description.

Tasks [ ]:
- [x] Task 1: done
- [ ] Task 2: incomplete
- [ ] Task 3: not started`;

			const state = derivePlanState(commit);
			const actions = deriveNextActions(state);

			expect(state.phase).toBe("executing");
			expect(actions.recommended).toHaveLength(0); // No specific recommendations during execution
			expect(actions.available).toContain("mark_task");
			expect(actions.blocked).toContain("finish_job");
		});

		it("should handle planning state with description but no tasks", () => {
			const commit = `feat: test

This is a description without any tasks yet.`;

			const state = derivePlanState(commit);
			const actions = deriveNextActions(state);

			expect(state.phase).toBe("planning");
			expect(actions.recommended).toContain("set_tasks");
			expect(actions.recommended).not.toContain("update_description");
		});

		it("should handle state transitions correctly", () => {
			// Planning -> Executing -> Complete
			const planningCommit = "feat: test\n\nTasks [ ]:\n- [ ] Task: details";
			const executingCommit =
				"feat: test\n\nTasks [ ]:\n- [x] Task: details\n- [ ] Task 2: more";
			const completeCommit = "feat: test\n\nTasks [X]:\n- [x] Task: details";

			const planningState = derivePlanState(planningCommit);
			const executingState = derivePlanState(executingCommit);
			const completeState = derivePlanState(completeCommit);

			expect(planningState.phase).toBe("planning");
			expect(executingState.phase).toBe("executing");
			expect(completeState.phase).toBe("complete");
		});
	});
});

describe("deriveAlignmentCheck", () => {
	it("should suggest planning for uninitialized state", () => {
		const state = derivePlanState("");
		const check = deriveAlignmentCheck(state, "get_plan");

		expect(check?.question).toContain("create a structured plan");
		expect(check?.required_confirmation).toBe(false);
	});

	it("should suggest next commit for complete state", () => {
		const state = derivePlanState("feat: test\n\nTasks [X]:\n- [x] done");
		const check = deriveAlignmentCheck(state, "finish_job");

		expect(check?.question).toContain("start new commit");
		expect(check?.required_confirmation).toBe(false);
	});

	it("should suggest finalization when all tasks complete", () => {
		const commit = `feat: test

Description.

Tasks [ ]:
- [x] Task 1: done
- [x] Task 2: done`;

		const state = derivePlanState(commit);
		const check = deriveAlignmentCheck(state, "mark_task");

		expect(check?.question).toContain("finalize this commit");
		expect(check?.required_confirmation).toBe(false);
	});

	it("should return undefined for normal states", () => {
		const state = derivePlanState("feat: test\n\nDescription.");
		const check = deriveAlignmentCheck(state, "update_description");

		expect(check).toBeUndefined();
	});

	it("should return undefined for most action types", () => {
		const state = derivePlanState("feat: test\n\nDescription.");
		const actions = [
			"update_goal",
			"set_tasks",
			"unfinish_job",
			"set_constraints",
		];

		for (const action of actions) {
			const check = deriveAlignmentCheck(state, action);
			expect(check).toBeUndefined();
		}
	});

	it("should handle edge case alignment checks", () => {
		// Test alignment check for tasks complete but not finalized
		const commit = `feat: test

Description.

Tasks [ ]:
- [x] Task 1: done
- [x] Task 2: done`;

		const state = derivePlanState(commit);
		const check = deriveAlignmentCheck(state, "mark_task");

		expect(check?.question).toContain("finalize this commit");
		expect(check?.required_confirmation).toBe(false);
	});

	it("should not trigger alignment check for complete state with wrong action", () => {
		const state = derivePlanState("feat: test\n\nTasks [X]:\n- [x] done");
		const check = deriveAlignmentCheck(state, "mark_task");

		expect(check).toBeUndefined();
	});
});

describe("deriveToolResponse", () => {
	it("should create complete tool response", () => {
		const state = derivePlanState("feat: test\n\nDescription.");
		const response = deriveToolResponse(
			state,
			"update_description",
			"Updated description successfully",
		);

		expect(response.status).toBe("success");
		expect(response.action_taken).toBe("Updated description successfully");
		expect(response.current_state).toBe(state);
		expect(response.next_actions).toBeDefined();
		expect(response.next_actions.available).toContain("get_plan");
	});

	it("should include raw commit content when provided", () => {
		const state = derivePlanState("feat: test");
		const commitContent = "feat: test\n\nSome content";
		const response = deriveToolResponse(
			state,
			"get_plan",
			"Retrieved plan",
			commitContent,
		);

		expect(response.raw_commit_content).toBe(commitContent);
	});

	it("should include alignment check when applicable", () => {
		const state = derivePlanState("");
		const response = deriveToolResponse(state, "get_plan", "No plan found");

		expect(response.alignment_check).toBeDefined();
		expect(response.alignment_check?.question).toContain("structured plan");
	});

	it("should handle response without alignment check", () => {
		const state = derivePlanState("feat: test\n\nDescription.");
		const response = deriveToolResponse(
			state,
			"update_description",
			"Updated successfully",
		);

		expect(response.alignment_check).toBeUndefined();
		expect(response.status).toBe("success");
		expect(response.action_taken).toBe("Updated successfully");
	});

	it("should include all required response fields", () => {
		const state = derivePlanState("feat: test");
		const response = deriveToolResponse(
			state,
			"test_action",
			"Test result",
			"raw content",
		);

		expect(response).toHaveProperty("status");
		expect(response).toHaveProperty("action_taken");
		expect(response).toHaveProperty("current_state");
		expect(response).toHaveProperty("next_actions");
		expect(response).toHaveProperty("alignment_check");
		expect(response).toHaveProperty("raw_commit_content");

		expect(response.next_actions).toHaveProperty("recommended");
		expect(response.next_actions).toHaveProperty("blocked");
		expect(response.next_actions).toHaveProperty("available");
	});
});
