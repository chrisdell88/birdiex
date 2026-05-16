/**
 * One-command per-round update orchestrator.
 *
 * Runs the full data pipeline for a completed round, in order, stopping on the
 * first failure:
 *   1. pull-event       — pull DataGolf data for the round
 *   2. build-event      — X Scores (round-only + cumulative)
 *   3. build-matchups   — next round's H2H matchups   (skipped after R4)
 *   4. grade-round      — grade the round's picks      (skipped after R1)
 *   5. build-headshots  — refresh the headshot map
 *   6. build-ticker     — next round's tee-time ticker (skipped after R4)
 *
 * After it finishes, update src/config/event.ts (picksRound, data imports,
 * banner, lastUpdated) and the Results events registry, then build / lint /
 * verify / ship.
 *
 * Usage (after round 2 of the PGA Championship):
 *   npx tsx scripts/update-round.ts --slug pga-championship-2026 --round 2 \
 *     --course aronimink --prefix pgaChamp
 */
import { spawnSync } from 'node:child_process';

interface Args {
  slug: string;
  round: string;
  course: string;
  prefix: string;
}

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const o: Record<string, string> = {};
  for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, '')] = a[i + 1];
  for (const k of ['slug', 'round', 'course', 'prefix']) {
    if (!o[k]) { console.error(`Missing --${k}`); process.exit(1); }
  }
  return o as unknown as Args;
}

function run(label: string, script: string, args: string[]) {
  console.log(`\n▶ ${label}`);
  const res = spawnSync('npx', ['tsx', `scripts/${script}`, ...args], {
    stdio: 'inherit',
    cwd: new URL('..', import.meta.url).pathname,
  });
  if (res.status !== 0) {
    console.error(`\n✗ ${label} failed — stopping. Fix the error and re-run.`);
    process.exit(1);
  }
}

function main() {
  const { slug, round, course, prefix } = parseArgs();
  const n = Number(round);
  const phase = `r${n}`;
  const FINAL_ROUND = 4;

  console.log(`\n=== Updating ${slug} — round ${n} ===`);

  run('1/6  Pull DataGolf data', 'pull-event.ts', ['--slug', slug, '--phase', phase]);

  run('2/6  Build X Scores', 'build-event.ts', [
    '--slug', slug, '--phase', phase, '--course', course, '--out', `${prefix}R${n}Data`,
  ]);

  if (n < FINAL_ROUND) {
    run(`3/6  Build round-${n + 1} matchups`, 'build-matchups.ts', [
      '--slug', slug, '--phase', phase, '--market', 'round_matchups',
      '--export', `r${n + 1}MatchupOddsData`, '--out', `${prefix}R${n + 1}Matchups`,
    ]);
  } else {
    console.log('\n▶ 3/6  Build matchups — skipped (final round, no next round)');
  }

  if (n >= 2) {
    run(`4/6  Grade round ${n}`, 'grade-round.ts', [
      '--slug', slug, '--round', String(n),
      '--picks-phase', `r${n - 1}`, '--results-phase', phase,
      '--xscores', `${prefix}R${n - 1}Data`, '--out', `${prefix}R${n}Results`,
    ]);
  } else {
    console.log('\n▶ 4/6  Grade round — skipped (round 1 has no picks to grade)');
  }

  run('5/6  Refresh headshots', 'build-headshots.ts', [
    '--players', `${prefix}R${n}Data`, '--out', 'headshots',
  ]);

  if (n < FINAL_ROUND) {
    run(`6/6  Build round-${n + 1} ticker`, 'build-ticker.ts', [
      '--slug', slug, '--phase', phase, '--round', String(n + 1),
    ]);
  } else {
    console.log('\n▶ 6/6  Build ticker — skipped (final round)');
  }

  console.log(`\n✅ Round ${n} data pipeline complete.\n`);
  console.log('Next — finish the round by hand (small, one-time per round):');
  console.log(`  1. Update src/config/event.ts: data imports -> ${prefix}R${n}Data /`);
  console.log(`     ${prefix}R${n < FINAL_ROUND ? n + 1 : n}Matchups, picksRound, headerBanner, lastUpdated.`);
  console.log(`  2. Add ${prefix}R${n}Results to the Results page events registry.`);
  if (n === FINAL_ROUND) {
    console.log('  3. POST-TOURNAMENT: flip this event to "complete" in the Results');
    console.log('     events registry; it becomes a past-tournament look-back.');
  }
  console.log('  4. npm run build && npm run lint, verify in browser, commit, push.\n');
}

main();
