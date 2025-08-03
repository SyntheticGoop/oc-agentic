// Simple test to verify new plan creation works
const { JujutsuPlanPersistence } = require("./src/persistence/persistence.ts");

async function testNewPlan() {
	console.log("Testing new plan creation...");

	// This would normally fail if no plan exists, but now should return an empty plan
	const persistence = new JujutsuPlanPersistence(null); // Mock jujutsu instance

	try {
		const result = await persistence.load();
		if (result.ok) {
			console.log("✅ Successfully loaded empty plan:", result.ok);
			console.log("Plan structure:", {
				scope: result.ok.scope,
				plan_key: result.ok.plan_key,
				title: result.ok.title,
				intent: result.ok.intent,
				objectives: result.ok.objectives,
				constraints: result.ok.constraints,
				tasks: result.ok.tasks,
			});
		} else {
			console.log("❌ Failed to load plan:", result.err);
		}
	} catch (error) {
		console.log("❌ Error during test:", error.message);
	}
}

testNewPlan();
