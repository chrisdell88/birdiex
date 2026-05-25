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
    // DataGolf bar pct: 9.08 → 0.0143. Floor shifts to 2.95 (★★★+) — Aronimink
    // is one of the lowest-predictability PGA Tour venues. Public PGA Championship
    // record now filters at the tighter 2.95 threshold.
    predictability: 0.0143,
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
  const floor = recommendedFloorForPredictability(v.predictability);
  return {
    eventName: v.eventName,
    course: v.course,
    predictability: v.predictability,
    floor,
    label: floorTierLabel(floor),
  };
}
