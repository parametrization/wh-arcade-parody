import { test, expect, type Page } from '@playwright/test';

async function freezeClock(page: Page) {
  await page.clock.install({ time: new Date('2026-09-08T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-08T12:00:01Z'));
}

test('Flappy inner Start restores game focus and real Space keeps the eagle flying', async ({
  page,
}) => {
  await freezeClock(page);
  await page.goto('/games/flappy-files/');
  const surface = page.getByTestId('game-surface');
  await page.getByRole('button', { name: 'Start delivery', exact: true }).click();
  await expect(surface).toBeFocused();
  // With no flap input this starting trajectory hits the ground before 1.35s.
  // Real keyboard events must flap repeatedly, not merely activate a focused button.
  for (let i = 0; i < 3; i++) {
    await page.clock.runFor(450);
    await page.keyboard.press('Space');
  }
  await page.clock.runFor(50);
  await expect(surface).toHaveAttribute('data-state', 'running');
  await expect(page.locator('.ff-overlay')).toBeHidden();
});

test('pointer direction control hands focus back for the next keyboard direction', async ({
  page,
}) => {
  await freezeClock(page);
  await page.goto('/games/rio-rescue/');
  await page.getByTestId('game-start').click();
  await page.getByRole('button', { name: 'Move up', exact: true }).click();
  await expect(page.getByTestId('game-surface')).toBeFocused();
  await page.clock.runFor(300);
  await expect(page.locator('[data-board]')).toContainText('column 4, row 7');
  await page.keyboard.press('ArrowLeft');
  await page.clock.runFor(300);
  await expect(page.locator('[data-board]')).toContainText('column 3, row 7');
});

test('workbench initially focuses its runtime and accepts real keyboard pause', async ({
  page,
}) => {
  await freezeClock(page);
  await page.goto('/#/workbench');
  await expect(page.locator('.diagnostic-host')).toBeFocused();
  await page.keyboard.press('Space');
  await page.clock.runFor(200);
  await expect(page.getByTestId('diagnostic-state')).toHaveText('paused');
  await page.keyboard.press('Space');
  await page.clock.runFor(200);
  await expect(page.getByTestId('diagnostic-state')).toHaveText('running');
});

test('game canvases use larger desktop presentation without mobile overflow', async ({ page }) => {
  for (const [slug, logicalWidth] of [
    ['flappy-files', 512],
    ['supply-the-people', 640],
  ] as const) {
    await page.goto(`/games/${slug}/`);
    const canvas = page.getByTestId('game-surface').locator('canvas');
    await expect(canvas).toBeVisible();
    const width = await canvas.evaluate((element) => element.getBoundingClientRect().width);
    if ((page.viewportSize()?.width ?? 0) >= 1000) expect(width).toBeGreaterThan(logicalWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
});
