import { expect, it } from 'vitest';
import { createModel, advance, interval, queueTurn } from './model';
import { createMotion } from './motion';

it('draws intermediate positions along each confirmed segment without changing collision cells', () => {
  const m = createModel();
  m.phase = 'playing';
  const motion = createMotion(m);
  advance(m, interval(m));
  motion.update(m);
  expect(motion.sample(m)[0].x).toBe(4);
  advance(m, interval(m) / 2);
  motion.update(m);
  expect(motion.sample(m)[0].x).toBeCloseTo(4.5);
  expect(m.body[0]).toEqual({ x: 5, y: 8 });
  queueTurn(m, 'down');
  advance(m, interval(m) / 2);
  motion.update(m);
  advance(m, interval(m) / 2);
  motion.update(m);
  const pose = motion.sample(m);
  expect(pose[0].x).toBe(5);
  expect(pose[0].y).toBeCloseTo(8.5);
  expect(pose[1].x).toBeCloseTo(4.5);
  expect(pose[1].y).toBe(8);
});

it('new neighbors grow from the tail instead of crossing the board', () => {
  const m = createModel();
  m.phase = 'playing';
  m.pickup = { x: 5, y: 8 };
  const motion = createMotion(m);
  advance(m, interval(m));
  motion.update(m);
  expect(motion.sample(m).at(-1)).toMatchObject({ x: 2, y: 8, stride: 0 });
});

it('single-step and reduced-motion show exact cells without gait', () => {
  const m = createModel();
  m.phase = 'playing';
  const motion = createMotion(m);
  advance(m, interval(m));
  motion.update(m);
  expect(motion.sample(m, true)[0]).toEqual({ ...m.body[0], stride: 0 });
  m.config.mode = 'single-step';
  advance(m, 0, true);
  motion.update(m);
  expect(motion.sample(m)[0]).toEqual({ ...m.body[0], stride: 0 });
});

it('reset and checkpoint relocation clear old animation paths', () => {
  const m = createModel();
  m.phase = 'playing';
  const motion = createMotion(m);
  advance(m, interval(m));
  motion.update(m);
  m.body = [{ x: 20, y: 12 }];
  motion.update(m);
  expect(motion.sample(m)[0]).toEqual({ x: 20, y: 12, stride: 0 });
  motion.reset(createModel());
  expect(motion.sample(createModel())[0]).toEqual({ x: 4, y: 8, stride: 0 });
});
