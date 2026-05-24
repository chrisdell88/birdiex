/**
 * Player name formatting helpers.
 *
 * DataGolf returns names as "Last, First" (e.g. "Kim, Si Woo"). Most
 * user-facing surfaces (Rankings, Matchups, Ticker) display "First Last".
 * This helper does the flip — safe on names that don't have a comma
 * (returns the input unchanged).
 */

/** "Kim, Si Woo" → "Si Woo Kim". "Greyserman, Max" → "Max Greyserman". */
export function formatPlayerName(raw: string): string {
  if (!raw) return raw;
  const idx = raw.indexOf(',');
  if (idx < 0) return raw;
  const last = raw.slice(0, idx).trim();
  const first = raw.slice(idx + 1).trim();
  if (!first || !last) return raw;
  return `${first} ${last}`;
}
