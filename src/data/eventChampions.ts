/**
 * Past champions for each tracked event. Powers the "Past Champions"
 * strip near the top of the Rankings page.
 *
 * To add a champion: drop another entry into the array for the event
 * (most recent year first). Player name must match the "Last, First"
 * format used everywhere else (so the headshot lookup works).
 *
 * If the event has no champions list, the strip won't render.
 */

export interface Champion {
  year: number;
  /** "Last, First" — must match the player_name field everywhere else. */
  playerName: string;
  /** Optional final score, e.g. "-23" or "-26 (playoff)". */
  score?: string;
}

export const championsByEvent: Record<string, Champion[]> = {
  // Byron Nelson at TPC Craig Ranch — venue debuted in 2021. Scheffler's
  // 2025 win tied the PGA Tour 72-hole scoring record.
  'cj-cup-byron-nelson-2026': [
    { year: 2025, playerName: 'Scheffler, Scottie', score: '-31 (record)' },
    { year: 2024, playerName: 'Pendrith, Taylor', score: '-23' },
    { year: 2023, playerName: 'Day, Jason', score: '-23' },
    { year: 2022, playerName: 'Lee, K.H.', score: '-26' },
    { year: 2021, playerName: 'Lee, K.H.', score: '-25' },
  ],

  'pga-2026': [
    // PGA Championship venue changes each year — past champions list rotates
    // by venue rather than event. Skip the strip for travelling-venue
    // majors unless we want to surface recent PGA Champ winners generally.
  ],

  'masters-2026': [
    { year: 2025, playerName: 'McIlroy, Rory', score: '-11 (playoff)' },
    { year: 2024, playerName: 'Scheffler, Scottie', score: '-11' },
    { year: 2023, playerName: 'Rahm, Jon', score: '-12' },
    { year: 2022, playerName: 'Scheffler, Scottie', score: '-10' },
    { year: 2021, playerName: 'Matsuyama, Hideki', score: '-10' },
  ],
};
