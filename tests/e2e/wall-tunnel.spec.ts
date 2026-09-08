import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('**/src/games/against-the-wall/model.ts*', async (route) => {
    const response = await route.fetch(),
      source = await response.text(),
      marker = /loadDistrict\(s\);\s*return s;/;
    expect(marker.test(source)).toBe(true);
    await route.fulfill({
      response,
      body: source.replace(
        marker,
        'loadDistrict(s); const fixture=s.barriers.find(b=>b.material==="concrete"); s.x=fixture.x+.5; s.y=fixture.y+1.5; s.enemies=[]; return s;',
      ),
    });
  });
  await page.clock.install({ time: new Date('2026-09-08T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-08T12:00:01Z'));
  await page.goto('/games/against-the-wall/?seed=123');
  await page.getByTestId('game-start').click();
});
test('selects tunnel endpoints, freezes construction when paused and completes digging', async ({
  page,
}) => {
  const surface = page.getByTestId('game-surface'),
    panel = page.locator('[data-tunnel-controls]'),
    step = page.locator('[data-tunnel-step]');
  await surface.press('b');
  await expect(panel).toBeVisible();
  await expect(step).toContainText('ENTRY');
  await surface.press('Enter');
  await expect(step).toContainText('EXIT');
  const initial = await step.textContent();
  await page.locator('[data-tunnel-next]').click();
  expect(await step.textContent()).not.toBe(initial);
  await surface.press('Enter');
  await expect(panel).toBeHidden();
  const progress = page.locator('[data-construction]'),
    value = () => progress.evaluate((n) => (n as HTMLProgressElement).value);
  await page.clock.runFor(2000);
  expect(await value()).toBeGreaterThan(0.1);
  expect(await value()).toBeLessThan(0.3);
  await page.getByTestId('game-pause').click();
  const paused = await value();
  await page.clock.runFor(3000);
  expect(await value()).toBe(paused);
  await page.getByTestId('game-pause').click();
  await page.clock.runFor(11000);
  await expect(page.locator('.aw-status')).toContainText(/Tunnel crossed|Tunnel ready/);
  await expect(page.locator('[data-breach]')).toHaveText('Build crossing · B');
  expect(await value()).toBe(0);
});
test('B and Escape cancel endpoint selection without beginning construction', async ({ page }) => {
  const surface = page.getByTestId('game-surface'),
    panel = page.locator('[data-tunnel-controls]');
  for (const cancel of ['b', 'Escape']) {
    await surface.press('b');
    await expect(panel).toBeVisible();
    await surface.press('Enter');
    await expect(page.locator('[data-tunnel-step]')).toContainText('EXIT');
    await surface.press(cancel);
    await expect(panel).toBeHidden();
    await expect(page.locator('[data-breach]')).toHaveText('Build crossing · B');
  }
});
