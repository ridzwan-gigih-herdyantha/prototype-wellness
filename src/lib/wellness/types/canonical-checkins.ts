export type WellnessSource = 'whatsapp' | 'web' | 'staff';

export interface DailyWellnessScores {
  muscle_soreness: number | null;
  energy_level: number | null;
  sleep_quality: number | null;
}

export interface StaffCheckinInput {
  wellnessTokenId: string;
  logDate: string;
  muscleSoreness: number;
  energyLevel: number;
  sleepQuality: number;
  notes: string | null;
  recordedBy: string;
}

export interface CanonicalCheckinRow {
  id: string;
  wellness_token_id: string;
  log_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  soreness_score: number | null;
  energy_level: number | null;
  bed_time: string | null;
  wake_time: string | null;
  notes: string | null;
  recorded_by: string | null;
  source: WellnessSource;
  created_at: string;
  updated_at: string;
}

export interface JoinedCheckinRow extends CanonicalCheckinRow {
  player_wellness_tokens: {
    club_profile_id: string;
    player_id: string;
    player_name: string;
  };
}
