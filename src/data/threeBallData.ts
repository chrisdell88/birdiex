export interface ThreeBallOddsEntry {
  p1_player_name: string;
  p2_player_name: string;
  p3_player_name: string;
  odds: Record<string, { p1: string; p2: string; p3: string }>;
}

// No 3-ball odds available for R4
export const threeBallOddsData: ThreeBallOddsEntry[] = [];
