import { spawn } from "node:child_process";

export class JujutsuError extends Error {
	constructor(
		message: string,
		public readonly command: string,
		public readonly exitCode?: number,
		public readonly stderr?: string,
	) {
		super(message);
		this.name = "JujutsuError";
	}
}

export interface JujutsuResult {
	stdout: string;
	stderr: string;
}

// Injectable executor for testing
export type CommandExecutor = (args: string[]) => Promise<JujutsuResult>;

// Default executor using spawn (safer than exec for argument handling)
const defaultExecutor: CommandExecutor = async (args: string[]) => {
	return new Promise((resolve, reject) => {
		const child = spawn("jj", args, {
			stdio: ["pipe", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		child.stdout?.on("data", (data) => {
			stdout += data.toString();
		});

		child.stderr?.on("data", (data) => {
			stderr += data.toString();
		});

		child.on("error", (error) => {
			reject(
				new JujutsuError(
					`Command failed: ${error.message}`,
					`jj ${args.join(" ")}`,
					undefined,
					stderr,
				),
			);
		});

		child.on("close", (code) => {
			if (code === 0) {
				resolve({ stdout, stderr });
			} else {
				reject(
					new JujutsuError(
						`Command exited with code ${code}`,
						`jj ${args.join(" ")}`,
						code ?? undefined,
						stderr,
					),
				);
			}
		});
	});
};

export async function executeJujutsuCommand(
	args: string[],
	executor: CommandExecutor = defaultExecutor,
): Promise<JujutsuResult> {
	const command = `jj ${args.join(" ")}`;

	try {
		const result = await executor(args);

		// Check for jujutsu-specific errors in stderr
		if (result.stderr && isJujutsuError(result.stderr)) {
			throw new JujutsuError(
				`Jujutsu error: ${result.stderr.trim()}`,
				command,
				undefined,
				result.stderr,
			);
		}

		return result;
	} catch (error) {
		if (error instanceof JujutsuError) {
			throw error;
		}

		// Handle other errors (command not found, etc.)
		if (error instanceof Error) {
			if (
				error.message.includes("command not found") ||
				error.message.includes("ENOENT")
			) {
				throw new JujutsuError(
					"Jujutsu (jj) command not found. Please install jujutsu and ensure it's in your PATH.",
					command,
					127,
				);
			}

			throw new JujutsuError(
				`Unexpected error executing jujutsu command: ${error.message}`,
				command,
			);
		}

		throw new JujutsuError("Unknown error executing jujutsu command", command);
	}
}

function isJujutsuError(stderr: string): boolean {
	const errorPatterns = [
		"Error:",
		"error:",
		"fatal:",
		"not a jj repo",
		"No such revision",
		"Invalid revision",
		"Permission denied",
		"Repository not found",
		"Access denied",
		"Operation not permitted",
		"Invalid repository",
		"Corrupted repository",
		"Lock file exists",
		"Workspace is locked",
	];

	return errorPatterns.some((pattern) => stderr.includes(pattern));
}

export function validateRepository(executor?: CommandExecutor): Promise<void> {
	return executeJujutsuCommand(["status"], executor)
		.then(() => {
			// If status command succeeds, repository is valid
		})
		.catch((error) => {
			if (error instanceof JujutsuError) {
				if (error.stderr?.includes("not a jj repo")) {
					throw new JujutsuError(
						"Current directory is not a jujutsu repository. Please run 'jj init' or navigate to a jujutsu repository.",
						error.command,
						error.exitCode,
						error.stderr,
					);
				}
				if (
					error.stderr?.includes("Permission denied") ||
					error.stderr?.includes("Access denied")
				) {
					throw new JujutsuError(
						"Permission denied accessing repository. Please check file permissions and ownership.",
						error.command,
						error.exitCode,
						error.stderr,
					);
				}
			}
			throw error;
		});
}

export function parseCommandOutput(output: string, command: string): string {
	try {
		// Handle empty output
		if (!output || output.trim().length === 0) {
			return "";
		}

		// Check for malformed output patterns
		if (output.includes("�") || output.includes("\x00")) {
			throw new JujutsuError(
				"Command output contains invalid characters - possible encoding issue",
				command,
			);
		}

		// Check for truncated output
		if (output.includes("...truncated...") || output.endsWith("...")) {
			throw new JujutsuError("Command output appears to be truncated", command);
		}

		return output.trim();
	} catch (error) {
		if (error instanceof JujutsuError) {
			throw error;
		}
		throw new JujutsuError(
			`Failed to parse command output: ${error instanceof Error ? error.message : "Unknown error"}`,
			command,
		);
	}
}

export async function getCurrentCommit(
	executor?: CommandExecutor,
): Promise<string> {
	const result = await executeJujutsuCommand(
		["log", "-r", "@", "--no-graph", "-T", "description"],
		executor,
	);

	return result.stdout.trim();
}

export async function updateCommitDescription(
	description: string,
	executor?: CommandExecutor,
): Promise<void> {
	if (!description || description.trim().length === 0) {
		throw new JujutsuError("Commit description cannot be empty", "jj desc -m");
	}

	await executeJujutsuCommand(["desc", "-m", description], executor);
}

export async function checkCommitStatus(executor?: CommandExecutor): Promise<{
	isEmpty: boolean;
	hasModifications: boolean;
	summary: string;
}> {
	const result = await executeJujutsuCommand(
		["log", "-r", "@", "--summary"],
		executor,
	);

	const summary = result.stdout.trim();

	// Parse the summary to determine if commit is empty
	const lines = summary.split("\n");

	// Check for file modifications (lines that start with modification indicators)
	const hasModifications = lines.some((line) => {
		const trimmed = line.trim();
		// Check for file modifications in various formats:
		// "A file.txt", "   A file.txt", "~  A file.txt"
		return (
			trimmed.match(/^[AMDRC!?]\s+/) || // Standard format: "M file.txt"
			line.match(/^\s*[AMDRC!?]\s+/) || // Indented format: "   M file.txt"
			line.match(/^~\s+[AMDRC!?]\s+/) || // Jj format: "~  M file.txt"
			line.match(/^[│\s]*[AMDRC!?]\s+/)
		); // Jj format with any combination of pipes and spaces: "│  M file.txt", "│ │  M file.txt", etc.
	});

	// Check if commit has meaningful description
	const hasDescription = lines.some((line) => {
		const trimmed = line.trim();

		// Skip empty lines
		if (trimmed.length === 0) {
			return false;
		}

		// Skip jj formatting lines (@ and ~ at start, or just @ or ~)
		if (line.match(/^[@~]\s/) || line.match(/^[@~]$/)) {
			return false;
		}

		// Skip file modification lines
		if (
			trimmed.match(/^[AMDRC!?]\s+/) ||
			line.match(/^\s*[AMDRC!?]\s+/) ||
			line.match(/^~\s+[AMDRC!?]\s+/) ||
			line.match(/^[│\s]*[AMDRC!?]\s+/)
		) {
			return false;
		}

		// For │ lines, extract content after the formatting
		if (line.match(/^│/)) {
			const content = line.replace(/^│/, "").trim(); // Remove │ and trim
			return (
				content.length > 0 &&
				content !== "(empty)" &&
				content !== "(no description set)" &&
				content !== "(empty) (no description set)"
			);
		}

		// For other lines, check if they're meaningful content
		return (
			trimmed !== "(empty)" &&
			trimmed !== "(no description set)" &&
			!trimmed.match(/^[a-f0-9]+\s+.*@.*\s+\d{4}-\d{2}-\d{2}/) // Skip commit header lines
		);
	});

	const isEmpty = !hasModifications && !hasDescription;

	return {
		isEmpty,
		hasModifications,
		summary,
	};
}
