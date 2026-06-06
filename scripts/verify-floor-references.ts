#!/usr/bin/env tsx
/**
 * Smoke test: NO component in src/components/ may hardcode a floor-tier
 * comparison. Every tier label ("BEST BET" / "STRONG PLAY" / "LEAN") MUST
 * come from `tierForEdge(edge, currentEvent.recommendedFloor)` so a venue
 * floor change in src/config/venues.ts propagates everywhere automatically.
 *
 * Why this exists: 2026-06-06, the Memorial floor was locked at 2.45 and
 * pushed to venues.ts. The Matchups + Odds pages kept showing edges 1.95+
 * as "BEST BET" because the tier threshold was hardcoded as `>= 1.95` in
 * two .tsx files. Chris caught it; this script ensures we never repeat it.
 *
 * What we look for (in src/components/ ONLY):
 *   - `>= 0.95` / `>= 1.45` / `>= 1.95` / `>= 2.45` / `>= 2.95` / `>= 3.45`+
 *     compared to a variable named like `edge`, `score`, `matchupScore`, `xEdge`
 *
 * Allowed exceptions (these are NOT venue-aware by design):
 *   - src/lib/sizing.ts — canonical tier ladder definition
 *   - src/components/BetSizingLadder.tsx — static reference table of unit sizes
 *   - src/components/EdgeDistributionChart.tsx — chart axis markers at tier boundaries
 *
 * If you have a legitimate new exception, add it to ALLOWED_FILES below
 * AND explain why in a comment on the same line.
 */
import { readFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;
const COMPONENTS_DIR = join(PROJECT_ROOT, 'src', 'components');

// Files exempt from this check. Keep tight — every entry needs a real reason.
// Defensive list: even if these files don't currently contain a `>= 1.95`-style
// comparison, allowing them here documents that future hardcoded references are
// understood + intentional (static reference tables, NOT venue-aware logic).
const ALLOWED_FILES = new Set<string>([
  // Static reference table — documents the UNIVERSAL unit-sizing ladder, not
  // the venue floor. Same for every event.
  'BetSizingLadder.tsx',
  // Static reference markers in chart axes — visual tier-boundary indicators.
  'EdgeDistributionChart.tsx',
]);

// Tier boundaries on the floor ladder. Any line that compares one of these
// numbers to a variable that looks like an edge/score is a violation.
const FLOOR_NUMBERS = ['0.95', '1.45', '1.95', '2.45', '2.95', '3.45', '3.95', '4.45', '4.95', '5.45'];

// Match `>= 1.95` or `>= 1.95)` etc. Anchored loose enough to catch most variants.
const COMPARISON_RE = new RegExp(`>=\\s*(${FLOOR_NUMBERS.join('|')})\\b`);

function listTsxRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listTsxRecursive(full));
    else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

const files = listTsxRecursive(COMPONENTS_DIR);
const violations: { file: string; line: number; text: string }[] = [];

for (const file of files) {
  const basename = file.split('/').pop() ?? '';
  if (ALLOWED_FILES.has(basename)) continue;
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments — both `//` and `*` block-comment continuation lines.
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    const m = line.match(COMPARISON_RE);
    if (m) {
      // Only flag if the LHS of the comparison looks like an edge/score variable.
      // We need to allow things like `opacity >= 0.95` (CSS) without triggering.
      const idx = line.indexOf(m[0]);
      const lhs = line.slice(Math.max(0, idx - 40), idx).toLowerCase();
      const looksLikeEdge = /(edge|score|matchupscore|matchup_score|xedge|x_score|threshold|cutoff|floor)/.test(lhs);
      if (looksLikeEdge) {
        violations.push({ file: file.replace(PROJECT_ROOT, ''), line: i + 1, text: line.trim() });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('❌ FAIL: hardcoded floor-tier comparison(s) found in components.');
  console.error('   These must use tierForEdge(edge, currentEvent.recommendedFloor) instead.');
  console.error('');
  for (const v of violations) {
    console.error(`   ${v.file}:${v.line}`);
    console.error(`     ${v.text}`);
  }
  console.error('');
  console.error('   How to fix:');
  console.error('   1. import { tierForEdge } from "../lib/sizing"');
  console.error('   2. import { currentEvent } from "../config/event"');
  console.error('   3. Replace the hardcoded comparison with:');
  console.error('      const tier = tierForEdge(edge, currentEvent.recommendedFloor);');
  console.error('');
  console.error('   If this comparison is intentionally NOT venue-aware (e.g., a static');
  console.error('   reference table), add the filename to ALLOWED_FILES in this script');
  console.error('   with a one-line comment explaining why.');
  process.exit(1);
}

console.log(`✅ Floor-reference guard: ${files.length} component files scanned, 0 hardcoded tier comparisons.`);
console.log(`   All BEST BET / STRONG PLAY logic flows through tierForEdge() + venues.ts.\n`);
