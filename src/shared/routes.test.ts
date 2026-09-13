import { describe, expect, it } from 'vitest';
import { appRoute } from './routes';

describe('base-aware hash routes', () => {
  it('maps the Pages project root to the arcade root', () => {
    expect(appRoute('/wh-arcade-parody/', '', '/wh-arcade-parody/')).toBe('/');
    expect(appRoute('/wh-arcade-parody/games/rio-rescue', '', '/wh-arcade-parody/')).toBe(
      '/games/rio-rescue',
    );
  });

  it('keeps hash navigation authoritative', () => {
    expect(appRoute('/wh-arcade-parody/', '#/games/flappy-files', '/wh-arcade-parody/')).toBe(
      '/games/flappy-files',
    );
  });
});
