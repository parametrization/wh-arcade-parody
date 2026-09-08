import { test, expect } from '@playwright/test';

test('wall cover hides characters behind it but keeps characters in front visible', async ({
  page,
}) => {
  await page.goto('/');
  const samples = await page.evaluate(async () => {
    const modelUrl = '/src/games/against-the-wall/model.ts';
    const renderUrl = '/src/games/against-the-wall/render.ts';
    const { create } = await import(modelUrl);
    const { draw, project, camera } = await import(renderUrl);
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;
    const state = create();
    state.x = state.y = 13;
    state.walls = new Set(['10,10', '11,10']);
    state.enemies = [];
    state.items = [];
    const results = [];
    for (const [x, y, dy] of [
      [10.5, 9.75, -10],
      [10.5, 11.25, -20],
      [12.23, 10.15, -20],
    ]) {
      state.companion.x = x;
      state.companion.y = y;
      const p = project(x, y),
        c = camera(state);
      const read = () =>
        Array.from(
          ctx.getImageData(Math.round(p.x + c.x - 7), Math.round(p.y + c.y + dy), 5, 5).data,
        );
      state.companion.helped = true;
      draw(ctx, state, null, 'A', true);
      const covered = read();
      state.companion.helped = false;
      draw(ctx, state, null, 'A', true);
      results.push(JSON.stringify(covered) === JSON.stringify(read()));
    }
    return results;
  });
  expect(samples).toEqual([true, false, false]);
});
