import { test, expect } from '@playwright/test';

test('Wall boss renders day/night alarms and dispatches a bounded masked posse', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const result = await page.evaluate(async () => {
    const modelUrl = '/src/games/against-the-wall/model.ts',
      bossUrl = '/src/games/against-the-wall/boss.ts',
      sceneUrl = '/src/games/against-the-wall/scene.ts';
    const { create } = await import(modelUrl),
      { stepBoss } = await import(bossUrl),
      { drawScene } = await import(sceneUrl);
    const s = create(7);
    s.phase = 'running';
    s.x = s.boss.x + 1;
    s.y = s.boss.y + 2;
    s.boss.phase = 'radio';
    s.boss.remaining = 5;
    s.boss.heading = Math.PI / 2;
    s.enemies = [];
    document.body.replaceChildren();
    document.body.style.margin = '0';
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 640;
    document.body.append(canvas);
    const c = canvas.getContext('2d')!;
    drawScene(c, s, null, 'default', false);
    const day = canvas.toDataURL();
    s.time = 65;
    s.boss.phase = 'phone';
    s.boss.remaining = 10;
    drawScene(c, s, null, 'default', false);
    const night = canvas.toDataURL();
    // Explicit production renderer fixture, separate from host/HMR behavior.
    for (let i = 0; i < 201; i++) {
      s.time += 0.05;
      stepBoss(s, 0.05);
    }
    const count = s.enemies.length;
    for (let i = 0; i < 400; i++) {
      s.time += 0.05;
      stepBoss(s, 0.05);
    }
    return {
      different: day !== night,
      count,
      finalCount: s.enemies.length,
      maskedFactions: s.enemies.map((e: { faction: string }) => e.faction),
    };
  });
  expect(result.different).toBe(true);
  expect(result.count).toBe(4);
  expect(result.finalCount).toBe(4);
  expect(result.maskedFactions.filter((f: string) => f === 'ICE')).toHaveLength(2);
  expect(result.maskedFactions.filter((f: string) => f === 'Border Patrol')).toHaveLength(2);
});
