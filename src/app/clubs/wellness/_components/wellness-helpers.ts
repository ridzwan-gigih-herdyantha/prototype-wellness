import type { WellnessRecord } from '@/lib/squad/types';
import { wellnessAverage } from '@/lib/wellness/canonical-checkins';
import { isDateKeyToday } from '@/lib/wellness/timezone';
import type { PlayerMeal, PlayerSummary, TodayMetrics } from './wellness-types';

export function calcTrend(history: WellnessRecord[]): 'improving' | 'declining' | 'stable' {
  if (history.length < 3) return 'stable';
  const recent = history.slice(0, 3);
  const older = history.slice(3, 6);
  if (older.length === 0) return 'stable';
  const avgRecent = recent.reduce((sum, record) => sum + (wellnessAverage(record) ?? 0), 0) / recent.length;
  const avgOlder = older.reduce((sum, record) => sum + (wellnessAverage(record) ?? 0), 0) / older.length;
  const diff = avgRecent - avgOlder;
  if (diff > 0.3) return 'improving';
  if (diff < -0.3) return 'declining';
  return 'stable';
}

export function daysAgo(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function isThisWeek(dateStr: string): boolean {
  return daysAgo(dateStr) <= 7;
}

export function lastCheckLabel(dateStr: string): string {
  const d = daysAgo(dateStr);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

export function mealSummary(meals: PlayerMeal[]): string {
  return meals
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((meal) => meal.description?.trim())
    .filter((description): description is string => Boolean(description))
    .join(', ');
}

export function mealsForDay(meals: PlayerMeal[], playerName: string, dateKey: string): PlayerMeal[] {
  return meals
    .filter((meal) => meal.player_name === playerName && meal.log_date.slice(0, 10) === dateKey)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** Editable form text: one meal per line. */
export function mealsAsLines(meals: PlayerMeal[]): string {
  return meals.map((meal) => meal.description?.trim()).filter(Boolean).join('\n');
}

export function mealSourceNote(meals: PlayerMeal[], timeZone: string): string {
  const staffNote = 'Staff edits are saved as source: staff.';
  const last = meals.at(-1);
  if (!last) return `No meals logged yet. ${staffNote}`;
  const origin = last.source === 'whatsapp' ? 'WhatsApp' : last.source === 'staff' ? 'staff' : 'web';
  const count = `${meals.length} ${meals.length === 1 ? 'message' : 'messages'}`;
  return `From ${origin} (${count}, last ${formatMealTime(last.created_at, timeZone)}). ${staffNote}`;
}

function formatMealTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(iso));
}

function groupMealsByDate(meals: PlayerMeal[]): Record<string, PlayerMeal[]> {
  const byDate: Record<string, PlayerMeal[]> = {};
  for (const meal of meals) (byDate[meal.log_date.slice(0, 10)] ??= []).push(meal);
  return byDate;
}

export function buildPlayerSummaries(
  records: WellnessRecord[],
  nutritionPlanNames: ReadonlySet<string>,
  timeZone: string,
  now: Date = new Date(),
  meals: PlayerMeal[] = [],
): PlayerSummary[] {
  const grouped: Record<string, WellnessRecord[]> = {};
  for (const record of records) {
    if (!grouped[record.player_name]) grouped[record.player_name] = [];
    grouped[record.player_name].push(record);
  }

  return Object.entries(grouped).map(([name, playerRecords]) => {
    const history = playerRecords
      .slice()
      .sort((a, b) =>
        b.recorded_at.localeCompare(a.recorded_at) ||
        b.created_at.localeCompare(a.created_at),
      );
    const latest = history[0];
    const today = history.find((record) =>
      isDateKeyToday(record.recorded_at, timeZone, now),
    ) ?? null;
    const mealsByDate = groupMealsByDate(meals.filter((meal) => meal.player_name === name));
    const todayMeals = Object.entries(mealsByDate)
      .filter(([dateKey]) => isDateKeyToday(dateKey, timeZone, now))
      .flatMap(([, dayMeals]) => dayMeals)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const lastTodayMeal = todayMeals.at(-1);
    const avg = today ? wellnessAverage(today) : null;
    const risk: PlayerSummary['risk'] = avg === null
      ? null
      : avg <= 2
        ? 'HIGH RISK'
        : avg <= 3
          ? 'MODERATE'
          : 'GOOD';

    return {
      name,
      latest,
      today,
      avg,
      risk,
      trend: calcTrend(history),
      checkInsThisWeek: history.filter((record) => isThisWeek(record.recorded_at)).length,
      history: history.slice(0, 14),
      hasNutritionPlan: nutritionPlanNames.has(name),
      todayMeals,
      todayMealTime: lastTodayMeal ? formatMealTime(lastTodayMeal.created_at, timeZone) : null,
      mealsByDate,
    };
  });
}

export function buildTodayMetrics(summaries: PlayerSummary[]): TodayMetrics {
  const checkedIn = summaries.filter(
    (summary): summary is PlayerSummary & { avg: number } =>
      summary.today !== null && summary.avg !== null,
  );

  return {
    checkedInToday: summaries.filter((summary) => summary.today !== null).length,
    avgScore: checkedIn.length > 0
      ? checkedIn.reduce((total, summary) => total + summary.avg, 0) / checkedIn.length
      : null,
    highRisk: checkedIn.filter((summary) => summary.risk === 'HIGH RISK'),
  };
}

export function buildTeamPulse(records: WellnessRecord[], days: number): { date: string; avg: number; count: number }[] {
  const now = new Date();
  const buckets: Record<string, { total: number; count: number }> = {};
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    buckets[date.toISOString().split('T')[0]] = { total: 0, count: 0 };
  }
  for (const r of records) {
    const key = r.recorded_at.split('T')[0];
    if (buckets[key]) {
      const average = wellnessAverage(r);
      if (average !== null) {
        buckets[key].total += average;
        buckets[key].count += 1;
      }
    }
  }
  return Object.entries(buckets)
    .map(([date, { total, count }]) => ({ date, avg: count > 0 ? total / count : 0, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function detectSorenessDips(records: WellnessRecord[], days: number): { date: string; avgSoreness: number; playerCount: number }[] {
  const now = new Date();
  const buckets: Record<string, { total: number; count: number }> = {};
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    buckets[date.toISOString().split('T')[0]] = { total: 0, count: 0 };
  }
  for (const r of records) {
    const key = r.recorded_at.split('T')[0];
    if (buckets[key] && r.muscle_soreness !== null) {
      buckets[key].total += r.muscle_soreness;
      buckets[key].count += 1;
    }
  }
  const dailyAvgs = Object.entries(buckets)
    .map(([date, { total, count }]) => ({ date, avgSoreness: count > 0 ? total / count : 0, playerCount: count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const dips: typeof dailyAvgs = [];
  for (let i = 1; i < dailyAvgs.length; i++) {
    const prev = dailyAvgs[i - 1];
    const curr = dailyAvgs[i];
    if (prev.avgSoreness > 0 && curr.avgSoreness > 0 && curr.playerCount >= 3
      && (prev.avgSoreness - curr.avgSoreness) >= 0.8) {
      dips.push(curr);
    }
  }
  return dips;
}

export const QUESTIONS = [
  { key: 'muscleSoreness' as const, label: 'Muscle Soreness', lowLabel: 'Very sore', highLabel: 'No soreness' },
  { key: 'energyLevel' as const, label: 'Energy Level', lowLabel: 'Exhausted', highLabel: 'Full energy' },
  { key: 'sleepQuality' as const, label: 'Sleep Quality', lowLabel: 'Very poor', highLabel: 'Excellent' },
];

export const INPUT_CLS =
  'w-full px-3 py-2.5 rounded-xl border border-line bg-ink/[0.03] text-sm text-foreground font-light placeholder:text-xs placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-foreground/[0.15] focus:border-transparent transition-colors';
