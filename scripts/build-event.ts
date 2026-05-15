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
import { computeXScore, computeSignal, computePurity } from './lib/xscore.js';
import type { LiveSG, Decomposition } from './lib/xscore.js';

interface Args {
  slug: string;
  phase: 'pre' | 'r1' | 'r2' | 'r3' | 'r4' | 'final';
  course: string;
  out: string;
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
  total: number; // score to par
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
  const { slug, phase, course, out } = parseArgs();
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

  // Load live stats if available (event_avg = cumulative through latest round)
  const liveCum = await loadJson<LiveStatsFile>(slug, phase, 'live-stats-event-avg');
  const liveR1 = await loadJson<LiveStatsFile>(slug, phase, 'live-stats-r1');
  const liveR2 = await loadJson<LiveStatsFile>(slug, phase, 'live-stats-r2');
  const liveR3 = await loadJson<LiveStatsFile>(slug, phase, 'live-stats-r3');
  const liveR4 = await loadJson<LiveStatsFile>(slug, phase, 'live-stats-r4');

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

  // Build rows for both datasets
  const roundOnlyRows = buildRows(roundPlayers, decompByDgId, decompByName, courseProfile);
  const cumulativeRows = buildRows(cumPlayers, decompByDgId, decompByName, courseProfile);

  // For pre-tournament: no live data — emit a single set sorted by L2+L3+L4 baseline
  const isPre = phase === 'pre' || (roundPlayers.length === 0 && cumPlayers.length === 0);
  let finalRoundOnly = roundOnlyRows;
  let finalCumulative = cumulativeRows;

  if (isPre) {
    console.log('Pre-tournament mode: building from decompositions only (Layer 1 = 0).\n');
    const preRows = decompPlayers.map((p) => {
      const decomp: Decomposition = {
        total_course_history_adjustment: p.total_course_history_adjustment ?? 0,
        total_fit_adjustment: p.total_fit_adjustment ?? 0,
        strokes_gained_category_adjustment: p.strokes_gained_category_adjustment ?? 0,
        major_adjustment: p.major_adjustment ?? 0,
      };
      const breakdown = computeXScore(null, decomp, courseProfile);
      const signal = computeSignal(breakdown.x_score);
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
  const header = [
    `// Generated by scripts/build-event.ts on ${new Date().toISOString()}`,
    `// Event: ${slug}, phase: ${phase}, course: ${course}`,
    `// Players: round=${finalRoundOnly.length}, cumulative=${finalCumulative.length}`,
    `// DO NOT EDIT BY HAND — re-run \`npm run build:event\` after pulling new data.`,
  ].join('\n');

  const body = [
    `import type { PlayerData } from '../types';`,
    ``,
    header,
    ``,
    `export const roundOnlyData: PlayerData[] = ${JSON.stringify(finalRoundOnly, null, 2)};`,
    ``,
    `export const cumulativeData: PlayerData[] = ${JSON.stringify(finalCumulative, null, 2)};`,
    ``,
  ].join('\n');

  await writeFile(outPath, body);
  console.log(`✅ Wrote src/data/${out}.ts (${finalRoundOnly.length} round / ${finalCumulative.length} cumulative)\n`);
}

function buildRows(
  livePlayers: LiveStatsPlayer[],
  decompByDgId: Map<number, DecompPlayer>,
  decompByName: Map<string, DecompPlayer>,
  course: typeof DEFAULT_LOW_PREDICTABILITY_COURSE
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
    };
  });
  rows.sort((a, b) => b.x_score - a.x_score);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z, ]/g, '').replace(/\s+/g, ' ').trim();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
