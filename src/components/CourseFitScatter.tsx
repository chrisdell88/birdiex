/**
 * CourseFitScatter — 1D diagonal arrangement of the model's top picks at
 * the current venue.
 *
 * Each head is positioned along a single diagonal line, sorted left-to-
 * right by X Score (the combined model output: skill + course history +
 * course fit + major adjustment). The diagonal layout makes the ranking
 * visually crisp at a glance — most-bullish picks at the top-right,
 * fading toward the bottom-left.
 *
 * Collision avoidance pushes overlapping heads PERPENDICULAR to the
 * diagonal so the natural left-to-right ordering stays intact.
 *
 * Pre-R1: no signal-based ring colouring (signals aren't meaningful
 * yet). Hover tooltip shows name + X Score + DataGolf "To Win" odds.
 * Post-R1: ring colour optionally reflects BUY/FADE signal.
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

  const points: Point[] = useMemo(() => {
    // Top-N by X Score (descending). Sort RETURNS highest first for the
    // ladder; we'll lay them out so the highest sits at the top-right.
    const sorted = [...currentEvent.rankingsRound]
      .filter((p) => p.x_score != null)
      .sort((a, b) => b.x_score - a.x_score)
      .slice(0, topN);

    if (sorted.length === 0) return [];

    const xs = sorted.map((p) => p.x_score);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const range = Math.max(0.01, maxX - minX);

    // Diagonal spans from (PAD_X, H - PAD_Y) [low X Score, bottom-left] to
    // (W - PAD_X, PAD_Y) [high X Score, top-right].
    const startX = PAD_X;
    const startY = H - PAD_Y;
    const endX = W - PAD_X;
    const endY = PAD_Y;

    const raw: Point[] = sorted.map((p) => {
      const t = (p.x_score - minX) / range;
      const cx = startX + t * (endX - startX);
      const cy = startY + t * (endY - startY);
      return { player: p, cx, cy, size: HEAD_SIZE, t };
    });

    // Collision avoidance — push overlapping heads PERPENDICULAR to the
    // diagonal so the left-to-right ordering by X Score stays intact.
    // Diagonal direction: (endX - startX, endY - startY), normalized.
    const dx0 = endX - startX;
    const dy0 = endY - startY;
    const len = Math.sqrt(dx0 * dx0 + dy0 * dy0);
    // Perpendicular unit vector (rotated 90° from diagonal direction).
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
            // Push the LATER (lower-X-Score) head one way along perp,
            // the EARLIER head the other way. Index order matches rank.
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
    return raw;
  }, [topN]);

  const renderPoints = useMemo(() => {
    if (!hovered) return points;
    return [...points].sort((a, b) =>
      a.player.player_name === hovered ? 1 : b.player.player_name === hovered ? -1 : 0,
    );
  }, [points, hovered]);

  const minX = points.length ? points[points.length - 1].player.x_score : 0;
  const maxX = points.length ? points[0].player.x_score : 0;

  return (
    <div className="bg-[#0a0a0a] border border-[#22c55e]/30 rounded-xl p-5">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Model Favorites &mdash; {currentEvent.course}
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Top {points.length} players by X Score, laid out along the diagonal.
            Bottom-left = lowest X Score in the top {points.length}; top-right =
            model&rsquo;s strongest pick. Hover any player for the breakdown.
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

        {/* The diagonal line itself — visual guide */}
        <line
          x1={PAD_X}
          y1={H - PAD_Y}
          x2={W - PAD_X}
          y2={PAD_Y}
          stroke="url(#diagGradient)"
          strokeWidth={2}
          strokeDasharray="6 6"
          opacity={0.6}
        />

        {/* Diagonal axis label — runs along the line */}
        <text
          x={W / 2}
          y={H / 2 - 20}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="11"
          letterSpacing="2"
          fontFamily="Inter, system-ui, sans-serif"
          transform={`rotate(${(Math.atan2(PAD_Y - (H - PAD_Y), (W - PAD_X) - PAD_X) * 180) / Math.PI}, ${W / 2}, ${H / 2 - 20})`}
        >
          X SCORE →
        </text>

        {/* End labels: min/max X Score values */}
        <text
          x={PAD_X - 8}
          y={H - PAD_Y + 18}
          textAnchor="end"
          fill="#737373"
          fontSize="10"
          fontFamily="JetBrains Mono, SF Mono, monospace"
        >
          {minX.toFixed(2)}
        </text>
        <text
          x={PAD_X - 8}
          y={H - PAD_Y + 32}
          textAnchor="end"
          fill="#737373"
          fontSize="9"
          letterSpacing="1"
          fontFamily="Inter, system-ui, sans-serif"
        >
          LOW
        </text>
        <text
          x={W - PAD_X + 8}
          y={PAD_Y - 8}
          fill="#22c55e"
          fontSize="10"
          fontFamily="JetBrains Mono, SF Mono, monospace"
        >
          {maxX.toFixed(2)}
        </text>
        <text
          x={W - PAD_X + 8}
          y={PAD_Y + 6}
          fill="#22c55e"
          fontSize="9"
          letterSpacing="1"
          fontFamily="Inter, system-ui, sans-serif"
        >
          HIGH
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
        X Score combines DataGolf skill + course history + course fit
        {currentEvent.isMajor ? ' + major-championship adjustment' : ''} into a
        single number that ranks the field. Heads near the top-right are the
        model&rsquo;s strongest picks at {currentEvent.course}. Heads close
        together along the diagonal have similar X Scores; the perpendicular
        offset just keeps them from overlapping visually.
      </p>
    </div>
  );
}
