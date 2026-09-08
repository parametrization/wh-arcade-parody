import type { GameModule } from '../../shared/contracts';
import { tuning } from './config';
import { createGame } from './game';
const game: GameModule = {
  manifest: {
    id: 'trickle-down-tycoon',
    title: 'Trump Trickle-Down Tycoon',
    description:
      'Catch useful resources, dodge empty promises and build the community safety net across five rounds.',
    controls: [
      'Arrows / A-D: move the net',
      'Space: catch window',
      'Q: public audit',
      '1 / 2 / 3: select lane',
      'Touch: drag and Catch button',
    ],
    assetIds: [],
  },
  tuning,
  create: createGame,
};
export default game;
