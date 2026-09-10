import { test, expect } from '@playwright/test';

// Mount the production game with a deterministic clock so every loading phase can be inspected.
async function mount(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    const servicesUrl = '/src/shared/services.ts',
      gameUrl = '/src/games/supply-the-people/game.ts';
    const { createServices } = await import(servicesUrl),
      { createGame } = await import(gameUrl);
    document.body.replaceChildren();
    const host = document.createElement('div');
    host.style.width = 'min(640px, 100%)';
    document.body.append(host);
    const services = createServices(host, 1);
    services.random.next = () => 0.01;
    let running = false,
      update = (dt: number) => {
        void dt;
      },
      render = () => {};
    services.clock = {
      start(u: (dt: number) => void, r: () => void) {
        update = u;
        render = r;
        running = true;
      },
      pause() {
        running = false;
      },
      resume() {
        running = true;
      },
      reset() {},
      destroy() {
        running = false;
      },
      time: 0,
      fps: 60,
    };
    const labels: string[] = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      labels.push(text);
      original.call(this, text, x, y, maxWidth);
    };
    (window as unknown as { supplyLabels: string[] }).supplyLabels = labels;
    const game = createGame(host, services);
    (window as unknown as { supplyFixture: unknown }).supplyFixture = {
      game,
      advance(seconds: number) {
        for (let elapsed = 0; elapsed < seconds - 1e-8; elapsed += 0.02)
          if (running) update(Math.min(0.02, seconds - elapsed));
        render();
      },
    };
    game.start();
  });
}
async function act(
  page: import('@playwright/test').Page,
  seconds: number,
  action?: 'pause' | 'resume',
) {
  return page.evaluate(
    ({ seconds, action }) => {
      const f = (
        window as unknown as {
          supplyFixture: {
            game: { pause(): void; resume(): void; inspect(): Record<string, unknown> };
            advance(n: number): void;
          };
        }
      ).supplyFixture;
      if (action) f.game[action]();
      f.advance(seconds);
      return f.game.inspect();
    },
    { seconds, action },
  );
}

test('Supply announces and loads before a crate reaches the belt, with pause freezing the job', async ({
  page,
}) => {
  await mount(page);
  const first = await act(page, 0.72);
  expect(first.crates).toEqual([]);
  expect(first.loadingJobs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ phase: 'announce', truck: 3, sleeve: true }),
    ]),
  );
  const paused = await act(page, 0, 'pause');
  expect((await act(page, 1)).loadingJobs).toEqual(paused.loadingJobs);
  await act(page, 0.6, 'resume');
  const walking = await act(page, 0);
  expect(walking.crates).toEqual([]);
  expect(walking.loadingJobs).toEqual(
    expect.arrayContaining([expect.objectContaining({ phase: 'walk-to-truck' })]),
  );
  const loaded = await act(page, 2);
  expect(loaded.crates).toEqual(
    expect.arrayContaining([expect.objectContaining({ sleeve: true, lane: 0 })]),
  );
});

test('Supply pointer strips the visible gold crate once and unstripped delivery pays its penalty', async ({
  page,
}) => {
  await mount(page);
  const loaded = await act(page, 3.24);
  const crate = (loaded.crates as { id: number; x: number; lane: number; sleeve: boolean }[])[0];
  expect(crate.sleeve).toBe(true);
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const point = {
    x: box!.x + (crate.x / 640) * box!.width,
    y: box!.y + ([300, 410, 520][crate.lane] / 640) * box!.height,
  };
  await page.mouse.click(point.x, point.y);
  const stripped = await act(page, 0);
  expect(stripped.score).toBe(Number(loaded.score) + 5);
  expect((stripped.crates as { sleeve: boolean }[])[0].sleeve).toBe(false);
  await page.mouse.click(point.x, point.y);
  expect((await act(page, 0)).score).toBe(stripped.score);
  const penalty = await page.evaluate(async () => {
    const url = '/src/games/supply-the-people/model.ts';
    const { createModel, startModel, dispatch } = await import(url);
    const m = createModel();
    startModel(m);
    const before = m.budget;
    dispatch(m, { id: 99, x: 500, lane: 0, destination: 0, sleeve: true });
    return before - m.budget;
  });
  expect(penalty).toBe(8);
});

test('Supply displays fictional named operators without loading a political headshot atlas', async ({
  page,
}) => {
  const headshots: string[] = [];
  page.on('request', (request) => {
    if (/political-heads|flappy-portraits/i.test(request.url())) headshots.push(request.url());
  });
  await mount(page);
  await act(page, 0.8);
  const labels = await page.evaluate(
    () => (window as unknown as { supplyLabels: string[] }).supplyLabels,
  );
  for (const name of ['Mara', 'Ellis', 'Rowan'])
    expect(labels.some((text) => text.includes(name))).toBe(true);
  expect(headshots).toEqual([]);
});
