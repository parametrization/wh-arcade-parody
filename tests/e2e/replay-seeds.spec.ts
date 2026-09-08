import { test, expect } from '@playwright/test';
for (const slug of ['flappy-files', 'rio-rescue', 'against-the-wall']) {
  test(`${slug} replays explicit seeds and preserves them across restart and reload`, async ({
    page,
  }) => {
    await page.goto(`/games/${slug}/?seed=123`);
    const host = page.getByTestId('game-surface'),
      seed = page.getByTestId('game-seed');
    await expect(host).toHaveAttribute('data-seed', '123');
    await expect(seed).toHaveValue('123');
    await seed.fill('4294967295');
    await page.getByTestId('replay-seed').click();
    await expect(host).toHaveAttribute('data-seed', '4294967295');
    await expect(page).toHaveURL(/seed=4294967295/);
    await page.getByTestId('game-start').click();
    await page.getByTestId('game-restart').click();
    await expect(host).toHaveAttribute('data-seed', '4294967295');
    await expect(seed).toHaveValue('4294967295');
    await page.reload();
    await expect(host).toHaveAttribute('data-seed', '4294967295');
    await expect(seed).toHaveValue('4294967295');
    await seed.fill('0');
    await page.getByTestId('replay-seed').click();
    await expect(host).toHaveAttribute('data-seed', '0');
    await page.getByTestId('new-seed').click();
    const generated = await seed.inputValue();
    expect(Number(generated)).toBeGreaterThanOrEqual(0);
    expect(Number(generated)).toBeLessThanOrEqual(4294967295);
    await expect(host).toHaveAttribute('data-seed', generated);
    expect(new URL(page.url()).searchParams.get('seed')).toBe(generated);
  });
  test(`${slug} keeps replay seed in hash navigation`, async ({ page }) => {
    await page.goto(`/#/games/${slug}?seed=456`);
    await expect(page.getByTestId('game-surface')).toHaveAttribute('data-seed', '456');
    await page.getByTestId('game-seed').fill('789');
    await page.getByTestId('replay-seed').click();
    await expect(page).toHaveURL(new RegExp(`#/games/${slug}\\?seed=789$`));
    await page.reload();
    await expect(page.getByTestId('game-surface')).toHaveAttribute('data-seed', '789');
  });
}
