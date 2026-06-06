# Data Flow Audit & Plan — 2026-06-06

## Why this doc exists

Chris audited the Results page on 2026-06-06 and immediately spotted a stale
"ALL-TIME TRACKED RECORD" graphic on the Methodology page:

| Page | Banner | All-Time Record | Units | ROI | Events |
|---|---|---|---|---|---|
| Results | `ALL-TIME RECORD` | 161-88-29 | +91.28u | +22.6% | 5 |
| Methodology | `ALL-TIME TRACKED RECORD` | **135-70-21** ← stale | +85.30u | +28.4% | (none stated) |

Same metric, two different numbers. The numbers had drifted because the
two pages computed all-time totals independently from different import
lists, and only one was updated when CJ / CSC / Memorial were added.

Chris's broader point: when ONE graphic is visibly stale, users assume
EVERY graphic is wrong. That's correct. Trust is binary.

This doc:
1. Diagnoses why we got here.
2. Lists every surface that displays computed numbers and labels it
   `LIVE` / `STATIC` / `STALE` based on the audit.
3. Lays out the plan to make stale impossible, not just unlikely.

---

## Root cause — fragmented source of truth

Until today, computing "all events tracked record" lived in 5 separate
files, each with its own hand-curated import list:

| File | Events imported | What it powered |
|---|---|---|
| `src/lib/allTimeStats.ts` | Masters, PGA | Methodology banner |
| `src/components/ResultsPage.tsx` | Masters, PGA, CJ, CSC, Memorial | Results banner |
| `src/components/EdgeDistributionChart.tsx` | Masters, PGA | Methodology histogram |
| `src/components/EquityCurve.tsx` | Masters, PGA | Results equity curve |
| `src/components/BacktestLab.tsx` | All 5 (recently fixed) | Lab page |

Adding an event required touching all 5 files. Historically only some
got updated, so each new event silently desynced more of the site.
This is *exactly* the kind of bug that runs for weeks before a user
catches it.

---

## Fix landed today

### 1. ONE source of truth — `src/lib/allTimeStats.ts`

Rewritten to auto-discover every `src/data/*Results.ts` file via Vite's
`import.meta.glob`. Adding a new event = drop the grader output into
`src/data/` + add the prefix to one map. No component edits.

Exports:
- `allTimeStats` — canonical record (wins / losses / pushes / units / staked / roi / bets)
- `eventBuckets` — per-event raw + tracked + per-round breakdown
- `allTrackedBets` — flat list of every tracked bet across every event
- `mastersStats`, `pgaStats`, `cjStats`, `cscStats`, `memorialStats` — per-event summaries
- `allTimeEventCount` — for "N tournaments" labels

### 2. Three consumers re-wired to the lib

- `ResultsPage.tsx` — banner reads from `allTimeStats` (was inline sum of 5 events)
- `EdgeDistributionChart.tsx` — histogram reads `eventBuckets` (was Masters + PGA only)
- `EquityCurve.tsx` — curve reads `eventBuckets` (was Masters + PGA only)
- Methodology banner — was already reading `allTimeStats`; now gets all 5 events automatically

### 3. Build-time guard — `scripts/verify-all-time-totals.ts`

Runs on every `npm run build` (after the other 3 verify steps). Fails
loud if:
1. Any `*Results.ts` file on disk doesn't have a prefix in
   `PREFIX_TO_EVENT_ID`. New events file landing without a registry
   entry = build fails.
2. Any component file does inline all-time math (`const allTimeWins = …
   + …`). Forces components to use the lib.

---

## Full surface audit — what shows what data

Each surface is labeled by how it sources its numbers:

| Surface | Component | Source | Status |
|---|---|---|---|
| Header — UPDATED N PM EDT | `Header.tsx` | `currentEvent.dataUpdatedAt` ← max(rankingsBuild, tickerRefresh) | ✅ LIVE |
| Ticker | `Ticker.tsx` | `src/data/ticker.ts` ← rebuilt every 30 min | ✅ LIVE |
| Rankings table | `RankingsTable.tsx` | `currentEvent.rankingsRound` / `rankingsCumulative` | ✅ LIVE |
| Matchups page | `MatchupsView.tsx` | `currentEvent.matchups` + tier from `currentEvent.recommendedFloor` | ✅ LIVE (after 2026-06-06 floor refactor) |
| Odds page | `OddsTablePage.tsx` | `currentEvent.matchups` + venue floor | ✅ LIVE |
| Simulator | `SimulatorPage.tsx` | `currentEvent.skillEstimates` | ✅ LIVE |
| Methodology banner | `MethodologyPage.tsx` | `allTimeStats` from lib | ✅ LIVE (after today's fix) |
| Results banner | `ResultsPage.tsx` | `allTimeStats` from lib | ✅ LIVE (after today's fix) |
| Results per-event | `ResultsPage.tsx` | Per-event inline summaries + venues.ts floor | ✅ LIVE |
| Equity Curve chart | `EquityCurve.tsx` | `eventBuckets` from lib | ✅ LIVE (after today's fix) |
| Edge Distribution chart | `EdgeDistributionChart.tsx` | `eventBuckets` from lib | ✅ LIVE (after today's fix) |
| Predictability bar chart | `PredictabilityBarChart.tsx` | `VENUES` from venues.ts | ✅ LIVE |
| Course Adaptive chart | `CourseAdaptiveChart.tsx` | static methodology illustration | ⚪ STATIC by design |
| Putting Regression chart | `PuttingRegressionChart.tsx` | PGA Championship R1 + R2 frozen snapshot | ⚪ STATIC by design — illustrates the model on a fixed dataset |
| SG Persistence chart | `SgPersistenceChart.tsx` | hardcoded research finding | ⚪ STATIC by design |
| Bet Sizing Ladder | `BetSizingLadder.tsx` | hardcoded universal ladder | ⚪ STATIC by design |
| BacktestLab | `BacktestLab.tsx` | all per-event files via glob + inline imports | ✅ LIVE |

**Charts labeled `STATIC by design`** are reference illustrations that
shouldn't change round-to-round (they document the methodology, not the
current event). If a future redesign makes any of them venue-aware, move
the data source to the lib.

---

## Build-time guard stack — every check that runs on `npm run build`

```
npm run build
  → verify:auto-roll       (patchEventConfig regexes still match event.ts)
  → verify:floor-refs      (no hardcoded tier comparisons in components)
  → verify:workflow-env    (workflow env blocks match active event)
  → verify:all-time        (results files registered + no inline math) ← NEW
  → tsc -b && vite build
```

Plus weekly Sunday audit (`code-audit.yml`) reruns all 4 verify steps +
TypeScript + ESLint + npm audit + Supabase healthcheck. Opens a GitHub
issue if anything fails.

---

## Round-Transition Checklist — updated

When a round completes (auto-roll or manual), every surface below must
refresh. Items marked `auto` happen automatically with the new system;
items marked `manual` need explicit script invocation.

| # | Surface | How | Now auto? |
|---|---------|------|-----|
| 1 | Round data file (`memorialR<N>Data.ts`) | `build:event` | manual |
| 2 | Next-round matchups (`memorialR<N+1>Matchups.ts`) | `build-matchups.ts` (auto-rolls + ticker tick) | auto (every 30 min during play) |
| 3 | Outrights (`memorialR<N+1>Outrights.ts`) | `build-outrights.ts` (ticker tick) | auto (every 30 min) |
| 4 | Skill estimates (`memorialSkillEstimates.ts`) | `build-skill-estimates.ts` | manual |
| 5 | Graded results (`memorialR<N>Results.ts`) | `grade-round.ts` | manual |
| 6 | Ticker | `build-ticker.ts` | auto (every 30 min) |
| 7 | event.ts config | `patchEventConfig` | auto (auto-roll) |
| 8 | Auto-roll state | state file write | auto |
| 9 | Notify Discord + email | `notify.ts` | auto (gated on Best Bets) |
| 10 | Results page per-event card | `import.meta.glob` picks up new Results file | **auto** ← new |
| 11 | Results page all-time banner | `allTimeStats` includes new file | **auto** ← new |
| 12 | Methodology banner | reads `allTimeStats` | **auto** ← new |
| 13 | Equity Curve chart | reads `eventBuckets` | **auto** ← new |
| 14 | Edge Distribution chart | reads `eventBuckets` | **auto** ← new |
| 15 | BacktestLab Memorial tab | `import.meta.glob` picks up new Results file | **auto** |

The pattern: anything graded → drop a `*Results.ts` file in `src/data/`
→ everything user-facing updates next build. Period.

---

## Next steps (not done yet — flagged for future sprints)

1. **Verify banner numbers match cross-page at build time.** Today's
   guard ensures both banners SOURCE from the same lib, but doesn't
   render-test the strings. A small integration test that mounts each
   page and asserts both banners read identical numbers would catch a
   future regression where someone reformats one banner but not the other.

2. **Move PuttingRegressionChart to a frozen snapshot file.** Currently it
   imports `pgaChampR1Data` / `pgaChampR2Data` directly. If we ever
   retire those filenames, the chart breaks. Snapshot to a dedicated
   `methodologyDemoData.ts` file.

3. **SgPersistenceChart hardcoded numbers.** The chart shows persistence
   percentages baked into the source. If the underlying research updates,
   this needs a manual edit. Future: pull from a research-output JSON file.

4. **MethodologyPage 26.2% ROI mention.** One sentence on the Methodology
   page (~line 307) references "Masters … +26.2% ROI at the 0.95 floor"
   inline. If Masters numbers change, this sentence drifts. Should pull
   from `mastersStats.roi`.

These are tracked here so a future Claude session sees the work-list
without me having to remember.
