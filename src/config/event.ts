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
import { roundOnlyData, cumulativeData, generatedAt } from '../data/pgaChampR3Data';
import { r4MatchupOddsData } from '../data/pgaChampR4Matchups';
import { recommendedFloorForPredictability, floorTierLabel } from '../lib/sizing';

export interface CurrentEvent {
  /** Tournament name, e.g. "PGA Championship". */
  name: string;
  /** Venue, e.g. "Aronimink". */
  course: string;
  /** Venue predictability (0–~0.15). Drives the recommended-floor formula. */
  predictability: number;
  /** Edge floor at which we publicly recommend bets (predictability-aware). */
  recommendedFloor: number;
  /** Star tier label for the recommended floor — e.g. "★★+" for floor 2.45. */
  recommendedFloorLabel: string;
  /** The round these picks are FOR (e.g. 3 = round-3 picks). */
  picksRound: number;
  /** Header badge status text, e.g. "R2 FINAL · ROUND 3 PICKS". */
  headerBanner: string;
  /** ISO timestamp of the latest data pull — drives the "Last Updated" line. */
  dataUpdatedAt: string;
  /** Round-only rankings data (latest completed round). */
  rankingsRound: PlayerData[];
  /** Cumulative rankings data (all rounds played). */
  rankingsCumulative: PlayerData[];
  /** H2H matchup odds for the upcoming round. */
  matchups: MatchupOddsEntry[];
}

const ARONIMINK_PREDICTABILITY = 0.0413;

export const currentEvent: CurrentEvent = {
  name: 'PGA Championship',
  course: 'Aronimink',
  predictability: ARONIMINK_PREDICTABILITY,
  recommendedFloor: recommendedFloorForPredictability(ARONIMINK_PREDICTABILITY),
  recommendedFloorLabel: floorTierLabel(recommendedFloorForPredictability(ARONIMINK_PREDICTABILITY)),
  picksRound: 4,
  headerBanner: 'R3 FINAL · ROUND 4 PICKS',
  dataUpdatedAt: generatedAt,
  rankingsRound: roundOnlyData,
  rankingsCumulative: cumulativeData,
  matchups: r4MatchupOddsData,
};
