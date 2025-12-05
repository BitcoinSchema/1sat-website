import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];

page.on("console", (msg) => {
	const text = msg.text();
	const type = msg.type();
	if (type === "error") {
		errors.push(text);
	}
});

page.on("pageerror", (error) => {
	errors.push(`Page Error: ${error.message}\n${error.stack}`);
});

console.log("Loading market page...\n");

try {
	await page.goto("http://localhost:3001/market", {
		waitUntil: "networkidle",
		timeout: 30000,
	});

	await page.waitForTimeout(3000);

	console.log("=".repeat(80));
	console.log(`ERRORS (${errors.length}):`);
	console.log("=".repeat(80));

	if (errors.length > 0) {
		errors.forEach((err, i) => {
			console.log(`\n[${i + 1}]`);
			console.log(err);
			console.log("-".repeat(80));
		});
	} else {
		console.log("✅ No errors!");
	}
} catch (error) {
	console.error("Failed to load page:", error.message);
}

await browser.close();
