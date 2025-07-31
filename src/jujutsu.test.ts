import { describe, expect, it, vi } from "vitest";
import {
	type CommandExecutor,
	checkCommitStatus,
	executeJujutsuCommand,
	getCurrentCommit,
	JujutsuError,
	parseCommandOutput,
	updateCommitDescription,
	validateRepository,
} from "./jujutsu.js";

describe("executeJujutsuCommand", () => {
	describe("successful execution", () => {
		it("should execute command and return result", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "test output",
				stderr: "",
			});

			const result = await executeJujutsuCommand(["status"], mockExecutor);

			expect(mockExecutor).toHaveBeenCalledWith("jj status");
			expect(result).toEqual({
				stdout: "test output",
				stderr: "",
		});

		it("should handle commits with empty lines that should be filtered", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  (empty)
│  (no description set)
~

@
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			// This tests lines 237-238 and 266-269 in jujutsu.ts
			expect(result.isEmpty).toBe(true);
			expect(result.hasModifications).toBe(false);
		});

		it("should handle commits with commit header lines that should be filtered", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: test commit
~
abc123def    user@example.com    2024-01-01 12:00:00`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			// This tests line 269 regex pattern for commit header filtering
			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(false);
		});
		});
	});
		it("should handle commands with multiple arguments", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "log output",
				stderr: "",
			});

			await executeJujutsuCommand(
				["log", "-r", "@", "--summary"],
				mockExecutor,
			);

			expect(mockExecutor).toHaveBeenCalledWith("jj log -r @ --summary");
		});

		it("should handle stderr without errors", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "output",
				stderr: "warning: some warning",
			});

			const result = await executeJujutsuCommand(["status"], mockExecutor);

			expect(result.stderr).toBe("warning: some warning");
		});
	});

	describe("error handling", () => {
		it("should throw JujutsuError for command not found", async () => {
			const mockExecutor: CommandExecutor = vi
				.fn()
				.mockRejectedValue(new Error("command not found: jj"));

			await expect(
				executeJujutsuCommand(["status"], mockExecutor),
			).rejects.toThrow(JujutsuError);

			await expect(
				executeJujutsuCommand(["status"], mockExecutor),
			).rejects.toThrow("Jujutsu (jj) command not found");
		});

		it("should throw JujutsuError for ENOENT", async () => {
			const mockExecutor: CommandExecutor = vi
				.fn()
				.mockRejectedValue(new Error("spawn jj ENOENT"));

			await expect(
				executeJujutsuCommand(["status"], mockExecutor),
			).rejects.toThrow("Jujutsu (jj) command not found");
		});

		it("should detect jujutsu errors in stderr", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: not a jj repo",
			});

			await expect(
				executeJujutsuCommand(["status"], mockExecutor),
			).rejects.toThrow(JujutsuError);

			await expect(
				executeJujutsuCommand(["status"], mockExecutor),
			).rejects.toThrow("Jujutsu error: Error: not a jj repo");
		});

		it("should detect various jujutsu error patterns", async () => {
			const errorPatterns = [
				"Error: something went wrong",
				"error: invalid command",
				"fatal: repository not found",
				"not a jj repo",
				"No such revision: abc123",
				"Invalid revision: xyz",
				"Permission denied",
				"Repository not found",
			];

			for (const errorMsg of errorPatterns) {
				const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
					stdout: "",
					stderr: errorMsg,
				});

				await expect(
					executeJujutsuCommand(["status"], mockExecutor),
				).rejects.toThrow(JujutsuError);
			}
		});

		it("should handle generic execution errors", async () => {
			const mockExecutor: CommandExecutor = vi
				.fn()
				.mockRejectedValue(new Error("Generic error"));

			await expect(
				executeJujutsuCommand(["status"], mockExecutor),
			).rejects.toThrow(
				"Unexpected error executing jujutsu command: Generic error",
			);
		});

		it("should handle unknown errors", async () => {
			const mockExecutor: CommandExecutor = vi
				.fn()
				.mockRejectedValue("string error");

			await expect(
				executeJujutsuCommand(["status"], mockExecutor),
			).rejects.toThrow("Unknown error executing jujutsu command");
		});

		it("should preserve error details in JujutsuError", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: test error",
			});

			try {
				await executeJujutsuCommand(["status"], mockExecutor);
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(JujutsuError);
				const jjError = error as JujutsuError;
				expect(jjError.command).toBe("jj status");
				expect(jjError.stderr).toBe("Error: test error");
			}
		});
	});
});

describe("getCurrentCommit", () => {
	it("should return current commit description", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "feat: test commit\n\nDescription here.\n",
			stderr: "",
		});

		const result = await getCurrentCommit(mockExecutor);

		expect(mockExecutor).toHaveBeenCalledWith(
			"jj log -r @ -T builtin_log_compact_full_description",
		);
		expect(result).toBe("feat: test commit\n\nDescription here.");
	});

	it("should handle empty commit", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "\n",
			stderr: "",
		});

		const result = await getCurrentCommit(mockExecutor);
		expect(result).toBe("");
	});

	it("should propagate jujutsu errors", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Error: not a jj repo",
		});

		await expect(getCurrentCommit(mockExecutor)).rejects.toThrow(JujutsuError);
	});
});

describe("updateCommitDescription", () => {
	it("should update commit description", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "",
		});

		await updateCommitDescription("feat: new feature", mockExecutor);

		expect(mockExecutor).toHaveBeenCalledWith("jj desc -m feat: new feature");
	});

	it("should reject empty description", async () => {
		const mockExecutor: CommandExecutor = vi.fn();

		await expect(updateCommitDescription("", mockExecutor)).rejects.toThrow(
			JujutsuError,
		);

		await expect(updateCommitDescription("   ", mockExecutor)).rejects.toThrow(
			"Commit description cannot be empty",
		);

		expect(mockExecutor).not.toHaveBeenCalled();
	});

	it("should handle multiline descriptions", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "",
		});

		const description = "feat: test\n\nMultiline description\nwith details";
		await updateCommitDescription(description, mockExecutor);

		expect(mockExecutor).toHaveBeenCalledWith(`jj desc -m ${description}`);
	});

	it("should propagate jujutsu errors", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Error: permission denied",
		});

		await expect(
			updateCommitDescription("feat: test", mockExecutor),
		).rejects.toThrow(JujutsuError);
	});
});

describe("checkCommitStatus", () => {
	describe("empty commits", () => {
		it("should detect truly empty commit", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout:
					"@  abcd1234 user@example.com 2024-01-01 12:00:00\n│  (empty) (no description set)\n~",
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(true);
			expect(result.hasModifications).toBe(false);
		});

		it("should detect empty commit with no description", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "@  abcd1234 user@example.com 2024-01-01 12:00:00\n│  \n~",
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(true);
			expect(result.hasModifications).toBe(false);
		});

		it("should detect commit with only whitespace description", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "@  abcd1234 user@example.com 2024-01-01 12:00:00\n│     \n~\n",
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(true);
		});
	});

	describe("commits with modifications", () => {
		it("should detect commit with file modifications", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: test commit
~  A src/test.ts
   M package.json
   D old-file.txt`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should detect commit with description but no file changes", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: test commit
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should handle various file modification patterns", async () => {
			const modificationPatterns = [
				"A src/new-file.ts",
				"M existing-file.js",
				"D deleted-file.txt",
				"   A  spaced-file.md",
				"\tM\ttab-file.py",
			];

			for (const pattern of modificationPatterns) {
				const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
					stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00\n│  test\n~  ${pattern}`,
					stderr: "",
				});

				const result = await checkCommitStatus(mockExecutor);
				expect(result.hasModifications).toBe(true);
			}
		});

		it("should return full summary", async () => {
			const summaryOutput =
				"@  abcd1234 user@example.com\n│  test commit\n~  A file.ts";
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: summaryOutput,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.summary).toBe(summaryOutput);
		});

		it("should handle complex commit descriptions", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat(scope): complex commit
│  
│  Multi-line description
│  with details
~  A src/file.ts`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});
	});

	describe("error handling", () => {
		it("should propagate jujutsu errors", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: not a jj repo",
			});

			await expect(checkCommitStatus(mockExecutor)).rejects.toThrow(
				JujutsuError,
			);
		});
	});
});

describe("validateRepository", () => {
	it("should succeed for valid repository", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "Working copy: @\n",
			stderr: "",
		});

		await expect(validateRepository(mockExecutor)).resolves.toBeUndefined();
		expect(mockExecutor).toHaveBeenCalledWith("jj status");
	});

	it("should throw specific error for non-jj repository", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Error: not a jj repo",
		});

		await expect(validateRepository(mockExecutor)).rejects.toThrow(
			"Current directory is not a jujutsu repository",
		);
	});

	it("should throw specific error for permission denied", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Permission denied accessing .jj directory",
		});

		await expect(validateRepository(mockExecutor)).rejects.toThrow(
			"Permission denied accessing repository",
		);
	});

	it("should propagate other jujutsu errors", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Error: corrupted repository",
		});

		await expect(validateRepository(mockExecutor)).rejects.toThrow(
			JujutsuError,
		);
	});
});

describe("parseCommandOutput", () => {
	it("should parse normal output", () => {
		const output = "  normal output  \n";
		const result = parseCommandOutput(output, "jj status");
		expect(result).toBe("normal output");
	});

	it("should handle empty output", () => {
		const result = parseCommandOutput("", "jj status");
		expect(result).toBe("");
	});

	it("should handle whitespace-only output", () => {
		const result = parseCommandOutput("   \n  \t  ", "jj status");
		expect(result).toBe("");
	});

	it("should detect invalid characters", () => {
		const output = "output with � invalid chars";
		expect(() => parseCommandOutput(output, "jj status")).toThrow(
			"Command output contains invalid characters",
		);
	});

	it("should detect null bytes", () => {
		const output = "output with \x00 null byte";
		expect(() => parseCommandOutput(output, "jj status")).toThrow(
			"Command output contains invalid characters",
		);
	});

	it("should detect truncated output", () => {
		const output = "output that is truncated...";
		expect(() => parseCommandOutput(output, "jj status")).toThrow(
			"Command output appears to be truncated",
		);
	});

	it("should detect truncation markers", () => {
		const output = "output...truncated...more";
		expect(() => parseCommandOutput(output, "jj status")).toThrow(
			"Command output appears to be truncated",
		);
	});

	it("should handle parsing errors gracefully", () => {
		// Simulate a scenario where string operations might fail
		const originalTrim = String.prototype.trim;
		String.prototype.trim = () => {
			throw new Error("Mock trim error");
		};

		try {
			expect(() => parseCommandOutput("test", "jj status")).toThrow(
				"Failed to parse command output",
			);
		} finally {
			String.prototype.trim = originalTrim;
		}
	});
});

describe("Real-world jujutsu integration scenarios", () => {
	describe("Repository state detection", () => {
		it("should handle corrupted repository", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: Corrupted repository detected",
			});

			await expect(validateRepository(mockExecutor)).rejects.toThrow(
				"Jujutsu error: Error: Corrupted repository detected",
			);
		});

		it("should handle locked workspace", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: Workspace is locked by another process",
			});

			await expect(
				executeJujutsuCommand(["status"], mockExecutor),
			).rejects.toThrow("Workspace is locked");
		});

		it("should handle network issues during remote operations", async () => {
			const networkError = new Error("Network timeout");
			(networkError as any).code = 1;
			(networkError as any).stderr = "fatal: unable to connect to remote";

			const mockExecutor: CommandExecutor = vi
				.fn()
				.mockRejectedValue(networkError);

			await expect(
				executeJujutsuCommand(["fetch"], mockExecutor),
			).rejects.toThrow(
				"Unexpected error executing jujutsu command: Network timeout",
			);
		});
	});

	describe("Commit description edge cases", () => {
		it("should handle very long commit descriptions", async () => {
			const longDescription = "a".repeat(10000);
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "",
			});

			await expect(
				updateCommitDescription(longDescription, mockExecutor),
			).resolves.toBeUndefined();
			expect(mockExecutor).toHaveBeenCalledWith(
				`jj desc -m ${longDescription}`,
			);
		});

		it("should handle commit descriptions with special characters", async () => {
			const specialDescription =
				"feat: add \"quotes\" and 'apostrophes' and $variables and `backticks`";
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "",
			});

			await expect(
				updateCommitDescription(specialDescription, mockExecutor),
			).resolves.toBeUndefined();
			expect(mockExecutor).toHaveBeenCalledWith(
				`jj desc -m ${specialDescription}`,
			);
		});

		it("should handle commit descriptions with unicode characters", async () => {
			const unicodeDescription =
				"feat: add emoji support 🚀 and unicode chars ñáéíóú";
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "",
			});

			await expect(
				updateCommitDescription(unicodeDescription, mockExecutor),
			).resolves.toBeUndefined();
		});

		it("should reject null description", async () => {
			const mockExecutor: CommandExecutor = vi.fn();

			await expect(
				updateCommitDescription(null as any, mockExecutor),
			).rejects.toThrow("Commit description cannot be empty");
		});

		it("should reject undefined description", async () => {
			const mockExecutor: CommandExecutor = vi.fn();

			await expect(
				updateCommitDescription(undefined as any, mockExecutor),
			).rejects.toThrow("Commit description cannot be empty");
		});
	});

	describe("Complex commit status parsing", () => {
		it("should handle commits with mixed file operations", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: complex changes
~  A src/new-file.ts
   M src/existing-file.js
   D src/old-file.txt
   A tests/new-test.spec.ts
   M package.json`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
			expect(result.summary).toContain("feat: complex changes");
		});

		it("should handle commits with binary file changes", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: add binary assets
~  A assets/image.png
   A assets/font.woff2
   M src/config.json`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle commits with renamed files", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  refactor: rename files
~  D src/old-name.ts
   A src/new-name.ts`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle commits with deeply nested file paths", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: add deep structure
~  A src/components/ui/forms/inputs/TextInput.tsx
   A src/utils/helpers/validation/schema/userSchema.ts
   M config/environments/production/database.json`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle commits with unusual jujutsu formatting", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: test unusual formatting
│  
│  This is a multi-line description
│  with several lines of detail
~
@
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(false);
		});

		it("should handle commits with @ and ~ symbols in description", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: add @ symbol and ~ tilde support
│  
│  This commit adds support for @ and ~ symbols in text
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(false);
		});

		it("should handle empty commits with commit hash patterns in description", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  Reference commit abc123def user@example.com 2024-01-01
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false); // Actually has a description, so not empty
			expect(result.hasModifications).toBe(false);
		});
	});

	describe("Error recovery and resilience", () => {
		it("should handle partial command execution", async () => {
			const interruptError = new Error("Command interrupted");
			(interruptError as any).code = 130; // SIGINT
			(interruptError as any).stderr = "Interrupted by user";

			const mockExecutor: CommandExecutor = vi
				.fn()
				.mockRejectedValue(interruptError);

			await expect(
				executeJujutsuCommand(["log"], mockExecutor),
			).rejects.toThrow(
				"Unexpected error executing jujutsu command: Command interrupted",
			);
		});

		it("should handle disk space issues", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: No space left on device",
			});

			await expect(
				executeJujutsuCommand(["commit"], mockExecutor),
			).rejects.toThrow("No space left on device");
		});

		it("should handle permission issues on specific files", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: Permission denied: .jj/repo/store",
			});

			await expect(validateRepository(mockExecutor)).rejects.toThrow(
				"Permission denied accessing repository",
			);
		});

		it("should handle concurrent jujutsu operations", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: Lock file exists: .jj/repo/op_store/lock",
			});

			await expect(
				executeJujutsuCommand(["commit"], mockExecutor),
			).rejects.toThrow("Lock file exists");
		});
	});

	describe("Command argument handling", () => {
		it("should handle commands with no arguments", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "jj 0.12.0\n",
				stderr: "",
			});

			const result = await executeJujutsuCommand([], mockExecutor);

			expect(mockExecutor).toHaveBeenCalledWith("jj ");
			expect(result.stdout).toBe("jj 0.12.0\n");
		});

		it("should handle commands with complex arguments", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "log output",
				stderr: "",
			});

			await executeJujutsuCommand(
				[
					"log",
					"-r",
					"@..main",
					"--template",
					'commit_id ++ " " ++ description.first_line()',
					"--",
					"src/",
				],
				mockExecutor,
			);

			expect(mockExecutor).toHaveBeenCalledWith(
				'jj log -r @..main --template commit_id ++ " " ++ description.first_line() -- src/',
			);
		});

		it("should handle arguments with spaces and special characters", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "",
			});

			await executeJujutsuCommand(
				["desc", "-m", "feat: add support for files with spaces.txt"],
				mockExecutor,
			);

			expect(mockExecutor).toHaveBeenCalledWith(
				"jj desc -m feat: add support for files with spaces.txt",
			);
		});
	});

	describe("Output parsing edge cases", () => {
		it("should handle output with mixed line endings", () => {
			const output = "line1\r\nline2\nline3\r\n";
			const result = parseCommandOutput(output, "jj status");
			expect(result).toBe("line1\r\nline2\nline3");
		});

		it("should handle output with only whitespace", () => {
			const output = "   \t\n  \r\n  ";
			const result = parseCommandOutput(output, "jj status");
			expect(result).toBe("");
		});

		it("should handle output with control characters", () => {
			const output = "normal text\x1b[31mred text\x1b[0m";
			const result = parseCommandOutput(output, "jj status");
			expect(result).toBe("normal text\x1b[31mred text\x1b[0m");
		});

		it("should handle very large output", () => {
			const largeOutput = "line\n".repeat(10000);
			const result = parseCommandOutput(largeOutput, "jj log");
			expect(result).toBe(largeOutput.trim());
		});
	});
});

describe("Integration with real jujutsu behavior", () => {
	describe("Realistic commit status scenarios", () => {
		it("should handle merge commits", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  merge123 user@example.com 2024-01-01 12:00:00
│  Merge branch 'feature' into main
│  
│  Merged changes from feature branch
~  M src/main.ts
   M tests/main.test.ts`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle commits with conflict markers in description", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  conflict1 user@example.com 2024-01-01 12:00:00
│  fix: resolve conflicts in <<<< HEAD sections
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(false);
		});

		it("should handle working copy with uncommitted changes", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  working12 user@example.com 2024-01-01 12:00:00
│  (no description set)
~  M src/file.ts
   A new-file.js`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false); // Has modifications
			expect(result.hasModifications).toBe(true);
		});
	});
});
