import { delay, readJSON, writeJSON } from './storage';

export interface WellnessBillingState {
  active: boolean;
  firstTeamSeats: number;
  academySeats: number;
  billingInterval: 'month' | 'year';
}

const EMPTY: WellnessBillingState = { active: false, firstTeamSeats: 0, academySeats: 0, billingInterval: 'month' };

export async function getBilling() {
  await delay(200);
  return { billing: readJSON<WellnessBillingState | null>('billing', null) };
}

export async function activateBilling(firstTeamSeats: number, academySeats: number, interval: 'month' | 'year') {
  await delay(400);
  writeJSON<WellnessBillingState>('billing', { active: true, firstTeamSeats, academySeats, billingInterval: interval });
}

export async function updateSeats(firstTeamSeats: number, academySeats: number) {
  await delay(300);
  const current = readJSON<WellnessBillingState>('billing', EMPTY);
  writeJSON<WellnessBillingState>('billing', { ...current, firstTeamSeats, academySeats });
}
