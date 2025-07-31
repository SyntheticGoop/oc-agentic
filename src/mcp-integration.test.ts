import { type ChildProcess, spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "vitest";

interface MCPRequest {
	jsonrpc: "2.0";
	id: number | string;
	method: string;
	params?: any;
}

interface MCPResponse {
	jsonrpc: "2.0";
	id: number | string;
	result?: any;
	error?: {
		code: number;
		message: string;
		data?: any;
	};
}

class SimpleMCPClient {
	private process: ChildProcess | null = null;
	private requestId = 1;
	private tempDir: string;

	constructor(tempDir: string) {
		this.tempDir = tempDir;
	}

	async start(projectDir: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.process = spawn("yarn", ["run:mcp"], {
				stdio: ["pipe", "pipe", "pipe"],
				cwd: projectDir,
				env: {
					...process.env,
					INIT_CWD: this.tempDir,
				},
			});

			if (!this.process.stdin || !this.process.stdout || !this.process.stderr) {
				reject(new Error("Failed to create process streams"));
				return;
			}

			this.process.stderr.on("data", (data: Buffer) => {
				const output = data.toString();
				if (output.includes("Couldn't find a package.json")) {
					reject(new Error("Package.json not found"));
					return;
				}
			});

			this.process.on("error", (error) => {
				reject(error);
			});

			// Wait for server to start
			setTimeout(resolve, 1000);
		});
	}

	async stop(): Promise<void> {
		if (this.process) {
			this.process.kill("SIGTERM");
			this.process = null;
		}
	}

	async sendRequest(method: string, params?: any): Promise<MCPResponse> {
		if (!this.process || !this.process.stdin || !this.process.stdout) {
			throw new Error("MCP server not started");
		}

		const id = this.requestId++;
		const request: MCPRequest = {
			jsonrpc: "2.0",
			id,
			method,
			params,
		};

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error(`Request ${method} timed out`));
			}, 5000);

			let responseData = "";

			const onData = (data: Buffer) => {
				responseData += data.toString();
				const lines = responseData.split("\n");

				for (const line of lines) {
					if (line.trim()) {
						try {
							const response = JSON.parse(line);
							if (response.id === id) {
								clearTimeout(timeout);
								if (this.process && this.process.stdout) {
									this.process.stdout.off("data", onData);
								}
								resolve(response);
								return;
							}
						} catch (error) {
							// Ignore parse errors, might be partial data
						}
					}
				}
			};

			if (this.process && this.process.stdout && this.process.stdin) {
				this.process.stdout.on("data", onData);
				this.process.stdin.write(JSON.stringify(request) + "\n");
			} else {
				clearTimeout(timeout);
				reject(new Error("Process streams not available"));
			}
		});
	}

	async initialize(): Promise<void> {
		const response = await this.sendRequest("initialize", {
			protocolVersion: "2024-11-05",
			capabilities: {},
			clientInfo: {
				name: "test-client",
				version: "1.0.0",
			},
		});

		if (response.error) {
			throw new Error(`Initialize failed: ${response.error.message}`);
		}
	}

	async listTools(): Promise<any> {
		const response = await this.sendRequest("tools/list");
		if (response.error) {
			throw new Error(`List tools failed: ${response.error.message}`);
		}
		return response.result;
	}

	async callTool(name: string, arguments_?: any): Promise<any> {
		const response = await this.sendRequest("tools/call", {
			name,
			arguments: arguments_ || {},
		});

		if (response.error) {
			throw new Error(`Tool ${name} failed: ${response.error.message}`);
		}

		return response.result;
	}
}

describe("MCP Server Integration Tests", () => {
	let client: SimpleMCPClient;
	let tempDir: string;
	let originalCwd: string;

	beforeEach(async () => {
		originalCwd = process.cwd();

		// Create isolated temp directory within project (excluded from git)
		const projectTempDir = join(originalCwd, "test-temp");
		await mkdir(projectTempDir, { recursive: true });

		tempDir = join(
			projectTempDir,
			`mcp-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
		);
		await mkdir(tempDir, { recursive: true });

		// Create a mock jj command that simulates jujutsu behavior
		const mockJjScript = `#!/bin/bash

# Store the commit message in a temporary file
COMMIT_FILE="${tempDir}/commit_message.txt"

case "$1" in
	"status")
		echo "Working copy changes:"
		echo "M test.txt"
		;;
	"log")
		if [[ "$*" == *"--no-graph -T description"* ]]; then
			if [[ -f "$COMMIT_FILE" ]]; then
				cat "$COMMIT_FILE"
			else
				echo ""
			fi
		elif [[ "$*" == *"--summary"* ]]; then
			echo "@  abcd1234 user@example.com 2024-01-01 12:00:00"
			if [[ -f "$COMMIT_FILE" ]]; then
				echo "│  $(head -n1 "$COMMIT_FILE")"
			else
				echo "│  (empty)"
				echo "│  (no description set)"
			fi
			echo "~"
		fi
		;;
	"desc")
		if [[ "$2" == "-m" ]]; then
			# Extract everything after "jj desc -m " and save to file
			# This handles multiline messages properly
			shift 2  # Remove 'desc' and '-m'
			# Join all remaining arguments with spaces and save
			printf '%s' "$*" > "$COMMIT_FILE"
			echo "Updated commit description"
		fi
		;;
	*)
		echo "Mock jj command: $*"
		;;
esac
`;

		const mockJjPath = join(tempDir, "jj");
		await writeFile(mockJjPath, mockJjScript, { mode: 0o755 });

		// Update PATH to use our mock jj
		process.env.PATH = `${tempDir}:${process.env.PATH}`;

		client = new SimpleMCPClient(tempDir);
	});

	afterEach(async () => {
		await client.stop();
		process.chdir(originalCwd);

		// Clean up temp directory
		try {
			await rm(tempDir, { recursive: true, force: true });
		} catch (error) {
			console.warn("Failed to clean up temp directory:", error);
		}
	});

	describe("Server Initialization", () => {
		it("should start and list all tools", async () => {
			await client.start(originalCwd);
			await client.initialize();

			const tools = await client.listTools();

			// Verify all expected tools are present
			const toolNames = tools.tools.map((tool: any) => tool.name);
			const expectedTools = [
				"start_planning",
				"get_plan",
				"update_goal",
				"update_description",
				"get_constraints",
				"set_constraints",
				"get_tasks",
				"set_tasks",
				"mark_task",
				"finish_job",
				"unfinish_job",
				"verify_plan",
			];

			for (const expectedTool of expectedTools) {
				if (!toolNames.includes(expectedTool)) {
					throw new Error(`Missing tool: ${expectedTool}`);
				}
			}
		}, 10000);
	});

	describe("Basic Tool Operations", () => {
		beforeEach(async () => {
			await client.start(originalCwd);
			await client.initialize();
		});

		it("should execute start_planning tool", async () => {
			const result = await client.callTool("start_planning", {
				type: "feat",
				summary: "implement authentication system",
				breaking: false,
			});

			if (!result.content || !result.content[0] || !result.content[0].text) {
				throw new Error("Invalid response format");
			}

			const text = result.content[0].text;
			if (!text.includes("Created new structured commit plan")) {
				throw new Error(`Unexpected response: ${text}`);
			}
		}, 10000);
		it("should execute get_plan tool", async () => {
			// First create a plan
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			// Then get the plan
			const result = await client.callTool("get_plan");

			if (!result.content || !result.content[0] || !result.content[0].text) {
				throw new Error("Invalid response format");
			}

			const text = result.content[0].text;
			if (
				!text.includes("Successfully parsed current commit structure") &&
				!text.includes("Phase: planning")
			) {
				throw new Error(`Unexpected response: ${text}`);
			}
		}, 10000);
		it("should execute update_description tool", async () => {
			// First create a plan
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			// Then update description
			const result = await client.callTool("update_description", {
				description: "This is a test description for the feature.",
			});

			if (!result.content || !result.content[0] || !result.content[0].text) {
				throw new Error("Invalid response format");
			}

			const text = result.content[0].text;
			if (!text.includes("Updated commit description successfully")) {
				throw new Error(`Unexpected response: ${text}`);
			}
		}, 10000);

		it("should execute set_constraints tool", async () => {
			// First create a plan
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			// Then set constraints
			const result = await client.callTool("set_constraints", {
				constraints: [
					"Do not: break existing functionality",
					"Never: expose sensitive data",
				],
			});

			if (!result.content || !result.content[0] || !result.content[0].text) {
				throw new Error("Invalid response format");
			}

			const text = result.content[0].text;
			if (!text.includes("Updated constraints: 2 constraints set")) {
				throw new Error(`Unexpected response: ${text}`);
			}
		}, 10000);

		it("should execute set_tasks tool", async () => {
			// First create a plan
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			// Then set tasks
			const result = await client.callTool("set_tasks", {
				tasks: [
					{
						summary: "Implement core functionality",
						details: "Add the main feature logic",
						level: 0,
						completed: false,
					},
					{
						summary: "Add tests",
						details: "Write comprehensive tests",
						level: 0,
						completed: false,
					},
				],
			});

			if (!result.content || !result.content[0] || !result.content[0].text) {
				throw new Error("Invalid response format");
			}

			const text = result.content[0].text;
			if (!text.includes("Updated task hierarchy: 2 tasks defined")) {
				throw new Error(`Unexpected response: ${text}`);
			}
		}, 10000);

		it("should execute mark_task tool", async () => {
			// First create a plan with tasks
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			await client.callTool("set_tasks", {
				tasks: [
					{
						summary: "Test task",
						details: "A test task",
						level: 0,
						completed: false,
					},
				],
			});

			// Then mark task as complete
			const result = await client.callTool("mark_task", {
				task_id: "test-task",
				completed: true,
			});

			if (!result.content || !result.content[0] || !result.content[0].text) {
				throw new Error("Invalid response format");
			}

			const text = result.content[0].text;
			if (!text.includes("Task test-task marked as completed")) {
				throw new Error(`Unexpected response: ${text}`);
			}
		}, 10000);

		it("should execute verify_plan tool", async () => {
			const result = await client.callTool("verify_plan");

			if (!result.content || !result.content[0] || !result.content[0].text) {
				throw new Error("Invalid response format");
			}

			const text = result.content[0].text;
			// Should indicate no commit found or valid format
			if (!text.includes("No commit found") && !text.includes("valid")) {
				throw new Error(`Unexpected response: ${text}`);
			}
		}, 10000);
	});

	describe("Error Handling", () => {
		beforeEach(async () => {
			await client.start(originalCwd);
			await client.initialize();
		});

		it("should handle invalid tool parameters", async () => {
			try {
				await client.callTool("start_planning", {
					type: "invalid_type",
					summary: "test",
				});
				throw new Error("Should have thrown an error");
			} catch (error) {
				if (
					error instanceof Error &&
					error.message.includes("Should have thrown an error")
				) {
					throw error;
				}
				// Expected error
			}
		}, 10000);

		it("should handle operations on non-existent commit", async () => {
			const result = await client.callTool("get_plan");

			if (!result.content || !result.content[0] || !result.content[0].text) {
				throw new Error("Invalid response format");
			}

			const text = result.content[0].text;
			if (!text.includes("No structured commit found")) {
				throw new Error(`Expected 'No structured commit found', got: ${text}`);
			}
		}, 10000);
	});
});
