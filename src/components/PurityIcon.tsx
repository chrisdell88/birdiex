import { useState } from 'react';
import type { PlayerData } from '../types';

interface PurityIconProps {
  player: PlayerData;
}

function getConflictReason(player: PlayerData): string {
  const reasons: string[] = [];
  if (player.x_score >= 0.50) {
    if (player.sg_ott <= -0.45) reasons.push(`OTT: ${player.sg_ott.toFixed(2)}`);
    if (player.sg_app <= -0.45) reasons.push(`APP: ${player.sg_app.toFixed(2)}`);
  } else if (player.x_score <= -0.50) {
    if (player.sg_ott >= 0.45) reasons.push(`OTT: +${player.sg_ott.toFixed(2)}`);
    if (player.sg_app >= 0.45) reasons.push(`APP: +${player.sg_app.toFixed(2)}`);
  }
  return reasons.join(', ');
}

export default function PurityIcon({ player }: PurityIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (player.purity === 'HOLD' || player.purity === 'NEUTRAL') return null;

  if (player.purity === 'CONFLICTED') {
    const reason = getConflictReason(player);
    return (
      <span
        className="relative cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" className="text-yellow-400">
          <path
            fill="currentColor"
            d="M8 1.5l7 13H1l7-13zm0 2.5L3.2 13h9.6L8 4zm-.5 4h1v3h-1V8zm0 4h1v1h-1v-1z"
          />
        </svg>
        {showTooltip && (
          <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded text-[10px] text-yellow-300 whitespace-nowrap font-['JetBrains_Mono','SF_Mono',monospace]">
            {reason}
          </span>
        )}
      </span>
    );
  }

  // PURE BUY or PURE FADE
  const color = player.purity === 'PURE BUY' ? 'text-green-400' : 'text-red-400';
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" className={color}>
      <path
        fill="currentColor"
        d="M6.5 12.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z"
      />
    </svg>
  );
}
