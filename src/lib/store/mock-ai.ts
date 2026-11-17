import { delay, newId } from './storage';
import type { MealEntry, MealOption, MealPlan, PlanContext } from './nutrition-types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_TYPES = ['training', 'training', 'recovery', 'training', 'training', 'match', 'recovery'];
const DAY_FACTOR: Record<string, number> = { training: 1, match: 1.1, recovery: 0.88 };

const POSITION_FACTOR: Record<string, number> = { GK: 0.92, CB: 1, FB: 1.05, CM: 1.08, CAM: 1.05, W: 1.06, ST: 1.02 };
const POSITION_LABEL: Record<string, string> = {
  GK: 'goalkeeper', CB: 'centre-back', FB: 'full-back', CM: 'central midfielder', CAM: 'attacking midfielder', W: 'winger', ST: 'striker',
};

const MEAL_SHARE: Record<string, number> = {
  Breakfast: 0.25, Lunch: 0.3, Dinner: 0.3, 'Morning Snack': 0.075, 'Afternoon Snack': 0.075, 'Pre-match Meal': 0.3,
};

const MENU: Record<string, string[][]> = {
  Breakfast: [
    ['80g oats with milk', '1 banana', '2 boiled eggs'],
    ['3-egg omelette with spinach', '2 slices wholegrain toast', 'Orange juice'],
    ['Greek yogurt 250g', 'Granola 60g', 'Mixed berries'],
    ['Porridge with honey and walnuts', 'Apple', 'Glass of milk'],
  ],
  Lunch: [
    ['150g grilled chicken breast', '200g brown rice', 'Steamed broccoli'],
    ['Tuna pasta salad', 'Cherry tomatoes', 'Wholegrain roll'],
    ['Turkey and avocado wrap', 'Quinoa salad', 'Pear'],
    ['Beef stir-fry with noodles', 'Mixed peppers', 'Sesame seeds'],
  ],
  Dinner: [
    ['180g baked salmon', 'Sweet potato 250g', 'Green beans'],
    ['Lean beef bolognese', 'Wholewheat spaghetti 120g', 'Side salad'],
    ['Chicken and vegetable curry', 'Basmati rice 180g', 'Natural yogurt'],
    ['Grilled sea bass', 'Roasted potatoes', 'Asparagus'],
  ],
  'Morning Snack': [
    ['Protein shake', 'Banana'],
    ['Rice cakes with peanut butter'],
    ['Handful of almonds', 'Apple'],
  ],
  'Afternoon Snack': [
    ['Cottage cheese with pineapple'],
    ['Protein bar', 'Orange'],
    ['Hummus with carrot sticks', 'Pitta bread'],
  ],
  'Pre-match Meal': [
    ['Plain pasta 150g with tomato sauce', 'Grilled chicken 120g', 'White bread roll'],
    ['Jasmine rice 200g', 'Turkey breast 120g', 'Steamed carrots'],
  ],
};

const pick = <T,>(list: T[], seed: number): T => list[Math.abs(seed) % list.length];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return h;
}

function mealSlots(mealsPerDay: string | null): string[] {
  const snacks = mealsPerDay ? Number(mealsPerDay.match(/(\d+)\s*snack/i)?.[1] ?? 2) : 2;
  const slots = ['Breakfast', 'Lunch', 'Dinner'];
  if (snacks >= 1) slots.splice(1, 0, 'Morning Snack');
  if (snacks >= 2) slots.splice(3, 0, 'Afternoon Snack');
  return slots;
}

function excluded(items: string[], dislikes: string): boolean {
  const words = dislikes.toLowerCase().split(/[,;]/).map(w => w.trim()).filter(Boolean);
  return words.some(w => items.some(item => item.toLowerCase().includes(w)));
}

function buildMeal(slot: string, dayCalories: number, seed: number, dislikes: string): MealEntry {
  const options = MENU[slot];
  const allowed = options.filter(o => !excluded(o, dislikes));
  return {
    meal: slot,
    items: pick(allowed.length ? allowed : options, seed),
    calories: Math.round((dayCalories * (MEAL_SHARE[slot] ?? 0.1)) / 10) * 10,
  };
}

function firstString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export async function generatePlan(playerName: string, context: PlanContext): Promise<MealPlan> {
  await delay(3600);
  return buildPlan(playerName, context);
}

export function buildPlan(playerName: string, context: PlanContext, createdAt = new Date()): MealPlan {
  const position = firstString(context.position);
  const weight = context.weight ?? 75;
  const target = context.targetWeight;
  const goalAdjust = target ? (target < weight ? -300 : target > weight ? 300 : 0) : 0;
  const base = Math.round((weight * 40 * (POSITION_FACTOR[position] ?? 1) + goalAdjust) / 10) * 10;
  const dislikes = context.foodDislikes ?? '';
  const slots = mealSlots(context.mealsPerDay);
  const seed = hash(playerName);

  const days = DAYS.map((day, di) => {
    const type = DAY_TYPES[di];
    const dayCalories = base * DAY_FACTOR[type];
    const daySlots = type === 'match' ? slots.map(s => (s === 'Lunch' ? 'Pre-match Meal' : s)) : slots;
    return { day, type, meals: daySlots.map((slot, mi) => buildMeal(slot, dayCalories, seed + di * 7 + mi, dislikes)) };
  });

  const goal = target && target !== weight ? (target < weight ? 'a gradual cut' : 'lean mass gain') : 'weight maintenance';
  const notes = [context.injuryStatus && `Injury: ${context.injuryStatus}.`, context.dietaryRequirements[0] && `Requirements: ${context.dietaryRequirements[0]}.`]
    .filter(Boolean)
    .join(' ');

  return {
    id: newId('plan'),
    player_name: playerName,
    player_context: { ...context },
    plan_content: {
      summary: `${base} kcal training-day target for a ${weight}kg ${POSITION_LABEL[position] ?? 'outfield player'}, built for ${goal}. Carbs rise on match day and drop on recovery days.${notes ? ` ${notes}` : ''}`,
      daily_calories: base,
      macro_split: { protein_pct: 25, carbs_pct: 50, fat_pct: 25 },
      days,
      hydration: `${(weight * 0.04).toFixed(1)}L water daily, plus 500ml per hour of training`,
      supplements: ['Vitamin D 2000 IU', 'Creatine 5g', 'Omega-3 1g'],
    },
    status: 'active',
    week_start: createdAt.toISOString().slice(0, 10),
    created_at: createdAt.toISOString(),
  };
}

function macros(calories: number): Omit<MealOption, 'items' | 'calories'> {
  return {
    protein_g: Math.round((calories * 0.25) / 4),
    carbs_g: Math.round((calories * 0.5) / 4),
    fat_g: Math.round((calories * 0.25) / 9),
  };
}

export async function swapOptions(mealSlot: string, currentItems: string[], calories: number): Promise<MealOption[]> {
  await delay(900);
  const pool = (MENU[mealSlot] ?? MENU.Lunch).filter(o => o.join() !== currentItems.join());
  return pool.slice(0, 3).map((items, i) => {
    const kcal = Math.round((calories * (0.95 + i * 0.05)) / 10) * 10;
    return { items, calories: kcal, ...macros(kcal) };
  });
}

export async function estimateMeal(description: string): Promise<MealOption> {
  await delay(700);
  const items = description.split(/,| and /).map(s => s.trim()).filter(Boolean);
  const kcal = Math.max(150, items.length * 160 + (hash(description) % 5) * 20);
  return { items, calories: kcal, ...macros(kcal) };
}
