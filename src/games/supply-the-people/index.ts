import type { GameModule } from '../../shared/contracts';
import { tuning } from './config';
import { createGame } from './game';
const game: GameModule = {
  manifest: {
    id: 'supply-the-people',
    title: 'Supply the People',
    description:
      'Follow fictional warehouse operators from supplier trucks to conveyor belts. Remove gold surcharges and route pharmacy, housing and medical cargo.',
    controls: [
      'W/S or arrows: select lane',
      'E / Space: strip leading gold coating / lock gate',
      '1 / 2 / 3: cycle gates',
      'Q / B: dispatch bell',
      'Touch: crate and gate buttons',
    ],
    assetIds: [],
  },
  tuning,
  create: createGame,
};
export default game;
