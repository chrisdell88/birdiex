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

## What's NOT done — remaining work
1. **Matchup-pick script.** No script turns DataGolf matchup odds into H2H picks. Raw odds are pulled (`matchups-round_matchups.json`, 169 R2 matchups). Need a script: match players to X Scores, pick higher, edge = |X diff|, tier (≥1.95 BEST BET / ≥1.45 STRONG PLAY / ≥0.95 LEAN / else NO PLAY), best odds across books.
2. **Frontend swap.** `App.tsx` + components are wired to Masters data with Masters-specific export names. Needs to point at the PGA Championship data.
3. **Pipeline fix for Round 2+.** `pull-event.ts`/`build-event.ts` pull `event_avg` for the cumulative track; the model needs accumulating **totals**. Must switch to DataGolf's cumulative figure before R2 completes (verify the API supports `event_cumulative`; if not, fall back to summing).
4. **Results page.** Per `CLAUDE.md`, full multi-event (past-tournament look-back + all-time totals) is a separate project. Interim: Masters results stay visible; PGA Championship shows a "results coming soon" state until R2 grades.

## Open decisions needed from Chris
- **3-balls:** include 3-ball picks in the live app, or H2H only for now?
- **Results page:** interim approach (Masters stays + PGA "coming soon") now, full multi-event results page as its own project later — confirm?
- **Copy:** exact wording for the header banner (currently "LAST UPDATED: MASTERS R4 FINAL") and the "results coming soon" text. (Per project rule, Claude does not write user-facing copy without Chris's approval.)

## Execution order once decisions are in
1. Switch pipeline to cumulative totals.
2. Build + run the matchup-pick script for R2.
3. Frontend swap to PGA Championship data + approved copy.
4. `npm run build` + `npm run lint` + dev check desktop/mobile.
5. Commit, push, verify on birdiex.co.
