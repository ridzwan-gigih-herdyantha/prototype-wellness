import type { WellnessRecord } from '@/lib/squad/types';
import type { CheckinFormState } from '@/lib/wellness/types/checkin-form';

export function emptyCheckinFormState(): CheckinFormState {
  return {
    scores: { muscleSoreness: 3, energyLevel: 3, sleepQuality: 3 },
    notes: '',
    bodyPart: '',
    sorenessContext: '',
    meals: '',
  };
}

export function formStateFromRecord(record: WellnessRecord, meals = ''): CheckinFormState {
  const detail = record.soreness_details[0];
  return {
    scores: {
      muscleSoreness: record.muscle_soreness,
      energyLevel: record.energy_level,
      sleepQuality: record.sleep_quality,
    },
    notes: record.notes ?? '',
    bodyPart: detail?.body_part ?? '',
    sorenessContext: detail?.context ?? '',
    meals,
  };
}

export function withSorenessScore(
  state: CheckinFormState,
  muscleSoreness: number,
): CheckinFormState {
  return {
    ...state,
    scores: { ...state.scores, muscleSoreness },
    ...(muscleSoreness === 5 ? { bodyPart: '', sorenessContext: '' } : {}),
  };
}
