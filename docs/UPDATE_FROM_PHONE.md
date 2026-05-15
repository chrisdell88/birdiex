# Updating BirdieX From Your Phone (or Any Device)

**Goal:** Open Claude on your phone, tell it what to change, see changes go live on birdiex.co. No technical setup required on your end.

---

## The Workflow (How It Actually Works)

1. You open the Claude app on your phone.
2. You tell Claude what you want changed — in plain English.
3. Claude reads your BirdieX code on GitHub.
4. Claude commits the change to GitHub.
5. Vercel sees the commit and automatically rebuilds birdiex.co (takes 1-2 minutes).
6. You refresh birdiex.co in your phone browser. The change is live.

You never touch a terminal. You never edit code manually. You just describe what you want.

---

## What You Need (One-Time Setup)

For the mobile workflow to work, Claude needs permission to read and write to your GitHub. This is called the **GitHub Connector**.

**To verify it's set up:**

1. Open the Claude app on your phone.
2. Start a new chat.
3. Type:
   > "Read the file `MEMORY.md` from `chrisdell88/birdiex` on GitHub and tell me what's in the 'Stack' section."
4. **If Claude replies with the actual content** → you're already set up. Done.
5. **If Claude says it can't access GitHub** → the connector needs to be enabled. Go to claude.ai on a laptop, Settings → Connectors → enable GitHub → authorize chrisdell88. Then retry the test from your phone.

---

## Examples of Real Requests You Can Make

Just describe the change in plain English. Examples:

- *"PGA Championship Round 2 is live. Pull the new DataGolf data and update the rankings table."*
- *"Change the green color on the site to a slightly darker shade — match Augusta's color."*
- *"Add a banner to the homepage that says 'PGA Championship Live'."*
- *"The third row in the rankings table is showing the wrong score. Pull it from `xscores_r2_for_r3betting.json` and fix it."*
- *"Make the mobile footer smaller — the share buttons are too big."*

Claude figures out which files to change, makes the change, commits, and pushes.

---

## Where Claude Looks for Context

Every time you start a new chat, Claude reads these files automatically (in this order):

1. **`MEMORY.md`** — what BirdieX is, the model, results, design system, your preferences.
2. **`CLAUDE.md`** — the rules and conventions for working on this project.
3. **`docs/X_SCORE_FORMULA.md`** — the full model methodology (the source of truth for those weights).
4. **`docs/NEW_TOURNAMENT_RUNBOOK.md`** — step-by-step for adding a new tournament.

If you ever feel like Claude doesn't have enough context, ask it to "re-read MEMORY.md and the docs folder before continuing."

---

## When To Use Your Phone vs Your Mac

| Task | Phone | Mac |
|------|-------|-----|
| Tweak copy, colors, small UI changes | ✅ | ✅ |
| Update tournament data (new round) | ✅ | ✅ |
| Add a new tournament from scratch | ✅ (slower) | ✅ (faster) |
| Big refactor or new feature | ❌ Use Mac | ✅ |
| Just check what's going on / ask questions | ✅ | ✅ |

Phone is fine for 90% of what you need. Use your Mac when you want to see the dev server running locally before pushing.

---

## What To Do If Something Breaks

- **Vercel says "build failed"** → tell Claude "the latest Vercel deploy failed, check the build error and fix it."
- **birdiex.co didn't update** → wait 2 full minutes (Vercel rebuild). If still stuck, hard-refresh the page (or use a private/incognito tab).
- **Claude says it can't find a file** → tell it "look in `docs/` and `src/data/` — those are the main folders."
- **You're not sure what changed** → tell Claude "show me the last 5 commits on the birdiex repo."

---

## Reality Check

- Every change Claude makes is committed to GitHub with a message describing what changed. You can review the history at any time at `github.com/chrisdell88/birdiex/commits/main`.
- If Claude messes something up, the previous version is one click away. Tell Claude "revert the last commit on birdiex" and it will.
- Vercel keeps every deploy. If a bad deploy goes live, you can roll back from the Vercel dashboard in 10 seconds — or just tell Claude to do it.
