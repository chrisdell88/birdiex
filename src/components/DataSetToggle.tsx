import { useState } from 'react';
import type { DataSet } from '../types';
import { currentEvent } from '../config/event';

interface DataSetToggleProps {
  dataSet: DataSet;
  onChange: (ds: DataSet) => void;
}

/**
 * Round / Cumulative toggle.
 *
 * Pills always show the LATEST completed round number on the left
 * (e.g., "Round 2") and "Cumulative" on the right. Cumulative is
 * DISABLED until at least 2 rounds have been played — pre-R2 there's
 * only one dataset (R1), so the cumulative view would be identical.
 *
 * We never use the wording "Round Only" — pills always carry the actual
 * round number for clarity.
 */
export default function DataSetToggle({ dataSet, onChange }: DataSetToggleProps) {
  const [showTip, setShowTip] = useState(false);

  // The "latest completed round":
  //   - Mid-tournament: picksRound - 1 (e.g., picksRound=4 → R3 just finished,
  //     picks are for R4 → toggle says "Round 3 Data" for the round-only side).
  //   - Post-final (isComplete): picksRound itself (e.g., picksRound=4 +
  //     isComplete → R4 finished, toggle says "Round 4 Data").
  const completedRound = currentEvent.isComplete
    ? currentEvent.picksRound
    : Math.max(1, currentEvent.picksRound - 1);
  // Cumulative only makes sense once 2+ rounds have been played.
  const cumulativeEnabled = completedRound >= 2;

  const pillBtn = (active: boolean, disabled: boolean) =>
    `px-4 py-1.5 text-xs uppercase tracking-wider font-medium rounded-full transition-colors font-['Inter',system-ui,sans-serif] ${
      disabled
        ? 'text-[#525252] cursor-not-allowed opacity-50'
        : active
          ? 'bg-[#22c55e] text-[#0a0a0a] cursor-pointer'
          : 'text-[#f5f5f5] hover:text-white cursor-pointer'
    }`;

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]">
          Dataset:
        </span>
        <div className="flex border border-[#22c55e]/50 rounded-full p-0.5">
          <button
            type="button"
            onClick={cumulativeEnabled ? () => onChange('cumulative') : undefined}
            disabled={!cumulativeEnabled}
            className={pillBtn(dataSet === 'cumulative', !cumulativeEnabled)}
            aria-pressed={dataSet === 'cumulative'}
            aria-disabled={!cumulativeEnabled}
          >
            Cumulative Data
          </button>
          <button
            type="button"
            onClick={() => onChange('round')}
            className={pillBtn(dataSet === 'round', false)}
            aria-pressed={dataSet === 'round'}
          >
            Round {completedRound} Data
          </button>
        </div>
        {!cumulativeEnabled && (
          <span className="text-[10px] text-[#737373] font-['Inter',system-ui,sans-serif]">
            Cumulative unlocks after Round 2 completes
          </span>
        )}
        <button
          type="button"
          onClick={() => setShowTip((s) => !s)}
          className="w-5 h-5 shrink-0 rounded-full border border-[#22c55e]/50 text-[#22c55e] text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-[#22c55e]/10 transition-colors"
          aria-label="What's the difference?"
        >
          ?
        </button>
      </div>
      {showTip && (
        <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] mt-3 pt-3 border-t border-[#262626] leading-relaxed">
          <span className="text-[#22c55e] font-medium">Round {completedRound} Data</span> uses only the
          latest completed round&rsquo;s strokes-gained data to drive picks.{' '}
          <span className="text-[#22c55e] font-medium">Cumulative Data</span> blends every round
          played so far &mdash; historically the stronger long-run signal. Same model; only the
          input window changes.
        </p>
      )}
    </div>
  );
}
