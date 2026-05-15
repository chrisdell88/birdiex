/**
 * Pull all relevant DataGolf data for the current PGA event.
 *
 * Usage:
 *   npx tsx scripts/pull-event.ts --slug pga-championship-2026 --phase pre
 *   npx tsx scripts/pull-event.ts --slug pga-championship-2026 --phase r1
 *   npx tsx scripts/pull-event.ts --slug pga-championship-2026 --phase r2
 *   ...
 *
 * Writes raw JSON to data/raw/<slug>/<phase>/. This directory is gitignored.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  getEventList,
  getPreTournament,
  getPlayerDecompositions,
  getInPlay,
  getLiveTournamentStats,
  getFieldUpdates,
  getMatchups,
  getOutrights,
  getDgRankings,
  getSkillDecompositions,
} from './lib/datagolf.js';

interface Args {
  slug: string;
  phase: 'pre' | 'r1' | 'r2' | 'r3' | 'r4' | 'final';
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const out: Partial<Args> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const val = args[i + 1];
    if (key === 'slug') out.slug = val;
    if (key === 'phase') out.phase = val as Args['phase'];
  }
  if (!out.slug || !out.phase) {
    console.error('Usage: pull-event --slug <event-slug> --phase <pre|r1|r2|r3|r4|final>');
    process.exit(1);
  }
  return out as Args;
}

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

async function dump(slug: string, phase: string, name: string, data: unknown) {
  const dir = join(PROJECT_ROOT, 'data', 'raw', slug, phase);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${name}.json`), JSON.stringify(data, null, 2));
  console.log(`  wrote data/raw/${slug}/${phase}/${name}.json`);
}

async function safe<T>(name: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`  ⚠️  ${name} failed: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  const { slug, phase } = parseArgs();
  console.log(`\n📡 Pulling DataGolf data for ${slug} / phase=${phase}\n`);

  // Always pull: field, event list, dg rankings (cheap context)
  console.log('Context endpoints:');
  const eventList = await safe('event-list', () => getEventList('pga'));
  if (eventList) await dump(slug, phase, 'event-list', eventList);

  const field = await safe('field-updates', () => getFieldUpdates('pga'));
  if (field) await dump(slug, phase, 'field-updates', field);

  const dgRankings = await safe('dg-rankings', () => getDgRankings());
  if (dgRankings) await dump(slug, phase, 'dg-rankings', dgRankings);

  const skillDecomp = await safe('skill-decompositions', () => getSkillDecompositions());
  if (skillDecomp) await dump(slug, phase, 'skill-decompositions', skillDecomp);

  // Always pull: pre-tournament + decompositions (need for L2/L3/L4)
  console.log('Model components:');
  const pre = await safe('pre-tournament', () => getPreTournament('pga'));
  if (pre) await dump(slug, phase, 'pre-tournament', pre);

  const decomp = await safe('player-decompositions', () => getPlayerDecompositions('pga'));
  if (decomp) await dump(slug, phase, 'player-decompositions', decomp);

  // Outrights — pull all markets
  console.log('Outright odds:');
  for (const market of ['win', 'top_5', 'top_10', 'top_20', 'make_cut'] as const) {
    const data = await safe(`outrights-${market}`, () => getOutrights(market, 'pga'));
    if (data) await dump(slug, phase, `outrights-${market}`, data);
  }

  // Live data only meaningful from R1 onward
  if (phase !== 'pre') {
    console.log('Live tournament stats:');
    // Cumulative track = accumulating SG totals across completed rounds.
    const eventCumulative = await safe('live-stats-event-cumulative', () =>
      getLiveTournamentStats('event_cumulative')
    );
    if (eventCumulative)
      await dump(slug, phase, 'live-stats-event-cumulative', eventCumulative);

    // Pull per-round breakdowns up through current phase
    const roundsToPull: Array<'1' | '2' | '3' | '4'> = [];
    if (phase === 'r1' || phase === 'r2' || phase === 'r3' || phase === 'r4' || phase === 'final')
      roundsToPull.push('1');
    if (phase === 'r2' || phase === 'r3' || phase === 'r4' || phase === 'final')
      roundsToPull.push('2');
    if (phase === 'r3' || phase === 'r4' || phase === 'final') roundsToPull.push('3');
    if (phase === 'r4' || phase === 'final') roundsToPull.push('4');

    for (const r of roundsToPull) {
      const data = await safe(`live-stats-r${r}`, () => getLiveTournamentStats(r));
      if (data) await dump(slug, phase, `live-stats-r${r}`, data);
    }

    const inPlay = await safe('in-play', () => getInPlay('pga'));
    if (inPlay) await dump(slug, phase, 'in-play', inPlay);

    // Matchup odds — CRITICAL to pull every round, DataGolf doesn't retain historical
    console.log('Matchup odds (CRITICAL — not retained historically):');
    for (const market of ['round_matchups', 'tournament_matchups', '3_balls'] as const) {
      const data = await safe(`matchups-${market}`, () => getMatchups(market, 'pga'));
      if (data) await dump(slug, phase, `matchups-${market}`, data);
    }
  }

  console.log(`\n✅ Done. Raw JSON in data/raw/${slug}/${phase}/\n`);
}

main().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
