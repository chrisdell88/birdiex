/**
 * CourseFitScatter — 2D scatter of the model's top picks at the current
 * venue, with a visible diagonal trend line.
 *
 * X axis: Course History (L2 adjustment — how this player has performed
 *   at this venue in the past)
 * Y axis: Course Fit (L3 adjustment — how this player's skill set
 *   matches what the course demands)
 *
 * Heads at their actual (history, fit) data positions. A diagonal
 * reference line runs from the WEAK quadrant (bottom-left: low history,
 * low fit) to the STRONG quadrant (top-right). Players hugging that
 * diagonal are the model's strongest picks; the further into the
 * top-right they sit, the higher their X Score.
 *
 * Collision avoidance pushes overlapping heads PERPENDICULAR to the
 * diagonal so close-together players don't stack.
 *
 * Pre-R1: no signal-based ring colouring (signals aren't meaningful
 * yet). Hover tooltip shows name + X Score + DataGolf "To Win" odds.
 */
import { useMemo, useState } from 'react';
import type { PlayerData } from '../types';
import { currentEvent } from '../config/event';
import { headshots } from '../data/headshots';

const HEAD_SIZE = 44;
const HEAD_RADIUS = HEAD_SIZE / 2;

interface Props {
  topN?: number;
  onPlayerClick?: (player: PlayerData) => void;
}

interface Point {
  player: PlayerData;
  cx: number;
  cy: number;
  size: number;
  /** 0–1 normalized position on the diagonal (for tooltip placement). */
  t: number;
}

// SVG layout — wide canvas so the diagonal has room to breathe.
const W = 900;
const H = 480;
const PAD_X = 80;
const PAD_Y = 60;

function getInitials(name: string): string {
  const parts = name.split(',').map((s) => s.trim());
  if (parts.length >= 2) {
    const first = parts[1] ?? '';
    const last = parts[0] ?? '';
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function CourseFitScatter({ topN = 20, onPlayerClick }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const isPreTournament = currentEvent.picksRound <= 1;

  // Outrights lookup — DataGolf modeled odds for apples-to-apples comparison.
  const outrightsByName = useMemo(() => {
    const m = new Map<string, { odds: string }>();
    for (const o of currentEvent.outrights) {
      if (o.dgOdds) m.set(o.player_name, { odds: o.dgOdds });
    }
    return m;
  }, []);

  const { points, ranges } = useMemo(() => {
    // Top-N by X Score (descending). Filter to positive X Score so we
    // surface model favorites only.
    const sorted = [...currentEvent.preTournamentRankings]
      .filter((p) => p.x_score != null)
      .sort((a, b) => b.x_score - a.x_score)
      .slice(0, topN);

    if (sorted.length === 0) {
      return { points: [] as Point[], ranges: { xLo: 0, xHi: 0, yLo: 0, yHi: 0 } };
    }

    // Compute data ranges for x = course history, y = course fit, with
    // some padding so the heads sit comfortably inside the plot area.
    const xs = sorted.map((p) => p.course_history_l2);
    const ys = sorted.map((p) => p.fit_plus_category_l3);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xPad = Math.max(0.02, (xMax - xMin) * 0.20);
    const yPad = Math.max(0.02, (yMax - yMin) * 0.20);
    const xLo = xMin - xPad, xHi = xMax + xPad;
    const yLo = yMin - yPad, yHi = yMax + yPad;

    // Map each player to their (history, fit) plot position.
    const plotLeft = PAD_X;
    const plotTop = PAD_Y;
    const plotW = W - 2 * PAD_X;
    const plotH = H - 2 * PAD_Y;

    const raw: Point[] = sorted.map((p) => {
      const cx = plotLeft + ((p.course_history_l2 - xLo) / (xHi - xLo)) * plotW;
      // Y inverted because SVG y grows downward but we want positive fit
      // at the TOP.
      const cy = plotTop + plotH - ((p.fit_plus_category_l3 - yLo) / (yHi - yLo)) * plotH;
      return { player: p, cx, cy, size: HEAD_SIZE, t: 0 };
    });

    // Collision avoidance — push overlapping heads PERPENDICULAR to the
    // diagonal trend line so close-together players don't stack on top of
    // each other. The diagonal runs from bottom-left → top-right.
    const dx0 = plotW;
    const dy0 = -plotH;
    const len = Math.sqrt(dx0 * dx0 + dy0 * dy0);
    const perpX = -dy0 / len;
    const perpY = dx0 / len;
    const PADDING = 4;

    for (let iter = 0; iter < 80; iter++) {
      let moved = false;
      for (let i = 0; i < raw.length; i++) {
        for (let j = i + 1; j < raw.length; j++) {
          const a = raw[i];
          const b = raw[j];
          const dx = b.cx - a.cx;
          const dy = b.cy - a.cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
          const minDist = HEAD_SIZE + PADDING;
          if (dist < minDist) {
            const push = (minDist - dist) / 2;
            a.cx -= perpX * push;
            a.cy -= perpY * push;
            b.cx += perpX * push;
            b.cy += perpY * push;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }

    // Clamp inside the SVG bounds.
    for (const r of raw) {
      const half = r.size / 2;
      r.cx = Math.max(half + 4, Math.min(W - half - 4, r.cx));
      r.cy = Math.max(half + 4, Math.min(H - half - 4, r.cy));
    }
    return { points: raw, ranges: { xLo, xHi, yLo, yHi } };
  }, [topN]);

  // Suppress unused-var warning for the destructured ranges.
  void ranges;

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
            Pre-Tournament Model Favorites &mdash; {currentEvent.course}
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Top {points.length} pre-tournament picks. Course history on the
            x-axis, course fit on the y-axis. Upper-right corner = strongest
            BirdieX picks heading into the week. <span className="text-[#22c55e]">This chart is a
            pre-tournament snapshot &mdash; it does not update round-to-round.</span>
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          Pre-Tournament
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label={`Diagonal arrangement of top ${points.length} players sorted by X Score`}
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

          {/* Diagonal gradient: faint green at top-right (strong) → gray at bottom-left (weak) */}
          <linearGradient id="diagGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#525252" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#22c55e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.9" />
          </linearGradient>

          {/* Clip paths for circular headshots */}
          {renderPoints.map((p) => (
            <clipPath key={`clip-${p.player.player_name}`} id={`clip-${p.player.player_name.replace(/[^a-z0-9]/gi, '_')}`}>
              <circle cx={p.cx} cy={p.cy} r={p.size / 2} />
            </clipPath>
          ))}
        </defs>

        {/* Plot area outline */}
        <rect
          x={PAD_X}
          y={PAD_Y}
          width={W - 2 * PAD_X}
          height={H - 2 * PAD_Y}
          fill="#0a0a0a"
          stroke="#262626"
          strokeWidth={1}
          rx={4}
        />

        {/* Quadrant guides (zero axes — assuming our pad-extended ranges
            include zero on both axes for typical data) */}
        <line
          x1={PAD_X + (W - 2 * PAD_X) / 2}
          x2={PAD_X + (W - 2 * PAD_X) / 2}
          y1={PAD_Y}
          y2={H - PAD_Y}
          stroke="#22c55e"
          strokeOpacity={0.08}
          strokeWidth={1}
          strokeDasharray="3 5"
        />
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={PAD_Y + (H - 2 * PAD_Y) / 2}
          y2={PAD_Y + (H - 2 * PAD_Y) / 2}
          stroke="#22c55e"
          strokeOpacity={0.08}
          strokeWidth={1}
          strokeDasharray="3 5"
        />

        {/* Diagonal trend line — visual guide showing the regression of
            "good history + good fit → model favorite" */}
        <line
          x1={PAD_X}
          y1={H - PAD_Y}
          x2={W - PAD_X}
          y2={PAD_Y}
          stroke="url(#diagGradient)"
          strokeWidth={2}
          strokeDasharray="6 6"
          opacity={0.7}
        />

        {/* X axis label — Course History */}
        <text
          x={W / 2}
          y={H - 20}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="11"
          letterSpacing="1.5"
          fontFamily="Inter, system-ui, sans-serif"
        >
          COURSE HISTORY →
        </text>

        {/* Y axis label — Course Fit (rotated) */}
        <text
          x={22}
          y={H / 2}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="11"
          letterSpacing="1.5"
          fontFamily="Inter, system-ui, sans-serif"
          transform={`rotate(-90, 22, ${H / 2})`}
        >
          COURSE FIT →
        </text>

        {/* Quadrant labels */}
        <text x={W - PAD_X - 10} y={PAD_Y + 16} textAnchor="end" fill="#22c55e" fillOpacity={0.55} fontSize="10" letterSpacing="0.8" fontFamily="Inter, system-ui, sans-serif">
          STRONG HISTORY · STRONG FIT
        </text>
        <text x={PAD_X + 10} y={PAD_Y + 16} fill="#22c55e" fillOpacity={0.35} fontSize="10" letterSpacing="0.8" fontFamily="Inter, system-ui, sans-serif">
          WEAK HISTORY · STRONG FIT
        </text>
        <text x={W - PAD_X - 10} y={H - PAD_Y - 8} textAnchor="end" fill="#737373" fontSize="10" letterSpacing="0.8" fontFamily="Inter, system-ui, sans-serif">
          STRONG HISTORY · WEAK FIT
        </text>
        <text x={PAD_X + 10} y={H - PAD_Y - 8} fill="#737373" fontSize="10" letterSpacing="0.8" fontFamily="Inter, system-ui, sans-serif">
          WEAK HISTORY · WEAK FIT
        </text>

        {/* Heads */}
        {renderPoints.map((p) => {
          const isHovered = hovered === p.player.player_name;
          const url = headshots[p.player.player_name];
          // Pre-R1: neutral green ring for everyone (signal not meaningful yet).
          // Post-R1: ring colour from signal (kept simple here — full direction
          // mapping can be revisited when signal naming is finalized).
          const ringColor = isHovered ? '#22c55e' : '#22c55e';
          const ringOpacity = isHovered ? 1 : 0.6;
          const ringWidth = isHovered ? 3.5 : 2;
          const clipId = `clip-${p.player.player_name.replace(/[^a-z0-9]/gi, '_')}`;
          const r = p.size / 2;
          const renderSize = isHovered ? r * 1.2 : r;
          void isPreTournament; // pre-R1 / post-R1 styling unified for now

          return (
            <g
              key={p.player.player_name}
              onMouseEnter={() => setHovered(p.player.player_name)}
              onMouseLeave={() => setHovered((h) => (h === p.player.player_name ? null : h))}
              onClick={() => onPlayerClick?.(p.player)}
              style={{ cursor: onPlayerClick ? 'pointer' : 'default', transition: 'all 200ms ease' }}
            >
              {/* Glow on hover */}
              {isHovered && (
                <circle cx={p.cx} cy={p.cy} r={renderSize + 4} fill="#22c55e" fillOpacity={0.15} filter="url(#cfsGlow)" />
              )}

              {/* Headshot or initials disc */}
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

        {/* Hover tooltip — foreignObject HTML for proper text wrap */}
        {(() => {
          if (!hovered) return null;
          const p = points.find((q) => q.player.player_name === hovered);
          if (!p) return null;
          const outright = outrightsByName.get(p.player.player_name);
          const TT_W = 200;
          const TT_H = 64;
          // Position: prefer ABOVE the head; flip below if near the top edge.
          const wantAbove = p.cy - HEAD_RADIUS - 10 - TT_H > 4;
          const tx = Math.max(4, Math.min(W - TT_W - 4, p.cx - TT_W / 2));
          const ty = wantAbove ? p.cy - HEAD_RADIUS - 10 - TT_H : p.cy + HEAD_RADIUS + 10;
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
                </div>
                <div className="text-[10px] text-[#22c55e] font-mono mt-0.5 leading-snug">
                  TO WIN:{' '}
                  {outright ? (
                    <>
                      <span className="text-[#f5f5f5]">{outright.odds}</span>
                      <span className="opacity-50 mx-1">·</span>
                      <span className="opacity-80">datagolf</span>
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
        BirdieX RTG combines DataGolf skill + course history + course fit
        {currentEvent.isMajor ? ' + major-championship adjustment' : ''} into a
        single pre-tournament rating. Heads near the upper-right hit both
        venue-fit and historical-performance buckets &mdash; the model&rsquo;s
        strongest picks at {currentEvent.course}. Once R1 finishes, the live
        X Score takes over.
      </p>
    </div>
  );
}
