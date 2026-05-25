import type { MatchupOddsEntry } from '../types';

// Placeholder for Charles Schwab Challenge R1 matchups. DataGolf typically
// posts H2H round-1 matchup odds 24-48 hours before the tournament starts.
// The auto-roll workflow will replace this file with real data once available.
// Empty array keeps the build green and the Matchups page renders its
// pre-tournament placeholder (picksRound <= 1) until matchups land.
export const r1MatchupOddsData: MatchupOddsEntry[] = [];
