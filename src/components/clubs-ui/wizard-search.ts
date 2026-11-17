/**
 * Ranking for the wizard / picker searchable dropdowns.
 *
 * Substring filtering alone buries the league a user actually means: typing
 * "premier league" matched "Canadian Premier League" before "Premier League".
 * Results are graded by match quality first (exact > prefix > word-start >
 * contains > metadata), then by `rank` (TM league tier), then shortest label.
 */

export interface RankableOption {
  value: string;
  label: string;
  meta?: string;
  /** Higher wins ties. League options carry the TransferMarkt tier here. */
  rank?: number;
}

const EXACT = 0;
const PREFIX = 1;
const WORD_START = 2;
const CONTAINS = 3;
const META = 4;
const NO_MATCH = 99;

function isWordBoundary(haystack: string, index: number): boolean {
  if (index === 0) return true;
  return !/[a-z0-9]/.test(haystack[index - 1]);
}

function matchClass(option: RankableOption, query: string): number {
  const label = option.label.toLowerCase();
  const value = option.value.toLowerCase();
  if (label === query || value === query) return EXACT;
  if (label.startsWith(query) || value.startsWith(query)) return PREFIX;
  const at = label.indexOf(query);
  if (at > 0 && isWordBoundary(label, at)) return WORD_START;
  if (at >= 0) return CONTAINS;
  if ((option.meta || '').toLowerCase().includes(query)) return META;
  return NO_MATCH;
}

/**
 * Filter and sort options for a search query. An empty query returns the
 * highest-ranked options, so the dropdown is useful before any typing.
 */
export function rankSearchOptions<T extends RankableOption>(
  options: T[],
  query: string,
  limit = 30,
): T[] {
  const q = query.trim().toLowerCase();
  const scored: { option: T; cls: number }[] = [];

  for (const option of options) {
    const cls = q ? matchClass(option, q) : CONTAINS;
    if (cls === NO_MATCH) continue;
    scored.push({ option, cls });
  }

  scored.sort((a, b) => {
    if (a.cls !== b.cls) return a.cls - b.cls;
    const rankDiff = (b.option.rank ?? 0) - (a.option.rank ?? 0);
    if (rankDiff !== 0) return rankDiff;
    if (a.option.label.length !== b.option.label.length) {
      return a.option.label.length - b.option.label.length;
    }
    return a.option.label.localeCompare(b.option.label);
  });

  return scored.slice(0, limit).map(s => s.option);
}

/** True when the query already names an option exactly (hides the "use custom" row). */
export function hasExactMatch(options: RankableOption[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return options.some(o => o.label.toLowerCase() === q || o.value.toLowerCase() === q);
}
