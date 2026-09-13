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

test('net catches without an action and adjacent J K L controls work', async ({ page }) => {
  await page.goto('/games/trickle-down-tycoon/');
  await page.getByTestId('game-play-options').locator('summary').click();
  await page.getByTestId('play-option-practice').check();
  await page.getByTestId('apply-play-options').click();
  await page.getByTestId('game-start').click();
  const surface = page.getByTestId('game-surface');
  for (let item = 0; item < 5; item++) {
    await page.locator('[data-next]').click();
    for (const lane of ['1', '2', '3']) await surface.press(lane);
  }
  await expect(page.locator('.tycoon-ledger')).toContainText('Books 1');
  await expect(page.locator('[data-return]')).toBeEnabled();
  await surface.press('j');
  await expect(page.locator('[data-audit]')).toBeDisabled();
  await surface.press('k');
  await expect(page.locator('[data-umbrella]')).toHaveAttribute('aria-pressed', 'true');
  await surface.press('l');
  await expect(page.locator('.tycoon-message')).toContainText('Promise returned');
});

test('a saved pause key owns K without toggling the default umbrella action', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'wh-arcade-parody.controls.bindings',
      JSON.stringify({
        version: 1,
        value: { pause: ['KeyK'] },
      }),
    );
  });
  await page.goto('/games/trickle-down-tycoon/');
  await page.getByTestId('game-start').click();
  const surface = page.getByTestId('game-surface');
  const umbrella = page.locator('[data-umbrella]');
  await expect(umbrella).toContainText('Umbrella (U / E)');
  await expect(umbrella).toHaveAttribute('aria-pressed', 'false');
  await surface.press('k');
  await expect(surface).toHaveAttribute('data-state', 'paused');
  await expect(umbrella).toHaveAttribute('aria-pressed', 'false');
  await surface.press('k');
  await expect(surface).toHaveAttribute('data-state', 'running');
  await expect(umbrella).toHaveAttribute('aria-pressed', 'false');
  await surface.press('u');
  await expect(umbrella).toHaveAttribute('aria-pressed', 'true');
});
