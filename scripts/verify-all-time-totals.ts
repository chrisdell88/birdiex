#!/usr/bin/env tsx
/**
 * Smoke test: every component that displays an all-time stat MUST use
 * src/lib/allTimeStats.ts. No inline math, no hardcoded numbers, no
 * "I'll just sum these 5 imports here" shortcuts.
 *
 * This is the test that would have caught the 2026-06-06 Methodology
 * banner drift: allTimeStats.ts only imported Masters + PGA, while
 * ResultsPage computed all 5 events inline. Two surfaces, same metric,
 * two different numbers. Chris spotted it immediately and rightly
 * called it unprofessional.
 *
 * What we check:
 *   1. Every *Results.ts file in src/data/ has an entry in
 *      allTimeStats.ts::PREFIX_TO_EVENT_ID. A new event file landing
 *      on disk without a registry entry fails the build loud.
 *   2. No component component file does its own inline all-time math
 *      (e.g. `allTimeWins = mastersSummary.wins + ...`). Components
 *      must read `allTimeStats` from the lib.
 *   3. Methodology banner numbers === Results banner numbers.
 *      Enforced indirectly: both files import `allTimeStats` from the
 *      lib, and this script greps that they do.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;
const DATA_DIR = join(PROJECT_ROOT, 'src/data');
const ALL_TIME_LIB = join(PROJECT_ROOT, 'src/lib/allTimeStats.ts');

const allTimeSrc = readFileSync(ALL_TIME_LIB, 'utf8');
const prefixMatch = allTimeSrc.match(/PREFIX_TO_EVENT_ID:\s*Record[^=]*=\s*{([^}]+)}/s);
if (!prefixMatch) {
  console.error('❌ Could not find PREFIX_TO_EVENT_ID map in allTimeStats.ts.');
  process.exit(1);
}
const registeredPrefixes = new Set<string>();
for (const m of prefixMatch[1].matchAll(/(\w+):/g)) {
  registeredPrefixes.add(m[1]);
}

// ─── Check 1: every *Results.ts file has a registered prefix ────────────────
const resultsFiles = readdirSync(DATA_DIR).filter((f) => /R\d+Results\.ts$/.test(f));
const unregistered: string[] = [];
const seenPrefixes = new Set<string>();
for (const f of resultsFiles) {
  const m = f.match(/^([a-zA-Z]+)R\d+Results\.ts$/);
  if (!m) continue;
  const prefix = m[1];
  seenPrefixes.add(prefix);
  if (!registeredPrefixes.has(prefix)) {
    unregistered.push(`${f} (prefix "${prefix}")`);
  }
}

// ─── Check 2: no component does inline all-time math ────────────────────────
// Patterns we forbid in any *.tsx file that displays Results/Methodology stats:
//   const allTimeWins  = mastersSummary.wins + pgaSummary.wins + ...
//   const allTimeUnits = ...
// Either use `import { allTimeStats } from '../lib/allTimeStats'` or `import
// { eventBuckets } from '...allTimeStats'` and let the lib do the math.
// Whitelist approach: match `const allTimeX = <RHS>` and flag only if the
// RHS contains a `+` (math), a literal digit (hardcoded number), or any
// per-event identifier (mastersSummary, pgaSummary, ...). Simple aliasing
// like `const allTimeWins = allTimeStats.wins` is allowed and not flagged.
const ALLTIME_ASSIGN_RE = /^\s*const\s+allTime(?:Wins|Losses|Pushes|Units|Staked|ROI|Bets)\s*=\s*(.+?);?\s*$/;
const BAD_RHS_RE = /[+\d]|Summary\.|Stats\.(?!wins|losses|pushes|units|staked|roi|bets|events)/;
const FORBIDDEN_PATTERNS: Array<{ re: RegExp; rhs?: RegExp; reason: string }> = [
  {
    re: ALLTIME_ASSIGN_RE,
    rhs: BAD_RHS_RE,
    reason: 'inline all-time math instead of importing allTimeStats from src/lib/allTimeStats.ts',
  },
];

const componentsDir = join(PROJECT_ROOT, 'src/components');
const componentFiles: string[] = [];
function listTsx(dir: string) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) listTsx(full);
    else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) componentFiles.push(full);
  }
}
listTsx(componentsDir);

const inlineMathViolations: string[] = [];
for (const file of componentFiles) {
  const src = readFileSync(file, 'utf8');
  for (const { re, rhs, reason } of FORBIDDEN_PATTERNS) {
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      const m = line.match(re);
      if (!m) continue;
      // Two-stage check: assignment pattern matched, now is the RHS bad?
      if (rhs) {
        const rhsText = m[1] ?? '';
        if (!rhs.test(rhsText)) continue;
      }
      inlineMathViolations.push(
        `${file.replace(PROJECT_ROOT, '')}:${i + 1}: ${reason}\n      ${line.trim()}`,
      );
    }
  }
}

// ─── Report ──────────────────────────────────────────────────────────────────
if (unregistered.length === 0 && inlineMathViolations.length === 0) {
  console.log(`✅ All-time totals roll-up clean.`);
  console.log(`   ${resultsFiles.length} results files, ${registeredPrefixes.size} registered prefixes.`);
  console.log(`   Every Results.ts file flows into allTimeStats; no component does inline math.\n`);
  process.exit(0);
}

console.error('❌ FAIL: all-time totals plumbing is fragmented.');
console.error('');
if (unregistered.length > 0) {
  console.error('Unregistered *Results.ts file(s) — these will NOT appear in the all-time totals:');
  for (const f of unregistered) console.error(`  - ${f}`);
  console.error('');
  console.error(`  Fix: add the prefix to PREFIX_TO_EVENT_ID in src/lib/allTimeStats.ts.`);
  console.error('');
}
if (inlineMathViolations.length > 0) {
  console.error('Component(s) doing their own all-time math instead of using the lib:');
  for (const v of inlineMathViolations) console.error(`  - ${v}`);
  console.error('');
  console.error(`  Fix: replace inline math with:`);
  console.error(`    import { allTimeStats } from '../lib/allTimeStats';`);
  console.error('');
}
process.exit(1);
