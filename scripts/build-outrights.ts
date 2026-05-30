/**
 * Build the outright winner odds file for the frontend.
 *
 * Reads data/raw/<slug>/<phase>/outrights-win.json and emits typed TS.
 * For each player, computes the BEST odds across the real sportsbooks
 * (excluding DataGolf's model odds) and the book that posted them.
 *
 * Usage:
 *   npx tsx scripts/build-outrights.ts --slug cj-cup-byron-nelson-2026 \
 *     --phase r1 --export r1OutrightsData --out cjCupR1Outrights
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

interface Args {
  slug: string;
  phase: string;
  export: string;
  out: string;
}

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const o: Record<string, string> = {};
  for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, '')] = a[i + 1];
  for (const k of ['slug', 'phase', 'export', 'out'] as const) {
    if (!o[k]) {
      console.error('Usage: build-outrights --slug <event> --phase <phase> --export <varName> --out <filename>');
      process.exit(1);
    }
  }
  return o as unknown as Args;
}

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

// Books we surface on the public Odds page. Order = display order. DataGolf
// excluded — it's the model's own odds, not a real book.
const REAL_BOOKS = [
  'bet365',
  'betmgm',
  'caesars',
  'draftkings',
  'fanduel',
  'pinnacle',
  'pointsbet',
  'betonline',
  'bovada',
  'unibet',
  'betcris',
] as const;

/** American odds → implied payout multiplier (for picking the best). */
function payoutMultiplier(odds: string): number {
  const n = parseInt(odds, 10);
  if (!Number.isFinite(n) || n === 0) return -Infinity;
  // Higher = better for the bettor.
  return n < 0 ? 100 / Math.abs(n) : n / 100;
}

interface RawEntry {
  player_name: string;
  dg_id: number;
  datagolf?: { baseline?: string; baseline_history_fit?: string };
  [key: string]: unknown;
}

async function main() {
  const args = parseArgs();
  const path = join(PROJECT_ROOT, 'data', 'raw', args.slug, args.phase, 'outrights-win.json');
  const raw = JSON.parse(await readFile(path, 'utf8')) as { odds: RawEntry[] };
  if (!Array.isArray(raw.odds)) {
    throw new Error(`Expected odds array in ${path}`);
  }

  const built = raw.odds.map((entry) => {
    const allBooks: Record<string, string> = {};
    for (const book of REAL_BOOKS) {
      const v = entry[book];
      if (typeof v === 'string' && v.length > 0) allBooks[book] = v;
    }
    let bestBook = '';
    let bestOdds = '';
    let bestPayout = -Infinity;
    for (const [book, odds] of Object.entries(allBooks)) {
      const p = payoutMultiplier(odds);
      if (p > bestPayout) {
        bestPayout = p;
        bestBook = book;
        bestOdds = odds;
      }
    }
    return {
      player_name: entry.player_name,
      dg_id: entry.dg_id,
      bestOdds,
      bestBook,
      dgOdds: entry.datagolf?.baseline_history_fit ?? entry.datagolf?.baseline ?? null,
      allBooks,
    };
  });

  // Defensive guard: if every entry came back with NO sportsbook odds,
  // DataGolf was likely between book updates (e.g. books briefly closed
  // overnight between rounds). Skip writing — keep the existing good file
  // in place and let the next cron run rebuild against fresh data. Exit
  // cleanly so the rest of the refresh pipeline (matchups, ticker, etc.)
  // continues normally.
  const populatedCheck = built.filter((e) => Object.keys(e.allBooks).length > 0);
  if (built.length > 0 && populatedCheck.length === 0) {
    console.warn(
      `⚠️  build-outrights: all ${built.length} entries have empty allBooks ` +
      `— DataGolf returned no book lines this pull. Leaving src/data/${args.out}.ts ` +
      `untouched. Will retry on the next cron tick.`
    );
    return;
  }

  // ─── Line-shopping merge with the existing committed file (if it exists) ──
  // Odds must NEVER be overwritten with a worse price. For every player, walk
  // each book in the union of (existing, new) and keep whichever odds value
  // has the HIGHER payout multiplier (more favorable for the bettor). Then
  // recompute bestOdds/bestBook from the merged allBooks map.
  const outPath = join(PROJECT_ROOT, 'src', 'data', `${args.out}.ts`);
  interface Built {
    player_name: string;
    dg_id: number;
    bestOdds: string;
    bestBook: string;
    dgOdds: string | null;
    allBooks: Record<string, string>;
  }
  const existingById = new Map<number, Built>();
  if (existsSync(outPath)) {
    try {
      const mod = await import(pathToFileURL(outPath).href);
      const existingArr: Built[] | undefined = mod[args.export];
      if (Array.isArray(existingArr)) {
        for (const e of existingArr) existingById.set(e.dg_id, e);
      }
    } catch {
      // Existing file unreadable — proceed with fresh data only.
    }
  }
  const mergedById = new Map<number, Built>(existingById);
  let improvedBookLines = 0;
  let addedBookLines = 0;
  let newPlayers = 0;
  for (const ne of built) {
    const old = mergedById.get(ne.dg_id);
    if (!old) {
      mergedById.set(ne.dg_id, ne);
      if (Object.keys(ne.allBooks).length > 0) newPlayers++;
      continue;
    }
    const mergedBooks: Record<string, string> = { ...(old.allBooks ?? {}) };
    for (const [book, newLine] of Object.entries(ne.allBooks)) {
      const oldLine = mergedBooks[book];
      if (!oldLine) {
        mergedBooks[book] = newLine;
        addedBookLines++;
        continue;
      }
      // Keep the more favorable price (HIGHER payout multiplier).
      if (payoutMultiplier(newLine) > payoutMultiplier(oldLine)) {
        mergedBooks[book] = newLine;
        improvedBookLines++;
      }
    }
    // Recompute best book/odds from merged map.
    let bestBook = '';
    let bestOdds = '';
    let bestPayout = -Infinity;
    for (const [book, odds] of Object.entries(mergedBooks)) {
      const p = payoutMultiplier(odds);
      if (p > bestPayout) { bestPayout = p; bestBook = book; bestOdds = odds; }
    }
    mergedById.set(ne.dg_id, {
      player_name: ne.player_name,
      dg_id: ne.dg_id,
      bestOdds,
      bestBook,
      // Keep the most recent dgOdds (model line) — that one IS supposed to refresh.
      dgOdds: ne.dgOdds ?? old.dgOdds,
      allBooks: mergedBooks,
    });
  }
  // Replace built with merged dataset for the rest of the pipeline below.
  built.length = 0;
  built.push(...mergedById.values());

  // Drop entries with no book odds at all (long shots / WD / not lined).
  // Keeping them only puts blank rows on the public Odds page.
  const withOdds = built.filter((e) => Object.keys(e.allBooks).length > 0);
  built.length = 0;
  built.push(...withOdds);

  // Sort by best implied payout (longshots last → favorites first).
  built.sort((a, b) => payoutMultiplier(a.bestOdds) - payoutMultiplier(b.bestOdds));

  console.log(
    `Line-shopping merge: +${newPlayers} new players, ${addedBookLines} new book-lines, ${improvedBookLines} improved book-lines.`
  );

  const file = [
    `// Generated by scripts/build-outrights.ts on ${new Date().toISOString()}`,
    `// ${args.slug} / ${args.phase} — outright WINNER odds, ${built.length} entries.`,
    `// Best odds computed across real sportsbooks (DataGolf excluded). DO NOT EDIT BY HAND.`,
    ``,
    `import type { OutrightEntry } from '../types';`,
    ``,
    `export const ${args.export}: OutrightEntry[] = ${JSON.stringify(built, null, 2)};`,
    ``,
  ].join('\n');

  await writeFile(join(PROJECT_ROOT, 'src', 'data', `${args.out}.ts`), file);
  console.log(`✅ Wrote src/data/${args.out}.ts (${built.length} entries).`);
}

main().catch((e) => {
  console.error('build-outrights failed:', e);
  process.exit(1);
});
