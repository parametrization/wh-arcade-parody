import { MAP_HEIGHT, MAP_WIDTH } from './terrain';

export const TILE_SIZE = 48;
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 640;

/** Fixed scale and north-up heading. Elevation is deliberately not a projection input. */
export function createTopDownCamera(lead: { x: number; y: number }) {
  const columns = VIEW_WIDTH / TILE_SIZE;
  const rows = VIEW_HEIGHT / TILE_SIZE;
  const left = Math.max(0, Math.min(MAP_WIDTH - columns, lead.x + 0.5 - columns / 2));
  const top = Math.max(0, Math.min(MAP_HEIGHT - rows, lead.y + 0.5 - rows / 2));
  return {
    left,
    top,
    columns,
    rows,
    project(point: { x: number; y: number }) {
      return { x: (point.x - left) * TILE_SIZE, y: (point.y - top) * TILE_SIZE };
    },
  };
}
