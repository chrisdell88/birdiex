/**
 * RecommendedFloorBadge — venue-specific matchup-score threshold disclaimer.
 *
 * Shows the PRECISE matchup-score threshold (e.g. 2.45) as the headline.
 * NO stars — stars are a separate concept (they encode the unit size of
 * an individual bet, not a quality tier). Mixing them on the threshold
 * badge was misleading; we keep them strictly separate now.
 *
 * Used on:
 *   • Results page tournament cards + per-event headers
 *   • Matchups page header
 *   • Odds page header
 *   • Home/Rankings page disclaimer
 */
interface Props {
  /** Numeric edge cutoff, e.g. 0.95, 2.45, 2.95. */
  threshold: number;
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
  threshold,
  course,
  predictability,
  variant = 'compact',
  className = '',
}: Props) {
  const thresholdLabel = threshold.toFixed(2);
  const titleText = course
    ? `${course}: only matchups with X-Score edge ≥ ${thresholdLabel} are tracked as recommendations. Stars on each bet show its unit size (a separate concept) — see the Glossary on the Methodology page.`
    : `Only matchups with X-Score edge ≥ ${thresholdLabel} are tracked.`;

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5 ${className}`}
        title={titleText}
      >
        <span className="opacity-70">Best Bet Matchup Score Threshold ≥</span>
        <span className="font-semibold font-['JetBrains_Mono','SF_Mono',monospace]">
          {thresholdLabel}
        </span>
        {course && (
          <>
            <span className="opacity-40">·</span>
            <span className="normal-case tracking-normal text-[#d4d4d4]">{course}</span>
          </>
        )}
      </span>
    );
  }

  // full variant — a small card with the threshold + a one-line explanation
  return (
    <div className={`bg-[#0a0a0a] border border-[#22c55e]/30 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif]">
          Best Bet Matchup Score Threshold
        </span>
        <span className="text-sm font-bold text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace]">
          ≥ {thresholdLabel}
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
        Only matchups at this threshold or above are tracked as recommendations.
        Lower picks are scored internally for backtesting. The stars on each bet
        show its unit size (separate concept) &mdash; see the Glossary on the
        Methodology page.
      </p>
    </div>
  );
}
