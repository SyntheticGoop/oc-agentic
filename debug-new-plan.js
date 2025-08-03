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

async function main() {
	const { Jujutsu } = await import("./src/jujutsu.js");
	const { Loader } = await import("./src/persistence/loader.js");
	const { Saver } = await import("./src/persistence/saver.js");

	const testRepoPath = await createTestRepo(`debug-${Math.random()}`);
	const jj = Jujutsu.cwd(testRepoPath);
	const loader = new Loader(jj);
	const saver = new Saver(jj, loader);

	const multiTaskPlan = {
		scope: "api",
		intent: "multi-task plan",
		title: "api development",
		objectives: ["rest endpoints", "graphql schema"],
		constraints: ["backwards compatible"],
		tasks: [
			{
				type: "feat",
				scope: "api",
				title: "create rest endpoints",
				intent: "rest task intent",
				objectives: ["crud operations"],
				constraints: ["openapi spec"],
				completed: true,
			},
			{
				type: "feat",
				scope: "api",
				title: "add graphql schema",
				intent: "graphql task intent",
				objectives: ["type definitions"],
				constraints: ["apollo server"],
				completed: false,
			},
		],
	};

	console.log("Creating new plan...");
	const result = await saver.saveNewPlan(multiTaskPlan);
	if (result.err) {
		console.error("Error creating plan:", result.err);
		return;
	}

	console.log("Getting history...");
	const historyResult = await jj.history.linear();
	if (historyResult.ok) {
		const history = historyResult.ok.history || [];
		console.log("History messages:");
		history.forEach((h, i) => console.log(`${i}: ${h.message}`));

		console.log("Current commit:", historyResult.ok.current.message);

		console.log("Future commits:");
		historyResult.ok.future.forEach((h, i) =>
			console.log(`${i}: ${h.message}`),
		);
	}

	console.log("Trying to load plan...");
	const loadResult = await loader.loadPlan();
	if (loadResult.err) {
		console.error("Error loading plan:", loadResult.err);
	} else {
		console.log("Plan loaded successfully:", loadResult.ok);
	}

	// Cleanup
	await fs.rm(testRepoPath, { recursive: true, force: true });
}

main().catch(console.error);
