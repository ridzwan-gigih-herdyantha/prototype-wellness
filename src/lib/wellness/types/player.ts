export type WellnessPlayerStatus = 'Verified' | 'Pending' | 'Not Started';

export interface WellnessPlayer {
  player_id: string;
  wellness_token_id: string;
  player_name: string;
  phone_masked: string | null;
  verified: boolean;
  opted_in: boolean;
  status: WellnessPlayerStatus;
}

export type WellnessPlayerOption = Pick<
  WellnessPlayer,
  'player_id' | 'wellness_token_id' | 'player_name'
>;
