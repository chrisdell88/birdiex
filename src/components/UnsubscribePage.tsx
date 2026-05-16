import { useEffect, useState } from 'react';
import { unsubscribeToken } from '../lib/supabase';

/**
 * Rendered when the URL has `?unsubscribe=<token>` — the link in every alert
 * email's footer. Calls the unsubscribe RPC once on mount. Copy is DRAFT,
 * pending Chris's review.
 */
export default function UnsubscribePage({ token }: { token: string }) {
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working');

  useEffect(() => {
    unsubscribeToken(token).then((r) => setStatus(r === 'ok' ? 'ok' : 'error'));
  }, [token]);

  const sans = "font-['Inter',system-ui,sans-serif]";

  return (
    <div className="max-w-md mx-auto text-center py-16">
      {status === 'working' && (
        <p className={`text-sm text-[#a1a1aa] ${sans}`}>Updating your preferences…</p>
      )}
      {status === 'ok' && (
        <>
          <h1 className={`text-xl font-extrabold text-[#f5f5f5] ${sans}`}>You're unsubscribed</h1>
          <p className={`mt-3 text-sm text-[#a1a1aa] ${sans}`}>
            You won't get any more BirdieX alert emails. Changed your mind? You
            can re-subscribe any time on the Alerts page.
          </p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className={`text-xl font-extrabold text-[#f5f5f5] ${sans}`}>Link didn't work</h1>
          <p className={`mt-3 text-sm text-[#a1a1aa] ${sans}`}>
            We couldn't process that unsubscribe link. Try again, or reply to any
            alert email and we'll remove you.
          </p>
        </>
      )}
      <a
        href="/"
        className={`inline-block mt-6 text-xs uppercase tracking-wider text-[#22c55e] hover:underline ${sans}`}
      >
        Back to BirdieX
      </a>
    </div>
  );
}
