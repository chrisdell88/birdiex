import { useState } from 'react';
import { subscribeEmail, supabaseConfigured } from '../lib/supabase';

/**
 * Alert signup page. Captures an email into the Supabase subscriber list and
 * points bettors at the Discord. NOTE: all user-facing copy here is DRAFT —
 * pending Chris's review before this page goes live.
 */

const discordInvite = import.meta.env.VITE_DISCORD_INVITE_URL as string | undefined;

type Status = 'idle' | 'submitting' | 'ok' | 'invalid' | 'error';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    const result = await subscribeEmail(email.trim());
    setStatus(result);
    if (result === 'ok') setEmail('');
  }

  const mono = "font-['JetBrains_Mono','SF_Mono','Fira_Code',monospace]";
  const sans = "font-['Inter',system-ui,sans-serif]";

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h1 className={`text-2xl md:text-3xl font-extrabold text-[#f5f5f5] ${sans}`}>
          Get the picks the moment they drop
        </h1>
        <p className={`mt-3 text-sm text-[#a1a1aa] ${sans}`}>
          Every round, BirdieX posts fresh X Score matchup picks. Subscribe and
          we'll send them straight to your inbox — no spam, just the picks.
        </p>
      </div>

      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6">
        <div className={`text-[11px] uppercase tracking-[0.16em] text-[#a1a1aa] mb-3 ${mono}`}>
          Email alerts
        </div>

        {supabaseConfigured ? (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className={`flex-1 bg-[#0a0a0a] border border-[#262626] rounded-md px-4 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#525252] focus:outline-none focus:border-[#22c55e]/60 ${sans}`}
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className={`border border-[#22c55e] rounded-md px-5 py-2.5 text-sm font-medium uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 ${mono} ${
                status === 'ok'
                  ? 'bg-[#22c55e] text-[#0a0a0a]'
                  : 'bg-transparent text-[#22c55e] hover:bg-[#22c55e] hover:text-[#0a0a0a]'
              }`}
            >
              {status === 'submitting' ? 'Subscribing…' : status === 'ok' ? 'Subscribed' : 'Subscribe'}
            </button>
          </form>
        ) : (
          <p className={`text-sm text-[#a1a1aa] ${sans}`}>
            Email alerts are coming soon.
          </p>
        )}

        <div className={`mt-3 text-xs min-h-[1rem] ${sans}`} aria-live="polite">
          {status === 'ok' && (
            <span className="text-[#22c55e]">You're on the list. Picks will hit your inbox each round.</span>
          )}
          {status === 'invalid' && (
            <span className="text-[#ef4444]">That email doesn't look right — double-check it.</span>
          )}
          {status === 'error' && (
            <span className="text-[#ef4444]">Something went wrong. Try again in a moment.</span>
          )}
        </div>
      </div>

      {discordInvite && (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6 mt-4 flex items-center justify-between gap-4">
          <div>
            <div className={`text-[11px] uppercase tracking-[0.16em] text-[#a1a1aa] mb-1 ${mono}`}>
              Discord
            </div>
            <p className={`text-sm text-[#a1a1aa] ${sans}`}>
              Prefer Discord? Picks post live in our server the moment they're out.
            </p>
          </div>
          <a
            href={discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className={`shrink-0 border border-[#22c55e] rounded-md px-5 py-2.5 text-sm font-medium uppercase tracking-wider text-[#22c55e] bg-transparent hover:bg-[#22c55e] hover:text-[#0a0a0a] transition-colors ${mono}`}
          >
            Join Discord
          </a>
        </div>
      )}

      <p className={`mt-4 text-center text-xs text-[#525252] ${sans}`}>
        BirdieX is a betting analytics tool, not betting advice. Bet responsibly.
      </p>
    </div>
  );
}
