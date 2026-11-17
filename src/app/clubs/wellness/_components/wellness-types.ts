import type { WellnessRecord } from '@/lib/squad/types';

export interface PlayerMeal {
  player_name: string;
  log_date: string;
  meal_name: string | null;
  description: string | null;
  source: 'whatsapp' | 'web' | 'staff';
  created_at: string;
}

export interface PlayerSummary {
  name: string;
  latest: WellnessRecord;
  today: WellnessRecord | null;
  avg: number | null;
  risk: 'HIGH RISK' | 'MODERATE' | 'GOOD' | null;
  trend: 'improving' | 'declining' | 'stable';
  checkInsThisWeek: number;
  history: WellnessRecord[];
  hasNutritionPlan: boolean;
  todayMeals: PlayerMeal[];
  todayMealTime: string | null;
  mealsByDate: Record<string, PlayerMeal[]>;
}

export interface TodayMetrics {
  checkedInToday: number;
  avgScore: number | null;
  highRisk: PlayerSummary[];
}

export interface NutritionPlanSummary {
  player_name: string;
  status: string;
  daily_calories: number | null;
}

export type ViewMode = 'players' | 'nutrition' | 'onboarding';
export type SortKey = 'risk' | 'name' | 'recent' | 'soreness' | 'energy' | 'sleep';
