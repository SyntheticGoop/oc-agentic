import { type ChildProcess, spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "vitest";

describe("Simple MCP Server Test", () => {
	let tempDir: string;
	let originalCwd: string;
	let serverProcess: ChildProcess | null = null;

	beforeEach(async () => {
		originalCwd = process.cwd();

		// Create temporary directory for testing
		tempDir = join(
			tmpdir(),
			`mcp-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
		);
		await mkdir(tempDir, { recursive: true });

		// Create a mock jj command that simulates jujutsu behavior
		const mockJjScript = `#!/bin/bash
case "$1" in
	"status")
		echo "Working copy changes:"
		echo "M test.txt"
		;;
	"log")
		if [[ "$*" == *"--no-graph -T description"* ]]; then
			echo ""
		elif [[ "$*" == *"--summary"* ]]; then
			echo "@  abcd1234 user@example.com 2024-01-01 12:00:00"
			echo "│  (empty)"
			echo "│  (no description set)"
			echo "~"
		fi
		;;
	"desc")
		if [[ "$2" == "-m" ]]; then
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
	});

	afterEach(async () => {
		if (serverProcess) {
			serverProcess.kill("SIGTERM");
			serverProcess = null;
		}

		process.chdir(originalCwd);

		// Clean up temp directory
		try {
			await rm(tempDir, { recursive: true, force: true });
		} catch (error) {
			console.warn("Failed to clean up temp directory:", error);
		}
	});

	it("should start MCP server without crashing", async () => {
		return new Promise<void>((resolve, reject) => {
			// Start the MCP server process
			serverProcess = spawn("yarn", ["run:mcp"], {
				stdio: ["pipe", "pipe", "pipe"],
				cwd: originalCwd,
				env: {
					...process.env,
					INIT_CWD: tempDir,
				},
			});

			if (
				!serverProcess.stdin ||
				!serverProcess.stdout ||
				!serverProcess.stderr
			) {
				reject(new Error("Failed to create process streams"));
				return;
			}

			let hasOutput = false;

			// Handle stdout
			serverProcess.stdout.on("data", (data: Buffer) => {
				hasOutput = true;
				console.log("MCP Server stdout:", data.toString());
			});

			// Handle stderr
			serverProcess.stderr.on("data", (data: Buffer) => {
				const output = data.toString();
				console.log("MCP Server stderr:", output);

				// Check for specific error patterns
				if (output.includes("Couldn't find a package.json")) {
					reject(
						new Error(
							"Package.json not found - server started in wrong directory",
						),
					);
					return;
				}

				if (output.includes("could not infer client capabilities")) {
					// This is expected when no client connects
					hasOutput = true;
				}
			});

			// Handle process events
			serverProcess.on("error", (error) => {
				reject(error);
			});

			serverProcess.on("exit", (code: number | null, signal: string | null) => {
				if (code === 0 || hasOutput) {
					resolve();
				} else {
					reject(
						new Error(`MCP server exited with code ${code}, signal ${signal}`),
					);
				}
			});

			// Send a simple initialize message to test MCP protocol
			const initMessage = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: {
						name: "test-client",
						version: "1.0.0",
					},
				},
			};

			setTimeout(() => {
				if (serverProcess && serverProcess.stdin) {
					serverProcess.stdin.write(JSON.stringify(initMessage) + "\n");
				}
			}, 1000);

			// Kill the process after 3 seconds
			setTimeout(() => {
				if (serverProcess) {
					serverProcess.kill("SIGTERM");
				}
			}, 3000);
		});
	}, 10000);
});
