import type { WellnessRecord } from '@/lib/squad/types';

export function replaceOrPrependWellnessRecord(
  records: WellnessRecord[],
  nextRecord: WellnessRecord,
): WellnessRecord[] {
  return [nextRecord, ...records.filter((record) => record.id !== nextRecord.id)];
}

