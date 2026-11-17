export interface CheckinScores {
  muscleSoreness: number | null;
  energyLevel: number | null;
  sleepQuality: number | null;
}

export interface CheckinFormState {
  scores: CheckinScores;
  notes: string;
  bodyPart: string;
  sorenessContext: string;
  /** One meal per line. */
  meals: string;
}

export type CheckinModalMode = 'edit' | 'read-only';
