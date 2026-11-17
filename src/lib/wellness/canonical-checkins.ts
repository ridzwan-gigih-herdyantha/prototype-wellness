import type { WellnessRecord } from '@/lib/squad/types';
import type {
  DailyWellnessScores,
  JoinedCheckinRow,
  StaffCheckinInput,
} from '@/lib/wellness/types/canonical-checkins';

export function sorenessSeverityToScore(severity: number | null): number | null {
  if (severity === null) return null;
  if (severity === 0) return 5;
  if (severity < 1 || severity > 5) return null;
  return 6 - severity;
}

export function whatsAppSorenessScore(
  hasReportedSoreness: boolean,
  severity: number | null,
): number | null {
  return hasReportedSoreness ? sorenessSeverityToScore(severity) : 5;
}

export function buildStaffCheckinRow(input: StaffCheckinInput) {
  return {
    wellness_token_id: input.wellnessTokenId,
    log_date: input.logDate,
    soreness_score: input.muscleSoreness,
    energy_level: input.energyLevel,
    sleep_quality: input.sleepQuality,
    notes: input.notes,
    recorded_by: input.recordedBy,
    source: 'staff' as const,
  };
}

export function wellnessAverage(scores: DailyWellnessScores): number | null {
  const available = [
    scores.muscle_soreness,
    scores.energy_level,
    scores.sleep_quality,
  ].filter((score): score is number => typeof score === 'number' && Number.isFinite(score));

  if (available.length === 0) return null;
  return available.reduce((total, score) => total + score, 0) / available.length;
}

export function isCompleteWellnessRecord(scores: DailyWellnessScores): boolean {
  return [scores.muscle_soreness, scores.energy_level, scores.sleep_quality]
    .every((score) => typeof score === 'number' && Number.isFinite(score));
}

export function toWellnessRecord(row: JoinedCheckinRow): WellnessRecord {
  return {
    id: row.id,
    wellness_token_id: row.wellness_token_id,
    player_id: row.player_wellness_tokens.player_id,
    club_profile_id: row.player_wellness_tokens.club_profile_id,
    player_name: row.player_wellness_tokens.player_name,
    muscle_soreness: row.soreness_score,
    energy_level: row.energy_level,
    sleep_quality: row.sleep_quality,
    sleep_hours: row.sleep_hours,
    notes: row.notes,
    recorded_by: row.recorded_by,
    recorded_at: row.log_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: row.source,
    soreness_details: [],
  };
}
