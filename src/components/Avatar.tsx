import { useState } from 'react';
import { headshots } from '../data/headshots';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  playerName: string;
  size?: AvatarSize;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-[9px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-16 h-16 text-lg',
};

function getInitials(playerName: string): string {
  // Format: "LastName, FirstName" → "FL" (First Last initials)
  const parts = playerName.split(',').map((s) => s.trim());
  if (parts.length >= 2) {
    const first = parts[1].trim();
    const last = parts[0].trim();
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  }
  // Fallback for non-standard format
  const words = playerName.trim().split(/\s+/);
  return words
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export default function Avatar({ playerName, size = 'sm' }: AvatarProps) {
  const url = headshots[playerName];
  const [imgError, setImgError] = useState(false);

  const baseClasses = `${sizeClasses[size]} rounded-full shrink-0 inline-flex items-center justify-center overflow-hidden`;

  if (url && !imgError) {
    return (
      <span
        className={`${baseClasses} border border-[#262626] bg-[#1a1a1a]`}
        aria-hidden="true"
      >
        <img
          src={url}
          alt={playerName}
          className="w-full h-full object-cover object-top rounded-full"
          onError={() => setImgError(true)}
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  // Initials fallback
  const initials = getInitials(playerName);
  return (
    <span
      className={`${baseClasses} bg-[#0f0f0f] border border-[#262626] text-[#22c55e] font-bold font-['Inter',system-ui,sans-serif] select-none`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
