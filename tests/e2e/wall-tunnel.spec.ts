import { test, expect } from '@playwright/test';
// Simulate construction plus up to twelve seconds of underground travel on both viewports.
test.setTimeout(60000);
test.beforeEach(async ({ page }, testInfo) => {
  await page.route('**/src/games/against-the-wall/model.ts*', async (route) => {
    const response = await route.fetch(),
      source = await response.text(),
      marker = /loadDistrict\(s\);\s*return s;/;
    expect(marker.test(source)).toBe(true);
    await route.fulfill({
      response,
      body: source.replace(
        marker,
        'loadDistrict(s); const fixture=s.barriers.find(b=>b.material==="concrete"); s.x=fixture.x+.5; s.y=fixture.y+1.5; s.enemies=[]; s.water.clear(); for(const tile of s.walls){const [x,y]=tile.split(",").map(Number);if(x>0&&x<63&&y>0&&y<23)s.walls.delete(tile);} ' +
          (testInfo.title.includes('drowning')
            ? 'for(let x=1;x<63;x++)for(let y=1;y<23;y++)s.water.add(`${x},${y}`); '
            : '') +
          'return s;',
      ),
    });
  });
  await page.clock.install({ time: new Date('2026-09-08T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-08T12:00:01Z'));
  await page.goto('/games/against-the-wall/?seed=123');
  await page.getByTestId('game-start').click();
});
test('selects a wall entry with no exit preview, pauses construction and emerges', async ({
  page,
}) => {
  const surface = page.getByTestId('game-surface'),
    panel = page.locator('[data-tunnel-controls]'),
    step = page.locator('[data-tunnel-step]');
  await surface.press('b');
  await expect(panel).toBeVisible();
  await expect(step).toContainText('ENTRY');
  await expect(step).toContainText('Exit is unknown');
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
  await page.clock.runFor(21000);
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
    await surface.press(cancel);
    await expect(panel).toBeHidden();
    await expect(page.locator('[data-breach]')).toHaveText('Build crossing · B');
  }
});

test('drowning shows zero health and a paused checkpoint before restarting', async ({ page }) => {
  const travel = await page.evaluate(async () => {
    // @ts-expect-error Vite source module in the browser fixture
    const M = await import('/src/games/against-the-wall/model.ts');
    const s = M.create(123);
    s.phase = 'running';
    M.beginBreach(s);
    M.chooseTunnelEndpoint(s, s.x, s.y);
    const t = s.tunnels[0];
    return Math.hypot(t.exit.x - t.entrance.x, t.exit.y - t.entrance.y) / (s.config.walk * 0.4);
  });
  const surface = page.getByTestId('game-surface');
  await surface.press('b');
  await surface.press('Enter');
  await page.clock.runFor(Math.ceil((10 + travel + 0.2) * 1000));
  await expect(page.locator('.aw-status')).toContainText('drowned');
  expect(
    await page.locator('[data-health]').evaluate((n) => (n as HTMLProgressElement).value),
  ).toBe(0);
  await page.getByTestId('game-pause').click();
  await page.clock.runFor(3000);
  await expect(page.locator('.aw-status')).toContainText('drowned');
  await page.getByTestId('game-pause').click();
  await page.clock.runFor(2100);
  expect(
    await page.locator('[data-health]').evaluate((n) => (n as HTMLProgressElement).value),
  ).toBe(100);
});
