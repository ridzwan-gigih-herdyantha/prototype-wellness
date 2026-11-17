import type { SorenessDetail } from '@/lib/wellness/types/soreness';

export interface WellnessRecord {
  id: string;
  wellness_token_id: string;
  player_id: string;
  club_profile_id: string;
  player_name: string;
  muscle_soreness: number | null;
  energy_level: number | null;
  sleep_quality: number | null;
  sleep_hours: number | null;
  notes: string | null;
  recorded_by: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
  source: 'whatsapp' | 'web' | 'staff';
  soreness_details: SorenessDetail[];
}
