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
// U.S. Open 2026 — Shinnecock Hills. Rolled onto this event 2026-06-19 (mid-R2).
// Rankings + edge math use R1 cumulative (the last COMPLETE round). R2 picks
// ARE published (per Chris): the R2 matchup feed carried clean two-way lines
// (R2-morning prices, last_updated 12:32 UTC), so usOpenR2Matchups holds the
// real R2 board. R2 grades automatically when the round finishes tonight.
import { roundOnlyData, cumulativeData, generatedAt } from '../data/usOpenR3Data';
// Ticker file is rebuilt every 30 min by the ticker-refresh workflow; its
// timestamp drives the header "Last Updated" label so it reflects liveness.
import { tickerGeneratedAt } from '../data/ticker';
// Frozen pre-tournament rankings for the Course Fit scatter chart.
import { roundOnlyData as preTournamentRoundOnly } from '../data/usOpenPreData';
import { r4MatchupOddsData } from '../data/usOpenR4Matchups';
import { r4OutrightsData } from '../data/usOpenR4Outrights';
import { skillEstimatesData } from '../data/usOpenSkillEstimates';
import { floorForEvent, type EventId } from './venues';

export interface CurrentEvent {
  eventId: EventId;
  name: string;
  course: string;
  isMajor: boolean;
  predictability: number;
  recommendedFloor: number;
  recommendedFloorLabel: string;
  picksRound: number;
  isComplete: boolean;
  headerBanner: string;
  tickerTitleOverride?: string | null;
  dataUpdatedAt: string;
  rankingsRound: PlayerData[];
  rankingsCumulative: PlayerData[];
  preTournamentRankings: PlayerData[];
  matchups: MatchupOddsEntry[];
  outrights: OutrightEntry[];
  skillEstimates: PlayerSkillEstimate[];
  nextRoundMatchups?: MatchupOddsEntry[];
  nextRoundNumber?: number;
  nextRoundRankings?: PlayerData[];
  nextRoundRankingsRound?: PlayerData[];
  r3PicksRankingsCumulative?: PlayerData[];
  r3PicksRankingsRound?: PlayerData[];
}

// EventId for venues.ts lookup — drives recommendedFloor + label.
const EVENT_ID: EventId = 'us-open-2026';
const VENUE_INFO = floorForEvent(EVENT_ID);

export const currentEvent: CurrentEvent = {
  eventId: EVENT_ID,
  name: 'U.S. Open',
  course: VENUE_INFO.course,
  isMajor: true,
  predictability: VENUE_INFO.predictability,
  recommendedFloor: VENUE_INFO.floor,
  recommendedFloorLabel: VENUE_INFO.label,
  // R1 complete, R2 in progress. picksRound=2 = R2 best bets shown (edge from
  // R1 cumulative X-scores × the clean R2 matchup board). Auto-roll advances
  // to R3 and grades R2 against usOpenR2Matchups when R2 finishes tonight.
  picksRound: 4,
  isComplete: true,
  headerBanner: 'TOURNAMENT COMPLETE',
  dataUpdatedAt: new Date(generatedAt).getTime() > new Date(tickerGeneratedAt).getTime() ? generatedAt : tickerGeneratedAt,
  rankingsRound: roundOnlyData,
  rankingsCumulative: cumulativeData,
  preTournamentRankings: preTournamentRoundOnly,
  matchups: r4MatchupOddsData,
  outrights: r4OutrightsData,
  skillEstimates: skillEstimatesData,
};
