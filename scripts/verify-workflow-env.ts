#!/usr/bin/env tsx
/**
 * Smoke test: every GitHub Actions workflow that operates on the CURRENT
 * event must have its env block (SLUG, SLUG_PREFIX, COURSE) in sync with
 * src/data/eventSchedule.ts's first entry (the active event).
 *
 * This is the test that would have caught the 2026-06-04→06 ticker bug:
 *   - ticker-refresh.yml had `SLUG: the-memorial-tournament-2026` ✓
 *   - ticker-refresh.yml had NO `SLUG_PREFIX:` line ✗
 *   - build-ticker.ts silently fell back to default 'csc', then rewrote
 *     cscR3Matchups.ts with Memorial data every 30 minutes for 2 days,
 *     AND memorial matchups never refreshed live.
 *
 * What we check (per active workflow file):
 *   - SLUG matches eventSchedule.ts active.slug
 *   - SLUG_PREFIX (if present) matches eventSchedule.ts active.dataPrefix
 *   - COURSE (if present) matches eventSchedule.ts active.courseKey
 *
 * Workflows checked: datagolf-pull.yml, ticker-refresh.yml. Add more if
 * a new workflow takes per-event config.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

// Read eventSchedule.ts as text and pluck the first entry's slug + dataPrefix
// + courseKey. We don't import it (avoid TS loader gymnastics in this small
// guard) — text parsing is reliable enough for a 3-field check.
const scheduleSrc = readFileSync(
  join(PROJECT_ROOT, 'src/data/eventSchedule.ts'),
  'utf8'
);

// Find the FIRST schedule entry (active event). The schedule is ordered
// chronologically with the current event first.
function firstField(src: string, field: string): string | null {
  // Match `field: 'value'` after the first `{` of EVENT_SCHEDULE.
  const arrStart = src.indexOf('EVENT_SCHEDULE');
  if (arrStart < 0) return null;
  const re = new RegExp(`${field}:\\s*'([^']+)'`);
  const m = src.slice(arrStart).match(re);
  return m ? m[1] : null;
}

const active = {
  slug: firstField(scheduleSrc, 'slug'),
  dataPrefix: firstField(scheduleSrc, 'dataPrefix'),
  courseKey: firstField(scheduleSrc, 'courseKey'),
};

if (!active.slug || !active.dataPrefix) {
  console.error('❌ Could not parse first event from src/data/eventSchedule.ts.');
  process.exit(1);
}

console.log(`Active event from eventSchedule.ts:`);
console.log(`  slug:       ${active.slug}`);
console.log(`  dataPrefix: ${active.dataPrefix}`);
console.log(`  courseKey:  ${active.courseKey ?? '(none)'}`);
console.log('');

interface WorkflowExpectation {
  path: string;
  // Fields the workflow's env: block MUST contain, mapped to the expected
  // value sourced from the active eventSchedule entry.
  required: Record<string, string>;
}

const WORKFLOWS: WorkflowExpectation[] = [
  {
    path: '.github/workflows/datagolf-pull.yml',
    required: {
      SLUG: active.slug!,
      SLUG_PREFIX: active.dataPrefix!,
      ...(active.courseKey ? { COURSE: active.courseKey } : {}),
    },
  },
  {
    path: '.github/workflows/ticker-refresh.yml',
    required: {
      SLUG: active.slug!,
      // SLUG_PREFIX is the missing line that caused 2026-06-04→06 pollution.
      // Treat it as required forever.
      SLUG_PREFIX: active.dataPrefix!,
    },
  },
];

const failures: string[] = [];
for (const wf of WORKFLOWS) {
  const yml = readFileSync(join(PROJECT_ROOT, wf.path), 'utf8');
  // Pull JUST the top-level env: block (before `permissions:` or `jobs:`).
  const envBlockMatch = yml.match(/^env:\s*\n([\s\S]*?)(?=^[a-z]+:\s*$)/m);
  const envBlock = envBlockMatch ? envBlockMatch[1] : '';
  console.log(`Checking ${wf.path}:`);
  for (const [key, expected] of Object.entries(wf.required)) {
    const re = new RegExp(`^  ${key}:\\s*(\\S.*?)\\s*$`, 'm');
    const m = envBlock.match(re);
    if (!m) {
      failures.push(`${wf.path}: missing env.${key} (expected "${expected}")`);
      console.log(`  ✗ ${key}: MISSING (expected "${expected}")`);
      continue;
    }
    const actual = m[1].trim();
    if (actual !== expected) {
      failures.push(`${wf.path}: env.${key} is "${actual}", expected "${expected}"`);
      console.log(`  ✗ ${key}: "${actual}" (expected "${expected}")`);
    } else {
      console.log(`  ✓ ${key}: ${actual}`);
    }
  }
  console.log('');
}

if (failures.length > 0) {
  console.error('❌ FAIL: workflow env block(s) out of sync with eventSchedule.ts.');
  console.error('');
  for (const f of failures) console.error(`  ${f}`);
  console.error('');
  console.error('   How to fix:');
  console.error('   - If the active event in eventSchedule.ts is correct, update the workflow env block.');
  console.error('   - Or, if a different event is now active, reorder eventSchedule.ts.');
  console.error('   - auto-roll.ts::attemptEventSwitch is the function that patches these on event switch.');
  process.exit(1);
}

console.log('✅ Workflow env blocks all in sync with active event.\n');
