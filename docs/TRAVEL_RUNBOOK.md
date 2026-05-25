# BirdieX Travel Runbook

**For Chris when he's on the road and something might break.** Plain-English recovery steps. Phone-friendly except where laptop is explicitly required.

Pairs with [UPDATE_FROM_PHONE.md](./UPDATE_FROM_PHONE.md) (which covers normal day-to-day mobile workflow). This doc is for the unhappy paths.

---

## The "Is everything OK?" 30-second check

From any device:

1. Open https://birdiex.co — does the live site load?
2. Look at the header banner — does it show the right event ("CHARLES SCHWAB CHALLENGE · COLONIAL COUNTRY CLUB" right now)?
3. Look at the "Updated" timestamp on the header — was the last data pull within the last 2 hours during tournament play?
4. Open Discord — does the most recent BirdieX channel post line up with what the site shows?

If all 4 answer yes: nothing to do.

---

## Day-to-day workflow (from phone or any laptop)

This works everywhere — phone, web Claude, both MacBook Airs.

| Task | How |
| --- | --- |
| Edit copy or fix typo | Tell Claude in plain English. It commits via GitHub connector. Vercel auto-deploys. |
| Quick visual tweak | Same. |
| Read what's happening | "Show me the last 5 commits on birdiex." |
| See if a workflow ran | https://github.com/chrisdell88/birdiex/actions — list of recent runs with status. |

---

## What only a laptop can do

The MacBook Airs are bootstrapped from your `claude-config` repo and have:
- The `.env` file with DataGolf API key + Supabase service role key
- Local Node + npm for running scripts
- The Claude Code computer-use tools (so I can drive your browser)

**Things that REQUIRE laptop:**

1. **Running a script manually.** E.g., `npm run pull:event`, `grade-round.ts`, building a new data file by hand.
2. **Computer-use sessions where I drive the browser** (e.g., the Supabase SQL editor walkthrough).
3. **Running `npm run dev` to preview changes locally before pushing.**

**Things that DON'T require laptop:** any code edit. Phone + GitHub connector handles all of this.

---

## If auto-roll fails during a tournament

**How you'd know:**
- You'd see a failure email from GitHub Actions to your inbox, OR
- Look at https://github.com/chrisdell88/birdiex/actions/workflows/datagolf-pull.yml — failed runs show a red ✗.

**What it means:**
- Per the ordering fix shipped earlier this month, **Discord / email notifications will NOT fire** if the data push fails. The site stays stale but you won't broadcast wrong info.
- However the site won't update either. That's the real problem.

**Recovery from phone (90 seconds):**

1. Open GitHub mobile app or https://github.com/chrisdell88/birdiex/actions/workflows/datagolf-pull.yml in your browser.
2. Click the latest failed run.
3. Look at which step failed (read the log).
4. If it says "Push failed — rebasing on origin/main and retrying" and then failed again → race condition with another commit. Click **"Re-run all jobs"** in the top right. Usually fixes it.
5. If it says something else (auth error, syntax error in a script, DataGolf 5xx) → tell Claude on phone: "Auto-roll workflow run [paste the run URL] failed. Read the log and tell me what to do." Claude will diagnose and either fix it via GitHub commit (if it's a code issue) or tell you it needs a laptop (if it's an env / secret issue).

**Recovery from laptop (60 seconds):**

```bash
cd ~/Projects/birdiex
git pull
gh run rerun --failed --workflow=datagolf-pull.yml
gh run watch
```

---

## If Discord pings but site is wrong

This **shouldn't** happen anymore (per the May 25 ordering fix — data-push-before-notify guarantee). If it does, it means:
- Something has regressed the gate, OR
- The notify script fired with stale state.

**From phone:**
1. Take a screenshot of what Discord said vs what the site shows.
2. Tell Claude: "Discord posted [X] but site shows [Y]. Auto-roll ordering may be broken — investigate."

**From laptop:** look at `data/.pending-notify.json` after a workflow run. It should be deleted after notify fires. If it persists, the push failed and notify won't fire on next run until the marker either succeeds or is manually cleared.

---

## If the DataGolf API key needs rotation

You'll know because workflows start failing with "401 Unauthorized" from `feeds.datagolf.com`.

**Steps (this is a 3-place update, can't be skipped):**

1. **Get the new key**: log into datagolf.com → account settings → API keys → rotate. Email support if no UI option.
2. **Update GitHub Actions secret**: github.com/chrisdell88/birdiex → Settings → Secrets and variables → Actions → `DATAGOLF_API_KEY` → Update. (Phone works fine for this.)
3. **Update Vercel env var**: vercel.com → birdiex project → Settings → Environment Variables → `DATAGOLF_API_KEY` → Edit → Save → Redeploy.
4. **Update local `.env` on both laptops**: edit `~/Projects/birdiex/.env` line `DATAGOLF_API_KEY=...`. Required only when running scripts locally. Not urgent.

Step 4 is the only laptop-required step. Steps 1-3 keep production working.

---

## If Vercel deploy fails

**How you'd know:** you push a change but birdiex.co doesn't update after 2-3 minutes.

**From phone:**
1. Open vercel.com (or the Vercel mobile app) → birdiex project → Deployments.
2. The latest deploy shows status. If failed, click in to see the build log.
3. Tell Claude on phone: "Vercel deploy failed with [paste error]. Fix it."

**Easy fix:** revert the bad commit.
- Tell Claude on phone: "Revert the last commit on birdiex."
- Or via GitHub web: open the bad commit → Revert button.
- Either way, Vercel re-deploys the previous good version in ~90 seconds.

---

## If a round transition gets stuck

The auto-roll script handles round transitions automatically. If it gets stuck (rare — happened once with the R3→R4 transition because of an old env-var crash, since fixed):

**Symptom:** site still shows the previous round's data hours after the next round's tee times have started.

**From phone:** tell Claude "auto-roll seems stuck on round transition. Look at the most recent run and the auto-roll-state.json file. Diagnose."

**Manual fix (from laptop only):**
```bash
cd ~/Projects/birdiex
npm run pull:event -- --slug charles-schwab-challenge-2026 --phase r1
npm run build:event -- --slug charles-schwab-challenge-2026 --phase r1 --course colonial-country-club --out cscR1Data
# ... etc per docs/NEW_TOURNAMENT_RUNBOOK.md
```

---

## If notifications are firing for non-Best Bets

This shouldn't happen (the gate is hardcoded in `scripts/notify.ts`). If it does:
1. Don't panic — the data IS still being shown to users correctly on the site.
2. Tell Claude: "Notify just fired for what looks like a non-Best Bet. Re-read CLAUDE.md best-bet rules and check the gate in notify.ts."

---

## If the Lab page password stops working

The password lives in Supabase (`public.lab_secrets` table, bcrypted via the `verify_lab_password` Postgres function). If `bScoopity1!x` stops working:

1. Open the Supabase dashboard SQL editor.
2. Paste:
   ```sql
   insert into public.lab_secrets (id, password_hash)
   values (1, crypt('YOUR_NEW_PASSWORD', gen_salt('bf')))
   on conflict (id) do update set password_hash = excluded.password_hash;
   ```
3. Replace `YOUR_NEW_PASSWORD`. Click Run.

That's 4 clicks from any device with a browser.

---

## Laptop bootstrap (if a fresh device needs setting up)

You probably won't need this on the road but just in case — your `claude-config` public bootstrap repo handles a brand-new laptop:

```bash
curl -fsSL https://raw.githubusercontent.com/chrisdell88/claude-config/main/bootstrap.sh | bash
```

That clones all your projects + agents to `~/Projects/` and `~/.claude/`. You still need to manually drop a `.env` into `~/Projects/birdiex/` because secrets aren't in the public bootstrap (and shouldn't be).

To copy `.env` to a new laptop: easiest is iMessage / AirDrop from your main laptop. Open the file in TextEdit, share via AirDrop.

---

## Escalation: when in doubt

**Best general-purpose prompt to give Claude on phone:**

> "I'm on the road and noticed [problem]. Look at the BirdieX repo state, the last few commits, and the latest GitHub Actions runs. Diagnose what's wrong, propose a fix, and only ask me to do something if it can't be done remotely."

Phone Claude can read EVERYTHING. It just can't run local scripts. If a fix requires that, it'll tell you.
