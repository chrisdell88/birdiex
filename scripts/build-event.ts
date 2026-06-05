/**
 * Build a typed TS data file (src/data/<event>R<N>Data.ts) from raw JSON pulled
 * by pull-event.ts.
 *
 * Usage:
 *   npx tsx scripts/build-event.ts --slug pga-championship-2026 --phase pre  --course aronimink --out pgaChampPreData
 *   npx tsx scripts/build-event.ts --slug pga-championship-2026 --phase r1   --course aronimink --out pgaChampR1Data
 */
import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { COURSES, DEFAULT_LOW_PREDICTABILITY_COURSE, computeBlendedWeights } from './lib/courses.js';
import { computeXScore, computeSignal, computeSignalFieldRelative, computePurity } from './lib/xscore.js';
import type { LiveSG, Decomposition } from './lib/xscore.js';

interface Args {
  slug: string;
  phase: 'pre' | 'r1' | 'r2' | 'r3' | 'r4' | 'final';
  course: string;
  out: string;
  /** When set, the cumulative SG track is built by summing live-stats-r{1..N}.json
   *  ONLY (instead of reading live-stats-event-cumulative.json). Use this when a
   *  later round is already in progress but you want the data file to reflect
   *  R{N}-final state with no contamination. Optional. */
  lockAtRound?: number;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const out: Partial<Args> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const val = args[i + 1];
    if (key === 'slug') out.slug = val;
    if (key === 'phase') out.phase = val as Args['phase'];
    if (key === 'course') out.course = val;
    if (key === 'out') out.out = val;
    if (key === 'lock-at-round') out.lockAtRound = parseInt(val, 10);
  }
  for (const k of ['slug', 'phase', 'course', 'out'] as const) {
    if (!out[k]) {
      console.error(`Missing --${k}`);
      process.exit(1);
    }
  }
  return out as Args;
}

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

async function loadJson<T = unknown>(slug: string, phase: string, name: string): Promise<T | null> {
  const path = join(PROJECT_ROOT, 'data', 'raw', slug, phase, `${name}.json`);
  try {
    await access(path);
  } catch {
    return null;
  }
  const buf = await readFile(path, 'utf-8');
  return JSON.parse(buf) as T;
}

interface DecompPlayer {
  dg_id: number;
  player_name: string;
  baseline_pred: number | null;
  total_course_history_adjustment?: number;
  total_fit_adjustment?: number;
  strokes_gained_category_adjustment?: number;
  major_adjustment?: number;
}

interface LiveStatsPlayer {
  dg_id: number;
  player_name: string;
  position: string;
  total: number; // cumulative score to par
  /**
   * In live-stats-rN.json, `round` is the player's score-to-par for THAT
   * specific round (not the round number). In other files this field may
   * be absent or carry a different meaning — only trust it when reading
   * a per-round file.
   */
  round?: number;
  sg_ott: number;
  sg_app: number;
  sg_arg: number;
  sg_putt: number;
}

interface DecompFile {
  course_name?: string;
  event_name?: string;
  field?: DecompPlayer[];
  players?: DecompPlayer[];
}

interface LiveStatsFile {
  event_name?: string;
  last_updated?: string;
  live_stats?: LiveStatsPlayer[];
}

async function main() {
  const { slug, phase, course, out, lockAtRound } = parseArgs();
  const courseProfile = COURSES[course] ?? DEFAULT_LOW_PREDICTABILITY_COURSE;
  if (!COURSES[course]) {
    console.warn(`⚠️  Unknown course '${course}'. Using DEFAULT_LOW_PREDICTABILITY_COURSE.`);
  }

  const { weights, denominator } = computeBlendedWeights(courseProfile);
  console.log(`\nCourse: ${courseProfile.name}`);
  console.log(`Weights: OTT=${weights.ott.toFixed(3)} APP=${weights.app.toFixed(3)} ARG=${weights.arg.toFixed(3)} PUTT=${weights.putt.toFixed(3)} (denom=${denominator.toFixed(3)})\n`);

  // Load decompositions (always have these — needed for L2/L3/L4)
  const decompFile = await loadJson<DecompFile>(slug, phase, 'player-decompositions');
  if (!decompFile) {
    console.error('Missing player-decompositions.json. Run pull-event first.');
    process.exit(1);
  }
  const decompPlayers: DecompPlayer[] =
    decompFile.field ?? decompFile.players ?? [];
  const decompByName = new Map<string, DecompPlayer>();
  const decompByDgId = new Map<number, DecompPlayer>();
  for (const p of decompPlayers) {
    if (p.player_name) decompByName.set(normalizeName(p.player_name), p);
    if (p.dg_id) decompByDgId.set(p.dg_id, p);
  }
  console.log(`Loaded ${decompPlayers.length} players from decompositions.`);

  // Cumulative track = accumulating SG totals across completed rounds.
  // Normally we read live-stats-event-cumulative.json — but that reflects
  // whatever DataGolf has live RIGHT NOW, which can include mid-round
  // contamination if a later round is in progress when we pull.
  //
  // --lock-at-round N opts into a CLEAN cumulative built by summing
  // live-stats-r{1..N}.json instead. Use this to build a data file that
  // reflects R{N}-final state regardless of when you ran the pull.
  const liveR1 = await loadJson<LiveStatsFile>(slug, phase, 'live-stats-r1');
  const liveR2 = await loadJson<LiveStatsFile>(slug, phase, 'live-stats-r2');
  const liveR3 = await loadJson<LiveStatsFile>(slug, phase, 'live-stats-r3');
  const liveR4 = await loadJson<LiveStatsFile>(slug, phase, 'live-stats-r4');
  let liveCum: LiveStatsFile | null;
  if (lockAtRound) {
    console.log(`Lock-at-round=${lockAtRound}: cumulative built from sum of live-stats-r1..r${lockAtRound}.json (ignores live-stats-event-cumulative).`);
    const perRound: LiveStatsFile[] = [];
    if (lockAtRound >= 1 && liveR1) perRound.push(liveR1);
    if (lockAtRound >= 2 && liveR2) perRound.push(liveR2);
    if (lockAtRound >= 3 && liveR3) perRound.push(liveR3);
    if (lockAtRound >= 4 && liveR4) perRound.push(liveR4);
    // Sum SG categories per player across the included rounds.
    const sumByName = new Map<string, LiveStatsPlayer>();
    for (const file of perRound) {
      for (const p of file.live_stats ?? []) {
        const key = p.player_name ?? '';
        if (!key) continue;
        const acc = sumByName.get(key);
        if (!acc) {
          sumByName.set(key, { ...p });
        } else {
          acc.sg_total = (acc.sg_total ?? 0) + (p.sg_total ?? 0);
          acc.sg_ott = (acc.sg_ott ?? 0) + (p.sg_ott ?? 0);
          acc.sg_app = (acc.sg_app ?? 0) + (p.sg_app ?? 0);
          acc.sg_arg = (acc.sg_arg ?? 0) + (p.sg_arg ?? 0);
          acc.sg_putt = (acc.sg_putt ?? 0) + (p.sg_putt ?? 0);
          acc.sg_t2g = (acc.sg_t2g ?? 0) + (p.sg_t2g ?? 0);
        }
      }
    }
    // Derive score-to-par = sum of each round's per-round score-to-par.
    // Per-round score-to-par lives in field `round` on each player in
    // live-stats-rN.json. Sum across included rounds for each player.
    const scoreByName = new Map<string, number>();
    for (const file of perRound) {
      for (const p of file.live_stats ?? []) {
        const key = p.player_name ?? '';
        if (!key) continue;
        const r = typeof p.round === 'number' ? p.round : 0;
        scoreByName.set(key, (scoreByName.get(key) ?? 0) + r);
      }
    }
    // Re-derive position from sorted scores.
    const ordered = [...sumByName.keys()].map((name) => ({ name, score: scoreByName.get(name) ?? 0 }));
    ordered.sort((a, b) => a.score - b.score);
    const posByName = new Map<string, string>();
    let last = Number.NaN;
    let lastPos = 0;
    let runCount = 0;
    for (let i = 0; i < ordered.length; i++) {
      const o = ordered[i];
      if (o.score === last) { runCount++; }
      else { lastPos = i + 1; last = o.score; runCount = 1; }
      // Use T-prefix when more than one player tied (look ahead to confirm).
      const isTied =
        (i > 0 && ordered[i - 1].score === o.score) ||
        (i < ordered.length - 1 && ordered[i + 1].score === o.score);
      posByName.set(o.name, (isTied ? 'T' : '') + lastPos);
    }
    // Patch each player record with our recomputed score + position.
    for (const [name, p] of sumByName) {
      p.total = scoreByName.get(name) ?? 0;
      p.position = posByName.get(name) ?? '--';
    }
    liveCum = { live_stats: [...sumByName.values()] };
  } else {
    liveCum =
      (await loadJson<LiveStatsFile>(slug, phase, 'live-stats-event-cumulative')) ??
      (await loadJson<LiveStatsFile>(slug, phase, 'live-stats-event-avg'));
  }

  // Pick the round-only file matching current phase (latest completed round)
  const roundFile =
    phase === 'r4' || phase === 'final'
      ? liveR4
      : phase === 'r3'
        ? liveR3
        : phase === 'r2'
          ? liveR2
          : phase === 'r1'
            ? liveR1
            : null;

  const roundPlayers = roundFile?.live_stats ?? [];
  const cumPlayers = liveCum?.live_stats ?? [];

  console.log(`Round-only: ${roundPlayers.length} players. Cumulative: ${cumPlayers.length} players.\n`);

  // Per-round score-to-par lookup. live-stats-rN.json has each player's
  // `round` field = their score-to-par for THAT round. We index by dg_id
  // (and player_name fallback) so the simulator can display actual round
  // scores in Current Leaderboard mode instead of placeholder zeros.
  const roundScoreMap = (live: LiveStatsFile | null) => {
    const m = new Map<number, number>();
    const n = new Map<string, number>();
    for (const p of live?.live_stats ?? []) {
      if (typeof p.round === 'number') {
        if (p.dg_id) m.set(p.dg_id, p.round);
        if (p.player_name) n.set(normalizeName(p.player_name), p.round);
      }
    }
    return { byId: m, byName: n };
  };
  const r1Scores = roundScoreMap(liveR1);
  const r2Scores = roundScoreMap(liveR2);
  const r3Scores = roundScoreMap(liveR3);
  const r4Scores = roundScoreMap(liveR4);

  // Build rows for both datasets
  const roundOnlyRows = buildRows(roundPlayers, decompByDgId, decompByName, courseProfile, {r1Scores, r2Scores, r3Scores, r4Scores});
  const cumulativeRows = buildRows(cumPlayers, decompByDgId, decompByName, courseProfile, {r1Scores, r2Scores, r3Scores, r4Scores});

  // For pre-tournament: no live data — emit a single set sorted by L2+L3+L4 baseline
  const isPre = phase === 'pre' || (roundPlayers.length === 0 && cumPlayers.length === 0);
  let finalRoundOnly = roundOnlyRows;
  let finalCumulative = cumulativeRows;

  if (isPre) {
    console.log('Pre-tournament mode: Layer 1 = DataGolf skill estimate (no live SG yet).\n');

    // Load DataGolf skill estimates so Layer 1 is meaningful pre-R1. Without
    // this, every X Score collapses to L2+L3+L4 only (course history + fit +
    // major), which buries top-skill players like Scheffler if they don't
    // have unusual venue-specific upside. With the baseline, the rankings
    // reflect overall skill PLUS our model's tilt.
    const dgRankings = await loadJson<{ rankings: Array<{ dg_id: number; player_name: string; dg_skill_estimate: number }> }>(
      slug,
      phase,
      'dg-rankings',
    );
    const skillById = new Map<number, number>();
    const skillByName = new Map<string, number>();
    if (dgRankings?.rankings) {
      for (const r of dgRankings.rankings) {
        if (typeof r.dg_skill_estimate === 'number') {
          if (r.dg_id) skillById.set(r.dg_id, r.dg_skill_estimate);
          if (r.player_name) skillByName.set(normalizeName(r.player_name), r.dg_skill_estimate);
        }
      }
      console.log(`Loaded ${skillById.size} DG skill estimates for Layer 1 baseline.\n`);
    } else {
      console.warn('⚠️  No dg-rankings.json found — pre-tournament Layer 1 will be 0.\n');
    }

    // Two-pass: first compute every player's X Score, then classify signals
    // using a field-relative (z-score) rule.
    const preBreakdowns = decompPlayers.map((p) => {
      const decomp: Decomposition = {
        total_course_history_adjustment: p.total_course_history_adjustment ?? 0,
        total_fit_adjustment: p.total_fit_adjustment ?? 0,
        strokes_gained_category_adjustment: p.strokes_gained_category_adjustment ?? 0,
        major_adjustment: p.major_adjustment ?? 0,
      };
      const baselineSkill =
        (p.dg_id != null ? skillById.get(p.dg_id) : undefined) ??
        (p.player_name ? skillByName.get(normalizeName(p.player_name)) : undefined) ??
        null;
      return { p, breakdown: computeXScore(null, decomp, courseProfile, baselineSkill) };
    });
    const fieldXScores = preBreakdowns.map((row) => row.breakdown.x_score);

    const preRows = preBreakdowns.map(({ p, breakdown }) => {
      const signal = computeSignalFieldRelative(breakdown.x_score, fieldXScores);
      const purity = computePurity(signal, null);
      return {
        player_name: p.player_name,
        position: '--',
        score_to_par: 0,
        sg_ott: 0,
        sg_app: 0,
        sg_arg: 0,
        sg_putt: 0,
        sg_score_l1: breakdown.sg_score_l1,
        course_history_l2: breakdown.course_history_l2,
        fit_adjustment: breakdown.fit_adjustment,
        sg_category_adj: breakdown.sg_category_adj,
        fit_plus_category_l3: breakdown.fit_plus_category_l3,
        major_adj_l4: breakdown.major_adj_l4,
        x_score: breakdown.x_score,
        signal,
        purity,
        dg_matched: true,
        rank: 0,
      };
    });
    preRows.sort((a, b) => b.x_score - a.x_score);
    preRows.forEach((r, i) => (r.rank = i + 1));
    finalRoundOnly = preRows;
    finalCumulative = preRows;
  }

  // Emit the TS data file
  const outPath = join(PROJECT_ROOT, 'src', 'data', `${out}.ts`);
  const generatedAt = new Date().toISOString();
  const header = [
    `// Generated by scripts/build-event.ts on ${generatedAt}`,
    `// Event: ${slug}, phase: ${phase}, course: ${course}`,
    `// Players: round=${finalRoundOnly.length}, cumulative=${finalCumulative.length}`,
    `// DO NOT EDIT BY HAND — re-run \`npm run build:event\` after pulling new data.`,
  ].join('\n');

  const body = [
    `import type { PlayerData } from '../types';`,
    ``,
    header,
    ``,
    `/** ISO timestamp of this data pull — powers the site's "Last Updated" line. */`,
    `export const generatedAt = '${generatedAt}';`,
    ``,
    `export const roundOnlyData: PlayerData[] = ${JSON.stringify(finalRoundOnly, null, 2)};`,
    ``,
    `export const cumulativeData: PlayerData[] = ${JSON.stringify(finalCumulative, null, 2)};`,
    ``,
  ].join('\n');

  await writeFile(outPath, body);
  console.log(`✅ Wrote src/data/${out}.ts (${finalRoundOnly.length} round / ${finalCumulative.length} cumulative)\n`);
}

type RoundScoreMap = { byId: Map<number, number>; byName: Map<string, number> };
type RoundScoreMaps = {
  r1Scores: RoundScoreMap;
  r2Scores: RoundScoreMap;
  r3Scores: RoundScoreMap;
  r4Scores: RoundScoreMap;
};

function lookupRoundScore(map: RoundScoreMap, dgId: number, name: string): number | undefined {
  if (dgId && map.byId.has(dgId)) return map.byId.get(dgId);
  const key = normalizeName(name);
  if (map.byName.has(key)) return map.byName.get(key);
  return undefined;
}

function buildRows(
  livePlayers: LiveStatsPlayer[],
  decompByDgId: Map<number, DecompPlayer>,
  decompByName: Map<string, DecompPlayer>,
  course: typeof DEFAULT_LOW_PREDICTABILITY_COURSE,
  roundScores: RoundScoreMaps = {
    r1Scores: { byId: new Map(), byName: new Map() },
    r2Scores: { byId: new Map(), byName: new Map() },
    r3Scores: { byId: new Map(), byName: new Map() },
    r4Scores: { byId: new Map(), byName: new Map() },
  },
) {
  const rows = livePlayers.map((p) => {
    const dec = decompByDgId.get(p.dg_id) ?? decompByName.get(normalizeName(p.player_name));
    const decomp: Decomposition = {
      total_course_history_adjustment: dec?.total_course_history_adjustment ?? 0,
      total_fit_adjustment: dec?.total_fit_adjustment ?? 0,
      strokes_gained_category_adjustment: dec?.strokes_gained_category_adjustment ?? 0,
      major_adjustment: dec?.major_adjustment ?? 0,
    };
    const sg: LiveSG = {
      sg_ott: p.sg_ott ?? 0,
      sg_app: p.sg_app ?? 0,
      sg_arg: p.sg_arg ?? 0,
      sg_putt: p.sg_putt ?? 0,
    };
    const breakdown = computeXScore(sg, decomp, course);
    const signal = computeSignal(breakdown.x_score);
    const purity = computePurity(signal, sg);
    const r1stp = lookupRoundScore(roundScores.r1Scores, p.dg_id, p.player_name);
    const r2stp = lookupRoundScore(roundScores.r2Scores, p.dg_id, p.player_name);
    const r3stp = lookupRoundScore(roundScores.r3Scores, p.dg_id, p.player_name);
    const r4stp = lookupRoundScore(roundScores.r4Scores, p.dg_id, p.player_name);
    return {
      player_name: p.player_name,
      position: p.position ?? '--',
      score_to_par: p.total ?? 0,
      sg_ott: round2(sg.sg_ott),
      sg_app: round2(sg.sg_app),
      sg_arg: round2(sg.sg_arg),
      sg_putt: round2(sg.sg_putt),
      sg_score_l1: breakdown.sg_score_l1,
      course_history_l2: breakdown.course_history_l2,
      fit_adjustment: breakdown.fit_adjustment,
      sg_category_adj: breakdown.sg_category_adj,
      fit_plus_category_l3: breakdown.fit_plus_category_l3,
      major_adj_l4: breakdown.major_adj_l4,
      x_score: breakdown.x_score,
      signal,
      purity,
      dg_matched: !!dec,
      rank: 0,
      ...(r1stp != null ? { r1_score_to_par: r1stp } : {}),
      ...(r2stp != null ? { r2_score_to_par: r2stp } : {}),
      ...(r3stp != null ? { r3_score_to_par: r3stp } : {}),
      ...(r4stp != null ? { r4_score_to_par: r4stp } : {}),
    };
  });
  rows.sort((a, b) => b.x_score - a.x_score);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z, ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
