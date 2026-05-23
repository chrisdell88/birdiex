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

// How long after a round transition we keep refreshing odds. ~6 hours
// covers "30 min after round-done through midnight ET" for typical 5-7pm
// ET round-ends without needing real timezone math.
const ACTIVE_WINDOW_MS = 6 * 60 * 60 * 1000;

const STATE_PATH = join(ROOT, 'src/data/auto-roll-state.json');

interface AutoRollState {
  /** ISO time of when auto-roll last recognized a round transition. */
  lastTransitionAt: string | null;
  /** The completed round number at that transition (0 = pre-tournament). */
  lastCompletedRoundAtTransition: number;
  /**
   * Best Bet count after the last refresh — Best Bet = matchup whose
   * X-Score edge ≥ venue floor. Notifications fire only when this count
   * increases (new Best Bets) — never on raw sportsbook matchup volume.
   */
  lastBestBetCount: number;
}

async function readState(): Promise<AutoRollState> {
  if (!existsSync(STATE_PATH)) {
    return { lastTransitionAt: null, lastCompletedRoundAtTransition: -1, lastBestBetCount: 0 };
  }
  const parsed = JSON.parse(await readFile(STATE_PATH, 'utf8'));
  // Migrate older state files to the new Best Bet count field.
  if (typeof parsed.lastBestBetCount !== 'number') parsed.lastBestBetCount = 0;
  delete parsed.lastMatchupCount;
  return parsed;
}

/**
 * Count current Best Bets by shelling out to scripts/count-best-bets.ts.
 * Separate process is intentional — guarantees a fresh module load so
 * we read the most recent files (Node caches dynamic imports otherwise).
 */
function countBestBets(): number {
  const out = execSync('npx tsx scripts/count-best-bets.ts', { cwd: ROOT, encoding: 'utf8' });
  const n = parseInt(out.trim(), 10);
  if (!Number.isFinite(n)) {
    console.error(`count-best-bets returned non-numeric: "${out}"`);
    return 0;
  }
  return n;
}

async function writeState(state: AutoRollState): Promise<void> {
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

function isInActiveWindow(state: AutoRollState): boolean {
  if (!state.lastTransitionAt) return false;
  const txAt = new Date(state.lastTransitionAt).getTime();
  return Date.now() - txAt < ACTIVE_WINDOW_MS;
}

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
  const state = await readState();
  console.log(`Config: picksRound=${picksRound} (R${currentCompleted} complete) | state: lastTx=${state.lastTransitionAt ?? '—'}`);

  // 2. Pull fresh DataGolf data for the current phase (cheap, gitignored)
  const currentPhase = currentCompleted === 0 ? 'pre' : `r${currentCompleted}`;
  exec(`npm run pull:event -- --slug ${SLUG} --phase ${currentPhase}`);

  // 3. Detect what the upstream says about round completion
  const players = await readInPlay(currentPhase);
  const detected = detectMaxCompletedRound(players);
  console.log(`DataGolf: max completed round = R${detected}`);

  // 4. Decide what to do.
  //
  // Three gates control whether the site actually updates:
  //   a) Auto-advance — DataGolf says a new round just finished
  //   b) Manual sync — user manually advanced picksRound, state hasn't
  //                    caught up yet. Treat as a transition.
  //   c) Active window — within ACTIVE_WINDOW_MS of last transition →
  //                      refresh odds in place.
  //
  // Anything else: exit no-op. NO files modified, NO commit, site stays
  // frozen on what the user last saw.

  const isAutoAdvance = detected > currentCompleted;
  const isManualSync = !isAutoAdvance && state.lastCompletedRoundAtTransition < currentCompleted;

  if (isAutoAdvance) {
    if (detected >= 4) {
      console.log('Tournament finished (R4 complete). Final refresh, then stop auto-roll.');
      await refreshCurrentRound(picksRound);
      state.lastTransitionAt = new Date().toISOString();
      state.lastCompletedRoundAtTransition = 4;
      state.lastBestBetCount = countBestBets();
      await writeState(state);
      return;
    }
    await doAutoAdvance(picksRound, detected);
    state.lastTransitionAt = new Date().toISOString();
    state.lastCompletedRoundAtTransition = detected;
    const newBestBets = countBestBets();
    state.lastBestBetCount = newBestBets;
    await writeState(state);
    // Fire round-picks notification ONLY if there are Best Bets to announce.
    if (newBestBets > 0) {
      sendNotifyOnTransition(detected + 1);
    } else {
      console.log(`Round advanced but 0 Best Bets at the venue threshold. No notification.`);
    }
    return;
  }

  if (isManualSync) {
    console.log(`Manual advance detected (state=R${state.lastCompletedRoundAtTransition}, config=R${currentCompleted}). Syncing state + entering active window.`);
    state.lastTransitionAt = new Date().toISOString();
    state.lastCompletedRoundAtTransition = currentCompleted;
    await writeState(state);
    await refreshCurrentRound(picksRound);
    const newBestBets = countBestBets();
    state.lastBestBetCount = newBestBets;
    await writeState(state);
    if (newBestBets > 0) {
      sendNotifyOnTransition(picksRound);
    } else {
      console.log(`Manual sync recorded but 0 Best Bets. No notification.`);
    }
    return;
  }

  if (isInActiveWindow(state)) {
    const ageMin = Math.round((Date.now() - new Date(state.lastTransitionAt!).getTime()) / 60000);
    console.log(`In active window (${ageMin} min since transition). Refreshing data.`);
    const prevCount = state.lastBestBetCount;
    await refreshCurrentRound(picksRound);
    const newCount = countBestBets();
    if (newCount > prevCount) {
      const delta = newCount - prevCount;
      console.log(`New Best Bets: ${prevCount} → ${newCount} (+${delta}). Sending Discord + email.`);
      state.lastBestBetCount = newCount;
      await writeState(state);
      sendNotifyOnNewBets(picksRound, delta);
    } else {
      state.lastBestBetCount = newCount;
      await writeState(state);
      console.log(`Best Bet count: ${prevCount} → ${newCount}. No notification.`);
    }
    return;
  }

  console.log('No round transition + not in active window. Site stays frozen. Exiting no-op.');
}

function sendNotifyOnTransition(newPicksRound: number): void {
  // Discord + email blast for a brand-new round of picks.
  try {
    exec(`npx tsx scripts/notify.ts --round ${newPicksRound} --mode round-picks`);
    console.log(`✓ notify (round-picks) sent for picksRound=${newPicksRound}`);
  } catch (e) {
    // Notification failure shouldn't break the auto-roll itself.
    console.error(`✖ notify failed: ${(e as Error).message}`);
  }
}

function sendNotifyOnNewBets(picksRound: number, newBetsAdded: number): void {
  // Discord-only ping when sportsbooks post additional matchups within the
  // active window. No email blast (would be spammy).
  try {
    exec(`npx tsx scripts/notify.ts --round ${picksRound} --mode new-bets --new-bets ${newBetsAdded}`);
    console.log(`✓ notify (new-bets) sent — ${newBetsAdded} new matchup(s) for R${picksRound}`);
  } catch (e) {
    console.error(`✖ notify (new-bets) failed: ${(e as Error).message}`);
  }
}

async function doAutoAdvance(currentPicks: number, detected: number): Promise<void> {
  const currentCompleted = currentPicks - 1;
  const currentPhase = currentCompleted === 0 ? 'pre' : `r${currentCompleted}`;
  const newCompleted = detected;
  const newPicks = newCompleted + 1;
  console.log(`Advancing: picksRound ${currentPicks} → ${newPicks}`);

  // Pull data for the newly-completed round if different phase
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

  // Discord + email blast for the new round's picks.
  sendNotifyOnTransition(newPicks);

  console.log(`Advance complete. Next cron will pull phase=${newPhase}.`);
}

main().catch((e) => {
  console.error('auto-roll failed:', e);
  process.exit(1);
});
