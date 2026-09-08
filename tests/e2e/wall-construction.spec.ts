import { test, expect } from '@playwright/test';

test('live Wall keyboard construction progresses, pauses, cancels on movement and completes', async ({
  page,
}) => {
  // Change only the initial position and enemies; mount the actual host, services,
  // input bindings, UI, model and renderer with an adjacent wire fixture.
  await page.route('**/src/games/against-the-wall/model.ts*', async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const marker = /loadDistrict\(s\);\s*return s;/;
    expect(marker.test(source)).toBe(true);
    await route.fulfill({
      response,
      body: source.replace(
        marker,
        'loadDistrict(s);\n  s.x=3.5; s.y=11.5; s.enemies=[];\n  return s;',
      ),
    });
  });
  await page.clock.install({ time: new Date('2026-09-08T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-08T12:00:01Z'));
  await page.goto('/games/against-the-wall/');
  await page.getByTestId('game-start').click();
  const surface = page.getByTestId('game-surface');
  const progress = page.locator('[data-construction]');
  const value = () => progress.evaluate((node) => (node as HTMLProgressElement).value);
  await surface.press('b');
  await expect(page.locator('[data-breach]')).toHaveText('Cancel construction · B');
  await page.clock.runFor(1000);
  expect(await value()).toBeGreaterThan(0.2);
  expect(await value()).toBeLessThan(0.5);
  await page.getByTestId('game-pause').click();
  const paused = await value();
  await page.clock.runFor(2000);
  expect(await value()).toBe(paused);
  await page.getByTestId('game-pause').click();
  await surface.focus();
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(100);
  await page.keyboard.up('ArrowRight');
  expect(await value()).toBe(0);
  await expect(page.locator('[data-breach]')).toHaveText('Build crossing · B');
  await surface.press('b');
  await page.clock.runFor(3200);
  await expect(page.locator('.aw-status')).toContainText('Crossing open');
  await expect(page.locator('[data-breach]')).toHaveText('Build crossing · B');
});
