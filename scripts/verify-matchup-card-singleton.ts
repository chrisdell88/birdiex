#!/usr/bin/env tsx
/**
 * Build-time guard: ONLY `src/components/MatchupCard.tsx` is allowed to
 * define the matchup-card JSX. Every other component file MUST render
 * cards by importing + using `<MatchupCard ... />`.
 *
 * Why this exists (2026-06-07): I had two copies of the card JSX (one
 * in MatchupsView, one in NextRoundPreview). They drifted — the R4
 * card showed unit size in the top-right slot instead of the dataset
 * chip. Chris caught it. The fix: extract MatchupCard as the single
 * template, ban duplicate definitions, fail the build if anyone
 * reintroduces them.
 *
 * Heuristic: the card's signature is the "Matchup Score" label rendered
 * inline with a numeric matchupScore in a green `text-[#22c55e]` span
 * and a `★` stars run. If a file other than MatchupCard.tsx contains
 * BOTH the literal "Matchup Score" text AND a span with the matchup
 * score class, that file is defining its own card markup.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;
const COMPONENTS_DIR = join(PROJECT_ROOT, 'src/components');
const CANONICAL = 'MatchupCard.tsx';

// Files where the literal text "Matchup Score" is legitimate but NOT a
// card definition (banners, glossary text, popups, etc). Tight — every
// entry needs a clear reason.
const ALLOWED_NON_CARD: Set<string> = new Set([
  'BetSizingLadder.tsx', // glossary: "Matchup Score (Edge)" column header
  'MatchupsGlossary.tsx', // glossary: explains "Matchup Score" term
  'RecommendedFloorBadge.tsx', // "Best Bet Matchup Score Threshold" copy
  'MatchupHeatmap.tsx', // heatmap labels mention matchup score
]);

function listTsx(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listTsx(full));
    else if (e.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const files = listTsx(COMPONENTS_DIR);
const violations: { file: string; line: number; text: string }[] = [];

// The canonical card has this distinctive markup:
//   <span ... >Matchup Score</span>
//   <span ...text-[#22c55e]...>{matchupScore.toFixed(2)}</span>
// Detect by looking for the literal "Matchup Score" string + a sibling
// span class containing the green hex AND tabular-nums-y formatting on
// the next ~10 lines. If both are present in a file that isn't
// MatchupCard.tsx, it's defining its own card.
for (const file of files) {
  const basename = file.split('/').pop() ?? '';
  if (basename === CANONICAL) continue;
  if (ALLOWED_NON_CARD.has(basename)) continue;

  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('Matchup Score')) continue;
    // Look in a 12-line window for the green-classed matchupScore span.
    const window = lines.slice(i, Math.min(lines.length, i + 12)).join('\n');
    const hasScoreSpan = /text-\[#22c55e\][^>]*>\s*\{[^}]*matchupScore[^}]*\.toFixed/.test(window);
    const hasStarsLoop = /'★'\.repeat\(stars\)/.test(window);
    if (hasScoreSpan || hasStarsLoop) {
      violations.push({ file: file.replace(PROJECT_ROOT, ''), line: i + 1, text: line.trim() });
      break; // one violation per file is enough
    }
  }
}

if (violations.length > 0) {
  console.error('❌ FAIL: matchup-card JSX defined outside the canonical MatchupCard.tsx.');
  console.error('');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.text}`);
  }
  console.error('');
  console.error('  Fix: import MatchupCard from "./MatchupCard" and render <MatchupCard ... />');
  console.error('  with the props (matchupScore, tier, pick, opponent, bestOdds, sportsbookLink,');
  console.error('  datasetChip, hideSignal, doubleSignal, renderPickName?, renderOpponentName?).');
  console.error('  See src/components/MatchupCard.tsx for the full prop contract.');
  console.error('');
  console.error('  Two copies of the card layout will eventually drift. The 2026-06-07 R4 unit-');
  console.error('  size bug was exactly this — same words different slots, two seconds to ship,');
  console.error('  three messages to clean up.');
  process.exit(1);
}

console.log(`✅ Matchup-card singleton check passed.`);
console.log(`   ${files.length} component files scanned. Only MatchupCard.tsx defines card markup.\n`);
