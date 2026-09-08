import { test, expect } from '@playwright/test';

test('Rio renders movement between grid ticks and freezes it on pause', async ({ page }) => {
  await page.goto('/games/rio-rescue/');
  await page.getByTestId('game-start').click();
  await page.waitForTimeout(300);
  const positions = await page
    .locator('[data-testid="game-surface"] canvas')
    .evaluate(async (node) => {
      const canvas = node as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      const positions: number[] = [];
      for (let frame = 0; frame < 12; frame++) {
        await new Promise(requestAnimationFrame);
        const pixels = ctx.getImageData(32, 32, 576, 432).data;
        let sum = 0,
          count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          // Exact leader coat color, excluding pickups, shadows and background.
          if (pixels[i] === 70 && pixels[i + 1] === 201 && pixels[i + 2] === 170) {
            sum += (i / 4) % 576;
            count++;
          }
        }
        if (count) positions.push(Math.round(sum / count));
      }
      return positions;
    });
  expect(new Set(positions).size).toBeGreaterThan(5);
  await page.getByTestId('game-pause').click();
  const canvas = page.locator('[data-testid="game-surface"] canvas');
  const before = await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(150);
  expect(await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL())).toBe(before);
});
