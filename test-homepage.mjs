import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
const warnings = [];
const logs = [];

// Capture console messages
page.on('console', msg => {
  const text = msg.text();
  const type = msg.type();

  if (type === 'error') {
    errors.push(text);
  } else if (type === 'warning') {
    warnings.push(text);
  } else {
    logs.push(`[${type}] ${text}`);
  }
});

// Capture page errors
page.on('pageerror', error => {
  errors.push(`Page Error: ${error.message}\n${error.stack}`);
});

console.log('Loading http://localhost:3001...\n');

try {
  await page.goto('http://localhost:3001', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait a bit for React to hydrate
  await page.waitForTimeout(3000);

  console.log('='.repeat(80));
  console.log('ERRORS (' + errors.length + '):');
  console.log('='.repeat(80));
  if (errors.length > 0) {
    errors.forEach((err, i) => {
      console.log(`\n[${i + 1}] ${err}`);
    });
  } else {
    console.log('✅ No errors!');
  }

  console.log('\n' + '='.repeat(80));
  console.log('WARNINGS (' + warnings.length + '):');
  console.log('='.repeat(80));
  if (warnings.length > 0) {
    warnings.forEach((warn, i) => {
      console.log(`\n[${i + 1}] ${warn}`);
    });
  } else {
    console.log('✅ No warnings!');
  }

  console.log('\n' + '='.repeat(80));
  console.log('OTHER LOGS (showing first 20):');
  console.log('='.repeat(80));
  logs.slice(0, 20).forEach((log, i) => {
    console.log(`[${i + 1}] ${log}`);
  });

  if (logs.length > 20) {
    console.log(`\n... and ${logs.length - 20} more logs`);
  }

} catch (error) {
  console.error('Failed to load page:', error.message);
}

await browser.close();
