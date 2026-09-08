import { test, expect } from '@playwright/test';
const slugs = [
  'flappy-files',
  'against-the-wall',
  'rio-rescue',
  'supply-the-people',
  'trickle-down-tycoon',
];
for (const slug of slugs) {
  test(`${slug}: playable route, lifecycle and tuning`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/games/${slug}/`);
    const surface = page.getByTestId('game-surface');
    await expect(surface).toBeVisible();
    await expect(surface).toHaveAttribute('data-state', 'title');
    await page.getByTestId('game-start').click();
    await expect(surface).toHaveAttribute('data-state', 'running');
    await page.getByTestId('game-pause').click();
    await expect(surface).toHaveAttribute('data-state', 'paused');
    await page.getByTestId('game-pause').click();
    await expect(surface).toHaveAttribute('data-state', 'running');
    await page.getByTestId('game-restart').click();
    await expect(surface).toHaveAttribute('data-state', 'title');
    await page.goto(`/#/workbench?game=${slug}`);
    await expect(page.locator('#module-selector')).toHaveValue(slug);
    await expect(page.getByTestId('tuning-panel')).toBeVisible();
    await expect(page.locator('.diagnostic-host canvas')).toBeVisible();
    expect(
      await page.locator('.tuning-fields input,.tuning-fields select').count(),
    ).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.goto('/');
    await expect(page.getByTestId('arcade-card')).toHaveCount(5);
    expect(errors).toEqual([]);
  });
}

test('global motion and sound preferences reach Flappy and its workbench', async ({ page }) => {
  await page.goto('/#/settings');
  await page.locator('#motion-setting').check();
  await page.locator('#sound-setting').check();
  await page.goto('/#/games/flappy-files');
  await expect(page.getByTestId('game-surface')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.getByTestId('game-surface')).toHaveAttribute('data-muted', 'false');
  await page.goto('/#/workbench?game=flappy-files');
  await expect(page.locator('input[data-key="presentation.reducedMotion"]')).toBeChecked();
  await expect(page.locator('.diagnostic-host')).toHaveAttribute('data-muted', 'false');
});

for (const slug of ['supply-the-people', 'trickle-down-tycoon']) {
  test(`${slug}: player practice options and remapped pause`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'wh-arcade-parody.controls.bindings',
        JSON.stringify({ version: 1, value: { pause: ['KeyK'] } }),
      );
    });
    await page.goto(`/#/games/${slug}`);
    await page.getByTestId('game-play-options').locator('summary').click();
    await page.getByTestId('play-option-practice').check();
    await page.getByTestId('apply-play-options').click();
    await expect(page.locator('.play-options-status')).toContainText('Play options applied');
    await page.getByTestId('game-start').click();
    const surface = page.getByTestId('game-surface');
    await surface.press('k');
    await expect(surface).toHaveAttribute('data-state', 'paused');
    await surface.press('k');
    await expect(surface).toHaveAttribute('data-state', 'running');
  });
}
