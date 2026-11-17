import type { WellnessRecord } from '@/lib/squad/types';
import type { PlayerMeal } from '@/app/clubs/wellness/_components/wellness-types';
import { DEFAULT_WELLNESS_TIMEZONE } from '@/lib/wellness/timezone';
import { mockClub } from '@/lib/mock-club';
import { getRoster } from './seed';
import { delay, newId, readJSON, writeJSON } from './storage';

export interface CheckinPayload {
  wellnessTokenId: string;
  muscleSoreness: number | null;
  energyLevel: number | null;
  sleepQuality: number | null;
  notes: string | null;
  bodyPart: string;
  sorenessContext: string;
  meals: string;
  recordedAt: string;
}

const readRecords = () => readJSON<WellnessRecord[]>('records', []);
const readMeals = () => readJSON<PlayerMeal[]>('meals', []);

export async function listWellness(days: number) {
  await delay(250);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  return {
    records: readRecords().filter(r => r.recorded_at.slice(0, 10) >= cutoffKey),
    meals: readMeals().filter(m => m.log_date.slice(0, 10) >= cutoffKey),
    timezone: DEFAULT_WELLNESS_TIMEZONE,
  };
}

export async function listPlayers() {
  return { players: getRoster() };
}

/** One check-in per player per day: saving again replaces the record and that day's meals. */
export async function upsertCheckin(payload: CheckinPayload) {
  await delay(300);
  const player = getRoster().find(p => p.wellness_token_id === payload.wellnessTokenId);
  if (!player) throw new Error('Unknown player');

  const now = new Date().toISOString();
  const records = readRecords();
  const existing = records.find(r => r.wellness_token_id === player.wellness_token_id && r.recorded_at === payload.recordedAt);
  const id = existing?.id ?? newId('chk');
  const bodyPart = payload.muscleSoreness === 5 ? '' : payload.bodyPart.trim();

  const record: WellnessRecord = {
    id,
    wellness_token_id: player.wellness_token_id,
    player_id: player.player_id,
    club_profile_id: mockClub.clubProfile.id,
    player_name: player.player_name,
    muscle_soreness: payload.muscleSoreness,
    energy_level: payload.energyLevel,
    sleep_quality: payload.sleepQuality,
    sleep_hours: null,
    notes: payload.notes,
    recorded_by: mockClub.user.id,
    recorded_at: payload.recordedAt,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    source: 'staff',
    soreness_details: bodyPart
      ? [{
          id: newId('sd'),
          wellness_checkin_id: id,
          body_part: bodyPart,
          context: payload.sorenessContext.trim() || null,
          source: 'staff',
          created_at: now,
          updated_at: now,
        }]
      : [],
  };
  writeJSON('records', [record, ...records.filter(r => r.id !== id)]);

  const dayMeals: PlayerMeal[] = payload.meals
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(description => ({
      player_name: player.player_name,
      log_date: payload.recordedAt,
      meal_name: null,
      description,
      source: 'staff',
      created_at: now,
    }));
  const otherMeals = readMeals().filter(m => !(m.player_name === player.player_name && m.log_date.slice(0, 10) === payload.recordedAt));
  writeJSON('meals', [...otherMeals, ...dayMeals]);

  return { record, meals: dayMeals };
}
