import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const errors = [];
const warnings = [];

page.on("console", (msg) => {
	const text = msg.text();
	const type = msg.type();
	if (type === "error") errors.push(text);
	else if (type === "warning") warnings.push(text);
	else console.log(`[Browser ${type}]`, text);
});

page.on("pageerror", (error) => {
	errors.push(`Page Error: ${error.message}\n${error.stack}`);
});

console.log("Loading homepage...");
await page.goto("http://localhost:4312", {
	waitUntil: "networkidle",
	timeout: 30000,
});

// Wait for initial images to load
await page.waitForTimeout(2000);

// Count initial images and check layout
const initialInfo = await page.evaluate(() => {
	const images = document.querySelectorAll("img");
	const flowGrid = document.querySelector('[class*="FlowGrid"]') || document.querySelector('.flex.gap-4');
	const columns = flowGrid ? flowGrid.querySelectorAll('.flex-1') : [];

	return {
		imageCount: images.length,
		flowGridHeight: flowGrid ? flowGrid.offsetHeight : 0,
		flowGridScrollHeight: flowGrid ? flowGrid.scrollHeight : 0,
		columnCount: columns.length,
		bodyHeight: document.body.offsetHeight,
		bodyScrollHeight: document.body.scrollHeight,
		windowHeight: window.innerHeight,
		hasOverflow: document.body.scrollHeight > window.innerHeight
	};
});
console.log(`Initial layout info:`, initialInfo);

const initialCount = initialInfo.imageCount;

// Check if FlowGrid is rendering
const flowGridExists = initialInfo.flowGridHeight > 0;
console.log(`FlowGrid exists: ${flowGridExists}`);

// Scroll to bottom to trigger infinite scroll
console.log("Scrolling to bottom to trigger infinite scroll...");
await page.evaluate(() => {
	window.scrollTo(0, document.body.scrollHeight);
});

// Wait for new images to load
await page.waitForTimeout(3000);

// Count after scroll
const afterScrollCount = await page.evaluate(() => {
	return document.querySelectorAll("img").length;
});
console.log(`Image count after scroll: ${afterScrollCount}`);

// Check if more images loaded
if (afterScrollCount > initialCount) {
	console.log(
		`✓ Infinite scroll working! Loaded ${afterScrollCount - initialCount} more images`,
	);
} else {
	console.log(`✗ Infinite scroll not working - image count unchanged`);
}

console.log("\n=== Summary ===");
console.log(`ERRORS: ${errors.length}`);
if (errors.length > 0) {
	console.log("\nError details:");
	errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
}

console.log(`\nWARNINGS: ${warnings.length}`);
if (warnings.length > 0) {
	console.log("\nWarning details:");
	warnings.slice(0, 5).forEach((warn, i) => console.log(`${i + 1}. ${warn}`));
	if (warnings.length > 5) {
		console.log(`... and ${warnings.length - 5} more warnings`);
	}
}

await browser.close();
