import type { WellnessRecord } from '@/lib/squad/types';
import type { PlayerMeal } from '@/app/clubs/wellness/_components/wellness-types';
import { dateKeyInTimeZone, DEFAULT_WELLNESS_TIMEZONE } from '@/lib/wellness/timezone';
import { mockClub } from '@/lib/mock-club';
import { buildPlan } from './mock-ai';
import { getRoster } from './seed';
import { writeJSON } from './storage';
import type { MealPlan } from './nutrition-types';

const DAYS = 14;
const DAY_MS = 86_400_000;
const POSITIONS = ['GK', 'CB', 'FB', 'CM', 'CAM', 'W', 'ST'];

const BREAKFASTS = ['Porridge with banana', 'Scrambled eggs on toast', 'Greek yogurt with granola', 'Overnight oats', 'Avocado toast with eggs'];
const LUNCHES = ['Chicken rice bowl', 'Tuna pasta salad', 'Turkey wrap', 'Beef stir-fry with noodles', 'Salmon poke bowl'];
const SNACKS = ['Protein shake', 'Apple and almonds', 'Banana', 'Rice cakes with peanut butter'];
const DINNERS = ['Grilled salmon with sweet potato', 'Pasta bolognese', 'Chicken curry with rice', 'Lamb with couscous', 'Sea bass with potatoes'];
const BODY_PARTS = ['Left hamstring', 'Right calf', 'Lower back', 'Right groin', 'Left knee'];
const CONTEXTS = ['After training', 'After match', 'Woke up with it'];
/** Days ago that follow a match: the whole squad dips, which drives Team Pulse and the soreness-spike alert. */
const POST_MATCH_DAYS = new Set([4, 11]);

/** Deterministic PRNG so every load produces the same squad story. */
function rng(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

export function loadDemoData(): void {
  const roster = getRoster();
  const rand = rng(20261117);
  const now = Date.now();
  const records: WellnessRecord[] = [];
  const meals: PlayerMeal[] = [];
  const plans: MealPlan[] = [];

  roster.forEach((player, pi) => {
    const base = 3.3 + rand() * 1.4;
    const declining = pi % 7 === 3;
    const highRiskToday = pi % 17 === 4;
    const missRate = pi % 9 === 6 ? 0.6 : 0.12;

    for (let d = DAYS - 1; d >= 0; d--) {
      if (d > 0 && rand() < missRate) continue;
      if (d === 0 && rand() < 0.2 && !highRiskToday) continue;

      const dateKey = dateKeyInTimeZone(new Date(now - d * DAY_MS), DEFAULT_WELLNESS_TIMEZONE);
      const drift = declining ? -((DAYS - d) / DAYS) * 1.1 : 0;
      const matchDip = POST_MATCH_DAYS.has(d) ? -1.1 : 0;
      const level = highRiskToday && d === 0 ? 1.4 : base + drift + matchDip;
      const soreness = clamp(level + (rand() - 0.5) * 1.4);
      const id = `demo-${player.wellness_token_id}-${dateKey}`;
      const createdAt = `${dateKey}T07:${String(10 + Math.floor(rand() * 40)).padStart(2, '0')}:00.000Z`;
      const bodyPart = soreness <= 2 ? BODY_PARTS[Math.floor(rand() * BODY_PARTS.length)] : '';

      records.push({
        id,
        wellness_token_id: player.wellness_token_id,
        player_id: player.player_id,
        club_profile_id: mockClub.clubProfile.id,
        player_name: player.player_name,
        muscle_soreness: soreness,
        energy_level: clamp(level + (rand() - 0.5) * 1.4),
        sleep_quality: clamp(level + (rand() - 0.5) * 1.6),
        sleep_hours: null,
        notes: soreness <= 2 && rand() < 0.5 ? 'Tight after session, monitor load' : null,
        recorded_by: null,
        recorded_at: dateKey,
        created_at: createdAt,
        updated_at: createdAt,
        source: 'whatsapp',
        soreness_details: bodyPart
          ? [{
              id: `${id}-sd`,
              wellness_checkin_id: id,
              body_part: bodyPart,
              context: CONTEXTS[Math.floor(rand() * CONTEXTS.length)],
              source: 'whatsapp',
              created_at: createdAt,
              updated_at: createdAt,
            }]
          : [],
      });

      if (rand() < 0.15) continue;
      const pickFrom = (list: string[]) => list[Math.floor(rand() * list.length)];
      const dayMeals = [pickFrom(BREAKFASTS), pickFrom(LUNCHES), pickFrom(SNACKS), pickFrom(DINNERS)];
      const mealCount = rand() < 0.2 ? 2 : 4;
      dayMeals.slice(0, mealCount).forEach((description, mi) => {
        meals.push({
          player_name: player.player_name,
          log_date: dateKey,
          meal_name: null,
          description,
          source: 'whatsapp',
          created_at: `${dateKey}T${String(8 + mi * 4).padStart(2, '0')}:15:00.000Z`,
        });
      });
    }

    if (pi % 2 === 0) {
      plans.push(buildPlan(player.player_name, {
        position: POSITIONS[pi % POSITIONS.length],
        weight: 68 + Math.round(rand() * 20),
        targetWeight: null,
        dietaryRequirements: [],
        foodDislikes: null,
        foodPreferences: null,
        mealsPerDay: null,
        injuryStatus: null,
        language: 'English',
      }, new Date(now - (pi % 7) * DAY_MS)));
    }
  });

  writeJSON('records', records);
  writeJSON('meals', meals);
  writeJSON('nutrition-plans', plans.sort((a, b) => b.created_at.localeCompare(a.created_at)));
}

export function clearWellnessData(): void {
  writeJSON('records', []);
  writeJSON('meals', []);
  writeJSON('nutrition-plans', []);
  writeJSON('billing', null);
}
