import { delay, readJSON, writeJSON } from './storage';
import type { MealPlan } from './nutrition-types';

const readPlans = () => readJSON<MealPlan[]>('nutrition-plans', []);

export async function listPlans(limit?: number, offset = 0) {
  await delay(200);
  const all = readPlans();
  const page = limit === undefined ? all.slice(offset) : all.slice(offset, offset + limit);
  return { data: page, hasMore: offset + page.length < all.length };
}

export function addPlan(plan: MealPlan): void {
  writeJSON('nutrition-plans', [plan, ...readPlans()]);
}

export function updatePlan(plan: MealPlan): void {
  writeJSON('nutrition-plans', readPlans().map(p => (p.id === plan.id ? plan : p)));
}
