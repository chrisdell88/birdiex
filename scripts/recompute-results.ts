/**
 * recompute-results.ts
 *
 * Re-computes units for every bet record in both results data files using
 * edge-banded sizing, then rewrites every summary export.
 *
 * IDEMPOTENT: units are derived purely from (result, bestOdds, tier).
 * The existing `units` field on each record is ignored. Re-running this
 * script any number of times produces identical output.
 *
 * To change the sizing scheme: edit unitsForEdge() in src/lib/sizing.ts (and
 * keep the inlined mirror below in sync), then re-run this script.
 *
 * Usage:
 *   npx tsx scripts/recompute-results.ts
 *
 * Validation (the records ARE the source of truth — summaries derive bottom-up):
 *   - Masters win/loss/push counts must be 130-70-21 (counts never change with sizing).
 *   - Within each edge band the multiplier is constant, so the band's sized ROI
 *     must equal its flat (1u) ROI — checked per band.
 *   - All numbers are printed for review.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

// ---------------------------------------------------------------------------
// Sizing helpers (inlined here so the script has no runtime import chain
// issues when run as a standalone tsx invocation)
// ---------------------------------------------------------------------------

type TierType = 'BEST BET' | 'STRONG PLAY' | 'LEAN';
type BetResult = 'W' | 'L' | 'P';

// Edge-banded sizing — mirrors src/lib/sizing.ts (inlined so this script has
// no runtime import-chain issues). Keep the two in sync; sizing.ts is canonical.
function unitsForEdge(edge: number): number {
  const e = Math.round(edge * 10000);
  if (e < 9500) return 0;
  const band = Math.floor((e - 9500) / 5000);
  return Math.min(5, 0.5 + 0.5 * band);
}

/** Stake required to win 1 unit at these American odds. */
function stakeToWin1(odds: string): number {
  const n = parseInt(odds, 10);
  return n < 0 ? Math.abs(n) / 100 : 100 / n;
}

/** Net units for a single bet under edge-banded sizing. */
function betUnits(result: BetResult, bestOdds: string, edge: number): number {
  const m = unitsForEdge(edge);
  if (result === 'W') return Math.round(m * 100) / 100;
  if (result === 'L') return Math.round(-m * stakeToWin1(bestOdds) * 100) / 100;
  return 0;
}

/** Stake placed on this bet (0 for pushes). */
function betStake(result: BetResult, bestOdds: string, edge: number): number {
  if (result === 'P') return 0;
  return Math.round(unitsForEdge(edge) * stakeToWin1(bestOdds) * 100) / 100;
}

function r2dp(x: number) { return Math.round(x * 100) / 100; }
function r1dp(x: number) { return Math.round(x * 10) / 10; }

// ---------------------------------------------------------------------------
// Aggregate helpers
// ---------------------------------------------------------------------------

interface Rec {
  id: number;
  round: number;
  pick: string;
  opponent: string;
  edge: number;
  tier: TierType;
  bucket: string;
  bestOdds: string;
  book: string;
  betType: string;
  pickScore: number | null;
  oppScore: number | null;
  result: BetResult;
  units: number; // recomputed
  dataSet: string;
}

function agg(recs: Rec[]) {
  const wins = recs.filter((r) => r.result === 'W').length;
  const losses = recs.filter((r) => r.result === 'L').length;
  const pushes = recs.filter((r) => r.result === 'P').length;
  const units = r2dp(recs.reduce((s, r) => s + r.units, 0));
  const staked = r2dp(recs.reduce((s, r) => s + betStake(r.result, r.bestOdds, r.edge), 0));
  const roi = staked > 0 ? r1dp((units / staked) * 100) : 0;
  return { wins, losses, pushes, units, staked, roi };
}

function record(wins: number, losses: number, pushes: number) {
  return `${wins}-${losses}-${pushes}`;
}

// Tier breakdown
function tierBreakdown(recs: Rec[], tier: TierType) {
  const sub = recs.filter((r) => r.tier === tier);
  const { wins, losses, pushes, units, roi } = agg(sub);
  return { tier, wins, losses, pushes, units, roi };
}

// Bucket breakdown
function bucketBreakdown(recs: Rec[], bucket: string) {
  const sub = recs.filter((r) => r.bucket === bucket);
  const { wins, losses, pushes, units, roi } = agg(sub);
  return { bucket, wins, losses, pushes, units, roi };
}

// Book breakdown — produces { record, units, roi: 'X.XX%' }
function bookBreakdown(recs: Rec[], book: string) {
  const sub = recs.filter((r) => r.book.toLowerCase() === book.toLowerCase());
  const { wins, losses, pushes, units, roi } = agg(sub);
  return {
    record: record(wins, losses, pushes),
    units: r2dp(units),
    roi: `${roi.toFixed(2)}%`,
  };
}

// ---------------------------------------------------------------------------
// Load both data files as raw text and parse the record arrays from them.
// We use dynamic import to load the TS modules at runtime (tsx handles this).
// ---------------------------------------------------------------------------

async function loadMastersRecords(): Promise<Rec[]> {
  const mod = await import(
    pathToFileURL(join(PROJECT_ROOT, 'src', 'data', 'resultsData.ts')).href
  );
  return mod.betLog as Rec[];
}

async function loadPgaRecords(): Promise<Rec[]> {
  const mod = await import(
    pathToFileURL(join(PROJECT_ROOT, 'src', 'data', 'pgaChampR2Results.ts')).href
  );
  return mod.r2Results as Rec[];
}

// ---------------------------------------------------------------------------
// GATE A: validate flat (multiplier=1) aggregation reproduces published numbers
// ---------------------------------------------------------------------------

function flatUnits(result: BetResult, bestOdds: string): number {
  const stake = stakeToWin1(bestOdds);
  if (result === 'W') return 1;
  if (result === 'L') return Math.round(-stake * 100) / 100;
  return 0;
}

function gateCounts(recs: Rec[]): { ok: boolean; record: string } {
  const wins = recs.filter((r) => r.result === 'W').length;
  const losses = recs.filter((r) => r.result === 'L').length;
  const pushes = recs.filter((r) => r.result === 'P').length;
  return {
    ok: wins === 130 && losses === 70 && pushes === 21,
    record: record(wins, losses, pushes),
  };
}

/** Flat (1u) aggregate of a record set — informational baseline for the log. */
function flatAgg(recs: Rec[]): { units: number; roi: number } {
  const units = r2dp(recs.reduce((s, r) => s + flatUnits(r.result, r.bestOdds), 0));
  const staked = r2dp(
    recs.reduce((s, r) => (r.result === 'P' ? s : s + stakeToWin1(r.bestOdds)), 0),
  );
  return { units, roi: staked > 0 ? r1dp((units / staked) * 100) : 0 };
}

// ---------------------------------------------------------------------------
// Masters: generate the full resultsData.ts file text
// ---------------------------------------------------------------------------

function serializeRecord(r: Rec): string {
  // Preserve the original compact one-liner format
  const fields = [
    `id: ${r.id}`,
    `round: ${r.round}`,
    `pick: ${JSON.stringify(r.pick)}`,
    `opponent: ${JSON.stringify(r.opponent)}`,
    `edge: ${r.edge}`,
    `tier: ${JSON.stringify(r.tier)}`,
    `bucket: ${JSON.stringify(r.bucket)}`,
    `bestOdds: ${JSON.stringify(r.bestOdds)}`,
    `book: ${JSON.stringify(r.book)}`,
    `betType: ${JSON.stringify(r.betType)}`,
    `pickScore: ${r.pickScore}`,
    `oppScore: ${r.oppScore}`,
    `result: ${JSON.stringify(r.result)}`,
    `units: ${r.units}`,
    `dataSet: ${JSON.stringify(r.dataSet)}`,
  ];
  return `{ ${fields.join(', ')} }`;
}

function buildMastersFile(recs: Rec[], rawRecs: Rec[]): string {
  const TIERS: TierType[] = ['BEST BET', 'STRONG PLAY', 'LEAN'];
  const BUCKETS = ['BUY vs FADE', 'BUY vs OTHER', 'FADE vs OTHER', 'OTHER vs OTHER'];

  // Round filters
  const r2 = recs.filter((r) => r.round === 2);
  const r3ro = recs.filter((r) => r.round === 3 && r.dataSet === 'round-only');
  const r3cum = recs.filter((r) => r.round === 3 && r.dataSet === 'cumulative');
  const r4ro = recs.filter((r) => r.round === 4 && r.dataSet === 'round-only');
  const r4cum = recs.filter((r) => r.round === 4 && r.dataSet === 'cumulative');
  const all = recs;
  const allRO = recs.filter((r) => r.dataSet === 'round-only');
  const allCum = recs.filter((r) => r.dataSet === 'cumulative');

  // Overall
  const overall = agg(all);
  const r2s = agg(r2);
  const r3ros = agg(r3ro);
  const r3cums = agg(r3cum);
  const r4ros = agg(r4ro);
  const r4cums = agg(r4cum);

  // Tier breakdowns
  const r2Tier = TIERS.map((t) => tierBreakdown(r2, t));
  const r3ROTier = TIERS.map((t) => tierBreakdown(r3ro, t));
  const r3CumTier = TIERS.map((t) => tierBreakdown(r3cum, t));
  const r4ROTier = TIERS.map((t) => tierBreakdown(r4ro, t));
  const r4CumTier = TIERS.map((t) => tierBreakdown(r4cum, t));
  const totalTier = TIERS.map((t) => tierBreakdown(all, t));

  // Bucket breakdowns (only present buckets for each slice)
  function bucketsFor(slice: Rec[]) {
    return BUCKETS
      .filter((b) => slice.some((r) => r.bucket === b))
      .map((b) => bucketBreakdown(slice, b));
  }

  const r2Buck = bucketsFor(r2);
  const r3ROBuck = bucketsFor(r3ro);
  const r3CumBuck = bucketsFor(r3cum);
  const r4ROBuck = bucketsFor(r4ro);
  const r4CumBuck = bucketsFor(r4cum);
  const totalBuck = bucketsFor(all);

  // Dataset comparison
  const dsRO = agg(allRO);
  const dsCum = agg(allCum);

  // Book breakdowns — collect all books (lowercased) present in each slice
  function booksFor(slice: Rec[]) {
    return [...new Set(slice.map((r) => r.book.toLowerCase()))].sort();
  }
  function bookBreakdowns(slice: Rec[]) {
    const out: Record<string, { record: string; units: number; roi: string }> = {};
    for (const b of booksFor(slice)) {
      out[b] = bookBreakdown(slice, b);
    }
    return out;
  }

  const r2Books = bookBreakdowns(r2);
  const r3ROBooks = bookBreakdowns(r3ro);
  const r4ROBooks = bookBreakdowns(r4ro);
  const r4CumBooks = bookBreakdowns(r4cum);
  const totalBooks = bookBreakdowns(all);

  // Updated record rows (compact one-liner each)
  const recLines = rawRecs.map((orig) => {
    const rec = recs.find((r) => r.id === orig.id);
    return `${serializeRecord({ ...orig, units: rec ? rec.units : orig.units })},`;
  });

  const lines: string[] = [
    `import type { BetRecord, TierBreakdown, BucketBreakdown } from '../types';`,
    ``,
    `// ===== OVERALL SUMMARY (All Rounds Combined: R2 + R3 + R4) =====`,
    `// Recomputed by scripts/recompute-results.ts on ${new Date().toISOString()}`,
    `// Edge-banded sizing — see src/lib/sizing.ts`,
    `export const overallRecord = { wins: ${overall.wins}, losses: ${overall.losses}, pushes: ${overall.pushes} };`,
    `export const overallUnits = ${overall.units.toFixed(2)};`,
    `export const overallROI = ${overall.roi.toFixed(1)};`,
    ``,
    `// ===== R2 SUMMARY =====`,
    `export const r2Summary = {`,
    `  record: '${record(r2s.wins, r2s.losses, r2s.pushes)}',`,
    `  wins: ${r2s.wins}, losses: ${r2s.losses}, pushes: ${r2s.pushes},`,
    `  units: ${r2s.units.toFixed(2)}, roi: ${r2s.roi.toFixed(1)},`,
    `};`,
    ``,
    `// ===== R3 ROUND-ONLY SUMMARY =====`,
    `export const r3RoundOnlySummary = {`,
    `  record: '${record(r3ros.wins, r3ros.losses, r3ros.pushes)}',`,
    `  wins: ${r3ros.wins}, losses: ${r3ros.losses}, pushes: ${r3ros.pushes},`,
    `  units: ${r3ros.units.toFixed(2)}, roi: ${r3ros.roi.toFixed(1)},`,
    `};`,
    ``,
    `// ===== R3 CUMULATIVE SUMMARY =====`,
    `export const r3CumulativeSummary = {`,
    `  record: '${record(r3cums.wins, r3cums.losses, r3cums.pushes)}',`,
    `  wins: ${r3cums.wins}, losses: ${r3cums.losses}, pushes: ${r3cums.pushes},`,
    `  units: ${r3cums.units.toFixed(2)}, roi: ${r3cums.roi.toFixed(1)},`,
    `};`,
    ``,
    `// ===== R4 ROUND-ONLY SUMMARY =====`,
    `export const r4RoundOnlySummary = {`,
    `  record: '${record(r4ros.wins, r4ros.losses, r4ros.pushes)}',`,
    `  wins: ${r4ros.wins}, losses: ${r4ros.losses}, pushes: ${r4ros.pushes},`,
    `  units: ${r4ros.units.toFixed(2)}, roi: ${r4ros.roi.toFixed(1)},`,
    `};`,
    ``,
    `// ===== R4 CUMULATIVE SUMMARY =====`,
    `export const r4CumulativeSummary = {`,
    `  record: '${record(r4cums.wins, r4cums.losses, r4cums.pushes)}',`,
    `  wins: ${r4cums.wins}, losses: ${r4cums.losses}, pushes: ${r4cums.pushes},`,
    `  units: ${r4cums.units.toFixed(2)}, roi: ${r4cums.roi.toFixed(1)},`,
    `};`,
    ``,
    `// Tier breakdowns -- R2`,
    `export const r2TierBreakdowns: TierBreakdown[] = ${JSON.stringify(r2Tier)};`,
    ``,
    `// Tier breakdowns -- R3 round-only`,
    `export const r3ROTierBreakdowns: TierBreakdown[] = ${JSON.stringify(r3ROTier)};`,
    ``,
    `// Tier breakdowns -- R3 cumulative`,
    `export const r3CumTierBreakdowns: TierBreakdown[] = ${JSON.stringify(r3CumTier)};`,
    ``,
    `// Tier breakdowns -- R4 round-only`,
    `export const r4ROTierBreakdowns: TierBreakdown[] = ${JSON.stringify(r4ROTier)};`,
    ``,
    `// Tier breakdowns -- R4 cumulative`,
    `export const r4CumTierBreakdowns: TierBreakdown[] = ${JSON.stringify(r4CumTier)};`,
    ``,
    `// Tier breakdowns -- Tournament total (all bets combined)`,
    `export const totalTierBreakdowns: TierBreakdown[] = ${JSON.stringify(totalTier)};`,
    ``,
    `// Combined tier breakdowns (for backward compat)`,
    `export const tierBreakdowns: TierBreakdown[] = totalTierBreakdowns;`,
    ``,
    `// Bucket breakdowns -- R2`,
    `export const r2BucketBreakdowns: BucketBreakdown[] = ${JSON.stringify(r2Buck)};`,
    ``,
    `// Bucket breakdowns -- R3 round-only`,
    `export const r3ROBucketBreakdowns: BucketBreakdown[] = ${JSON.stringify(r3ROBuck)};`,
    ``,
    `// Bucket breakdowns -- R3 cumulative`,
    `export const r3CumBucketBreakdowns: BucketBreakdown[] = ${JSON.stringify(r3CumBuck)};`,
    ``,
    `// Bucket breakdowns -- R4 round-only`,
    `export const r4ROBucketBreakdowns: BucketBreakdown[] = ${JSON.stringify(r4ROBuck)};`,
    ``,
    `// Bucket breakdowns -- R4 cumulative`,
    `export const r4CumBucketBreakdowns: BucketBreakdown[] = ${JSON.stringify(r4CumBuck)};`,
    ``,
    `// Bucket breakdowns -- Tournament total`,
    `export const totalBucketBreakdowns: BucketBreakdown[] = ${JSON.stringify(totalBuck)};`,
    ``,
    `// Combined bucket breakdowns (for backward compat)`,
    `export const bucketBreakdowns: BucketBreakdown[] = totalBucketBreakdowns;`,
    ``,
    `// Data set comparison`,
    `export const dataSetComparison = {`,
    `  roundOnly: { wins: ${dsRO.wins}, losses: ${dsRO.losses}, pushes: ${dsRO.pushes}, units: ${dsRO.units.toFixed(2)}, roi: ${dsRO.roi.toFixed(2)} },`,
    `  cumulative: { wins: ${dsCum.wins}, losses: ${dsCum.losses}, pushes: ${dsCum.pushes}, units: ${dsCum.units.toFixed(2)}, roi: ${dsCum.roi.toFixed(2)} },`,
    `};`,
    ``,
    `// Per-book breakdowns -- R2`,
    `export const r2BookBreakdowns = ${JSON.stringify(r2Books, null, 2)};`,
    ``,
    `// Per-book breakdowns -- R3 round-only`,
    `export const r3ROBookBreakdowns = ${JSON.stringify(r3ROBooks, null, 2)};`,
    ``,
    `// Per-book breakdowns -- R4 round-only`,
    `export const r4ROBookBreakdowns = ${JSON.stringify(r4ROBooks, null, 2)};`,
    ``,
    `// Per-book breakdowns -- R4 cumulative`,
    `export const r4CumBookBreakdowns = ${JSON.stringify(r4CumBooks, null, 2)};`,
    ``,
    `// Per-book breakdowns -- Tournament total`,
    `export const totalBookBreakdowns = ${JSON.stringify(totalBooks, null, 2)};`,
    ``,
    `// ===== FULL BET LOG =====`,
    `export const betLog: BetRecord[] = [`,
    ...recLines,
    `];`,
    ``,
  ];

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// PGA R2: generate pgaChampR2Results.ts
// ---------------------------------------------------------------------------

function buildPgaFile(recs: Rec[], rawRecs: Rec[]): string {
  const { wins, losses, pushes, units, staked, roi } = agg(recs);

  const summary = {
    round: 2,
    bets: recs.length,
    record: record(wins, losses, pushes),
    wins, losses, pushes,
    units: r2dp(units),
    staked: r2dp(staked),
    roi: r1dp(roi),
  };

  const updatedRecs = rawRecs.map((orig) => {
    const rec = recs.find((r) => r.id === orig.id);
    return { ...orig, units: rec ? rec.units : orig.units };
  });

  const lines: string[] = [
    `import type { BetRecord } from '../types';`,
    ``,
    `// Recomputed by scripts/recompute-results.ts on ${new Date().toISOString()}`,
    `// pga-championship-2026 round 2 — H2H, graded at best odds across real books.`,
    `// Edge-banded sizing — see src/lib/sizing.ts`,
    `// Summary: ${summary.record}, ${summary.units >= 0 ? '+' : ''}${summary.units}u, ${summary.roi >= 0 ? '+' : ''}${summary.roi}% ROI (${summary.bets} bets).`,
    `// DO NOT EDIT BY HAND — re-run scripts/recompute-results.ts to regenerate.`,
    ``,
    `export const r2Results: BetRecord[] = ${JSON.stringify(updatedRecs, null, 2)};`,
    ``,
    `export const r2Summary = ${JSON.stringify(summary, null, 2)};`,
    ``,
  ];

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Loading Masters records...');
  const mastersRaw = await loadMastersRecords();
  console.log(`  ${mastersRaw.length} records loaded.`);

  console.log('Loading PGA R2 records...');
  const pgaRaw = await loadPgaRecords();
  console.log(`  ${pgaRaw.length} records loaded.`);

  // ---- Apply edge-banded sizing — units derived purely from (result, bestOdds, edge) ----
  const mastersRecs: Rec[] = mastersRaw.map((r) => ({
    ...r,
    units: betUnits(r.result, r.bestOdds, r.edge),
  }));
  const pgaRecs: Rec[] = pgaRaw.map((r) => ({
    ...r,
    units: betUnits(r.result, r.bestOdds, r.edge),
  }));

  // ---- Check: record counts never change with sizing ----
  const counts = gateCounts(mastersRecs);
  const flat = flatAgg(mastersRecs);
  console.log('\n--- Masters ---');
  console.log(`  Record: ${counts.record}  (must be 130-70-21)`);
  console.log(`  Flat 1u baseline: +${flat.units}u, ${flat.roi}% ROI`);
  if (!counts.ok) {
    console.error('  FAIL — record counts wrong; aborting before writing any files.');
    process.exit(1);
  }

  // ---- Invariant: within an edge band the multiplier is constant, so the
  //      band's sized ROI must equal its flat (1u) ROI. ----
  const bands = [...new Set(mastersRecs.map((r) => unitsForEdge(r.edge)))].sort((a, b) => a - b);
  let invariantOk = true;
  console.log('\n  Per edge-band — sized ROI must match flat ROI:');
  for (const mUnit of bands) {
    const sub = mastersRecs.filter((r) => unitsForEdge(r.edge) === mUnit);
    const fUnits = r2dp(sub.reduce((s, r) => s + flatUnits(r.result, r.bestOdds), 0));
    const fStaked = r2dp(sub.reduce((s, r) => (r.result === 'P' ? s : s + stakeToWin1(r.bestOdds)), 0));
    const fRoi = fStaked > 0 ? r1dp((fUnits / fStaked) * 100) : 0;
    const d = agg(sub);
    console.log(`    ${mUnit}u band: ${sub.length} bets, +${d.units}u, ${d.roi}% ROI  (flat ROI ${fRoi}%)`);
    if (Math.abs(d.roi - fRoi) > 0.3) invariantOk = false;
  }
  if (!invariantOk) {
    console.error('  FAIL — a band ROI shifted under sizing; aggregation is wrong. Aborting.');
    process.exit(1);
  }

  const mastersOverall = agg(mastersRecs);
  console.log(`\n  Masters total: ${record(mastersOverall.wins, mastersOverall.losses, mastersOverall.pushes)}, +${mastersOverall.units}u, ${mastersOverall.roi}% ROI`);
  if (mastersOverall.units < 20 || mastersOverall.units > 110 || mastersOverall.roi < 5 || mastersOverall.roi > 35) {
    console.error('  FAIL — Masters total outside sane bounds; aborting.');
    process.exit(1);
  }

  // ---- Write files ----
  console.log('\nWriting src/data/resultsData.ts...');
  writeFileSync(join(PROJECT_ROOT, 'src', 'data', 'resultsData.ts'), buildMastersFile(mastersRecs, mastersRaw), 'utf8');
  console.log('Writing src/data/pgaChampR2Results.ts...');
  writeFileSync(join(PROJECT_ROOT, 'src', 'data', 'pgaChampR2Results.ts'), buildPgaFile(pgaRecs, pgaRaw), 'utf8');

  // ---- Summary ----
  const pgaOverall = agg(pgaRecs);
  console.log('\n========== DONE ==========');
  console.log(`Masters:  ${record(mastersOverall.wins, mastersOverall.losses, mastersOverall.pushes)}, +${mastersOverall.units}u, ${mastersOverall.roi}% ROI`);
  console.log(`PGA R2:   ${record(pgaOverall.wins, pgaOverall.losses, pgaOverall.pushes)}, ${pgaOverall.units >= 0 ? '+' : ''}${pgaOverall.units}u, ${pgaOverall.roi}% ROI`);
}

main().catch((e) => { console.error('recompute-results failed:', e); process.exit(1); });
