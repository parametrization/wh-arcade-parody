import { describe, expect, it } from 'vitest';
import { create } from './model';
import { projectScene, unprojectScene } from './scene';

describe('perspective ground targeting', () => {
  it.each([
    { x: 3.5, y: 18.5 },
    { x: 16, y: 12 },
    { x: 27.5, y: 3.5 },
  ])('round-trips ground targets with camera at $x,$y', (position) => {
    const s = create();
    Object.assign(s, position);
    for (const dx of [-4, -1, 0, 1, 4])
      for (const dy of [-4, -1, 0, 1, 4]) {
        const target = { x: s.x + dx, y: s.y + dy };
        const screen = projectScene(s, target.x, target.y);
        const ground = unprojectScene(s, screen.x, screen.y);
        expect(ground.x).toBeCloseTo(target.x, 10);
        expect(ground.y).toBeCloseTo(target.y, 10);
      }
    expect(projectScene(s, s.x, s.y)).toEqual({ x: 480, y: 360 });
  });
});
