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
// RBC Canadian Open — pre-tournament / Round 1. Rankings show the
// pre-tournament snapshot (DataGolf skill estimates, no live SG yet).
// Once R1 finishes the auto-roll rebuilds rbcCanadianR1Data and swaps
// this import.
import { roundOnlyData, cumulativeData, generatedAt } from '../data/rbcCanadianPreData';
// Ticker file is rebuilt every 30 min by the ticker-refresh workflow. We use
// its timestamp to drive the header "Last Updated" label so it reflects
// actual liveness, not the (hours-old) rankings build time.
import { tickerGeneratedAt } from '../data/ticker';
// Pre-tournament rankings — used as a FROZEN snapshot for the Course Fit
// Scatter chart. The chart is meant to be a pre-tournament reference, not
// updated round-by-round. Stays pointed at the pre-tournament file even
// once the main rankings advance.
import { roundOnlyData as preTournamentRoundOnly } from '../data/rbcCanadianPreData';
import { r1MatchupOddsData } from '../data/rbcCanadianR1Matchups';
import { r1OutrightsData } from '../data/rbcCanadianR1Outrights';
import { skillEstimatesData } from '../data/rbcCanadianSkillEstimates';
import { floorForEvent, type EventId } from './venues';

export interface CurrentEvent {
  /** EventId — index into VENUES (src/config/venues.ts). Drives floor lookup
   *  so that any change to `publishedFloor` in venues.ts propagates here
   *  automatically. */
  eventId: EventId;
  /** Tournament name, e.g. "PGA Championship". */
  name: string;
  /** Venue, e.g. "Aronimink". */
  course: string;
  /** Whether this is a major championship. Drives UI elements like
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
  /** Optional manual override for the ticker title bar — set ONLY when
   *  Chris explicitly tells Claude play has been delayed/suspended.
   *  Never auto-set. Cleared when Chris says play resumed. Examples:
   *    'R3 — SUSPENDED', 'R3 RESUMING 7:30 AM', 'DELAY — WEATHER'.
   *  When null/undefined, ticker uses its normal "R{N} Tee Times /
   *  Leaderboard" title. */
  tickerTitleOverride?: string | null;
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
  /** Optional NEXT-round matchups — populated by the ticker-refresh workflow
   *  when sportsbooks post the next round's H2H lines early (e.g. R4 while
   *  R3 is still in play). Matchups + Odds pages render this section
   *  ABOVE the current round when present, both clearly labeled. */
  nextRoundMatchups?: MatchupOddsEntry[];
  /** Round number for nextRoundMatchups (e.g. 4 if currentEvent.picksRound is 3). */
  nextRoundNumber?: number;
  /** X-Score rankings (CUMULATIVE) used to compute edges for nextRoundMatchups.
   *  MUST be cumulative through the round just finished (so for R4 picks
   *  during a suspended R3, this is R1+R2+R3 SG sum for the finished
   *  players). */
  nextRoundRankings?: PlayerData[];
  /** X-Score rankings (ROUND-ONLY) for nextRoundMatchups — drives the
   *  "Round-only" half of the dual-data view on the matchups page. For R4
   *  picks this is R3 round-only SG. */
  nextRoundRankingsRound?: PlayerData[];
  /** FROZEN X-Score rankings for computing R3 BB edges. R3 picks were
   *  announced based on R2-final cumulative SG; the displayed BB count +
   *  edges must use THAT data, not the live Rankings cumulative (which
   *  evolves as R3 plays out and would otherwise inflate the BB count). */
  r3PicksRankingsCumulative?: PlayerData[];
  r3PicksRankingsRound?: PlayerData[];
}

// EventId for venues.ts lookup — drives recommendedFloor + label.
// Changing publishedFloor in venues.ts AUTOMATICALLY updates everywhere.
const EVENT_ID: EventId = 'rbc-canadian-open-2026';
const VENUE_INFO = floorForEvent(EVENT_ID);

export const currentEvent: CurrentEvent = {
  eventId: EVENT_ID,
  name: 'RBC Canadian Open',
  course: VENUE_INFO.course,
  isMajor: false,
  predictability: VENUE_INFO.predictability,
  recommendedFloor: VENUE_INFO.floor,
  recommendedFloorLabel: VENUE_INFO.label,
  picksRound: 1,
  isComplete: false,
  headerBanner: 'PRE-TOURNAMENT · PICKS BEGIN ROUND 2',
  dataUpdatedAt: new Date(generatedAt).getTime() > new Date(tickerGeneratedAt).getTime() ? generatedAt : tickerGeneratedAt,
  rankingsRound: roundOnlyData,
  rankingsCumulative: cumulativeData,
  preTournamentRankings: preTournamentRoundOnly,
  matchups: r1MatchupOddsData,
  outrights: r1OutrightsData,
  skillEstimates: skillEstimatesData,
};
