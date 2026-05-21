/**
 * CourseFitScatter — the marquee chart. Player HEADSHOTS as dots,
 * positioned by Course History (X) and Course Fit (Y) for the current
 * event. Hover lifts the head; click opens a detail card.
 *
 * Renders the top N players by |X Score| so the chart stays readable
 * even on 150-player fields. Players without a headshot fall back to
 * an initials avatar.
 *
 * Pure SVG + foreignObject for the headshot images. Animations are
 * driven by React state (hover/click) and CSS transitions.
 */
import { useMemo, useState } from 'react';
import type { PlayerData } from '../types';
import { currentEvent } from '../config/event';
import { headshots } from '../data/headshots';

interface Props {
  /** How many players (by |X Score|) to plot. Fewer = more breathing room. */
  topN?: number;
  /** Called when a head is clicked. Receives the player. */
  onPlayerClick?: (player: PlayerData) => void;
}

interface Point {
  player: PlayerData;
  cx: number;
  cy: number;
  size: number;
  isBuy: boolean;
  isFade: boolean;
}

// SVG layout — bigger plot area so heads have room to breathe.
const W = 900;
const H = 560;
const PAD = 70;
const PLOT_W = W - PAD * 2;
const PLOT_H = H - PAD * 2;

function getInitials(name: string): string {
  const parts = name.split(',').map((s) => s.trim());
  if (parts.length >= 2) {
    const first = parts[1] ?? '';
    const last = parts[0] ?? '';
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  }
  const words = name.trim().split(/\s+/);
  return words.slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
}

export default function CourseFitScatter({ topN = 20, onPlayerClick }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const points: Point[] = useMemo(() => {
    // Pick the top-N by |x_score| — most signal-relevant players.
    const sorted = [...currentEvent.rankingsRound]
      .filter((p) => p.x_score != null)
      .sort((a, b) => Math.abs(b.x_score) - Math.abs(a.x_score))
      .slice(0, topN);

    // Compute actual data range with padding so the chart zooms to the
    // real distribution instead of always showing ±0.5. "Staying true to
    // the data" — Chris.
    const xs = sorted.map((p) => p.course_history_l2);
    const ys = sorted.map((p) => p.fit_plus_category_l3);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    // 18% padding on each side so the largest heads sit inside the plot area.
    const xPad = Math.max(0.02, (xMax - xMin) * 0.18);
    const yPad = Math.max(0.02, (yMax - yMin) * 0.18);
    const X_LO = xMin - xPad, X_HI = xMax + xPad;
    const Y_LO = yMin - yPad, Y_HI = yMax + yPad;

    return sorted.map((p) => {
      const cx = PAD + ((p.course_history_l2 - X_LO) / (X_HI - X_LO)) * PLOT_W;
      const cy = PAD + PLOT_H - ((p.fit_plus_category_l3 - Y_LO) / (Y_HI - Y_LO)) * PLOT_H;

      // Headshot diameter scales with |x_score|. Range 34–56px so heads
      // remain visible and clickable on first glance.
      const xRange = Math.max(0.01, Math.max(...sorted.map((q) => Math.abs(q.x_score))));
      const strength = Math.min(1, Math.abs(p.x_score) / xRange);
      const size = 34 + strength * 22;

      const isBuy = p.signal?.includes('BUY') ?? false;
      const isFade = p.signal?.includes('FADE') || p.signal?.includes('SELL') || false;

      return { player: p, cx, cy, size, isBuy, isFade };
    });
  }, [topN]);

  // Sort points so hovered renders last (on top).
  const renderPoints = useMemo(() => {
    if (!hovered) return points;
    return [...points].sort((a, b) =>
      a.player.player_name === hovered ? 1 : b.player.player_name === hovered ? -1 : 0,
    );
  }, [points, hovered]);

  return (
    <div className="bg-[#0a0a0a] border border-[#22c55e]/30 rounded-xl p-5">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Course Fit &mdash; {currentEvent.course}
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Top {points.length} players by X Score signal. Course History on the x-axis,
            Course Fit on the y-axis. Bigger heads = stronger model signal. Hover any player.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          Live Field
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label={`Scatter plot of ${points.length} players by course history and course fit`}
      >
        <defs>
          {/* Glow filter for hovered headshot */}
          <filter id="cfsGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip path for circular headshots */}
          {renderPoints.map((p) => (
            <clipPath key={`clip-${p.player.player_name}`} id={`clip-${p.player.player_name.replace(/[^a-z0-9]/gi, '_')}`}>
              <circle cx={p.cx} cy={p.cy} r={p.size / 2} />
            </clipPath>
          ))}
        </defs>

        {/* Plot background */}
        <rect x={PAD} y={PAD} width={PLOT_W} height={PLOT_H} fill="#0a0a0a" stroke="#262626" strokeWidth={1} rx={4} />

        {/* Quadrant guides (zero axes) */}
        <line
          x1={PAD + PLOT_W / 2}
          x2={PAD + PLOT_W / 2}
          y1={PAD}
          y2={PAD + PLOT_H}
          stroke="#22c55e"
          strokeOpacity={0.15}
          strokeWidth={1}
          strokeDasharray="3 4"
        />
        <line
          x1={PAD}
          x2={PAD + PLOT_W}
          y1={PAD + PLOT_H / 2}
          y2={PAD + PLOT_H / 2}
          stroke="#22c55e"
          strokeOpacity={0.15}
          strokeWidth={1}
          strokeDasharray="3 4"
        />

        {/* Quadrant labels */}
        <text x={PAD + PLOT_W - 10} y={PAD + 16} textAnchor="end" fill="#22c55e" fillOpacity={0.5} fontSize="10" letterSpacing="0.8" fontFamily="Inter, system-ui, sans-serif">
          STRONG HISTORY · STRONG FIT
        </text>
        <text x={PAD + 10} y={PAD + 16} fill="#22c55e" fillOpacity={0.4} fontSize="10" letterSpacing="0.8" fontFamily="Inter, system-ui, sans-serif">
          WEAK HISTORY · STRONG FIT
        </text>
        <text x={PAD + PLOT_W - 10} y={PAD + PLOT_H - 8} textAnchor="end" fill="#737373" fontSize="10" letterSpacing="0.8" fontFamily="Inter, system-ui, sans-serif">
          STRONG HISTORY · WEAK FIT
        </text>
        <text x={PAD + 10} y={PAD + PLOT_H - 8} fill="#737373" fontSize="10" letterSpacing="0.8" fontFamily="Inter, system-ui, sans-serif">
          WEAK HISTORY · WEAK FIT
        </text>

        {/* Axis titles */}
        <text x={W / 2} y={H - 18} textAnchor="middle" fill="#a1a1aa" fontSize="11" letterSpacing="1.5" fontFamily="Inter, system-ui, sans-serif">
          COURSE HISTORY (L2) →
        </text>
        <text
          x={20}
          y={H / 2}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="11"
          letterSpacing="1.5"
          fontFamily="Inter, system-ui, sans-serif"
          transform={`rotate(-90, 20, ${H / 2})`}
        >
          COURSE FIT (L3) →
        </text>

        {/* Headshot dots */}
        {renderPoints.map((p) => {
          const isHovered = hovered === p.player.player_name;
          const url = headshots[p.player.player_name];
          const ringColor = isHovered
            ? '#22c55e'
            : p.isBuy
              ? '#22c55e'
              : p.isFade
                ? '#ef4444'
                : '#525252';
          const ringOpacity = isHovered ? 1 : p.isBuy || p.isFade ? 0.75 : 0.5;
          const clipId = `clip-${p.player.player_name.replace(/[^a-z0-9]/gi, '_')}`;
          const r = p.size / 2;
          const renderSize = isHovered ? r * 1.4 : r;

          return (
            <g
              key={p.player.player_name}
              onMouseEnter={() => setHovered(p.player.player_name)}
              onMouseLeave={() => setHovered((h) => (h === p.player.player_name ? null : h))}
              onClick={() => onPlayerClick?.(p.player)}
              style={{ cursor: onPlayerClick ? 'pointer' : 'default', transition: 'all 200ms ease' }}
            >
              {/* Glow ring on hover */}
              {isHovered && (
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={renderSize + 4}
                  fill="#22c55e"
                  fillOpacity={0.15}
                  filter="url(#cfsGlow)"
                />
              )}

              {/* The clipped headshot (or fallback initials disc) */}
              {url ? (
                <>
                  <circle cx={p.cx} cy={p.cy} r={renderSize} fill="#1a1a1a" />
                  <image
                    href={url}
                    x={p.cx - renderSize}
                    y={p.cy - renderSize}
                    width={renderSize * 2}
                    height={renderSize * 2}
                    clipPath={`url(#${clipId})`}
                    preserveAspectRatio="xMidYMin slice"
                    style={{ transition: 'all 200ms ease' }}
                  />
                </>
              ) : (
                <>
                  <circle cx={p.cx} cy={p.cy} r={renderSize} fill="#262626" />
                  <text
                    x={p.cx}
                    y={p.cy + 4}
                    textAnchor="middle"
                    fill="#f5f5f5"
                    fontSize={renderSize * 0.65}
                    fontWeight={700}
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {getInitials(p.player.player_name)}
                  </text>
                </>
              )}

              {/* Ring */}
              <circle
                cx={p.cx}
                cy={p.cy}
                r={renderSize}
                fill="none"
                stroke={ringColor}
                strokeOpacity={ringOpacity}
                strokeWidth={isHovered ? 3 : 2}
                style={{ transition: 'all 200ms ease' }}
              />

              {/* Player name on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={p.cx - 90}
                    y={p.cy + renderSize + 6}
                    width={180}
                    height={40}
                    rx={6}
                    fill="#0a0a0a"
                    stroke="#22c55e"
                    strokeOpacity={0.6}
                    strokeWidth={1.5}
                  />
                  <text
                    x={p.cx}
                    y={p.cy + renderSize + 22}
                    textAnchor="middle"
                    fill="#f5f5f5"
                    fontSize="12"
                    fontWeight={600}
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {p.player.player_name}
                  </text>
                  <text
                    x={p.cx}
                    y={p.cy + renderSize + 37}
                    textAnchor="middle"
                    fill="#22c55e"
                    fontSize="10"
                    fontFamily="JetBrains Mono, SF Mono, monospace"
                  >
                    X Score: {p.player.x_score > 0 ? '+' : ''}
                    {p.player.x_score.toFixed(3)} · {p.player.signal}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed mt-3">
        Players in the upper-right quadrant fit the course best AND have the strongest history.
        Lower-left is the opposite. The X Score blends these (plus live SG once R1 begins) into
        a single number &mdash; what you see on the rankings table. Green ring = BUY signal,
        red ring = FADE, gray = NEUTRAL.
      </p>
    </div>
  );
}
