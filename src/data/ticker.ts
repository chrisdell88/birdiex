// Placeholder for the Memorial Tournament. The ticker-refresh workflow
// rebuilds this with R2 tee times + live scores on its next cron run.

export interface TickerEntry {
  player: string;
  teeTime: string;
  startHole: number;
  score: number | null;
  pos: string;
  thru: number | null;
}

export const tickerRound = 2;
export const tickerData: TickerEntry[] = [];
