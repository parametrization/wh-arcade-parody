import { test, expect } from '@playwright/test';

const slugs = [
  'flappy-files',
  'against-the-wall',
  'rio-rescue',
  'supply-the-people',
  'trickle-down-tycoon',
];
for (const slug of slugs) {
  test(`${slug}: any-key starts, guide pauses, audio follows runtime`, async ({ page }) => {
    if (slug === 'flappy-files') {
      await page.clock.install({ time: new Date('2026-09-08T12:00:00Z') });
      await page.clock.pauseAt(new Date('2026-09-08T12:00:01Z'));
    }
    await page.goto('/#/settings');
    await page.locator('#sound-setting').check();
    await page.goto(`/games/${slug}/`);
    const surface = page.getByTestId('game-surface');
    await expect(surface).toHaveAttribute('data-state', 'title');
    await surface.focus();
    await page.keyboard.press('z');
    await expect(surface).toHaveAttribute('data-state', 'running');
    await expect
      .poll(async () => {
        if (slug === 'flappy-files') await page.clock.runFor(50);
        return JSON.parse((await surface.getAttribute('data-audio')) ?? '{}').musicPlaying;
      })
      .toBe(true);
    await page.getByTestId('how-to-play').click();
    await expect(surface).toHaveAttribute('data-state', 'paused');
    await expect(page.locator('.game-instructions')).toHaveAttribute('open', '');
    await expect
      .poll(async () => {
        if (slug === 'flappy-files') await page.clock.runFor(50);
        return JSON.parse((await surface.getAttribute('data-audio')) ?? '{}').musicPlaying;
      })
      .toBe(false);
    await page.getByTestId('game-pause').click();
    await expect
      .poll(async () => {
        if (slug === 'flappy-files') await page.clock.runFor(50);
        return JSON.parse((await surface.getAttribute('data-audio')) ?? '{}').musicPlaying;
      })
      .toBe(true);
  });
}

test('typing a replay seed does not start play', async ({ page }) => {
  await page.goto('/games/rio-rescue/');
  const input = page.locator('input[type="number"]').first();
  await input.fill('123');
  await input.press('ArrowLeft');
  await expect(page.getByTestId('game-surface')).toHaveAttribute('data-state', 'title');
});

test('Supply ordinary buttons do not play the upgrade construction effect', async ({ page }) => {
  await page.goto('/');
  const effects = await page.evaluate(async () => {
    const servicesUrl = '/src/shared/services.ts';
    const gameUrl = '/src/games/supply-the-people/game.ts';
    const { createServices } = await import(servicesUrl);
    const { createGame } = await import(gameUrl);
    const host = document.createElement('div');
    host.dataset.gameId = 'supply-the-people';
    document.body.append(host);
    const services = createServices(host, 1);
    const heard: string[] = [];
    services.audio.effect = (name: string) => heard.push(name);
    const game = createGame(host, services);
    try {
      game.start();
      for (const selector of ['[data-lane]', '[data-bell]', '[data-lock]'])
        host.querySelector<HTMLButtonElement>(selector)!.click();
      return heard;
    } finally {
      game.destroy();
      services.destroy();
      host.remove();
    }
  });
  expect(effects).not.toContain('build');
});
