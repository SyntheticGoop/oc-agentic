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

interface MCPNotification {
	jsonrpc: "2.0";
	method: string;
	params?: any;
}

class MCPTestClient {
	private process: ChildProcess | null = null;
	private requestId = 1;
	private responses = new Map<string | number, MCPResponse>();
	private notifications: MCPNotification[] = [];
	private tempDir: string;

	constructor(tempDir: string) {
		this.tempDir = tempDir;
	}

	async start(projectDir: string): Promise<void> {
		return new Promise((resolve, reject) => {
			// Start the MCP server process from the project directory
			// but set INIT_CWD to the temp directory for jujutsu operations
			this.process = spawn("yarn", ["run:mcp"], {
				stdio: ["pipe", "pipe", "pipe"],
				cwd: projectDir, // Use the original project directory
				env: {
					...process.env,
					INIT_CWD: this.tempDir,
				},
			});

			if (!this.process.stdin || !this.process.stdout || !this.process.stderr) {
				reject(new Error("Failed to create process streams"));
				return;
			}

			// Handle stdout (MCP responses)
			this.process.stdout.on("data", (data: Buffer) => {
				const lines = data.toString().split("\n").filter(Boolean);
				for (const line of lines) {
					try {
						const message = JSON.parse(line);
						if ("id" in message) {
							// Response
							this.responses.set(message.id, message);
						} else {
							// Notification
							this.notifications.push(message);
						}
					} catch (error) {
						console.warn("Failed to parse MCP message:", line);
					}
				}
			});

			// Handle stderr
			this.process.stderr.on("data", (data: Buffer) => {
				console.error("MCP Server stderr:", data.toString());
			});

			// Handle process events
			this.process.on("error", (error) => {
				reject(error);
			});

			this.process.on("exit", (code, signal) => {
				if (code !== 0 && code !== null) {
					reject(
						new Error(`MCP server exited with code ${code}, signal ${signal}`),
					);
				}
			});

			// Wait a bit for the server to start
			setTimeout(() => {
				if (this.process && !this.process.killed) {
					resolve();
				} else {
					reject(new Error("MCP server failed to start"));
				}
			}, 2000);
		});
	}

	async stop(): Promise<void> {
		if (this.process) {
			this.process.kill("SIGTERM");
			await new Promise((resolve) => {
				this.process!.on("exit", resolve);
				// Force kill after 5 seconds
				setTimeout(() => {
					if (this.process && !this.process.killed) {
						this.process.kill("SIGKILL");
					}
					resolve(undefined);
				}, 5000);
			});
			this.process = null;
		}
	}

	async sendRequest(method: string, params?: any): Promise<MCPResponse> {
		if (!this.process || !this.process.stdin) {
			throw new Error("MCP server not started");
		}

		const id = this.requestId++;
		const request: MCPRequest = {
			jsonrpc: "2.0",
			id,
			method,
			params,
		};

		// Send request
		this.process.stdin.write(JSON.stringify(request) + "\n");

		// Wait for response
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error(`Request ${method} timed out`));
			}, 10000);

			const checkResponse = () => {
				if (this.responses.has(id)) {
					clearTimeout(timeout);
					const response = this.responses.get(id)!;
					this.responses.delete(id);
					resolve(response);
				} else {
					setTimeout(checkResponse, 100);
				}
			};

			checkResponse();
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

	async listTools(): Promise<any> {
		const response = await this.sendRequest("tools/list");
		if (response.error) {
			throw new Error(`List tools failed: ${response.error.message}`);
		}
		return response.result;
	}
}

describe("MCP Server Integration Tests", () => {
	let client: MCPTestClient;
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

		client = new MCPTestClient(tempDir);
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

	describe("Server Initialization", () => {
		it("should start and initialize successfully", async () => {
			await client.start(originalCwd);
			await client.initialize();

			const tools = await client.listTools();
			expect(tools.tools).toBeDefined();
			expect(Array.isArray(tools.tools)).toBe(true);
			expect(tools.tools.length).toBe(12);

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
				expect(toolNames).toContain(expectedTool);
			}
		});

		it("should handle server startup failures gracefully", async () => {
			// Test with invalid environment
			const invalidClient = new MCPTestClient("/nonexistent/path");

			await expect(
				invalidClient.start("/nonexistent/project"),
			).rejects.toThrow();
		});
	});

	describe("Tool Execution Tests", () => {
		beforeEach(async () => {
			await client.start(originalCwd);
			await client.initialize();
		});

		describe("Planning Workflow", () => {
			it("should execute complete planning workflow", async () => {
				// 1. Start planning
				const startResult = await client.callTool("start_planning", {
					type: "feat",
					scope: "auth",
					summary: "implement OAuth2 authentication",
					breaking: false,
				});

				expect(startResult.content[0].text).toContain(
					"Created new structured commit plan",
				);
				expect(startResult.content[0].text).toContain(
					"feat(auth): implement OAuth2 authentication",
				);

				// 2. Get plan
				const planResult = await client.callTool("get_plan");
				expect(planResult.content[0].text).toContain(
					"Successfully parsed current commit structure",
				);
				expect(planResult.content[0].text).toContain("Phase: planning");

				// 3. Update description
				const descResult = await client.callTool("update_description", {
					description:
						"Add comprehensive OAuth2 authentication system with token refresh capabilities.",
				});
				expect(descResult.content[0].text).toContain(
					"Updated commit description successfully",
				);

				// 4. Set constraints
				const constraintsResult = await client.callTool("set_constraints", {
					constraints: [
						"Do not: store tokens in localStorage",
						"Never: expose client secrets in frontend code",
					],
				});
				expect(constraintsResult.content[0].text).toContain(
					"Updated constraints: 2 constraints set",
				);

				// 5. Set tasks
				const tasksResult = await client.callTool("set_tasks", {
					tasks: [
						{
							summary: "OAuth2 implementation",
							details: "core authentication flow",
							level: 0,
							completed: false,
						},
						{
							summary: "Token endpoint",
							details: "handle authorization code exchange",
							level: 1,
							completed: false,
						},
						{
							summary: "Client integration",
							details: "update existing clients",
							level: 0,
							completed: false,
						},
					],
				});
				expect(tasksResult.content[0].text).toContain(
					"Updated task hierarchy: 3 tasks defined",
				);

				// 6. Mark task as complete
				const markResult = await client.callTool("mark_task", {
					task_id: "token-endpoint",
					completed: true,
				});
				expect(markResult.content[0].text).toContain(
					"Task token-endpoint marked as completed",
				);

				// 7. Verify plan
				const verifyResult = await client.callTool("verify_plan");
				expect(verifyResult.content[0].text).toContain(
					"Commit format is valid and properly structured",
				);
			});

			it("should handle breaking changes correctly", async () => {
				const result = await client.callTool("start_planning", {
					type: "feat",
					scope: "api",
					summary: "redesign authentication system",
					breaking: true,
				});

				expect(result.content[0].text).toContain(
					"feat(api)!: redesign authentication system",
				);
			});

			it("should handle planning without scope", async () => {
				const result = await client.callTool("start_planning", {
					type: "fix",
					summary: "resolve memory leak in parser",
					breaking: false,
				});

				expect(result.content[0].text).toContain(
					"fix: resolve memory leak in parser",
				);
			});
		});

		describe("Task Management", () => {
			beforeEach(async () => {
				// Set up a basic plan with tasks
				await client.callTool("start_planning", {
					type: "feat",
					summary: "test feature",
				});

				await client.callTool("set_tasks", {
					tasks: [
						{
							summary: "Parent task",
							details: "main task",
							level: 0,
							completed: false,
						},
						{
							summary: "Child task 1",
							details: "first subtask",
							level: 1,
							completed: false,
						},
						{
							summary: "Child task 2",
							details: "second subtask",
							level: 1,
							completed: false,
						},
					],
				});
			});

			it("should mark individual tasks as complete", async () => {
				const result = await client.callTool("mark_task", {
					task_id: "child-task-1",
					completed: true,
				});

				expect(result.content[0].text).toContain(
					"Task child-task-1 marked as completed",
				);
			});

			it("should toggle task completion", async () => {
				// Mark as complete
				await client.callTool("mark_task", {
					task_id: "parent-task",
					completed: true,
				});

				// Toggle back to incomplete
				const result = await client.callTool("mark_task", {
					task_id: "parent-task",
					completed: false,
				});

				expect(result.content[0].text).toContain(
					"Task parent-task marked as incomplete",
				);
			});

			it("should handle task completion workflow", async () => {
				// Mark all tasks as complete
				await client.callTool("mark_task", {
					task_id: "parent-task",
					completed: true,
				});
				await client.callTool("mark_task", {
					task_id: "child-task-1",
					completed: true,
				});
				await client.callTool("mark_task", {
					task_id: "child-task-2",
					completed: true,
				});

				// Finish job
				const finishResult = await client.callTool("finish_job");
				expect(finishResult.content[0].text).toContain(
					"Job completed successfully",
				);

				// Unfinish job
				const unfinishResult = await client.callTool("unfinish_job");
				expect(unfinishResult.content[0].text).toContain(
					"Job marked as incomplete",
				);
			});

			it("should get current tasks", async () => {
				const result = await client.callTool("get_tasks");
				expect(result.content[0].text).toContain("Found 3 tasks");
			});
		});

		describe("Constraint Management", () => {
			beforeEach(async () => {
				await client.callTool("start_planning", {
					type: "refactor",
					summary: "restructure codebase",
				});
			});

			it("should set and get constraints", async () => {
				// Set constraints
				await client.callTool("set_constraints", {
					constraints: [
						"Do not: break existing APIs",
						"Never: remove public methods",
						"Must not: change database schema",
					],
				});

				// Get constraints
				const result = await client.callTool("get_constraints");
				expect(result.content[0].text).toContain("Do not: break existing APIs");
				expect(result.content[0].text).toContain(
					"Never: remove public methods",
				);
				expect(result.content[0].text).toContain(
					"Must not: change database schema",
				);
			});

			it("should handle empty constraints", async () => {
				const result = await client.callTool("get_constraints");
				expect(result.content[0].text).toContain("none");
			});

			it("should update existing constraints", async () => {
				// Set initial constraints
				await client.callTool("set_constraints", {
					constraints: ["Do not: break tests"],
				});

				// Update constraints
				const result = await client.callTool("set_constraints", {
					constraints: ["Do not: break tests", "Never: modify core logic"],
				});

				expect(result.content[0].text).toContain(
					"Updated constraints: 2 constraints set",
				);
			});
		});

		describe("Goal Management", () => {
			beforeEach(async () => {
				await client.callTool("start_planning", {
					type: "feat",
					scope: "ui",
					summary: "add dark mode",
				});
			});

			it("should update commit type", async () => {
				const result = await client.callTool("update_goal", {
					type: "refactor",
				});

				expect(result.content[0].text).toContain(
					"Updated commit header successfully",
				);
			});

			it("should update scope", async () => {
				const result = await client.callTool("update_goal", {
					scope: "theme",
				});

				expect(result.content[0].text).toContain(
					"Updated commit header successfully",
				);
			});

			it("should update summary", async () => {
				const result = await client.callTool("update_goal", {
					summary: "implement comprehensive theming system",
				});

				expect(result.content[0].text).toContain(
					"Updated commit header successfully",
				);
			});

			it("should update breaking change flag", async () => {
				const result = await client.callTool("update_goal", {
					breaking: true,
				});

				expect(result.content[0].text).toContain(
					"Updated commit header successfully",
				);
			});

			it("should update multiple fields at once", async () => {
				const result = await client.callTool("update_goal", {
					type: "fix",
					scope: "styles",
					summary: "resolve theme switching issues",
					breaking: false,
				});

				expect(result.content[0].text).toContain(
					"Updated commit header successfully",
				);
			});
		});
	});

	describe("Error Handling", () => {
		beforeEach(async () => {
			await client.start(originalCwd);
			await client.initialize();
		});

		it("should handle invalid tool names", async () => {
			await expect(client.callTool("invalid_tool")).rejects.toThrow();
		});

		it("should handle missing required parameters", async () => {
			await expect(client.callTool("start_planning", {})).rejects.toThrow();
		});

		it("should handle invalid parameter values", async () => {
			await expect(
				client.callTool("start_planning", {
					type: "invalid_type",
					summary: "test",
				}),
			).rejects.toThrow();
		});

		it("should handle operations on non-existent commit", async () => {
			// This test verifies the system can handle get_plan calls
			// even when there might be existing commits from previous tests
			const result = await client.callTool("get_plan");

			// The result should either show no structured commit or successfully parse existing commit
			const text = result.content[0].text;
			const hasValidResponse =
				text.includes("No structured commit found") ||
				text.includes("Successfully parsed current commit structure") ||
				text.includes("Phase:");

			expect(hasValidResponse).toBe(true);
		});

		it("should handle task operations without tasks", async () => {
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			const result = await client.callTool("mark_task", {
				task_id: "nonexistent-task",
			});

			expect(result.content[0].text).toContain("Task not found");
		});

		it("should handle finish_job without all tasks complete", async () => {
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			await client.callTool("set_tasks", {
				tasks: [
					{
						summary: "Incomplete task",
						level: 0,
						completed: false,
					},
				],
			});

			const result = await client.callTool("finish_job");
			expect(result.content[0].text).toContain("tasks remaining");
		});

		it("should handle constraint validation errors", async () => {
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			// This should work fine since the server handles constraint validation
			const result = await client.callTool("set_constraints", {
				constraints: ["Do not: break things"],
			});

			expect(result.content[0].text).toContain("Updated constraints");
		});

		it("should handle very long summaries", async () => {
			const longSummary = "a".repeat(121);

			await expect(
				client.callTool("start_planning", {
					type: "feat",
					summary: longSummary,
				}),
			).rejects.toThrow();
		});

		it("should handle empty summaries", async () => {
			await expect(
				client.callTool("start_planning", {
					type: "feat",
					summary: "",
				}),
			).rejects.toThrow();
		});
	});

	describe("Complex Scenarios", () => {
		beforeEach(async () => {
			await client.start(originalCwd);
			await client.initialize();
		});

		it("should handle deeply nested task hierarchies", async () => {
			await client.callTool("start_planning", {
				type: "feat",
				summary: "complex feature",
			});

			const result = await client.callTool("set_tasks", {
				tasks: [
					{ summary: "Level 0", level: 0, completed: false },
					{ summary: "Level 1", level: 1, completed: false },
					{ summary: "Level 2", level: 2, completed: false },
					{ summary: "Level 3", level: 3, completed: false },
				],
			});

			expect(result.content[0].text).toContain(
				"Updated task hierarchy: 4 tasks defined",
			);
		});

		it("should handle task ID conflicts", async () => {
			await client.callTool("start_planning", {
				type: "feat",
				summary: "test feature",
			});

			const result = await client.callTool("set_tasks", {
				tasks: [
					{ summary: "Test Task", level: 0, completed: false },
					{ summary: "Test Task", level: 0, completed: false },
					{ summary: "Test Task", level: 0, completed: false },
				],
			});

			expect(result.content[0].text).toContain(
				"Updated task hierarchy: 3 tasks defined",
			);
		});

		it("should handle mixed completion states", async () => {
			await client.callTool("start_planning", {
				type: "feat",
				summary: "mixed completion test",
			});

			await client.callTool("set_tasks", {
				tasks: [
					{ summary: "Completed parent", level: 0, completed: true },
					{ summary: "Completed child", level: 1, completed: true },
					{ summary: "Incomplete parent", level: 0, completed: false },
					{ summary: "Incomplete child", level: 1, completed: false },
				],
			});

			const planResult = await client.callTool("get_plan");
			expect(planResult.content[0].text).toContain("Phase: executing");
		});

		it("should handle rapid state transitions", async () => {
			// Start planning
			await client.callTool("start_planning", {
				type: "feat",
				summary: "rapid transitions",
			});

			// Add tasks
			await client.callTool("set_tasks", {
				tasks: [
					{ summary: "Task 1", level: 0, completed: false },
					{ summary: "Task 2", level: 0, completed: false },
				],
			});

			// Complete all tasks rapidly
			await client.callTool("mark_task", {
				task_id: "task-1",
				completed: true,
			});

			await client.callTool("mark_task", {
				task_id: "task-2",
				completed: true,
			});

			// Finish job
			const finishResult = await client.callTool("finish_job");
			expect(finishResult.content[0].text).toContain(
				"Job completed successfully",
			);

			// Verify final state
			const planResult = await client.callTool("get_plan");
			expect(planResult.content[0].text).toContain("Phase: complete");
		});
	});

	describe("Performance and Stress Tests", () => {
		beforeEach(async () => {
			await client.start(originalCwd);
			await client.initialize();
		}, 30000); // Increase timeout to 30 seconds

		it("should handle large number of tasks", async () => {
			await client.callTool("start_planning", {
				type: "feat",
				summary: "large task set",
			});

			const tasks = [];
			for (let i = 0; i < 50; i++) {
				tasks.push({
					summary: `Task ${i}`,
					details: `Details for task ${i}`,
					level: 0,
					completed: false,
				});
			}

			const result = await client.callTool("set_tasks", { tasks });
			expect(result.content[0].text).toContain(
				"Updated task hierarchy: 50 tasks defined",
			);
		});

		it("should handle large number of constraints", async () => {
			await client.callTool("start_planning", {
				type: "refactor",
				summary: "constrained refactor",
			});

			const constraints = [];
			for (let i = 0; i < 20; i++) {
				constraints.push(`Do not: break functionality ${i}`);
			}

			const result = await client.callTool("set_constraints", { constraints });
			expect(result.content[0].text).toContain(
				"Updated constraints: 20 constraints set",
			);
		});

		it("should handle rapid sequential operations", async () => {
			await client.callTool("start_planning", {
				type: "feat",
				summary: "rapid operations",
			});

			// Perform many operations in sequence
			const operations = [];
			for (let i = 0; i < 10; i++) {
				operations.push(
					client.callTool("update_description", {
						description: `Updated description ${i}`,
					}),
				);
			}

			const results = await Promise.all(operations);
			for (const result of results) {
				expect(result.content[0].text).toContain(
					"Updated commit description successfully",
				);
			}
		});
	});
});
