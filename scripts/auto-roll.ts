#!/usr/bin/env tsx
/**
 * Auto-roll: when DataGolf reports the currently-configured round is done,
 * advance the site's picks to the next round. Idempotent — safe to run on
 * any cron cadence. No-op when no round has finished since the last run.
 *
 * Flow:
 *   1. Read src/config/event.ts → current picksRound.
 *   2. Pull latest DataGolf data for the current phase.
 *   3. Read data/raw/<slug>/<phase>/in-play.json. For each non-cut player,
 *      compute their "completed round" from (round, thru). The MIN across
 *      active players is the round we can confidently call finished.
 *   4. If detected > current_completed:
 *        - Pull data for the new phase if different.
 *        - Build the new round data file (cjCup<R{N}>Data.ts).
 *        - Build matchups + outrights + skill estimates for the new picks
 *          round (cjCup<R{N+1}>Matchups.ts etc).
 *        - Patch src/config/event.ts AND .github/workflows/datagolf-pull.yml
 *          to point at the new files / picksRound / banner.
 *      Else: refresh in place (existing files, current phase).
 *
 * Env overrides (defaults baked in for CJ Cup Byron Nelson 2026):
 *   SLUG          tournament slug
 *   COURSE        course slug (must exist in scripts/lib/courses.ts)
 *   SLUG_PREFIX   prefix for data files (e.g. cjCup, pgaChamp)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const SLUG = process.env.SLUG ?? 'cj-cup-byron-nelson-2026';
const COURSE = process.env.COURSE ?? 'tpc-craig-ranch';
const SLUG_PREFIX = process.env.SLUG_PREFIX ?? 'cjCup';

interface InPlayPlayer {
  dg_id: number;
  player_name: string;
  round: number | null;
  thru: number | null;
  current_pos: string;
}

function exec(cmd: string): void {
  console.log(`▶ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

async function readEventConfig(): Promise<{ picksRound: number }> {
  const raw = await readFile(join(ROOT, 'src/config/event.ts'), 'utf8');
  const m = raw.match(/picksRound:\s*(\d+)/);
  if (!m) throw new Error('Could not find picksRound in event.ts');
  return { picksRound: parseInt(m[1], 10) };
}

async function readInPlay(phase: string): Promise<InPlayPlayer[]> {
  const path = join(ROOT, 'data/raw', SLUG, phase, 'in-play.json');
  if (!existsSync(path)) return [];
  const raw = JSON.parse(await readFile(path, 'utf8'));
  return raw.data ?? [];
}

/**
 * For each active (non-CUT/WD/MDF) player, compute their completed round
 * from (round, thru). The fully-completed round = MIN across all active
 * players (everyone needs to have finished it for it to count as done).
 */
function detectMaxCompletedRound(players: InPlayPlayer[]): number {
  const active = players.filter((p) => {
    const pos = (p.current_pos ?? '').toUpperCase();
    return pos !== 'CUT' && pos !== 'WD' && pos !== 'MDF' && pos !== '';
  });
  if (active.length === 0) return 0;
  const perPlayer = active.map((p) => {
    if (p.round == null) return 0;
    if (p.thru == null || p.thru < 18) return Math.max(0, p.round - 1);
    return p.round;
  });
  return Math.min(...perPlayer);
}

/**
 * Patch src/config/event.ts to point at the new round/picks files. Uses
 * stable regex anchors. Throws if any expected substitution fails — better
 * to abort than silently leave the config in an inconsistent state.
 */
async function patchEventConfig(args: {
  picksRound: number;
  banner: string;
  roundDataFile: string;
  matchupsFile: string;
  matchupsExport: string;
  outrightsFile: string;
  outrightsExport: string;
}): Promise<void> {
  const path = join(ROOT, 'src/config/event.ts');
  let content = await readFile(path, 'utf8');

  const subs: { re: RegExp; to: string; label: string }[] = [
    {
      re: /from '\.\.\/data\/(cjCup|pgaChamp|masters)R\dData'/,
      to: `from '../data/${args.roundDataFile}'`,
      label: 'roundData import',
    },
    {
      re: /import \{ r\d(MatchupOddsData) \} from '\.\.\/data\/[^']+'/,
      to: `import { ${args.matchupsExport} } from '../data/${args.matchupsFile}'`,
      label: 'matchups import',
    },
    {
      re: /import \{ r\d(OutrightsData) \} from '\.\.\/data\/[^']+'/,
      to: `import { ${args.outrightsExport} } from '../data/${args.outrightsFile}'`,
      label: 'outrights import',
    },
    {
      re: /picksRound:\s*\d+,/,
      to: `picksRound: ${args.picksRound},`,
      label: 'picksRound field',
    },
    {
      re: /headerBanner:\s*'[^']*',/,
      to: `headerBanner: '${args.banner}',`,
      label: 'headerBanner field',
    },
    {
      re: /matchups:\s*r\dMatchupOddsData,/,
      to: `matchups: ${args.matchupsExport},`,
      label: 'matchups field',
    },
    {
      re: /outrights:\s*r\dOutrightsData,/,
      to: `outrights: ${args.outrightsExport},`,
      label: 'outrights field',
    },
  ];

  for (const { re, to, label } of subs) {
    if (!re.test(content)) throw new Error(`patchEventConfig: could not find ${label}`);
    content = content.replace(re, to);
  }

  await writeFile(path, content);
}

/**
 * Patch the workflow YAML env block so the next cron firing pulls the new
 * phase / writes to the new file names.
 */
async function patchWorkflowEnv(args: {
  phase: string;
  roundDataOut: string;
  matchupsOut: string;
  matchupsExport: string;
  outrightsOut: string;
  outrightsExport: string;
}): Promise<void> {
  const path = join(ROOT, '.github/workflows/datagolf-pull.yml');
  let content = await readFile(path, 'utf8');

  const subs: { re: RegExp; to: string; label: string }[] = [
    { re: /PHASE:\s*\S+/,             to: `PHASE: ${args.phase}`,                   label: 'PHASE' },
    { re: /ROUND_DATA_OUT:\s*\S+/,    to: `ROUND_DATA_OUT: ${args.roundDataOut}`,   label: 'ROUND_DATA_OUT' },
    { re: /MATCHUPS_OUT:\s*\S+/,      to: `MATCHUPS_OUT: ${args.matchupsOut}`,      label: 'MATCHUPS_OUT' },
    { re: /MATCHUPS_EXPORT:\s*\S+/,   to: `MATCHUPS_EXPORT: ${args.matchupsExport}`,label: 'MATCHUPS_EXPORT' },
    { re: /OUTRIGHTS_OUT:\s*\S+/,     to: `OUTRIGHTS_OUT: ${args.outrightsOut}`,    label: 'OUTRIGHTS_OUT' },
    { re: /OUTRIGHTS_EXPORT:\s*\S+/,  to: `OUTRIGHTS_EXPORT: ${args.outrightsExport}`,label: 'OUTRIGHTS_EXPORT' },
  ];

  for (const { re, to, label } of subs) {
    if (!re.test(content)) throw new Error(`patchWorkflowEnv: could not find ${label}`);
    content = content.replace(re, to);
  }

  await writeFile(path, content);
}

async function refreshCurrentRound(picksRound: number): Promise<void> {
  const completedRound = picksRound - 1;
  const phase = completedRound === 0 ? 'pre' : `r${completedRound}`;
  const roundDataOut = completedRound === 0 ? `${SLUG_PREFIX}PreData` : `${SLUG_PREFIX}R${completedRound}Data`;
  const matchupsOut = `${SLUG_PREFIX}R${picksRound}Matchups`;
  const matchupsExport = `r${picksRound}MatchupOddsData`;
  const outrightsOut = `${SLUG_PREFIX}R${picksRound}Outrights`;
  const outrightsExport = `r${picksRound}OutrightsData`;

  exec(`npm run build:event -- --slug ${SLUG} --phase ${phase} --course ${COURSE} --out ${roundDataOut}`);
  exec(`npx tsx scripts/build-matchups.ts --slug ${SLUG} --phase ${phase} --market round_matchups --export ${matchupsExport} --out ${matchupsOut}`);
  exec(`npx tsx scripts/build-outrights.ts --slug ${SLUG} --phase ${phase} --export ${outrightsExport} --out ${outrightsOut}`);
  exec(`npx tsx scripts/build-skill-estimates.ts --slug ${SLUG} --phase ${phase} --export skillEstimatesData --out ${SLUG_PREFIX}SkillEstimates`);
}

async function main(): Promise<void> {
  // 1. Read current state
  const { picksRound } = await readEventConfig();
  const currentCompleted = picksRound - 1;
  console.log(`Config: picksRound=${picksRound} (latest completed=R${currentCompleted})`);

  // 2. Pull fresh data for the current phase
  const currentPhase = currentCompleted === 0 ? 'pre' : `r${currentCompleted}`;
  exec(`npm run pull:event -- --slug ${SLUG} --phase ${currentPhase}`);

  // 3. Detect what the upstream says about round completion
  const players = await readInPlay(currentPhase);
  const detected = detectMaxCompletedRound(players);
  console.log(`Detected max completed round from DataGolf: R${detected}`);

  if (detected <= currentCompleted) {
    console.log('No round transition. Refreshing current files in place.');
    await refreshCurrentRound(picksRound);
    return;
  }

  // 4. Round transition. If the tournament is over (R4 done), do a final
  // refresh and stop.
  if (detected >= 4) {
    console.log('Tournament finished (R4 complete). Doing final refresh; auto-roll done.');
    await refreshCurrentRound(picksRound);
    return;
  }

  const newCompleted = detected;
  const newPicks = newCompleted + 1;
  console.log(`Advancing: picksRound ${picksRound} → ${newPicks}`);

  // Pull data for the newly-completed round if it differs
  const newPhase = `r${newCompleted}`;
  if (newPhase !== currentPhase) {
    exec(`npm run pull:event -- --slug ${SLUG} --phase ${newPhase}`);
  }

  const roundDataOut = `${SLUG_PREFIX}R${newCompleted}Data`;
  const matchupsOut = `${SLUG_PREFIX}R${newPicks}Matchups`;
  const matchupsExport = `r${newPicks}MatchupOddsData`;
  const outrightsOut = `${SLUG_PREFIX}R${newPicks}Outrights`;
  const outrightsExport = `r${newPicks}OutrightsData`;

  exec(`npm run build:event -- --slug ${SLUG} --phase ${newPhase} --course ${COURSE} --out ${roundDataOut}`);
  exec(`npx tsx scripts/build-matchups.ts --slug ${SLUG} --phase ${newPhase} --market round_matchups --export ${matchupsExport} --out ${matchupsOut}`);
  exec(`npx tsx scripts/build-outrights.ts --slug ${SLUG} --phase ${newPhase} --export ${outrightsExport} --out ${outrightsOut}`);
  exec(`npx tsx scripts/build-skill-estimates.ts --slug ${SLUG} --phase ${newPhase} --export skillEstimatesData --out ${SLUG_PREFIX}SkillEstimates`);

  await patchEventConfig({
    picksRound: newPicks,
    banner: `R${newCompleted} FINAL · ROUND ${newPicks} PICKS`,
    roundDataFile: roundDataOut,
    matchupsFile: matchupsOut,
    matchupsExport,
    outrightsFile: outrightsOut,
    outrightsExport,
  });

  await patchWorkflowEnv({
    phase: newPhase,
    roundDataOut,
    matchupsOut,
    matchupsExport,
    outrightsOut,
    outrightsExport,
  });

  console.log(`Advance complete. Next cron will pull phase=${newPhase}.`);
}

main().catch((e) => {
  console.error('auto-roll failed:', e);
  process.exit(1);
});
