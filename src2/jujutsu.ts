/**
 * @fileoverview Jujutsu version control system integration
 *
 * This module provides a TypeScript wrapper around the Jujutsu (jj) version control system,
 * offering type-safe operations for commit management and description handling.
 *
 * Key features:
 * - Create new commits with `jj new`
 * - Get and set commit descriptions with proper error handling
 * - Promise-based API with Result types for robust error handling
 * - Support for multiline descriptions, special characters, and Unicode
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
 * ```
 */

import { spawn } from "node:child_process";
import { Err } from "./result";

function spawnjj(args: string[], options: { cwd: string }) {
	return new Promise<
		| Ok<{ stdout: string; stderr: string }>
		| Err<"command failed", { cmd: string; msg: string }>
		| Err<"command non zero exit", { cmd: string; code: number | null }>
	>((ok) => {
		const child = spawn("jj", args, {
			stdio: ["pipe", "pipe", "pipe"],
			cwd: options.cwd,
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
				return spawnjj(["new"], { cwd: dir }).then((result) => {
					if (result.err) return result;

					return { ok: result.ok.stdout };
				});
			},
			description: {
				async get() {
					return spawnjj(
						["log", "-r", "@", "-T", "description", "--no-graph"],
						{ cwd: dir },
					).then((result) => {
						if (result.err) return result;
						return { ok: result.ok.stdout };
					});
				},
				async replace(msg: string) {
					return spawnjj(["desc", "-m", msg], { cwd: dir }).then((result) => {
						if (result.err) return result;
						return { ok: result.ok.stdout };
					});
				},
			},
		};
	},
};
