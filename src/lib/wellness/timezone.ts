export const DEFAULT_WELLNESS_TIMEZONE = 'Europe/London';

export function dateKeyInTimeZone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isDateKeyToday(
  dateKey: string,
  timeZone: string,
  now: Date = new Date(),
): boolean {
  return dateKey.slice(0, 10) === dateKeyInTimeZone(now, timeZone);
}
