/**
 * Shared all-time stats — THE source of truth for every page that quotes
 * an all-time number (Methodology banner, Results banner, EdgeDistribution
 * chart, EquityCurve chart, BacktestLab, alerts copy, anywhere else).
 *
 * Critical property: NEW EVENTS APPEAR AUTOMATICALLY. We use Vite's
 * `import.meta.glob` to pick up every `src/data/*Results.ts` file at build
 * time. Adding a new event = drop the grader output into `src/data/` and
 * everything updates. No edits to component imports. No edits to this file.
 *
 * History: this file used to hardcode `import { r2Results } from './pgaChampR2Results';`
 * etc. New events (CJ, CSC, Memorial) were added to ResultsPage.tsx +
 * BacktestLab.tsx but not here, so the Methodology banner silently froze
 * at Masters+PGA numbers for weeks. The 2026-06-06 Chris audit caught it.
 *
 * Filter pattern:
 *   - Each `*Results.ts` file is mapped to an EventId via its filename
 *     prefix (eg `memorialR2Results.ts` → 'the-memorial-tournament-2026').
 *     The mapping lives in PREFIX_TO_EVENT_ID below.
 *   - Bets are filtered by each event's venue floor from venues.ts.
 *   - Masters has its own legacy file (`resultsData.ts`) — handled separately.
 *
 * Adding a new event:
 *   1. Run the grader. It writes `src/data/<prefix>R<N>Results.ts`.
 *   2. Add `<prefix>` → eventId to PREFIX_TO_EVENT_ID below.
 *   3. Add the eventId to `src/config/venues.ts`.
 *   That's it. All consumers see it on next build.
 */
import type { BetRecord } from '../types';
import { unitsForEdge, stakeToWin1, isTrackedBet } from './sizing';
import { floorForEvent, type EventId } from '../config/venues';
import { betLog } from '../data/resultsData';

// Prefix used in filenames (`<prefix>R<N>Results.ts`) → venues.ts EventId.
// When you onboard a new event, add a line here.
const PREFIX_TO_EVENT_ID: Record<string, EventId> = {
  pgaChamp: 'pga-2026',
  cjCup: 'cj-cup-byron-nelson-2026',
  csc: 'charles-schwab-challenge-2026',
  memorial: 'the-memorial-tournament-2026',
  // Masters uses the legacy `resultsData.ts` file — handled below, not here.
};

// Vite eagerly imports every Results file at build time. The glob runs against
// the literal source tree, NOT a runtime filesystem call — adding a new file
// requires re-running the build (which the grader's commit triggers anyway).
const resultsModules = import.meta.glob<Record<string, unknown>>(
  '../data/*Results.ts',
  { eager: true },
);

interface EventBucket {
  eventId: EventId;
  prefix: string;
  /** All graded picks across every round of this event (raw — not filtered). */
  raw: BetRecord[];
  /** Picks at or above the venue floor (i.e. tracked / Best Bets). */
  tracked: BetRecord[];
  /** Per-round breakdown for consumers that need granular series (e.g. EquityCurve). */
  rounds: Array<{ round: number; bets: BetRecord[]; tracked: BetRecord[] }>;
}

function summariseInternal(bets: BetRecord[]) {
  let wins = 0, losses = 0, pushes = 0, units = 0, staked = 0;
  for (const b of bets) {
    if (b.result === 'W') wins++;
    else if (b.result === 'L') losses++;
    else pushes++;
    units += b.units;
    if (b.result !== 'P') staked += unitsForEdge(b.edge) * stakeToWin1(b.bestOdds);
  }
  return {
    wins,
    losses,
    pushes,
    bets: bets.length,
    units: +units.toFixed(2),
    staked: +staked.toFixed(2),
    roi: staked > 0 ? +((units / staked) * 100).toFixed(1) : 0,
  };
}

// Exported summariser so consumers can build their own filtered roll-ups
// without re-implementing the math.
export const summarise = summariseInternal;

// ─── Masters (legacy data file) ──────────────────────────────────────────────
const mastersFloor = floorForEvent('masters-2026');
const mastersBucket: EventBucket = {
  eventId: 'masters-2026',
  prefix: 'masters',
  raw: betLog,
  tracked: betLog.filter((b) => isTrackedBet(b.edge, mastersFloor.floor)),
  // Masters legacy data doesn't have round numbers stored consistently — we
  // expose a single round-1 bucket. Per-round consumers should handle this.
  rounds: [{ round: 1, bets: betLog, tracked: betLog.filter((b) => isTrackedBet(b.edge, mastersFloor.floor)) }],
};

// ─── Globbed events (PGA, CJ, CSC, Memorial, future events) ─────────────────
const buckets = new Map<EventId, EventBucket>();
buckets.set('masters-2026', mastersBucket);

for (const [path, mod] of Object.entries(resultsModules)) {
  // Path looks like '../data/memorialR2Results.ts'.
  const m = path.match(/\/([a-zA-Z]+)R(\d+)Results\.ts$/);
  if (!m) continue;
  const prefix = m[1];
  const round = Number(m[2]);
  const eventId = PREFIX_TO_EVENT_ID[prefix];
  if (!eventId) {
    // Unknown prefix — log a warning so a new event without a registered
    // EventId is visible (build still succeeds, but the file shows up in dev).
    console.warn(`[allTimeStats] Unknown event prefix "${prefix}" in ${path}. Add it to PREFIX_TO_EVENT_ID.`);
    continue;
  }
  const exportKey = `r${round}Results`;
  const bets = (mod as Record<string, unknown>)[exportKey] as BetRecord[] | undefined;
  if (!Array.isArray(bets)) continue;

  const floor = floorForEvent(eventId).floor;
  const tracked = bets.filter((b) => isTrackedBet(b.edge, floor));

  let bucket = buckets.get(eventId);
  if (!bucket) {
    bucket = { eventId, prefix, raw: [], tracked: [], rounds: [] };
    buckets.set(eventId, bucket);
  }
  bucket.raw.push(...bets);
  bucket.tracked.push(...tracked);
  bucket.rounds.push({ round, bets, tracked });
}

// Stable insertion order: Masters first, then events in registration order.
const eventList = Array.from(buckets.values());
for (const ev of eventList) {
  ev.rounds.sort((a, b) => a.round - b.round);
}

export const eventBuckets = eventList;
export const allTrackedBets = eventList.flatMap((ev) => ev.tracked);

// Per-event summaries — keep legacy named exports for back-compat.
export const mastersStats = summariseInternal(mastersBucket.tracked);
export const pgaStats = summariseInternal(
  buckets.get('pga-2026')?.tracked ?? [],
);
export const cjStats = summariseInternal(
  buckets.get('cj-cup-byron-nelson-2026')?.tracked ?? [],
);
export const cscStats = summariseInternal(
  buckets.get('charles-schwab-challenge-2026')?.tracked ?? [],
);
export const memorialStats = summariseInternal(
  buckets.get('the-memorial-tournament-2026')?.tracked ?? [],
);

// The canonical all-time number — used by Methodology banner, Results banner,
// EdgeDistributionChart, EquityCurve, BacktestLab, and any alerts copy.
export const allTimeStats = summariseInternal(allTrackedBets);
export const allTimeBets = allTrackedBets;

// How many events made it into this roll-up. Methodology + Results banner
// can quote this directly instead of hardcoding "5 tournaments".
export const allTimeEventCount = eventList.length;
