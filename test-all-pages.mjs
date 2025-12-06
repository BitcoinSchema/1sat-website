import { chromium } from "playwright";

const pages = [
	{ name: "Homepage", url: "http://localhost:3001" },
	{ name: "Wallet", url: "http://localhost:3001/wallet" },
	{ name: "Market", url: "http://localhost:3001/market" },
	{ name: "Inscribe", url: "http://localhost:3001/inscribe" },
	{ name: "Activity", url: "http://localhost:3001/activity" },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();

for (const pageInfo of pages) {
	console.log(`\n${"=".repeat(80)}`);
	console.log(`TESTING: ${pageInfo.name}`);
	console.log("=".repeat(80));

	const page = await context.newPage();
	const errors = [];
	const warnings = [];

	page.on("console", (msg) => {
		const text = msg.text();
		const type = msg.type();
		if (type === "error") errors.push(text);
		else if (type === "warning") warnings.push(text);
	});

	page.on("pageerror", (error) => {
		errors.push(`Page Error: ${error.message}`);
	});

	try {
		await page.goto(pageInfo.url, {
			waitUntil: "networkidle",
			timeout: 30000,
		});

		await page.waitForTimeout(2000);

		console.log(`\n✓ Loaded: ${pageInfo.url}`);
		console.log(`  Errors: ${errors.length}`);
		console.log(`  Warnings: ${warnings.length}`);

		if (errors.length > 0) {
			console.log("\n  First 5 errors:");
			errors.slice(0, 5).forEach((err, i) => {
				console.log(`    ${i + 1}. ${err.substring(0, 150)}`);
			});
		}

		if (warnings.length > 0) {
			console.log("\n  First 3 warnings:");
			warnings.slice(0, 3).forEach((warn, i) => {
				console.log(`    ${i + 1}. ${warn.substring(0, 150)}`);
			});
		}
	} catch (error) {
		console.log(`\n✗ FAILED: ${error.message}`);
	}

	await page.close();
}

console.log(`\n${"=".repeat(80)}`);
console.log("TEST SUMMARY");
console.log("=".repeat(80));
console.log(`Tested ${pages.length} pages`);
console.log(`${"=".repeat(80)}\n`);

await context.close();
await browser.close();
