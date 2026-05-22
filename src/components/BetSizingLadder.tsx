/**
 * BetSizingLadder — the canonical, unambiguous visual of how a matchup
 * score (edge) maps to a bet's star rating AND unit size.
 *
 * Half-star precision: each 0.5u increment gets a corresponding half-star,
 * so 0.5u = ½★, 1.0u = ★, 1.5u = ★½, 2.0u = ★★, etc. This makes the
 * star-rating = units relationship 1:1 (no more "what's the difference
 * between two bets that are both ★★ but one is 1.5u and the other 2.0u").
 *
 * Source of truth for the math: `src/lib/sizing.ts`.
 * Dropped into the Glossary on the Methodology page.
 */
import Stars from './Stars';

interface Row {
  edgeLow: number;
  edgeHigh: number | null; // null = open-ended top
  units: number;
}

const ROWS: Row[] = [
  { edgeLow: 0.95, edgeHigh: 1.44, units: 0.5 },
  { edgeLow: 1.45, edgeHigh: 1.94, units: 1.0 },
  { edgeLow: 1.95, edgeHigh: 2.44, units: 1.5 },
  { edgeLow: 2.45, edgeHigh: 2.94, units: 2.0 },
  { edgeLow: 2.95, edgeHigh: 3.44, units: 2.5 },
  { edgeLow: 3.45, edgeHigh: 3.94, units: 3.0 },
  { edgeLow: 3.95, edgeHigh: 4.44, units: 3.5 },
  { edgeLow: 4.45, edgeHigh: 4.94, units: 4.0 },
  { edgeLow: 4.95, edgeHigh: 5.44, units: 4.5 },
  { edgeLow: 5.45, edgeHigh: null, units: 5.0 },
];

function fmtRange(low: number, high: number | null): string {
  if (high === null) return `${low.toFixed(2)}+`;
  return `${low.toFixed(2)} – ${high.toFixed(2)}`;
}

export default function BetSizingLadder() {
  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Bet Sizing Ladder
          </h4>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Every matchup score (edge) maps to a star rating AND a precise unit
            size. The two are NOT the same thing.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          Canonical
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#262626] bg-[#0a0a0a]">
              <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]">
                Matchup Score (Edge)
              </th>
              <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]">
                Star Rating
              </th>
              <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] text-right">
                Unit Size (to win)
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr
                key={r.edgeLow}
                className={`${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'} border-t border-[#1a1a1a]`}
              >
                <td className="px-4 py-2.5 text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-[#d4d4d4]">
                  {fmtRange(r.edgeLow, r.edgeHigh)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Stars units={r.units} />
                    <span className="text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
                      {r.units.toFixed(1)} stars
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-[#f5f5f5] font-semibold text-right">
                  {r.units.toFixed(1)}u
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-[#262626] bg-[#0a0a0a]">
        <p className="text-[11px] text-[#999] font-['Inter',system-ui,sans-serif] leading-relaxed">
          <span className="text-[#22c55e] font-semibold">Read this table as:</span> the edge
          determines the unit size precisely (every 0.50 of edge bumps the size 0.5u), and the
          star rating is a 1:1 visual of the unit size &mdash; half-stars included. So 2.5
          stars = 2.5 units, no rounding ambiguity. The Best Bet Matchup Score Threshold the
          model uses to decide what counts as a Best Bet is{' '}
          <span className="text-[#f5f5f5] font-medium">a separate concept</span> &mdash; a
          venue may require edge &ge; 2.45 before a matchup qualifies as a Best Bet.
        </p>
      </div>
    </div>
  );
}
