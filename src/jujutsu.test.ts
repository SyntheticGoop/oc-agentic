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

			expect(mockExecutor).toHaveBeenCalledWith(["status"]);
			expect(result).toEqual({
				stdout: "test output",
				stderr: "",
			});
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

		it("should handle commands with multiple arguments", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "log output",
				stderr: "",
			});

			await executeJujutsuCommand(
				["log", "-r", "@", "--summary"],
				mockExecutor,
			);

			expect(mockExecutor).toHaveBeenCalledWith([
				"log",
				"-r",
				"@",
				"--summary",
			]);
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
});

describe("error handling", () => {
	it("should throw JujutsuError for command not found", async () => {
		const mockExecutor: CommandExecutor = vi
			.fn()
			.mockRejectedValue(new Error("command not found: jj"));

		await expect(
			executeJujutsuCommand(["status"], mockExecutor),
		).rejects.toThrow(JujutsuError);
	});

	it("should throw JujutsuError for ENOENT", async () => {
		const mockExecutor: CommandExecutor = vi
			.fn()
			.mockRejectedValue(new Error("ENOENT: no such file or directory"));

		await expect(
			executeJujutsuCommand(["status"], mockExecutor),
		).rejects.toThrow(JujutsuError);
	});

	it("should detect jujutsu errors in stderr", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Error: No jj repo in current path",
		});

		await expect(
			executeJujutsuCommand(["status"], mockExecutor),
		).rejects.toThrow(JujutsuError);
	});

	it("should detect various jujutsu error patterns", async () => {
		const errorPatterns = [
			"Error: No jj repo in current path",
			"Error: Invalid revision",
			"Error: Workspace is locked",
			"Error: Failed to read config",
			"Error: Permission denied",
			"Error: Network error",
			"Error: Merge conflict",
			"Error: Invalid argument",
			"Error: File not found",
			"Error: Operation failed",
			"fatal: Repository corruption detected",
			"fatal: Unable to write to repository",
			"fatal: Disk full",
			"Warning: This is a warning, not an error",
		];

		for (const errorMessage of errorPatterns) {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: errorMessage,
			});

			if (errorMessage.startsWith("Warning:")) {
				// Warnings should not throw
				await expect(
					executeJujutsuCommand(["status"], mockExecutor),
				).resolves.toBeDefined();
			} else if (errorMessage.startsWith("Fatal:")) {
				// Fatal errors should throw
				await expect(
					executeJujutsuCommand(["status"], mockExecutor),
				).rejects.toThrow(JujutsuError);
			} else {
				// Other errors should throw
				await expect(
					executeJujutsuCommand(["status"], mockExecutor),
				).rejects.toThrow(JujutsuError);
			}
		}
	});

	it("should handle generic execution errors", async () => {
		const mockExecutor: CommandExecutor = vi
			.fn()
			.mockRejectedValue(new Error("Generic error"));

		await expect(
			executeJujutsuCommand(["status"], mockExecutor),
		).rejects.toThrow(JujutsuError);
	});

	it("should handle unknown errors", async () => {
		const mockExecutor: CommandExecutor = vi
			.fn()
			.mockRejectedValue("string error");

		await expect(
			executeJujutsuCommand(["status"], mockExecutor),
		).rejects.toThrow();
	});

	it("should preserve error details in JujutsuError", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Error: No jj repo in current path",
		});

		try {
			await executeJujutsuCommand(["status"], mockExecutor);
			expect.fail("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(JujutsuError);
			const jjError = error as JujutsuError;
			expect(jjError.command).toBe("jj status");
			expect(jjError.stderr).toBe("Error: No jj repo in current path");
		}
	});
});

describe("getCurrentCommit", () => {
	it("should return current commit description", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "feat: test commit\n\nDescription here.\n",
			stderr: "",
		});

		const result = await getCurrentCommit(mockExecutor);

		expect(mockExecutor).toHaveBeenCalledWith([
			"log",
			"-r",
			"@",
			"--no-graph",
			"-T",
			"description",
		]);
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
			stderr: "Error: No jj repo in current path",
		});

		await expect(getCurrentCommit(mockExecutor)).rejects.toThrow(JujutsuError);
	});
});

describe("updateCommitDescription", () => {
	it("should update commit description", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "Updated commit description",
			stderr: "",
		});

		await updateCommitDescription("New description", mockExecutor);

		expect(mockExecutor).toHaveBeenCalledWith([
			"desc",
			"-m",
			"New description",
		]);
	});

	it("should reject empty description", async () => {
		const mockExecutor: CommandExecutor = vi.fn();

		await expect(updateCommitDescription("", mockExecutor)).rejects.toThrow(
			"Commit description cannot be empty",
		);

		await expect(updateCommitDescription("   ", mockExecutor)).rejects.toThrow(
			"Commit description cannot be empty",
		);
	});

	it("should handle multiline descriptions", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "Updated commit description",
			stderr: "",
		});

		const multilineDescription = "Line 1\nLine 2\nLine 3";
		await updateCommitDescription(multilineDescription, mockExecutor);

		expect(mockExecutor).toHaveBeenCalledWith([
			"desc",
			"-m",
			"Line 1\nLine 2\nLine 3",
		]);
	});

	it("should propagate jujutsu errors", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Error: No jj repo in current path",
		});

		await expect(
			updateCommitDescription("New description", mockExecutor),
		).rejects.toThrow(JujutsuError);
	});
});

describe("checkCommitStatus", () => {
	describe("empty commits", () => {
		it("should detect truly empty commit", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  (empty)
│  (no description set)
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(true);
			expect(result.hasModifications).toBe(false);
		});

		it("should detect empty commit with no description", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  (empty)
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(true);
		});

		it("should detect commit with only whitespace description", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  
│     
~`,
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
│  feat: add new feature
│  
│  M src/file.ts
│  A src/new-file.ts
│  D src/old-file.ts
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should detect commit with description but no file changes", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: add new feature
│  
│  This is a detailed description
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
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  refactor: reorganize code
│  
│  M  src/main.ts
│  A  tests/new-test.ts
│  D  legacy/old-code.js
│  R  src/utils.ts -> src/helpers.ts
│  C  src/config.json -> src/settings.json
│  !  src/broken.ts
│  ?  untracked.tmp
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should return full summary", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: implement user authentication
│  
│  Added login and logout functionality
│  M src/auth.ts
│  A src/login.ts
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.summary).toContain("feat: implement user authentication");
			expect(result.summary).toContain("Added login and logout functionality");
		});

		it("should handle complex commit descriptions", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat(auth): implement OAuth2 integration
│  
│  - Add OAuth2 client configuration
│  - Implement token refresh mechanism  
│  - Add user profile fetching
│  
│  Breaking changes:
│  - Remove legacy auth methods
│  
│  M src/auth/oauth.ts
│  A src/auth/tokens.ts
│  D src/auth/legacy.ts
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
			expect(result.summary).toContain("OAuth2 integration");
		});
	});

	describe("error handling", () => {
		it("should propagate jujutsu errors", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: No jj repo in current path",
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
			stdout: "Valid repository",
			stderr: "",
		});

		await expect(validateRepository(mockExecutor)).resolves.toBeUndefined();
	});

	it("should throw specific error for non-jj repository", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Error: No jj repo in current path",
		});

		await expect(validateRepository(mockExecutor)).rejects.toThrow(
			JujutsuError,
		);
	});

	it("should throw specific error for permission denied", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Error: Permission denied",
		});

		await expect(validateRepository(mockExecutor)).rejects.toThrow(
			"Permission denied",
		);
	});

	it("should propagate other jujutsu errors", async () => {
		const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
			stdout: "",
			stderr: "Error: Some other error",
		});

		await expect(validateRepository(mockExecutor)).rejects.toThrow(
			JujutsuError,
		);
	});
});

describe("parseCommandOutput", () => {
	it("should parse normal output", () => {
		const output = "line1\nline2\nline3";
		const result = parseCommandOutput(output, "jj status");
		expect(result).toBe("line1\nline2\nline3");
	});

	it("should handle empty output", () => {
		const result = parseCommandOutput("", "jj status");
		expect(result).toBe("");
	});

	it("should handle whitespace-only output", () => {
		const result = parseCommandOutput("   \n  \n   ", "jj status");
		expect(result).toBe("");
	});

	it("should detect invalid characters", () => {
		const invalidOutput = "line1\x00line2";
		expect(() => parseCommandOutput(invalidOutput, "jj status")).toThrow(
			"invalid characters",
		);
	});

	it("should detect null bytes", () => {
		const nullByteOutput = "line1\0line2";
		expect(() => parseCommandOutput(nullByteOutput, "jj status")).toThrow(
			"invalid characters",
		);
	});

	it("should detect truncated output", () => {
		const truncatedOutput = "line1\nline2\n...truncated...";
		expect(() => parseCommandOutput(truncatedOutput, "jj status")).toThrow(
			"truncated",
		);
	});

	it("should detect truncation markers", () => {
		const output = "line1\nline2\n...";
		expect(() => parseCommandOutput(output, "jj status")).toThrow("truncated");
	});

	it("should handle parsing errors gracefully", () => {
		// Test with extremely long lines that might cause parsing issues
		const longLine = "x".repeat(100000);
		const result = parseCommandOutput(longLine, "jj status");
		expect(result).toBe(longLine);
	});
});

describe("Real-world jujutsu integration scenarios", () => {
	describe("Repository state detection", () => {
		it("should handle corrupted repository", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: Repository corruption detected",
			});

			await expect(checkCommitStatus(mockExecutor)).rejects.toThrow(
				JujutsuError,
			);
		});

		it("should handle locked workspace", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: Workspace is locked",
			});

			await expect(checkCommitStatus(mockExecutor)).rejects.toThrow(
				JujutsuError,
			);
		});

		it("should handle network issues during remote operations", async () => {
			const networkError = new Error("Network timeout");
			(networkError as any).code = 1;
			(networkError as any).stderr = "fatal: unable to connect to remote";

			const mockExecutor: CommandExecutor = vi
				.fn()
				.mockRejectedValue(networkError);

			await expect(
				executeJujutsuCommand(["push"], mockExecutor),
			).rejects.toThrow(JujutsuError);
		});
	});

	describe("Commit description edge cases", () => {
		it("should handle very long commit descriptions", async () => {
			const longDescription = "A".repeat(10000);
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "Updated",
				stderr: "",
			});

			await updateCommitDescription(longDescription, mockExecutor);

			expect(mockExecutor).toHaveBeenCalledWith([
				"desc",
				"-m",
				longDescription,
			]);
		});

		it("should handle commit descriptions with special characters", async () => {
			const specialDescription =
				"Special chars: \"quotes\" 'apostrophes' $vars `backticks` \\backslashes";
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "Updated",
				stderr: "",
			});

			await updateCommitDescription(specialDescription, mockExecutor);

			expect(mockExecutor).toHaveBeenCalledWith([
				"desc",
				"-m",
				specialDescription,
			]);
		});

		it("should handle commit descriptions with unicode characters", async () => {
			const unicodeDescription = "Unicode: 🚀 émojis and açcénts";
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "Updated",
				stderr: "",
			});

			await updateCommitDescription(unicodeDescription, mockExecutor);

			expect(mockExecutor).toHaveBeenCalledWith([
				"desc",
				"-m",
				unicodeDescription,
			]);
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
│  feat: comprehensive file operations
│  
│  M  src/modified.ts      # Modified file
│  A  src/added.ts         # Added file  
│  D  src/deleted.ts       # Deleted file
│  R  old.ts -> new.ts     # Renamed file
│  C  src/copied.ts -> src/copy.ts  # Copied file
│  !  src/conflicted.ts    # Conflicted file
│  ?  untracked.tmp        # Untracked file
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle commits with binary file changes", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: add binary assets
│  
│  A  assets/image.png     (binary)
│  M  assets/logo.jpg      (binary, 1.2MB -> 1.5MB)
│  D  assets/old-icon.ico  (binary)
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle commits with renamed files", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  refactor: reorganize file structure
│  
│  R  src/utils/helper.ts -> src/lib/helper.ts
│  R  components/Button.tsx -> ui/Button.tsx
│  R  styles/main.css -> assets/styles/main.css
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle commits with deeply nested file paths", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  feat: add deep nested components
│  
│  A  src/components/ui/forms/inputs/text/TextInput.tsx
│  A  src/components/ui/forms/inputs/select/SelectInput.tsx
│  M  src/utils/validation/forms/input/validators.ts
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle commits with unusual jujutsu formatting", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  fix: handle edge case in parser
│  
│  Some unusual formatting here...
│  │  Nested content
│  │  │  More nesting
│  
│  M src/parser.ts
~
○  parent123 user@example.com 2024-01-01 11:00:00
│  previous commit
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle commits with @ and ~ symbols in description", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  fix: handle @ and ~ symbols in commit messages
│  
│  Fixed parsing of @ symbols and ~ tildes in descriptions
│  Also handle @mentions and ~references properly
│  
│  M src/parser.ts
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle empty commits with commit hash patterns in description", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  abcd1234 user@example.com 2024-01-01 12:00:00
│  (empty)
│  Reverts commit abc123def456 and fixes issue #123
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false); // Has description, so not empty
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
				executeJujutsuCommand(["log", "--all"], mockExecutor),
			).rejects.toThrow(JujutsuError);
		});

		it("should handle disk space issues", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: No space left on device",
			});

			await expect(
				updateCommitDescription("New description", mockExecutor),
			).rejects.toThrow(JujutsuError);
		});

		it("should handle permission issues on specific files", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: Permission denied: /protected/file.txt",
			});

			await expect(
				executeJujutsuCommand(["status"], mockExecutor),
			).rejects.toThrow(JujutsuError);
		});

		it("should handle concurrent jujutsu operations", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "",
				stderr: "Error: Another jj process is already running",
			});

			await expect(
				executeJujutsuCommand(["status"], mockExecutor),
			).rejects.toThrow(JujutsuError);
		});
	});

	describe("Command argument handling", () => {
		it("should handle commands with no arguments", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "jj help output",
				stderr: "",
			});

			await executeJujutsuCommand([], mockExecutor);

			expect(mockExecutor).toHaveBeenCalledWith([]);
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
					"builtin_log_oneline",
					"--limit",
					"10",
					"--reverse",
				],
				mockExecutor,
			);

			expect(mockExecutor).toHaveBeenCalledWith([
				"log",
				"-r",
				"@..main",
				"--template",
				"builtin_log_oneline",
				"--limit",
				"10",
				"--reverse",
			]);
		});

		it("should handle arguments with spaces and special characters", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: "Updated",
				stderr: "",
			});

			await updateCommitDescription(
				'Complex message with "quotes" and $pecial chars',
				mockExecutor,
			);

			expect(mockExecutor).toHaveBeenCalledWith([
				"desc",
				"-m",
				'Complex message with "quotes" and $pecial chars',
			]);
		});
	});

	describe("Output parsing edge cases", () => {
		it("should handle output with mixed line endings", () => {
			const mixedOutput = "line1\r\nline2\nline3\r";
			const result = parseCommandOutput(mixedOutput, "jj status");
			expect(result).toBe("line1\r\nline2\nline3"); // trim() removes trailing \r
		});

		it("should handle output with only whitespace", () => {
			const whitespaceOutput = "   \t   \n  \t  \n   \t   ";
			const result = parseCommandOutput(whitespaceOutput, "jj status");
			expect(result).toBe("");
		});

		it("should handle output with control characters", () => {
			const controlOutput = "line1\x1b[31mred text\x1b[0mline2";
			// The function only throws for � and \x00, not escape sequences
			const result = parseCommandOutput(controlOutput, "jj status");
			expect(result).toBe(controlOutput);
		});

		it("should handle very large output", () => {
			const largeOutput = Array(10000)
				.fill("line")
				.map((line, i) => `${line}${i}`)
				.join("\n");
			const result = parseCommandOutput(largeOutput, "jj status");
			expect(result).toBe(largeOutput);
		});
	});
});

describe("Integration with real jujutsu behavior", () => {
	describe("Realistic commit status scenarios", () => {
		it("should handle merge commits", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@    merge1234 user@example.com 2024-01-01 12:00:00
├─╮  Merge branch 'feature' into main
│ │  
│ │  M src/feature.ts
│ │  A tests/feature.test.ts
│ ○  feature456 user@example.com 2024-01-01 11:30:00
│ │  feat: implement new feature
│ │  
○ │  main789 user@example.com 2024-01-01 11:00:00
├─╯  fix: resolve bug in main
│    
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle commits with conflict markers in description", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  conflict123 user@example.com 2024-01-01 12:00:00
│  fix: resolve merge conflicts
│  
│  Resolved conflicts in:
│  <<<<<<< HEAD
│  - src/main.ts
│  =======
│  - src/app.ts  
│  >>>>>>> feature-branch
│  
│  M src/main.ts
│  M src/app.ts
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false);
			expect(result.hasModifications).toBe(true);
		});

		it("should handle working copy with uncommitted changes", async () => {
			const mockExecutor: CommandExecutor = vi.fn().mockResolvedValue({
				stdout: `@  working123 user@example.com 2024-01-01 12:00:00
│  (empty)
│  Working copy changes
│  
│  M src/file1.ts          # Modified in working copy
│  A src/file2.ts          # Added in working copy
│  D src/file3.ts          # Deleted in working copy
~`,
				stderr: "",
			});

			const result = await checkCommitStatus(mockExecutor);

			expect(result.isEmpty).toBe(false); // Has modifications
			expect(result.hasModifications).toBe(true);
		});
	});
});
