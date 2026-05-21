/**
 * TournamentSummaryBanner — unified header used on every per-tournament
 * sub-view of the Results page. Same shape, same look, same data slots
 * for Masters, PGA Champ, future events. Ensures layout consistency.
 */
import RecommendedFloorBadge from './RecommendedFloorBadge';

interface Props {
  status: 'IN PROGRESS' | 'COMPLETE';
  eventName: string;
  course: string;
  threshold: number;
  showFloorBadge?: boolean;
  record: { wins: number; losses: number; pushes: number };
  units: number;
  roi: number;
  bets: number;
  /** Optional caption for record column (e.g. "Total Record" or "R3 Cum"). */
  recordLabel?: string;
}

const mono = "font-['JetBrains_Mono','SF_Mono',monospace]";
const lbl = "text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]";

function formatUnits(u: number): string {
  if (u === 0) return '0.00';
  return (u > 0 ? '+' : '') + u.toFixed(2);
}
function formatROI(r: number): string {
  return (r > 0 ? '+' : '') + r.toFixed(1) + '%';
}

export default function TournamentSummaryBanner({
  status,
  eventName,
  course,
  threshold,
  showFloorBadge = true,
  record,
  units,
  roi,
  bets,
  recordLabel = 'Record',
}: Props) {
  return (
    <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className="bg-[#22c55e]/15 text-[#22c55e] text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-['Inter',system-ui,sans-serif]">
          {status}
        </span>
        <span className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
          {eventName}
        </span>
        <span className="text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          {course}
        </span>
        {showFloorBadge && (
          <RecommendedFloorBadge threshold={threshold} course={course} />
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className={lbl}>{recordLabel}</div>
          <div className={`text-lg font-bold ${mono} text-[#f5f5f5] mt-0.5`}>
            {record.wins}-{record.losses}{record.pushes ? `-${record.pushes}` : ''}
          </div>
        </div>
        <div>
          <div className={lbl}>Units</div>
          <div className={`text-lg font-bold ${mono} ${units > 0 ? 'text-[#22c55e]' : units < 0 ? 'text-red-400' : 'text-[#d4d4d4]'} mt-0.5`}>
            {formatUnits(units)}
          </div>
        </div>
        <div>
          <div className={lbl}>ROI</div>
          <div className={`text-lg font-bold ${mono} ${roi > 0 ? 'text-[#22c55e]' : roi < 0 ? 'text-red-400' : 'text-[#d4d4d4]'} mt-0.5`}>
            {formatROI(roi)}
          </div>
        </div>
        <div>
          <div className={lbl}>Tracked Bets</div>
          <div className={`text-lg font-bold ${mono} text-[#f5f5f5] mt-0.5`}>{bets}</div>
        </div>
      </div>
    </div>
  );
}
