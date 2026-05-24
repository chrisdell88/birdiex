import { useEffect, useRef, useState } from 'react';
import type { PlayerData } from '../types';

/**
 * Conflicted-signal warning. Renders the yellow ⚠️ ONLY when the
 * player's purity is CONFLICTED (ball-striking contradicts the signal).
 * All other states render nothing — the signal badge's own color already
 * conveys direction, so PURE BUY / PURE FADE 'confirms' icons were just
 * redundant noise.
 *
 * Click/tap reveals a small inline popover with the conflict reason.
 * Native `title` tooltips don't show on mobile tap and have a ~1s delay
 * on desktop, so we ship a real popover instead.
 */
interface PurityIconProps {
  player: PlayerData;
}

function getConflictReason(player: PlayerData): string {
  const reasons: string[] = [];
  if (player.x_score >= 0.50) {
    if (player.sg_ott <= -0.45) reasons.push(`OTT ${player.sg_ott.toFixed(2)}`);
    if (player.sg_app <= -0.45) reasons.push(`APP ${player.sg_app.toFixed(2)}`);
  } else if (player.x_score <= -0.50) {
    if (player.sg_ott >= 0.45) reasons.push(`OTT +${player.sg_ott.toFixed(2)}`);
    if (player.sg_app >= 0.45) reasons.push(`APP +${player.sg_app.toFixed(2)}`);
  }
  return reasons.join(', ');
}

export default function PurityIcon({ player }: PurityIconProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Only CONFLICTED renders something. PURE BUY / PURE FADE / NEUTRAL /
  // HOLD all return null — the signal badge color already says it all.
  if (player.purity !== 'CONFLICTED') return null;

  const reason = getConflictReason(player);
  const message = reason
    ? `Conflicted signal — ball-striking contradicts (${reason}). Proceed with caution.`
    : 'Conflicted signal — ball-striking contradicts the model direction. Proceed with caution.';

  return (
    <span ref={ref} className="relative inline-flex items-center align-middle">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="inline-flex items-center cursor-pointer align-middle p-0.5 -m-0.5 rounded hover:bg-white/5"
        aria-label={message}
        aria-expanded={open}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" className="text-yellow-400">
          <path fill="currentColor" d="M8 1.5l7 13H1l7-13zm0 2.5L3.2 13h9.6L8 4zm-.5 4h1v3h-1V8zm0 4h1v1h-1v-1z" />
        </svg>
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 left-0 top-full mt-1 w-64 max-w-[calc(100vw-2rem)] bg-[#0a0a0a] border border-[#22c55e]/40 rounded-md p-3 shadow-xl text-[11px] text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-snug whitespace-normal normal-case tracking-normal"
          onClick={(e) => e.stopPropagation()}
        >
          {message}
        </span>
      )}
    </span>
  );
}
