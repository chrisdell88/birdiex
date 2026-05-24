import { useEffect, useRef, useState } from 'react';
import type { PlayerData } from '../types';

/**
 * Visual indicator that sits next to a player's Signal badge.
 *
 *   ⚠️  Yellow warning  — purity is CONFLICTED (ball-striking contradicts signal)
 *   ✓   Green check     — PURE BUY (ball-striking confirms a buy)
 *   ✓   Red check       — PURE FADE (ball-striking confirms a fade)
 *   (nothing)          — NEUTRAL / HOLD
 *
 * Click/tap reveals a small inline popover with the reason. Works on
 * mobile (where native `title` tooltips don't show on tap) and desktop
 * (where the popover is faster than native title's ~1s hover delay).
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

  if (player.purity === 'HOLD' || player.purity === 'NEUTRAL') return null;

  const isConflicted = player.purity === 'CONFLICTED';
  const reason = isConflicted ? getConflictReason(player) : '';
  const message = isConflicted
    ? (reason
      ? `Conflicted signal — ball-striking contradicts (${reason}). Proceed with caution.`
      : 'Conflicted signal — ball-striking contradicts the model direction. Proceed with caution.')
    : player.purity === 'PURE BUY'
      ? 'Pure buy — ball-striking (OTT + APP) confirms the buy signal.'
      : 'Pure fade — ball-striking (OTT + APP) confirms the fade signal.';

  const color = isConflicted
    ? 'text-yellow-400'
    : player.purity === 'PURE BUY'
      ? 'text-green-400'
      : 'text-red-400';

  return (
    <span ref={ref} className="relative inline-flex items-center align-middle">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="inline-flex items-center cursor-pointer align-middle p-0.5 -m-0.5 rounded hover:bg-white/5"
        aria-label={message}
        aria-expanded={open}
      >
        {isConflicted ? (
          <svg width="14" height="14" viewBox="0 0 16 16" className={color}>
            <path fill="currentColor" d="M8 1.5l7 13H1l7-13zm0 2.5L3.2 13h9.6L8 4zm-.5 4h1v3h-1V8zm0 4h1v1h-1v-1z" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 16 16" className={color}>
            <path fill="currentColor" d="M6.5 12.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
          </svg>
        )}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 left-0 top-full mt-1 w-64 max-w-[calc(100vw-2rem)] bg-[#111111] border border-[#262626] rounded-md p-3 shadow-xl text-[11px] text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-snug whitespace-normal normal-case tracking-normal"
          onClick={(e) => e.stopPropagation()}
        >
          {message}
        </span>
      )}
    </span>
  );
}
