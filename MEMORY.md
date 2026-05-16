# BirdieX — Project Memory

**Last updated:** 2026-05-16
**Repo:** https://github.com/chrisdell88/birdiex
**Live:** https://birdiex.co
**Project path:** ~/Projects/birdiex
**Current event:** PGA Championship 2026 at Aronimink — Round 3 live (R2 complete & graded).

## 🚨 READ THIS FIRST (any new Claude session)

The full source-of-truth for BirdieX is **inside this repo** under `docs/`. You do not need any files outside the repo.

| File | What's in it |
|------|--------------|
| `docs/X_SCORE_FORMULA.md` | Canonical X Score formula — LOCKED & VERIFIED. The 4 layers, course weights, worked examples |
| `docs/COURSE_COEFFICIENTS_RESEARCH.md` | How course-fit coefficients are derived (incl. the OTT method) |
| `docs/MASTERS_2026_RESULTS.md` | Full Masters results report |
| `docs/NEW_TOURNAMENT_RUNBOOK.md` | Per-round + post-tournament workflow (the `update-round.ts` one-command flow) |
| `docs/PGA_CHAMPIONSHIP_BUILD.md` | PGA Championship build state / decisions |
| `docs/UPDATE_FROM_PHONE.md` | How Chris updates the app from his phone via Claude mobile |
| `CLAUDE.md` | Rules + conventions (secrets, architecture, conventions) |
| `MEMORY.md` (this file) | Project context, model summary, results, design, preferences |

**Chris is non-technical.** Speak plain English. Specific Finder paths and copy-paste-able commands beat jargon every time. Execute — don't ask him to do technical steps you can do yourself.

## Session start protocol
1. `cd ~/Projects/birdiex`
2. `git pull` (auto via hook)
3. Read `MEMORY.md` (this file) + `CLAUDE.md`
4. If you'll touch the model: read `docs/X_SCORE_FORMULA.md`
5. If you'll add/update a tournament: read `docs/NEW_TOURNAMENT_RUNBOOK.md`
6. Check `git log --oneline -10` for recent context

---

## What BirdieX Is
PGA Tour golf betting analytics app. Proprietary "X Score" putting regression model combining 4 layers of analysis. Tracks recommended bets with full unit/ROI accounting. Part of BallerX brand family (BracketX, MockX, BirdieX).

**Target users:** Sports bettors looking for edge in golf matchup markets (H2H, 3-balls). Built by Chris Dell (Fantasy Edge Media, BettingPredators.com).

---

## Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4
- **Backend (data):** Static data files in src/data/ (pulled from DataGolf API)
- **Deploy:** Vercel (auto-deploy on git push to main)
- **Domain:** GoDaddy → A record → Vercel (76.76.21.21)
- **Node:** Use npm commands, project uses Vite's default build

---

## The X Score Model (4 Layers)

**CANONICAL FORMULA:** `docs/X_SCORE_FORMULA.md` is the single source of truth —
LOCKED & VERIFIED 2026-05-15 (reproduces all 145 stored Masters X Scores, 145/145).
Implemented in `scripts/lib/xscore.ts` + `scripts/lib/courses.ts`. Course-coefficient
method: `docs/COURSE_COEFFICIENTS_RESEARCH.md`. Key points:
- Layer 1 weights = course-fit coefficients blended toward equal by course
  predictability (`norm = predictability / 0.15`).
- **OTT coefficient = the higher of the two driving numbers** (Driving Distance
  vs Driving Accuracy) off the DataGolf Course Fit radar, Relative Importance OFF.
- predictability = mean |total_course_history_adjustment| across the field.
Never change the formula without Chris's explicit approval.

**IMPORTANT:** The methodology page does NOT expose the actual weights/formula. Keep it proprietary.

1. **SG Score (Layer 1):** Course-fit-weighted putting regression on live round data
   - Formula: `(w_OTT×SG_OTT + w_APP×SG_APP + w_ARG×SG_ARG − w_PUTT×SG_PUTT) / sum(weights)`
   - Weights from DataGolf course fit coefficients, scaled by course predictability
   - Augusta weights: OTT=0.759, APP=0.666, ARG=0.414, PUTT=0.432, denominator=2.271

2. **Course History (Layer 2):** DataGolf `total_course_history_adjustment`

3. **Course Fit + SG Category (Layer 3):** `total_fit_adjustment + strokes_gained_category_adjustment`

4. **Major Adjustment (Layer 4):** `major_adjustment` (zero at non-majors)

**Final X Score = L1 + L2 + L3 + L4**

### Signal Thresholds
- X Score ≥ 1.50: STRONGEST BUY / SELL
- X Score ≥ 1.00: STRONG BUY / SELL
- X Score ≥ 0.50: BUY / SELL
- X Score > -0.50 to < 0.50: NEUTRAL (not HOLD — renamed)

### Purity Rules (critical)
- Buy is CONFLICTED if SG_OTT ≤ -0.45 OR SG_APP ≤ -0.45
- Sell/Fade is CONFLICTED if SG_OTT ≥ 0.45 OR SG_APP ≥ 0.45
- Putting is NOT a purity filter (already baked into X Score)

### Matchup Tiers (H2H)
- Edge ≥ 1.95: BEST BET (Tier 1) — flashing badge
- Edge 1.45-1.94: STRONG PLAY (Tier 2)
- Edge 0.95-1.44: LEAN (Tier 3)

### 3-Ball Rules
**3-balls are OFF the site as of 2026-05-16 (Chris's call — H2H only until further
notice).** No 3-ball UI/picks anywhere. The Masters historical totals still
include its 6 R2 3-ball bets (the published record is unchanged). Rules kept for
reference if 3-balls return: 2 of 3 must be fades, pick = the non-fade player,
edge = pick − avg of the 2 fades.

### Backtesting Buckets (6 total, paired for comparison)
- A1: Raw Buy vs Raw Fade | A2: Pure Buy vs Pure Fade
- B1: Anyone vs Raw Fade | B2: Anyone vs Pure Fade
- C1: Raw Buy vs Anyone | C2: Pure Buy vs Anyone

---

## DataGolf API
- **Key:** Stored in `.env` as `DATAGOLF_API_KEY` (gitignored). See `.env.example`.
- **Rate limit:** 45 req/min
- **Base URL:** `https://feeds.datagolf.com`
- **Security note:** Current key was committed publicly in MEMORY.md from commit `db7c41f` (Apr 18 2026) until sanitized on 2026-05-13. Key remains in git history. DataGolf doesn't expose rotation via UI — email support for true rotation.

### Critical endpoints
- `/preds/live-tournament-stats?stats=sg_putt,sg_arg,sg_app,sg_ott,sg_bs,sg_t2g,distance,accuracy&round={1,2,3,4,event_cumulative}&display=value`
- `/preds/player-decompositions?tour=pga` (for Layers 2-4)
- `/betting-tools/matchups?tour=pga&market={round_matchups,tournament_matchups,3_balls}&odds_format=american`
- `/betting-tools/outrights?tour=pga&market={win,top_5,top_10,top_20}`
- `/preds/in-play` (live scoring)
- `/field-updates?tour=pga`

### LESSON LEARNED
**Pull 3-ball odds EVERY round at the same time as H2H.** We missed R3 3-balls at the Masters and DataGolf doesn't retain historical round odds — data is lost forever. Automate this in the pipeline for future tournaments.

---

## Masters 2026 Tournament Results (First Real Test)

### Tournament Totals
- **221 total bets (H2H + 3-Ball)**
- **130-70-21 record**
- **+46.60 units**
- **+17.8% ROI**

### Per-Round (H2H only)
| Round | Bets | Record | Units | ROI |
|-------|------|--------|-------|-----|
| R2 (from R1 picks) | 63 | 36-23-4 | +5.15u | +6.5% |
| R3 Round-Only (from R2 picks) | 38 | 21-14-3 | +4.37u | +10.6% |
| R3 Cumulative (from R1+R2 picks) | 40 | 20-14-6 | +2.96u | +7.4% |
| R4 Round-Only (from R3 picks) | 26 | 13-10-3 | +3.21u | +9.7% |
| R4 Cumulative (from R1-R3 picks) | 54 | **40-9-5** | **+30.91u** | **+45.6%** |

### 3-Ball Results
- R2: 6 qualifying, 3-3-0, -0.91u
- R3: Data lost (not pulled in time)
- R4: Books didn't offer 3-balls

### Key Findings
1. **Cumulative model beat Round-Only across R3+R4:** 60-23-11, +33.87u, +31.4% ROI vs Round-Only 34-24-6, +7.58u, +10.2% ROI
2. **STRONG PLAY tier was best:** 27.2% ROI across tournament
3. **BUY+FADE bucket was best:** 22.0% ROI
4. **FanDuel best book:** 48.1% ROI (small sample 9-1-3)
5. **R4 cumulative model went on a heater:** 40-9-5 — historic performance

### Top X Scores (Full Tournament Cumulative, Final)
1. Schauffele (+4.09)
2. Rose (+4.08)
3. Scheffler (+3.84)
4. Spieth (+3.44)
5. Henley (+3.38)
6. McIlroy (+3.35) — won the tournament

---

## PGA Championship 2026 (current event — Aronimink)

- **Round 3 is live.** R1 and R2 complete; R2 picks graded.
- **R2 results: 27-24-4, −2.27u, −3.6% ROI** (55 H2H bets). A flat/slightly-down
  round — Aronimink is a low-predictability course (0.0413 vs Augusta's 0.144),
  so the model runs close to a flat putting regression there.
- **All-time (Masters + PGA): 157-94-25, +44.33u, +13.6% ROI** (276 bets).

## Results accounting / grading convention

Graded by `scripts/grade-round.ts`. Stake-to-win-1-unit (matches the Masters):
**win = +1.00, loss = −(stake), push = 0.** Stake from American odds: −X → X/100,
+X → 100/X. Best odds taken across **real** sportsbooks (DataGolf's "datagolf"
model line excluded). ROI = net units ÷ total staked. The Masters' staked is
derived from its published units ÷ ROI so its slice always reconciles to 17.8%.

## Data pipeline (scripts/)

Per-round update is **one command**: `npx tsx scripts/update-round.ts --slug <slug>
--round <N> --course <course> --prefix <prefix>`. It chains:
- `pull-event.ts` — pulls DataGolf data for a round (live stats incl.
  `event_cumulative`, decompositions, matchup odds, outrights)
- `build-event.ts` — X Scores → `src/data/<prefix>R<N>Data.ts` (roundOnly + cumulative)
- `build-matchups.ts` — H2H matchup odds → `MatchupOddsEntry[]`
- `grade-round.ts` — grades the completed round's picks
- `build-headshots.ts` — ESPN headshot map → `src/data/headshots.ts`
- `build-ticker.ts` — tee times + scores → `src/data/ticker.ts`

Then update `src/config/event.ts` (the single config that drives the current
round across the app — data imports, `picksRound`, banner) + the Results events
registry, then build/lint/verify/ship. Full steps: `docs/NEW_TOURNAMENT_RUNBOOK.md`.

DataGolf course-fit coefficients are pulled manually from the Course Fit web
tool (not in the API) — see `docs/COURSE_COEFFICIENTS_RESEARCH.md`.

---

## App Structure

### Pages/Tabs
1. **RANKINGS** — Sortable table (round-only or cumulative toggle). SG_PUTT/APP/OTT columns + 4 layer breakdowns + X Score + Signal. Player search dropdown.
2. **MATCHUPS** — H2H matchup cards (3-balls off the site as of 2026-05-16). Round filter. Definitions key modal. Clickable player names with stat popup. Player search dropdown.
3. **ODDS** — Full odds comparison table across sportsbooks per bet. Filter by round/type/min edge. Best odds highlighted green.
4. **METHODOLOGY** — Concept explanation (no formula exposed). Results banner. Chris Dell bio + "why putting regression" research.
5. **RESULTS** — Multi-event bet log. Tournament picker (All-Time / Masters / PGA Championship). All-Time view leads with the running total. Filter by round, data set, sportsbook, bet type. Tier + bucket breakdowns. Player search dropdown.

Near the top of the app: an auto-scrolling **ticker** (`Ticker.tsx`) showing the current round's tee times + live scores.

### Key Components
- `src/components/Header.tsx` — Logo, tabs, round/cumulative toggle, FINAL badge
- `src/components/Footer.tsx` — Share bar (Copy Link, X, Text, Email) + "Chris Dell: Founder" + family links
- `src/components/RankingsTable.tsx` — Main data table with sort/filter/search
- `src/components/MatchupsView.tsx` — H2H matchup cards
- `src/components/OddsTablePage.tsx` — Cross-book odds comparison
- `src/components/ResultsPage.tsx` — Multi-event bet log + breakdowns + tournament picker
- `src/components/MethodologyPage.tsx` — About + model explanation
- `src/components/PlayerDetailCard.tsx` — Inline expansion for stats
- `src/components/SignalBadge.tsx` — Colored buy/sell badges
- `src/components/PurityIcon.tsx` — Pure (✓) or Conflicted (⚠️) indicator
- `src/components/Avatar.tsx` — Golfer headshot with initials-circle fallback
- `src/components/PlayerSearch.tsx` — Reusable type-ahead player search combobox
- `src/components/Ticker.tsx` — Auto-scrolling tee-times + scores marquee

### Config (src/config/)
- `event.ts` — single source of truth for the current round. `currentEvent` drives data imports, `picksRound`, header banner, `lastUpdated` across the whole app. Per-round update = edit this one file.

### Data Files (src/data/)
- `mastersR1Data.ts` — Masters: `roundOnlyData` (R4-only) + `cumulativeData` (R1-R4) + `r1Data`
- `matchupOdds.ts` — Masters per-round H2H odds + X Score maps
- `threeBallData.ts` — Masters R2 3-ball picks (historical only — 3-balls off the site)
- `pgaChampR2Data.ts`, `pgaChampR3Data.ts`, … — PGA Championship per-round X Score data (roundOnly + cumulative), generated by `build-event.ts`
- `pgaChampR3Matchups.ts`, … — PGA Championship per-round H2H matchup odds
- `pgaChampR2Results.ts`, … — PGA Championship per-round graded results + summary
- `resultsData.ts` — 221 verified Masters bets with round/tier/bucket/book breakdowns
- `headshots.ts` — generated name→ESPN headshot URL map
- `ticker.ts` — generated current-round tee times + live scores

---

## Design System

### Colors
- Background: `#0a0a0a` (jet black)
- Card background: `#0a0a0a` with border `#262626` (ghost)
- Text primary: `#f5f5f5` (white)
- Text secondary: `#d4d4d4` (light gray — NOT dull gray)
- Green accent (active/buy): `#22c55e` (bright green)
- Red accent (sell/fade): `#ef4444`
- Dark emerald: `#006747` (subtle accents)

### Typography
- Monospace (numbers/tabs): JetBrains Mono, SF Mono
- Sans-serif (body): Inter
- Nav tabs: uppercase, letter-spacing 0.12em, size 13-14px, weight 500 (matches BracketX)

### Button Style
- Ghost design: 1px green border, transparent/black bg, white text
- Active state: filled green bg with dark text
- Tournament badge: same ghost style as round/cumulative toggle

### Mobile
- Footer compact (single line share bar on mobile)
- Table scrolls horizontally (html/body overflow-x hidden to prevent page scroll)
- Matchup 2-col stacks vertically on mobile

---

## Brand Identity
- **Domain:** birdiex.co (purchased on GoDaddy)
- **Logo:** "BIRDIE" in white + "X" in green (#22c55e) bold
- **Subtitle:** "PUTTING REGRESSION MODEL" (NOT "X Score Model")
- **Favicon:** Green X SVG at `/favicon.svg` (cache-busted with `?v=2`)
- **Founder credit:** "Chris Dell: Founder" in footer (NOT header)
- **Share text:** "BirdieX X Score Model: 130-70, +46.60 units, +17.8% ROI at The Masters 2026. Putting regression works. birdiex.co"

---

## Data Source Files

**Primary (in-repo, backed up to GitHub — always use these):**
- `docs/X_SCORE_FORMULA.md` — full model reference
- `docs/MASTERS_2026_RESULTS.md` — full Masters results report
- `src/data/mastersR1Data.ts` — typed Masters data (R4 round-only + cumulative)
- `src/data/matchupOdds.ts` — per-round H2H odds
- `src/data/threeBallData.ts` — R2 3-balls
- `src/data/resultsData.ts` — 221 verified bets, fully graded

**Archive (in `~/Downloads/golfx-source/`, NOT backed up — reference only):**
Raw DataGolf JSON pulls from the Masters 2026 run: `masters_final_tracking.json`, `xscores_r{1,2,3,4}_*.json`, `r{2,3,4}_matchup_odds.json`, `decompositions_*.json`. Keep as backup. If anything from this folder becomes important to a future session, copy it into `docs/` so it's preserved.

---

## Chris's Key Preferences (learned through iterations)
1. **NO yes-manning.** Push back with data when wrong.
2. **No guessing/assumptions.** Verify with actual data before claims.
3. **Triple-check deduplication** on matchup counts.
4. **Terminology matters:** Fade→Sell (on cards), Hold→Neutral, "putting regression model" not "X score model"
5. **Results tracking must use best odds** across all books (line shopping)
6. **Per-book filtering** required for Results page
7. **Do NOT expose the actual formula** on methodology page
8. **Mobile responsive matters** — footer must be compact
9. **Share bar + founder go in FOOTER** not header
10. **Ghost button design** throughout — no filled buttons except active states

---

## Open Items / Next Work

### Done (2026-05 build)
- [x] Automated DataGolf API pulls per round — `scripts/update-round.ts` one-command pipeline
- [x] Event-config refactor — `src/config/event.ts`, per-round update needs no code edits
- [x] Multi-event Results page with All-Time running total + tournament picker
- [x] Player search dropdowns on Rankings / Matchups / Results
- [x] Tee-times + live-scores ticker near the top
- [x] Golfer headshots with initials fallback
- [x] Post-tournament wrap-up workflow — `docs/NEW_TOURNAMENT_RUNBOOK.md`
- [x] 3-balls decision — removed from the site (H2H only)

### Next Tournament Prep
- [ ] Build pre-tournament R1 betting model (use baseline skill + course fit as proxy)
- [ ] Add alerts/notifications (Discord, email, SMS)
- [ ] Consider Supabase integration for persistent bet history across tournaments
- [ ] Revisit `MAX_PREDICTABILITY = 0.15` — it's an unexplained magic number (see COURSE_COEFFICIENTS_RESEARCH.md §7)

### Future Features (Parked)
- Clickable direct-to-bet links (not possible with current sportsbook URLs)
- Historical backtesting against prior Masters/tournament data (DataGolf tier upgrade required)
- Line movement monitoring
- Bankroll-adjusted bet recommendations

### Known Issues
- Deep linking to specific bets on sportsbook sites isn't possible — only golf section links
- Course-fit coefficients still pulled manually from DataGolf's Course Fit web tool (not in the API)
- No database yet — all data embedded in src/data/ files

---

## Team Roles (when spawning agents)
- **Ben** (backend): API routes, Supabase, Drizzle, server logic
- **Finn** (frontend): React, Tailwind, components
- **Dana** (data analyst): NFL/golf data sourcing, rankings math
- **Max** (model builder): ETL, productionizing research
- **Quinn** (QA): Browser testing, bug repro
- **Cody** (code review): Pre-merge security + structural review
- **Uma** (UX): Flows, IA, wireframes
- **Ivy** (UI): Visual polish, typography, spacing
- **Devon** (DevOps): Vercel, DNS, CI/CD
- **Parker** (PM): Roadmap, MEMORY.md hygiene
- **Remy** (research): Competitive analysis
- **Sage** (SEO): Meta tags, schema
- **Mara** (marketing): Launch copy, newsletter
- **Nova** (AI): MCP servers, Claude features

---

## Why This Matters
Chris ran this model manually on Google Sheets for a year using Make.com + Discord. BirdieX automates everything into a proper web app with transparent results tracking. The Masters 2026 was the first real test — the model went 130-70 with +17.8% ROI, proving the putting regression thesis.

Going forward, every tournament adds to the backtest. The cumulative model (R3+R4 combined) significantly outperformed round-only, suggesting the model works best with more data. That's a critical finding for betting strategy.
