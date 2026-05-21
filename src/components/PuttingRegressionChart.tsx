/**
 * PuttingRegressionChart — real PGA Tour data showing why our model is built
 * the way it is. Two side-by-side scatterplots from the 2026 PGA Championship:
 *
 *   LEFT  — Round 1 SG Putting vs Round 2 SG Putting. R² ≈ 0.04. Random cloud.
 *   RIGHT — Round 1 SG OTT vs Round 2 SG OTT. R² ≈ 0.13 (~3.5x stronger).
 *
 * The visual sells the thesis: putting regresses to the mean far faster than
 * ball-striking. The model subtracts putting and weights OTT/APP heavily.
 *
 * Data computed at import time from pgaChampR1Data + pgaChampR2Data.
 */
import { roundOnlyData as r1 } from '../data/pgaChampR1Data';
import { roundOnlyData as r2 } from '../data/pgaChampR2Data';

interface Pair { x: number; y: number; }

const r1Map = new Map(r1.map((p) => [p.player_name, p]));

const puttPairs: Pair[] = [];
const ottPairs: Pair[] = [];
for (const p2 of r2) {
  const p1 = r1Map.get(p2.player_name);
  if (!p1) continue;
  puttPairs.push({ x: p1.sg_putt, y: p2.sg_putt });
  ottPairs.push({ x: p1.sg_ott, y: p2.sg_ott });
}

/** Compute Pearson r and least-squares fit y = m·x + b for a set of points. */
function fit(pairs: Pair[]) {
  const n = pairs.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
  for (const p of pairs) {
    sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; syy += p.y * p.y;
  }
  const mx = sx / n, my = sy / n;
  const cov = sxy / n - mx * my;
  const vx = sxx / n - mx * mx;
  const vy = syy / n - my * my;
  const r = cov / Math.sqrt(vx * vy);
  const m = cov / vx;
  const b = my - m * mx;
  return { r, r2: r * r, m, b };
}

const puttFit = fit(puttPairs);
const ottFit = fit(ottPairs);

// Plot bounds — same on both axes, both panels, for fair comparison.
const AXIS_MIN = -3;
const AXIS_MAX = 3;

interface PanelProps {
  title: string;
  subtitle: string;
  pairs: Pair[];
  rSquared: number;
  m: number;
  b: number;
  isRandom: boolean;
  xOffset: number;
}

function Panel({ title, subtitle, pairs, rSquared, m, b, isRandom, xOffset }: PanelProps) {
  // Panel-local plot area: 240 wide × 220 tall, sitting at (xOffset+50, 50).
  const W = 240;
  const H = 220;
  const PX = xOffset + 50; // plot origin x (left edge of plot area)
  const PY = 50;           // plot origin y (top edge of plot area)

  const xScale = (v: number) => PX + ((v - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * W;
  const yScale = (v: number) => PY + H - ((v - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * H;

  // Trendline endpoints clipped to plot area.
  const trendY1 = m * AXIS_MIN + b;
  const trendY2 = m * AXIS_MAX + b;

  return (
    <g>
      {/* Title */}
      <text
        x={PX + W / 2}
        y={PY - 28}
        textAnchor="middle"
        fill="#f5f5f5"
        fontSize="13"
        fontWeight={600}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {title}
      </text>
      <text
        x={PX + W / 2}
        y={PY - 13}
        textAnchor="middle"
        fill="#a1a1aa"
        fontSize="10"
        letterSpacing="1"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {subtitle}
      </text>

      {/* Plot background */}
      <rect
        x={PX}
        y={PY}
        width={W}
        height={H}
        fill="#0a0a0a"
        stroke="#262626"
        strokeWidth={1}
      />

      {/* Origin crosshair (SG = 0) */}
      <line
        x1={xScale(0)}
        x2={xScale(0)}
        y1={PY}
        y2={PY + H}
        stroke="#262626"
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <line
        x1={PX}
        x2={PX + W}
        y1={yScale(0)}
        y2={yScale(0)}
        stroke="#262626"
        strokeWidth={1}
        strokeDasharray="2 3"
      />

      {/* Trendline */}
      <line
        x1={xScale(AXIS_MIN)}
        x2={xScale(AXIS_MAX)}
        y1={yScale(trendY1)}
        y2={yScale(trendY2)}
        stroke={isRandom ? '#525252' : '#22c55e'}
        strokeWidth={isRandom ? 1.5 : 2.5}
        strokeDasharray={isRandom ? '4 4' : undefined}
        opacity={isRandom ? 0.6 : 0.9}
      />

      {/* Data points */}
      {pairs.map((p, i) => (
        <circle
          key={i}
          cx={xScale(p.x)}
          cy={yScale(p.y)}
          r={2.5}
          fill={isRandom ? '#737373' : '#22c55e'}
          fillOpacity={isRandom ? 0.65 : 0.55}
        />
      ))}

      {/* R² badge */}
      <g transform={`translate(${PX + W - 8}, ${PY + 8})`}>
        <rect
          x={-68}
          y={0}
          width={68}
          height={26}
          rx={4}
          fill="#0a0a0a"
          stroke={isRandom ? '#525252' : '#22c55e'}
          strokeOpacity={0.6}
          strokeWidth={1}
        />
        <text
          x={-58}
          y={11}
          fill="#a1a1aa"
          fontSize="9"
          letterSpacing="1"
          fontFamily="Inter, system-ui, sans-serif"
        >
          R²
        </text>
        <text
          x={-6}
          y={19}
          textAnchor="end"
          fill={isRandom ? '#a1a1aa' : '#22c55e'}
          fontSize="13"
          fontWeight={700}
          fontFamily="JetBrains Mono, SF Mono, monospace"
        >
          {rSquared.toFixed(3)}
        </text>
      </g>

      {/* Axis labels */}
      <text
        x={PX + W / 2}
        y={PY + H + 22}
        textAnchor="middle"
        fill="#999"
        fontSize="10"
        letterSpacing="1"
        fontFamily="Inter, system-ui, sans-serif"
      >
        ROUND 1 SG ({title.split(' ')[0]})
      </text>
      <text
        x={PX - 14}
        y={PY + H / 2}
        textAnchor="middle"
        fill="#999"
        fontSize="10"
        letterSpacing="1"
        fontFamily="Inter, system-ui, sans-serif"
        transform={`rotate(-90, ${PX - 14}, ${PY + H / 2})`}
      >
        ROUND 2 SG ({title.split(' ')[0]})
      </text>
    </g>
  );
}

export default function PuttingRegressionChart() {
  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Putting regresses. Ball-striking sustains.
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Each dot = one PGA Championship 2026 golfer ({puttPairs.length} players).
            R1 strokes-gained on the x-axis, R2 strokes-gained on the y-axis.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          Real Data
        </span>
      </div>

      <svg viewBox="0 0 640 320" className="w-full h-auto" role="img" aria-label="Side-by-side scatterplots showing PUTT R-squared 0.038 versus OTT R-squared 0.134">
        <Panel
          title="Putting"
          subtitle="A FRESH ROLL OF THE DICE EVERY ROUND"
          pairs={puttPairs}
          rSquared={puttFit.r2}
          m={puttFit.m}
          b={puttFit.b}
          isRandom={true}
          xOffset={0}
        />
        <Panel
          title="Off-the-Tee"
          subtitle="A SKILL THAT STICKS"
          pairs={ottPairs}
          rSquared={ottFit.r2}
          m={ottFit.m}
          b={ottFit.b}
          isRandom={false}
          xOffset={320}
        />
      </svg>

      <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mt-4">
        On the left, putting from Round 1 barely predicts putting in Round 2 &mdash; the cloud is
        diffuse and the trendline is nearly flat. On the right, off-the-tee performance carries
        forward roughly{' '}
        <span className="text-[#22c55e] font-semibold font-['JetBrains_Mono','SF_Mono',monospace]">
          {(ottFit.r2 / puttFit.r2).toFixed(1)}x
        </span>
        {' '}better. This is the thesis behind the X Score: the market treats both as
        &ldquo;strokes gained,&rdquo; but only one is a repeatable skill.
      </p>
    </div>
  );
}
