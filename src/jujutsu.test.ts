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
