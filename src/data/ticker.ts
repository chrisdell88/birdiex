// Generated placeholder for Charles Schwab Challenge pre-tournament.
// The ticker-refresh workflow will populate this with R1 tee times once
// DataGolf has them. Empty array means Ticker.tsx returns null (hides).

export interface TickerEntry {
  player: string;
  teeTime: string;
  startHole: number;
  score: number | null;
  pos: string;
  thru: number | null;
}

export const tickerRound = 1;
export const tickerData: TickerEntry[] = [];
