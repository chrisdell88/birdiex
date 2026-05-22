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
  /**
   * Cumulative actual score-to-par through whatever rounds have already
   * completed in real life. 0 for pre-tournament mode. For current-
   * leaderboard mode: the player's score_to_par from the live leaderboard.
   */
  starting_score: number;
  /**
   * Whether the player has been cut in real life. Null = cut hasn't
   * happened yet (pre-R2 or R1-just-done states). True/false only after
   * the real cut has been made.
   */
  real_made_cut: boolean | null;
}

/**
 * Simulator mode.
 *   pre-tournament    — re-simulates all 4 rounds, ignores starting_score.
 *   current-leaderboard — locks each player's starting_score (their actual
 *                         cumulative score through completed rounds) and
 *                         simulates only the remaining rounds.
 */
export type SimMode = 'pre-tournament' | 'current-leaderboard';

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
 *
 * IMPORTANT: `adjusted_sg = x_score` directly. X Score IS the venue-adjusted
 * expected strokes-gained per round:
 *   • Pre-R1: x_score = dg_skill (Layer 1) + L2 + L3 + L4
 *   • Post-R1: x_score = measured course-weighted SG (Layer 1) + L2 + L3 + L4
 * Both are already complete skill+venue estimates. Adding dg_skill on top
 * would double-count pre-R1 (the bug that gave Scheffler 87% win rate) and
 * mix tour-wide skill with venue-specific signal post-R1.
 *
 * dg_skill_estimate is kept on the input object for display purposes only
 * (the comparison columns show DataGolf's published projections).
 */
export function buildSimInputs(
  players: PlayerData[],
  skillEstimates: PlayerSkillEstimate[],
  /**
   * How many rounds have already been completed in real life. Used to
   * decide whether the cut has happened yet and therefore whether to
   * trust each player's `position` field. Default 0 (pre-tournament).
   */
  completedRounds: 0 | 1 | 2 | 3 = 0,
): SimulationInput[] {
  const skillByName = new Map<string, number>();
  for (const s of skillEstimates) skillByName.set(s.player_name, s.dg_skill_estimate);

  const inputs: SimulationInput[] = [];
  for (const p of players) {
    const dgSkill = skillByName.get(p.player_name);
    if (dgSkill == null) continue;
    // Cut status:
    //   • If real cut hasn't been made yet (completedRounds < 2), real_made_cut
    //     stays null and the sim will apply its own cut after sim-round-2.
    //   • Otherwise inspect position — "CUT" / "WD" / "MDF" mean out.
    let realMadeCut: boolean | null = null;
    if (completedRounds >= 2) {
      const pos = (p.position ?? '').toUpperCase();
      realMadeCut = !(pos === 'CUT' || pos === 'WD' || pos === 'MDF' || pos === '');
    }
    inputs.push({
      dg_id: 0,
      player_name: p.player_name,
      dg_skill_estimate: dgSkill,
      x_score: p.x_score,
      adjusted_sg: p.x_score,
      starting_score: p.score_to_par ?? 0,
      real_made_cut: realMadeCut,
    });
  }
  return inputs;
}

/**
 * Per-player result from a SINGLE simulated tournament. Used to show "this
 * is one possible weekend" rather than aggregate probabilities — gives the
 * user visible variance run-to-run (Scheffler doesn't win every click).
 */
export interface SingleTournamentResult {
  player_name: string;
  dg_skill_estimate: number;
  x_score: number;
  adjusted_sg: number;
  r1_score: number;
  r2_score: number;
  r3_score: number | null; // null = cut
  r4_score: number | null;
  total: number;
  made_cut: boolean;
  finish: number; // 1 = winner
}

/**
 * Run a SINGLE simulated tournament. Each player gets 4 round scores
 * (R3/R4 only if they make the cut). Returns the full field sorted by
 * finish position. Different every call — that's the point.
 *
 * In `pre-tournament` mode all 4 rounds are freshly simulated and the cut
 * is applied after sim-R2.
 *
 * In `current-leaderboard` mode each player's `starting_score` (their
 * actual cumulative score-to-par) is locked. We simulate only the
 * remaining 4 − completedRounds rounds and add them onto the starting
 * score. If the real cut has already happened (completedRounds ≥ 2) we
 * use `real_made_cut` to determine survivors; otherwise the cut is
 * applied after the first simulated round (which is R2 in reality).
 */
export function simulateOneTournament(
  inputs: SimulationInput[],
  mode: SimMode = 'pre-tournament',
  completedRounds: 0 | 1 | 2 | 3 = 0,
): SingleTournamentResult[] {
  const n = inputs.length;
  const r1Score = new Array<number>(n);
  const r2Score = new Array<number>(n);
  const r3Score = new Array<number | null>(n).fill(null);
  const r4Score = new Array<number | null>(n).fill(null);
  const totalAfterR2 = new Array<number>(n);
  const madeCut = new Array<boolean>(n);
  const total = new Array<number>(n);

  // Decide whether real-life data fills in any rounds.
  const lock = mode === 'current-leaderboard';

  // ─── R1 ───
  // Pre-tournament OR current-leaderboard with completedRounds == 0:
  // simulate. Current-leaderboard with completedRounds ≥ 1: R1 is part
  // of starting_score — we model it as 0 here to avoid double-counting.
  for (let i = 0; i < n; i++) {
    if (lock && completedRounds >= 1) r1Score[i] = 0;
    else r1Score[i] = -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
  }

  // ─── R2 ───
  for (let i = 0; i < n; i++) {
    if (lock && completedRounds >= 2) r2Score[i] = 0;
    else r2Score[i] = -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
  }

  // After R2 (locked + simulated), compute 36-hole total per player. For
  // current-leaderboard mode the locked starting_score covers whatever
  // real-life rounds have completed, so we add it once. r1Score and
  // r2Score are 0 for any locked round.
  for (let i = 0; i < n; i++) {
    const base = lock ? inputs[i].starting_score : 0;
    totalAfterR2[i] = base + r1Score[i] + r2Score[i];
  }

  // ─── Cut ───
  if (lock && completedRounds >= 2) {
    // Real cut already happened; honor it.
    for (let i = 0; i < n; i++) madeCut[i] = inputs[i].real_made_cut === true;
  } else {
    // Sim-driven cut after 36 holes (R1 + R2 cumulative).
    const r2Indices = Array.from({ length: n }, (_, i) => i).sort(
      (a, b) => totalAfterR2[a] - totalAfterR2[b],
    );
    const cutoffTotal = totalAfterR2[r2Indices[Math.min(CUT_POSITION - 1, n - 1)]];
    for (let i = 0; i < n; i++) madeCut[i] = totalAfterR2[i] <= cutoffTotal + 1e-9;
  }

  // ─── R3 / R4 ───
  for (let i = 0; i < n; i++) {
    if (madeCut[i]) {
      // R3
      if (lock && completedRounds >= 3) r3Score[i] = 0;
      else r3Score[i] = -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
      // R4 (no completed-round case — picksRound caps at 3 in this app)
      r4Score[i] = -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
      total[i] = totalAfterR2[i] + (r3Score[i] ?? 0) + (r4Score[i] ?? 0);
    } else {
      total[i] = totalAfterR2[i] + 999;
    }
  }

  const finishOrder = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => total[a] - total[b],
  );

  const results: SingleTournamentResult[] = finishOrder.map((i, rank) => {
    // Per-round display values. In current-leaderboard mode the real
    // completed rounds aren't sampled, but the cumulative starting_score
    // IS the player's actual progress through those rounds. We can only
    // recover the per-round split for completedRounds === 1 (starting_score
    // == R1 score). For completedRounds >= 2 we don't have the per-round
    // split, so we surface the cumulative under R1 and 0 under the other
    // locked slots until we wire per-round score data into the data files.
    let r1Display: number;
    let r2Display: number;
    let r3Display: number | null;
    if (lock && completedRounds === 1) {
      r1Display = +inputs[i].starting_score.toFixed(1);
      r2Display = +r2Score[i].toFixed(1);
      r3Display = r3Score[i] == null ? null : +(r3Score[i] as number).toFixed(1);
    } else if (lock && completedRounds === 2) {
      r1Display = +inputs[i].starting_score.toFixed(1); // cumulative through R2
      r2Display = 0;
      r3Display = r3Score[i] == null ? null : +(r3Score[i] as number).toFixed(1);
    } else if (lock && completedRounds === 3) {
      r1Display = +inputs[i].starting_score.toFixed(1); // cumulative through R3
      r2Display = 0;
      r3Display = 0;
    } else {
      r1Display = +r1Score[i].toFixed(1);
      r2Display = +r2Score[i].toFixed(1);
      r3Display = r3Score[i] == null ? null : +(r3Score[i] as number).toFixed(1);
    }

    return {
      player_name: inputs[i].player_name,
      dg_skill_estimate: inputs[i].dg_skill_estimate,
      x_score: inputs[i].x_score,
      adjusted_sg: inputs[i].adjusted_sg,
      r1_score: r1Display,
      r2_score: r2Display,
      r3_score: r3Display,
      r4_score: r4Score[i] == null ? null : +(r4Score[i] as number).toFixed(1),
      total: madeCut[i] ? +total[i].toFixed(1) : +totalAfterR2[i].toFixed(1),
      made_cut: madeCut[i],
      finish: rank + 1,
    };
  });
  return results;
}

/**
 * Accumulator for incremental Monte Carlo runs. Lets the UI update with
 * partial results as chunks of simulations complete (live convergence).
 */
export interface SimAccumulator {
  inputs: SimulationInput[];
  mode: SimMode;
  completedRounds: 0 | 1 | 2 | 3;
  wins: number[];
  top5: number[];
  top10: number[];
  top20: number[];
  madeCut: number[];
  finishSum: number[];
  runsCompleted: number;
}

export function createAccumulator(
  inputs: SimulationInput[],
  mode: SimMode = 'pre-tournament',
  completedRounds: 0 | 1 | 2 | 3 = 0,
): SimAccumulator {
  const n = inputs.length;
  return {
    inputs,
    mode,
    completedRounds,
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
 * to call repeatedly to build up results incrementally. Respects the
 * accumulator's mode + completedRounds for cut handling and locked rounds.
 */
export function runSimChunk(acc: SimAccumulator, nRuns: number): void {
  const { inputs, mode, completedRounds } = acc;
  const n = inputs.length;
  const lock = mode === 'current-leaderboard';
  const cutAlreadyHappened = lock && completedRounds >= 2;
  const r1Locked = lock && completedRounds >= 1;
  const r2Locked = lock && completedRounds >= 2;
  const r3Locked = lock && completedRounds >= 3;

  const r1 = new Float64Array(n);
  const r2 = new Float64Array(n);
  const r34 = new Float64Array(n);
  const totals = new Float64Array(n);
  const indices = new Int32Array(n);

  for (let sim = 0; sim < nRuns; sim++) {
    for (let i = 0; i < n; i++) {
      r1[i] = r1Locked ? 0 : -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
      r2[i] = r2Locked ? 0 : -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
      // Locked rounds (whichever ones) are baked into starting_score.
      totals[i] = (lock ? inputs[i].starting_score : 0) + r1[i] + r2[i];
      indices[i] = i;
    }

    const survivorMask = new Uint8Array(n);
    if (cutAlreadyHappened) {
      // Use real cut status from inputs.
      for (let i = 0; i < n; i++) {
        if (inputs[i].real_made_cut === true) survivorMask[i] = 1;
      }
    } else {
      indices.sort((a, b) => totals[a] - totals[b]);
      const cutoffTotal = totals[indices[Math.min(CUT_POSITION - 1, n - 1)]];
      for (let i = 0; i < n; i++) {
        if (totals[i] <= cutoffTotal + 1e-9) survivorMask[i] = 1;
      }
    }

    for (let i = 0; i < n; i++) {
      if (survivorMask[i]) {
        const r3 = r3Locked ? 0 : -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
        const r4 = -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
        r34[i] = r3 + r4;
        totals[i] = (lock ? inputs[i].starting_score : 0) + r1[i] + r2[i] + r34[i];
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
  mode: SimMode = 'pre-tournament',
  completedRounds: 0 | 1 | 2 | 3 = 0,
): SimulationResult[] {
  const n = inputs.length;
  const lock = mode === 'current-leaderboard';
  const cutAlreadyHappened = lock && completedRounds >= 2;
  const r1Locked = lock && completedRounds >= 1;
  const r2Locked = lock && completedRounds >= 2;
  const r3Locked = lock && completedRounds >= 3;

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
    // R1 + R2 for everyone (locked rounds contribute 0; their score is
    // embedded in starting_score).
    for (let i = 0; i < n; i++) {
      r1[i] = r1Locked ? 0 : -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
      r2[i] = r2Locked ? 0 : -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
      totals[i] = (lock ? inputs[i].starting_score : 0) + r1[i] + r2[i];
      indices[i] = i;
    }

    // Cut determination.
    const survivorMask = new Uint8Array(n);
    if (cutAlreadyHappened) {
      for (let i = 0; i < n; i++) {
        if (inputs[i].real_made_cut === true) survivorMask[i] = 1;
      }
    } else {
      indices.sort((a, b) => totals[a] - totals[b]);
      const cutoffTotal = totals[indices[Math.min(CUT_POSITION - 1, n - 1)]];
      for (let i = 0; i < n; i++) {
        if (totals[i] <= cutoffTotal + 1e-9) survivorMask[i] = 1;
      }
    }

    // R3 + R4 for survivors only.
    for (let i = 0; i < n; i++) {
      if (survivorMask[i]) {
        const r3 = r3Locked ? 0 : -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
        const r4 = -inputs[i].adjusted_sg + randn() * SIGMA_PER_ROUND;
        r34[i] = r3 + r4;
        totals[i] = (lock ? inputs[i].starting_score : 0) + r1[i] + r2[i] + r34[i];
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
