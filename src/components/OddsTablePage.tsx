/**
 * OddsTablePage — outright winner odds ONLY. H2H matchup odds live on the
 * Matchups page (don't duplicate). When the tournament is complete, render
 * a placeholder; otherwise hand the OutrightsTable the current event's
 * outright data + the player rankings for cross-referencing.
 */
import type { PlayerData, DataSet } from '../types';
import { currentEvent } from '../config/event';
import OutrightsTable from './OutrightsTable';

interface OddsTablePageProps {
  data: PlayerData[];
  /** Kept for API parity with the other tabs; outright odds are tournament-
   *  level so the dataSet toggle doesn't affect them. */
  dataSet: DataSet;
  onDataSetChange: (ds: DataSet) => void;
}

export default function OddsTablePage({ data }: OddsTablePageProps) {
  if (currentEvent.isComplete) {
    return (
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-8 text-center">
        <h2 className="text-lg font-bold text-[#f5f5f5] font-['JetBrains_Mono','SF_Mono',monospace] uppercase tracking-wider mb-2">
          {currentEvent.name} — Complete
        </h2>
        <p className="text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mb-4">
          The tournament is over. New outright odds will appear at the next event.
        </p>
        <p className="text-xs text-[#737373] font-['Inter',system-ui,sans-serif]">
          See the <span className="text-[#22c55e]">Results</span> tab for the final graded record.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
          Outright Winner Odds
        </h2>
        <p className="text-sm text-[#d4d4d4] mt-1 font-['Inter',system-ui,sans-serif]">
          Tournament winner odds across 11 sportsbooks. Best odds highlighted.
        </p>
      </div>

      <OutrightsTable outrights={currentEvent.outrights} players={data} />
    </div>
  );
}
