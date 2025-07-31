import { type ChildProcess, exec, spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execAsync = promisify(exec);

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

class RealJujutsuMCPClient {
	private process: ChildProcess | null = null;
	private requestId = 1;
	private tempDir: string;
	private originalCwd: string;

	constructor(tempDir: string, originalCwd: string) {
		this.tempDir = tempDir;
		this.originalCwd = originalCwd;
	}

	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.process = spawn("yarn", ["run:mcp"], {
				stdio: ["pipe", "pipe", "pipe"],
				cwd: this.originalCwd, // Run from project directory
				env: {
					...process.env,
					INIT_CWD: this.tempDir, // But operate in temp directory
				},
			});

			if (!this.process.stdin || !this.process.stdout || !this.process.stderr) {
				reject(new Error("Failed to create process streams"));
				return;
			}

			this.process.stderr.on("data", (data: Buffer) => {
				const output = data.toString();
				console.error("MCP Server stderr:", output);
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
			}, 10000);

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

		// Send initialized notification
		if (this.process && this.process.stdin) {
			const notification = {
				jsonrpc: "2.0",
				method: "notifications/initialized",
			};
			this.process.stdin.write(JSON.stringify(notification) + "\n");
		}
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

describe("MCP Server with Real Jujutsu", () => {
	let client: RealJujutsuMCPClient;
	let tempDir: string;
	let originalCwd: string;

	beforeEach(async () => {
		originalCwd = process.cwd();

		// Create isolated temp directory within project (excluded from git)
		const projectTempDir = join(originalCwd, "test-temp");
		await mkdir(projectTempDir, { recursive: true });

		tempDir = join(
			projectTempDir,
			`mcp-real-jj-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
		);
		await mkdir(tempDir, { recursive: true });

		// Initialize a real jujutsu repository in temp directory
		// Safety check: ensure we're not in the original project directory
		if (tempDir === originalCwd || tempDir.startsWith(originalCwd + "/src")) {
			throw new Error(
				"Safety check failed: temp directory is within project directory",
			);
		}

		process.chdir(tempDir);

		try {
			// Initialize jujutsu repo with git backend
			await execAsync("jj git init");

			// Configure user (required for commits)
			await execAsync('jj config set --repo user.name "Test User"');
			await execAsync('jj config set --repo user.email "test@example.com"');

			// Create a dummy file so we have something to commit
			await execAsync("echo 'test content' > test.txt");
		} catch (error) {
			console.error("Failed to initialize jujutsu repo:", error);
			throw error;
		} finally {
			// Always return to original directory
			process.chdir(originalCwd);
		}

		client = new RealJujutsuMCPClient(tempDir, originalCwd);
	});

	afterEach(async () => {
		if (client) {
			await client.stop();
		}
		process.chdir(originalCwd);

		// Clean up temp directory
		try {
			await rm(tempDir, { recursive: true, force: true });
		} catch (error) {
			console.warn("Failed to clean up temp directory:", error);
		}
	});

	describe("Basic Operations", () => {
		it("should start planning and create structured commit", async () => {
			await client.start();
			await client.initialize();

			const result = await client.callTool("start_planning", {
				type: "feat",
				scope: "auth",
				summary: "implement OAuth2 authentication",
				breaking: false,
			});

			expect(result.content[0].text).toContain(
				"Created new structured commit plan",
			);
			expect(result.content[0].text).toContain(
				"feat(auth): implement OAuth2 authentication",
			);
		});

		it("should handle complex commit messages with special characters", async () => {
			await client.start();
			await client.initialize();

			// Test with parentheses, colons, and other special characters
			const result = await client.callTool("start_planning", {
				type: "fix",
				scope: "api",
				summary: "resolve issue with (complex) parsing: handle edge cases",
				breaking: false,
			});

			expect(result.content[0].text).toContain(
				"Created new structured commit plan",
			);
		});

		it("should update description with multiline content", async () => {
			await client.start();
			await client.initialize();

			// First create a plan
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			// Then update with multiline description
			const description = `This is a multiline description.

It contains multiple paragraphs and should be handled correctly.

- It has bullet points
- And various formatting`;

			const result = await client.callTool("update_description", {
				description,
			});

			expect(result.content[0].text).toContain(
				"Updated commit description successfully",
			);
		});

		it("should set and manage constraints", async () => {
			await client.start();
			await client.initialize();

			// Create plan
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			// Set constraints
			const result = await client.callTool("set_constraints", {
				constraints: [
					"Do not: break existing functionality",
					"Never: expose sensitive data",
					"Must not: break backward compatibility",
				],
			});

			expect(result.content[0].text).toContain(
				"Updated constraints: 3 constraints set",
			);
		});

		it("should manage task hierarchy", async () => {
			await client.start();
			await client.initialize();

			// Create plan
			await client.callTool("start_planning", {
				type: "feat",
				summary: "implement user management",
			});

			// Set tasks
			const result = await client.callTool("set_tasks", {
				tasks: [
					{
						summary: "Create user model",
						details: "Define user schema and validation",
						level: 0,
						completed: false,
					},
					{
						summary: "Add database migration",
						details: "Create users table",
						level: 1,
						completed: false,
					},
					{
						summary: "Implement user service",
						details: "CRUD operations for users",
						level: 0,
						completed: false,
					},
				],
			});

			expect(result.content[0].text).toContain(
				"Updated task hierarchy: 3 tasks defined",
			);
		});

		it("should mark tasks as complete and track progress", async () => {
			await client.start();
			await client.initialize();

			// Create plan with tasks
			await client.callTool("start_planning", {
				type: "feat",
				summary: "implement feature",
			});

			await client.callTool("set_tasks", {
				tasks: [
					{
						summary: "First task",
						details: "Do the first thing",
						level: 0,
						completed: false,
					},
					{
						summary: "Second task",
						details: "Do the second thing",
						level: 0,
						completed: false,
					},
				],
			});

			// Mark first task complete
			const result = await client.callTool("mark_task", {
				task_id: "first-task",
				completed: true,
			});

			expect(result.content[0].text).toContain(
				"Task first-task marked as completed",
			);
		});

		it("should complete full workflow", async () => {
			await client.start();
			await client.initialize();

			// 1. Start planning
			await client.callTool("start_planning", {
				type: "feat",
				scope: "ui",
				summary: "add dark mode toggle",
			});

			// 2. Add description
			await client.callTool("update_description", {
				description:
					"Implement dark mode toggle with user preference persistence",
			});

			// 3. Set constraints
			await client.callTool("set_constraints", {
				constraints: ["Do not: break existing themes"],
			});

			// 4. Define tasks
			await client.callTool("set_tasks", {
				tasks: [
					{
						summary: "Add toggle component",
						details: "Create UI component",
						level: 0,
						completed: false,
					},
					{
						summary: "Add persistence",
						details: "Save user preference",
						level: 0,
						completed: false,
					},
				],
			});

			// 5. Complete tasks
			await client.callTool("mark_task", {
				task_id: "add-toggle-component",
				completed: true,
			});

			await client.callTool("mark_task", {
				task_id: "add-persistence",
				completed: true,
			});

			// 6. Finish job
			const result = await client.callTool("finish_job");
			expect(result.content[0].text).toContain("Job completed successfully");
		});
	});

	describe("Error Handling", () => {
		it("should handle operations without initial planning", async () => {
			await client.start();
			await client.initialize();

			// Reset commit to empty state for this test
			process.chdir(tempDir);
			try {
				await execAsync('jj desc -m ""');
			} catch (error) {
				// Ignore errors - we just want to ensure empty commit
			} finally {
				process.chdir(originalCwd);
			}

			const result = await client.callTool("get_plan");
			const text = result.content[0].text;
			const hasValidResponse =
				text.includes("No structured commit found") ||
				text.includes("Successfully parsed current commit structure") ||
				text.includes("Phase:");

			expect(hasValidResponse).toBe(true);
		});

		it("should handle invalid task IDs", async () => {
			await client.start();
			await client.initialize();

			// Create plan with tasks
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test",
			});

			await client.callTool("set_tasks", {
				tasks: [
					{
						summary: "Valid task",
						details: "",
						level: 0,
						completed: false,
					},
				],
			});

			// Try to mark non-existent task
			const result = await client.callTool("mark_task", {
				task_id: "non-existent-task",
				completed: true,
			});

			expect(result.content[0].text).toContain(
				"Task not found: non-existent-task",
			);
		});
	});
});
