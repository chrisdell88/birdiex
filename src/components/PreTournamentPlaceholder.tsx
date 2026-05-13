import { CURRENT_TOURNAMENT } from '../tournament';

interface PreTournamentPlaceholderProps {
  /** What kind of data is pending — shows in the headline */
  label: string;
}

export default function PreTournamentPlaceholder({ label }: PreTournamentPlaceholderProps) {
  return (
    <div className="border border-[#262626] rounded-lg bg-[#0a0a0a] p-8 md:p-12 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 mb-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <h2 className="text-xl md:text-2xl font-semibold text-[#f5f5f5] mb-2 font-['Inter',system-ui,sans-serif]">
        {label} — pending
      </h2>
      <p className="text-sm md:text-base text-[#a1a1aa] max-w-md mx-auto font-['Inter',system-ui,sans-serif]">
        {CURRENT_TOURNAMENT.display_name} {label.toLowerCase()} populate after R1 wraps.
      </p>
      {CURRENT_TOURNAMENT.next_picks_at && (
        <p className="mt-3 text-xs md:text-sm uppercase tracking-wider text-[#22c55e] font-medium font-['JetBrains_Mono','SF_Mono',monospace]">
          Available: {CURRENT_TOURNAMENT.next_picks_at}
        </p>
      )}
      <p className="mt-6 text-xs text-[#737373] font-['Inter',system-ui,sans-serif]">
        Pre-tournament X Score rankings are live in the{' '}
        <span className="text-[#22c55e]">Rankings</span> tab.
      </p>
    </div>
  );
}
