# How to Update BirdieX for a New Tournament

**Audience:** Future Claude sessions (and Chris, in plain English).

**Goal:** When a new PGA tournament starts, get the app updated with picks, odds, and live scoring per round — and continue pulling data each round until the tournament ends.

---

## Pre-Tournament (Days Before)

### 1. Confirm the venue + identify the course profile

The model needs **course-specific coefficients** for the SG Score (Layer 1) weights. These come from DataGolf's web tools, not the API.

Check `scripts/lib/courses.ts` for the course slug. If the course isn't there:
- Pull coefficients from **DataGolf → Course Fit Tool** (OTT, APP, ARG, PUTT).
- Pull predictability from **DataGolf → Course History Tool** (the average history adjustment).
- Add a new entry to `COURSES` in `scripts/lib/courses.ts` with the right `is_major` flag.

### 2. Set up the event in the data pipeline

- Add the event slug to `scripts/pull-event.ts` if needed.
- Confirm `.env` has a valid `DATAGOLF_API_KEY`.
- Test pulling field data first: `npx tsx scripts/pull-event.ts <event-slug> --field-only` (or the equivalent dry-run).

### 3. Create the per-event data file

Following the Masters pattern (`src/data/mastersR1Data.ts`), create a new file per event:
- `src/data/<event-slug>R1Data.ts` — round 1 baseline data
- Each new round appends — don't overwrite previous rounds.

---

## During Tournament — Per-Round Workflow

**Every single round of the tournament, do all four pulls before betting closes:**

1. **Cumulative SG breakdown** (`/preds/live-tournament-stats?round=event_cumulative`)
2. **Round-only SG breakdown** (`/preds/live-tournament-stats?round={1,2,3,4}`)
3. **Player decompositions** (`/preds/player-decompositions?tour=pga`)
4. **Matchup odds — all three markets:**
   - `round_matchups` (H2H)
   - `tournament_matchups` (H2H tournament-long)
   - `3_balls` ⚠️ **DO NOT FORGET** — DataGolf does not retain historical 3-ball odds. If you skip a round, that round's 3-ball data is gone forever.

**Critical:** Pull at the same time each round to keep the data aligned. The cron workflow (`.github/workflows/`) handles this when enabled.

---

## Per-round update — one command

After round N completes, from the repo root (`~/Projects/birdiex`), run the
orchestrator. It runs the whole data pipeline in order (pull → build X Scores →
build next-round matchups → grade the round → refresh headshots → build the
ticker) and stops on the first error:

```
npx tsx scripts/update-round.ts --slug <slug> --round <N> --course <course> --prefix <prefix>
```

Example (PGA Championship, after round 2):
```
npx tsx scripts/update-round.ts --slug pga-championship-2026 --round 2 --course aronimink --prefix pgaChamp
```

It skips grading after R1 (no picks yet) and skips next-round matchups/ticker
after R4 (no next round).

Then finish the round by hand (small, one-time per round):
1. **`src/config/event.ts`** — point the data imports at the new files
   (`<prefix>R<N>Data`, `<prefix>R<N+1>Matchups`), bump `picksRound`, update
   `headerBanner` and `lastUpdated`.
2. **Results page events registry** — add `<prefix>R<N>Results`.
3. `npm run build && npm run lint`, verify in the browser, commit, push.

Notes:
- `build-event.ts` applies the locked formula (`scripts/lib/xscore.ts`; see
  `docs/X_SCORE_FORMULA.md`). Cumulative = `event_cumulative` (accumulating SG
  totals — verified against the Masters; NOT `event_avg`).
- Grading uses the stake-to-win-1 convention (win +1.00, loss −stake), matching
  the Masters; best odds across real books (DataGolf's model line excluded).
- Spot-check 3–5 player rows against the raw JSON before committing.
- The individual scripts can still be run standalone — see each script's header
  comment for its flags.

## Post-tournament wrap-up (after R4)

`update-round.ts --round 4` grades the final round and skips the matchup/ticker
steps. To close the event out:
1. Run the round-4 update as above.
2. In the Results page events registry, flip the event's status from
   "in progress" to **complete** — it then shows as a finished past tournament
   and its totals fold permanently into the all-time record.
3. Disable the GitHub Actions cron until the next event.
4. The event's data files stay in the repo as the historical record — never
   edit a completed event's graded numbers.

---

## Update the Frontend

These files reference the active event:

- `src/components/RankingsTable.tsx` — import the correct event's data
- `src/components/MatchupsView.tsx` — H2H + 3-ball cards
- `src/components/Header.tsx` — tournament name + round/cumulative toggle
- `src/components/MethodologyPage.tsx` — results banner if showing past results

For a one-event-at-a-time site (current design), update the data imports. For multi-event later, this becomes a route param.

---

## Shipping the Update

```
npm run build    # must succeed
npm run lint     # must pass
npm run dev      # eyeball desktop + mobile
```

Then commit and push. Vercel auto-deploys. Hard-refresh birdiex.co to confirm.

---

## Post-Round Verification

After each round's pick generation:

1. Verify total bets count looks reasonable (Masters R2 baseline: 63 H2H + 6 3-balls).
2. Spot-check the highest and lowest X Scores against your gut.
3. Confirm signal thresholds didn't break (no players showing "STRONGEST BUY" with X Score < 1.5).
4. Confirm purity rules are applied correctly (any BUY with SG_OTT ≤ -0.45 or SG_APP ≤ -0.45 should be flagged CONFLICTED).

---

## Post-Tournament — Grading + Results

1. Pull final round results and merge into `src/data/resultsData.ts`.
2. Grade every bet against the final scores.
3. Write a results summary into `docs/<event-slug>_RESULTS.md` (following `MASTERS_2026_RESULTS.md`).
4. Update the results banner on `MethodologyPage.tsx`.
5. Update `MEMORY.md` with the tournament totals (record, units, ROI).
6. Decide whether to keep the cron workflow enabled (default: disable between events to avoid wasted API calls).

---

## Common Mistakes to Avoid

- **Skipping 3-ball pulls.** Historical 3-balls are unrecoverable. Pull every round.
- **Forgetting `is_major: true`.** This disables Layer 4 entirely if set wrong. Augusta = true, Aronimink = true, most regular events = false.
- **Hardcoding sportsbook prices.** Always pull fresh odds — line shopping across books is the user's edge.
- **Exposing the formula on the methodology page.** The proprietary edge stays out of public copy.
- **Using round-only data for cumulative picks** (or vice versa). The Masters showed cumulative outperformed round-only by 21+ ROI points. Keep them separate.

---

## When You're Stuck

- Full model details: `docs/X_SCORE_FORMULA.md`
- Past results to compare against: `docs/MASTERS_2026_RESULTS.md`
- Architectural rules: `CLAUDE.md`
- Brand + design system + Chris's preferences: `MEMORY.md`
