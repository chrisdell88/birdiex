/**
 * Shared bet-record summariser — used by ResultsPage AND BacktestLab so the
 * two pages cannot disagree about a record at the same edge floor.
 *
 * Stake convention matches grade-round.ts and the published Results page:
 * each bet stakes `unitsForEdge(edge) * stakeToWin1(odds)` (real stake, not
 * an approximated tier band). Pushes stake 0. Wins return +unitsForEdge,
 * losses return −stake. ROI = net units ÷ total staked × 100.
 */
import type { BetRecord } from '../types';
import { unitsForEdge, stakeToWin1, isTrackedBet } from './sizing';

export interface BetSummary {
  bets: number;
  wins: number;
  losses: number;
  pushes: number;
  /** "W-L-P" string (push omitted when 0 for compactness). */
  record: string;
  units: number;
  staked: number;
  roi: number;
}

/** Filter a bet array down to the tracked bets at this floor. */
export function trackedAt(bets: BetRecord[], floor: number): BetRecord[] {
  return bets.filter((b) => isTrackedBet(b.edge, floor));
}

/** Summarise a (pre-filtered) bet list. Identical numbers to Results page. */
export function summariseBets(bets: BetRecord[]): BetSummary {
  let wins = 0,
    losses = 0,
    pushes = 0,
    units = 0,
    staked = 0;
  for (const b of bets) {
    if (b.result === 'W') wins++;
    else if (b.result === 'L') losses++;
    else pushes++;
    units += b.units;
    if (b.result !== 'P') staked += unitsForEdge(b.edge) * stakeToWin1(b.bestOdds);
  }
  return {
    bets: bets.length,
    wins,
    losses,
    pushes,
    record: `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ''}`,
    units: +units.toFixed(2),
    staked: +staked.toFixed(2),
    roi: staked > 0 ? +((units / staked) * 100).toFixed(1) : 0,
  };
}

/** Convenience: filter to floor THEN summarise. */
export function summariseAtFloor(bets: BetRecord[], floor: number): BetSummary {
  return summariseBets(trackedAt(bets, floor));
}
