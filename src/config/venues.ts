/**
 * Venue predictability map — historical per-event predictability scores,
 * used to compute each tournament's recommended bet floor (the "tracked
 * bets" cutoff that users see on the Results / Matchups / Odds pages).
 *
 * Source of truth: `scripts/lib/courses.ts` — this file mirrors the
 * predictability numbers for runtime use. Edit both when adding a new venue.
 *
 * The actual floor formula and tier-snap logic lives in
 * `src/lib/sizing.ts` (`recommendedFloorForPredictability`).
 */
import { recommendedFloorForPredictability, floorTierLabel } from '../lib/sizing';

export type EventId = 'masters-2026' | 'pga-2026' | 'cj-cup-byron-nelson-2026' | 'charles-schwab-challenge-2026' | 'the-memorial-tournament-2026' | 'rbc-canadian-open-2026' | 'us-open-2026';

interface VenueInfo {
  /** Tournament label as shown to users. */
  eventName: string;
  /** Venue name. */
  course: string;
  /** Course predictability (avg |total_course_history_adjustment| over field). */
  predictability: number;
  /** Optional: explicit floor that overrides the predictability-derived one
   *  for THIS event's public record. Use when an event was published at a
   *  specific floor and that floor IS the record — otherwise updating the
   *  predictability source (e.g. field-method → bar-chart) would retroactively
   *  rewrite the published W-L-units number, which is wrong. The Lab page
   *  still sweeps all tiers; this only governs the canonical Results figure. */
  publishedFloor?: number;
}

// All predictability values come from DataGolf's Course History Tool chart
// (pulled 2026-05-25). Exact bar heights stored in src/data/dataGolfPredictability.ts.
// Scaling: predictability = dgBarPct × 0.001580 (anchored so Augusta = 0.1439).
export const VENUES: Record<EventId, VenueInfo> = {
  'masters-2026': {
    eventName: 'Masters 2026',
    course: 'Augusta National',
    // DataGolf bar pct: 91.11 → 0.1439 (anchor).
    predictability: 0.1439,
  },
  'pga-2026': {
    eventName: 'PGA Championship 2026',
    course: 'Aronimink',
    // Bar-chart-derived predictability is 0.0143 (dgBarPct 9.08), which the
    // formula maps to floor 2.95. BUT the PGA Championship was PUBLISHED at
    // floor 2.45 (the old field-method predictability anchor of 0.0413). The
    // canonical record at publication was 5-0-0 / +10.50u — moving to 2.95
    // retroactively rewrites that to 1-0-0 / +2.50u, which is just wrong as
    // a record-keeping matter. Locking the published floor at 2.45 here.
    // Lab page still shows every tier for research; this only governs the
    // public Results figure.
    predictability: 0.0143,
    publishedFloor: 2.45,
  },
  'cj-cup-byron-nelson-2026': {
    eventName: 'CJ Cup Byron Nelson 2026',
    course: 'TPC Craig Ranch',
    // DataGolf bar pct: 22.14 → 0.0350 (formula maps to 2.45 by snap).
    // publishedFloor LOCKED at 1.95 per post-event analysis: the 1.95–2.45
    // band ran 15 bets 10-2-3 (+12.53u, 83.3% hit, Sharpe-like +0.79). The
    // 2.45+ band ran 3-7-1 (−12.09u) but ~all of that loss is the single
    // R4 Seamus Power 4-bet correlated fade cluster (0-4-0, −12.54u);
    // stripping Power R4 leaves 2.45+ at +0.45u. So the model worked at
    // Craig Ranch — 1.95 captures the engine, the 2.45-only floor was
    // a fluke driven by one correlated tail event.
    predictability: 0.0350,
    publishedFloor: 1.95,
  },
  'charles-schwab-challenge-2026': {
    eventName: 'Charles Schwab Challenge 2026',
    course: 'Colonial Country Club',
    // DataGolf bar pct: 31.84 → 0.0503. Floor: 2.45 (★★+).
    predictability: 0.0503,
  },
  'the-memorial-tournament-2026': {
    eventName: 'The Memorial Tournament 2026',
    course: 'Muirfield Village Golf Club',
    // DataGolf bar pct: 39.32 → 0.0621 → formula floor 1.95.
    predictability: 0.0621,
    // publishedFloor LOCKED at 2.45 per Chris 2026-06-06 based on R2 backtest.
    // R2 per-floor:
    //   0.95: 29 bets, 15-13-1, -5.35u (-19.8% ROI)
    //   1.45: 13 bets, 4-9-0,  -8.60u (-44.1% ROI)
    //   1.95: 9 bets,  3-6-0,  -5.44u (-35.1% ROI)  ← formula default
    //   2.45: 4 bets,  3-1-0,  +4.33u (+54.1% ROI)  ← published
    //   2.95: 0 bets
    // The 1.95–2.44 band went 0-5-0 in R2; that band drags 1.95 negative.
    // Tiny sample (4 at 2.45); revisit after R3 + R4 grade.
    publishedFloor: 2.45,
  },
  'rbc-canadian-open-2026': {
    eventName: 'RBC Canadian Open 2026',
    // Corrected 2026-06-11: actual venue is TPC Toronto at Osprey Valley
    // (North Course) per DataGolf field-updates — NOT Hamilton G&CC.
    course: 'TPC Toronto at Osprey Valley (North Course)',
    // CANONICAL field-method predictability (mean |course_history_adj| over
    // the 147-player field, live decompositions 2026-06-11): 0.0324 →
    // raw floor 3.05 − 14.62×0.0324 = 2.577 → snaps to 2.45 (★★+). The
    // bar-chart proxy (0.0096 → 2.95) mixes scales with the field-method-
    // anchored formula; field method wins when decompositions exist. No
    // publishedFloor override — formula default.
    predictability: 0.0324,
  },
  'us-open-2026': {
    eventName: 'U.S. Open 2026',
    course: 'Shinnecock Hills Golf Club',
    // CANONICAL field-method predictability (mean |course_history_adj| over
    // the live 156-player field, decompositions 2026-06-19): 0.0396 →
    // raw floor 3.05 − 14.62×0.0396 = 2.471 → snaps to 2.45 (★★+). MAJOR
    // (Layer-4 applies). No publishedFloor override — formula default.
    predictability: 0.0396,
  },
};

/** Derived helpers — recommended floor + tier label per event. */
export function floorForEvent(eventId: EventId) {
  const v = VENUES[eventId];
  const floor = v.publishedFloor ?? recommendedFloorForPredictability(v.predictability);
  return {
    eventName: v.eventName,
    course: v.course,
    predictability: v.predictability,
    floor,
    label: floorTierLabel(floor),
  };
}
