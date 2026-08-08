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
// Wyndham Championship 2026 — Sedgefield Country Club. Staged + rolled onto
// this event 2026-08-08 mid-R3 by the daily health-check run, which found
// eventSchedule.ts had gone unstaged for 7 weeks: the site had been showing
// "TOURNAMENT COMPLETE" (U.S. Open) since 2026-06-22 while Travelers, John
// Deere, Genesis Scottish Open, The Open Championship (MAJOR), 3M Open, and
// Rocket Classic all ran and were never staged/shown. Not retroactively
// staged — see docs/AUDIT_LOG.md / the 2026-08-08 health-check report.
// Rankings + edge math use R2 cumulative (the last COMPLETE round). R3 picks
// use the live round_matchups board (last_updated ~16:28 UTC 2026-08-08,
// clean two-way multi-book lines, no corruption signs) — same as every other
// mid-round auto-roll/ticker-refresh cycle. R3 grades automatically + R4
// picks build when R3 finishes.
import { roundOnlyData, cumulativeData, generatedAt } from '../data/wyndhamR2Data';
// Ticker file is rebuilt every 30 min by the ticker-refresh workflow; its
// timestamp drives the header "Last Updated" label so it reflects liveness.
import { tickerGeneratedAt } from '../data/ticker';
// Frozen pre-tournament rankings for the Course Fit scatter chart.
import { roundOnlyData as preTournamentRoundOnly } from '../data/wyndhamPreData';
import { r3MatchupOddsData } from '../data/wyndhamR3Matchups';
import { r3OutrightsData } from '../data/wyndhamR3Outrights';
import { skillEstimatesData } from '../data/wyndhamSkillEstimates';
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
const EVENT_ID: EventId = 'wyndham-championship-2026';
const VENUE_INFO = floorForEvent(EVENT_ID);

export const currentEvent: CurrentEvent = {
  eventId: EVENT_ID,
  name: 'Wyndham Championship',
  course: VENUE_INFO.course,
  isMajor: false,
  predictability: VENUE_INFO.predictability,
  recommendedFloor: VENUE_INFO.floor,
  recommendedFloorLabel: VENUE_INFO.label,
  // R2 complete, R3 in progress. picksRound=3 = R3 best bets shown (edge
  // from R2 cumulative X-scores × the live R3 matchup board). Auto-roll
  // advances to R4 and grades R3 against wyndhamR3Matchups when R3 finishes.
  picksRound: 3,
  isComplete: false,
  headerBanner: 'R2 FINAL · ROUND 3 PICKS',
  dataUpdatedAt: new Date(generatedAt).getTime() > new Date(tickerGeneratedAt).getTime() ? generatedAt : tickerGeneratedAt,
  rankingsRound: roundOnlyData,
  rankingsCumulative: cumulativeData,
  preTournamentRankings: preTournamentRoundOnly,
  matchups: r3MatchupOddsData,
  outrights: r3OutrightsData,
  skillEstimates: skillEstimatesData,
};
