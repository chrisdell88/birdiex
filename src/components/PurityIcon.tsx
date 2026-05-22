import type { PlayerData } from '../types';

/**
 * Visual indicator that sits next to a player's Signal badge.
 *
 *   ⚠️  Yellow warning  — purity is CONFLICTED (ball-striking contradicts signal)
 *   ✓   Green check     — PURE BUY (ball-striking confirms a buy)
 *   ✓   Red check       — PURE FADE (ball-striking confirms a fade)
 *   (nothing)          — NEUTRAL / HOLD
 *
 * Hover shows the reason via the browser's native `title` tooltip — the
 * earlier custom JSX tooltip was getting clipped by the rankings table's
 * overflow-x-auto wrapper (CSS forces overflow-y: auto when overflow-x is
 * non-visible). Native title attribute escapes all stacking contexts.
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
  if (player.purity === 'HOLD' || player.purity === 'NEUTRAL') return null;

  if (player.purity === 'CONFLICTED') {
    const reason = getConflictReason(player);
    const tooltip = reason
      ? `Conflicted signal — ball-striking contradicts (${reason}). Proceed with caution.`
      : 'Conflicted signal — ball-striking contradicts the model direction. Proceed with caution.';
    return (
      <span
        className="inline-flex items-center cursor-help align-middle"
        title={tooltip}
        aria-label={tooltip}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" className="text-yellow-400">
          <path
            fill="currentColor"
            d="M8 1.5l7 13H1l7-13zm0 2.5L3.2 13h9.6L8 4zm-.5 4h1v3h-1V8zm0 4h1v1h-1v-1z"
          />
        </svg>
      </span>
    );
  }

  // PURE BUY or PURE FADE
  const color = player.purity === 'PURE BUY' ? 'text-green-400' : 'text-red-400';
  const tooltip =
    player.purity === 'PURE BUY'
      ? 'Pure buy — ball-striking (OTT + APP) confirms the buy signal.'
      : 'Pure fade — ball-striking (OTT + APP) confirms the fade signal.';
  return (
    <span
      className="inline-flex items-center cursor-help align-middle"
      title={tooltip}
      aria-label={tooltip}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" className={color}>
        <path
          fill="currentColor"
          d="M6.5 12.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z"
        />
      </svg>
    </span>
  );
}
