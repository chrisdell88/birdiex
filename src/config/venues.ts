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

export const VENUES: Record<EventId, VenueInfo> = {
  'masters-2026': {
    eventName: 'Masters 2026',
    course: 'Augusta National',
    predictability: 0.1439,
  },
  'pga-2026': {
    eventName: 'PGA Championship 2026',
    course: 'Aronimink',
    predictability: 0.0413,
  },
  // Predictability computed 2026-05-20 from DataGolf player-decompositions
  // (mean |total_course_history_adjustment| over the 147-player field). Lower
  // than Aronimink's 0.0413, so the formula bumps the recommended floor up
  // a tier — see docs/THRESHOLD_SWEEP.md.
  'cj-cup-byron-nelson-2026': {
    eventName: 'CJ Cup Byron Nelson 2026',
    course: 'TPC Craig Ranch',
    predictability: 0.0373,
  },
  // Predictability computed 2026-05-25 from DataGolf player-decompositions
  // (mean |course_history_adjustment| over the 132-player field). At 0.0180
  // this is the lowest predictability of any venue we've modeled — the
  // formula snaps the recommended floor to 2.95 (★★★+), the tightest tier.
  'charles-schwab-challenge-2026': {
    eventName: 'Charles Schwab Challenge 2026',
    course: 'Colonial Country Club',
    predictability: 0.0180,
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
