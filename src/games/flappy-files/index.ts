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
    'H: throw hamburger',
    'P / Escape: pause',
    'M: sound',
    'R: restart',
  ],
  assetIds: [],
};
const game: GameModule = { manifest, tuning, create: createGame };
export default game;
