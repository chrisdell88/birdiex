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
// Wyndham Championship 2026 — Sedgefield Country Club. COMPLETE as of
// 2026-08-10 (Michael Brennan won at -22, verified via DataGolf in-play:
// current_pos "1", round 4, thru 18, win 1.0). Flipped to complete by the
// daily health-check run after finding auto-roll's stale-feed guard had
// false-positived on the R3->R4 transition for ~34 hours (any in-play row
// with round > currentCompleted+1 was treated as a leftover previous-event
// feed, even when it was genuinely OUR OWN event running ahead of a config
// that hadn't caught up) — fixed in scripts/auto-roll.ts to check the feed's
// own `info.event_name` instead of relying on round-jump size alone.
// R3 was graded against the actual announcement snapshot (git commit
// 448ebea, the 2026-08-08 mid-round roll) — 19 Best Bets, 10-8-1, +5.43u.
// R4 was NEVER shown to users (event.ts stayed on picksRound=3, banner
// "R2 FINAL - ROUND 3 PICKS", for the entire R4 window) — so there is no
// legitimate "announced" R4 pick set to grade. No wyndhamR4Results.ts was
// created; flagged for Chris, same policy as the still-open RBC Canadian R4
// gap. Rankings below use wyndhamR4Data (the real final standings, built
// straight from DataGolf's final live-stats — factual, not a picks/grading
// artifact) rather than settling for R3, since clean full R4 data was
// available.
import { roundOnlyData, cumulativeData, generatedAt } from '../data/wyndhamR4Data';
// Ticker file is rebuilt every 30 min by the ticker-refresh workflow; its
// timestamp drives the header "Last Updated" label so it reflects liveness.
import { tickerGeneratedAt } from '../data/ticker';
// Frozen pre-tournament rankings for the Course Fit scatter chart.
import { roundOnlyData as preTournamentRoundOnly } from '../data/wyndhamPreData';
import { r4MatchupOddsData } from '../data/wyndhamR4Matchups';
import { r4OutrightsData } from '../data/wyndhamR4Outrights';
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
  // Tournament complete. picksRound=4 reflects the final round played;
  // matchups/outrights below are R4 reference data only (no R4 picks were
  // ever published — see the import comment above). isComplete=true hides
  // the picks UI and shows the "TOURNAMENT COMPLETE" state.
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
