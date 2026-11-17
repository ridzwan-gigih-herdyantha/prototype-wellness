export interface MealEntry {
  meal: string;
  items: string[];
  calories: number;
}

export interface MealPlan {
  id: string;
  player_name: string;
  player_context: Record<string, unknown>;
  plan_content: {
    summary?: string;
    daily_calories?: number;
    macro_split?: { protein_pct: number; carbs_pct: number; fat_pct: number };
    days?: {
      day: string;
      type: string;
      meals: MealEntry[];
    }[];
    grocery_list?: Record<string, string[]>;
    hydration?: string;
    supplements?: string[];
  } | null;
  status: string;
  week_start: string;
  created_at: string;
}

export interface MealOption {
  items: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface PlanContext {
  position?: string | string[];
  weight: number | null;
  targetWeight: number | null;
  dietaryRequirements: string[];
  foodDislikes: string | null;
  foodPreferences: string | null;
  mealsPerDay: string | null;
  injuryStatus: string | null;
  language: string;
}
