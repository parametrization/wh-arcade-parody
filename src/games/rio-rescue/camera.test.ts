import { describe, expect, it } from 'vitest';
import { createTopDownCamera, TILE_SIZE, VIEW_HEIGHT, VIEW_WIDTH } from './camera';
import { MAP_HEIGHT, MAP_WIDTH } from './terrain';
import { createModel, advance, interval, queueTurn } from './model';

describe('Rio top-down navigation', () => {
  it('keeps cardinal movement aligned and equally scaled everywhere on the map', () => {
    for (const lead of [
      { x: 0, y: 0 },
      { x: 24, y: 18 },
      { x: 47, y: 35 },
    ]) {
      const camera = createTopDownCamera(lead),
        p = camera.project(lead);
      expect(camera.project({ x: lead.x + 1, y: lead.y })).toEqual({ x: p.x + TILE_SIZE, y: p.y });
      expect(camera.project({ x: lead.x, y: lead.y + 1 })).toEqual({ x: p.x, y: p.y + TILE_SIZE });
      expect(camera.left).toBeGreaterThanOrEqual(0);
      expect(camera.top).toBeGreaterThanOrEqual(0);
      expect(camera.left + camera.columns).toBeLessThanOrEqual(MAP_WIDTH);
      expect(camera.top + camera.rows).toBeLessThanOrEqual(MAP_HEIGHT);
    }
  });
  it('does not shift a tile or actor footprint when elevation changes', () => {
    const camera = createTopDownCamera({ x: 24, y: 18 });
    const floor = { x: 24.5, y: 18.5, z: -2 },
      roof = { ...floor, z: 4 };
    expect(camera.project(floor)).toEqual(camera.project(roof));
    expect(camera.project(floor).x).toBeCloseTo(VIEW_WIDTH / 2);
    expect(camera.project(floor).y).toBeCloseTo(VIEW_HEIGHT / 2);
  });
  it('preserves model turn semantics at the unclamped starting route', () => {
    const m = createModel();
    m.phase = 'playing';
    const camera = createTopDownCamera(m.body[0]);
    const initial = camera.project(m.body[0]);
    advance(m, interval(m));
    expect(camera.project(m.body[0])).toEqual({ x: initial.x + TILE_SIZE, y: initial.y });
    queueTurn(m, 'down');
    advance(m, interval(m));
    expect(camera.project(m.body[0])).toEqual({
      x: initial.x + TILE_SIZE,
      y: initial.y + TILE_SIZE,
    });
  });
});
