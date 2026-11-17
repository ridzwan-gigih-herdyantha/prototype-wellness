import type { WellnessPlayer } from '@/lib/wellness/types/player';
import { readJSON, writeJSON } from './storage';

const ROSTER = [
  'Adam Berg', 'Adam Lopez', 'Bruno Bauer', 'Bruno Rossi', 'Castello Lukeba', 'Cesar Lindqvist', 'Cesar Popov',
  'Diego Haddad', 'Diego Ortiz', 'Elias Bauer', 'Elias Nilsson', 'Erik Larsen', 'Erik Petrov', 'Ethan Kovac',
  'Filip Horvat', 'Filip Marin', 'Hugo Meyer', 'Hugo Santos', 'Ivan Moreau', 'Ivan Weber', 'Jan Dubois',
  'Jan Larsen', 'Karim Haddad', 'Karim Meyer', 'Leo Costa', 'Leo Rossi', 'Liam Keller', 'Liam Novak',
  'Lucas Weber', 'Luka Kovac', 'Luka Santos', 'Marco Horvat', 'Marco Nilsson', 'Mateo Costa', 'Mateo Lopez',
  'Nico Petrov', 'Nico Vidal', 'Noah Novak', 'Noah Silva', 'Omar Lindqvist', 'Omar Popov', 'Pavel Dubois',
  'Pavel Ferrari', 'Rafael Moreau', 'Rafael Vidal', 'Sven Duarte', 'Sven Keller', 'Tomas Berg', 'Tomas Silva',
  'Yusuf Duarte', 'Yusuf Marin',
];

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function buildRoster(): WellnessPlayer[] {
  return ROSTER.map(name => {
    const verified = name === 'Castello Lukeba';
    return {
      player_id: `p-${slug(name)}`,
      wellness_token_id: `wt-${slug(name)}`,
      player_name: name,
      phone_masked: verified ? '****0205' : null,
      verified,
      opted_in: verified,
      status: verified ? 'Verified' : 'Not Started',
    };
  });
}

/** Squad roster comes from club data, so it is seeded once; wellness data starts empty. */
export function getRoster(): WellnessPlayer[] {
  const stored = readJSON<WellnessPlayer[] | null>('players', null);
  if (stored) return stored;
  const roster = buildRoster();
  writeJSON('players', roster);
  return roster;
}

export const JOIN_TOKEN = 'local-prototype-join';
