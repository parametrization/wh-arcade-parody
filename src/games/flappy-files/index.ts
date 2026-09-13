import type { GameModule } from '../../shared/contracts';
import { createGame } from './game';
import { tuning } from './config';
export { tuning };
export const manifest = {
  id: 'flappy-files',
  title: 'Flappy Files',
  description: 'Deliver the files. Dodge red tape. Feed the distraction.',
  controls: [
    'Space / Up / W: flap',
    'Q / E / H: throw hamburger',
    'Touch a held letter; 1/2 choose slower/smaller bounce. At 80% remaining, 3/4 choose Fly/Helicopter bursts.',
    'Fly: WASD/arrows steer. Helicopter: hold Space or Flap to rise; release to sink gently.',
    'P / Escape: pause',
    'M: sound',
    'R: restart',
  ],
  assetIds: [],
};
const game: GameModule = { manifest, tuning, create: createGame };
export default game;
