import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

await page.goto('http://localhost:3001');
await page.waitForTimeout(2000);

console.log('Scrolling down 1000px...');
await page.evaluate(() => window.scrollTo(0, 1000));
await page.waitForTimeout(1000);

const button = await page.$('button[aria-label="Scroll to top"]');
console.log('Button found after scroll:', button !== null);

if (button) {
  const isVisible = await button.isVisible();
  console.log('Button is visible:', isVisible);

  const styles = await button.evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      zIndex: computed.zIndex,
      position: computed.position,
    };
  });
  console.log('Button styles:', styles);
}

await browser.close();
