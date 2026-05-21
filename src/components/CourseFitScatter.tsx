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

// All heads render at the same size so users don't read "bigger = something."
// Signal strength is communicated by ring color + thickness instead.
const HEAD_SIZE = 44;
const HEAD_RADIUS = HEAD_SIZE / 2;

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
  /** Signal-strength magnitude 0-1 (drives ring thickness + glow). */
  strength: number;
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

  // Outrights lookup so the hover tooltip can show "TO WIN: +150 fanduel"
  // alongside the X Score + signal.
  const outrightsByName = useMemo(() => {
    const m = new Map<string, { bestOdds: string; bestBook: string }>();
    for (const o of currentEvent.outrights) {
      m.set(o.player_name, { bestOdds: o.bestOdds, bestBook: o.bestBook });
    }
    return m;
  }, []);

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

    // Compute max |x_score| ONCE before the map (not per-row).
    const xRange = Math.max(0.01, ...sorted.map((q) => Math.abs(q.x_score)));

    // Pass 1: compute true data positions. All heads render at the SAME
    // size — signal strength is shown via ring thickness + glow, not size.
    const raw = sorted.map((p) => {
      const cx = PAD + ((p.course_history_l2 - X_LO) / (X_HI - X_LO)) * PLOT_W;
      const cy = PAD + PLOT_H - ((p.fit_plus_category_l3 - Y_LO) / (Y_HI - Y_LO)) * PLOT_H;
      const strength = Math.min(1, Math.abs(p.x_score) / xRange);
      const isBuy = p.signal?.includes('BUY') ?? false;
      const isFade = p.signal?.includes('FADE') || p.signal?.includes('SELL') || false;
      return { player: p, cx, cy, size: HEAD_SIZE, strength, isBuy, isFade };
    });

    // Pass 2: iterative collision avoidance. For each overlapping pair,
    // push them apart along the connecting vector by half the overlap
    // each iteration. Heads end up near (but not exactly on) their true
    // data position — no more stacking.
    const PADDING = 4; // extra px between heads
    for (let iter = 0; iter < 80; iter++) {
      let moved = false;
      for (let i = 0; i < raw.length; i++) {
        for (let j = i + 1; j < raw.length; j++) {
          const a = raw[i];
          const b = raw[j];
          const dx = b.cx - a.cx;
          const dy = b.cy - a.cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
          const minDist = a.size / 2 + b.size / 2 + PADDING;
          if (dist < minDist) {
            const push = (minDist - dist) / 2;
            const ux = dx / dist;
            const uy = dy / dist;
            a.cx -= ux * push;
            a.cy -= uy * push;
            b.cx += ux * push;
            b.cy += uy * push;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }

    // Pass 3: clamp inside the plot area so collision nudges can't push
    // a head off the chart edge.
    for (const r of raw) {
      const half = r.size / 2;
      r.cx = Math.max(PAD + half, Math.min(PAD + PLOT_W - half, r.cx));
      r.cy = Math.max(PAD + half, Math.min(PAD + PLOT_H - half, r.cy));
    }

    return raw;
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
            Top {points.length} players by X-Score signal. Course history on the x-axis,
            course fit on the y-axis. Ring color = signal direction (green BUY, red FADE,
            gray NEUTRAL). Ring thickness = signal strength. Hover for details.
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
          COURSE HISTORY →
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
          COURSE FIT →
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
          const ringOpacity = isHovered ? 1 : p.isBuy || p.isFade ? 0.6 + p.strength * 0.4 : 0.45;
          // Ring thickness encodes signal strength: NEUTRAL gets 1.5, top-tier
          // signals get up to 4.5. The eye reads this as "this player matters
          // more" without conflating size with direction.
          const ringWidth = isHovered ? 3.5 : 1.5 + p.strength * 3;
          const clipId = `clip-${p.player.player_name.replace(/[^a-z0-9]/gi, '_')}`;
          const r = p.size / 2;
          const renderSize = isHovered ? r * 1.25 : r;

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
                strokeWidth={ringWidth}
                style={{ transition: 'all 200ms ease' }}
              />
            </g>
          );
        })}

        {/* Hover tooltip — rendered LAST so it sits above all heads. Uses
            foreignObject + HTML for proper text wrapping. Position is
            below the head by default, above if there isn't room. */}
        {(() => {
          if (!hovered) return null;
          const p = points.find((q) => q.player.player_name === hovered);
          if (!p) return null;
          const outright = outrightsByName.get(p.player.player_name);
          const TT_W = 200;
          const TT_H = 76;
          // Position: below by default, above if there's not enough room
          const wantBelow = p.cy + HEAD_RADIUS + 14 + TT_H < PAD + PLOT_H;
          const tx = Math.max(
            PAD + 4,
            Math.min(PAD + PLOT_W - TT_W - 4, p.cx - TT_W / 2),
          );
          const ty = wantBelow
            ? p.cy + HEAD_RADIUS + 10
            : p.cy - HEAD_RADIUS - 10 - TT_H;
          return (
            <foreignObject x={tx} y={ty} width={TT_W} height={TT_H} style={{ pointerEvents: 'none' }}>
              <div
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                className="bg-[#0a0a0a] border border-[#22c55e]/60 rounded-md px-3 py-2 shadow-lg shadow-black/40"
              >
                <div className="text-[12px] font-semibold text-[#f5f5f5] leading-tight">
                  {p.player.player_name}
                </div>
                <div className="text-[10px] text-[#22c55e] font-mono mt-1 leading-snug">
                  X SCORE:{' '}
                  <span className="text-[#f5f5f5]">
                    {p.player.x_score > 0 ? '+' : ''}
                    {p.player.x_score.toFixed(3)}
                  </span>
                  <span className="opacity-50 mx-1">·</span>
                  {p.player.signal}
                </div>
                <div className="text-[10px] text-[#22c55e] font-mono mt-0.5 leading-snug">
                  TO WIN:{' '}
                  {outright ? (
                    <>
                      <span className="text-[#f5f5f5]">{outright.bestOdds}</span>
                      <span className="opacity-50 mx-1">·</span>
                      <span className="opacity-80">{outright.bestBook}</span>
                    </>
                  ) : (
                    <span className="text-[#737373]">—</span>
                  )}
                </div>
              </div>
            </foreignObject>
          );
        })()}
      </svg>

      <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed mt-3">
        Players in the upper-right quadrant fit the course best AND have the strongest history.
        Lower-left is the opposite. The X Score blends both (plus live SG once R1 begins) into
        a single number &mdash; what you see on the rankings table. Thicker ring = stronger
        directional signal from the model.
      </p>
    </div>
  );
}
