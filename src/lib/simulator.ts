/**
 * Tournament Simulator — Monte Carlo engine for golf tournament outcomes.
 *
 * Inputs per player:
 *   • DataGolf skill estimate (strokes-gained per round vs. field average)
 *   • BirdieX X Score (additional venue-specific tilt: course history + fit + major)
 *
 * Combined: adjusted_sg = dg_skill_estimate + x_score
 *
 * Per simulation:
 *   For each player, draw 4 round scores. Each round score is:
 *       score = -adjusted_sg + normal(0, sigma)
 *   where sigma ≈ 2.7 strokes (PGA Tour empirical per-round stdev).
 *   Lower total score = better finish.
 *
 * Cut model:
 *   After R2, the field is cut to the top 65 + ties (rough approximation
 *   of PGA Tour standards). Cut players finish in T66-T(N).
 *
 * Aggregation over N runs:
 *   • win_prob = times finished 1st / N
 *   • top_5_prob, top_10_prob, top_20_prob (counted before cut)
 *   • made_cut_prob = times survived the R2 cut / N
 *
 * Calibration note: this is a deliberately simple model. The aim is
 * directional accuracy + visual engagement — not to outperform DataGolf's
 * own published projections (which we display as a comparison column).
 */

import type { PlayerData, PlayerSkillEstimate } from '../types';

/** Per-round score stdev. Empirical PGA Tour value ~2.5-3.0. */
const SIGMA_PER_ROUND = 2.7;

/** Cut to top 65 + ties on the PGA Tour (rough approximation). */
const CUT_POSITION = 65;

export interface SimulationInput {
  dg_id: number;
  player_name: string;
  dg_skill_estimate: number;
  x_score: number;
  /** Combined adjusted skill — what we actually use to draw round scores. */
  adjusted_sg: number;
}

export interface SimulationResult {
  dg_id: number;
  player_name: string;
  dg_skill_estimate: number;
  x_score: number;
  adjusted_sg: number;
  win_prob: number;
  top_5_prob: number;
  top_10_prob: number;
  top_20_prob: number;
  made_cut_prob: number;
  expected_finish: number;
}

/** Standard normal sample via Box-Muller. */
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Join a player roster with DataGolf skill estimates into the simulator input
 * shape. Filter out players without skill data (rare — but defensive).
 */
export function buildSimInputs(
  players: PlayerData[],
  skillEstimates: PlayerSkillEstimate[],
): SimulationInput[] {
  const skillByName = new Map<string, number>();
  for (const s of skillEstimates) skillByName.set(s.player_name, s.dg_skill_estimate);

  const inputs: SimulationInput[] = [];
  for (const p of players) {
    const dgSkill = skillByName.get(p.player_name);
    if (dgSkill == null) continue;
    inputs.push({
      dg_id: 0, // not used by sim
      player_name: p.player_name,
      dg_skill_estimate: dgSkill,
      x_score: p.x_score,
      adjusted_sg: dgSkill + p.x_score,
    });
  }
  return inputs;
}

/**
 * Accumulator for incremental Monte Carlo runs. Lets the UI update with
 * partial results as chunks of simulations complete (live convergence).
 */
export interface SimAccumulator {
  inputs: SimulationInput[];
  wins: number[];
  top5: number[];
  top10: number[];
  top20: number[];
  madeCut: number[];
  finishSum: number[];
  runsCompleted: number;
}

export function createAccumulator(inputs: SimulationInput[]): SimAccumulator {
  const n = inputs.length;
  return {
    inputs,
    wins: new Array<number>(n).fill(0),
    top5: new Array<number>(n).fill(0),
    top10: new Array<number>(n).fill(0),
    top20: new Array<number>(n).fill(0),
    madeCut: new Array<number>(n).fill(0),
    finishSum: new Array<number>(n).fill(0),
    runsCompleted: 0,
  };
}

/**
 * Add nRuns simulations to the accumulator. Mutates the accumulator. Safe
 * to call repeatedly to build up results incrementally.
 */
export function runSimChunk(acc: SimAccumulator, nRuns: number): void {
  const { inputs } = acc;
  const n = inputs.length;

  const r1 = new Float64Array(n);
  const r2 = new Float64Array(n);
  const r34 = new Float64Array(n);
  const totals = new Float64Array(n);
  const indices = new Int32Array(n);

  for (let sim = 0; sim < nRuns; sim++) {
    for (let i = 0; i < n; i++) {
      r1[i] = -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
      r2[i] = -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
      totals[i] = r1[i] + r2[i];
      indices[i] = i;
    }
    indices.sort((a, b) => totals[a] - totals[b]);

    const cutoffTotal = totals[indices[Math.min(CUT_POSITION - 1, n - 1)]];
    const survivorMask = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (totals[i] <= cutoffTotal + 1e-9) survivorMask[i] = 1;
    }

    for (let i = 0; i < n; i++) {
      if (survivorMask[i]) {
        r34[i] =
          (-inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND) +
          (-inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND);
        totals[i] = r1[i] + r2[i] + r34[i];
      } else {
        totals[i] = totals[i] + 999;
      }
    }

    for (let i = 0; i < n; i++) indices[i] = i;
    indices.sort((a, b) => totals[a] - totals[b]);

    for (let rank = 0; rank < n; rank++) {
      const i = indices[rank];
      acc.finishSum[i] += rank + 1;
      if (survivorMask[i]) acc.madeCut[i]++;
      if (rank === 0) acc.wins[i]++;
      if (rank < 5) acc.top5[i]++;
      if (rank < 10) acc.top10[i]++;
      if (rank < 20) acc.top20[i]++;
    }
  }
  acc.runsCompleted += nRuns;
}

/**
 * Finalize the accumulator into a sorted result array. Safe to call mid-run
 * for partial results (e.g., during chunked simulation visualization).
 */
export function finalizeResults(acc: SimAccumulator): SimulationResult[] {
  const n = acc.inputs.length;
  const runs = Math.max(1, acc.runsCompleted);
  const out: SimulationResult[] = acc.inputs.map((p, i) => ({
    dg_id: p.dg_id,
    player_name: p.player_name,
    dg_skill_estimate: p.dg_skill_estimate,
    x_score: p.x_score,
    adjusted_sg: p.adjusted_sg,
    win_prob: acc.wins[i] / runs,
    top_5_prob: acc.top5[i] / runs,
    top_10_prob: acc.top10[i] / runs,
    top_20_prob: acc.top20[i] / runs,
    made_cut_prob: acc.madeCut[i] / runs,
    expected_finish: acc.finishSum[i] / runs,
  }));
  void n;
  out.sort((a, b) => b.win_prob - a.win_prob);
  return out;
}

/**
 * Run N Monte Carlo simulations in one call (legacy single-shot API). For
 * the new live-converging UI use createAccumulator + runSimChunk +
 * finalizeResults in a loop.
 */
export function runSimulation(
  inputs: SimulationInput[],
  nRuns = 10000,
): SimulationResult[] {
  const n = inputs.length;

  // Accumulators per player.
  const wins = new Array<number>(n).fill(0);
  const top5 = new Array<number>(n).fill(0);
  const top10 = new Array<number>(n).fill(0);
  const top20 = new Array<number>(n).fill(0);
  const madeCut = new Array<number>(n).fill(0);
  const finishSum = new Array<number>(n).fill(0); // for expected finish

  // Reusable arrays to avoid GC pressure.
  const r1 = new Float64Array(n);
  const r2 = new Float64Array(n);
  const r34 = new Float64Array(n); // R3+R4 added later, only for survivors
  const totals = new Float64Array(n);
  const indices = new Int32Array(n);

  for (let sim = 0; sim < nRuns; sim++) {
    // R1 + R2 for everyone.
    for (let i = 0; i < n; i++) {
      r1[i] = -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
      r2[i] = -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
      totals[i] = r1[i] + r2[i];
      indices[i] = i;
    }

    // Sort indices by 36-hole total ascending (lower = better).
    indices.sort((a, b) => totals[a] - totals[b]);

    // Identify cut survivors (top CUT_POSITION inclusive).
    const cutoffTotal = totals[indices[Math.min(CUT_POSITION - 1, n - 1)]];
    // Players within cutoff (incl. ties) make the cut.
    const survivorMask = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (totals[i] <= cutoffTotal + 1e-9) survivorMask[i] = 1;
    }

    // R3 + R4 for survivors only.
    for (let i = 0; i < n; i++) {
      if (survivorMask[i]) {
        r34[i] =
          (-inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND) +
          (-inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND);
        totals[i] = r1[i] + r2[i] + r34[i];
      } else {
        // Cut player — locked at their 36-hole total + a penalty so they
        // sort below all survivors when computing finish.
        totals[i] = totals[i] + 999;
      }
    }

    // Re-sort by full total.
    for (let i = 0; i < n; i++) indices[i] = i;
    indices.sort((a, b) => totals[a] - totals[b]);

    // Tally results.
    for (let rank = 0; rank < n; rank++) {
      const i = indices[rank];
      const finish = rank + 1;
      finishSum[i] += finish;
      if (survivorMask[i]) madeCut[i]++;
      if (rank === 0) wins[i]++;
      if (rank < 5) top5[i]++;
      if (rank < 10) top10[i]++;
      if (rank < 20) top20[i]++;
    }
  }

  // Build result array, sorted by win probability descending.
  const out: SimulationResult[] = inputs.map((p, i) => ({
    dg_id: p.dg_id,
    player_name: p.player_name,
    dg_skill_estimate: p.dg_skill_estimate,
    x_score: p.x_score,
    adjusted_sg: p.adjusted_sg,
    win_prob: wins[i] / nRuns,
    top_5_prob: top5[i] / nRuns,
    top_10_prob: top10[i] / nRuns,
    top_20_prob: top20[i] / nRuns,
    made_cut_prob: madeCut[i] / nRuns,
    expected_finish: finishSum[i] / nRuns,
  }));
  out.sort((a, b) => b.win_prob - a.win_prob);
  return out;
}

/** Format a probability (0–1) as a percentage string with 1 decimal. */
export function fmtPct(p: number | null | undefined): string {
  if (p == null) return '—';
  if (p < 0.005) return '<0.5%';
  return (p * 100).toFixed(1) + '%';
}
