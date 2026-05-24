/**
 * Grade a completed round's H2H matchup picks.
 *
 * Each recommended pick = one 1-unit bet, graded at the BEST odds available
 * across real sportsbooks (line shopping — the model's edge). DataGolf's own
 * "datagolf" model line is excluded (not a real book).
 *
 * Usage (grading round 2 — picks came from R1 X Scores, odds pulled in r1 phase,
 * outcomes from the r2 live stats):
 *   npx tsx scripts/grade-round.ts --slug pga-championship-2026 --round 2 \
 *     --picks-phase r1 --results-phase r2 --xscores pgaChampR1Data --out pgaChampR2Results
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

interface Args {
  slug: string;
  round: string;
  'picks-phase': string;
  'results-phase': string;
  xscores: string;
  out: string;
}

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const o: Record<string, string> = {};
  for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, '')] = a[i + 1];
  for (const k of ['slug', 'round', 'picks-phase', 'results-phase', 'xscores', 'out']) {
    if (!o[k]) { console.error(`Missing --${k}`); process.exit(1); }
  }
  return o as unknown as Args;
}

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

// DataGolf's "datagolf" entry is a model fair-line, not a bookable sportsbook.
const EXCLUDED_BOOKS = new Set(['datagolf']);
// Map DataGolf book keys -> the app's Sportsbook display names.
const BOOK_NAMES: Record<string, string> = {
  bet365: 'bet365', betcris: 'Betcris', unibet: 'Unibet', betonline: 'BetOnline',
  bovada: 'Bovada', pinnacle: 'Pinnacle', draftkings: 'DraftKings', fanduel: 'FanDuel',
  betmgm: 'BetMGM', caesars: 'Caesars', pointsbet: 'PointsBet',
};

/**
 * American odds -> stake required to win 1 unit ("-145"->1.45, "+120"->0.833).
 * Staking convention (matches the Masters results): every bet is sized to win
 * 1 unit. Win => +1.00. Loss => -(stake). Push => 0.
 */
function stakeToWin1(odds: string): number {
  const n = parseInt(odds, 10);
  return n < 0 ? Math.abs(n) / 100 : 100 / n;
}

function side(signal: string): 'BUY' | 'FADE' | 'OTHER' {
  if (/BUY/i.test(signal)) return 'BUY';
  if (/FADE|SELL/i.test(signal)) return 'FADE';
  return 'OTHER';
}

function bucket(pickSig: string, oppSig: string): string {
  const sides = [side(pickSig), side(oppSig)];
  const hasBuy = sides.includes('BUY');
  const hasFade = sides.includes('FADE');
  if (hasBuy && hasFade) return 'BUY vs FADE';
  if (hasBuy) return 'BUY vs OTHER';
  if (hasFade) return 'FADE vs OTHER';
  return 'OTHER vs OTHER';
}

function tierOf(edge: number): { tier: string; ok: boolean } {
  if (edge >= 1.95) return { tier: 'BEST BET', ok: true };
  if (edge >= 1.45) return { tier: 'STRONG PLAY', ok: true };
  if (edge >= 0.95) return { tier: 'LEAN', ok: true };
  return { tier: 'NO PLAY', ok: false };
}

async function main() {
  const args = parseArgs();
  const round = Number(args.round);

  // X Scores that drove the picks for this round. MUST be cumulative —
  // that's the dataset the public Matchups page uses to compute and
  // display Best Bets. Grading with round-only would give different
  // edges than what users actually saw and bet on.
  const xsMod = await import(
    pathToFileURL(join(PROJECT_ROOT, 'src', 'data', `${args.xscores}.ts`)).href
  );
  const xsList: Array<{ player_name: string; x_score: number; signal: string }> =
    xsMod.cumulativeData ?? xsMod.roundOnlyData;
  const xs = new Map(xsList.map((p) => [p.player_name, p]));

  // Tier-based bet sizing (Scheme D) — single source of truth in src/lib/sizing.ts.
  const { betUnits, betStake } = await import(
    pathToFileURL(join(PROJECT_ROOT, 'src', 'lib', 'sizing.ts')).href
  );

  // Matchup odds for this round (pulled the phase before the round).
  const matchRaw = JSON.parse(
    await readFile(
      join(PROJECT_ROOT, 'data', 'raw', args.slug, args['picks-phase'], 'matchups-round_matchups.json'),
      'utf8'
    )
  );

  // Round outcomes — each player's score for the graded round.
  const resRaw = JSON.parse(
    await readFile(
      join(PROJECT_ROOT, 'data', 'raw', args.slug, args['results-phase'], `live-stats-r${round}.json`),
      'utf8'
    )
  );
  const roundScore = new Map<string, number>();
  for (const p of resRaw.live_stats ?? []) {
    if (typeof p.round === 'number') roundScore.set(p.player_name, p.round);
  }

  // DataGolf's round_matchups can list the same pairing more than once.
  // Dedup by pick::opponent (matches the site's MatchupsView) so a pairing is
  // graded once — keeping the better-priced copy.
  const byPair = new Map<string, Record<string, unknown>>();
  let skipped = 0;

  for (const m of matchRaw.match_list ?? []) {
    const a = xs.get(m.p1_player_name);
    const b = xs.get(m.p2_player_name);
    if (!a || !b) { skipped++; continue; }

    const edge = Math.abs(a.x_score - b.x_score);
    const { tier, ok } = tierOf(edge);
    if (!ok) continue; // NO PLAY — not a bet

    const pickIsP1 = a.x_score >= b.x_score;
    const pick = pickIsP1 ? a : b;
    const opp = pickIsP1 ? b : a;
    const pickKey = pickIsP1 ? 'p1' : 'p2';

    // Best odds for the pick across real books = the line with the smallest
    // stake-to-win-1 (i.e. the most favorable American price).
    let bestOdds: string | null = null;
    let bestBook = '';
    let bestStake = Infinity;
    for (const [bookKey, line] of Object.entries(m.odds ?? {})) {
      if (EXCLUDED_BOOKS.has(bookKey)) continue;
      const odds = (line as Record<string, string>)[pickKey];
      if (!odds || odds === '0') continue;
      const st = stakeToWin1(odds);
      if (st < bestStake) {
        bestStake = st;
        bestOdds = odds;
        bestBook = BOOK_NAMES[bookKey] ?? bookKey;
      }
    }
    if (bestOdds == null) { skipped++; continue; }

    const pickScore = roundScore.get(pick.player_name);
    const oppScore = roundScore.get(opp.player_name);
    if (pickScore == null || oppScore == null) { skipped++; continue; }

    // Lower score wins the round. Ties void (push).
    let result: 'W' | 'L' | 'P';
    if (pickScore < oppScore) result = 'W';
    else if (pickScore > oppScore) result = 'L';
    else result = 'P';

    // Keep this pairing only if it's new or better-priced than what we have.
    const key = `${pick.player_name}::${opp.player_name}`;
    const existing = byPair.get(key);
    if (existing && stakeToWin1(existing.bestOdds as string) <= bestStake) continue;

    byPair.set(key, {
      id: 0, round,
      pick: pick.player_name,
      opponent: opp.player_name,
      edge: Math.round(edge * 10000) / 10000,
      tier,
      bucket: bucket(pick.signal, opp.signal),
      bestOdds,
      book: bestBook,
      betType: 'H2H',
      pickScore, oppScore,
      result,
      units: Math.round(betUnits(result, bestOdds, edge) * 100) / 100,
      dataSet: 'cumulative',
    });
  }

  // Tier sizing (Scheme D): win = +M, loss = −(M × stake), push = 0.
  const bets = [...byPair.values()];
  bets.forEach((b, i) => { b.id = i + 1; });

  let totalStaked = 0; // sum of stakes over settled (W/L) bets — pushes excluded
  for (const b of bets) {
    if (b.result !== 'P') totalStaked += betStake(b.result, b.bestOdds, b.edge);
  }

  const w = bets.filter((b) => b.result === 'W').length;
  const l = bets.filter((b) => b.result === 'L').length;
  const p = bets.filter((b) => b.result === 'P').length;
  const totalUnits = bets.reduce((s, b) => s + (b.units as number), 0);
  const roi = totalStaked > 0 ? (totalUnits / totalStaked) * 100 : 0;

  const summary = {
    round,
    bets: bets.length,
    record: `${w}-${l}-${p}`,
    wins: w, losses: l, pushes: p,
    units: Math.round(totalUnits * 100) / 100,
    staked: Math.round(totalStaked * 100) / 100,
    roi: Math.round(roi * 10) / 10,
  };

  const file = [
    `import type { BetRecord } from '../types';`,
    ``,
    `// Generated by scripts/grade-round.ts on ${new Date().toISOString()}`,
    `// ${args.slug} round ${round} — H2H, graded at best odds across real books.`,
    `// Summary: ${summary.record}, ${summary.units > 0 ? '+' : ''}${summary.units}u, ${summary.roi > 0 ? '+' : ''}${summary.roi}% ROI (${summary.bets} bets).`,
    `// DO NOT EDIT BY HAND.`,
    ``,
    `export const r${round}Results: BetRecord[] = ${JSON.stringify(bets, null, 2)};`,
    ``,
    `export const r${round}Summary = ${JSON.stringify(summary, null, 2)};`,
    ``,
  ].join('\n');

  await writeFile(join(PROJECT_ROOT, 'src', 'data', `${args.out}.ts`), file);

  // Also compute the Best-Bets-only summary at the venue floor. This is
  // the ONLY number safe to quote to users / reports / notifications —
  // the raw line above includes scored-only picks below the venue floor.
  const { recommendedFloorForPredictability } = await import(
    pathToFileURL(join(PROJECT_ROOT, 'src', 'lib', 'sizing.ts')).href
  );
  const { COURSES, DEFAULT_LOW_PREDICTABILITY_COURSE } = await import(
    pathToFileURL(join(PROJECT_ROOT, 'scripts', 'lib', 'courses.ts')).href
  );
  // Venue lookup by slug fragment — best-effort. Falls back to a generic
  // low-predictability floor if we don't have a venue profile.
  type CourseProfile = { predictability: number };
  type CourseMap = Record<string, CourseProfile>;
  const coursesMap = COURSES as CourseMap;
  const slugLower = args.slug.toLowerCase();
  const venueKey = Object.keys(coursesMap).find((k) => slugLower.includes(k)) ?? '';
  const profile = (venueKey ? coursesMap[venueKey] : (DEFAULT_LOW_PREDICTABILITY_COURSE as CourseProfile));
  const floor: number = recommendedFloorForPredictability(profile.predictability);

  const bb = bets.filter((b) => b.edge >= floor);
  const bbW = bb.filter((b) => b.result === 'W').length;
  const bbL = bb.filter((b) => b.result === 'L').length;
  const bbP = bb.filter((b) => b.result === 'P').length;
  const bbUnits = bb.reduce((s, b) => s + (b.units as number), 0);

  console.log(`✅ Wrote src/data/${args.out}.ts`);
  console.log(`   ALL graded picks (edge ≥ 0.95) — ${summary.bets} bets · ${summary.record} · ${summary.units > 0 ? '+' : ''}${summary.units}u`);
  console.log(`   BEST BETS only (edge ≥ ${floor.toFixed(2)}) — ${bb.length} bets · ${bbW}-${bbL}-${bbP} · ${bbUnits > 0 ? '+' : ''}${Math.round(bbUnits * 100) / 100}u  ← public-facing record`);
  console.log(`   (${skipped} matchups skipped: no X Score / odds / score)`);
}

main().catch((e) => { console.error('grade-round failed:', e); process.exit(1); });
