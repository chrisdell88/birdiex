# BirdieX — Project Conventions (Claude Code)

Read `MEMORY.md` first for project context, model methodology, results history, and roadmap. This file is for **rules and conventions** future Claude sessions must follow.

---

## 🚫 Permanently banned phrasings (Chris asked, more than once)

These phrasings IMPLY my normal answers aren't direct/honest. Never use them. No exceptions:
- "straight answer" / "to be straight"
- "honest answer" / "honestly" (as a meta-comment about the answer that follows)
- "to be honest" / "tbh"
- "full stop" / "period" (as rhetorical emphasis)
- "let me be clear" / "let me be direct"

Also never apologize verbally (no "I'm sorry", "my apologies"). Show through action.

If you catch yourself about to type one, delete it and just say the thing.

---

## 🔍 Audit Discipline — runs automatically, no human prompting needed

Past failure mode: I'd promise "I'll look for similar gaps proactively" and then forget the moment the next session started. Replaced with infrastructure:

1. **`scripts/verify-auto-roll-regexes.ts`** — runs on every `npm run build` (in CI + locally). Fails build if any patchEventConfig regex stops matching `src/config/event.ts`. This is the test that would have caught the 2026-06-05 memorial-prefix break.
2. **`.github/workflows/code-audit.yml`** — fires every Sunday 10pm ET (Mon 02:00 UTC). Runs tsc, lint, npm audit, smoke test, stale-data check, **Supabase RPC healthcheck**. Opens a GitHub issue if anything fails so it's visible even if I'm not actively looking.
3. **`.github/workflows/supabase-keepalive.yml`** — fires daily 11am UTC (7am ET). Pings the Supabase RPC to keep the free-tier inactivity counter at 0. Project gets auto-paused after 7 days without a request, breaking lab login + alerts + notifications SILENTLY. The 2026-06-06 lab login failure was this exact mode.
4. **`birdiex-weekly-audit` scheduled Claude task** — fires every Sunday 9:10pm ET. Reads MEMORY.md, audits the codebase for code smells / hard-coded values / stale comments / drift, writes findings to `docs/AUDIT_LOG.md` with severity tags (P0–P3), opens a GitHub issue for any P0.

When adding a new patch like the regex check, add it to BOTH `scripts/verify-auto-roll-regexes.ts` (build-time) AND the weekly Claude audit prompt at `~/.claude/scheduled-tasks/birdiex-weekly-audit/SKILL.md`. Do not rely on remembering — encode it.

### Known silent-failure modes — check these first when something breaks
- **Supabase free-tier project paused** (7 days inactivity): lab login fails with "Wrong password", alerts signup fails, notify.ts can't read subscribers. Fix: resume at https://supabase.com/dashboard/project/xcgjmzinpanrbseyogqe. The daily keepalive workflow above prevents this.
- **patchEventConfig regex doesn't match new event prefix**: auto-roll round transition fails silently, site stays on previous round. Smoke test catches this at build time.
- **DataGolf API key rotated**: every workflow that pulls fails. Update in Vercel + GH Actions secret + local .env.

---

## 🔁 Round-Transition Checklist — EVERY surface that must update per round

When a round finishes (auto-roll or manual), EVERY one of these must be
refreshed. Skip any single item and the public site goes stale. Source of
truth: `scripts/auto-roll.ts::doAutoAdvance` — it executes all of these.
If you find a surface missing, add it here AND to that function.

| # | Surface | How |
|---|---------|------|
| 1 | Round data file (cjCup<R{N}>Data.ts)         | `build:event` |
| 2 | Next-round matchups (cjCup<R{N+1}>Matchups)  | `build-matchups.ts` |
| 3 | Outrights (cjCup<R{N+1}>Outrights)           | `build-outrights.ts` |
| 4 | Skill estimates (cjCupSkillEstimates)        | `build-skill-estimates.ts` |
| 5 | Graded results (cjCup<R{N}>Results.ts)       | `grade-round.ts` ← gate to Best Bets at venue floor |
| 6 | Ticker (src/data/ticker.ts)                  | `build-ticker.ts` ← tee times + scores for the new round |
| 7 | event.ts config (picksRound, banner, imports)| `patchEventConfig` |
| 8 | auto-roll state (lastTransitionAt, BB count) | state file write |
| 9 | Notify Discord + email                        | `notify.ts` ← gated on Best Bets only |

**If a surface is hardcoded** (like the old CJCupView showing "Awaiting Round 1"
forever), it must be made data-reactive so the round transition propagates.

**Before declaring a transition done**, verify the deployed site at all
relevant pages: Rankings, Matchups, Odds, Results, ticker visible across.
Just shipping data files is not enough.

---

## 📣 Best Bets — Hard Rules (applies to ALL public reporting)

**The model never bets R1.** Picks are issued for R2, R3, R4 only — they
require a completed prior round of live SG data to drive the X Score
calculation. Pre-tournament has BirdieX RTG (a different rating, no picks
attached). R1 results are NOT graded, NOT added to the public record, and
NOT counted in any all-time totals. This is foundational — do not "discover"
this rule mid-conversation.

**Best Bet = matchup whose X-Score edge ≥ venue `recommendedFloor`, computed
using the CUMULATIVE X Scores users see on the matchups page.** Round-only
X Scores produce different edges and are NOT the basis for Best Bet
detection or grading.

These rules apply to **everything users see**: Discord, email, the Results
page record, the all-time totals on the Methodology page banner, any
wins/losses/units numbers quoted to Chris in chat. No exceptions.

1. **Notifications fire ONLY for Best Bets.** Never for raw matchups posted
   by sportsbooks, raw odds movements, or anything else. The gate lives
   INSIDE `scripts/notify.ts` (`computeBestBetCount`); callers cannot bypass.
2. **Grading uses cumulative X Scores.** `scripts/grade-round.ts` reads
   `cumulativeData` (not `roundOnlyData`) so edges match what the matchups
   page displayed. After grading, the script prints BOTH the raw "all
   graded picks" line AND the "Best Bets only" line — quote ONLY the
   Best Bets line to Chris or users.
3. **The Results page and all-time totals filter by venue floor.** Bets
   below the floor are scored internally for backtesting (`isTrackedBet`
   gate in `src/lib/sizing.ts`); they DO NOT appear in any public-facing
   record.
4. **Discord + email always fire TOGETHER on a Best Bet trigger.** Never
   one without the other. If one channel breaks, log + continue, don't skip
   the other.
5. **`notify.ts --force` bypasses the gate.** Only use it when explicitly
   told by Chris (e.g., backfilling a missed announcement). Default off.
6. **Before quoting any wins/losses/units to Chris, confirm the source
   is the Best Bets filter.** If the source is the raw bet log, filter
   first.
7. **A misfire is permanent — there's no undo.** When changing notification
   or grading logic, verify the gate still holds end-to-end.

---

## 🔒 Secrets — Hard Rules

1. **Never commit API keys, tokens, or credentials.** No exceptions.
2. **All secrets live in `.env`** (gitignored). The repo ships `.env.example` as a template.
3. **All scripts/code read secrets via `process.env.X`** — never inline literals.
4. **Never paste a real key into `MEMORY.md`, `CLAUDE.md`, comments, commit messages, or PR bodies.** These are committed to a public repo.
5. **If you discover a key in committed source**, STOP and tell the user. Do not "fix" silently — rotation is the user's call.
6. **Pre-commit check:** Before any commit, scan the staged diff for anything matching `/[A-Za-z0-9]{20,}/` that looks key-shaped. If unsure, ask.

The DataGolf API key was leaked publicly via `MEMORY.md` from Apr 18 → May 13 2026. DataGolf doesn't expose rotation via UI; future rotation requires emailing support. Don't repeat this mistake.

---

## 🏗 Architecture

- **Static React+Vite app, no API routes / server.** The one exception: the
  Alerts feature, where the browser talks directly to Supabase (subscriber
  list) — see `MEMORY.md` "Alerts" + `docs/ALERTS_SETUP.md`.
- **Event data is hardcoded TS files in `src/data/`.** Each event (Masters, PGA Championship, etc.) gets its own data module.
- **Vercel** auto-deploys on push to `main`. Project linked via `.vercel/project.json`.
- **Multi-event refactor + full Supabase data migration** (moving event/results
  data into the DB) is a planned post-PGA-Championship project, not in scope
  until explicitly requested. Supabase is currently used ONLY for alert subscribers.

---

## 🔄 Data Pipeline (DataGolf)

- All API pulls go through `scripts/datagolf-pull.ts`. Don't curl DataGolf inline.
- Pipeline writes raw JSON to `data/raw/<event-slug>/<round>/` (gitignored) and emits typed TS to `src/data/<event-slug>R<N>Data.ts`.
- Endpoints we hit per round (cumulative + round-only):
  - `/preds/live-tournament-stats` — SG breakdowns per player
  - `/preds/player-decompositions` — Layers 2–4 adjustments
  - `/betting-tools/matchups` — H2H + 3-balls + tournament matchups
  - `/betting-tools/outrights` — win / top-5 / top-10 / top-20
  - `/field-updates` — tee times, WD / cut list
  - `/get-event-list` — historical event metadata
- **Pull 3-balls every round.** DataGolf does not retain historical round odds — once a round closes, that round's odds are gone forever.

---

## 🤖 Automation (GitHub Actions)

- `DATAGOLF_API_KEY` is stored in repo secrets (Settings → Secrets and variables → Actions).
- Cron workflow runs every 30 min during active tournament rounds. Pulls fresh data, commits if changed, triggers Vercel rebuild via push.
- Cron is **disabled by default** between events. Enable manually when an event is live.

---

## 🎨 Frontend Conventions

- React 19 + TypeScript + Vite + Tailwind CSS v4 (no shadcn/ui in this project).
- See `MEMORY.md` "Design System" section for colors, typography, button styles.
- **Mobile-first responsive** — every new component must work at ≤640px width.
- **Numbers use monospace font** (JetBrains Mono / SF Mono).
- **Ghost button design** throughout — only the active state is filled green.

---

## 📊 Model Rules

**`docs/X_SCORE_FORMULA.md` is the canonical, locked formula reference** (verified 145/145 against the Masters). `docs/COURSE_COEFFICIENTS_RESEARCH.md` covers how course-fit coefficients are derived (OTT = max of the two driving axes). Signal thresholds, purity rules, and tier definitions are in `MEMORY.md`. Never change the formula without Chris's explicit approval. Don't expose the formula on the methodology page — it's proprietary.

---

## 🧪 Before Shipping Any Change

1. `npm run build` must succeed.
2. `npm run lint` must pass.
3. Manually verify the page in dev (`npm run dev`) on desktop + mobile widths.
4. If touching the model or data: spot-check 3–5 player rows against the raw DataGolf JSON.

---

## 👤 Working with Chris

- Chris is non-technical. Don't ask him to run commands you can run yourself.
- Make decisions and execute when scope is clear. Surface tradeoffs as recommendations, not menus, when the answer is technical.
- Never yes-man. Push back with data when wrong.
- Auto-commit & push after every meaningful change (per global hooks).
- Update `MEMORY.md` at the end of any session that changes architecture, methodology, or results.
