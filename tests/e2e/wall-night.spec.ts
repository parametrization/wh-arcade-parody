import { test, expect } from '@playwright/test';

test('Wall daylight changes at nightfall, health is visible, and pause freezes the countdown', async ({
  page,
}) => {
  // Keep the actual host, clock, HUD and renderer; start immediately before dusk.
  await page.route('**/src/games/against-the-wall/model.ts*', async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const marker = /loadDistrict\(s\);\s*return s;/;
    expect(marker.test(source)).toBe(true);
    await route.fulfill({
      response,
      body: source.replace(
        marker,
        'loadDistrict(s);\n s.time=59; s.health=65; s.enemies=[];\n return s;',
      ),
    });
  });
  await page.clock.install({ time: new Date('2026-09-08T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-08T12:00:01Z'));
  await page.goto('/games/against-the-wall/');
  await page.getByTestId('game-start').click();
  const daylight = page.locator('[data-daylight]');
  const health = page.locator('[data-health]');
  await expect(daylight).toContainText('Day');
  await expect(health).toBeVisible();
  expect(await health.evaluate((node) => (node as HTMLProgressElement).value)).toBe(65);
  await page.clock.runFor(2100);
  await expect(daylight).toContainText('Night');
  await page.getByTestId('game-pause').click();
  const frozen = await daylight.textContent();
  await page.clock.runFor(4000);
  expect(await daylight.textContent()).toBe(frozen);
  expect(await health.evaluate((node) => (node as HTMLProgressElement).value)).toBe(65);
  await page.getByTestId('game-pause').click();
  await page.clock.runFor(2100);
  await expect(daylight).toContainText('Night');
  expect(await daylight.textContent()).not.toBe(frozen);
});
