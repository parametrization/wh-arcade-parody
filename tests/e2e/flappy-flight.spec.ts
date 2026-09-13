import { test, expect } from '@playwright/test';

for (const burst of ['Fly', 'Helicopter'] as const)
  test(`held letters offer accessible choices and ${burst} respects held input and pause`, async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const servicesPath = '/src/shared/services.ts',
        gamePath = '/src/games/flappy-files/game.ts';
      const { createServices } = await import(servicesPath),
        { createGame } = await import(gamePath);
      document.body.replaceChildren();
      const host = document.createElement('div');
      host.style.width = 'min(768px,100%)';
      document.body.append(host);
      const services = createServices(host, 42);
      let running = false,
        update = (_dt: number) => {},
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
        destroy() {},
        time: 0,
        fps: 60,
      };
      const game = createGame(host, services);
      game.configure({
        'columns.maxCenterDelta': 0,
        'columns.gapStart': 224,
        'columns.gapMin': 224,
        'physics.gravity': 600,
        'physics.flapVelocity': -200,
        'scroll.start': 70,
        'scroll.max': 70,
      });
      game.reset();
      game.start();
      const key = (code: string, down: boolean) =>
        (down ? host : window).dispatchEvent(
          new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, bubbles: true }),
        );
      const advance = (seconds: number) => {
        for (let t = 0; t < seconds - 1e-8; t += 1 / 60)
          if (running) update(Math.min(1 / 60, seconds - t));
        render();
      };
      const collect = () => {
        for (let i = 0; i < 6000; i++) {
          const state = game.inspect();
          if (state.flight.pending) {
            render();
            return state;
          }
          if (state.state === 'lost') throw Error('Controller lost before collecting letter');
          const col = state.columns.find((c: { x: number }) => c.x + 48 >= state.player.x);
          const target = col ? col.gapY + col.gap - 42 : 264;
          if (state.player.y > target && state.player.vy > 0) {
            key('Space', true);
            key('Space', false);
          }
          if (running) update(1 / 60);
        }
        throw Error('Letter not reached');
      };
      (window as any).flightFixture = { game, collect, advance, key };
    });
    for (let i = 0; i < 5; i++) {
      const state = await page.evaluate(() => (window as any).flightFixture.collect());
      expect(state.flight.pending).toBe(1);
      await expect(page.getByRole('button', { name: '1 · 5% slower bounce' })).toBeVisible();
      const time = state.time;
      expect(
        await page.evaluate(() => {
          const f = (window as any).flightFixture;
          f.advance(2);
          return f.game.inspect().time;
        }),
      ).toBe(time);
      await page.getByRole('button', { name: '1 · 5% slower bounce' }).click();
    }
    await page.evaluate(() => (window as any).flightFixture.collect());
    await page
      .getByRole('button', { name: burst === 'Fly' ? '3 · Fly for 8s' : '4 · Helicopter for 8s' })
      .click();
    const flight = await page.evaluate(() => {
      const f = (window as any).flightFixture,
        before = f.game.inspect();
      f.key('KeyW', true);
      f.key('KeyD', true);
      f.advance(0.1);
      f.key('KeyW', false);
      f.key('KeyD', false);
      return { before, after: f.game.inspect() };
    });
    if (burst === 'Fly') expect(flight.after.player.x).toBeGreaterThan(flight.before.player.x);
    else expect(flight.after.player.x).toBe(flight.before.player.x);
    expect(flight.after.player.y).toBeLessThan(flight.before.player.y);
    const touch = await page.evaluate((mode) => {
      const f = (window as any).flightFixture;
      const pointer = (selector: string, type: string, pointerId: number) => {
        document.querySelector(selector)!.dispatchEvent(
          new PointerEvent(type, {
            pointerId,
            pointerType: 'touch',
            bubbles: true,
          }),
        );
      };
      if (mode === 'Fly') {
        pointer('[data-steer="up"]', 'pointerdown', 41);
        pointer('[data-steer="right"]', 'pointerdown', 42);
        f.advance(0.1);
        pointer('[data-steer="right"]', 'pointerup', 42);
        const before = f.game.inspect();
        f.advance(0.1);
        const after = f.game.inspect();
        pointer('[data-steer="up"]', 'pointerup', 41);
        return { before, after };
      }
      pointer('[data-flap]', 'pointerdown', 41);
      f.advance(0.1);
      pointer('[data-burger]', 'pointerdown', 42);
      document.querySelector<HTMLButtonElement>('[data-burger]')!.click();
      pointer('[data-burger]', 'pointerup', 42);
      const before = f.game.inspect();
      f.advance(0.4);
      const after = f.game.inspect();
      pointer('[data-flap]', 'pointerup', 41);
      return { before, after };
    }, burst);
    expect(touch.after.player.y).toBeLessThan(touch.before.player.y);
    if (burst === 'Fly') expect(touch.after.player.x).toBe(touch.before.player.x);
    else expect(touch.after.player.vy).toBeLessThan(-80);
    await page.screenshot({
      path: `/tmp/flappy-${burst.toLowerCase()}-upgrade-${test.info().project.name}.png`,
      fullPage: true,
    });
    const pause = await page.evaluate(() => {
      const f = (window as any).flightFixture;
      f.game.pause();
      const before = f.game.inspect();
      f.advance(4);
      return { before, after: f.game.inspect() };
    });
    expect(pause.after.flight.remaining).toBe(pause.before.flight.remaining);
    await page.screenshot({ path: '/tmp/flappy-flight-upgrade.png', fullPage: true });
    await page.evaluate(() => {
      const f = (window as any).flightFixture;
      f.game.configure({ 'flight.burstSeconds': 3 });
      f.game.reset();
    });
    await expect(page.locator('.ff-note')).toContainText('3-second Fly');
  });
