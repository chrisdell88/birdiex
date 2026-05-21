/**
 * PredictabilityVsROI — scatter showing the relationship between a
 * venue's course predictability and our tracked ROI at that venue.
 * One dot per completed tournament. As we add events, this chart grows
 * and the relationship sharpens.
 *
 * Lives on the Methodology page in the "From X Score to Tracked Bet"
 * section as backtest evidence supporting the predictability-aware
 * threshold formula.
 */
import { mastersStats, pgaStats } from '../lib/allTimeStats';
import { VENUES } from '../config/venues';

interface EventDot {
  id: string;
  course: string;
  predictability: number;
  roi: number;
  bets: number;
}

const dots: EventDot[] = [
  {
    id: 'masters-2026',
    course: VENUES['masters-2026'].course,
    predictability: VENUES['masters-2026'].predictability,
    roi: mastersStats.roi,
    bets: mastersStats.bets,
  },
  {
    id: 'pga-2026',
    course: VENUES['pga-2026'].course,
    predictability: VENUES['pga-2026'].predictability,
    roi: pgaStats.roi,
    bets: pgaStats.bets,
  },
];

// Plot bounds
const X_LO = 0;
const X_HI = 0.16;
const Y_LO = -25;
const Y_HI = 80;

// SVG layout
const W = 700;
const H = 380;
const PAD_L = 70;
const PAD_R = 30;
const PAD_T = 40;
const PAD_B = 60;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const xScale = (v: number) => PAD_L + ((v - X_LO) / (X_HI - X_LO)) * PLOT_W;
const yScale = (v: number) => PAD_T + PLOT_H - ((v - Y_LO) / (Y_HI - Y_LO)) * PLOT_H;

export default function PredictabilityVsROI() {
  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Predictability vs. Tracked ROI
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            One dot per completed tournament. Each event&rsquo;s course predictability on x,
            tracked-bet ROI on y. Right now: {dots.length} events. The chart grows as we
            add more.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          n = {dots.length}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Scatterplot of course predictability versus tracked ROI per tournament">
        {/* Plot background */}
        <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} fill="#0a0a0a" stroke="#262626" strokeWidth={1} />

        {/* Zero-ROI baseline */}
        <line
          x1={PAD_L}
          x2={PAD_L + PLOT_W}
          y1={yScale(0)}
          y2={yScale(0)}
          stroke="#525252"
          strokeWidth={1.5}
        />
        <text
          x={PAD_L + PLOT_W + 6}
          y={yScale(0) + 3}
          fill="#a1a1aa"
          fontSize="9"
          fontFamily="Inter, system-ui, sans-serif"
        >
          0%
        </text>

        {/* Y-axis ticks */}
        {[-20, 0, 20, 40, 60].map((v) => (
          <g key={v}>
            <line
              x1={PAD_L - 4}
              x2={PAD_L}
              y1={yScale(v)}
              y2={yScale(v)}
              stroke="#525252"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 8}
              y={yScale(v) + 3}
              textAnchor="end"
              fill="#737373"
              fontSize="9"
              fontFamily="JetBrains Mono, SF Mono, monospace"
            >
              {v > 0 ? `+${v}` : v}%
            </text>
          </g>
        ))}

        {/* X-axis ticks */}
        {[0, 0.05, 0.10, 0.15].map((v) => (
          <g key={v}>
            <line
              x1={xScale(v)}
              x2={xScale(v)}
              y1={PAD_T + PLOT_H}
              y2={PAD_T + PLOT_H + 4}
              stroke="#525252"
              strokeWidth={1}
            />
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

        {/* Data dots with labels */}
        {dots.map((d) => {
          const cx = xScale(d.predictability);
          const cy = yScale(d.roi);
          const labelLeft = d.predictability > X_HI * 0.65; // put label on left side when dot is far-right
          return (
            <g key={d.id}>
              {/* Halo */}
              <circle cx={cx} cy={cy} r={14} fill="#22c55e" fillOpacity={0.2} />
              {/* Dot */}
              <circle cx={cx} cy={cy} r={6} fill="#f5f5f5" stroke="#22c55e" strokeWidth={2} />
              {/* Label */}
              <g transform={`translate(${cx + (labelLeft ? -18 : 18)}, ${cy})`}>
                <text
                  textAnchor={labelLeft ? 'end' : 'start'}
                  fill="#f5f5f5"
                  fontSize="11"
                  fontWeight={600}
                  fontFamily="Inter, system-ui, sans-serif"
                  dy="-4"
                >
                  {d.course}
                </text>
                <text
                  textAnchor={labelLeft ? 'end' : 'start'}
                  fill="#22c55e"
                  fontSize="10"
                  fontFamily="JetBrains Mono, SF Mono, monospace"
                  dy="10"
                >
                  pred {d.predictability.toFixed(3)} · {d.roi > 0 ? '+' : ''}{d.roi.toFixed(1)}% · {d.bets} bets
                </text>
              </g>
            </g>
          );
        })}

        {/* Axis titles */}
        <text
          x={PAD_L + PLOT_W / 2}
          y={H - 14}
          textAnchor="middle"
          fill="#999"
          fontSize="10"
          letterSpacing="1.5"
          fontFamily="Inter, system-ui, sans-serif"
        >
          COURSE PREDICTABILITY →
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
          TRACKED ROI →
        </text>
      </svg>

      <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mt-4">
        After applying the venue-aware threshold formula, both events sit comfortably above the
        0% ROI line. With only {dots.length} data points we can&rsquo;t yet claim a stable
        relationship between predictability and tracked ROI &mdash; that&rsquo;s the point of
        this chart. We&rsquo;ll watch it grow event by event. Drift below 0% on a future dot
        would signal the formula needs a re-fit.
      </p>
    </div>
  );
}
