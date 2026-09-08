import { test, expect } from '@playwright/test';

test('five game routes, disabled sixth tile and local navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByTestId('arcade-card')).toHaveCount(5);
  await expect(page.getByTestId('coming-soon')).toBeVisible();
  const links = await page
    .getByTestId('arcade-card')
    .evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute('href') ?? n.querySelector('a')?.getAttribute('href')),
    );
  for (const link of links) {
    expect(link).toBeTruthy();
    await page.goto('/' + link);
    await expect(
      page.locator('[data-testid=game-placeholder], [data-testid=game-surface]'),
    ).toBeVisible();
  }
  await page.goto('/#/about');
  await expect(page.locator('main')).toContainText(/satire|unofficial/i);
  await page.goto('/#/sources');
  await expect(page.locator('main a[href="https://www.whitehouse.gov/arcade/"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('tuning diagnostic supports pause, reset and config export', async ({ page }) => {
  await page.goto('/#/workbench');
  await expect(page.getByTestId('tuning-panel')).toBeVisible();
  await expect(page.getByTestId('diagnostic-canvas')).toBeVisible();
  await page.getByTestId('pause-button').click();
  await expect(page.getByTestId('diagnostic-state')).toContainText(/paused/i);
  await page.getByTestId('seed-input').fill('42');
  await page.getByTestId('reset-button').click();
  await expect(page.getByTestId('diagnostic-state')).toContainText(/running|title/i);
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-button').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});

test('responsive shell stays within viewport and makes no external runtime requests', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (/^https?:/.test(r.url()) && !r.url().startsWith('http://localhost:8643'))
      external.push(r.url());
  });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.goto('/#/workbench');
  await expect(page.getByTestId('tuning-panel')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(external).toEqual([]);
});

test('twenty runtime mounts release animation frames and keyboard handlers', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    // Vite serves this development module directly for contract verification.
    const modulePath = '/src/shared/services.ts';
    const { createServices } = await import(/* @vite-ignore */ modulePath);
    const nativeRequest = window.requestAnimationFrame.bind(window),
      nativeCancel = window.cancelAnimationFrame.bind(window);
    const pending = new Set<number>();
    window.requestAnimationFrame = (callback) => {
      const id = nativeRequest((t) => {
        pending.delete(id);
        callback(t);
      });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      nativeCancel(id);
    };
    let fired = 0;
    try {
      for (let i = 0; i < 20; i++) {
        const host = document.createElement('div');
        document.body.append(host);
        const services = createServices(host, i);
        services.input.bind({ tap: ['KeyX'] });
        services.input.on('tap', () => fired++);
        services.clock.start(
          () => {},
          () => {},
        );
        host.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX', key: 'x', bubbles: true }));
        services.destroy();
        services.destroy();
        host.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX', key: 'x', bubbles: true }));
        host.remove();
      }
      return { fired, pending: pending.size };
    } finally {
      window.requestAnimationFrame = nativeRequest;
      window.cancelAnimationFrame = nativeCancel;
    }
  });
  expect(result).toEqual({ fired: 20, pending: 0 });
});

test('preferences persist and remain usable with blocked storage', async ({ page }) => {
  await page.goto('/#/settings');
  await page.locator('#contrast-setting').check();
  await page.reload();
  await expect(page.locator('#contrast-setting')).toBeChecked();
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage blocked for test');
      },
    });
  });
  await page.reload();
  await page.locator('#contrast-setting').check();
  await expect(page.locator('html')).toHaveClass(/high-contrast/);
});

test('canvas coordinate mapping survives resizing and image loader reports failure', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const canvasPath = '/src/shared/canvas.ts',
      assetsPath = '/src/shared/assets.ts';
    const { fitCanvas } = await import(/* @vite-ignore */ canvasPath);
    const { createAssets } = await import(/* @vite-ignore */ assetsPath);
    const canvas = document.createElement('canvas');
    document.body.append(canvas);
    const viewport = fitCanvas(canvas, 512, 448);
    canvas.style.width = '256px';
    const bounds = canvas.getBoundingClientRect();
    const point = viewport.toGame(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    canvas.remove();
    const assets = createAssets([
      { id: 'broken', path: '/missing-test-image.png', author: 'Test', rights: 'Test' },
    ]);
    let error = '';
    try {
      await assets.image('broken');
    } catch (e) {
      error = String(e);
    } finally {
      assets.destroy();
    }
    return { point, error };
  });
  expect(result.point.x).toBeCloseTo(256);
  expect(result.point.y).toBeCloseTo(224);
  expect(result.error).toContain('Could not load asset');
});

test('remapped pause key works and frozen simulation resumes explicitly', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByLabel('pause key binding', { exact: true }).click();
  await page.keyboard.press('KeyK');
  await page.locator('#save-controls').click();
  await page.goto('/#/workbench');
  await page.getByTestId('diagnostic-canvas').click();
  await page.keyboard.press('KeyK');
  await expect(page.getByTestId('diagnostic-state')).toHaveText('paused');
  const frozen = await page.getByTestId('diagnostic-time').innerText();
  await page.waitForTimeout(200);
  await expect(page.getByTestId('diagnostic-time')).toHaveText(frozen);
  await page.getByTestId('pause-button').click();
  await expect(page.getByTestId('diagnostic-state')).toHaveText('running');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByTestId('diagnostic-state')).toHaveText('paused');
});
