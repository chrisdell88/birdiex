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

export type EventId = 'masters-2026' | 'pga-2026' | 'cj-cup-byron-nelson-2026';

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
  // Filled in when we pull predictability from DataGolf decompositions for
  // TPC Craig Ranch. Placeholder uses a conservative low-pred default so
  // we'd recommend at the ★★+ floor until we have real data.
  'cj-cup-byron-nelson-2026': {
    eventName: 'CJ Cup Byron Nelson 2026',
    course: 'TPC Craig Ranch',
    predictability: 0.05,
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
