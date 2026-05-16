/**
 * Send "new picks are live" alerts: email every active subscriber + post to
 * the BirdieX Discord channel.
 *
 * This is a DELIBERATE, manual step — it sends real email to real people. It
 * is NOT wired into the per-round pipeline. Run it yourself once a round's
 * picks are published and the site is deployed:
 *
 *   npm run notify              # send for the round in src/config/event.ts
 *   npm run notify -- --round 4 # override the round number
 *   npm run notify -- --dry-run # show who would be emailed, send nothing
 *
 * Env (in .env locally, and in CI secrets if ever automated):
 *   SUPABASE_URL                — project URL
 *   SUPABASE_SERVICE_ROLE_KEY   — service role key (server-only, bypasses RLS)
 *   RESEND_API_KEY              — Resend API key
 *   RESEND_FROM                 — verified sender, e.g. "BirdieX <alerts@birdiex.co>"
 *   DISCORD_WEBHOOK_URL         — Discord channel webhook URL
 *   SITE_URL                    — optional, defaults to https://birdiex.co
 *
 * NOTE: the email + Discord copy below is DRAFT, pending Chris's review.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;
const SITE_URL = (process.env.SITE_URL ?? 'https://birdiex.co').replace(/\/$/, '');

interface Subscriber {
  email: string;
  unsubscribe_token: string;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✖ Missing required env var: ${name}. See .env.example / docs/ALERTS_SETUP.md.`);
    process.exit(1);
  }
  return v;
}

function emailHtml(eventName: string, round: number, token: string): string {
  const unsubUrl = `${SITE_URL}/?unsubscribe=${encodeURIComponent(token)}`;
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#0a0a0a;color:#f5f5f5;padding:32px;">
      <p style="font-size:22px;font-weight:800;margin:0 0 16px;">
        BIRDIE<span style="color:#22c55e;">X</span>
      </p>
      <p style="font-size:16px;margin:0 0 8px;">
        Round ${round} picks are live for the ${eventName}.
      </p>
      <p style="font-size:14px;color:#a1a1aa;margin:0 0 20px;">
        Fresh X Score matchup picks just posted. Line up your bets before tee-off.
      </p>
      <a href="${SITE_URL}" style="display:inline-block;background:#22c55e;color:#0a0a0a;
        font-weight:700;text-decoration:none;padding:12px 24px;border-radius:6px;">
        View the picks
      </a>
      <p style="font-size:11px;color:#525252;margin:28px 0 0;">
        BirdieX is a betting analytics tool, not betting advice. Bet responsibly.<br/>
        <a href="${unsubUrl}" style="color:#525252;">Unsubscribe</a>
      </p>
    </div>`;
}

async function sendEmails(subs: Subscriber[], eventName: string, round: number, dryRun: boolean) {
  const apiKey = requireEnv('RESEND_API_KEY');
  const from = requireEnv('RESEND_FROM');
  const subject = `BirdieX — Round ${round} picks are live`;

  if (dryRun) {
    console.log(`  [dry-run] would email ${subs.length} subscriber(s) — subject: "${subject}"`);
    return;
  }

  // Resend's batch endpoint accepts up to 100 messages per request.
  let sent = 0;
  for (let i = 0; i < subs.length; i += 100) {
    const chunk = subs.slice(i, i + 100);
    const payload = chunk.map((s) => ({
      from,
      to: s.email,
      subject,
      html: emailHtml(eventName, round, s.unsubscribe_token),
      headers: {
        'List-Unsubscribe': `<${SITE_URL}/?unsubscribe=${encodeURIComponent(s.unsubscribe_token)}>`,
      },
    }));
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`✖ Resend batch failed (${res.status}): ${await res.text()}`);
      process.exit(1);
    }
    sent += chunk.length;
  }
  console.log(`  ✓ emailed ${sent} subscriber(s)`);
}

async function postDiscord(eventName: string, round: number, dryRun: boolean) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.log('  • Discord skipped (DISCORD_WEBHOOK_URL not set)');
    return;
  }
  if (dryRun) {
    console.log('  [dry-run] would post to Discord');
    return;
  }
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🏌️ **Round ${round} picks are live** for the ${eventName}.\nView them: ${SITE_URL}`,
    }),
  });
  if (!res.ok) {
    console.error(`✖ Discord post failed (${res.status}): ${await res.text()}`);
    process.exit(1);
  }
  console.log('  ✓ posted to Discord');
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const roundFlag = argv.indexOf('--round');

  // Pull event name + round from the single event config.
  const { currentEvent } = await import(
    new URL('src/config/event.ts', `file://${PROJECT_ROOT}`).href
  );
  const round = roundFlag !== -1 ? Number(argv[roundFlag + 1]) : currentEvent.picksRound;
  if (!Number.isFinite(round)) {
    console.error('✖ Invalid --round value.');
    process.exit(1);
  }

  console.log(`\n▶ BirdieX alerts — ${currentEvent.name}, Round ${round}${dryRun ? '  (DRY RUN)' : ''}\n`);

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );
  const { data, error } = await supabase
    .from('subscribers')
    .select('email, unsubscribe_token')
    .is('unsubscribed_at', null);
  if (error) {
    console.error(`✖ Could not read subscribers: ${error.message}`);
    process.exit(1);
  }
  const subs = (data ?? []) as Subscriber[];
  console.log(`  ${subs.length} active subscriber(s)`);

  await sendEmails(subs, currentEvent.name, round, dryRun);
  await postDiscord(currentEvent.name, round, dryRun);

  console.log(`\n✅ Alerts ${dryRun ? 'dry-run' : 'sent'}.\n`);
}

main();
