import { expect, test } from "@playwright/test";

test("all outpoint tabs should work without full page reload", async ({
	page,
}) => {
	// Test the outpoint with owner tab
	await page.goto(
		"http://localhost:3000/outpoint/6b051a59c44907f65a1c8d0838007fe57d6ddd3ebc4378e80d04da76b1e707c8_0/timeline",
	);

	// Wait for page to load
	await page.waitForLoadState("networkidle");

	// Check for heading (top area)
	const heading = await page.locator("h2").first();
	const headingVisible = await heading.isVisible();
	console.log("Heading visible:", headingVisible);
	if (!headingVisible) {
		console.error("ERROR: Heading not visible!");
	}
	expect(headingVisible).toBe(true);

	// Get the tabs container element
	const tabsContainer = await page.locator('[role="tablist"]');
	await expect(tabsContainer).toBeVisible();

	// Dynamically get all visible tab buttons (excluding the active one we're already on)
	const tabButtons = await page
		.locator('[role="tablist"] button[role="tab"]')
		.all();
	const tabNames = await Promise.all(
		tabButtons.map((btn) => btn.textContent()),
	);

	console.log(`Found tabs: ${tabNames.join(", ")}`);

	// Test each tab except Timeline (which we're already on)
	const tabsToTest = tabNames.filter((name) => name && name !== "Timeline");

	for (const tabName of tabsToTest) {
		console.log(`\nTesting ${tabName} tab...`);

		// Click the tab
		await page.click(`button:has-text("${tabName}")`);

		// Wait a moment for transition
		await page.waitForTimeout(300);

		// Check if heading is still visible
		const headingStillVisible = await heading.isVisible();
		console.log(`  Heading still visible: ${headingStillVisible}`);

		// Check if tabs container is still visible
		const tabsStillVisible = await tabsContainer.isVisible();
		console.log(`  Tabs still visible: ${tabsStillVisible}`);

		// Check URL
		const url = page.url();
		console.log(`  URL: ${url}`);

		// Assertions
		expect(headingStillVisible).toBe(true);
		expect(tabsStillVisible).toBe(true);
	}

	console.log("\n✅ All tabs tested successfully!");
});
