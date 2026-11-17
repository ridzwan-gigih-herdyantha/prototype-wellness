export function toISODate(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    const utcMs = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(utcMs);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }

  const str = String(value).trim();
  if (!str) return null;

  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  return str;
}

/**
 * Matches a calendar date: a bare "2026-08-23", or the same date stored in a
 * timestamp column, which Supabase returns as midnight UTC.
 */
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]00:00:00(?:\.000)?(?:Z|\+00:?00)?)?$/;

/**
 * Parse a stored date for display.
 *
 * Calendar-date columns (`sofascore_matches.match_date`, `tm_games.date`, contract
 * expiries, due dates) carry no time, but `new Date('2026-08-23')` parses them as
 * UTC midnight, so formatting in the browser's timezone shifts the day back west
 * of UTC (a Sunday fixture renders as Saturday). Parse those at local midnight so
 * the calendar day survives; values carrying a real time are parsed unchanged.
 */
export function parseCalendarDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  const cal = str.match(CALENDAR_DATE);
  const d = cal
    ? new Date(Number(cal[1]), Number(cal[2]) - 1, Number(cal[3]))
    : new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format a stored date for display, without the calendar-date timezone shift.
 * Returns "-" when the value is missing or unparseable. See parseCalendarDate.
 */
export function formatCalendarDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  locale?: string,
): string {
  const d = parseCalendarDate(value);
  return d ? d.toLocaleDateString(locale, options) : '-';
}
