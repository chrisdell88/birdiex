/**
 * RecommendedFloorBadge — small, consistent visual indicator of the
 * venue-specific bet-floor in use for an event.
 *
 * Used on:
 *   • Results page tournament cards + per-event headers
 *   • Matchups page header
 *   • Odds page header
 *   • Home/Rankings page disclaimer
 *
 * Variants:
 *   • compact: one-line chip ("★★+ floor · Aronimink")
 *   • full: two-line card with caption explaining venue predictability
 */
interface Props {
  /** Tier label, e.g. "★+", "★★+", "★★★+". */
  floorLabel: string;
  /** Venue name. */
  course?: string;
  /** Optional predictability number — only shown in full variant. */
  predictability?: number;
  /** Layout variant. */
  variant?: 'compact' | 'full';
  /** Extra classes for positioning. */
  className?: string;
}

export default function RecommendedFloorBadge({
  floorLabel,
  course,
  predictability,
  variant = 'compact',
  className = '',
}: Props) {
  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5 ${className}`}
        title={course ? `Venue-specific bet floor at ${course}` : 'Venue-specific bet floor'}
      >
        <span className="font-semibold">{floorLabel}</span>
        <span className="opacity-60">floor</span>
        {course && (
          <>
            <span className="opacity-40">·</span>
            <span className="normal-case tracking-normal text-[#d4d4d4]">{course}</span>
          </>
        )}
      </span>
    );
  }

  // full variant — a small card with the floor + a one-line explanation
  return (
    <div className={`bg-[#0a0a0a] border border-[#22c55e]/30 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif]">
          Recommended bet floor
        </span>
        <span className="text-sm font-bold text-[#22c55e] font-['Inter',system-ui,sans-serif]">
          {floorLabel}
        </span>
        {course && (
          <span className="text-[11px] text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
            · {course}
            {typeof predictability === 'number' && (
              <span className="text-[#999] font-['JetBrains_Mono','SF_Mono',monospace] ml-1">
                (predictability {predictability.toFixed(3)})
              </span>
            )}
          </span>
        )}
      </div>
      <p className="text-[11px] text-[#999] font-['Inter',system-ui,sans-serif] leading-relaxed mt-1.5">
        Tracked/recommended bets at this venue. Lower-tier picks are scored
        internally for backtesting but not surfaced as recommendations.
      </p>
    </div>
  );
}
