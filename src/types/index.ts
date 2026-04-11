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
  dg_matched: boolean;
  rank: number;
}

export type Signal =
  | 'STRONGEST BUY'
  | 'STRONG BUY'
  | 'BUY'
  | 'HOLD'
  | 'FADE'
  | 'STRONG FADE'
  | 'STRONGEST FADE';

export type TabId = 'rankings' | 'matchups' | 'methodology';

export type SortField =
  | 'rank'
  | 'player_name'
  | 'position'
  | 'score_to_par'
  | 'sg_score_l1'
  | 'course_history_l2'
  | 'fit_plus_category_l3'
  | 'major_adj_l4'
  | 'x_score'
  | 'signal';

export type SortDirection = 'asc' | 'desc';

export interface Matchup {
  player1: PlayerData;
  player2: PlayerData;
  edge: number;
  tier: 'BEST BET' | 'STRONG PLAY' | 'LEAN';
}
