/**
 * Current event configuration — the single source of truth for which
 * tournament/round the app is showing.
 *
 * To advance to a new round: run the data scripts (pull-event / build-event /
 * build-matchups / grade-round), then update ONLY this file — the data
 * imports, `picksRound`, `headerBanner`, and `lastUpdated`. No component
 * edits needed.
 */
import type { PlayerData, MatchupOddsEntry, OutrightEntry, PlayerSkillEstimate } from '../types';
// The Memorial Tournament — R1 complete, R2 picks active.
import { roundOnlyData, cumulativeData, generatedAt } from '../data/memorialR1Data';
// Ticker file is rebuilt every 30 min by the ticker-refresh workflow. We use
// its timestamp to drive the header "Last Updated" label so it reflects
// actual liveness, not the (hours-old) rankings build time.
import { tickerGeneratedAt } from '../data/ticker';
// Pre-tournament rankings — used as a FROZEN snapshot for the Course Fit
// Scatter chart. The chart is meant to be a pre-tournament reference, not
// updated round-by-round. Stays pointed at the pre-tournament file even
// once the main rankings advance.
import { roundOnlyData as preTournamentRoundOnly } from '../data/memorialPreData';
import { r2MatchupOddsData } from '../data/memorialR2Matchups';
import { r2OutrightsData } from '../data/memorialR2Outrights';
import { skillEstimatesData } from '../data/memorialSkillEstimates';
import { recommendedFloorForPredictability, floorTierLabel } from '../lib/sizing';

export interface CurrentEvent {
  /** Tournament name, e.g. "PGA Championship". */
  name: string;
  /** Venue, e.g. "Aronimink". */
  course: string;
  /** Whether this event is a major championship. Drives UI elements like
   *  the "Major" column on the Rankings table and the Layer-4 weighting. */
  isMajor: boolean;
  /** Venue predictability (0–~0.15). Drives the recommended-floor formula. */
  predictability: number;
  /** Edge floor at which we publicly recommend bets (predictability-aware). */
  recommendedFloor: number;
  /** Star tier label for the recommended floor — e.g. "★★+" for floor 2.45. */
  recommendedFloorLabel: string;
  /** The round these picks are FOR (e.g. 3 = round-3 picks). */
  picksRound: number;
  /** True once the final round (R4) has finished. When true:
   *    - Header shows "COMPLETE" status, not "R3 FINAL · ROUND 4 PICKS"
   *    - Rankings hides Signal column + BUYS/SELLS counters (no more picks)
   *    - Matchups + Odds pages show a "Tournament complete" placeholder
   *    - Ticker hides itself
   *    - Auto-roll + ticker workflows skip (nothing to refresh)
   *  Stays true until the NEXT event config replaces this one. */
  isComplete: boolean;
  /** Header badge status text, e.g. "R2 FINAL · ROUND 3 PICKS". */
  headerBanner: string;
  /** ISO timestamp of the latest data pull — drives the "Last Updated" line. */
  dataUpdatedAt: string;
  /** Round-only rankings data (latest completed round). */
  rankingsRound: PlayerData[];
  /** Cumulative rankings data (all rounds played). */
  rankingsCumulative: PlayerData[];
  /** Frozen pre-tournament rankings — used by the Course Fit Scatter so
   *  that chart doesn't change round-to-round. */
  preTournamentRankings: PlayerData[];
  /** H2H matchup odds for the upcoming round. */
  matchups: MatchupOddsEntry[];
  /** Outright winner odds across real sportsbooks. */
  outrights: OutrightEntry[];
  /** DataGolf skill estimates + projected probs (input to the simulator). */
  skillEstimates: PlayerSkillEstimate[];
}

// DataGolf bar pct: 39.32 → 0.0621 (anchored against Augusta = 0.1439 = 91.11%).
// Source of truth: src/data/dataGolfPredictability.ts.
const MUIRFIELD_VILLAGE_PREDICTABILITY = 0.0621;

export const currentEvent: CurrentEvent = {
  name: 'The Memorial Tournament',
  course: 'Muirfield Village Golf Club',
  isMajor: false,
  predictability: MUIRFIELD_VILLAGE_PREDICTABILITY,
  recommendedFloor: recommendedFloorForPredictability(MUIRFIELD_VILLAGE_PREDICTABILITY),
  recommendedFloorLabel: floorTierLabel(recommendedFloorForPredictability(MUIRFIELD_VILLAGE_PREDICTABILITY)),
  picksRound: 2,
  isComplete: false,
  headerBanner: 'R1 FINAL · ROUND 2 PICKS',
  // Take the most-recent timestamp across rankings build + ticker pull so the
  // header "Last Updated" always tracks the freshest data source.
  dataUpdatedAt: new Date(generatedAt).getTime() > new Date(tickerGeneratedAt).getTime() ? generatedAt : tickerGeneratedAt,
  rankingsRound: roundOnlyData,
  rankingsCumulative: cumulativeData,
  preTournamentRankings: preTournamentRoundOnly,
  matchups: r2MatchupOddsData,
  outrights: r2OutrightsData,
  skillEstimates: skillEstimatesData,
};
