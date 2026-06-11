/**
 * Convert a raw DataGolf matchup-odds pull into the frontend's
 * MatchupOddsEntry[] format.
 *
 * Usage:
 *   npx tsx scripts/build-matchups.ts --slug pga-championship-2026 --phase r1 \
 *     --market round_matchups --export r2MatchupOddsData --out pgaChampMatchups
 *
 * The frontend (MatchupsView / OddsTablePage) pairs these odds entries with the
 * player X Scores at render time to produce the actual picks/edges/tiers — so
 * this script only needs to emit the odds, not the picks.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// ============================================================================
// LINE-SHOPPING RULE (enforced every pull)
// ----------------------------------------------------------------------------
// Odds must NEVER be overwritten with a worse price. Each rebuild MERGES the
// newly-pulled odds with the existing committed file, keeping whichever side
// (p1 or p2, per book) has the lower stake-to-win-1 — i.e. the most favorable
// line ever seen for the bettor across the whole window. This is the
// "best odds seen" principle that the grading record depends on.
// ============================================================================

/** American odds → stake required to win 1 unit. Lower = more favorable. */
function stakeToWin1(odds: string | undefined): number {
  if (!odds) return Infinity;
  const n = parseInt(odds, 10);
  if (!Number.isFinite(n) || n === 0) return Infinity;
  return n < 0 ? Math.abs(n) / 100 : 100 / n;
}

/** Pick the better (lower stake-to-win-1) of two American odds strings. */
function betterOdds(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return stakeToWin1(a) <= stakeToWin1(b) ? a : b;
}

/** Canonical key for a matchup pair (order-independent). */
function pairKey(p1: string, p2: string): string {
  return [p1, p2].sort().join('||');
}

interface Args {
  slug: string;
  phase: string;
  market: string;
  export: string;
  out: string;
  /** OPTIONAL guard: the round we EXPECT the DataGolf response to be for.
   *  If set + DataGolf returns a different `round_num`, we abort instead
   *  of silently writing wrong-round data into the named file. This is
   *  the test that would have caught the 2026-06-07 silent R3→R4
   *  transition (DataGolf swapped which round its matchups endpoint
   *  returned, and we wrote R4 odds into memorialR3Matchups.ts). */
  expectRound?: string;
}

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const o: Partial<Args> = { market: 'round_matchups' };
  for (let i = 0; i < a.length; i += 2) {
    const k = a[i].replace(/^--/, '') as keyof Args;
    o[k] = a[i + 1];
  }
  for (const k of ['slug', 'phase', 'export', 'out'] as const) {
    if (!o[k]) {
      console.error(`Missing --${k}`);
      process.exit(1);
    }
  }
  return o as Args;
}

interface RawMatchup {
  p1_player_name: string;
  p2_player_name: string;
  odds: Record<string, { p1: string; p2: string }>;
}

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

async function main() {
  const { slug, phase, market, export: exportName, out, expectRound } = parseArgs();
  const rawPath = join(PROJECT_ROOT, 'data', 'raw', slug, phase, `matchups-${market}.json`);
  const raw = JSON.parse(await readFile(rawPath, 'utf8'));
  const list: RawMatchup[] = raw.match_list ?? [];

  // ─── Round-validation guard ────────────────────────────────────────────────
  // DataGolf's `market=round_matchups` endpoint silently transitions which
  // round it returns when sportsbooks shift their lines (e.g. R3→R4 once
  // R4 odds post). If the caller specified --expectRound, abort on mismatch
  // — much louder than writing wrong-round data into a named file.
  if (expectRound != null) {
    const dgRound = raw.round_num;
    if (String(dgRound) !== String(expectRound)) {
      console.error(
        `❌ Round mismatch: --expectRound ${expectRound} but DataGolf response has round_num=${dgRound}.`,
      );
      console.error(
        `   Refusing to write ${out}.ts. The caller (build-ticker.ts / auto-roll.ts) should`,
      );
      console.error(
        `   pull this round explicitly, or rotate to writing the file that matches DataGolf's round.`,
      );
      process.exit(2);
    }
  }

  // Keep only p1/p2 per book — some books quote a 3-way line with a `tie`
  // price; the model bets 2-way H2H (ties void), so drop the tie field.
  interface Entry {
    p1_player_name: string;
    p2_player_name: string;
    odds: Record<string, { p1?: string; p2?: string }>;
  }
  // SUSPICIOUS-LINE FLAGGING (policy set by Chris 2026-06-11: FLAG ONLY,
  // NEVER auto-drop). A book line that diverges wildly from DataGolf's fair
  // line on the same matchup is probably in-play contamination (the Memorial
  // R4 phantoms: PointsBet -525/-625 vs DG fair ~+100, merged during the
  // weather suspension). But a legitimately lopsided -375 next to a -350
  // fair line is FINE — so the pipeline never removes lines on its own; it
  // logs them loudly and Chris adjudicates per case.
  const impliedProb = (odds: string | undefined): number | null => {
    const n = parseInt(odds ?? '', 10);
    if (!Number.isFinite(n) || n === 0) return null;
    return n < 0 ? Math.abs(n) / (Math.abs(n) + 100) : 100 / (n + 100);
  };
  const fresh: Entry[] = list.map((m) => ({
    p1_player_name: m.p1_player_name,
    p2_player_name: m.p2_player_name,
    odds: Object.fromEntries(
      Object.entries(m.odds ?? {}).map(([book, line]) => {
        const l = line as Record<string, string>;
        return [book, { p1: l.p1, p2: l.p2 }];
      })
    ),
  }));
  // Flag pass — compare every real book line to DataGolf's fair line.
  let flagged = 0;
  for (const e of fresh) {
    const fair = (e.odds as Record<string, { p1?: string; p2?: string }>)['datagolf'];
    const fairP1 = impliedProb(fair?.p1);
    if (fairP1 == null) continue;
    for (const [book, line] of Object.entries(e.odds)) {
      if (book === 'datagolf') continue;
      const bookP1 = impliedProb((line as { p1?: string }).p1);
      if (bookP1 == null) continue;
      if (Math.abs(bookP1 - fairP1) > 0.25) {
        flagged++;
        console.warn(
          `🚩 SUSPICIOUS LINE (kept — flag-only policy): ${e.p1_player_name} vs ${e.p2_player_name} ` +
          `@ ${book} ${(line as { p1?: string }).p1}/${(line as { p2?: string }).p2} ` +
          `vs DataGolf fair ${fair?.p1}/${fair?.p2} — implied prob differs by ` +
          `${Math.round(Math.abs(bookP1 - fairP1) * 100)} points. Likely in-play contamination; Chris adjudicates.`
        );
      }
    }
  }
  if (flagged > 0) {
    console.warn(`🚩 ${flagged} suspicious book line(s) flagged above — NONE removed (flag-only policy).`);
  }

  // Active player set: who shows up in TODAY's DataGolf response. Pairings
  // involving anyone NOT in this set are dropped from the merge, because
  // DataGolf stops returning a pairing once a player gets cut / WD'd. The
  // line-shopping merge below used to PERSIST those stale pre-cut pairings
  // forever — that's the 2026-06-07 bug Chris caught (Rose vs Fowler still
  // listed as a R3 matchup hours after Fowler missed the cut).
  const activePlayers = new Set<string>();
  for (const m of list) {
    if (m.p1_player_name) activePlayers.add(m.p1_player_name);
    if (m.p2_player_name) activePlayers.add(m.p2_player_name);
  }

  // ─── Line-shopping merge with the existing committed file (if it exists) ───
  // For each (pair, book): keep whichever side has the lower stake-to-win-1
  // (= more favorable price for the bettor). Pairings only in the existing
  // file are preserved IF BOTH PLAYERS ARE STILL IN THE CURRENT RESPONSE
  // (still active). When DataGolf drops a pairing because a player got cut
  // or WD'd, we drop it too. Pairings only in the new pull are added.
  const outPath = join(PROJECT_ROOT, 'src', 'data', `${out}.ts`);
  const existingByKey = new Map<string, Entry>();
  if (existsSync(outPath)) {
    try {
      const mod = await import(pathToFileURL(outPath).href);
      const existingArr: Entry[] | undefined = mod[exportName];
      if (Array.isArray(existingArr)) {
        for (const e of existingArr) {
          // Drop entries where either player isn't in the current pull —
          // they're cut/WD/no-longer-offered. Sportsbooks don't book bets
          // on those pairings anymore so we shouldn't show them either.
          if (!activePlayers.has(e.p1_player_name) || !activePlayers.has(e.p2_player_name)) continue;
          existingByKey.set(pairKey(e.p1_player_name, e.p2_player_name), e);
        }
      }
    } catch {
      // Existing file unreadable — treat as no prior data. Fresh wins.
    }
  }

  const mergedByKey = new Map<string, Entry>(existingByKey);
  let bookEntriesImproved = 0;
  let bookEntriesAdded = 0;
  let newPairings = 0;
  for (const ne of fresh) {
    const k = pairKey(ne.p1_player_name, ne.p2_player_name);
    const ee = mergedByKey.get(k);
    if (!ee) {
      mergedByKey.set(k, ne);
      newPairings++;
      continue;
    }
    // Existing pair found. Walk every book that appears in either side;
    // align p1/p2 in case DataGolf returned the names in the opposite order.
    const sameOrder = ee.p1_player_name === ne.p1_player_name;
    const allBooks = new Set([
      ...Object.keys(ee.odds || {}),
      ...Object.keys(ne.odds || {}),
    ]);
    const mergedOdds: Record<string, { p1?: string; p2?: string }> = {};
    for (const book of allBooks) {
      const old = ee.odds?.[book] ?? {};
      const cand = ne.odds?.[book] ?? {};
      const candP1 = sameOrder ? cand.p1 : cand.p2;
      const candP2 = sameOrder ? cand.p2 : cand.p1;
      const p1Before = old.p1, p2Before = old.p2;
      const p1After = betterOdds(p1Before, candP1);
      const p2After = betterOdds(p2Before, candP2);
      mergedOdds[book] = { p1: p1After, p2: p2After };
      if (!p1Before && p1After) bookEntriesAdded++;
      else if (p1Before && p1After && p1After !== p1Before) bookEntriesImproved++;
      if (!p2Before && p2After) bookEntriesAdded++;
      else if (p2Before && p2After && p2After !== p2Before) bookEntriesImproved++;
    }
    mergedByKey.set(k, {
      p1_player_name: ee.p1_player_name,
      p2_player_name: ee.p2_player_name,
      odds: mergedOdds,
    });
  }
  // Stable output ordering: alphabetical by p1 then p2.
  const entries = Array.from(mergedByKey.values()).sort((a, b) =>
    a.p1_player_name === b.p1_player_name
      ? a.p2_player_name.localeCompare(b.p2_player_name)
      : a.p1_player_name.localeCompare(b.p1_player_name)
  );

  const header = [
    `import type { MatchupOddsEntry } from '../types';`,
    ``,
    `// Generated by scripts/build-matchups.ts on ${new Date().toISOString()}`,
    `// Event: ${slug}, phase: ${phase}, market: ${market}, round: ${raw.round_num ?? '?'}`,
    `// ${entries.length} matchups (merged best-odds-ever-seen). DO NOT EDIT BY HAND.`,
    ``,
    `export const ${exportName}: MatchupOddsEntry[] = ${JSON.stringify(entries, null, 2)};`,
    ``,
  ].join('\n');

  await writeFile(outPath, header);
  console.log(
    `✅ Wrote src/data/${out}.ts — ${entries.length} matchups (${market}, round ${raw.round_num}). ` +
    `Line-shopping merge: +${newPairings} new pairings, ${bookEntriesAdded} new book-lines, ${bookEntriesImproved} improved book-lines.`
  );
}

main().catch((e) => {
  console.error('build-matchups failed:', e);
  process.exit(1);
});
