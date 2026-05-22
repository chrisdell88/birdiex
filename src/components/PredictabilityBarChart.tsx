/**
 * PredictabilityBarChart — bar chart of the PGA Tour venues we've tracked,
 * with the matchup score threshold we use at each. The predictability
 * numbers themselves are computed from DataGolf's player-decompositions
 * data (`/preds/player-decompositions`), one source: the mean absolute
 * value of `total_course_history_adjustment` across the field.
 *
 * What this chart is for on our site: showing how OUR threshold formula
 * lands across the venues we've sampled. The underlying predictability
 * ranking is a DataGolf metric — they publish a similar chart across all
 * ~60 PGA venues. Ours is the per-event slice with our threshold pinned.
 *
 * Bars colour-coded by tier:
 *   • Augusta (0.144) — full green, the gold-standard predictability
 *   • Mid-tier — faded green
 *   • Low predictability (≤0.05) — muted, since the model is more cautious
 */
import { VENUES, floorForEvent } from '../config/venues';

const venues = (Object.keys(VENUES) as Array<keyof typeof VENUES>).map((id) => {
  const meta = VENUES[id];
  const floor = floorForEvent(id).floor;
  return {
    id,
    name: meta.course,
    eventLabel: meta.eventName.replace(/ 20\d\d$/, ''),
    predictability: meta.predictability,
    floor,
  };
}).sort((a, b) => b.predictability - a.predictability);

// X-axis upper bound — gives Augusta room to breathe while keeping
// low-predictability venues readable.
const MAX_PRED = 0.16;

export default function PredictabilityBarChart() {
  // Layout: 600 wide × variable tall. Each bar row is 56 tall.
  const ROW_H = 56;
  const LEFT_PAD = 170;       // for venue labels
  const RIGHT_PAD = 90;       // for floor badge
  const TOP_PAD = 40;
  const PLOT_W = 600 - LEFT_PAD - RIGHT_PAD; // 340
  const totalHeight = TOP_PAD + venues.length * ROW_H + 30;

  const scaleX = (v: number) => (v / MAX_PRED) * PLOT_W;

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Course Predictability, Ranked
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            How much past performance at the venue predicts future results.
            The lower the bar, the higher our Best Bet Matchup Score Threshold rises.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          Course-Aware
        </span>
      </div>

      <svg
        viewBox={`0 0 600 ${totalHeight}`}
        className="w-full h-auto"
        role="img"
        aria-label="Bar chart of PGA Tour venues ranked by course predictability"
      >
        {/* X axis title */}
        <text
          x={LEFT_PAD + PLOT_W / 2}
          y={22}
          textAnchor="middle"
          fill="#999"
          fontSize="10"
          letterSpacing="1.5"
          fontFamily="Inter, system-ui, sans-serif"
        >
          PREDICTABILITY (HIGHER = MORE SIGNAL)
        </text>

        {/* Top axis tick marks: 0, 0.05, 0.10, 0.15 */}
        {[0, 0.05, 0.10, 0.15].map((v) => (
          <g key={v}>
            <line
              x1={LEFT_PAD + scaleX(v)}
              x2={LEFT_PAD + scaleX(v)}
              y1={TOP_PAD - 6}
              y2={TOP_PAD + venues.length * ROW_H}
              stroke="#262626"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <text
              x={LEFT_PAD + scaleX(v)}
              y={TOP_PAD - 10}
              textAnchor="middle"
              fill="#737373"
              fontSize="9"
              fontFamily="JetBrains Mono, SF Mono, monospace"
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {venues.map((v, i) => {
          const y = TOP_PAD + i * ROW_H + 8;
          const barH = 28;
          const barW = scaleX(v.predictability);

          // Color tier based on predictability
          let barColor: string, barOpacity: number;
          if (v.predictability >= 0.10) {
            barColor = '#22c55e';
            barOpacity = 0.85;
          } else if (v.predictability >= 0.05) {
            barColor = '#22c55e';
            barOpacity = 0.5;
          } else {
            barColor = '#22c55e';
            barOpacity = 0.3;
          }

          return (
            <g key={v.id}>
              {/* Venue label */}
              <text
                x={LEFT_PAD - 12}
                y={y + 13}
                textAnchor="end"
                fill="#f5f5f5"
                fontSize="11"
                fontWeight={600}
                fontFamily="Inter, system-ui, sans-serif"
              >
                {v.name}
              </text>
              <text
                x={LEFT_PAD - 12}
                y={y + 25}
                textAnchor="end"
                fill="#a1a1aa"
                fontSize="9"
                letterSpacing="0.5"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {v.eventLabel}
              </text>

              {/* Bar */}
              <rect
                x={LEFT_PAD}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                fill={barColor}
                fillOpacity={barOpacity}
              />

              {/* Numeric value at the end of the bar */}
              <text
                x={LEFT_PAD + barW + 6}
                y={y + 18}
                fill="#d4d4d4"
                fontSize="11"
                fontWeight={600}
                fontFamily="JetBrains Mono, SF Mono, monospace"
              >
                {v.predictability.toFixed(3)}
              </text>

              {/* Threshold badge on the right */}
              <g transform={`translate(${LEFT_PAD + PLOT_W + 12}, ${y + 2})`}>
                <rect
                  x={0}
                  y={0}
                  width={70}
                  height={24}
                  rx={4}
                  fill="#0a0a0a"
                  stroke="#22c55e"
                  strokeOpacity={0.4}
                  strokeWidth={1}
                />
                <text
                  x={6}
                  y={10}
                  fill="#a1a1aa"
                  fontSize="8"
                  letterSpacing="0.8"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  THRESHOLD
                </text>
                <text
                  x={6}
                  y={20}
                  fill="#22c55e"
                  fontSize="11"
                  fontWeight={700}
                  fontFamily="JetBrains Mono, SF Mono, monospace"
                >
                  ≥ {v.floor.toFixed(2)}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mt-4">
        Augusta National&rsquo;s predictability (
        <span className="text-[#22c55e] font-semibold font-['JetBrains_Mono','SF_Mono',monospace]">
          0.144
        </span>
        ) is the highest on the PGA Tour &mdash; past results there are uniquely indicative of
        future ones, so every model pick clears the 0.95 hard floor and counts as a Best Bet. At
        less-predictable venues, course history is much weaker signal; the model still produces
        picks, but we raise the Best Bet Matchup Score Threshold so only high-edge bets
        qualify as Best Bets.
      </p>
      <p className="text-[10px] text-[#737373] font-['Inter',system-ui,sans-serif] leading-relaxed mt-2">
        Predictability computed from DataGolf player decompositions (mean absolute
        course-history adjustment over the field). DataGolf publishes the same ranking
        across the full PGA schedule on their Course History tool; this chart shows the
        slice of venues we&rsquo;ve tracked, with the Best Bet Matchup Score Threshold we
        apply at each one.
      </p>
    </div>
  );
}
