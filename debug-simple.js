// Simple debug test
const { spawn } = require("child_process");
const { promises: fs } = require("fs");
const { join } = require("path");

async function createTestRepo(name) {
	const repoPath = join(__dirname, "debug-env", name);
	await fs.mkdir(repoPath, { recursive: true });

	return new Promise((resolve, reject) => {
		const child = spawn("jj", ["git", "init"], {
			cwd: repoPath,
			stdio: "pipe",
		});

		child.on("close", (code) => {
			if (code === 0) {
				resolve(repoPath);
			} else {
				reject(new Error(`Failed to initialize jj repo: ${code}`));
			}
		});

		child.on("error", reject);
	});
}

async function runJjCommand(cwd, args) {
	return new Promise((resolve, reject) => {
		const child = spawn("jj", args, {
			cwd,
			stdio: "pipe",
		});

		let stdout = "";
		let stderr = "";

		child.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		child.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		child.on("close", (code) => {
			resolve({ code, stdout, stderr });
		});

		child.on("error", reject);
	});
}

async function main() {
	const testRepoPath = await createTestRepo(`debug-simple-${Math.random()}`);

	console.log("=== Creating commits manually ===");

	// Create begin commit
	let result = await runJjCommand(testRepoPath, ["new"]);
	console.log("New commit 1:", result);

	result = await runJjCommand(testRepoPath, [
		"describe",
		"-m",
		"begin(api): api development",
	]);
	console.log("Describe begin:", result);

	// Create task commit 1
	result = await runJjCommand(testRepoPath, ["new"]);
	console.log("New commit 2:", result);

	result = await runJjCommand(testRepoPath, [
		"describe",
		"-m",
		"feat(api): create rest endpoints",
	]);
	console.log("Describe task 1:", result);

	// Create task commit 2
	result = await runJjCommand(testRepoPath, ["new"]);
	console.log("New commit 3:", result);

	result = await runJjCommand(testRepoPath, [
		"describe",
		"-m",
		"feat(api):~ add graphql schema",
	]);
	console.log("Describe task 2:", result);

	// Create end commit
	result = await runJjCommand(testRepoPath, ["new"]);
	console.log("New commit 4:", result);

	result = await runJjCommand(testRepoPath, [
		"describe",
		"-m",
		"end(api): api development",
	]);
	console.log("Describe end:", result);

	// Check history
	result = await runJjCommand(testRepoPath, ["log", "--no-graph"]);
	console.log("=== Final History ===");
	console.log(result.stdout);

	// Cleanup
	await fs.rm(testRepoPath, { recursive: true, force: true });
}

main().catch(console.error);
