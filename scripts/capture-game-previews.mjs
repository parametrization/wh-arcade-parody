import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Capture the running game itself, including Flappy's HTML name plaques.
// Start ./dev first. Re-run after renderer changes to keep the cards accurate.
const origin = process.env.ARCADE_PREVIEW_ORIGIN ?? 'http://localhost:8643';
const output = new URL('../public/assets/previews/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const slug of ['flappy-files', 'against-the-wall', 'rio-rescue', 'supply-the-people', 'trickle-down-tycoon']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    await page.clock.install({ time: new Date('2026-09-08T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-08T12:00:01Z'));
    await page.goto(`${origin}/games/${slug}/`);
    await page.getByTestId('game-start').click();
    if (slug === 'flappy-files') {
      await page.evaluate(() => Promise.all(Array.from(document.images, image => image.decode().catch(() => {}))));
      for (let step = 0; step < 3; step++) {
        await page.clock.runFor(450);
        await page.keyboard.press('Space');
      }
      await page.clock.runFor(50);
    } else {
      await page.clock.runFor(slug === 'rio-rescue' ? 1200 : 2500);
    }
    const surface = page.getByTestId('game-surface');
    if (await surface.getAttribute('data-state') !== 'running') throw new Error(`${slug} is not running`);
    await surface.locator(slug === 'flappy-files' ? '.ff-stage' : 'canvas').screenshot({ path: new URL(`${slug}.png`, output).pathname });
    console.log(`Captured ${slug}`);
    await page.close();
  }
} finally {
  await browser.close();
}
