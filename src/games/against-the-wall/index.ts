import type { GameModule } from '../../shared/contracts';
import { createGame } from './game';
import { tuning } from './config';
export { tuning };
export const manifest = {
  id: 'against-the-wall',
  title: 'Against the Wall',
  description: 'Outwit competing pursuers and reach an asylum intake desk.',
  controls: [
    'WASD / arrows: move',
    'Shift: sprint',
    'E: help / collect',
    'Space: aim distraction; Enter: confirm',
    'P / Escape: pause',
    'R: restart',
  ],
  assetIds: [],
};
const game: GameModule = { manifest, tuning, create: createGame };
export default game;
