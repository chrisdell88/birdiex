# Alerts Setup — Signup Page + Email/Discord Notifications

This is the one-time setup to turn on the **Alerts** feature: the signup page
where bettors enter their email, and the system that emails them (and posts to
Discord) when new picks drop.

The code is already built. It just needs three free accounts connected. None of
this needs any technical knowledge — every step is a website you click through.
Claude can't create accounts for you, but once you've made them, paste the keys
to Claude and it wires everything up.

---

## What you'll set up (all free)

| Service | What it does | Cost |
|---------|--------------|------|
| **Supabase** | Stores the list of email subscribers | Free |
| **Resend** | Actually sends the alert emails | Free — 3,000 emails/month |
| **Discord webhook** | Auto-posts picks into your Discord server | Free |

---

## Step 1 — Supabase (the subscriber list)

1. Go to **https://supabase.com** and sign up (use "Continue with GitHub" — fastest).
2. Click **New project**. Name it `birdiex`. Pick any region close to the US.
   Set a database password (save it somewhere; you won't need it day-to-day).
3. Wait ~2 minutes for it to finish setting up.
4. In the left sidebar click **SQL Editor** → **New query**.
5. Open the file `supabase/schema.sql` in this repo, copy everything in it,
   paste it into the query box, and click **Run**. It should say "Success".
6. In the left sidebar click **Project Settings** (gear icon) → **API**.
   You need two values from this page:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (a long string under "Project API keys")
   - **service_role** key (another long string — marked "secret")

Paste those three to Claude. **The service_role key is secret — only paste it
in chat, never anywhere public.**

---

## Step 2 — Resend (sends the emails)

1. Go to **https://resend.com** and sign up.
2. It will ask you to **add a domain**. Add `birdiex.co`. Resend shows you a few
   DNS records to add — Claude can add those to GoDaddy for you, so just paste
   Claude the records Resend shows.
3. Once the domain shows **Verified**, go to **API Keys** → **Create API Key**.
   Copy the key (starts with `re_`).

Paste the API key to Claude.

---

## Step 3 — Discord webhook (posts picks to your server)

1. In your Discord server, make a channel for picks (e.g. `#birdiex-picks`).
2. Click the gear next to the channel name → **Integrations** → **Webhooks**
   → **New Webhook**. Name it "BirdieX". Click **Copy Webhook URL**.
3. Separately, make a public **invite link** for the server (right-click the
   server → Invite People → "Edit invite link" → set it to never expire → copy).

Paste both the webhook URL and the invite link to Claude.

---

## Step 4 — Claude finishes it

Once you've pasted the values above, Claude will:
- Put them in the local `.env` file (gitignored — never committed)
- Add them to Vercel (Project Settings → Environment Variables) so the live
  site can use them
- Redeploy

After that the **Alerts** tab on birdiex.co is live.

---

## Sending an alert (each round, once picks are up)

It's one command Claude runs for you:

```
npm run notify
```

That emails every subscriber and posts to Discord. Use `npm run notify -- --dry-run`
first to see how many people it would email without actually sending.

This is a deliberate manual step on purpose — it is **not** automatic, so an
alert never goes out by accident while testing.

---

## Notes

- The signup page's headline, button text, and the alert email wording are all
  **draft copy** — review and tweak them before the first real send.
- Email alerts include an unsubscribe link automatically (legally required).
- The `service_role` and `RESEND_API_KEY` values are secret. They live only in
  `.env` and in Vercel. They are never committed to GitHub.
