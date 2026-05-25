/**
 * DataGolf course-history predictability — full PGA Tour reference table.
 *
 * Source: https://datagolf.com/course-history-tool — the "Where is course
 * history most predictive?" bar chart. Values pulled 2026-05-25 by reading
 * the rendered bar heights directly from the chart DOM via JavaScript.
 *
 * Each `dgBarPct` value is the EXACT height percentage DataGolf is using
 * to draw the bar on their chart. Higher = course history is a stronger
 * signal for predicting performance at that venue.
 *
 * To convert to the predictability value our floor formula expects
 * (calibrated so Augusta = 0.1439), multiply by 0.001580.
 *
 * Refresh: re-run the extraction script (scripts/refresh-dg-predictability.ts,
 * to be written) whenever DataGolf updates their model, typically once a
 * season. Or just re-pull manually from the URL above.
 */

export interface DGCourseEntry {
  /** Full course name as shown on DataGolf. */
  name: string;
  /** DataGolf bar height percentage (0–100). Exact value from chart. */
  dgBarPct: number;
}

/**
 * All 64 PGA Tour venues, sorted by predictability (highest first).
 * Augusta is the most predictive; the major-championship rotating venues
 * at the bottom (Open / PGA / US Open Courses) show 0 because their host
 * site changes year-to-year so there's no single-course history to lean on.
 */
export const DG_PREDICTABILITY: DGCourseEntry[] = [
  { name: 'Augusta National Golf Club', dgBarPct: 91.11 },
  { name: 'The Riviera Country Club', dgBarPct: 60.44 },
  { name: 'Bay Hill Club & Lodge', dgBarPct: 52.92 },
  { name: 'TPC San Antonio (Oaks Course)', dgBarPct: 52.64 },
  { name: 'Quail Hollow Club', dgBarPct: 49.70 },
  { name: 'TPC Scottsdale (Stadium Course)', dgBarPct: 46.50 },
  { name: 'TPC Summerlin', dgBarPct: 45.43 },
  { name: 'Waialae Country Club', dgBarPct: 44.67 },
  { name: 'East Lake Golf Club', dgBarPct: 43.08 },
  { name: 'Muirfield Village Golf Club', dgBarPct: 39.32 },
  { name: 'Silverado Resort (North Course)', dgBarPct: 38.35 },
  { name: 'Sedgefield Country Club', dgBarPct: 34.82 },
  { name: 'TPC River Highlands', dgBarPct: 34.76 },
  { name: 'Harbour Town Golf Links', dgBarPct: 33.58 },
  { name: 'Torrey Pines (South Course)', dgBarPct: 32.11 },
  { name: 'Plantation Course at Kapalua', dgBarPct: 32.07 },
  { name: 'Colonial Country Club', dgBarPct: 31.84 },
  { name: 'Sea Island Golf Club (Seaside Course)', dgBarPct: 30.58 },
  { name: 'TPC Southwind', dgBarPct: 29.57 },
  { name: 'The Country Club of Jackson', dgBarPct: 29.07 },
  { name: 'Albany GC', dgBarPct: 28.38 },
  { name: 'Grand Reserve Golf Club', dgBarPct: 25.80 },
  { name: 'TPC Twin Cities', dgBarPct: 25.77 },
  { name: 'PGA National Resort (The Champion Course)', dgBarPct: 25.75 },
  { name: 'Pebble Beach Golf Links', dgBarPct: 25.16 },
  { name: 'Corales Golf Club', dgBarPct: 23.75 },
  { name: 'Port Royal Golf Course', dgBarPct: 23.35 },
  { name: 'Tahoe Mountain Club (Old Greenwood)', dgBarPct: 23.32 },
  { name: 'Detroit Golf Club', dgBarPct: 22.59 },
  { name: 'TPC Craig Ranch', dgBarPct: 22.14 },
  { name: 'Innisbrook Resort (Copperhead Course)', dgBarPct: 21.57 },
  { name: 'Memorial Park Golf Course', dgBarPct: 21.32 },
  { name: 'TPC Sawgrass', dgBarPct: 21.26 },
  { name: 'ACCORDIA GOLF Narashino Country Club', dgBarPct: 19.84 },
  { name: 'TPC Deere Run', dgBarPct: 18.64 },
  { name: 'Pete Dye Stadium Course', dgBarPct: 18.21 },
  { name: 'The Renaissance Club', dgBarPct: 18.16 },
  { name: 'Vidanta Vallarta', dgBarPct: 17.54 },
  { name: 'Torrey Pines (North Course)', dgBarPct: 15.80 },
  { name: 'Spyglass Hill Golf Course', dgBarPct: 15.42 },
  { name: 'Keene Trace Golf Club (Champion Trace)', dgBarPct: 15.27 },
  { name: 'La Quinta Country Club', dgBarPct: 15.19 },
  { name: 'El Cardonal at Diamante', dgBarPct: 14.54 },
  { name: 'Dunes Golf and Beach Club', dgBarPct: 13.08 },
  { name: 'Nicklaus Tournament Course', dgBarPct: 12.88 },
  { name: 'Sea Island Golf Club (Plantation Course)', dgBarPct: 12.48 },
  { name: 'Trump National Doral (2014 onwards)', dgBarPct: 10.64 },
  { name: 'Caves Valley Golf Club', dgBarPct: 9.86 },
  { name: 'Black Desert Resort', dgBarPct: 9.21 },
  { name: 'Aronimink GC', dgBarPct: 9.08 },
  { name: 'Hamilton Golf & Country Club', dgBarPct: 8.97 },
  { name: 'Sawgrass Country Club', dgBarPct: 7.95 },
  { name: "Dye's Valley Course", dgBarPct: 7.90 },
  { name: 'Bellerive CC', dgBarPct: 6.06 },
  { name: 'Hurstbourne Country Club', dgBarPct: 6.06 },
  { name: 'Medinah Country Club (No. 3)', dgBarPct: 6.06 },
  { name: 'Royal Birkdale GC', dgBarPct: 6.06 },
  { name: 'Shinnecock Hills GC', dgBarPct: 6.06 },
  { name: 'TPC Toronto at Osprey Valley (North Course)', dgBarPct: 6.06 },
  { name: 'The Philadelphia Cricket Club', dgBarPct: 6.06 },
  { name: 'Yokohama Country Club', dgBarPct: 6.06 },
  { name: 'Open Championship Courses', dgBarPct: 0.00 },
  { name: 'PGA Championship Courses', dgBarPct: 0.00 },
  { name: 'U.S. Open Courses', dgBarPct: 0.00 },
];

/**
 * Linear scaling factor: maps DataGolf bar % → our internal predictability
 * value. Calibrated so Augusta (91.11%) → 0.1439 (the existing codebase
 * value, which produces Masters floor 0.95 — preserving the published record).
 *
 * Usage:
 *   import { DG_PREDICTABILITY, DG_TO_PREDICTABILITY_FACTOR } from '.../dataGolfPredictability';
 *   const entry = DG_PREDICTABILITY.find((c) => c.name === 'Colonial Country Club');
 *   const predictability = entry!.dgBarPct * DG_TO_PREDICTABILITY_FACTOR;
 *
 * Anchor choice: Augusta is the most extreme value on the chart (highest bar)
 * and already has published model results based on its existing 0.1439. Other
 * venues' floors shift slightly when applied, which is the intended correction.
 */
export const DG_TO_PREDICTABILITY_FACTOR = 0.1439 / 91.11;

/** Convenience: look up a course by exact name. Returns null if not found. */
export function findDGCourse(name: string): DGCourseEntry | null {
  return DG_PREDICTABILITY.find((c) => c.name === name) ?? null;
}
