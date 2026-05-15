# BirdieX — Project Conventions (Claude Code)

Read `MEMORY.md` first for project context, model methodology, results history, and roadmap. This file is for **rules and conventions** future Claude sessions must follow.

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

- **Pure static React+Vite app today.** No backend, no DB, no API routes.
- **Event data is hardcoded TS files in `src/data/`.** Each event (Masters, PGA Championship, etc.) gets its own data module.
- **Vercel** auto-deploys on push to `main`. Project linked via `.vercel/project.json`.
- **Multi-event refactor + Supabase migration** is a planned post-PGA-Championship project, not in scope until explicitly requested.

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
