import { test, expect } from '@playwright/test';

test('real held Shift drains sprint, pause freezes it and release recharges', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-08T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-08T12:00:01Z'));
  await page.goto('/games/against-the-wall/?seed=123');
  await page.getByTestId('game-start').click();
  const surface = page.getByTestId('game-surface');
  const stamina = () =>
    page.locator('[data-stamina]').evaluate((n) => (n as HTMLProgressElement).value);
  await surface.focus();
  await page.keyboard.down('ShiftLeft');
  await page.keyboard.down('KeyD');
  await page.clock.runFor(300);
  // Sample while held: sampling after release with a real clock can observe regeneration.
  const running = await stamina();
  expect(running).toBeLessThan(3.9);
  expect(running).toBeGreaterThan(3.5);
  await page.getByTestId('game-pause').click();
  await page.keyboard.up('KeyD');
  await page.keyboard.up('ShiftLeft');
  await page.clock.runFor(600);
  expect(await stamina()).toBe(running);
  await page.getByTestId('game-pause').click();
  await page.clock.runFor(500);
  expect(await stamina()).toBe(4);
});
