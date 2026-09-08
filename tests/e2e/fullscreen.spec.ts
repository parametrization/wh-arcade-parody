import { test, expect } from '@playwright/test';

test('fullscreen fits each playfield to the display and restores normal sizing', async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop fullscreen scaling regression');
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  try {
    for (const slug of [
      'flappy-files',
      'against-the-wall',
      'rio-rescue',
      'supply-the-people',
      'trickle-down-tycoon',
    ]) {
      await page.goto(`http://localhost:8643/#/games/${slug}`);
      const canvas = page.locator('.game-surface canvas');
      await expect(canvas).toBeVisible();
      const normal = (await canvas.boundingBox())!;
      await page.getByTestId('game-fullscreen').click();
      await expect
        .poll(() =>
          page.evaluate(() => document.fullscreenElement?.classList.contains('game-surface')),
        )
        .toBe(true);
      await expect
        .poll(async () => (await canvas.boundingBox())!.height)
        .toBeGreaterThan(normal.height + (slug === 'against-the-wall' ? 2 : 20));
      const expanded = (await canvas.boundingBox())!;
      const screen = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
      expect(expanded.x).toBeGreaterThanOrEqual(0);
      expect(expanded.y).toBeGreaterThanOrEqual(0);
      expect(expanded.x + expanded.width).toBeLessThanOrEqual(screen.width + 1);
      expect(expanded.y + expanded.height).toBeLessThanOrEqual(screen.height + 1);
      await page.getByTestId('game-exit-fullscreen').click();
      await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
      await expect
        .poll(async () => Math.abs((await canvas.boundingBox())!.width - normal.width))
        .toBeLessThan(2);
    }
  } finally {
    await context.close();
  }
});
