export interface ArcadeEntry {
  id: string;
  title: string;
  originalTitle: string;
  genre: string;
  description: string;
  detail: string;
  accent: string;
  icon: string;
  status: 'in-development';
}

export const games: readonly ArcadeEntry[] = [
  {
    id: 'flappy-files',
    title: 'Flappy Files',
    originalTitle: 'Flappy Bill',
    genre: 'FLAP · DODGE · DELIVER',
    description: 'Keep the records in the air. Get them to the people.',
    detail:
      'Carry the Epstein Files through a maze of red tape, named political caricatures and very large distractions. Hamburger countermeasures included. An invented political cartoon; appearing here does not allege involvement in a crime.',
    accent: '#62f3eb',
    icon: 'files',
    status: 'in-development',
  },
  {
    id: 'against-the-wall',
    title: 'Against the Wall',
    originalTitle: 'Build the Wall',
    genre: 'EVADE · OUTSMART · ARRIVE',
    description: 'A different side of the wall. A chance to build a future.',
    detail:
      'Find a route through a divided border landscape. Cut wire, build a ladder or dig under concrete, evade competing pursuers and reach the Asylum Office.',
    accent: '#ef89e8',
    icon: 'wall',
    status: 'in-development',
  },
  {
    id: 'rio-rescue',
    title: 'Rio Rescue',
    originalTitle: 'Rio Run',
    genre: 'CONNECT · GUIDE · RESCUE',
    description: 'Make room in the welcome wagon. Nobody gets left behind.',
    detail:
      'Guide a growing convoy over canyon bridges, across rivers and through climbable fence sections. Time your route around scanning cameras, share supplies and bring everyone to safety.',
    accent: '#d4ff76',
    icon: 'rio',
    status: 'in-development',
  },
  {
    id: 'supply-the-people',
    title: 'Supply the People',
    originalTitle: 'Supply Line',
    genre: 'SORT · SHARE · DELIVER',
    description: 'Keep the meals moving. Send the markup packing.',
    detail:
      'Watch fictional operators load cargo from four supplier trucks. Remove gold coatings to avoid surcharges and route pharmacy, housing and medical supplies.',
    accent: '#ffba78',
    icon: 'supply',
    status: 'in-development',
  },
  {
    id: 'trickle-down-tycoon',
    title: 'Trump Trickle-Down Tycoon',
    originalTitle: 'Trump Savings Tycoon',
    genre: 'CATCH · INVEST · REBUILD',
    description: 'Build the safety net. Catch more than promises.',
    detail:
      'Operate the community safety net beneath a very ornate promise machine. Catch resources, dodge hollow gold balloons and build homes, clinics and schools between arcade rounds.',
    accent: '#e9d875',
    icon: 'tycoon',
    status: 'in-development',
  },
];

export function findGame(id: string): ArcadeEntry | undefined {
  return games.find((game) => game.id === id);
}

import type { GameModule } from '../shared/contracts';
const modules = import.meta.glob<{ default: GameModule }>('./*/index.ts');
export function isPlayable(id: string): boolean {
  return Boolean(modules[`./${id}/index.ts`]);
}
export async function loadGame(id: string): Promise<GameModule> {
  const loader = modules[`./${id}/index.ts`];
  if (!loader) throw new Error('This game is still in development.');
  return (await loader()).default;
}
