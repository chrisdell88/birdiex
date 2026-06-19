# BirdieX Operations Log

Durable, append-only record of every event roll, grade, data fix, and known
issue — so history survives across sessions and nobody relies on memory.
Newest first. Dates are absolute.

---

## 2026-06-19 — U.S. Open roll + RBC R4 data-integrity finding

**U.S. Open 2026 (Shinnecock Hills) — rolled live.** Site had been frozen on
the completed RBC Canadian Open for days because the U.S. Open was never staged.
Fixed: staged Shinnecock in courses.ts (Course-Fit coefficients read from the
DataGolf radar SVG — DD 0.70 / DA 0.58 / APP 0.73 / ARG 0.44 / PUTT 0.48,
ott=max=0.70), venues.ts, eventSchedule.ts, allTimeStats. Predictability 0.0396
(field method) → floor 2.45. isMajor. Commits 30ca821 / 74ee2e7.
- U.S. Open R2 picks logged (78-pairing board; 1 best bet at 2.45: Conners over
  Fox, edge 2.52). R2 results auto-grade on completion via auto-roll.

**RBC Canadian Open — R4 NEVER GRADED + DATA CONTAMINATED (OPEN ISSUE).**
- RBC R2/R3 results ARE clean and correct in the all-time record (verified:
  rbcCanadianR2Results 24 bets / R3Results 36 bets, zero contamination).
- RBC R4 was never graded (the finished-branch grade never ran during the
  chaotic RBC→US-Open handoff).
- During the week the site sat frozen on RBC while the U.S. Open played, the
  automated pipeline scribbled U.S. Open data into the RBC files. By HEAD the
  contaminated versions were: rbcCanadianR4Matchups (230 pairings, LIV/US-Open
  names), rbcCanadianR3Data (606 "players", 8 LIV names).
- CLEAN pre-contamination snapshots identified in git history:
  - rbcCanadianR4Matchups: commit **357f044** (2026-06-14, round_num 4,
    150 pairings, 0 contamination).
  - rbcCanadianR3Data: commit **05a92cd** (2026-06-14, ~129 players, 0 LIV).
  - R4 final scores: ESPN event **401811951** (per-round linescores; period 4
    = R4 strokes). Retrievable any time.
- These clean snapshots have been restored to HEAD (de-contaminating the repo).
- **RBC R4 grade is STILL PENDING** — a first grade attempt with the clean
  inputs came out near-inverse (5-20-3 / −58u), which is a grading-alignment
  bug, NOT a real result (Chris confirms −58u is wrong). NOT committed to the
  record. Needs the alignment bug isolated (suspect: X-score↔matchup mapping
  or the synthesized R4-score field) before grading. Clean inputs above make
  this a fast job once the bug is found.

## Earlier (condensed)
- Memorial 2026 (Muirfield Village): R4 re-graded against published snapshot →
  5 BBs, 2-3-0, −4.91u (the 4 phantom −525/−625 "picks" were in-play
  contamination, removed). Event COMPLETE.
- CJ Cup Byron Nelson: publishedFloor locked at 1.95 (1.95–2.45 band carried
  the event; 2.45+ was the Seamus Power correlated-fade blow-up).
- PGA Championship (Aronimink): publishedFloor locked at 2.45 (5-0-0 / +10.50u).
- Policy guards (src/__tests__/policy-guards.test.ts) enforce: no R1 picks,
  venue integrity (courses↔venues↔schedule consistency), allTimeStats wiring,
  flag-only odds (no auto-drop). Run in `npm run build`.

## Standing rules (do not violate)
- NO Round-1 picks, ever (model needs a completed round of live SG).
- Grade against the COMMITTED announcement-time matchup snapshot, never the
  live/drifted feed.
- NEVER log an unverified or near-inverse grade into the record. Spot-check.
- DataGolf does not retain historical round odds — capture every round live.
- Model/eligibility/sizing thresholds are Chris's decisions; propose, don't
  encode unilaterally.
