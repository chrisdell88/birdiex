/**
 * DataGolf API client.
 *
 * Reads key from process.env.DATAGOLF_API_KEY. Loads .env via dotenv.
 * Rate limit: 45 req/min — we throttle to 1 req every ~1.4s.
 */
import 'dotenv/config';

const BASE = 'https://feeds.datagolf.com';
const API_KEY = process.env.DATAGOLF_API_KEY;

if (!API_KEY) {
  throw new Error(
    'DATAGOLF_API_KEY missing. Add it to .env (see .env.example) before running pipeline scripts.'
  );
}

// Simple in-process rate limiter — DataGolf allows 45 req/min ≈ 1.33s between calls.
let lastCallAt = 0;
const MIN_INTERVAL_MS = 1500;

async function rateLimitedFetch(url: string): Promise<unknown> {
  const now = Date.now();
  const wait = Math.max(0, lastCallAt + MIN_INTERVAL_MS - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();

  const safeUrl = url.replace(API_KEY!, '***');
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`DataGolf request failed ${res.status} ${res.statusText} — ${safeUrl}`);
  }
  return res.json();
}

function buildUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const u = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) u.searchParams.set(k, String(v));
  }
  u.searchParams.set('file_format', 'json');
  u.searchParams.set('key', API_KEY!);
  return u.toString();
}

// ---------- Endpoint wrappers ----------

export type Tour = 'pga' | 'euro' | 'kft' | 'alt' | 'liv';

/** List of upcoming + recent events on the schedule. */
export const getEventList = (tour: Tour = 'pga') =>
  rateLimitedFetch(buildUrl('/get-event-list', { tour }));

/** Pre-tournament predictions (SG breakdown + finish-position probabilities). */
export const getPreTournament = (tour: Tour = 'pga') =>
  rateLimitedFetch(buildUrl('/preds/pre-tournament', { tour, odds_format: 'percent' }));

/** Player decompositions — L2 (course history), L3 (fit + sg cat), L4 (major adj). */
export const getPlayerDecompositions = (tour: Tour = 'pga') =>
  rateLimitedFetch(buildUrl('/preds/player-decompositions', { tour }));

/** Live in-play probabilities (mid-tournament). */
export const getInPlay = (tour: Tour = 'pga') =>
  rateLimitedFetch(buildUrl('/preds/in-play', { tour, odds_format: 'percent' }));

/**
 * Live tournament stats — SG breakdowns per round.
 * round: '1' | '2' | '3' | '4' | 'event_avg' | 'event_cumulative'
 *
 * The cumulative X Score track uses 'event_cumulative' — the accumulating
 * SG totals across all completed rounds (verified: this is what the Masters
 * cumulative model used). 'event_avg' is the per-round average and is NOT
 * used by the model.
 */
export type LiveStatsRound = '1' | '2' | '3' | '4' | 'event_avg' | 'event_cumulative';
export const getLiveTournamentStats = (round: LiveStatsRound = 'event_cumulative') =>
  rateLimitedFetch(
    buildUrl('/preds/live-tournament-stats', {
      stats: 'sg_putt,sg_arg,sg_app,sg_ott,sg_bs,sg_t2g,distance,accuracy',
      round,
      display: 'value',
    })
  );

/** Current field + tee times. */
export const getFieldUpdates = (tour: Tour = 'pga') =>
  rateLimitedFetch(buildUrl('/field-updates', { tour }));

export type MatchupMarket = 'round_matchups' | 'tournament_matchups' | '3_balls';

/** H2H + 3-ball matchup odds across sportsbooks. */
export const getMatchups = (market: MatchupMarket, tour: Tour = 'pga') =>
  rateLimitedFetch(
    buildUrl('/betting-tools/matchups', { tour, market, odds_format: 'american' })
  );

export type OutrightMarket = 'win' | 'top_5' | 'top_10' | 'top_20' | 'make_cut';

/** Outright odds. */
export const getOutrights = (market: OutrightMarket, tour: Tour = 'pga') =>
  rateLimitedFetch(
    buildUrl('/betting-tools/outrights', { tour, market, odds_format: 'american' })
  );

/** DataGolf player rankings (overall skill). */
export const getDgRankings = () => rateLimitedFetch(buildUrl('/preds/get-dg-rankings'));

/** Player skill decomposition (long-run baseline). */
export const getSkillDecompositions = () =>
  rateLimitedFetch(buildUrl('/preds/skill-decompositions'));

/** Historical raw data event list (paywalled — for backtests). */
export const getHistoricalEventList = () =>
  rateLimitedFetch(buildUrl('/historical-raw-data/event-list'));
