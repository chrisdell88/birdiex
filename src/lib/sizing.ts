/**
 * Edge-banded bet sizing + star rating.
 *
 * A bet is sized to WIN a number of units determined by its X Score edge,
 * in 0.5-wide bands starting at the 0.95 pick floor. The size also maps to a
 * 1–5 star rating (the unit size rounded) for display — the UI shows stars,
 * not the unit number.
 *
 *   edge band     units   stars
 *   0.95–1.45     0.5u    ★
 *   1.45–1.95     1.0u    ★
 *   1.95–2.45     1.5u    ★★
 *   2.45–2.95     2.0u    ★★
 *   2.95–3.45     2.5u    ★★★
 *   3.45–3.95     3.0u    ★★★
 *   3.95–4.45     3.5u    ★★★★
 *   4.45–4.95     4.0u    ★★★★
 *   4.95–5.45     4.5u    ★★★★★
 *   5.45+         5.0u    ★★★★★   (top band — caps at 5u)
 *   edge < 0.95   not a bet (0u, 0 stars)
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
  const band = Math.floor((e - 9500) / 5000); // 0,1,2,3,...
  return Math.min(5, 0.5 + 0.5 * band); // top band caps at 5u
}

/**
 * Star rating (1–5) for a bet — its unit size rounded to the nearest whole.
 * 0.5u/1u -> 1 star, 1.5u/2u -> 2, 2.5u/3u -> 3, 3.5u/4u -> 4, 4.5u/5u -> 5.
 * Returns 0 for a non-bet (edge below the 0.95 floor).
 */
export function starsForEdge(edge: number): number {
  return Math.round(unitsForEdge(edge));
}

/**
 * Stake required to win 1 unit at these American odds.
 * "-140" => 1.40  |  "+120" => 0.8333...
 *
 * Defensive: odds of 0, +0, missing, or NaN yield 1.0 (a sane fallback)
 * rather than Infinity. Real bets should never have these values — we
 * log a warning so the data-pipeline owner can investigate.
 */
export function stakeToWin1(odds: string): number {
  const n = parseInt(odds, 10);
  if (!Number.isFinite(n) || n === 0) {
    if (typeof console !== 'undefined') {
      console.warn('[stakeToWin1] non-positive odds value:', odds, '— defaulting stake to 1.0u');
    }
    return 1;
  }
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

// ============================================================================
// Course-adaptive recommended floor
// ============================================================================
//
// The model produces every bet with edge ≥ 0.95 (the hard pick floor). But for
// the public "recommended / tracked bets" record we use a higher floor on
// less-predictable venues, because backtests show low-predictability courses
// (e.g., Aronimink, predictability 0.0413) lose money at the 0.95 floor and
// only break even from ~2.45 upward.
//
// Two anchors so far:
//   Augusta National (pred 0.1439)  →  floor 0.95  (every model pick)
//   Aronimink         (pred 0.0413) →  floor 2.45  (only the strongest edges)
//
// Linear fit through the two anchors: floor = 3.05 − 14.62 × predictability.
// Then snap to the NEAREST tier boundary in {0.95, 1.45, 1.95, 2.45, 2.95}.
//
// DESIGN EVOLUTION:
// 1. First version: snap UP to next tier — created an artificial cliff
//    (Craig Ranch raw 2.50 jumped to 2.95 even though Aronimink raw 2.45
//    stayed at 2.45).
// 2. Second version: continuous (no snap, rounded to 2 decimals) — exact
//    formula output, but produces awkward non-tier numbers like 2.50.
// 3. Current: snap to NEAREST tier — preserves tier-break cleanliness
//    while reflecting the honest "closest legal threshold" from the
//    formula. Craig Ranch raw 2.50 → nearest is 2.45 (Δ=0.05) not 2.95
//    (Δ=0.45) → snaps to 2.45.
//
// Once we have more venue data points (n>2), this snap can come off and
// we can use the continuous formula directly.
//
// Source-of-truth doc: docs/THRESHOLD_SWEEP.md.

const FLOOR_MIN = 0.95;
const FLOOR_MAX = 2.95;
const FLOOR_TIERS = [0.95, 1.45, 1.95, 2.45, 2.95] as const;

/**
 * Recommended bet floor (edge) for a venue, derived from its predictability.
 *
 * Formula: `raw = 3.05 − 14.62 × predictability`, clamped to [0.95, 2.95],
 * then snapped to the NEAREST tier boundary in {0.95, 1.45, 1.95, 2.45, 2.95}.
 *
 * Sanity checks:
 *   predictability 0.1439 (Augusta)   → raw 0.946 → snap 0.95  ✓
 *   predictability 0.0413 (Aronimink) → raw 2.446 → snap 2.45  ✓
 *   predictability 0.0373 (Craig Rch) → raw 2.505 → snap 2.45  ✓ (Δ to 2.45 is 0.05, Δ to 2.95 is 0.45)
 */
export function recommendedFloorForPredictability(predictability: number): number {
  const raw = 3.05 - 14.62 * predictability;
  const clamped = Math.max(FLOOR_MIN, Math.min(FLOOR_MAX, raw));
  // Snap to nearest tier.
  let nearest: number = FLOOR_TIERS[0];
  let bestDelta = Math.abs(clamped - nearest);
  for (const t of FLOOR_TIERS) {
    const d = Math.abs(clamped - t);
    if (d < bestDelta) {
      bestDelta = d;
      nearest = t;
    }
  }
  return nearest;
}

/**
 * Star tier label for a recommended-floor edge (e.g., 0.95 → "★+", 2.45 → "★★+",
 * 2.95 → "★★★+"). Uses the same star mapping as starsForEdge() so the floor
 * label matches what the user sees on individual bet cards.
 */
export function floorTierLabel(floor: number): string {
  const stars = Math.max(1, starsForEdge(floor));
  return '★'.repeat(Math.min(5, stars)) + '+';
}

/**
 * Is this bet "tracked" (i.e., would we have recommended it under the
 * venue-aware floor)? `floor` is the recommended floor for the course.
 */
export function isTrackedBet(edge: number, floor: number): boolean {
  return Math.round(edge * 10000) >= Math.round(floor * 10000);
}

/**
 * Tier label for a matchup edge, given the venue floor.
 *
 * SINGLE SOURCE OF TRUTH for "BEST BET" / "STRONG PLAY" / "LEAN" labels —
 * every component (MatchupsView, OddsTablePage, anywhere else) MUST call
 * this instead of inlining `if (edge >= 1.95) ...`. Hardcoded floor
 * comparisons in components are blocked at build time by
 * `scripts/verify-floor-references.ts`.
 *
 *   BEST BET    → edge ≥ venue floor
 *   STRONG PLAY → edge ≥ floor − 0.5 (one tier below) but < floor
 *   LEAN        → everything below
 */
export function tierForEdge(edge: number, floor: number): 'BEST BET' | 'STRONG PLAY' | 'LEAN' {
  if (edge >= floor) return 'BEST BET';
  if (edge >= floor - 0.5) return 'STRONG PLAY';
  return 'LEAN';
}
