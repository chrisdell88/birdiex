#!/usr/bin/env tsx
/**
 * Build-time guard: every player record in every `<event>R<N>Data.ts`,
 * `<event>PreData.ts`, and `<event>SkillEstimates.ts` file MUST have the
 * required SG / X-Score fields populated. DataGolf provides this data
 * through every hole played; if a value is missing in our committed file,
 * that's a pipeline bug — not normal — and the build should fail loud
 * instead of silently rendering blanks.
 *
 * Rule (per Chris 2026-06-07): "there should never be anything missing
 * other than an outright winner odd."
 *
 * Required fields per player (when not pre-tournament):
 *   player_name, position, score_to_par,
 *   sg_ott, sg_app, sg_arg, sg_putt, sg_score_l1,
 *   course_history_l2, fit_adjustment, sg_category_adj,
 *   fit_plus_category_l3, major_adj_l4, x_score, signal, purity
 *
 * Pre-tournament data files (where live SG hasn't kicked in yet) get a
 * relaxed check — pre-data only requires player_name + BirdieX RTG-style
 * fields populated.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;
const DATA_DIR = join(PROJECT_ROOT, 'src/data');

const REQUIRED_LIVE = [
  'player_name',
  'position',
  'score_to_par',
  'sg_ott',
  'sg_app',
  'sg_arg',
  'sg_putt',
  'sg_score_l1',
  'course_history_l2',
  'fit_adjustment',
  'sg_category_adj',
  'fit_plus_category_l3',
  'major_adj_l4',
  'x_score',
  'signal',
  'purity',
] as const;

interface PlayerRecord {
  player_name?: string;
  position?: string;
  score_to_par?: number;
  sg_ott?: number;
  sg_app?: number;
  sg_arg?: number;
  sg_putt?: number;
  sg_score_l1?: number;
  course_history_l2?: number;
  fit_adjustment?: number;
  sg_category_adj?: number;
  fit_plus_category_l3?: number;
  major_adj_l4?: number;
  x_score?: number;
  signal?: string;
  purity?: string;
}

function isLiveDataFile(name: string): boolean {
  // Matches `<prefix>R<N>Data.ts`. PreData / SkillEstimates / Results /
  // Matchups / Outrights / dataGolfPredictability are different shapes.
  return /R\d+Data\.ts$/.test(name);
}

async function main() {
  const files = readdirSync(DATA_DIR).filter(isLiveDataFile);
  const failures: { file: string; player: string; missing: string[] }[] = [];

  for (const f of files) {
    const mod = await import(pathToFileURL(join(DATA_DIR, f)).href);
    // Both roundOnlyData and cumulativeData arrays need to pass.
    for (const exportName of ['roundOnlyData', 'cumulativeData']) {
      const arr = (mod as Record<string, unknown>)[exportName] as PlayerRecord[] | undefined;
      if (!Array.isArray(arr)) continue;
      for (const p of arr) {
        const missing = REQUIRED_LIVE.filter((k) => p[k] == null);
        if (missing.length > 0) {
          failures.push({
            file: `${f}::${exportName}`,
            player: p.player_name ?? '(no name)',
            missing,
          });
        }
      }
    }
  }

  if (failures.length > 0) {
    console.error('❌ FAIL: rankings data has missing required fields.');
    console.error('   Per Chris\'s rule: DataGolf should never be missing SG/X-Score data.');
    console.error('   If a field is null/undefined in a committed *Data.ts file, that\'s a');
    console.error('   pipeline bug — fix build-event.ts or the source pull, don\'t paper over.');
    console.error('');
    for (const f of failures.slice(0, 25)) {
      console.error(`  ${f.file} — ${f.player}`);
      console.error(`    missing: ${f.missing.join(', ')}`);
    }
    if (failures.length > 25) {
      console.error(`  ... and ${failures.length - 25} more violations.`);
    }
    process.exit(1);
  }

  console.log(`✅ Rankings data completeness check passed.`);
  console.log(`   ${files.length} *RNData.ts files scanned; every player has all required fields.\n`);
}

main().catch((e) => {
  console.error('verify-rankings-data-completeness crashed:', e);
  process.exit(1);
});
