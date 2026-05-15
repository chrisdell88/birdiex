# PGA Championship 2026 — Build State & Plan

**Status as of 2026-05-15.** This tracks getting birdiex.co updated from the Masters to the PGA Championship (Aronimink GC). Read this to pick up the work on any device.

## Tournament state
- PGA Championship at Aronimink GC. Round 1 **complete**; Round 2 in progress (DataGolf `current_round: 2`).
- Round-2 picks come from Round-1 X Scores (one round of data — round-only and cumulative are identical until R2 completes).

## What's DONE and committed
- `courses.ts` — Aronimink predictability (0.0413) and course-fit coefficients (OTT 0.780 / APP 0.723 / ARG 0.413 / PUTT 0.524) set.
- `data/raw/pga-championship-2026/r1/` — full DataGolf pull for round 1 (live stats, decompositions, matchup odds, outrights).
- `src/data/pgaChampR1Data.ts` — round-1 X Scores built for all 156 players (`build-event.ts`). This is the rankings data, ready.
- X Score formula locked & verified (`docs/X_SCORE_FORMULA.md`).
- Decision locked: the model uses **cumulative totals** for the multi-round track (backtested vs event-averages on the Masters — totals won).

## Round-2 ship — DONE (2026-05-15)
Decisions made: H2H only (no 3-balls); Results = Masters stays + PGA "coming soon"; banner = "PGA CHAMPIONSHIP — R1 FINAL · ROUND 2 PICKS".
- `scripts/build-matchups.ts` — converts DataGolf matchup odds → `MatchupOddsEntry[]`.
- `src/data/pgaChampMatchups.ts` — 169 R2 H2H matchups.
- Frontend swapped: App/Header/MatchupsView/OddsTablePage/ResultsPage/RankingsTable now show the PGA Championship. Masters results stay on the Results page.
- Build + lint pass; verified in browser (rankings, matchups, odds, results, console clean).

## Remaining work
1. **Pipeline fix for Round 2+.** `pull-event.ts`/`build-event.ts` pull `event_avg` for the cumulative track; the model needs accumulating **totals**. Switch to DataGolf's cumulative figure before R2 completes (verify the API supports `event_cumulative`; if not, fall back to summing). Not needed for round-2 picks (R1 data only), needed before R3 picks.
2. **Per-round updates.** After R2 completes: pull r2, build, regenerate matchups for R3. Same for R3→R4.
3. **Full multi-event Results page** (past-tournament look-back + all-time running totals, sortable round/cumulative) — the separate project `CLAUDE.md` flags. Interim "coming soon" is live now.
