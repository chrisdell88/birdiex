export type Purity = 'PURE BUY' | 'PURE FADE' | 'PURE' | 'CONFLICTED' | 'HOLD' | 'NEUTRAL';

export interface PlayerData {
  player_name: string;
  position: string;
  score_to_par: number;
  sg_ott: number;
  sg_app: number;
  sg_arg: number;
  sg_putt: number;
  sg_score_l1: number;
  course_history_l2: number;
  fit_adjustment: number;
  sg_category_adj: number;
  fit_plus_category_l3: number;
  major_adj_l4: number;
  x_score: number;
  signal: Signal;
  purity: Purity;
  dg_matched: boolean;
  rank: number;
  /**
   * Per-round actual score-to-par. Optional for backwards compat with
   * historical data files generated before this field existed. Populated
   * by build-event.ts from DataGolf's live-stats-rN.json files.
   *
   * Used by the simulator's Current Leaderboard mode to display the
   * actual round scores for locked rounds (instead of 0).
   */
  r1_score_to_par?: number;
  r2_score_to_par?: number;
  r3_score_to_par?: number;
  r4_score_to_par?: number;
  /** Holes completed in the LATEST round we have data for (0–18). When the
   *  tournament round is suspended mid-play, players who finished have
   *  thru=18 and players still on course have thru<18. Drives the gray
   *  treatment on the Rankings page for in-progress players (their SG
   *  numbers + X-Score reflect partial-round data). */
  thru_latest_round?: number;
  /** True when thru_latest_round === 18 (player completed the most recent
   *  round we have data for). Convenience field — same info as
   *  thru_latest_round === 18 but cleaner for table styling. */
  latest_round_complete?: boolean;
}

/**
 * Signal tier names.
 *
 * NEW 7-tier system (used by all classifiers going forward):
 *   STRONG BUY → BUY → SOFT BUY → NEUTRAL → SOFT FADE → FADE → STRONG FADE
 *
 * Thresholds (absolute, post-R1):
 *   STRONG BUY:  X Score ≥ +1.00
 *   BUY:         +0.50 to +0.99
 *   SOFT BUY:    +0.00 to +0.49
 *   NEUTRAL:     -0.50 to -0.01
 *   SOFT FADE:   -0.50 to -0.99
 *   FADE:        -1.00 to -1.49
 *   STRONG FADE: ≤ -1.50
 *
 * Legacy names (STRONGEST BUY / LEAN BUY / LEAN FADE / STRONGEST FADE /
 * HOLD / SELL family) stay in the union for backwards compatibility with
 * historical Masters / PGA Championship data files. SignalBadge maps
 * legacy → new for display.
 */
export type Signal =
  // New 7-tier names
  | 'STRONG BUY'
  | 'BUY'
  | 'SOFT BUY'
  | 'NEUTRAL'
  | 'SOFT FADE'
  | 'FADE'
  | 'STRONG FADE'
  // Legacy — historical data only; mapped to new tiers at render time
  | 'STRONGEST BUY'
  | 'LEAN BUY'
  | 'HOLD'
  | 'LEAN FADE'
  | 'STRONGEST FADE'
  | 'LEAN SELL'
  | 'SELL'
  | 'STRONG SELL'
  | 'STRONGEST SELL';

export type TabId = 'rankings' | 'matchups' | 'odds' | 'simulator' | 'methodology' | 'results' | 'alerts';

export type DataSet = 'round' | 'cumulative';

export type SortField =
  | 'rank'
  | 'player_name'
  | 'position'
  | 'score_to_par'
  // Virtual sort key for the "most recent completed round" column. The
  // RankingsTable maps this to whichever of r1/r2/r3/r4_score_to_par is
  // active at the moment (depends on picksRound + isComplete).
  | 'last_round_score'
  | 'sg_putt'
  | 'sg_app'
  | 'sg_ott'
  | 'sg_arg'
  | 'sg_score_l1'
  | 'course_history_l2'
  | 'fit_plus_category_l3'
  | 'major_adj_l4'
  | 'x_score'
  | 'signal'
  | 'outright_odds';

export type SortDirection = 'asc' | 'desc';

export type BucketType = 'BUY vs FADE' | 'BUY vs OTHER' | 'FADE vs OTHER' | 'OTHER vs OTHER';

export interface MatchupOddsEntry {
  p1_player_name: string;
  p2_player_name: string;
  odds: Record<string, { p1: string; p2: string }>;
}

export interface Matchup {
  pick: PlayerData;
  opponent: PlayerData;
  matchupScore: number;
  tier: 'BEST BET' | 'STRONG PLAY' | 'LEAN';
  bucket: BucketType;
  bestOdds: string;
  bestBook: string;
  dgOdds: string;
  isDoubleSignal: boolean;
}

// Results page types
export type TierType = 'BEST BET' | 'STRONG PLAY' | 'LEAN';
export type BetResult = 'W' | 'L' | 'P';
export type BetType = 'H2H' | '3-Ball';
export type ResultsDataSet = 'round-only' | 'cumulative';

export type Sportsbook =
  | 'Best Odds (Overall)'
  | 'DraftKings'
  | 'FanDuel'
  | 'BetMGM'
  | 'Caesars'
  | 'bet365'
  | 'BetOnline'
  | 'Bovada'
  | 'PointsBet'
  | 'Unibet'
  | 'Betcris'
  | 'Pinnacle';

export interface BetRecord {
  id: number;
  round: number;
  pick: string;
  opponent: string;
  edge: number;
  tier: TierType;
  bucket: BucketType;
  bestOdds: string;
  book: string;
  betType: BetType;
  pickScore: number | null;
  oppScore: number | null;
  result: BetResult;
  units: number;
  dataSet: ResultsDataSet;
}

export interface TierBreakdown {
  tier: TierType;
  wins: number;
  losses: number;
  pushes: number;
  units: number;
  roi: number;
}

export interface BucketBreakdown {
  bucket: BucketType;
  wins: number;
  losses: number;
  pushes: number;
  units: number;
  roi: number;
}

export type ResultsSortField =
  | 'id'
  | 'round'
  | 'pick'
  | 'opponent'
  | 'edge'
  | 'tier'
  | 'bucket'
  | 'bestOdds'
  | 'book'
  | 'pickScore'
  | 'oppScore'
  | 'result'
  | 'units';

export interface OutrightEntry {
  player_name: string;
  dg_id: number;
  /** Best American odds across real sportsbooks (e.g., "+150", "-120"). */
  bestOdds: string;
  /** Book that posted the best odds. */
  bestBook: string;
  /** DataGolf model odds (baseline_history_fit) for reference. Nullable. */
  dgOdds: string | null;
  /** All real-book odds keyed by book name. */
  allBooks: Record<string, string>;
}

/**
 * DataGolf skill estimate + projected probabilities per player. Used as the
 * baseline input to the BirdieX Monte Carlo tournament simulator (combined
 * with our X Score adjustment).
 *
 * dg_skill_estimate is in strokes-gained per round vs. field average — top
 * players ~+2.8, fringe-of-cut ~-0.5.
 */
export interface PlayerSkillEstimate {
  dg_id: number;
  player_name: string;
  dg_skill_estimate: number;
  /** DataGolf's projected probabilities (0–1). Reference / comparison only. */
  dg_win_prob: number | null;
  dg_top5_prob: number | null;
  dg_top10_prob: number | null;
  dg_top20_prob: number | null;
  dg_make_cut_prob: number | null;
  dg_baseline_history_fit_odds: string | null;
  dg_baseline_history_fit_prob: number | null;
}
