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
import { pathToFileURL } from 'node:url';

const ROOT = new URL('..', import.meta.url).pathname;
// Mutable — initialized from env for backward compatibility, then OVERRIDDEN
// at startup by resolveCurrentEvent() (scripts/lib/currentEvent.ts) so a
// stale workflow-YAML env can never point us at last week's event. See the
// Memorial → RBC Canadian handoff failure (June 2026).
let SLUG = process.env.SLUG ?? 'cj-cup-byron-nelson-2026';
let COURSE = process.env.COURSE ?? 'tpc-craig-ranch';
let SLUG_PREFIX = process.env.SLUG_PREFIX ?? 'cjCup';

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

async function readEventConfig(): Promise<{ picksRound: number; isComplete: boolean; slug: string }> {
  const raw = await readFile(join(ROOT, 'src/config/event.ts'), 'utf8');
  const m = raw.match(/picksRound:\s*(\d+)/);
  if (!m) throw new Error('Could not find picksRound in event.ts');
  const ic = raw.match(/isComplete:\s*(true|false)/);
  // Look up slug from the data-file import path (e.g., '../data/memorialR1Data').
  // We map data file prefix back to slug via eventSchedule.
  const importMatch = raw.match(/from '\.\.\/data\/([a-zA-Z]+)(?:Pre|R\d)Data'/);
  const prefix = importMatch ? importMatch[1] : '';
  let slug = '';
  try {
    const sched = await import(pathToFileURL(join(ROOT, 'src/data/eventSchedule.ts')).href);
    const found = sched.EVENT_SCHEDULE.find((e: { dataPrefix: string; slug: string }) => e.dataPrefix === prefix);
    slug = found?.slug ?? '';
  } catch { /* schedule file may not exist yet on legacy branches */ }
  return {
    picksRound: parseInt(m[1], 10),
    isComplete: ic ? ic[1] === 'true' : false,
    slug,
  };
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
      // Matches the MAIN rankings import — `from '../data/<prefix><Pre|R{n}>Data'`.
      // Generic camelCase prefix [a-zA-Z]+ covers every event slug (csc, cjCup,
      // pgaChamp, masters, memorial, rbcCanadian, etc.) without needing to
      // update this list when a new tournament is added. `.replace` (no /g)
      // hits the FIRST occurrence, which is always the main rankings import on
      // line 14; the frozen pre-tournament import below it stays untouched.
      re: /from '\.\.\/data\/[a-zA-Z]+(Pre|R\d)Data'/,
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

  // ─── Suspension-era cleanup ───────────────────────────────────────────────
  // On round transition, strip out the special fields that were added for
  // the R3-suspension scenario. They become stale (and break the build) when
  // a new round starts: aliased imports for next-round + r3-picks rankings,
  // currentEvent fields that point at the OLD round's data, and the manual
  // tickerTitleOverride. These all default to "absent" for a normal event.
  // Strip aliased memorial imports + multi-line ones + r3PicksRankings imports
  content = content.replace(/^import \{[^}]*as memorial[A-Z][^}]*\} from '\.\.\/data\/memorial[^']+';\n/gm, '');
  content = content.replace(/^import \{\n(?:\s*\w+ as \w+,?\n)+\} from '\.\.\/data\/memorial[^']+';\n/gm, '');
  content = content.replace(/^import \{[^}]*r3PicksRankings[^}]*\} from '\.\.\/data\/memorial[^']+';\n/gm, '');
  // Strip suspension-era fields from currentEvent literal
  content = content.replace(/^\s*(nextRoundMatchups|nextRoundNumber|nextRoundRankings|nextRoundRankingsRound|r3PicksRankingsCumulative|r3PicksRankingsRound|tickerTitleOverride):\s*[^,\n]*,\s*(?:\/\/[^\n]*)?\n/gm, '');
  // Strip orphan comments that referred to the removed fields
  content = content.replace(/^\s*\/\/[^\n]*tickerTitleOverride[^\n]*\n/gm, '');

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

  // Each step is independently best-effort: one missing raw file (e.g.
  // matchups aren't pulled in the 'pre' phase) must not abort the whole
  // refresh — that hard-crash is what killed the 2026-06-11 run mid-flight.
  const safeExec = (label: string, cmd: string) => {
    try {
      exec(cmd);
    } catch (e) {
      console.error(`✖ ${label} failed (non-fatal — refresh continues): ${(e as Error).message}`);
    }
  };
  safeExec('build:event', `npm run build:event -- --slug ${SLUG} --phase ${phase} --course ${COURSE} --out ${roundDataOut}`);
  safeExec('build-matchups', `npx tsx scripts/build-matchups.ts --slug ${SLUG} --phase ${phase} --market round_matchups --export ${matchupsExport} --out ${matchupsOut}`);
  safeExec('build-outrights', `npx tsx scripts/build-outrights.ts --slug ${SLUG} --phase ${phase} --export ${outrightsExport} --out ${outrightsOut}`);
  safeExec('build-skill-estimates', `npx tsx scripts/build-skill-estimates.ts --slug ${SLUG} --phase ${phase} --export skillEstimatesData --out ${SLUG_PREFIX}SkillEstimates`);
  // Headshots: pull from ESPN's current leaderboard, name-match to our field,
  // merge into the cumulative map. Best-effort — ESPN may not have switched
  // to this tournament yet (typically updates ~24 hrs before tee-off). Players
  // not yet covered fall back to initials avatars.
  safeExec('build-headshots', `npx tsx scripts/build-headshots.ts --players ${roundDataOut} --out headshots`);
}

/**
 * If currentEvent.isComplete=true and the next scheduled event in
 * src/data/eventSchedule.ts has its pre-data files present, swap event.ts
 * to point at the next event + reset state + clear ticker. Returns true
 * if a switch happened (caller exits without running round refresh).
 *
 * Refuses to switch if the next event's pre-data files don't exist —
 * we never want to ship a half-staged event.
 */
async function attemptEventSwitch(): Promise<boolean> {
  const { isComplete, slug } = await readEventConfig();
  if (!isComplete) return false;

  const sched = await import(
    pathToFileURL(join(ROOT, 'src/data/eventSchedule.ts')).href
  );
  const next = sched.nextEvent(slug);
  if (!next) {
    console.log('Current event is complete and no next event scheduled. No-op.');
    return false;
  }

  const prefix = next.dataPrefix;
  const required = [
    `src/data/${prefix}PreData.ts`,
    `src/data/${prefix}R1Outrights.ts`,
    `src/data/${prefix}R1Matchups.ts`,
    `src/data/${prefix}SkillEstimates.ts`,
  ];
  for (const f of required) {
    if (!existsSync(join(ROOT, f))) {
      console.log(`Event switch blocked: ${f} missing. Pre-stage this event before its predecessor ends.`);
      return false;
    }
  }

  console.log(`Switching event: ${slug} → ${next.slug}`);
  // Rewrite event.ts from a template
  const eventTs = `/**
 * Current event configuration — the single source of truth for which
 * tournament/round the app is showing.
 *
 * Auto-switched by scripts/auto-roll.ts on ${new Date().toISOString()}.
 * To advance a ROUND: this file gets auto-patched by auto-roll.
 * To override: edit by hand + commit.
 */
import type { PlayerData, MatchupOddsEntry, OutrightEntry, PlayerSkillEstimate } from '../types';
import { roundOnlyData, cumulativeData, generatedAt } from '../data/${prefix}PreData';
import { roundOnlyData as preTournamentRoundOnly } from '../data/${prefix}PreData';
import { r1MatchupOddsData } from '../data/${prefix}R1Matchups';
import { r1OutrightsData } from '../data/${prefix}R1Outrights';
import { skillEstimatesData } from '../data/${prefix}SkillEstimates';
import { tickerGeneratedAt } from '../data/ticker';
import { floorForEvent, type EventId } from './venues';

export interface CurrentEvent {
  eventId: EventId;
  name: string;
  course: string;
  isMajor: boolean;
  predictability: number;
  recommendedFloor: number;
  recommendedFloorLabel: string;
  picksRound: number;
  isComplete: boolean;
  headerBanner: string;
  dataUpdatedAt: string;
  rankingsRound: PlayerData[];
  rankingsCumulative: PlayerData[];
  preTournamentRankings: PlayerData[];
  matchups: MatchupOddsEntry[];
  outrights: OutrightEntry[];
  skillEstimates: PlayerSkillEstimate[];
}

const EVENT_ID: EventId = '${next.eventId}';
const VENUE_INFO = floorForEvent(EVENT_ID);

export const currentEvent: CurrentEvent = {
  eventId: EVENT_ID,
  name: '${next.name}',
  course: VENUE_INFO.course,
  isMajor: ${next.isMajor},
  predictability: VENUE_INFO.predictability,
  recommendedFloor: VENUE_INFO.floor,
  recommendedFloorLabel: VENUE_INFO.label,
  picksRound: 1,
  isComplete: false,
  headerBanner: 'PRE-TOURNAMENT · ROUND 1 PICKS',
  dataUpdatedAt: new Date(generatedAt).getTime() > new Date(tickerGeneratedAt).getTime() ? generatedAt : tickerGeneratedAt,
  rankingsRound: roundOnlyData,
  rankingsCumulative: cumulativeData,
  preTournamentRankings: preTournamentRoundOnly,
  matchups: r1MatchupOddsData,
  outrights: r1OutrightsData,
  skillEstimates: skillEstimatesData,
};
`;
  await writeFile(join(ROOT, 'src/config/event.ts'), eventTs);

  // Reset state for new event
  await writeFile(STATE_PATH, JSON.stringify({
    lastTransitionAt: null,
    lastCompletedRoundAtTransition: 0,
    lastBestBetCount: 0,
  }, null, 2) + '\n');

  // Clear ticker
  const tickerStub = `// Placeholder. ticker-refresh workflow rebuilds with R1 tee times.

export interface TickerEntry {
  player: string;
  teeTime: string;
  startHole: number;
  score: number | null;
  pos: string;
  thru: number | null;
}

export const tickerRound = 1;
export const tickerData: TickerEntry[] = [];
`;
  await writeFile(join(ROOT, 'src/data/ticker.ts'), tickerStub);

  // Update workflow env blocks. We sed-style the SLUG/COURSE/SLUG_PREFIX
  // lines in datagolf-pull.yml and SLUG in ticker-refresh.yml.
  for (const [path, replacements] of Object.entries({
    '.github/workflows/datagolf-pull.yml': [
      [/(^  SLUG:\s*).*$/m, `$1${next.slug}`],
      [/(^  COURSE:\s*).*$/m, `$1${next.courseKey}`],
      [/(^  SLUG_PREFIX:\s*).*$/m, `$1${prefix}`],
    ],
    '.github/workflows/ticker-refresh.yml': [
      [/(^  SLUG:\s*).*$/m, `$1${next.slug}`],
      // SLUG_PREFIX MUST stay in sync — build-ticker.ts uses it to write
      // the right event's matchups/outrights files. Missing this line
      // caused the 2026-06-04→06 silent-pollution bug.
      [/(^  SLUG_PREFIX:\s*).*$/m, `$1${prefix}`],
    ],
  })) {
    const full = join(ROOT, path);
    let raw = await readFile(full, 'utf8');
    for (const [re, sub] of replacements as Array<[RegExp, string]>) {
      raw = raw.replace(re, sub);
    }
    await writeFile(full, raw);
  }

  console.log(`✅ Event switch complete: now configured for ${next.name}.`);
  console.log('Exiting. Next auto-roll run will operate on the new event.');
  return true;
}

async function main(): Promise<void> {
  // -1. Resolve the CURRENT event from the committed config (event.ts →
  //     eventSchedule.ts) and override any stale workflow-YAML env. This is
  //     what prevents the "workflow still points at last week's slug" class
  //     of failure from ever freezing the site again.
  const { resolveWithOverride } = await import(
    pathToFileURL(join(ROOT, 'scripts/lib/currentEvent.ts')).href
  );
  const identity = await resolveWithOverride({ slug: SLUG, courseKey: COURSE, dataPrefix: SLUG_PREFIX });
  if (identity.slug) SLUG = identity.slug;
  if (identity.courseKey) COURSE = identity.courseKey;
  if (identity.dataPrefix) SLUG_PREFIX = identity.dataPrefix;
  console.log(`Operating on event: slug=${SLUG} course=${COURSE} prefix=${SLUG_PREFIX}`);

  // 0. Event switch check (before anything else). If currentEvent.isComplete
  //    and a next scheduled event exists with pre-staged data, swap event.ts
  //    + workflows + state, then exit.
  if (await attemptEventSwitch()) return;

  // 1. Read current state
  const { picksRound, isComplete } = await readEventConfig();
  // Already-complete guard. If the event is finished and attemptEventSwitch()
  // above found no staged next event, there is nothing to refresh. Without
  // this, every subsequent cron tick falls through to detection — where
  // `detected R4 > currentCompleted R3` re-enters the finished-branch, re-runs
  // grade + refreshCurrentRound, and REWRITES the committed announcement
  // snapshots (R3Data / R4Matchups) that grading depends on. (Observed on RBC
  // Canadian: R3Data churned for 2 days post-event.) No-op instead; the only
  // thing that should wake a complete event is attemptEventSwitch firing.
  if (isComplete) {
    console.log('Event already complete and no next event staged — no-op (nothing to refresh on a finished event).');
    return;
  }
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

  // 3b. STALE-FEED GUARD: between events DataGolf's in-play endpoint keeps
  //     serving the PREVIOUS tournament's final leaderboard until the new
  //     one tees off. Signature: every row finished (round>=4, thru>=18)
  //     while our config says we're early in an event. Without this guard
  //     the detector reads "R4 complete" on day one of a new tournament and
  //     instantly kills it (final-refresh + complete). Treat as no-op.
  // Stale if ANY row reports a round more than one ahead of what our config
  // says is complete — a feed can never legitimately jump ahead like that
  // (rounds complete one at a time). every()-based detection misses CUT/WD
  // rows whose round is null, which is exactly how the first version of this
  // guard failed live on 2026-06-11 (Memorial R4 leftovers nearly marked the
  // day-one RBC Canadian complete).
  const feedAhead = players.some((p) => (p.round ?? 0) > currentCompleted + 1);
  if (feedAhead) {
    console.warn(
      `⚠️  in-play feed reports rounds ahead of R${currentCompleted + 1} but config says only R${currentCompleted} ` +
      `is complete — this is the PREVIOUS event's leftover feed. No-op until the new event's live data appears.`
    );
    return;
  }

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
      console.log('Tournament finished (R4 complete). Grading R4, flipping isComplete, final refresh.');

      // GRADE R4 FIRST — before refreshCurrentRound mutates the data files.
      // This was the gap that left Charles Schwab AND Memorial R4 ungraded:
      // this branch refreshed data but never called grade-round and never
      // flipped isComplete, so the Results page froze and the eventSchedule
      // auto-switch (which keys on isComplete) never fired.
      //
      // Grade against the COMMITTED <prefix>R4Matchups + <prefix>R3Data as
      // they exist right now (≈ what's deployed). NOTE: these drift from the
      // announcement snapshot via live refreshes — the full fix is writing
      // frozen *Snapshot.ts files at each transition. Until then this is the
      // best automated grade; re-grade against the transition commit in git
      // history if the published count disagrees.
      // Pull R4 live stats FIRST. grade-round reads
      // data/raw/<slug>/r4/live-stats-r4.json — which only doAutoAdvance
      // pulls (its normal-advance path). The finished branch skipped this,
      // so the R4 grade threw ENOENT and silently never produced
      // <prefix>R4Results — the event went "complete" with an ungraded final
      // round. Hit live for BOTH the RBC Canadian Open AND the U.S. Open
      // (2026-06). Mirrors the pull at the top of doAutoAdvance().
      try {
        exec(`npm run pull:event -- --slug ${SLUG} --phase r4`);
      } catch (e) {
        console.error(`✖ R4 pull failed (grade will likely fail): ${(e as Error).message}`);
      }
      try {
        exec(
          `npx tsx scripts/grade-round.ts --slug ${SLUG} --round 4 --picks-phase r3 ` +
          `--picks-matchups ${SLUG_PREFIX}R4Matchups --results-phase r4 ` +
          `--xscores ${SLUG_PREFIX}R3Data --out ${SLUG_PREFIX}R4Results`
        );
      } catch (e) {
        console.error(`✖ R4 grade-round failed (continuing — grade manually): ${(e as Error).message}`);
      }

      // Flip isComplete in event.ts so the UI shows the COMPLETE state and
      // the next cron firing triggers attemptEventSwitch() to the next
      // scheduled event.
      try {
        const evPath = join(ROOT, 'src/config/event.ts');
        let ev = await readFile(evPath, 'utf8');
        ev = ev.replace(/isComplete:\s*false,/, 'isComplete: true,');
        ev = ev.replace(/headerBanner:\s*'[^']*',/, "headerBanner: 'TOURNAMENT COMPLETE',");
        await writeFile(evPath, ev);
        console.log('✓ event.ts flipped to isComplete: true.');
      } catch (e) {
        console.error(`✖ failed to flip isComplete: ${(e as Error).message}`);
      }

      await refreshCurrentRound(picksRound);
      state.lastTransitionAt = new Date().toISOString();
      state.lastCompletedRoundAtTransition = 4;
      state.lastBestBetCount = countBestBets();
      await writeState(state);
      return;
    }
    await doAutoAdvance(picksRound, detected);
    const prevBb = state.lastBestBetCount;
    state.lastTransitionAt = new Date().toISOString();
    state.lastCompletedRoundAtTransition = detected;
    state.lastBestBetCount = countBestBets();
    await writeState(state);
    // notify.ts will gate on Best Bet count internally — safe to call.
    callNotify(detected + 1, 'round-picks', prevBb);
    return;
  }

  if (isManualSync) {
    console.log(`Manual advance detected (state=R${state.lastCompletedRoundAtTransition}, config=R${currentCompleted}). Syncing state + entering active window.`);
    const prevBb = state.lastBestBetCount;
    state.lastTransitionAt = new Date().toISOString();
    state.lastCompletedRoundAtTransition = currentCompleted;
    await writeState(state);
    await refreshCurrentRound(picksRound);
    state.lastBestBetCount = countBestBets();
    await writeState(state);
    callNotify(picksRound, 'round-picks', prevBb);
    return;
  }

  if (isInActiveWindow(state)) {
    const ageMin = Math.round((Date.now() - new Date(state.lastTransitionAt!).getTime()) / 60000);
    console.log(`In active window (${ageMin} min since transition). Refreshing data.`);
    const prevCount = state.lastBestBetCount;
    await refreshCurrentRound(picksRound);
    const newCount = countBestBets();
    state.lastBestBetCount = newCount;
    await writeState(state);
    callNotify(picksRound, 'new-bets', prevCount);
    return;
  }

  console.log('No round transition + not in active window. Site stays frozen. Exiting no-op.');
}

/**
 * Write a 'pending-notify' marker file. Workflow reads this AFTER
 * successfully committing + pushing the data and only then fires
 * notify. Guarantees: site shows new data BEFORE users get pinged.
 *
 * Stored under data/ which is gitignored, so the marker never enters
 * source control.
 */
function callNotify(picksRound: number, mode: 'round-picks' | 'new-bets', previousBbCount: number): void {
  const path = join(ROOT, 'data', '.pending-notify.json');
  const payload = { picksRound, mode, previousBbCount, queuedAt: new Date().toISOString() };
  try {
    // Ensure data/ exists.
    execSync('mkdir -p data', { cwd: ROOT });
    execSync(`cat > "${path}" <<'NOTIFY_EOF'\n${JSON.stringify(payload, null, 2)}\nNOTIFY_EOF`, { cwd: ROOT });
    console.log(`✓ queued notify (mode=${mode}, picksRound=${picksRound}, prev=${previousBbCount}). Workflow will fire it after a successful push.`);
  } catch (e) {
    console.error(`✖ failed to queue notify: ${(e as Error).message}`);
  }
}

/**
 * Round-transition checklist. EVERY surface that must update when a
 * round completes. Adding a surface? Add it here AND in CLAUDE.md.
 *
 *   1. Round data file        — cjCup<R{N}>Data.ts via build:event
 *   2. Matchups for next round — cjCup<R{N+1}>Matchups.ts
 *   3. Outrights                — cjCup<R{N+1}>Outrights.ts
 *   4. Skill estimates          — cjCupSkillEstimates.ts (post-cut field shrinks)
 *   5. Graded results           — cjCup<R{N}>Results.ts via grade-round
 *   6. Ticker                   — src/data/ticker.ts (tee times + scores)
 *   7. event.ts config          — picksRound, banner, imports
 *   8. auto-roll-state.json     — lastTransitionAt, lastBestBetCount
 *   9. Notify Discord + email   — gated on Best Bets via scripts/notify.ts
 *
 * If you skip any of these the public site goes stale. No exceptions.
 */
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
  // Refresh headshots — see refreshCurrentRound() for rationale.
  exec(`npx tsx scripts/build-headshots.ts --players ${roundDataOut} --out headshots`);

  // Step 5: grade the round that just finished (Best Bets land in Results page).
  // We do NOT publish H2H matchups for Round 1 (the pre-tournament phase only
  // produces rankings/outrights), so there are no R1 bets to grade. The first
  // gradeable round is R2 — skip grading for anything below that.
  if (newCompleted >= 2) {
    // picksPhase is the phase whose X scores drove the picks (= previous phase),
    // xscores file is the round data file from that previous phase.
    const prevCompleted = newCompleted - 1; // round that produced the picks for what just ran
    const picksPhase = `r${prevCompleted}`;
    const xscoresFile = `${SLUG_PREFIX}R${prevCompleted}Data`;
    // CRITICAL: source picks from the COMMITTED <prefix>R<N>Matchups.ts file
    // (the canonical pairings users saw and bet on), NOT from the raw JSON
    // pull that gets overwritten with the NEXT round's pairings at each
    // refresh. Without this, R<N> gets graded against R<N+1>'s pairings.
    const picksMatchupsFile = `${SLUG_PREFIX}R${newCompleted}Matchups`;
    try {
      exec(`npx tsx scripts/grade-round.ts --slug ${SLUG} --round ${newCompleted} --picks-phase ${picksPhase} --picks-matchups ${picksMatchupsFile} --results-phase ${newPhase} --xscores ${xscoresFile} --out ${SLUG_PREFIX}R${newCompleted}Results`);
    } catch (e) {
      // Grading is best-effort — bad odds data or skipped matchups shouldn't
      // block the advance. Log + continue.
      console.error(`✖ grade-round failed for R${newCompleted}: ${(e as Error).message}`);
    }
  } else {
    console.log(`Skipping grade-round for R${newCompleted} — no H2H matchups are published for Round 1.`);
  }

  // Step 6: rebuild the ticker for the new picks round.
  try {
    exec(`npx tsx scripts/build-ticker.ts --slug ${SLUG} --phase ${newPhase} --round ${newPicks}`);
  } catch (e) {
    console.error(`✖ build-ticker failed: ${(e as Error).message}`);
  }

  await patchEventConfig({
    picksRound: newPicks,
    banner: `R${newCompleted} FINAL · ROUND ${newPicks} PICKS`,
    roundDataFile: roundDataOut,
    matchupsFile: matchupsOut,
    matchupsExport,
    outrightsFile: outrightsOut,
    outrightsExport,
  });

  // Workflow no longer carries per-round env vars — phase is derived from
  // src/config/event.ts every cron firing. Nothing to patch in the YAML.

  // NOTE: notification is queued by the caller (main) via callNotify() AFTER
  // this returns, so the Discord/email blast only fires once the workflow has
  // committed + pushed the new data. Do not notify from here.

  console.log(`Advance complete. Next cron derives phase=${newPhase} from event.ts.`);
}

main().catch((e) => {
  console.error('auto-roll failed:', e);
  process.exit(1);
});
