import type { GameModule } from '../../shared/contracts';
import { tuning } from './config';
import { createGame } from './game';
const game: GameModule = {
  manifest: {
    id: 'supply-the-people',
    title: 'Supply the People',
    description:
      'Strip the markup. Route meals to schools, clinics and pantries. Three shifts, one neighborhood.',
    controls: [
      'Arrows: select lane',
      'Space: strip leading sleeve / block diversion',
      '1 / 2 / 3: cycle gates',
      'B: collective bargaining bell',
      'Touch: crate and gate buttons',
    ],
    assetIds: [],
  },
  tuning,
  create: createGame,
};
export default game;
