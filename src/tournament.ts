/**
 * Single source of truth for which tournament + phase the app is currently showing.
 *
 * When a new round wraps and we pull new data, update `phase` here so all
 * components show the right state.
 *
 * Phases:
 *   'pre'   — pre-tournament. No live SG data, no matchup odds yet. Rankings only.
 *   'r1'    — R1 in progress or just wrapped. Matchups + odds populated for R2 picks.
 *   'r2'    — R2 wrapped. R3 matchups + odds populated.
 *   'r3'    — R3 wrapped. R4 matchups + odds populated.
 *   'r4'    — R4 in progress.
 *   'final' — Tournament over. Final results posted.
 */
export type TournamentPhase = 'pre' | 'r1' | 'r2' | 'r3' | 'r4' | 'final';

export interface TournamentMeta {
  slug: string;
  display_name: string;
  course: string;
  date_start: string;
  date_end: string;
  phase: TournamentPhase;
  /** When matchups + odds will become available (human-readable). */
  next_picks_at?: string;
}

export const CURRENT_TOURNAMENT: TournamentMeta = {
  slug: 'pga-championship-2026',
  display_name: 'PGA Championship 2026',
  course: 'Aronimink Golf Club',
  date_start: '2026-05-14',
  date_end: '2026-05-17',
  phase: 'pre',
  next_picks_at: 'Thursday May 14 evening (after R1 wraps)',
};

/** Used by the Header badge — short label per phase. */
export function phaseLabel(phase: TournamentPhase): string {
  switch (phase) {
    case 'pre':
      return 'R1 THU MAY 14';
    case 'r1':
      return 'R1 COMPLETE';
    case 'r2':
      return 'R2 COMPLETE';
    case 'r3':
      return 'R3 COMPLETE';
    case 'r4':
      return 'R4 IN PROGRESS';
    case 'final':
      return 'FINAL';
  }
}
