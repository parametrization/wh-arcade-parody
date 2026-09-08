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
        // The perspective camera follows the leader: track scene movement
        // between ticks instead of expecting the leader to leave screen center.
        let signature = 2166136261;
        for (let i = 0; i < pixels.length; i += 64)
          signature = Math.imul(signature ^ pixels[i], 16777619);
        positions.push(signature);
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

test('Rio can wait for a camera sweep without ending the run', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-08T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-08T12:00:01Z'));
  await page.goto('/games/rio-rescue/');
  await page.getByTestId('game-start').click();
  await page.getByTestId('game-surface').press('x');
  const before = await page.locator('[data-board]').textContent();
  await page.clock.runFor(900);
  expect(await page.locator('[data-board]').textContent()).toBe(before);
  await expect(page.getByTestId('game-surface')).toHaveAttribute('data-state', 'running');
  await expect(
    page.getByRole('button', { name: 'Continue moving · X', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('game-surface').press('x');
  await page.clock.runFor(300);
  await expect(page.locator('[data-board]')).toContainText('column 5, row 8');
});
