/**
 * HitRateByTier — bar chart of win rate at each star tier across all
 * tracked bets. Validates the sizing ladder: bigger stars should hit
 * meaningfully more often.
 *
 * Lives on the Results page below the Equity Curve. Pushes are excluded
 * from the win-rate denominator (W / (W + L)).
 */
import { allTimeBets } from '../lib/allTimeStats';
import { starsForEdge } from '../lib/sizing';

interface TierStat {
  star: number;
  wins: number;
  losses: number;
  pushes: number;
  total: number;
  hitRate: number;
}

function buildStats(): TierStat[] {
  const out: TierStat[] = [];
  for (let s = 1; s <= 5; s++) {
    const sub = allTimeBets.filter((b) => starsForEdge(b.edge) === s);
    if (!sub.length) continue;
    const wins = sub.filter((b) => b.result === 'W').length;
    const losses = sub.filter((b) => b.result === 'L').length;
    const pushes = sub.filter((b) => b.result === 'P').length;
    const decided = wins + losses;
    out.push({
      star: s,
      wins,
      losses,
      pushes,
      total: sub.length,
      hitRate: decided > 0 ? wins / decided : 0,
    });
  }
  return out;
}

const stats = buildStats();
const FAIR_LINE = 0.5; // breakeven (at +100); below this, you need plus money to be profitable

// SVG layout
const W = 720;
const H = 320;
const PAD_L = 60;
const PAD_R = 40;
const PAD_T = 40;
const PAD_B = 70;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const BAR_W = stats.length ? PLOT_W / stats.length : 0;

const yScale = (v: number) => PAD_T + PLOT_H - v * PLOT_H; // 0..1 range

export default function HitRateByTier() {
  if (!stats.length) return null;

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Hit Rate by Star Tier
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Win rate (W / W+L) at each star size across every tracked bet.
            Pushes excluded. Dashed line = 50% breakeven at -100 odds.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          All Tracked
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Bar chart of hit rate by star tier across all tracked bets">
        {/* Y-axis grid */}
        {[0.25, 0.5, 0.75, 1.0].map((v) => (
          <g key={v}>
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
              {(v * 100).toFixed(0)}%
            </text>
          </g>
        ))}

        {/* Breakeven line at 50% */}
        <line
          x1={PAD_L}
          x2={PAD_L + PLOT_W}
          y1={yScale(FAIR_LINE)}
          y2={yScale(FAIR_LINE)}
          stroke="#a1a1aa"
          strokeOpacity={0.5}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
        <text
          x={PAD_L + PLOT_W + 6}
          y={yScale(FAIR_LINE) + 3}
          fill="#a1a1aa"
          fontSize="9"
          fontFamily="Inter, system-ui, sans-serif"
        >
          50%
        </text>

        {/* Bars */}
        {stats.map((s, i) => {
          const bx = PAD_L + i * BAR_W + BAR_W * 0.18;
          const bw = BAR_W * 0.64;
          const by = yScale(s.hitRate);
          const bh = PAD_T + PLOT_H - by;
          const cx = bx + bw / 2;
          const beatsBreakeven = s.hitRate > FAIR_LINE;

          return (
            <g key={s.star}>
              {/* Bar */}
              <rect
                x={bx}
                y={by}
                width={bw}
                height={bh}
                rx={3}
                fill="#22c55e"
                fillOpacity={beatsBreakeven ? 0.55 + s.star * 0.06 : 0.25}
              />

              {/* Value at top of bar */}
              <text
                x={cx}
                y={by - 6}
                textAnchor="middle"
                fill={beatsBreakeven ? '#22c55e' : '#a1a1aa'}
                fontSize="13"
                fontWeight={700}
                fontFamily="JetBrains Mono, SF Mono, monospace"
              >
                {(s.hitRate * 100).toFixed(1)}%
              </text>

              {/* Star count below x-axis */}
              <text
                x={cx}
                y={PAD_T + PLOT_H + 22}
                textAnchor="middle"
                fill="#22c55e"
                fontSize="14"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {'★'.repeat(s.star)}
              </text>

              {/* Record below stars */}
              <text
                x={cx}
                y={PAD_T + PLOT_H + 40}
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="10"
                fontFamily="JetBrains Mono, SF Mono, monospace"
              >
                {s.wins}-{s.losses}
                {s.pushes > 0 ? `-${s.pushes}` : ''}
              </text>
              <text
                x={cx}
                y={PAD_T + PLOT_H + 54}
                textAnchor="middle"
                fill="#737373"
                fontSize="9"
                fontFamily="Inter, system-ui, sans-serif"
              >
                n={s.total}
              </text>
            </g>
          );
        })}

        {/* Y-axis title */}
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
          HIT RATE
        </text>
      </svg>

      <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mt-4">
        Validates the sizing ladder: bigger stars should hit more often. If the bars don&rsquo;t
        rise with star count, the model isn&rsquo;t correctly distinguishing strong picks from
        weak ones &mdash; and the sizing scheme needs a re-think. Samples at higher tiers are
        small, so treat them as directional, not gospel.
      </p>
    </div>
  );
}
