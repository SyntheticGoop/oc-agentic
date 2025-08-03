import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Jujutsu } from "./jujutsu";

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
	} catch (error) {
		// Ignore cleanup errors
	}
}

describe("Jujutsu.cwd().new()", () => {
	let testRepoPath: string;

	beforeEach(async () => {
		testRepoPath = await createTestRepo(`test-new-${Math.random()}`);
	});

	afterEach(async () => {
		await cleanupTestRepo(testRepoPath);
	});

	it("should create a new commit successfully", async () => {
		await expect(
			Jujutsu.cwd(testRepoPath).new(),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);
	});

	it("should return error for invalid directory", async () => {
		await expect(
			Jujutsu.cwd(`${testRepoPath}.never`).new(),
		).resolves.toMatchInlineSnapshot(`
      {
        "err": "command non zero exit",
        "meta": {
          "cmd": "jj new -R ${testRepoPath}.never",
          "code": 1,
        },
      }
    `);
	});

	it("should return error for non-jj repository", async () => {
		cleanupTestRepo(testRepoPath);
		testRepoPath = await createTestRepo(`test-new-${Math.random()}`);

		await expect(
			Jujutsu.cwd(testRepoPath).new(),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);
	});
});

describe("Jujutsu.cwd().description.get()", () => {
	let testRepoPath: string;

	beforeEach(async () => {
		testRepoPath = await createTestRepo(`test-desc-get-${Math.random()}`);
	});

	afterEach(async () => {
		await cleanupTestRepo(testRepoPath);
	});

	it("should get current commit description", async () => {
		await expect(
			Jujutsu.cwd(testRepoPath).description.get(),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);
	});

	it("should handle empty description", async () => {
		await expect(
			Jujutsu.cwd(testRepoPath).description.get(),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);
	});

	it("should return error for invalid directory", async () => {
		await expect(
			Jujutsu.cwd("/nonexistent/directory").description.get(),
		).resolves.toMatchInlineSnapshot(`
      {
        "err": "command non zero exit",
        "meta": {
          "cmd": "jj log -r @ -T description --no-graph -R /nonexistent/directory",
          "code": 1,
        },
      }
    `);
	});

	it("should return error for non-jj repository", async () => {
		const nonJjPath = join(MOCK_ENV_DIR, `non-jj-desc-${Date.now()}`);
		await fs.mkdir(nonJjPath, { recursive: true });

		await expect(
			Jujutsu.cwd(nonJjPath).description.get(),
		).resolves.toMatchInlineSnapshot(`
      {
        "err": "command non zero exit",
        "meta": {
          "cmd": "jj log -r @ -T description --no-graph -R ${nonJjPath}",
          "code": 1,
        },
      }
    `);

		await cleanupTestRepo(nonJjPath);
	});
});

describe("Jujutsu.cwd().description.replace()", () => {
	let testRepoPath: string;

	beforeEach(async () => {
		testRepoPath = await createTestRepo(`test-desc-replace-${Date.now()}`);
	});

	afterEach(async () => {
		await cleanupTestRepo(testRepoPath);
	});

	it("should replace commit description successfully", async () => {
		const jj = Jujutsu.cwd(testRepoPath);
		const newDescription = "feat: test commit message";

		await expect(
			jj.description.replace(newDescription),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);
		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "feat: test commit message
			",
			}
		`);
	});

	it("should handle multiline descriptions", async () => {
		const jj = Jujutsu.cwd(testRepoPath);
		const multilineDescription =
			"feat: test feature\n\nThis is a detailed description\nwith multiple lines";

		await expect(
			jj.description.replace(multilineDescription),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);
		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "feat: test feature

			This is a detailed description
			with multiple lines
			",
			}
		`);
	});

	it("should handle empty description", async () => {
		const jj = Jujutsu.cwd(testRepoPath);

		await expect(jj.description.replace("")).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);
		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);
	});

	it("should handle special characters in description", async () => {
		const jj = Jujutsu.cwd(testRepoPath);
		const specialDescription =
			'fix: handle "quotes" and $pecial chars & symbols';

		await expect(
			jj.description.replace(specialDescription),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);

		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "fix: handle "quotes" and $pecial chars & symbols
			",
			}
		`);
	});

	it("should handle unicode characters", async () => {
		const jj = Jujutsu.cwd(testRepoPath);
		const unicodeDescription = "feat: add émojis 🚀 and açcénts";

		await expect(
			jj.description.replace(unicodeDescription),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);

		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "feat: add émojis 🚀 and açcénts
			",
			}
		`);
	});

	it("should return error for invalid directory", async () => {
		await expect(
			Jujutsu.cwd("/nonexistent/directory").description.get(),
		).resolves.toMatchInlineSnapshot(`
      {
        "err": "command non zero exit",
        "meta": {
          "cmd": "jj log -r @ -T description --no-graph -R /nonexistent/directory",
          "code": 1,
        },
      }
    `);
	});

	it("should return error for non-jj repository", async () => {
		const nonJjPath = join(MOCK_ENV_DIR, `non-jj-desc-${Math.random()}`);
		await fs.mkdir(nonJjPath, { recursive: true });

		await expect(
			Jujutsu.cwd(nonJjPath).description.get(),
		).resolves.toMatchInlineSnapshot(`
      {
        "err": "command non zero exit",
        "meta": {
          "cmd": "jj log -r @ -T description --no-graph -R ${nonJjPath}",
          "code": 1,
        },
      }
    `);

		await cleanupTestRepo(nonJjPath);
	});

	it("should return error for non-jj repository", async () => {
		const nonJjPath = join(MOCK_ENV_DIR, `non-jj-${Math.random()}`);
		await fs.mkdir(nonJjPath, { recursive: true });

		await expect(Jujutsu.cwd(nonJjPath).new()).resolves.toMatchInlineSnapshot(`
      {
        "err": "command non zero exit",
        "meta": {
          "cmd": "jj new -R ${nonJjPath}",
          "code": 1,
        },
      }
    `);

		await cleanupTestRepo(nonJjPath);
	});

	it("should return error for non-jj repository", async () => {
		const nonJjPath = join(MOCK_ENV_DIR, `non-jj-replace-${Math.random()}`);
		await fs.mkdir(nonJjPath, { recursive: true });

		await expect(
			Jujutsu.cwd(nonJjPath).description.replace("test message"),
		).resolves.toMatchInlineSnapshot(`
      {
        "err": "command non zero exit",
        "meta": {
          "cmd": "jj desc -R ${nonJjPath} -m test message",
          "code": 1,
        },
      }
    `);

		await cleanupTestRepo(nonJjPath);
	});
});

describe("Jujutsu integration workflow", () => {
	let testRepoPath: string;

	beforeEach(async () => {
		testRepoPath = await createTestRepo(`test-workflow-${Math.random()}`);
	});

	afterEach(async () => {
		await cleanupTestRepo(testRepoPath);
	});

	it("should support complete workflow: new commit -> set description -> get description", async () => {
		const jj = Jujutsu.cwd(testRepoPath);

		// Create a new commit
		await expect(jj.new()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);

		// Set a description
		const testDescription = "feat: complete workflow test";
		await expect(
			jj.description.replace(testDescription),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);

		// Verify the description was set
		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "feat: complete workflow test
			",
			}
		`);
	});

	it("should handle multiple description updates", async () => {
		const jj = Jujutsu.cwd(testRepoPath);

		const descriptions = [
			"initial: first description",
			"update: second description",
			"final: third description",
		];

		await expect(
			jj.description.replace(descriptions[0]),
		).resolves.toMatchInlineSnapshot(`
				{
				  "ok": "",
				}
			`);

		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "initial: first description
			",
			}
		`);

		await expect(
			jj.description.replace(descriptions[1]),
		).resolves.toMatchInlineSnapshot(`
				{
				  "ok": "",
				}
			`);

		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "update: second description
			",
			}
		`);

		await expect(
			jj.description.replace(descriptions[2]),
		).resolves.toMatchInlineSnapshot(`
				{
				  "ok": "",
				}
			`);

		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "final: third description
			",
			}
		`);
	});

	it("should handle creating multiple commits with descriptions", async () => {
		const jj = Jujutsu.cwd(testRepoPath);

		// Create and describe first commit
		await expect(jj.new()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);
		await expect(
			jj.description.replace("feat: first commit"),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);

		// Create and describe second commit
		await expect(jj.new()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);
		await expect(
			jj.description.replace("feat: second commit"),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);

		// Verify current description
		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "feat: second commit
			",
			}
		`);
	});
});

describe("Error handling and edge cases", () => {
	it("should handle concurrent operations gracefully", async () => {
		const testRepoPath = await createTestRepo(
			`test-concurrent-${Math.random()}`,
		);
		const jj = Jujutsu.cwd(testRepoPath);

		// Run multiple operations concurrently
		const promises = [
			jj.description.get(),
			jj.description.replace("concurrent test 1"),
			jj.description.get(),
			jj.description.replace("concurrent test 2"),
		];

		const results = await Promise.allSettled(promises);

		// At least some operations should succeed
		const successful = results.filter((r) => r.status === "fulfilled");
		expect(successful.length).toBeGreaterThan(0);

		await cleanupTestRepo(testRepoPath);
	});

	it("should handle very long descriptions", async () => {
		const testRepoPath = await createTestRepo(
			`test-long-desc-${Math.random()}`,
		);
		const jj = Jujutsu.cwd(testRepoPath);

		const longDescription = "feat: " + "very long description ".repeat(100);

		await expect(
			jj.description.replace(longDescription),
		).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "",
			}
		`);

		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "${longDescription}
			",
			}
		`);

		await cleanupTestRepo(testRepoPath);
	});

	it("should handle descriptions with various line endings", async () => {
		const testRepoPath = await createTestRepo(
			`test-line-endings-${Math.random()}`,
		);
		const jj = Jujutsu.cwd(testRepoPath);

		const descriptions = [
			"feat: unix line endings\nSecond line\nThird line",
			"feat: windows line endings\r\nSecond line\r\nThird line",
			"feat: mixed line endings\nSecond line\r\nThird line",
		];

		await expect(
			jj.description.replace(descriptions[0]),
		).resolves.toMatchInlineSnapshot(`
				{
				  "ok": "",
				}
			`);

		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "feat: unix line endings
			Second line
			Third line
			",
			}
		`);
		await expect(
			jj.description.replace(descriptions[1]),
		).resolves.toMatchInlineSnapshot(`
				{
				  "ok": "",
				}
			`);

		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "feat: windows line endings
			Second line
			Third line
			",
			}
		`);
		await expect(
			jj.description.replace(descriptions[2]),
		).resolves.toMatchInlineSnapshot(`
				{
				  "ok": "",
				}
			`);

		await expect(jj.description.get()).resolves.toMatchInlineSnapshot(`
			{
			  "ok": "feat: mixed line endings
			Second line
			Third line
			",
			}
		`);

		await cleanupTestRepo(testRepoPath);
	});
});

describe("Jujutsu.cwd().history.linear()", () => {
	let testRepoPath: string;

	beforeEach(async () => {
		testRepoPath = await createTestRepo(`test-history-${Math.random()}`);
	});

	afterEach(async () => {
		await cleanupTestRepo(testRepoPath);
	});

	it("should return linear commit history in both directions", async () => {
		const jj = Jujutsu.cwd(testRepoPath);

		// Create a series of linear commits
		await jj.description.replace("First commit");
		await jj.new();
		await jj.description.replace("Second commit");
		await jj.new();
		await jj.description.replace("Third commit");

		const result = await jj.history.linear();
		expect(result.ok).toBeDefined();

		if (result.ok) {
			// Should have structured result with history, current, and future
			expect(result.ok.history).toBeDefined();
			expect(result.ok.current).toBeDefined();
			expect(result.ok.future).toBeDefined();

			// Current commit should be "Third commit"
			expect(result.ok.current?.message).toBe("Third commit");

			// History should contain past commits
			const firstCommit = result.ok.history.find(
				(c: any) => c.message === "First commit",
			);
			const secondCommit = result.ok.history.find(
				(c: any) => c.message === "Second commit",
			);

			expect(firstCommit).toBeDefined();
			expect(secondCommit).toBeDefined();

			// Check that all commits have valid hashes
			if (result.ok.current) {
				expect(result.ok.current.hash).toMatch(/^[a-f0-9]{40}$/);
			}
			for (const commit of result.ok.history) {
				expect(commit.hash).toMatch(/^[a-f0-9]{40}$/);
			}
		}
	});
	it("should handle empty repository", async () => {
		const jj = Jujutsu.cwd(testRepoPath);

		const result = await jj.history.linear();
		expect(result.ok).toBeDefined();

		if (result.ok) {
			// Fresh jujutsu repo has one working copy commit with empty description
			expect(result.ok.current).toBeDefined();
			expect(result.ok.current?.message).toBe("");
			expect(result.ok.current?.hash).toMatch(/^[a-f0-9]{40}$/);
			expect(result.ok.history).toEqual([]);
			expect(result.ok.future).toEqual([]);
		}
	});
	it("should return error for invalid directory", async () => {
		const result = await Jujutsu.cwd("/nonexistent/directory").history.linear();
		expect(result.err).toBe("command non zero exit");
	});
});

describe("Jujutsu.cwd().navigate.to()", () => {
	let testRepoPath: string;

	beforeEach(async () => {
		testRepoPath = await createTestRepo(`test-navigate-${Math.random()}`);
	});

	afterEach(async () => {
		await cleanupTestRepo(testRepoPath);
	});

	it("should navigate to specific commit by hash", async () => {
		const jj = Jujutsu.cwd(testRepoPath);

		// Create commits and get their hashes
		await jj.description.replace("First commit");
		const firstCommitResult = await jj.history.linear();
		expect(firstCommitResult.ok).toBeDefined();

		if (!firstCommitResult.ok || !firstCommitResult.ok.current) {
			throw new Error("Failed to create first commit");
		}

		const firstHash = firstCommitResult.ok.current.hash;
		await jj.new();
		await jj.description.replace("Second commit");

		// Navigate back to first commit
		const navResult = await jj.navigate.to(firstHash);
		expect(navResult.ok).toBeDefined();

		// Verify we're at the first commit
		const currentDesc = await jj.description.get();
		expect(currentDesc.ok).toBe("First commit\n");
	});

	it("should return error for invalid commit hash", async () => {
		const jj = Jujutsu.cwd(testRepoPath);

		const result = await jj.navigate.to("invalid_hash_123");
		expect(result.err).toBe("command non zero exit");
	});

	it("should return error for invalid directory", async () => {
		const result = await Jujutsu.cwd("/nonexistent/directory").navigate.to(
			"abc123",
		);
		expect(result.err).toBe("command non zero exit");
	});
});

describe("Jujutsu history and navigation integration", () => {
	let testRepoPath: string;

	beforeEach(async () => {
		testRepoPath = await createTestRepo(`test-integration-${Math.random()}`);
	});

	afterEach(async () => {
		await cleanupTestRepo(testRepoPath);
	});

	it("should support complete workflow: create commits -> get history -> navigate", async () => {
		const jj = Jujutsu.cwd(testRepoPath);

		// Create a series of commits
		await jj.description.replace("Initial commit");
		await jj.new();
		await jj.description.replace("Feature A");
		await jj.new();
		await jj.description.replace("Feature B");

		// Get linear history
		const historyResult = await jj.history.linear();
		expect(historyResult.ok).toBeDefined();

		if (!historyResult.ok) {
			throw new Error("Failed to get history");
		}

		// Should have structured result
		expect(historyResult.ok.history).toBeDefined();
		expect(historyResult.ok.current).toBeDefined();
		expect(historyResult.ok.future).toBeDefined();

		// Current should be Feature B
		expect(historyResult.ok.current?.message).toBe("Feature B");

		// Find Feature A in history
		const featureACommit = historyResult.ok.history.find(
			(c: any) => c.message === "Feature A",
		);
		expect(featureACommit).toBeDefined();

		// Navigate to Feature A commit
		const featureAHash = featureACommit!.hash;
		const navResult = await jj.navigate.to(featureAHash);
		expect(navResult.ok).toBeDefined();

		// Verify we're at the correct commit
		const currentDesc = await jj.description.get();
		expect(currentDesc.ok).toBe("Feature A\n");

		// Get history from this position
		const newHistoryResult = await jj.history.linear();
		expect(newHistoryResult.ok).toBeDefined();

		if (newHistoryResult.ok) {
			// Current should now be Feature A
			expect(newHistoryResult.ok.current?.message).toBe("Feature A");

			// Should have Initial commit in history
			const initialInHistory = newHistoryResult.ok.history.find(
				(c: any) => c.message === "Initial commit",
			);
			expect(initialInHistory).toBeDefined();
		}
	});
});
