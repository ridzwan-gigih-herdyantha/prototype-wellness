import type { WellnessSource } from '@/lib/wellness/types/canonical-checkins';

export interface SorenessDetailRow {
  id: string;
  wellness_checkin_id: string;
  body_part: string;
  context: string | null;
  source: WellnessSource;
  created_at: string;
  updated_at: string;
}

export type SorenessDetail = SorenessDetailRow;

export interface NormalizedStaffSorenessDetail {
  bodyPart: string;
  context: string | null;
}
