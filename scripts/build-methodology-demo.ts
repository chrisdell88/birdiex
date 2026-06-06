#!/usr/bin/env tsx
/**
 * Regenerate src/data/methodologyDemoData.json — the FROZEN snapshot of
 * PGA Championship R1+R2 SG data that powers PuttingRegressionChart on
 * the Methodology page.
 *
 * Why this script exists: the chart used to import pgaChampR1Data +
 * pgaChampR2Data directly, which meant deleting those files (e.g. when
 * archiving completed events) would silently break the chart. The
 * snapshot decouples illustration from live data.
 *
 * To run a refresh — only when the underlying illustration should
 * change (new methodology demo event, better visual example, etc.):
 *
 *   npx tsx scripts/build-methodology-demo.ts
 *
 * Then commit the resulting JSON. The chart will pick up the new data
 * automatically on next build.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { roundOnlyData as r1 } from '../src/data/pgaChampR1Data';
import { roundOnlyData as r2 } from '../src/data/pgaChampR2Data';

interface MinPlayer {
  player_name: string;
  sg_ott: number;
  sg_app: number;
  sg_arg: number;
  sg_putt: number;
}

type Source = {
  player_name: string;
  sg_ott: number;
  sg_app: number;
  sg_arg: number;
  sg_putt: number;
};

const slim = (arr: Source[]): MinPlayer[] =>
  arr.map((p) => ({
    player_name: p.player_name,
    sg_ott: p.sg_ott,
    sg_app: p.sg_app,
    sg_arg: p.sg_arg,
    sg_putt: p.sg_putt,
  }));

const out = {
  source_event: 'pga-championship-2026',
  source_venue: 'Aronimink',
  source_field_size: r1.length,
  source_snapshotted_at: new Date().toISOString().slice(0, 10),
  // Frozen R1 + R2 SG per player. Only the 5 fields the chart needs.
  r1: slim(r1),
  r2: slim(r2),
};

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;
const outPath = join(PROJECT_ROOT, 'src', 'data', 'methodologyDemoData.json');
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`✅ Wrote ${out.r1.length} R1 + ${out.r2.length} R2 rows to ${outPath.replace(PROJECT_ROOT, '')}`);
