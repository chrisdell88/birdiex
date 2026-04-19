# birdiex — Project Memory

**Last updated:** 2026-04-17
**Repo:** https://github.com/chrisdell88/birdiex

## Session start protocol
1. `cd ~/Projects/birdiex` (or work inside cloud Claude Code sandbox)
2. `git pull`
3. Read this file
4. Check `git log --oneline -10` for recent context

## Current active branch
- `claude/rbc-heritage-csv-upload-wOFkI` — RBC Heritage 2026 work

## Project layout
- `src/types/index.ts` — all shared types (PlayerData, Signal, Purity, `TournamentId`, `TOURNAMENTS`)
- `src/data/mastersR1Data.ts` — Masters 2026 final data (`roundOnlyData` = R4, `cumulativeData` = R1+R2+R3+R4)
- `src/data/rbcHeritageR1Data.ts` — RBC Heritage 2026 R1 data (computed at module load from raw DataGolf CSV rows)
- `src/data/matchupOdds.ts` — Masters matchup odds (R2/R3/R4) — Heritage odds NOT wired yet
- `src/data/resultsData.ts` — Masters bet log + unit tracking
- `src/components/Header.tsx` — houses the **tournament toggle** (Heritage ⇄ Masters)
- `src/components/{RankingsTable,MatchupsView,OddsTablePage,MethodologyPage,ResultsPage}.tsx`

## Tournament toggle
- Heritage is the default on page load (since it's the active event).
- Heritage sub-views:
  - **Rankings** → live (Heritage R1 X Scores)
  - **Matchups** → shows Top-10 BUY/FADE candidates + "awaiting odds" banner (no matchup odds loaded)
  - **Odds** → empty-state placeholder
  - **Methodology** → includes Harbour Town course-fit addendum
  - **Results** → empty-state placeholder
- Masters remains fully accessible via toggle — no Masters UX regressions.

## Heritage X Score formula (Harbour Town weighting)
Implemented in `src/data/rbcHeritageR1Data.ts::computeHeritagePlayer`.

```
L1 = 0.25 * (0.7*sg_ott + 1.4*sg_app + 1.3*sg_arg - 0.6*sg_putt)
L2 = 0                                               // course history - not in R1 CSV
L3 = (accuracy - 0.57)*0.8                           // reward accuracy above Tour avg
   + ((282 - distance)/100)*0.25                     // penalize distance above HT ideal
   + max(0, sg_arg) * 0.05                           // short-game bonus
L4 = 0                                               // Heritage is NOT a major
X  = L1 + L2 + L3 + L4
```

Signal thresholds (same as Masters):
- `>=1.5` STRONGEST BUY, `>=1.0` STRONG BUY, `>=0.5` BUY, `>=0.25` LEAN BUY
- `-0.25..0.25` NEUTRAL
- `<=-0.25` LEAN SELL, `<=-0.5` SELL, `<=-1.0` STRONG SELL, `<=-1.5` STRONGEST SELL

Purity (±0.45 on sg_ott + sg_app):
- Buy + both ≥ +0.45 → PURE BUY, else CONFLICTED
- Fade + both < +0.45 → PURE, else CONFLICTED

## Next work (not done yet)
1. Pull R2/R3/R4 Heritage DataGolf CSVs as rounds complete → append to `rbcHeritageR1Data.ts` (rename file to `rbcHeritageData.ts` with R1/R2/.../cumulative exports, mirroring Masters layout).
2. Wire Heritage matchup odds (DraftKings, FanDuel, bet365, Pinnacle, Bovada, DataGolf model) into a new `heritageMatchupOdds.ts`; update MatchupsView + OddsTablePage to pull round-appropriate data per tournament.
3. Add Heritage bet log to `resultsData.ts` or split into `mastersResultsData.ts` / `heritageResultsData.ts` so ResultsPage can render either.
4. L2 course-history for Harbour Town: export DataGolf's course-history SG for this venue and compute `course_history_l2`.
5. Optional: introduce `courseConfig` map with per-course weight profiles so X Score weights aren't duplicated per data file.

## Build / verify
- `npm install && npm run build` → passes
- Sanity: Heritage top-10 led by Highsmith, Mouw, Morikawa, Berger, Brennan, MacIntyre, Glover, Fowler, Harman, Fox. Top fades are Pendrith, Echavarria, Finau, Burns, Yellamaraju.
