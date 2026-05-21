/**
 * PuttingRegressionChart — real PGA Tour data showing the full
 * strokes-gained persistence hierarchy. 2×2 grid of scatterplots, each
 * comparing R1 → R2 strokes-gained for one SG category at the 2026 PGA
 * Championship (156 players in the field).
 *
 *   TOP LEFT  — OTT (Off-the-Tee).      R² ≈ 0.13 — the only real signal.
 *   TOP RIGHT — APP (Approach).         R² ≈ 0.04 — mostly random round-to-round.
 *   BOT LEFT  — ARG (Around the Green). R² ≈ 0.01 — basically random.
 *   BOT RIGHT — PUTT (Putting).         R² ≈ 0.04 — basically random.
 *
 * The visual proves the thesis: OTT carries forward. Everything else is
 * mostly noise round-to-round. The X Score subtracts putting and weights
 * OTT/APP heavily because of exactly this.
 *
 * Data computed at import time from pgaChampR1Data + pgaChampR2Data.
 */
import { roundOnlyData as r1 } from '../data/pgaChampR1Data';
import { roundOnlyData as r2 } from '../data/pgaChampR2Data';

interface Pair { x: number; y: number; }
type SgKey = 'sg_ott' | 'sg_app' | 'sg_arg' | 'sg_putt';

const r1Map = new Map(r1.map((p) => [p.player_name, p]));

function pairsFor(key: SgKey): Pair[] {
  const out: Pair[] = [];
  for (const p2 of r2) {
    const p1 = r1Map.get(p2.player_name);
    if (!p1) continue;
    out.push({ x: p1[key], y: p2[key] });
  }
  return out;
}

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

interface Category {
  key: SgKey;
  title: string;
  subtitle: string;
  isSustained: boolean;
  pairs: Pair[];
}

// Each panel: OTT (sustained) at top-left, then APP, ARG, PUTT in order
// of decreasing persistence. The eye reads "stickiest" → "most random".
const categories: Category[] = [
  {
    key: 'sg_ott',
    title: 'Off-the-Tee',
    subtitle: 'THE ONE THAT STICKS',
    isSustained: true,
    pairs: pairsFor('sg_ott'),
  },
  {
    key: 'sg_app',
    title: 'Approach',
    subtitle: 'SOMEWHAT SUSTAINED · BUT VARIANCE-HEAVY',
    isSustained: false,
    pairs: pairsFor('sg_app'),
  },
  {
    key: 'sg_arg',
    title: 'Around the Green',
    subtitle: 'NEAR-RANDOM ROUND-TO-ROUND',
    isSustained: false,
    pairs: pairsFor('sg_arg'),
  },
  {
    key: 'sg_putt',
    title: 'Putting',
    subtitle: 'A FRESH ROLL OF THE DICE EVERY ROUND',
    isSustained: false,
    pairs: pairsFor('sg_putt'),
  },
];

const fits = categories.map((c) => fit(c.pairs));
const ottR2 = fits[0].r2;
const puttR2 = fits[3].r2;

// Plot bounds — same for all 4 panels for fair comparison.
const AXIS_MIN = -3;
const AXIS_MAX = 3;

// Panel grid: 2 cols × 2 rows. Each panel uses a 320×240 cell.
const CELL_W = 320;
const CELL_H = 250;
const PLOT_W = 240;
const PLOT_H = 180;
const PLOT_OFFSET_X = 60;
const PLOT_OFFSET_Y = 45;
const SVG_W = CELL_W * 2;
const SVG_H = CELL_H * 2;

interface PanelProps {
  category: Category;
  fitted: ReturnType<typeof fit>;
  row: number;
  col: number;
}

function Panel({ category, fitted, row, col }: PanelProps) {
  const PX = col * CELL_W + PLOT_OFFSET_X;
  const PY = row * CELL_H + PLOT_OFFSET_Y;

  const xScale = (v: number) => PX + ((v - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * PLOT_W;
  const yScale = (v: number) => PY + PLOT_H - ((v - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * PLOT_H;

  const trendY1 = fitted.m * AXIS_MIN + fitted.b;
  const trendY2 = fitted.m * AXIS_MAX + fitted.b;

  const accent = category.isSustained ? '#22c55e' : '#525252';
  const dotFill = category.isSustained ? '#22c55e' : '#737373';
  const dotOpacity = category.isSustained ? 0.55 : 0.6;

  return (
    <g>
      {/* Title */}
      <text
        x={PX + PLOT_W / 2}
        y={PY - 22}
        textAnchor="middle"
        fill="#f5f5f5"
        fontSize="13"
        fontWeight={600}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {category.title}
      </text>
      <text
        x={PX + PLOT_W / 2}
        y={PY - 8}
        textAnchor="middle"
        fill="#a1a1aa"
        fontSize="9"
        letterSpacing="1"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {category.subtitle}
      </text>

      {/* Plot background */}
      <rect x={PX} y={PY} width={PLOT_W} height={PLOT_H} fill="#0a0a0a" stroke="#262626" strokeWidth={1} />

      {/* Origin crosshair (SG = 0) */}
      <line x1={xScale(0)} x2={xScale(0)} y1={PY} y2={PY + PLOT_H} stroke="#262626" strokeWidth={1} strokeDasharray="2 3" />
      <line x1={PX} x2={PX + PLOT_W} y1={yScale(0)} y2={yScale(0)} stroke="#262626" strokeWidth={1} strokeDasharray="2 3" />

      {/* Trendline */}
      <line
        x1={xScale(AXIS_MIN)}
        x2={xScale(AXIS_MAX)}
        y1={yScale(trendY1)}
        y2={yScale(trendY2)}
        stroke={accent}
        strokeWidth={category.isSustained ? 2.5 : 1.5}
        strokeDasharray={category.isSustained ? undefined : '4 4'}
        opacity={category.isSustained ? 0.9 : 0.6}
      />

      {/* Data points */}
      {category.pairs.map((p, i) => (
        <circle
          key={i}
          cx={xScale(p.x)}
          cy={yScale(p.y)}
          r={2.3}
          fill={dotFill}
          fillOpacity={dotOpacity}
        />
      ))}

      {/* R² badge */}
      <g transform={`translate(${PX + PLOT_W - 8}, ${PY + 8})`}>
        <rect
          x={-62}
          y={0}
          width={62}
          height={24}
          rx={4}
          fill="#0a0a0a"
          stroke={accent}
          strokeOpacity={0.6}
          strokeWidth={1}
        />
        <text x={-54} y={10} fill="#a1a1aa" fontSize="9" letterSpacing="1" fontFamily="Inter, system-ui, sans-serif">
          R²
        </text>
        <text
          x={-6}
          y={18}
          textAnchor="end"
          fill={category.isSustained ? '#22c55e' : '#a1a1aa'}
          fontSize="12"
          fontWeight={700}
          fontFamily="JetBrains Mono, SF Mono, monospace"
        >
          {fitted.r2.toFixed(3)}
        </text>
      </g>

      {/* Axis labels */}
      <text
        x={PX + PLOT_W / 2}
        y={PY + PLOT_H + 20}
        textAnchor="middle"
        fill="#999"
        fontSize="9"
        letterSpacing="1"
        fontFamily="Inter, system-ui, sans-serif"
      >
        R1 SG →
      </text>
      <text
        x={PX - 14}
        y={PY + PLOT_H / 2}
        textAnchor="middle"
        fill="#999"
        fontSize="9"
        letterSpacing="1"
        fontFamily="Inter, system-ui, sans-serif"
        transform={`rotate(-90, ${PX - 14}, ${PY + PLOT_H / 2})`}
      >
        R2 SG →
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
            One skill sticks. The other three regress.
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Each dot = one PGA Championship 2026 golfer ({categories[0].pairs.length} players).
            R1 strokes-gained on the x-axis, R2 strokes-gained on the y-axis. All 4 SG
            categories on the same scale.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          Real Data
        </span>
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Four scatterplots comparing R1 to R2 strokes-gained across OTT, APP, ARG, and PUTT"
      >
        <Panel category={categories[0]} fitted={fits[0]} row={0} col={0} />
        <Panel category={categories[1]} fitted={fits[1]} row={0} col={1} />
        <Panel category={categories[2]} fitted={fits[2]} row={1} col={0} />
        <Panel category={categories[3]} fitted={fits[3]} row={1} col={1} />
      </svg>

      <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mt-4">
        Only Off-the-Tee shows real persistence round-to-round. Approach, Around-the-Green,
        and Putting all sit at near-random R² values. OTT carries forward roughly{' '}
        <span className="text-[#22c55e] font-semibold font-['JetBrains_Mono','SF_Mono',monospace]">
          {puttR2 > 0 ? `${(ottR2 / puttR2).toFixed(1)}×` : 'multiple times'}
        </span>
        {' '}stronger than putting. This is the thesis behind the X Score: the market treats
        all four as &ldquo;strokes gained,&rdquo; but only one is a repeatable skill at the
        round level.
      </p>
    </div>
  );
}
