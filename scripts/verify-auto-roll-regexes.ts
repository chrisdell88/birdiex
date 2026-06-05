#!/usr/bin/env tsx
/**
 * Smoke test: verify auto-roll's patchEventConfig regexes ALL match the
 * current src/config/event.ts. Run on every CI build. Fails loudly if any
 * regex breaks — this is the test we wished we'd had on 2026-06-05 when
 * a 'memorial' event prefix silently broke the R2→R3 transition.
 *
 * Why this exists: patchEventConfig uses regex substitution to update event.ts
 * on every round transition. If event.ts drifts in shape (new prefix, new
 * field order, etc.) and the regexes stop matching, auto-roll fails SILENTLY
 * — the workflow run succeeds (the script exits cleanly on the throw), but
 * the site stays frozen on the previous round and notifications never fire.
 *
 * This script keeps the regex source-of-truth + the event.ts source-of-truth
 * in sync. CI runs it on every PR.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

// MUST stay in sync with the `subs` array inside patchEventConfig (in
// scripts/auto-roll.ts). If you change one, change both.
const REGEXES: { re: RegExp; label: string }[] = [
  { re: /from '\.\.\/data\/[a-zA-Z]+(Pre|R\d)Data'/, label: 'roundData import' },
  { re: /import \{ r\d(MatchupOddsData) \} from '\.\.\/data\/[^']+'/, label: 'matchups import' },
  { re: /import \{ r\d(OutrightsData) \} from '\.\.\/data\/[^']+'/, label: 'outrights import' },
  { re: /picksRound:\s*\d+,/, label: 'picksRound field' },
  { re: /headerBanner:\s*'[^']*',/, label: 'headerBanner field' },
  { re: /matchups:\s*r\dMatchupOddsData,/, label: 'matchups field' },
  { re: /outrights:\s*r\dOutrightsData,/, label: 'outrights field' },
];

const content = readFileSync(join(PROJECT_ROOT, 'src', 'config', 'event.ts'), 'utf8');

let pass = 0;
let fail = 0;
const failures: string[] = [];
for (const { re, label } of REGEXES) {
  const m = content.match(re);
  if (m) {
    pass++;
    console.log(`  ✓ ${label}: ${m[0].slice(0, 60)}`);
  } else {
    fail++;
    failures.push(label);
    console.log(`  ✗ ${label}: NOT FOUND`);
  }
}

console.log(`\n${pass}/${REGEXES.length} patchEventConfig regexes match current event.ts.`);
if (fail > 0) {
  console.error(`\n❌ FAIL: ${fail} regex(es) don't match. Auto-roll will silently break on round transitions.`);
  console.error(`   Missing: ${failures.join(', ')}`);
  console.error(`\n   Fix: update either src/config/event.ts to match the regex shape, or update the regexes in:`);
  console.error(`   - scripts/auto-roll.ts (patchEventConfig)`);
  console.error(`   - scripts/verify-auto-roll-regexes.ts (this file's REGEXES array)`);
  process.exit(1);
}

console.log(`\n✅ All regexes match. Auto-roll round transitions will work.\n`);
