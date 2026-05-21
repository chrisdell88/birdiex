/**
 * Threshold sweep: walk the edge floor from 0.95 → 5.00 in 0.05 steps and
 * recompute record / units / ROI at each level for each event.
 *
 * Sizing scheme is held CONSTANT (current edge-banded ladder in
 * src/lib/sizing.ts). We only vary the threshold below which a bet is
 * skipped — bets that survive use their original size.
 *
 * Output: a markdown table per event + a combined "course predictability
 * sensitivity" summary. Writes to docs/THRESHOLD_SWEEP.md.
 *
 * Run:
 *   npx tsx scripts/threshold-sweep.ts
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { betLog } from '../src/data/resultsData.js';
import { r2Results } from '../src/data/pgaChampR2Results.js';
import { r3Results } from '../src/data/pgaChampR3Results.js';
import { r4Results } from '../src/data/pgaChampR4Results.js';
import type { BetRecord } from '../src/types.js';
import { betUnits, betStake } from '../src/lib/sizing.js';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

type Summary = {
  threshold: number;
  bets: number;
  wins: number;
  losses: number;
  pushes: number;
  units: number;
  staked: number;
  roi: number; // percent
};

function sweep(bets: BetRecord[], thresholds: number[]): Summary[] {
  return thresholds.map((t) => {
    const filtered = bets.filter((b) => b.edge >= t);
    let units = 0;
    let staked = 0;
    let wins = 0;
    let losses = 0;
    let pushes = 0;
    for (const b of filtered) {
      // Recompute from scratch using current sizing — handles any data drift.
      units += betUnits(b.result, b.bestOdds, b.edge);
      staked += betStake(b.result, b.bestOdds, b.edge);
      if (b.result === 'W') wins++;
      else if (b.result === 'L') losses++;
      else pushes++;
    }
    return {
      threshold: t,
      bets: filtered.length,
      wins,
      losses,
      pushes,
      units: Math.round(units * 100) / 100,
      staked: Math.round(staked * 100) / 100,
      roi: staked > 0 ? Math.round((units / staked) * 10000) / 100 : 0,
    };
  });
}

function mdTable(name: string, rows: Summary[]): string {
  const head =
    `### ${name}\n\n` +
    `| Threshold | Bets | W-L-P | Units | Staked | ROI |\n` +
    `|---:|---:|:---|---:|---:|---:|`;
  const body = rows
    .filter((r) => r.bets > 0)
    .map(
      (r) =>
        `| ${r.threshold.toFixed(2)} | ${r.bets} | ${r.wins}-${r.losses}-${r.pushes} | ` +
        `${r.units > 0 ? '+' : ''}${r.units.toFixed(2)}u | ${r.staked.toFixed(2)}u | ` +
        `${r.roi > 0 ? '+' : ''}${r.roi.toFixed(1)}% |`,
    )
    .join('\n');
  return `${head}\n${body}\n`;
}

function findBreakeven(rows: Summary[]): Summary | null {
  // First threshold where units >= 0 AND bet count >= 5 (avoid trivial samples).
  return rows.find((r) => r.units >= 0 && r.bets >= 5) ?? null;
}

function findBest(rows: Summary[]): Summary {
  return rows
    .filter((r) => r.bets >= 5)
    .reduce((best, r) => (r.roi > best.roi ? r : best), { roi: -Infinity } as Summary);
}

async function main() {
  // 0.95 → 5.00 in 0.05 steps.
  const thresholds: number[] = [];
  for (let t = 95; t <= 500; t += 5) thresholds.push(t / 100);

  const pgaAll = [...r2Results, ...r3Results, ...r4Results];

  const mastersSweep = sweep(betLog, thresholds);
  const pgaSweep = sweep(pgaAll, thresholds);
  const pgaR2Sweep = sweep(r2Results, thresholds);
  const pgaR3R4Sweep = sweep([...r3Results, ...r4Results], thresholds);
  const allSweep = sweep([...betLog, ...pgaAll], thresholds);

  // Console: console-table view at key thresholds.
  const keyThresholds = [0.95, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.5, 4.0];
  const compact = (name: string, rows: Summary[]) =>
    keyThresholds
      .map((t) => rows.find((r) => Math.abs(r.threshold - t) < 1e-9)!)
      .filter((r) => r && r.bets >= 5)
      .map((r) => ({
        event: name,
        threshold: r.threshold,
        bets: r.bets,
        record: `${r.wins}-${r.losses}-${r.pushes}`,
        units: r.units,
        roi: `${r.roi}%`,
      }));

  console.log('\n=== Masters (high predictability) — threshold sweep ===');
  console.table(compact('Masters', mastersSweep));
  console.log('\n=== PGA Championship (low predictability, Aronimink) — threshold sweep ===');
  console.table(compact('PGA', pgaSweep));
  console.log('\n=== PGA Champ R2 only ===');
  console.table(compact('PGA R2', pgaR2Sweep));
  console.log('\n=== PGA Champ R3+R4 (weekend, post-cut) ===');
  console.table(compact('PGA R3+R4', pgaR3R4Sweep));

  const pgaBreakeven = findBreakeven(pgaSweep);
  const pgaBest = findBest(pgaSweep);
  const mastersBest = findBest(mastersSweep);
  const allBest = findBest(allSweep);

  console.log('\n=== HEADLINE ===');
  console.log('PGA Champ break-even threshold:',
    pgaBreakeven
      ? `${pgaBreakeven.threshold.toFixed(2)} → ${pgaBreakeven.units > 0 ? '+' : ''}${pgaBreakeven.units}u, ${pgaBreakeven.roi}%, ${pgaBreakeven.bets} bets`
      : 'never reaches break-even in this range',
  );
  console.log('PGA Champ best ROI:',
    `${pgaBest.threshold.toFixed(2)} → ${pgaBest.units > 0 ? '+' : ''}${pgaBest.units}u, ${pgaBest.roi}%, ${pgaBest.bets} bets`);
  console.log('Masters best ROI:',
    `${mastersBest.threshold.toFixed(2)} → ${mastersBest.units > 0 ? '+' : ''}${mastersBest.units}u, ${mastersBest.roi}%, ${mastersBest.bets} bets`);
  console.log('All-time best ROI:',
    `${allBest.threshold.toFixed(2)} → ${allBest.units > 0 ? '+' : ''}${allBest.units}u, ${allBest.roi}%, ${allBest.bets} bets`);

  // Write markdown doc.
  const doc = [
    `# Threshold Sweep — Course Predictability → Optimal Edge Floor`,
    ``,
    `**Question:** At what edge threshold does a course become profitable? Does a low-predictability venue (PGA Championship at Aronimink, predictability ≈ 0.0413) need a higher floor than a high-predictability venue (Masters at Augusta, predictability much higher)?`,
    ``,
    `**Method:** Hold the sizing ladder constant (current edge-banded scheme in \`src/lib/sizing.ts\`). Vary only the edge floor from 0.95 → 5.00 in 0.05 steps. At each floor, drop every bet below it and recompute record / units / ROI on the survivors.`,
    ``,
    `**Generated:** ${new Date().toISOString()} — by \`scripts/threshold-sweep.ts\`.`,
    ``,
    `---`,
    ``,
    `## Headline`,
    ``,
    `- **PGA Championship break-even floor:** ${pgaBreakeven ? `**${pgaBreakeven.threshold.toFixed(2)}**, where the event flips to ${pgaBreakeven.units > 0 ? '+' : ''}${pgaBreakeven.units}u / ${pgaBreakeven.roi}% on ${pgaBreakeven.bets} bets (${pgaBreakeven.wins}-${pgaBreakeven.losses}-${pgaBreakeven.pushes}).` : 'never reaches break-even in this range.'}`,
    `- **PGA Championship best ROI:** **${pgaBest.threshold.toFixed(2)}**, ${pgaBest.units > 0 ? '+' : ''}${pgaBest.units}u / ${pgaBest.roi}% on ${pgaBest.bets} bets (${pgaBest.wins}-${pgaBest.losses}-${pgaBest.pushes}).`,
    `- **Masters best ROI:** **${mastersBest.threshold.toFixed(2)}**, ${mastersBest.units > 0 ? '+' : ''}${mastersBest.units}u / ${mastersBest.roi}% on ${mastersBest.bets} bets (${mastersBest.wins}-${mastersBest.losses}-${mastersBest.pushes}).`,
    `- **Combined all-time best ROI:** **${allBest.threshold.toFixed(2)}**, ${allBest.units > 0 ? '+' : ''}${allBest.units}u / ${allBest.roi}% on ${allBest.bets} bets.`,
    ``,
    `**Interpretation:** Low-predictability courses raise the cost of low-edge bets. A predictability-aware floor (set the threshold higher when the venue's predictability is below some cutoff) is the structural fix.`,
    ``,
    `---`,
    ``,
    mdTable('Masters 2026 (Augusta — high predictability)', mastersSweep),
    ``,
    mdTable('PGA Championship 2026 (Aronimink — low predictability ≈ 0.0413)', pgaSweep),
    ``,
    mdTable('PGA Championship — R2 only', pgaR2Sweep),
    ``,
    mdTable('PGA Championship — R3+R4 (weekend, post-cut)', pgaR3R4Sweep),
    ``,
    mdTable('Combined (Masters + PGA Championship, all-time)', allSweep),
    ``,
  ].join('\n');

  await writeFile(join(PROJECT_ROOT, 'docs', 'THRESHOLD_SWEEP.md'), doc);
  console.log('\n✅ Wrote docs/THRESHOLD_SWEEP.md');
}

main().catch((e) => {
  console.error('threshold-sweep failed:', e);
  process.exit(1);
});
