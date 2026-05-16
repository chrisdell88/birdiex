/**
 * Tier-based bet sizing — "Scheme D"
 *
 * Every bet is sized to WIN a fixed number of units determined by its tier.
 * To re-tune the scheme, change TIER_UNITS here and re-run:
 *   npx tsx scripts/recompute-results.ts
 * That script is idempotent: it recomputes every record from scratch using
 * only (result, bestOdds, tier) — never the record's existing units value.
 *
 * American odds -> stake required to win 1 unit:
 *   negative odds  -N  =>  N / 100   (e.g. -140 => 1.40)
 *   positive odds  +N  =>  100 / N   (e.g. +120 => 0.833)
 */

import type { TierType, BetResult } from '../types';

// ---------------------------------------------------------------------------
// Tier multipliers — units this bet is SIZED TO WIN (not staked).
// Changing these + re-running recompute-results.ts re-tunes the entire scheme.
// ---------------------------------------------------------------------------
export const TIER_UNITS: Record<TierType, number> = {
  'BEST BET':    2.5,
  'STRONG PLAY': 1.5,
  'LEAN':        0.5,
};

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
 *   W => +multiplier  (we win the sized-to-win amount)
 *   L => -(multiplier * stakeToWin1(odds))  (we lose our stake)
 *   P => 0
 * Rounded to 2 decimal places.
 */
export function betUnits(
  result: BetResult,
  bestOdds: string,
  tier: TierType,
): number {
  const m = TIER_UNITS[tier];
  if (result === 'W') return Math.round(m * 100) / 100;
  if (result === 'L') return Math.round(-m * stakeToWin1(bestOdds) * 100) / 100;
  return 0; // push
}

/**
 * Stake placed on a single bet (0 for pushes).
 * Rounded to 2 decimal places.
 */
export function betStake(
  result: BetResult,
  bestOdds: string,
  tier: TierType,
): number {
  if (result === 'P') return 0;
  const m = TIER_UNITS[tier];
  return Math.round(m * stakeToWin1(bestOdds) * 100) / 100;
}
