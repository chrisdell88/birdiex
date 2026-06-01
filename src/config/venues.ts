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

export type EventId = 'masters-2026' | 'pga-2026' | 'cj-cup-byron-nelson-2026' | 'charles-schwab-challenge-2026';

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
    // DataGolf bar pct: 22.14 → 0.0350. Floor stays at 2.45 (★★+) —
    // small shift from old 0.0373, no tier change.
    predictability: 0.0350,
  },
  'charles-schwab-challenge-2026': {
    eventName: 'Charles Schwab Challenge 2026',
    course: 'Colonial Country Club',
    // DataGolf bar pct: 31.84 → 0.0503. Floor: 2.45 (★★+).
    predictability: 0.0503,
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
