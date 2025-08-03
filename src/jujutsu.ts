/**
 * @fileoverview Jujutsu version control system integration
 *
 * This module provides a TypeScript wrapper around the Jujutsu (jj) version control system,
 * offering type-safe operations for commit management and description handling.
 *
 * Key features:
 * - Create new commits with `jj new`
 * - Get and set commit descriptions with proper error handling
 * - Navigate through linear commit history with `history.linear()` (past, current, future)

 * - Jump to specific commits with `navigate.to(hash)`
 * - Promise-based API with Result types for robust error handling
 * - Support for multiline descriptions, special characters, and Unicode
 * - Automatic fork/merge detection to stop linear traversal at appropriate points
 *
 * @example
 * ```typescript
 * const jj = Jujutsu.cwd("/path/to/repo");
 *
 * // Create a new commit
 * const newResult = await jj.new();
 * if (newResult.ok) {
 *   console.log("New commit created");
 * }
 *
 * // Set commit description
 * const descResult = await jj.description.replace("feat: add new feature");
 * if (descResult.ok) {
 *   console.log("Description updated");
 * }
 *
 * // Get current description
 * const getResult = await jj.description.get();
 * if (getResult.ok) {
 *   console.log("Current description:", getResult.ok);
 * }
 *
 * // Get linear commit history (past, current, and future)
 * const historyResult = await jj.history.linear();
 * if (historyResult.ok) {
 *   console.log("Current:", historyResult.ok.current);
 *   console.log("History:", historyResult.ok.history);
 *   console.log("Future:", historyResult.ok.future);
 * }
 *

 *
 * // Navigate to specific commit
 * const navResult = await jj.navigate.to("abc123...");
 * if (navResult.ok) {
 *   console.log("Navigated successfully");
 * }
 * ```
 */

import { spawn } from "node:child_process";
import { Err, Ok } from "./result";

function spawnjj(args: string[]) {
	return new Promise<
		| Ok<{ stdout: string; stderr: string }>
		| Err<"command failed", { cmd: string; msg: string }>
		| Err<"command non zero exit", { cmd: string; code: number | null }>
	>((ok) => {
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
			ok(
				Err("command failed", {
					cmd: `jj ${args.join(" ")}`,
					msg: error.message,
				}),
			);
		});

		child.on("close", (code) => {
			if (code === 0) {
				ok({ ok: { stdout, stderr } } satisfies Ok);
			} else {
				ok(
					Err("command non zero exit", {
						cmd: `jj ${args.join(" ")}`,
						code,
					}),
				);
			}
		});
	});
}

export const Jujutsu = {
	cwd(dir: string) {
		return {
			async new() {
				return spawnjj(["new", "-R", dir]).then((result) => {
					if (result.err) return result;

					return Ok(result.ok.stdout);
				});
			},
			description: {
				async get() {
					return spawnjj([
						"log",
						"-r",
						"@",
						"-T",
						"description",
						"--no-graph",
						"-R",
						dir,
					]).then((result) => {
						if (result.err) return result;
						return Ok(result.ok.stdout);
					});
				},
				async replace(msg: string) {
					return spawnjj(["desc", "-R", dir, "-m", msg]).then((result) => {
						if (result.err) return result;
						return Ok(result.ok.stdout);
					});
				},
			},
			async empty() {
				return spawnjj(["log", "-r", "@", "-T", "empty", "-R", dir]).then(
					(result) => {
						if (result.err) return result;
						return Ok(result.ok.stdout === "true");
					},
				);
			},
			diff: {
				async summary() {
					return spawnjj(["diff", "-r", "@", "--summary", "-R", dir]).then(
						(result) => {
							if (result.err) return result;
							return Ok(
								result.ok.stdout
									.trim()
									.split("\n")
									.map((entry) => ({
										type: entry.slice(0, 2).trim(),
										file: entry.slice(2).trim(),
									})),
							);
						},
					);
				},
				async files() {
					const summary = await this.summary();
					if (summary.err) return summary;

					const files = [];
					for (const { file } of summary.ok) {
						const f = await spawnjj([
							"diff",
							"-R",
							dir,
							"-r",
							"@",
							"--git",
							file,
						]).then((result) => {
							if (result.err) return result;
							const split = result.ok.stdout.indexOf("\n");
							return Ok({
								file: result.ok.stdout.slice(0, split),
								diff: result.ok.stdout.slice(split),
							});
						});
						if (f.err) return f;
						files.push(f.ok);
					}
					return Ok(files);
				},
			},
			history: {
				async linear() {
					// Get current commit info
					const currentResult = await spawnjj([
						"log",
						"-r",
						"@",
						"--no-graph",
						"-T",
						'commit_id ++ " " ++ description.first_line() ++ "\\n"',
						"-R",
						dir,
					]);

					if (currentResult.err) return currentResult;

					// Parse current commit
					const currentLine = currentResult.ok.stdout.split("\n")[0]; // Get first line without trimming
					const currentSpaceIndex = currentLine.indexOf(" ");
					let current = null;

					if (currentSpaceIndex !== -1) {
						const hash = currentLine.slice(0, currentSpaceIndex);
						const message = currentLine.slice(currentSpaceIndex + 1).trim();
						current = { hash, message };
					}
					// Get ancestors (past commits, excluding current)
					const ancestorsResult = await spawnjj([
						"log",
						"-r",
						"::@ ~ @",
						"--no-graph",
						"-T",
						'commit_id ++ " " ++ description.first_line() ++ "\\n"',
						"-R",
						dir,
					]);

					if (ancestorsResult.err) return ancestorsResult;

					// Get descendants (future commits, excluding current)
					const descendantsResult = await spawnjj([
						"log",
						"-r",
						"@:: ~ @",
						"--no-graph",
						"-T",
						'commit_id ++ " " ++ description.first_line() ++ "\\n"',
						"-R",
						dir,
					]);

					if (descendantsResult.err) return descendantsResult;

					// Parse ancestors (past commits)
					const ancestorLines = ancestorsResult.ok.stdout.split("\n");
					const history = [];

					for (const line of ancestorLines) {
						if (!line.trim()) continue;

						const spaceIndex = line.indexOf(" ");
						if (spaceIndex === -1) {
							const hash = line.trim();
							if (hash.match(/^0+$/)) continue; // Skip root commit
							continue;
						}

						const hash = line.slice(0, spaceIndex);
						const message = line.slice(spaceIndex + 1).trim();

						// Skip root commit (all zeros)
						if (hash.match(/^0+$/)) continue;

						history.push({ hash, message });

						// Check if this commit is a merge (has multiple parents)
						const parentCheckResult = await spawnjj([
							"log",
							"-r",
							hash,
							"--no-graph",
							"-T",
							"parents.len()",
							"-R",
							dir,
						]);

						if (
							parentCheckResult.ok &&
							parseInt(parentCheckResult.ok.stdout.trim()) > 1
						) {
							// This is a merge commit, stop here
							break;
						}
					}

					// Parse descendants (future commits)
					const descendantLines = descendantsResult.ok.stdout.split("\n");
					const future = [];

					for (const line of descendantLines) {
						if (!line.trim()) continue;

						const spaceIndex = line.indexOf(" ");
						if (spaceIndex === -1) continue;

						const hash = line.slice(0, spaceIndex);
						const message = line.slice(spaceIndex + 1).trim();

						future.push({ hash, message });

						// Check if this commit is a merge (has multiple children)
						const childCheckResult = await spawnjj([
							"log",
							"-r",
							hash + "+",
							"--no-graph",
							"-T",
							"commit_id",
							"-R",
							dir,
						]);

						if (childCheckResult.ok) {
							const childHashes = childCheckResult.ok.stdout
								.trim()
								.split("\n")
								.filter((h) => h.trim());
							if (childHashes.length > 1) {
								// This commit has multiple children (fork point), stop here
								break;
							}
						}
					}

					return Ok({
						history: history.reverse(), // Oldest first
						current,
						future: future.reverse(), // Newest first
					});
				},
			},

			navigate: {
				async to(hash: string) {
					return spawnjj(["edit", "-R", dir, hash]).then((result) => {
						if (result.err) return result;
						return Ok(result.ok.stdout);
					});
				},
			},
		};
	},
};
