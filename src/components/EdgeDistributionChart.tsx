/**
 * EdgeDistributionChart — histogram of every graded bet's edge across
 * all tournaments. Shows how rare the high-edge bets really are.
 *
 * Lives on the Methodology page next to the BetSizingLadder so users see
 * "this is what the edge distribution looks like in practice" — most
 * picks cluster near the 0.95 floor; the 3-star-plus bets are scarce.
 *
 * Includes a colored band for each star tier so the size→edge mapping
 * is visible alongside the actual distribution.
 */
import { betLog } from '../data/resultsData';
import { r2Results } from '../data/pgaChampR2Results';
import { r3Results } from '../data/pgaChampR3Results';
import { r4Results } from '../data/pgaChampR4Results';
import { starsForEdge } from '../lib/sizing';

// Combine every scored bet (0.95+ — both tracked and below-threshold).
const ALL_BETS = [...betLog, ...r2Results, ...r3Results, ...r4Results];

// Bin into 0.1-wide buckets from 0.95 to 5.0.
const BIN_WIDTH = 0.1;
const BIN_MIN = 0.95;
const BIN_MAX = 5.0;
const NUM_BINS = Math.round((BIN_MAX - BIN_MIN) / BIN_WIDTH);

const bins: number[] = new Array(NUM_BINS).fill(0);
for (const b of ALL_BETS) {
  const idx = Math.min(NUM_BINS - 1, Math.max(0, Math.floor((b.edge - BIN_MIN) / BIN_WIDTH)));
  bins[idx]++;
}
const MAX_COUNT = Math.max(...bins, 1);
const TOTAL = ALL_BETS.length;

// Star tier breakpoints
const STAR_BREAKS = [
  { edge: 0.95, star: 1, color: '#22c55e', opacity: 0.18 },
  { edge: 1.95, star: 2, color: '#22c55e', opacity: 0.28 },
  { edge: 2.95, star: 3, color: '#22c55e', opacity: 0.40 },
  { edge: 3.95, star: 4, color: '#22c55e', opacity: 0.55 },
  { edge: 4.95, star: 5, color: '#22c55e', opacity: 0.75 },
];

// SVG layout
const W = 800;
const H = 360;
const PAD_L = 60;
const PAD_R = 30;
const PAD_T = 50;
const PAD_B = 60;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const xScale = (edge: number) => PAD_L + ((edge - BIN_MIN) / (BIN_MAX - BIN_MIN)) * PLOT_W;
const yScale = (count: number) => PAD_T + PLOT_H - (count / MAX_COUNT) * PLOT_H;

// Cumulative stats per star tier
const tierCounts = [1, 2, 3, 4, 5].map((star) => {
  const minEdge = star === 1 ? 0.95 : 0.95 + (star - 1) * 1.0;
  return { star, minEdge, count: ALL_BETS.filter((b) => starsForEdge(b.edge) === star).length };
});

export default function EdgeDistributionChart() {
  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            How Rare Is a Big Edge, Really?
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Every scored bet across all tournaments, binned by X-Score edge ({TOTAL} total
            picks). Most cluster near the 0.95 floor; the high-tier bets are scarce.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          All Time
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Histogram of bet edges across all tracked tournaments">
        {/* Star tier background bands */}
        {STAR_BREAKS.map((br, i) => {
          const next = STAR_BREAKS[i + 1]?.edge ?? BIN_MAX;
          const x1 = xScale(br.edge);
          const x2 = xScale(Math.min(next, BIN_MAX));
          return (
            <rect
              key={br.star}
              x={x1}
              y={PAD_T}
              width={x2 - x1}
              height={PLOT_H}
              fill={br.color}
              fillOpacity={br.opacity * 0.25}
            />
          );
        })}

        {/* Y-axis grid */}
        {[0.25, 0.5, 0.75, 1.0].map((frac) => {
          const v = Math.round(MAX_COUNT * frac);
          return (
            <g key={frac}>
              <line
                x1={PAD_L}
                x2={PAD_L + PLOT_W}
                y1={yScale(v)}
                y2={yScale(v)}
                stroke="#262626"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <text
                x={PAD_L - 6}
                y={yScale(v) + 3}
                textAnchor="end"
                fill="#737373"
                fontSize="9"
                fontFamily="JetBrains Mono, SF Mono, monospace"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {bins.map((count, i) => {
          if (count === 0) return null;
          const edgeStart = BIN_MIN + i * BIN_WIDTH;
          const x1 = xScale(edgeStart);
          const x2 = xScale(edgeStart + BIN_WIDTH);
          const y = yScale(count);
          const stars = starsForEdge(edgeStart);
          const intensity = 0.45 + (stars - 1) * 0.12;
          return (
            <rect
              key={i}
              x={x1}
              y={y}
              width={Math.max(1, x2 - x1 - 1)}
              height={PAD_T + PLOT_H - y}
              fill="#22c55e"
              fillOpacity={intensity}
            />
          );
        })}

        {/* Star tier dividers */}
        {STAR_BREAKS.slice(1).map((br) => (
          <line
            key={`div-${br.star}`}
            x1={xScale(br.edge)}
            x2={xScale(br.edge)}
            y1={PAD_T}
            y2={PAD_T + PLOT_H}
            stroke="#22c55e"
            strokeOpacity={0.3}
            strokeWidth={1.5}
            strokeDasharray="3 4"
          />
        ))}

        {/* Star tier labels at top */}
        {[1, 2, 3, 4, 5].map((star) => {
          const minEdge = star === 1 ? 0.95 : 0.95 + (star - 1) * 1.0;
          const nextEdge = star < 5 ? 0.95 + star * 1.0 : BIN_MAX;
          const cx = (xScale(minEdge) + xScale(Math.min(nextEdge, BIN_MAX))) / 2;
          return (
            <text
              key={`label-${star}`}
              x={cx}
              y={PAD_T - 22}
              textAnchor="middle"
              fill="#22c55e"
              fontSize="11"
              fontWeight={600}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {'★'.repeat(star)}
            </text>
          );
        })}
        {[1, 2, 3, 4, 5].map((star) => {
          const minEdge = star === 1 ? 0.95 : 0.95 + (star - 1) * 1.0;
          const nextEdge = star < 5 ? 0.95 + star * 1.0 : BIN_MAX;
          const cx = (xScale(minEdge) + xScale(Math.min(nextEdge, BIN_MAX))) / 2;
          const tier = tierCounts.find((t) => t.star === star);
          return (
            <text
              key={`count-${star}`}
              x={cx}
              y={PAD_T - 8}
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="9"
              fontFamily="JetBrains Mono, SF Mono, monospace"
            >
              n={tier?.count ?? 0}
            </text>
          );
        })}

        {/* X-axis tick labels (every 0.5) */}
        {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((v) => (
          <g key={v}>
            <line x1={xScale(v)} x2={xScale(v)} y1={PAD_T + PLOT_H} y2={PAD_T + PLOT_H + 4} stroke="#525252" strokeWidth={1} />
            <text
              x={xScale(v)}
              y={PAD_T + PLOT_H + 16}
              textAnchor="middle"
              fill="#737373"
              fontSize="9"
              fontFamily="JetBrains Mono, SF Mono, monospace"
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Axis titles */}
        <text
          x={PAD_L + PLOT_W / 2}
          y={H - 12}
          textAnchor="middle"
          fill="#999"
          fontSize="10"
          letterSpacing="1.5"
          fontFamily="Inter, system-ui, sans-serif"
        >
          X-SCORE EDGE
        </text>
        <text
          x={18}
          y={PAD_T + PLOT_H / 2}
          textAnchor="middle"
          fill="#999"
          fontSize="10"
          letterSpacing="1.5"
          fontFamily="Inter, system-ui, sans-serif"
          transform={`rotate(-90, 18, ${PAD_T + PLOT_H / 2})`}
        >
          BETS IN BUCKET
        </text>
      </svg>

      <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mt-4">
        Roughly{' '}
        <span className="text-[#22c55e] font-semibold font-['JetBrains_Mono','SF_Mono',monospace]">
          {((tierCounts[0].count / TOTAL) * 100).toFixed(0)}%
        </span>
        {' '}of model picks land in the ★ band (edge 0.95&ndash;1.94), and only{' '}
        <span className="text-[#22c55e] font-semibold font-['JetBrains_Mono','SF_Mono',monospace]">
          {(((tierCounts[2].count + tierCounts[3].count + tierCounts[4].count) / TOTAL) * 100).toFixed(0)}%
        </span>
        {' '}make it to ★★★ or higher. That&rsquo;s why the venue-specific threshold matters &mdash;
        on a low-predictability course we&rsquo;re cutting off most of the picks.
      </p>
    </div>
  );
}
