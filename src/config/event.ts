/**
 * Current event configuration — the single source of truth for which
 * tournament/round the app is showing.
 *
 * To advance to a new round: run the data scripts (pull-event / build-event /
 * build-matchups / grade-round), then update ONLY this file — the data
 * imports, `picksRound`, `headerBanner`, and `lastUpdated`. No component
 * edits needed.
 */
import type { PlayerData, MatchupOddsEntry } from '../types';
import { roundOnlyData, cumulativeData } from '../data/pgaChampR3Data';
import { r4MatchupOddsData } from '../data/pgaChampR4Matchups';

export interface CurrentEvent {
  /** Tournament name, e.g. "PGA Championship". */
  name: string;
  /** Venue, e.g. "Aronimink". */
  course: string;
  /** The round these picks are FOR (e.g. 3 = round-3 picks). */
  picksRound: number;
  /** Header badge status text, e.g. "R2 FINAL · ROUND 3 PICKS". */
  headerBanner: string;
  /** Rankings "Last Updated" line, e.g. "PGA Championship — R2 (Final)". */
  lastUpdated: string;
  /** Round-only rankings data (latest completed round). */
  rankingsRound: PlayerData[];
  /** Cumulative rankings data (all rounds played). */
  rankingsCumulative: PlayerData[];
  /** H2H matchup odds for the upcoming round. */
  matchups: MatchupOddsEntry[];
}

export const currentEvent: CurrentEvent = {
  name: 'PGA Championship',
  course: 'Aronimink',
  picksRound: 4,
  headerBanner: 'R3 FINAL · ROUND 4 PICKS',
  lastUpdated: 'PGA Championship — R3 (Final)',
  rankingsRound: roundOnlyData,
  rankingsCumulative: cumulativeData,
  matchups: r4MatchupOddsData,
};
