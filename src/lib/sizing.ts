/**
 * Edge-banded bet sizing.
 *
 * Every bet is sized to WIN a number of units determined by its X Score edge,
 * in 0.5-wide bands starting at the 0.95 pick floor:
 *   edge [0.95, 1.45)  -> 0.5u
 *   edge [1.45, 1.95)  -> 1.0u
 *   edge [1.95, 2.45)  -> 1.5u
 *   edge [2.45, 2.95)  -> 2.0u
 *   edge [2.95, 3.45)  -> 2.5u
 *   edge [3.45,  inf)  -> 3.0u   (top band — caps at 3u)
 *   edge < 0.95        -> not a bet (0u)
 *
 * To re-tune: edit unitsForEdge() here, then re-run
 *   npx tsx scripts/recompute-results.ts   (rebuilds Masters + PGA R2)
 * and re-grade any later rounds with scripts/grade-round.ts.
 *
 * American odds -> stake required to win 1 unit:
 *   negative odds  -N  =>  N / 100   (e.g. -140 => 1.40)
 *   positive odds  +N  =>  100 / N   (e.g. +120 => 0.833)
 */
import type { BetResult } from '../types';

/**
 * Units this bet is sized to WIN, from its edge. 0 below the 0.95 floor.
 * Works in integer ten-thousandths so band boundaries are exact (no float drift).
 */
export function unitsForEdge(edge: number): number {
  const e = Math.round(edge * 10000);
  if (e < 9500) return 0; // below 0.95 — not a bet
  const band = Math.floor((e - 9500) / 5000); // 0,1,2,3,4,5,...
  return Math.min(3, 0.5 + 0.5 * band); // top band caps at 3u
}

/**
 * Stake required to win 1 unit at these American odds.
 * "-140" => 1.40  |  "+120" => 0.8333...
 */
export function stakeToWin1(odds: string): number {
  const n = parseInt(odds, 10);
  return n < 0 ? Math.abs(n) / 100 : 100 / n;
}

/**
 * Net units for a single bet.
 *   W => +unitsForEdge(edge)
 *   L => -(unitsForEdge(edge) * stakeToWin1(odds))
 *   P => 0
 * Rounded to 2 decimal places.
 */
export function betUnits(result: BetResult, bestOdds: string, edge: number): number {
  const m = unitsForEdge(edge);
  if (result === 'W') return Math.round(m * 100) / 100;
  if (result === 'L') return Math.round(-m * stakeToWin1(bestOdds) * 100) / 100;
  return 0; // push
}

/**
 * Stake placed on a single bet (0 for pushes). Rounded to 2 decimal places.
 */
export function betStake(result: BetResult, bestOdds: string, edge: number): number {
  if (result === 'P') return 0;
  return Math.round(unitsForEdge(edge) * stakeToWin1(bestOdds) * 100) / 100;
}
