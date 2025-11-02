import { test, expect } from '@playwright/test';

test.describe('Market page transitions', () => {
  test('measure BSV20 to BSV21 transition time', async ({ page }) => {
    // Navigate to BSV20 page
    await page.goto('http://localhost:3000/market/bsv20');
    await page.waitForLoadState('networkidle');

    // Wait for content to be visible
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    console.log('BSV20 page loaded');

    // Start timing
    const startTime = Date.now();

    // Click BSV21 tab
    await page.click('a[href="/market/bsv21"]');

    // Wait for the page to navigate
    await page.waitForURL('**/market/bsv21');

    // Wait for content to be visible (table rows loaded)
    await page.waitForSelector('table tbody tr:not(.skeleton)', { timeout: 10000 });

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    const endTime = Date.now();
    const transitionTime = endTime - startTime;

    console.log(`\n=== BSV20 → BSV21 Transition ===`);
    console.log(`Total time: ${transitionTime}ms`);
    console.log(`================================\n`);

    // Assert reasonable performance (adjust threshold as needed)
    expect(transitionTime).toBeLessThan(3000);
  });

  test('measure BSV21 to BSV20 transition time', async ({ page }) => {
    // Navigate to BSV21 page
    await page.goto('http://localhost:3000/market/bsv21');
    await page.waitForLoadState('networkidle');

    // Wait for content to be visible
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    console.log('BSV21 page loaded');

    // Start timing
    const startTime = Date.now();

    // Click BSV20 tab
    await page.click('a[href="/market/bsv20"]');

    // Wait for the page to navigate
    await page.waitForURL('**/market/bsv20');

    // Wait for content to be visible
    await page.waitForSelector('table tbody tr:not(.skeleton)', { timeout: 10000 });

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    const endTime = Date.now();
    const transitionTime = endTime - startTime;

    console.log(`\n=== BSV21 → BSV20 Transition ===`);
    console.log(`Total time: ${transitionTime}ms`);
    console.log(`================================\n`);

    // Assert reasonable performance
    expect(transitionTime).toBeLessThan(3000);
  });

  test('detailed timing breakdown for BSV20 → BSV21', async ({ page }) => {
    await page.goto('http://localhost:3000/market/bsv20');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const timings: Record<string, number> = {};

    // Start timing
    const startTime = Date.now();
    timings.start = 0;

    // Click the tab
    await page.click('a[href="/market/bsv21"]');
    timings.clicked = Date.now() - startTime;

    // Wait for URL change
    await page.waitForURL('**/market/bsv21');
    timings.urlChanged = Date.now() - startTime;

    // Wait for skeleton to appear (if any)
    const skeletonVisible = await page.locator('.skeleton').first().isVisible().catch(() => false);
    if (skeletonVisible) {
      timings.skeletonVisible = Date.now() - startTime;
    }

    // Wait for first real content
    await page.waitForSelector('table tbody tr:not(.skeleton)', { timeout: 10000 });
    timings.firstContentVisible = Date.now() - startTime;

    // Wait for network idle
    await page.waitForLoadState('networkidle');
    timings.networkIdle = Date.now() - startTime;

    console.log(`\n=== Detailed Timing Breakdown ===`);
    console.log(`Click registered: ${timings.clicked}ms`);
    console.log(`URL changed: ${timings.urlChanged}ms`);
    if (timings.skeletonVisible) {
      console.log(`Skeleton visible: ${timings.skeletonVisible}ms`);
    }
    console.log(`First content visible: ${timings.firstContentVisible}ms`);
    console.log(`Network idle: ${timings.networkIdle}ms`);
    console.log(`Total: ${timings.networkIdle}ms`);
    console.log(`=================================\n`);
  });
});
