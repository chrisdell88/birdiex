/**
 * X Score model implementation. LOCKED & VERIFIED 2026-05-15.
 *
 * X Score = Layer 1 (SG Score, live) + Layer 2 (course hist) + Layer 3 (fit + sg cat) + Layer 4 (major adj)
 *
 * Layer 1 = (w_OTT·SG_OTT + w_APP·SG_APP + w_ARG·SG_ARG − w_PUTT·SG_PUTT) / Σw
 *   where w_X = norm·course_coef_X + (1−norm)·1.0   (predictability blend)
 *   and   norm = min(1, course_predictability / 0.15)
 *   SG_PUTT is SUBTRACTED — the putting-regression core.
 *
 * This formula reproduces all 145 stored Masters 2026 X Score rows (145/145).
 * Canonical reference: docs/X_SCORE_FORMULA.md. Do not change without
 * Chris's explicit approval.
 */
import type { CourseProfile } from './courses.js';
import { computeBlendedWeights } from './courses.js';

export interface LiveSG {
  sg_ott: number;
  sg_app: number;
  sg_arg: number;
  sg_putt: number;
}

export interface Decomposition {
  total_course_history_adjustment: number;
  total_fit_adjustment: number;
  strokes_gained_category_adjustment: number;
  major_adjustment: number;
}

export interface XScoreBreakdown {
  sg_score_l1: number;
  course_history_l2: number;
  fit_adjustment: number;
  sg_category_adj: number;
  fit_plus_category_l3: number;
  major_adj_l4: number;
  x_score: number;
}

/**
 * Layer 1: course-fit-weighted putting regression.
 *
 * SG Score = (w_OTT*SG_OTT + w_APP*SG_APP + w_ARG*SG_ARG − w_PUTT*SG_PUTT)
 *            / (w_OTT + w_APP + w_ARG + w_PUTT)
 *
 * SG_PUTT is SUBTRACTED — this is the putting regression core of the model.
 */
export function computeLayer1(sg: LiveSG, course: CourseProfile): number {
  const { weights, denominator } = computeBlendedWeights(course);
  const numerator =
    weights.ott * sg.sg_ott +
    weights.app * sg.sg_app +
    weights.arg * sg.sg_arg -
    weights.putt * sg.sg_putt;
  return numerator / denominator;
}

/**
 * Compute full X Score breakdown given live SG, decomposition, and course profile.
 *
 * For pre-tournament / no-live-data state, pass `null` for sg AND optionally
 * pass `baselineSkill` (DataGolf skill estimate in strokes-gained per round)
 * to serve as Layer 1 in lieu of measured SG. This keeps Scheffler-tier
 * players ranked near the top pre-R1; without it L1=0 collapses the X Score
 * to just course history + fit, which buries top-skill players who don't
 * have unusual course-specific upside.
 *
 * Post-tournament the formula is unchanged from the locked specification
 * (still 145/145 Masters R1 verified): L1 = computeLayer1(sg, course).
 */
export function computeXScore(
  sg: LiveSG | null,
  decomp: Decomposition,
  course: CourseProfile,
  baselineSkill: number | null = null
): XScoreBreakdown {
  const sg_score_l1 = sg
    ? computeLayer1(sg, course)
    : (baselineSkill ?? 0);
  const course_history_l2 = decomp.total_course_history_adjustment ?? 0;
  const fit_adjustment = decomp.total_fit_adjustment ?? 0;
  const sg_category_adj = decomp.strokes_gained_category_adjustment ?? 0;
  const fit_plus_category_l3 = fit_adjustment + sg_category_adj;
  const major_adj_l4 = course.is_major ? (decomp.major_adjustment ?? 0) : 0;
  const x_score = sg_score_l1 + course_history_l2 + fit_plus_category_l3 + major_adj_l4;
  return {
    sg_score_l1: round4(sg_score_l1),
    course_history_l2: round4(course_history_l2),
    fit_adjustment: round4(fit_adjustment),
    sg_category_adj: round4(sg_category_adj),
    fit_plus_category_l3: round4(fit_plus_category_l3),
    major_adj_l4: round4(major_adj_l4),
    x_score: round4(x_score),
  };
}

/**
 * Signal tier names (NEW 7-tier system).
 *
 * Going forward all classifiers emit names from this union. Historical
 * data files may still contain legacy names (STRONGEST BUY, LEAN BUY,
 * LEAN FADE, STRONGEST FADE) — those are mapped to the new tiers at
 * render time by the SignalBadge component.
 */
export type Signal =
  | 'STRONG BUY'
  | 'BUY'
  | 'SOFT BUY'
  | 'NEUTRAL'
  | 'SOFT FADE'
  | 'FADE'
  | 'STRONG FADE';

/**
 * Absolute-threshold classifier — used post-R1 once X Scores have full
 * spread from real Layer-1 strokes-gained input.
 *
 *   STRONG BUY:  X ≥ +1.00
 *   BUY:         +0.50 to +0.99
 *   SOFT BUY:    +0.00 to +0.49
 *   NEUTRAL:     -0.50 to -0.01
 *   SOFT FADE:   -1.00 to -0.50
 *   FADE:        -1.50 to -1.00
 *   STRONG FADE: ≤ -1.50
 */
export function computeSignal(x_score: number): Signal {
  if (x_score >= 1.0) return 'STRONG BUY';
  if (x_score >= 0.5) return 'BUY';
  if (x_score >= 0.0) return 'SOFT BUY';
  if (x_score > -0.5) return 'NEUTRAL';
  if (x_score > -1.0) return 'SOFT FADE';
  if (x_score > -1.5) return 'FADE';
  return 'STRONG FADE';
}

/**
 * Field-relative (z-score) signal classification — used pre-tournament when
 * X Score has small spread (Layer 1 = 0). Maps each player's X Score to a
 * signal based on its z-score relative to the field's mean and stdev.
 *
 *   z ≥ +1.00  →  STRONG BUY      (top ~16%)
 *   z ≥ +0.50  →  BUY             (top ~31%)
 *   z ≥ +0.20  →  SOFT BUY
 *   |z| < 0.20 →  NEUTRAL
 *   z ≤ -0.20  →  SOFT FADE
 *   z ≤ -0.50  →  FADE
 *   z ≤ -1.00  →  STRONG FADE
 *
 * Caller should pass the full field's X Score array so mean + stdev are
 * computed across the whole field.
 */
export function computeSignalFieldRelative(x_score: number, fieldXScores: number[]): Signal {
  const n = fieldXScores.length;
  if (n < 5) return 'NEUTRAL';
  const mean = fieldXScores.reduce((a, b) => a + b, 0) / n;
  const variance = fieldXScores.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const stdev = Math.sqrt(variance);
  if (stdev < 1e-6) return 'NEUTRAL';
  const z = (x_score - mean) / stdev;
  if (z >= 1.00) return 'STRONG BUY';
  if (z >= 0.50) return 'BUY';
  if (z >= 0.20) return 'SOFT BUY';
  if (z > -0.20) return 'NEUTRAL';
  if (z > -0.50) return 'SOFT FADE';
  if (z > -1.00) return 'FADE';
  return 'STRONG FADE';
}

export type Purity = 'PURE BUY' | 'PURE FADE' | 'CONFLICTED' | 'NEUTRAL';

/**
 * Purity rules per MEMORY.md:
 *   - BUY is CONFLICTED if SG_OTT ≤ -0.45 OR SG_APP ≤ -0.45
 *   - FADE is CONFLICTED if SG_OTT ≥ 0.45 OR SG_APP ≥ 0.45
 *   - Putting is NOT a purity filter (already baked into X Score)
 *
 * Without live SG data, purity defaults to NEUTRAL.
 */
export function computePurity(signal: Signal, sg: LiveSG | null): Purity {
  if (!sg) return 'NEUTRAL';
  const isBuy = signal.includes('BUY');
  const isFade = signal.includes('FADE');
  if (isBuy) {
    if (sg.sg_ott <= -0.45 || sg.sg_app <= -0.45) return 'CONFLICTED';
    return 'PURE BUY';
  }
  if (isFade) {
    if (sg.sg_ott >= 0.45 || sg.sg_app >= 0.45) return 'CONFLICTED';
    return 'PURE FADE';
  }
  return 'NEUTRAL';
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
