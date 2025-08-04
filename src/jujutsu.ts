/**
 * @fileoverview Jujutsu version control system integration
 *
 * This module provides a TypeScript wrapper around the Jujutsu (jj) version control system,
 * offering type-safe operations for commit management and description handling.
 *
 * Key features:
 * - Create new commits with `jj new` (with optional positioning using -A flag)
 * - Abandon empty commits with `jj abandon`
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
 * // Create a new commit after a specific commit (moves to new commit)
 * const newAfterResult = await jj.new({ after: "abc123..." });
 * if (newAfterResult.ok) {
 *   console.log("New commit created after specified commit");
 * }
 *
 * // Create a new commit after a specific commit without moving to it
 * const newAfterNoEditResult = await jj.new({ after: "abc123...", noEdit: true });
 * if (newAfterNoEditResult.ok) {
 *   console.log("New commit created after specified commit (stayed on current commit)");
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
 *
 * // Abandon an empty commit (must not be the current commit)
 * const abandonResult = await jj.abandon("def456...");
 * if (abandonResult.ok) {
 *   console.log("Empty commit abandoned successfully");
 * }
 * ```
 */

import { spawn } from "node:child_process";
import { Err, Ok } from "./result";

function spawnjj(args: string[]) {
	return new Promise<
		| Ok<{ stdout: string; stderr: string }>
		| Err<"VCS Error: Command failed", { cmd: string; msg: string }>
		| Err<
				"VCS Error: Command non zero exit",
				{ cmd: string; code: number | null }
		  >
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
				Err("VCS Error: Command failed", {
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
					Err("VCS Error: Command non zero exit", {
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
			async new(options?: {
				after?: string;
				before?: string;
				noEdit?: boolean;
			}) {
				const args = ["new", "-R", dir];

				if (options?.before) {
					args.push("-B", options.before);
				}

				if (options?.after) {
					args.push("-A", options.after);
				}

				if (options?.noEdit) {
					args.push("--no-edit");
				}

				return spawnjj(args).then((result) => {
					if (result.err) return result;

					// jj new outputs to stderr, look for pattern like "Working copy  (@) now at: nylkorrm 686ce4bc"
					const head = /\b(?<change>[k-z]{8})\s+[a-f0-9]{8}/.exec(
						result.ok.stderr + " " + result.ok.stdout,
					);
					const change = head?.groups?.change;
					if (typeof change !== "string")
						return Err("VCS Error: Unexpected missing created change id");

					return Ok({ change });
				});
			},
			description: {
				async get(at: string = "@") {
					return spawnjj([
						"log",
						"-r",
						at,
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
				async replace(msg: string, at: string = "@") {
					return spawnjj(["desc", "-R", dir, "-m", msg, at]).then((result) => {
						if (result.err) return result;
						return Ok(result.ok.stdout);
					});
				},
			},
			async empty(at: string = "@") {
				return spawnjj([
					"log",
					"-r",
					at,
					"-T",
					"empty",
					"--no-graph",
					"-R",
					dir,
				]).then((result) => {
					if (result.err) return result;
					return Ok(result.ok.stdout.trim() === "true");
				});
			},
			async changeId() {
				return spawnjj(["log", "-r", "@", "--no-graph", "-R", dir]).then(
					(result) => {
						if (result.err) return result;
						const change = /^(?<change>[k-z]{8})/.exec(result.ok.stdout);

						if (typeof change?.groups?.change !== "string")
							return Err("VCS Error: Unable to get change id");
						return Ok(change.groups.change);
					},
				);
			},
			rebase: {
				slideCommit(options: {
					commit: string;
					before?: string;
					after?: string;
				}) {
					return spawnjj([
						"rebase",
						"-R",
						dir,
						"-r",
						options.commit,
						...(options.before ? ["-B", options.before] : []),
						...(options.after ? ["-A", options.after] : []),
					]);
				},
			},
			diff: {
				async summary(commit: string = "@") {
					return spawnjj(["diff", "-r", commit, "--summary", "-R", dir]).then(
						(result) => {
							if (result.err) return result;
							const output = result.ok.stdout.trim();
							if (!output) return Ok([]);

							return Ok(
								output
									.split("\n")
									.filter((line) => line.trim())
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

					const files: Array<{ file: string; diff: string }> = [];
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
						'commit_id ++ " " ++ change_id ++ " " ++ description.first_line() ++ "\\n"',
						"-R",
						dir,
					]);

					if (currentResult.err) return currentResult;

					// Parse current commit
					const currentLine = currentResult.ok.stdout.split("\n")[0]; // Get first line without trimming
					const currentParts = currentLine.split(" ");

					if (currentParts.length < 3)
						return Err("VCS Error: Unexpected commit format");
					const hash = currentParts[0];
					const changeId = currentParts[1];
					const message = currentParts.slice(2).join(" ").trim();
					const current = { hash, changeId, message };
					// Get ancestors (past commits, excluding current)
					const ancestorsResult = await spawnjj([
						"log",
						"-r",
						"::@ ~ @",
						"--no-graph",
						"-T",
						'commit_id ++ " " ++ change_id ++ " " ++ description.first_line() ++ "\\n"',
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
						'commit_id ++ " " ++ change_id ++ " " ++ description.first_line() ++ "\\n"',
						"-R",
						dir,
					]);

					if (descendantsResult.err) return descendantsResult;

					// Parse ancestors (past commits)
					const ancestorLines = ancestorsResult.ok.stdout.split("\n");
					const history: Array<{
						hash: string;
						changeId: string;
						message: string;
					}> = [];

					for (const line of ancestorLines) {
						if (!line.trim()) continue;

						const parts = line.split(" ");
						if (parts.length < 3)
							return Err("VCS Error: Unexpected commit format");

						const hash = parts[0];
						const changeId = parts[1];
						const message = parts.slice(2).join(" ").trim();

						// Skip root commit (all zeros)
						if (hash.match(/^0+$/)) continue;

						history.push({ hash, changeId, message });

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
					const future: Array<{
						hash: string;
						changeId: string;
						message: string;
					}> = [];

					for (const line of descendantLines) {
						if (!line.trim()) continue;

						const parts = line.split(" ");
						if (parts.length < 3)
							return Err("VCS Error: Unexpected commit format");

						const hash = parts[0];
						const changeId = parts[1];
						const message = parts.slice(2).join(" ").trim();

						future.push({ hash, changeId, message });

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
			async abandon(commitHash: string) {
				return spawnjj(["abandon", "-R", dir, commitHash]).then((result) => {
					if (result.err) return result;
					return Ok(result.ok.stdout);
				});
			},
		};
	},
};
