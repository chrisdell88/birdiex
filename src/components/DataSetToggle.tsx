import { useState } from 'react';
import type { DataSet } from '../types';

interface DataSetToggleProps {
  dataSet: DataSet;
  onChange: (ds: DataSet) => void;
}

/**
 * Prominent on-page Round-Only vs Cumulative toggle with a help "?" that
 * expands a short explanation. Lives at the top of the data pages
 * (Rankings, Matchups, Odds) so users can see + change which dataset
 * drives the view.
 */
export default function DataSetToggle({ dataSet, onChange }: DataSetToggleProps) {
  const [showTip, setShowTip] = useState(false);

  const pillBtn = (active: boolean) =>
    `px-4 py-1.5 text-xs uppercase tracking-wider font-medium rounded-full transition-colors cursor-pointer font-['Inter',system-ui,sans-serif] ${
      active
        ? 'bg-[#22c55e] text-[#0a0a0a]'
        : 'text-[#f5f5f5] hover:text-white'
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
            onClick={() => onChange('cumulative')}
            className={pillBtn(dataSet === 'cumulative')}
            aria-pressed={dataSet === 'cumulative'}
          >
            Cumulative
          </button>
          <button
            type="button"
            onClick={() => onChange('round')}
            className={pillBtn(dataSet === 'round')}
            aria-pressed={dataSet === 'round'}
          >
            Round-Only
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowTip((s) => !s)}
          className="w-5 h-5 shrink-0 rounded-full border border-[#22c55e]/50 text-[#22c55e] text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-[#22c55e]/10 transition-colors"
          aria-label="What's the difference?"
        >
          ?
        </button>
        <span className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] ml-auto">
          {dataSet === 'cumulative'
            ? 'Picks blend every round played so far.'
            : 'Picks use only the latest completed round.'}
        </span>
      </div>
      {showTip && (
        <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] mt-3 pt-3 border-t border-[#262626] leading-relaxed">
          <span className="text-[#22c55e] font-medium">Cumulative</span> blends every round played so far — historically the stronger long-run signal (cumulative model went +63u / +37% ROI at the Masters vs round-only at +21u / +12%).{' '}
          <span className="text-[#22c55e] font-medium">Round-Only</span> uses just the latest completed round — shows who's hot or cold right now. Same model; only the input window changes.
        </p>
      )}
    </div>
  );
}
