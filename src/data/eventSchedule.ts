/**
 * Forward-looking PGA Tour event schedule for BirdieX.
 *
 * auto-roll.ts reads this when the current event hits isComplete=true. If
 * the next event in this list has a `startsAt` in the past or near future
 * (within 4 days), auto-roll switches event.ts to it automatically.
 *
 * To add an event: bump the next entry's slug + course + startsAt. Course
 * must already exist in scripts/lib/courses.ts (and venues.ts) with valid
 * coefficients — auto-switch will FAIL if it doesn't, on purpose, because
 * we never want to ship with placeholder coefficients.
 *
 * The `dataPrefix` is the camelCase prefix used for the event's data files
 * (e.g. "memorial" → memorialPreData / memorialR1Data / memorialR1Matchups).
 * Auto-roll uses this for the SLUG_PREFIX in subsequent script calls.
 */

export interface ScheduledEvent {
  /** DataGolf event slug — used for pull-event --slug. */
  slug: string;
  /** Display name. */
  name: string;
  /** Internal courses.ts key. Must exist BEFORE the event runs. */
  courseKey: string;
  /** Courses.ts venue display name (for sanity logging). */
  courseName: string;
  /** Internal venues.ts EventId — must be added to the union there. */
  eventId: string;
  /** SLUG_PREFIX for data file naming (camelCase, no spaces). */
  dataPrefix: string;
  /** ISO date of R1 start. Auto-switch fires when current event is complete
   *  AND today is within 4 days before/after this. */
  startsAt: string;
  /** Whether this is a major championship — drives Layer-4 weighting. */
  isMajor: boolean;
}

export const EVENT_SCHEDULE: ScheduledEvent[] = [
  {
    slug: 'the-memorial-tournament-2026',
    name: 'The Memorial Tournament',
    courseKey: 'muirfield-village',
    courseName: 'Muirfield Village Golf Club',
    eventId: 'the-memorial-tournament-2026',
    dataPrefix: 'memorial',
    startsAt: '2026-06-04T00:00Z',
    isMajor: false,
  },
  {
    slug: 'rbc-canadian-open-2026',
    name: 'RBC Canadian Open',
    // Corrected 2026-06-11: staged as Hamilton G&CC but DataGolf
    // field-updates (event_id 32) says the actual 2026 venue is TPC Toronto
    // at Osprey Valley (North Course).
    courseKey: 'tpc-toronto-osprey-north',
    courseName: 'TPC Toronto at Osprey Valley (North Course)',
    eventId: 'rbc-canadian-open-2026',
    dataPrefix: 'rbcCanadian',
    startsAt: '2026-06-11T00:00Z',
    isMajor: false,
  },
  {
    // U.S. Open 2026 — Shinnecock Hills. Venue verified against DataGolf
    // field-updates (event_name "U.S. Open", course_name "Shinnecock Hills
    // Golf Club") 2026-06-19. MAJOR. Course-Fit coefficients read from the
    // DataGolf radar same day (see courses.ts shinnecock-hills).
    slug: 'us-open-2026',
    name: 'U.S. Open',
    courseKey: 'shinnecock-hills',
    courseName: 'Shinnecock Hills Golf Club',
    eventId: 'us-open-2026',
    dataPrefix: 'usOpen',
    startsAt: '2026-06-18T00:00Z',
    isMajor: true,
  },
];

/** Find the next event AFTER the current slug, or null if at the end. */
export function nextEvent(currentSlug: string): ScheduledEvent | null {
  const idx = EVENT_SCHEDULE.findIndex((e) => e.slug === currentSlug);
  if (idx < 0 || idx === EVENT_SCHEDULE.length - 1) return null;
  return EVENT_SCHEDULE[idx + 1];
}
