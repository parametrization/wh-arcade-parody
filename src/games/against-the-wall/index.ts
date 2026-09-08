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
    'B: build or cancel barrier crossing',
    'Space: aim distraction; Enter: confirm',
    'P / Escape: pause',
    'R: restart',
    'Pursuers follow visible people as suspicion rises; a full meter enables gunfire. Use cover until suspicion drains.',
    'Day/night changes every 60 seconds. Daytime allies include ICE and Border Patrol; at night flashlight-bearing pursuers can fire on allies too.',
  ],
  assetIds: [],
};
const game: GameModule = { manifest, tuning, create: createGame };
export default game;
