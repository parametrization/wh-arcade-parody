import type { GameModule } from '../../shared/contracts';
import { tuning } from './config';
import { createGame } from './game';
const game: GameModule = {
  manifest: {
    id: 'trickle-down-tycoon',
    title: 'Trump Trickle-Down Tycoon',
    description:
      'Catch useful resources, return empty promises and build the community safety net across five rounds.',
    controls: [
      'Arrows / A-D: move the net',
      'Catch automatically when cargo touches the net',
      'J: audit · K: umbrella · L: return promise (legacy F / U / Q also work)',
      '1 / 2 / 3: select lane',
      'Touch: drag to catch; Return when a promise is over halfway in the net',
    ],
    assetIds: [],
  },
  tuning,
  create: createGame,
};
export default game;
