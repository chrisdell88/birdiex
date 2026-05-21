/**
 * EquityCurve — running cumulative units chart of every tracked bet, in
 * chronological order. The classic bettor's equity curve — what most
 * sports-betting Twitter accounts can't (or won't) show because their
 * record only looks good in summary form.
 *
 * Tracked bets only (passes the venue's matchup score threshold). The
 * raw graded bets stay in the data files for internal backtesting.
 *
 * Lives at the top of the Results page All-Time view.
 */
import type { BetRecord } from '../types';
import { isTrackedBet } from '../lib/sizing';
import { floorForEvent } from '../config/venues';
import { betLog } from '../data/resultsData';
import { r2Results } from '../data/pgaChampR2Results';
import { r3Results } from '../data/pgaChampR3Results';
import { r4Results } from '../data/pgaChampR4Results';

interface CurvePoint {
  betIndex: number;
  cumUnits: number;
  bet: BetRecord;
  event: 'Masters 2026' | 'PGA Champ 2026';
}

// Build chronologically-ordered sequence of tracked bets across all events.
function buildSequence(): { points: CurvePoint[]; eventBoundaries: { event: string; betIndex: number }[] } {
  const mastersFloor = floorForEvent('masters-2026').floor;
  const pgaFloor = floorForEvent('pga-2026').floor;

  const mastersTracked = betLog.filter((b) => isTrackedBet(b.edge, mastersFloor));
  const pgaTracked = [...r2Results, ...r3Results, ...r4Results].filter((b) =>
    isTrackedBet(b.edge, pgaFloor),
  );

  // Both data sources are already sorted by id (which is chronological within
  // the event). Sort PGA across rounds first since it spans 3 separate files.
  pgaTracked.sort((a, b) => a.round - b.round || a.id - b.id);

  const seq: CurvePoint[] = [];
  let cum = 0;
  let i = 0;

  const boundaries: { event: string; betIndex: number }[] = [
    { event: 'Masters 2026', betIndex: 0 },
  ];

  for (const b of mastersTracked) {
    cum += b.units;
    seq.push({ betIndex: i, cumUnits: +cum.toFixed(2), bet: b, event: 'Masters 2026' });
    i++;
  }
  if (pgaTracked.length) {
    boundaries.push({ event: 'PGA Champ 2026', betIndex: i });
  }
  for (const b of pgaTracked) {
    cum += b.units;
    seq.push({ betIndex: i, cumUnits: +cum.toFixed(2), bet: b, event: 'PGA Champ 2026' });
    i++;
  }
  return { points: seq, eventBoundaries: boundaries };
}

const { points, eventBoundaries } = buildSequence();

// Plot bounds.
const N = points.length;
const finalUnits = points.length ? points[points.length - 1].cumUnits : 0;
const peakUnits = Math.max(0, ...points.map((p) => p.cumUnits));
const troughUnits = Math.min(0, ...points.map((p) => p.cumUnits));

// SVG layout: 800 wide × 320 tall.
const W = 800;
const H = 320;
const PAD_L = 50;
const PAD_R = 60;
const PAD_T = 30;
const PAD_B = 40;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

// Y range with some headroom.
const Y_MIN = Math.min(troughUnits - 5, -5);
const Y_MAX = Math.max(peakUnits + 5, 10);

const xScale = (i: number) => PAD_L + (i / Math.max(1, N - 1)) * PLOT_W;
const yScale = (u: number) =>
  PAD_T + PLOT_H - ((u - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;

// Build the path D string.
const pathD = points
  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xScale(p.betIndex).toFixed(1)} ${yScale(p.cumUnits).toFixed(1)}`)
  .join(' ');

// Area fill under curve (down to y=0 baseline).
const baselineY = yScale(0);
const areaD =
  N > 0
    ? `M ${xScale(0).toFixed(1)} ${baselineY.toFixed(1)} ` +
      points.map((p) => `L ${xScale(p.betIndex).toFixed(1)} ${yScale(p.cumUnits).toFixed(1)}`).join(' ') +
      ` L ${xScale(N - 1).toFixed(1)} ${baselineY.toFixed(1)} Z`
    : '';

export default function EquityCurve() {
  // Y-axis tick values — every 25u
  const yTicks: number[] = [];
  for (let v = Math.ceil(Y_MIN / 25) * 25; v <= Y_MAX; v += 25) yTicks.push(v);

  return (
    <div className="bg-[#0a0a0a] border border-[#22c55e]/30 rounded-xl p-5">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Equity Curve &mdash; Every Tracked Bet, In Order
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            {N} tracked bets across {eventBoundaries.length} tournament
            {eventBoundaries.length === 1 ? '' : 's'}.
            Cumulative net units after each bet.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif]">
            Current
          </div>
          <div
            className={`text-2xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] ${
              finalUnits > 0 ? 'text-[#22c55e]' : finalUnits < 0 ? 'text-[#ef4444]' : 'text-[#d4d4d4]'
            }`}
          >
            {finalUnits > 0 ? '+' : ''}{finalUnits.toFixed(2)}u
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Equity curve showing cumulative units across all tracked bets">
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + ticks */}
        {yTicks.map((v) => (
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
              x={PAD_L - 8}
              y={yScale(v) + 3}
              textAnchor="end"
              fill="#737373"
              fontSize="9"
              fontFamily="JetBrains Mono, SF Mono, monospace"
            >
              {v > 0 ? '+' : ''}{v}
            </text>
          </g>
        ))}

        {/* Zero baseline (emphasized) */}
        <line
          x1={PAD_L}
          x2={PAD_L + PLOT_W}
          y1={yScale(0)}
          y2={yScale(0)}
          stroke="#525252"
          strokeWidth={1}
        />

        {/* Event boundary markers (vertical lines + labels) */}
        {eventBoundaries.map((b, i) => {
          const x = xScale(b.betIndex);
          return (
            <g key={i}>
              <line
                x1={x}
                x2={x}
                y1={PAD_T}
                y2={PAD_T + PLOT_H}
                stroke="#22c55e"
                strokeOpacity={0.25}
                strokeWidth={1}
                strokeDasharray="3 4"
              />
              <text
                x={x + 6}
                y={PAD_T + 12}
                fill="#22c55e"
                fontSize="9"
                letterSpacing="0.5"
                fontFamily="Inter, system-ui, sans-serif"
                opacity={0.8}
              >
                {b.event.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Area under curve */}
        {areaD && <path d={areaD} fill="url(#equityGradient)" />}

        {/* The curve itself */}
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Final-point dot */}
        {N > 0 && (
          <>
            <circle
              cx={xScale(N - 1)}
              cy={yScale(finalUnits)}
              r={5}
              fill="#22c55e"
              fillOpacity={0.3}
            />
            <circle
              cx={xScale(N - 1)}
              cy={yScale(finalUnits)}
              r={3}
              fill="#22c55e"
            />
          </>
        )}

        {/* X-axis label */}
        <text
          x={PAD_L + PLOT_W / 2}
          y={H - 10}
          textAnchor="middle"
          fill="#999"
          fontSize="10"
          letterSpacing="1"
          fontFamily="Inter, system-ui, sans-serif"
        >
          BET # (CHRONOLOGICAL)
        </text>

        {/* Y-axis label */}
        <text
          x={14}
          y={PAD_T + PLOT_H / 2}
          textAnchor="middle"
          fill="#999"
          fontSize="10"
          letterSpacing="1"
          fontFamily="Inter, system-ui, sans-serif"
          transform={`rotate(-90, 14, ${PAD_T + PLOT_H / 2})`}
        >
          CUMULATIVE UNITS
        </text>
      </svg>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#262626]">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            Peak
          </div>
          <div className="text-sm font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e]">
            +{peakUnits.toFixed(2)}u
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            Trough
          </div>
          <div
            className={`text-sm font-bold font-['JetBrains_Mono','SF_Mono',monospace] ${
              troughUnits < 0 ? 'text-[#ef4444]' : 'text-[#d4d4d4]'
            }`}
          >
            {troughUnits > 0 ? '+' : ''}{troughUnits.toFixed(2)}u
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            Bets
          </div>
          <div className="text-sm font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#f5f5f5]">
            {N}
          </div>
        </div>
      </div>
    </div>
  );
}
