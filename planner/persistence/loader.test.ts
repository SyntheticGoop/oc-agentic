/**
 * LOADER TEST SPECIFICATION ENFORCEMENT
 *
 * CRITICAL RULE: Every it() test section MUST begin with a detailed internal comment
 * that describes exactly what behavior is being enforced. This comment serves as the
 * specification contract and CANNOT be modified without explicit instruction.
 *
 * When editing any test:
 * 1. Read the enforcement comment at the start of the it() block
 * 2. Ensure your test implementation enforces EXACTLY what the comment describes
 * 3. Do NOT modify the comment unless explicitly told to do so
 * 4. The comment is the source of truth for what the test must verify
 *
 * Example format:
 * it("should handle basic load", async () => {
 *   // ENFORCEMENT: This test verifies that loading a plan from jujutsu commits
 *   // returns exactly the expected LoadedPlanData structure with no modifications.
 *   // The loader must parse commit headers and bodies correctly.
 *
 *   // ... test implementation that enforces the above
 * });
 */

/**
 * DETAILED LOADER SPECIFICATION
 *
 * This specification defines the complete behavior contract for Loader implementations.
 * All tests must enforce these rules exactly as written based on loader.ts.
 */

/**
 * CORE INTERFACE
 *
 * class Loader {
 *   constructor(jj: ReturnType<typeof import("../jujutsu").Jujutsu.cwd>);
 *   public async loadPlan(): Promise<Ok<LoadedPlanData> | Err<string>>;
 * }
 *
 * type LoadedPlanData = {
 *   scope: string | null;
 *   plan_key: [string, string] | null;
 *   title: string;
 *   intent: string;
 *   objectives: string[];
 *   constraints: string[];
 *   tasks: Array<{
 *     task_key: string;
 *     title: string;
 *     type: ValidatedCommitType;
 *     scope: string | null;
 *     intent: string;
 *     objectives: string[];
 *     constraints: string[];
 *     completed: boolean;
 *   }>;
 * };
 *
 * type ValidatedCommitType = "feat" | "fix" | "refactor" | "build" | "chore" | "docs" | "lint" | "infra" | "spec";
 */

/**
 * HEADER PARSING RULES
 *
 * Header Patterns:
 * - begin(scope): title - Marks start of LONG format plan
 * - end(scope): title - Marks end of LONG format plan, contains plan metadata
 * - {type}(scope): title - Task commit in LONG format (completed: true)
 * - {type}(scope):~ title - Task commit in LONG format (completed: false)
 * - {type}(scope): title - SHORT format commit (completed: true, 0 tasks)
 * - {type}(scope):~ title - SHORT format commit (completed: false, 1 task)
 *
 * Title Validation Rules:
 * - title must start with alphanumeric character [a-z0-9]
 * - title must not exceed 120 characters
 * - title is trimmed of leading/trailing whitespace
 *
 * Validation Rules:
 * - type must be from ValidatedCommitType enum
 * - scope must match /^[a-z0-9/.-]+$/ pattern or be null
 */

/**
 * BODY PARSING RULES
 *
 * Body Structure:
 * Intent section (everything before first ## header)
 * ## Objectives (optional section)
 * ## Constraints (optional section)
 *
 * Content Rules:
 * - Intent: All lines before first ## header, joined with \n and trimmed
 * - Constraints: Lines after ## Constraints, must start with "- ", content extracted
 * - Objectives: Lines after ## Objectives, must start with "- ", content extracted
 * - Empty bullet points ("- ") return errors
 * - Non-bullet lines in constraint/objective sections return errors
 * - Final line in each section is excluded (slice(0, -1))
 */

/**
 * PLAN FORMAT DETECTION
 *
 * SHORT Format (0-1 tasks):
 * - Single commit with {type}(scope): or {type}(scope):~ header
 * - Contains plan metadata in commit body
 * - If 1 task: task data comes from same commit, task_key is current changeId
 * - plan_key is null for SHORT format
 *
 * LONG Format (2+ tasks):
 * - Sequence: begin(scope): -> {type}(scope): tasks -> end(scope):
 * - Plan metadata stored in end(scope): commit
 * - Each task is separate {type}(scope): commit with own metadata
 * - plan_key is [startCommit.changeId, endCommit.changeId] tuple
 * - Task order: newest commits first in history
 */

/**
 * ERROR HANDLING RULES
 *
 * Header Errors:
 * - Invalid header format returns "Invalid header format"
 * - Invalid commit type returns "Invalid commit type"
 * - Title exceeding 120 chars returns specific error with type
 * - Malformed scope returns error
 *
 * Body Errors:
 * - Invalid constraint format returns "Invalid constraint format"
 * - Invalid objective format returns "Invalid objective format"
 * - Empty bullet points return specific error messages
 *
 * Repository Errors:
 * - Jujutsu command failures propagated as Err<string>
 * - Invalid commit sequences return descriptive errors
 * - Missing commits in LONG format return validation errors
 */

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Jujutsu } from "../../src/jujutsu";
import { Loader } from "./loader";

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
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch (_error) {
    // Ignore cleanup errors
  }
}

describe("Basic Interface Tests", () => {
  let testRepoPath: string;

  beforeEach(async () => {
    testRepoPath = await createTestRepo(`test-loader-basic-${Math.random()}`);
  });

  afterEach(async () => {
    await cleanupTestRepo(testRepoPath);
  });

  it("should return proper error types for invalid operations", async () => {
    // ENFORCEMENT: This test verifies that all error conditions return
    // Err<string> types and never throw exceptions. The loader must
    // handle all failure modes gracefully and return descriptive
    // error messages without using throw statements.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Test loading from empty repository (should return error)
    const loadResult = await loader.loadPlan();
    expect(loadResult.err).toBeDefined();
    expect(typeof loadResult.err).toBe("string");
  });

  it("should handle SHORT format with 0 tasks correctly", async () => {
    // ENFORCEMENT: This test verifies that SHORT format commits with
    // {type}(scope): headers (no ~ marker) are parsed as task-only data
    // with 1 task. Plan metadata is no longer extracted or returned.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Create a SHORT format commit manually
    const newResult = await jj.new();
    expect(newResult.err).toBeUndefined();

    const shortCommitMessage = `feat(test:abcd): complete plan

this is the plan intent

## Objectives
- first objective
- second objective

## Constraints
- first constraint
- second constraint
`;

    const descResult = await jj.description.replace(shortCommitMessage);
    expect(descResult.err).toBeUndefined();

    // Load and verify - task-only persistence
    const loadResult = await loader.loadPlan();
    expect(loadResult.err).toBeUndefined();
    if (loadResult.ok) {
      expect(loadResult.ok.tasks).toHaveLength(1);
      // Verify task data is extracted correctly
      const task = loadResult.ok.tasks[0];
      expect(task.scope).toBe("test");
      expect(task.title).toBe("complete plan");
      expect(task.intent).toBe("this is the plan intent");
      expect(task.constraints).toEqual([
        "first constraint",
        "second constraint",
      ]);
      expect(task.objectives).toEqual([
        "first objective",
        "second objective",
      ]);
      expect(task.completed).toBe(true);
    }
  });

  it("should handle SHORT format with 1 task correctly", async () => {
    // ENFORCEMENT: This test verifies that SHORT format commits with
    // {type}(scope):~ headers (with ~ marker) are parsed as task-only data
    // with 1 task. Task metadata comes from the commit body and the task is marked
    // as incomplete.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Create a SHORT format commit with incomplete task
    const newResult = await jj.new();
    expect(newResult.err).toBeUndefined();

    const shortCommitMessage = `fix(auth:abcd):~ incomplete task

fix authentication bug

## Objectives
- secure login
- fix vulnerability

## Constraints
- use oauth
- maintain security
`;

    const descResult = await jj.description.replace(shortCommitMessage);
    expect(descResult.err).toBeUndefined();

    // Get the current changeId for verification
    const historyResult = await jj.history.linear();
    expect(historyResult.err).toBeUndefined();
    const currentChangeId = historyResult.ok?.current.changeId;

    // Load and verify - task-only persistence
    const loadResult = await loader.loadPlan();
    expect(loadResult.err).toBeUndefined();
    if (loadResult.ok) {
      expect(loadResult.ok.tasks).toHaveLength(1);

      const task = loadResult.ok.tasks[0];
      expect(task.task_key).toBe(currentChangeId);
      expect(task.type).toBe("fix");
      expect(task.scope).toBe("auth");
      expect(task.title).toBe("incomplete task");
      expect(task.intent).toBe("fix authentication bug");
      expect(task.constraints).toEqual(["use oauth", "maintain security"]);
      expect(task.objectives).toEqual(["secure login", "fix vulnerability"]);
      expect(task.completed).toBe(false);
    }
  });

  it("should handle LONG format with multiple tasks correctly", async () => {
    // ENFORCEMENT: This test verifies that LONG format commit sequences
    // (begin -> tasks -> end) are parsed correctly. Plan metadata comes
    // from the end commit, task metadata comes from individual task commits,
    // plan_key is a tuple of [startCommit.changeId, endCommit.changeId],
    // and task_keys are the respective changeIds.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Get begin changeId
    const historyResult1 = await jj.history.linear();
    expect(historyResult1.err).toBeUndefined();

    // Create first task commit
    const newResult2 = await jj.new();
    expect(newResult2.err).toBeUndefined();

    const task1Message = `feat(api:test):~ create rest endpoints

implement rest api endpoints

## Objectives
- crud operations
- error handling

## Constraints
- openapi spec
- rate limiting
`;
    const descResult2 = await jj.description.replace(task1Message);
    expect(descResult2.err).toBeUndefined();

    // Get task1 changeId
    const historyResult2 = await jj.history.linear();
    expect(historyResult2.err).toBeUndefined();
    const task1ChangeId = historyResult2.ok?.current.changeId;

    // Create second task commit
    const newResult3 = await jj.new();
    expect(newResult3.err).toBeUndefined();

    const task2Message = `feat(api:test): add graphql schema

implement graphql schema

## Objectives
- type definitions
- resolvers

## Constraints
- apollo server
- type safety
`;
    const descResult3 = await jj.description.replace(task2Message);
    expect(descResult3.err).toBeUndefined();

    // Get task2 changeId
    const historyResult3 = await jj.history.linear();
    expect(historyResult3.err).toBeUndefined();
    const task2ChangeId = historyResult3.ok?.current.changeId;

    // Get end changeId
    const historyResult4 = await jj.history.linear();
    expect(historyResult4.err).toBeUndefined();

    // Load and verify
    const loadResult = await loader.loadPlan();
    expect(loadResult.err).toBeUndefined();
    if (loadResult.ok) {
      expect(loadResult.ok.tasks).toHaveLength(2);

      // Verify first task
      const task1 = loadResult.ok.tasks[0];
      expect(task1.task_key).toBe(task1ChangeId);
      expect(task1.type).toBe("feat");
      expect(task1.scope).toBe("api");
      expect(task1.title).toBe("create rest endpoints");
      expect(task1.intent).toBe("implement rest api endpoints");
      expect(task1.constraints).toEqual(["openapi spec", "rate limiting"]);
      expect(task1.objectives).toEqual(["crud operations", "error handling"]);
      expect(task1.completed).toBe(false);

      // Verify second task
      const task2 = loadResult.ok.tasks[1];
      expect(task2?.task_key).toBe(task2ChangeId);
      expect(task2?.type).toBe("feat");
      expect(task2?.scope).toBe("api");
      expect(task2?.title).toBe("add graphql schema");
      expect(task2?.intent).toBe("implement graphql schema");
      expect(task2?.constraints).toEqual(["apollo server", "type safety"]);
      expect(task2?.objectives).toEqual(["type definitions", "resolvers"]);
      expect(task2?.completed).toBe(true);
    }
  });

  it("should handle null scope values explicitly", async () => {
    // ENFORCEMENT: This test verifies that the loader handles
    // null scope values without using non-null assertions (!).
    // Scope can be null when no parentheses are present in the header.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Create commit without scope (no parentheses)
    const newResult = await jj.new();
    expect(newResult.err).toBeUndefined();

    const noScopeMessage = `feat(:abcd): plan without scope

plan intent without scope

## Objectives
- some objective

## Constraints
- some constraint
`;

    const descResult = await jj.description.replace(noScopeMessage);
    expect(descResult.err).toBeUndefined();

    // Load and verify
    const loadResult = await loader.loadPlan();
    expect(loadResult.err).toBeUndefined();
    if (loadResult.ok) {
      expect(loadResult.ok.tasks[0].scope).toBeNull();
      expect(loadResult.ok.tasks[0].title).toBe("plan without scope");
      expect(loadResult.ok.tasks[0].intent).toBe("plan intent without scope");
      expect(loadResult.ok.tasks[0].constraints).toEqual(["some constraint"]);
      expect(loadResult.ok.tasks[0].objectives).toEqual(["some objective"]);
    }
  });
});

describe("Content Validation Tests", () => {
  let testRepoPath: string;

  beforeEach(async () => {
    testRepoPath = await createTestRepo(`test-loader-content-${Math.random()}`);
  });

  afterEach(async () => {
    await cleanupTestRepo(testRepoPath);
  });

  it("should parse intent section correctly", async () => {
    // ENFORCEMENT: This test verifies that intent is parsed as all content
    // before the first ## header, joined with newlines and trimmed.
    // Multi-paragraph intents are supported.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    const newResult = await jj.new();
    expect(newResult.err).toBeUndefined();

    const multiParagraphMessage = `feat(test:abcd): multi-paragraph intent

first paragraph of intent.

second paragraph with more details.

third paragraph conclusion.

## Objectives
- some objective

## Constraints
- some constraint
`;

    const descResult = await jj.description.replace(multiParagraphMessage);
    expect(descResult.err).toBeUndefined();

    const loadResult = await loader.loadPlan();
    expect(loadResult.err).toBeUndefined();
    if (loadResult.ok) {
      const expectedIntent =
        "first paragraph of intent.\n\nsecond paragraph with more details.\n\nthird paragraph conclusion.";
      expect(loadResult.ok.tasks[0].intent).toBe(expectedIntent);
    }
  });

  it("should enforce constraints bullet point format", async () => {
    // ENFORCEMENT: This test verifies that constraints must be bullet points
    // starting with "- " followed by content. Empty bullet points ("- ")
    // and non-bullet lines return "Invalid constraint format" errors.
    // Content after "- " is extracted.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Test valid constraints
    const newResult1 = await jj.new();
    expect(newResult1.err).toBeUndefined();

    const validConstraintsMessage = `feat(test:abcd): valid constraints

intent text

## Objectives
- some objective

## Constraints
- first constraint
- second constraint with details
- third constraint
`;

    const descResult1 = await jj.description.replace(validConstraintsMessage);
    expect(descResult1.err).toBeUndefined();

    const loadResult1 = await loader.loadPlan();
    expect(loadResult1.err).toBeUndefined();
    if (loadResult1.ok) {
      expect(loadResult1.ok.tasks[0].constraints).toEqual([
        "first constraint",
        "second constraint with details",
        "third constraint",
      ]);
      expect(loadResult1.ok.tasks[0].objectives).toEqual(["some objective"]);
    }

    // Test invalid constraints - empty bullet point
    const newResult2 = await jj.new();
    expect(newResult2.err).toBeUndefined();

    const emptyBulletMessage = `feat(test:abcd): invalid constraints

intent text

## Constraints
- valid constraint
- 
- another valid constraint

## Objectives
- some objective
`;

    const descResult2 = await jj.description.replace(emptyBulletMessage);
    expect(descResult2.err).toBeUndefined();

    const loadResult2 = await loader.loadPlan();
    expect(loadResult2.err).toBeDefined();
    expect(loadResult2.err).toBe("Parse Error: Invalid constraint format");

    // Test invalid constraints - non-bullet line
    const newResult3 = await jj.new();
    expect(newResult3.err).toBeUndefined();

    const nonBulletMessage = `feat(test:abcd): invalid constraints

		intent text

		## Constraints
		- valid constraint
		not a bullet point
		- another valid constraint

		## Objectives
		- some objective
		`;

    const descResult3 = await jj.description.replace(nonBulletMessage);
    expect(descResult3.err).toBeUndefined();

    const loadResult3 = await loader.loadPlan();
    expect(loadResult3.err).toBeDefined();
    expect(loadResult3.err).toBe("Parse Error: Invalid constraint format");
  });

  it("should enforce objectives bullet point format", async () => {
    // ENFORCEMENT: This test verifies that objectives must be bullet points
    // starting with "- " followed by content. Empty bullet points ("- ")
    // and non-bullet lines return "Invalid objective format" errors.
    // Content after "- " is extracted.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Test valid objectives
    const newResult1 = await jj.new();
    expect(newResult1.err).toBeUndefined();

    const validObjectivesMessage = `feat(test:abcd): valid objectives
intent text

## Objectives
- first objective
- second objective with details
- third objective

## Constraints
- some constraint
`;

    const descResult1 = await jj.description.replace(validObjectivesMessage);
    expect(descResult1.err).toBeUndefined();

    const loadResult1 = await loader.loadPlan();
    expect(loadResult1.err).toBeUndefined();
    if (loadResult1.ok) {
      expect(loadResult1.ok.tasks[0].objectives).toEqual([
        "first objective",
        "second objective with details",
        "third objective",
      ]);
      expect(loadResult1.ok.tasks[0].constraints).toEqual(["some constraint"]);
    }

    // Test invalid objectives - empty bullet point
    const newResult2 = await jj.new();
    expect(newResult2.err).toBeUndefined();

    const emptyBulletMessage = `feat(test:abcd): invalid objectives

intent text

## Objectives
- valid objective
- 
- another valid objective

## Constraints
- some constraint
`;

    const descResult2 = await jj.description.replace(emptyBulletMessage);
    expect(descResult2.err).toBeUndefined();

    const loadResult2 = await loader.loadPlan();
    expect(loadResult2.err).toBeDefined();
    expect(loadResult2.err).toBe("Parse Error: Invalid objective format");

    // Test invalid objectives - non-bullet line
    const newResult3 = await jj.new();
    expect(newResult3.err).toBeUndefined();

    const nonBulletMessage = `feat(test:abcd): invalid objectives

intent text

## Objectives
- valid objective
not a bullet point
- another valid objective

## Constraints
- some constraint
`;

    const descResult3 = await jj.description.replace(nonBulletMessage);
    expect(descResult3.err).toBeUndefined();

    const loadResult3 = await loader.loadPlan();
    expect(loadResult3.err).toBeDefined();
    expect(loadResult3.err).toBe("Parse Error: Invalid objective format");
  });

  it("should handle missing sections gracefully", async () => {
    // ENFORCEMENT: This test verifies that missing ## Constraints or
    // ## Objectives sections result in empty arrays for those fields.
    // intent is required, other sections are optional.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Test with intent
    const newResult1 = await jj.new();
    expect(newResult1.err).toBeUndefined();

    const intenMessage = `feat(test:abcd): intent

just the intent text, no other sections.
`;

    const descResult1 = await jj.description.replace(intenMessage);
    expect(descResult1.err).toBeUndefined();

    const loadResult1 = await loader.loadPlan();
    expect(loadResult1.err).toBeUndefined();
    if (loadResult1.ok) {
      expect(loadResult1.ok.tasks[0].intent).toBe(
        "just the intent text, no other sections.",
      );
      expect(loadResult1.ok.tasks[0].constraints).toEqual([]);
      expect(loadResult1.ok.tasks[0].objectives).toEqual([]);
    }

    // Test with intent and constraints
    const newResult2 = await jj.new();
    expect(newResult2.err).toBeUndefined();

    const intentConstraintsMessage = `feat(test:acod): intent and constraints

intent text here.

## Constraints
- first constraint
- second constraint
`;

    const descResult2 = await jj.description.replace(intentConstraintsMessage);
    expect(descResult2.err).toBeUndefined();

    const loadResult2 = await loader.loadPlan();
    expect(loadResult2.err).toBeUndefined();
    if (loadResult2.ok) {
      expect(loadResult2.ok.tasks[0].intent).toBe("intent text here.");
      expect(loadResult2.ok.tasks[0].constraints).toEqual([
        "first constraint",
        "second constraint",
      ]);
      expect(loadResult2.ok.tasks[0].objectives).toEqual([]);
    }
  });
});

describe("Header Format Validation Tests", () => {
  let testRepoPath: string;

  beforeEach(async () => {
    testRepoPath = await createTestRepo(`test-loader-header-${Math.random()}`);
  });

  afterEach(async () => {
    await cleanupTestRepo(testRepoPath);
  });

  it("should validate commit types against enum", async () => {
    // ENFORCEMENT: This test verifies that valid commit types from
    // ValidatedCommitType enum are accepted. Invalid types return
    // "Invalid commit type" error message.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Test invalid commit type
    const newResult = await jj.new();
    expect(newResult.err).toBeUndefined();

    const invalidTypeMessage = `invalid(test:abcd): invalid type

intent text
`;

    const descResult = await jj.description.replace(invalidTypeMessage);
    expect(descResult.err).toBeUndefined();

    const loadResult = await loader.loadPlan();
    expect(loadResult.err).toBeDefined();
    expect(loadResult.err).toBe("Parse Error: Invalid commit type");
  });

  it("should validate title format requirements", async () => {
    // ENFORCEMENT: This test verifies that commit titles must start with
    // alphanumeric characters [a-z0-9]. Titles starting with symbols,
    // uppercase letters, or whitespace are rejected with "Invalid header format".

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Test invalid title formats
    const invalidTitles = [
      "UPPERCASE start",
      "!symbol start",
      "@symbol start",
      " whitespace start",
      "\ttab start",
    ];

    for (const title of invalidTitles) {
      const newResult = await jj.new();
      expect(newResult.err).toBeUndefined();

      const invalidTitleMessage = `feat(test:abcd): ${title}

intent text
`;

      const descResult = await jj.description.replace(invalidTitleMessage);
      expect(descResult.err).toBeUndefined();

      const loadResult = await loader.loadPlan();
      expect(loadResult.err).toBeDefined();
      expect(loadResult.err).toBe("Parse Error: Invalid header format");
    }

    // Test valid title formats
    const validTitles = [
      "lowercase start",
      "123 number start",
      "a single letter",
      "9 single number",
    ];

    for (const title of validTitles) {
      const newResult = await jj.new();
      expect(newResult.err).toBeUndefined();

      const validTitleMessage = `feat(test:abcd): ${title}

intent text
`;

      const descResult = await jj.description.replace(validTitleMessage);
      expect(descResult.err).toBeUndefined();

      const loadResult = await loader.loadPlan();
      expect(loadResult.err).toBeUndefined();
    }
  });

  it("should validate title length constraints", async () => {
    // ENFORCEMENT: This test verifies that commit titles exceeding 120
    // characters return specific error messages with the commit type.
    // Titles are trimmed before length validation.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Create title that exceeds 120 characters
    const longTitle = `a${"b".repeat(120)}`; // 121 characters total
    const newResult = await jj.new();
    expect(newResult.err).toBeUndefined();

    const longTitleMessage = `feat(test:abcd): ${longTitle}

intent text
`;

    const descResult = await jj.description.replace(longTitleMessage);
    expect(descResult.err).toBeUndefined();

    const loadResult = await loader.loadPlan();
    expect(loadResult.err).toBeDefined();
    expect(loadResult.err).toBe(
      "Parse Error: Task commit title exceeds maximum length",
    );
  });

  it("should parse completion markers correctly", async () => {
    // ENFORCEMENT: This test verifies that ~ markers correctly indicate
    // incomplete status (completed: false) and absence indicates complete
    // status (completed: true). This applies to both SHORT and LONG formats.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Test SHORT format incomplete (with ~)
    const newResult1 = await jj.new();
    expect(newResult1.err).toBeUndefined();

    const incompleteMessage = `feat(test:abcd):~ incomplete task

task intent
`;

    const descResult1 = await jj.description.replace(incompleteMessage);
    expect(descResult1.err).toBeUndefined();

    const loadResult1 = await loader.loadPlan();
    expect(loadResult1.err).toBeUndefined();
    if (loadResult1.ok) {
      expect(loadResult1.ok.tasks).toHaveLength(1);
      expect(loadResult1.ok.tasks[0].completed).toBe(false);
    }

    // Test SHORT format complete (without ~)
    const newResult2 = await jj.new();
    expect(newResult2.err).toBeUndefined();

    const completeMessage = `feat(test:abcd): complete task

task intent
`;

    const descResult2 = await jj.description.replace(completeMessage);
    expect(descResult2.err).toBeUndefined();

    const loadResult2 = await loader.loadPlan();
    expect(loadResult2.err).toBeUndefined();
    if (loadResult2.ok) {
      expect(loadResult2.ok.tasks).toHaveLength(2); // 1 task for complete SHORT format
    }
  });

  it("should validate scope pattern", async () => {
    // ENFORCEMENT: This test verifies that scope must match the pattern
    // /^[a-z0-9/.-]+$/ when present. Invalid scopes cause header parsing
    // to fail. Null scope (no parentheses) is allowed.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Test valid scopes
    const validScopes = [
      "test",
      "auth",
      "api",
      "user-data",
      "config.json",
      "ui/components",
    ];

    let i = 97
    for (const scope of validScopes) {
      const newResult = await jj.new();
      expect(newResult.err).toBeUndefined();

      const validScopeMessage = `feat(${scope}:abd${String.fromCharCode(i++)}): valid scope

intent text
`;

      const descResult = await jj.description.replace(validScopeMessage);
      expect(descResult.err).toBeUndefined();

      const loadResult = await loader.loadPlan();
      expect(loadResult.err).toBeUndefined();
      if (loadResult.ok) {
        expect(loadResult.ok.tasks[0].scope).toBe(scope);
      }
    }

    // Test null scope (no parentheses)
    const newResult = await jj.new();
    expect(newResult.err).toBeUndefined();

    const noScopeMessage = `feat(:abcd): no scope

intent text
`;

    const descResult = await jj.description.replace(noScopeMessage);
    expect(descResult.err).toBeUndefined();

    const loadResult = await loader.loadPlan();
    expect(loadResult.err).toBeUndefined();
  });
});

describe("Tag Validation Tests", () => {
  let testRepoPath: string;

  beforeEach(async () => {
    testRepoPath = await createTestRepo(`test-loader-tag-${Math.random()}`);
  });

  afterEach(async () => {
    await cleanupTestRepo(testRepoPath);
  });

  it("should accept valid 4-character alphanumeric tags", async () => {
    // ENFORCEMENT: This test verifies that valid 4-character lowercase
    // alphanumeric tags are accepted in begin/end format. Tags can contain
    // letters a-z and numbers 0-9 in any combination.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    const validTags = ["auth", "test"];

    for (const tag of validTags) {
      // Create begin commit with valid tag
      const newResult1 = await jj.new();
      expect(newResult1.err).toBeUndefined();


      // Create task commit
      const newResult2 = await jj.new();
      expect(newResult2.err).toBeUndefined();

      const taskMessage = `feat(scope:${tag}): test task

task intent
`;
      const descResult2 = await jj.description.replace(taskMessage);
      expect(descResult2.err).toBeUndefined();

      // Load and verify tag is parsed correctly
      const loadResult = await loader.loadPlan();
      expect(loadResult.err).toBeUndefined();
      if (loadResult.ok) {
        expect(loadResult.ok.tasks[0].tag).toBe(tag);
      }
    }
  });

  it("should reject invalid tag formats with specific error messages", async () => {
    // ENFORCEMENT: This test verifies that invalid tag formats return
    // specific error messages indicating the exact problem with the tag.
    // Invalid formats include wrong length, uppercase letters, symbols.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    const invalidTags = [
      { tag: "AUTH", error: "Invalid tag format 'AUTH' - tag must be exactly 4 lowercase alphanumeric characters" },
      { tag: "au", error: "Invalid tag format 'au' - tag must be exactly 4 lowercase alphanumeric characters" },
      { tag: "authx", error: "Invalid tag format 'authx' - tag must be exactly 4 lowercase alphanumeric characters" },
      { tag: "au-h", error: "Invalid tag format 'au-h' - tag must be exactly 4 lowercase alphanumeric characters" },
      { tag: "au_h", error: "Invalid tag format 'au_h' - tag must be exactly 4 lowercase alphanumeric characters" },
      { tag: "au@h", error: "Invalid tag format 'au@h' - tag must be exactly 4 lowercase alphanumeric characters" },
      { tag: "", error: "Invalid tag format '' - tag must be exactly 4 lowercase alphanumeric characters" },
    ];

    for (const { tag } of invalidTags) {
      const newResult = await jj.new();
      expect(newResult.err).toBeUndefined();

      const beginMessage = `begin(scope:${tag}): test plan`;
      const descResult = await jj.description.replace(beginMessage);
      expect(descResult.err).toBeUndefined();

      const loadResult = await loader.loadPlan();
      expect(loadResult.err).toBeDefined();
      expect(loadResult.err).toBe(`Parse Error: Invalid header format`);
    }
  });

  it("should reject old format without mandatory tag", async () => {
    // ENFORCEMENT: This test verifies that the old begin(scope): format
    // without mandatory tag is rejected with a clear error message explaining
    // the new required format.

    const jj = Jujutsu.cwd(testRepoPath);
    const loader = new Loader(jj);

    // Test old begin format
    const newResult1 = await jj.new();
    expect(newResult1.err).toBeUndefined();

    const oldBeginMessage = `begin(scope): old format plan`;
    const descResult1 = await jj.description.replace(oldBeginMessage);
    expect(descResult1.err).toBeUndefined();

    const loadResult1 = await loader.loadPlan();
    expect(loadResult1.err).toBeDefined();
    expect(loadResult1.err).toBe(
      "Parse Error: Invalid header format"
    );

    // Test old end format
    const newResult2 = await jj.new();
    expect(newResult2.err).toBeUndefined();

    const oldEndMessage = `end(scope): old format plan`;
    const descResult2 = await jj.description.replace(oldEndMessage);
    expect(descResult2.err).toBeUndefined();

    const loadResult2 = await loader.loadPlan();
    expect(loadResult2.err).toBeDefined();
    expect(loadResult2.err).toBe(
      "Parse Error: Invalid header format"
    );
  });

  describe("Plan Format Tests", () => {
    let testRepoPath: string;

    beforeEach(async () => {
      testRepoPath = await createTestRepo(`test-loader-format-${Math.random()}`);
    });

    afterEach(async () => {
      await cleanupTestRepo(testRepoPath);
    });

    it("should detect and parse SHORT format correctly", async () => {
      // ENFORCEMENT: This test verifies that SHORT format plans (single
      // commit with : marker) are correctly identified and parsed into
      // LoadedPlanData with appropriate task count (0 or 1) and null plan_key.

      const jj = Jujutsu.cwd(testRepoPath);
      const loader = new Loader(jj);

      // Test SHORT format with 0 tasks
      const newResult1 = await jj.new();
      expect(newResult1.err).toBeUndefined();

      const shortZeroMessage = `feat(api:abcd): complete api implementation

implemented all api endpoints successfully.

## Objectives
- crud operations
- authentication

## Constraints
- restful design
- rate limiting
`;

      const descResult1 = await jj.description.replace(shortZeroMessage);
      expect(descResult1.err).toBeUndefined();

      const loadResult1 = await loader.loadPlan();
      expect(loadResult1.err).toBeUndefined();
      if (loadResult1.ok) {
        expect(loadResult1.ok.tasks).toHaveLength(1);
      }

      // Test SHORT format with 1 task
      const newResult2 = await jj.new();
      expect(newResult2.err).toBeUndefined();

      const shortOneMessage = `fix(auth:defg):~ fix login vulnerability

patch security vulnerability in login system.

## Objectives
- secure authentication
- fix cve issue

## Constraints
- no breaking changes
- backward compatibility
`;

      const descResult2 = await jj.description.replace(shortOneMessage);
      expect(descResult2.err).toBeUndefined();

      const loadResult2 = await loader.loadPlan();
      expect(loadResult2.err).toBeUndefined();
      if (loadResult2.ok) {
        expect(loadResult2.ok.tasks).toHaveLength(1);
        expect(loadResult2.ok.tasks[0].completed).toBe(false);
        expect(loadResult2.ok.tasks[0].type).toBe("fix");
      }
    });

    it("should detect and parse LONG format correctly", async () => {
      // ENFORCEMENT: This test verifies that LONG format plans (begin/task/end
      // sequence) are correctly identified and parsed. Plan metadata comes from
      // end commit, task metadata from individual commits, plan_key is a tuple
      // of [startCommit.changeId, endCommit.changeId], and proper task ordering.

      const jj = Jujutsu.cwd(testRepoPath);
      const loader = new Loader(jj);

      // 2. First task commit
      const newResult2 = await jj.new();
      expect(newResult2.err).toBeUndefined();

      const task1Message = `refactor(database:test): optimize queries

improve query performance and add indexes.

## Objectives
- faster queries
- better indexes

## Constraints
- no downtime
- backward compatibility
`;
      const descResult2 = await jj.description.replace(task1Message);
      expect(descResult2.err).toBeUndefined();

      const historyResult2 = await jj.history.linear();
      const task1ChangeId = historyResult2.ok?.current.changeId;

      // 3. Second task commit
      const newResult3 = await jj.new();
      expect(newResult3.err).toBeUndefined();

      const task2Message = `refactor(database:test):~ update schema

normalize database schema and remove duplicates.

## Objectives
- normalized tables
- remove duplicates

## Constraints
- migration scripts
- data integrity
`;
      const descResult3 = await jj.description.replace(task2Message);
      expect(descResult3.err).toBeUndefined();

      const historyResult3 = await jj.history.linear();
      const task2ChangeId = historyResult3.ok?.current.changeId;

      // Load and verify
      const loadResult = await loader.loadPlan();
      expect(loadResult.err).toBeUndefined();
      if (loadResult.ok) {
        // Plan metadata from end commit
        expect(loadResult.ok.tasks).toHaveLength(2);

        // First task (completed)
        expect(loadResult.ok.tasks[0].task_key).toBe(task1ChangeId);
        expect(loadResult.ok.tasks[0].intent).toBe(
          "improve query performance and add indexes.",
        );
        expect(loadResult.ok.tasks[0].completed).toBe(true);
        expect(loadResult.ok.tasks[0].type).toBe("refactor");

        // Second task (incomplete)
        expect(loadResult.ok.tasks[1]?.task_key).toBe(task2ChangeId);
        expect(loadResult.ok.tasks[1]?.intent).toBe(
          "normalize database schema and remove duplicates.",
        );
        expect(loadResult.ok.tasks[1]?.completed).toBe(false);
        expect(loadResult.ok.tasks[1]?.type).toBe("refactor");
        expect(loadResult.ok.tasks[1]?.tag).toBe("test");
      }
    });

    it("should handle malformed commit sequences gracefully", async () => {
      // ENFORCEMENT: This test verifies that malformed commit sequences
      // return descriptive errors rather than throwing exceptions. Invalid
      // header formats, unparseable content, and broken sequences are handled.

      const jj = Jujutsu.cwd(testRepoPath);
      const loader = new Loader(jj);

      // Test completely invalid header format
      const newResult1 = await jj.new();
      expect(newResult1.err).toBeUndefined();

      const invalidHeaderMessage = `completely invalid header format

some content
`;
      const descResult1 = await jj.description.replace(invalidHeaderMessage);
      expect(descResult1.err).toBeUndefined();

      const loadResult1 = await loader.loadPlan();
      expect(loadResult1.err).toBeDefined();
      expect(loadResult1.err).toBe("Parse Error: Invalid header format");

      // Test valid header but invalid body content
      const newResult2 = await jj.new();
      expect(newResult2.err).toBeUndefined();

      const invalidBodyMessage = `feat(test:abcd): valid header

intent text

## Constraints
not a bullet point
- valid constraint

## Objectives
- valid objective
`;
      const descResult2 = await jj.description.replace(invalidBodyMessage);
      expect(descResult2.err).toBeUndefined();

      const loadResult2 = await loader.loadPlan();
      expect(loadResult2.err).toBeDefined();
      expect(loadResult2.err).toBe("Parse Error: Invalid constraint format");
    });
  });
});
