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
}

export type Signal =
  | 'STRONGEST BUY'
  | 'STRONG BUY'
  | 'BUY'
  | 'LEAN BUY'
  | 'HOLD'
  | 'NEUTRAL'
  | 'LEAN FADE'
  | 'FADE'
  | 'STRONG FADE'
  | 'STRONGEST FADE'
  | 'LEAN SELL'
  | 'SELL'
  | 'STRONG SELL'
  | 'STRONGEST SELL';

export type TabId = 'rankings' | 'matchups' | 'odds' | 'methodology' | 'results' | 'alerts';

export type DataSet = 'round' | 'cumulative';

export type SortField =
  | 'rank'
  | 'player_name'
  | 'position'
  | 'score_to_par'
  | 'sg_putt'
  | 'sg_app'
  | 'sg_ott'
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
