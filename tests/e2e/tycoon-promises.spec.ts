import { test, expect } from '@playwright/test';

test('caught promises return to issuers and umbrella/reactions respect pause', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-08T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-08T12:00:01Z'));
  await page.goto('/games/trickle-down-tycoon/');
  await page.getByTestId('game-play-options').locator('summary').click();
  await page.getByTestId('play-option-practice').check();
  await page.getByTestId('apply-play-options').click();
  await page.getByTestId('game-start').click();
  for (let i = 0; i < 5; i++) {
    await page.locator('[data-next]').click();
    for (let lane = 0; lane < 3; lane++) {
      await page.locator(`[data-lane="${lane}"]`).click();
      await page.locator('[data-catch]').click();
    }
  }
  await expect(page.locator('[data-return]')).toBeEnabled();
  await expect(page.locator('[data-return]')).toContainText('1');
  await page.getByTestId('game-surface').press('q');
  await expect(page.locator('[data-return]')).toBeDisabled();
  await expect(page.locator('.tycoon-message')).toContainText('Promise returned');
  await page.getByTestId('game-surface').press('u');
  await expect(page.locator('[data-umbrella]')).toHaveAttribute('aria-pressed', 'true');
  await page.clock.runFor(1400);
  await page.getByTestId('game-pause').click();
  const canvas = page.getByTestId('game-surface').locator('canvas');
  const frozen = await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL());
  await page.clock.runFor(3000);
  expect(await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL())).toBe(frozen);
  await page.getByTestId('game-pause').click();
  await page.clock.runFor(18000);
  await expect(page.locator('.tycoon-message')).toHaveText(/stream has stopped|Promise fulfilled/);
  await page.getByTestId('game-restart').click();
  await expect(page.locator('[data-umbrella]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.tycoon-ledger')).toContainText('Bonus +0%');
});
