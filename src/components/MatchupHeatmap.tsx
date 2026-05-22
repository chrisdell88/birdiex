/**
 * MatchupHeatmap — strip chart of every live matchup for the current
 * event, sorted by edge. Each cell is one matchup colored by edge
 * intensity. Spot high-edge clusters at a glance, see how many cross
 * the venue threshold.
 *
 * Lives on the Matchups page above the matchup cards. Pre-tournament
 * with L1=0, the strip is mostly empty (correctly so).
 */
import type { PlayerData, MatchupOddsEntry } from '../types';
import { currentEvent } from '../config/event';
import { starsForEdge } from '../lib/sizing';

// Compute one row per H2H matchup: edge, pick, opponent.
interface MatchupRow {
  edge: number;
  pick: string;
  opp: string;
  isTracked: boolean;
}

function buildRows(players: PlayerData[], odds: MatchupOddsEntry[]): MatchupRow[] {
  const playerMap = new Map(players.map((p) => [p.player_name, p]));
  const rows: MatchupRow[] = [];
  for (const entry of odds) {
    const p1 = playerMap.get(entry.p1_player_name);
    const p2 = playerMap.get(entry.p2_player_name);
    if (!p1 || !p2) continue;
    const pick = p1.x_score >= p2.x_score ? p1 : p2;
    const opp = pick === p1 ? p2 : p1;
    const edge = +(pick.x_score - opp.x_score).toFixed(4);
    if (edge < 0.95) continue; // below model pick floor
    rows.push({
      edge,
      pick: pick.player_name,
      opp: opp.player_name,
      isTracked: edge >= currentEvent.recommendedFloor,
    });
  }
  return rows.sort((a, b) => b.edge - a.edge);
}

const rows = buildRows(currentEvent.rankingsRound, currentEvent.matchups);
const trackedCount = rows.filter((r) => r.isTracked).length;
const MAX_EDGE = rows.length ? Math.max(...rows.map((r) => r.edge)) : 1;

// Heatmap layout — a grid of squares. Each square is one matchup.
// Aim for ~12 columns; adjust rows based on count.
const CELL_SIZE = 26;
const CELL_GAP = 3;
const COLS = 16;
const ROWS_COUNT = Math.ceil(rows.length / COLS) || 1;
const PAD = 24;
const W = PAD * 2 + COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
const H = PAD * 2 + ROWS_COUNT * (CELL_SIZE + CELL_GAP) - CELL_GAP + 40;

export default function MatchupHeatmap() {
  if (!rows.length) {
    return (
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 mb-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] mb-2">
            No live matchups above the model floor yet
          </div>
          <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
            Pre-tournament X Scores are intentionally small until Round 1 completes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 mb-6">
      <div className="flex items-end justify-between mb-3 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Matchup Heatmap &mdash; {currentEvent.course}
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            One cell per live H2H matchup, sorted by edge. Darker green = higher edge.
            Cells with the green ring clear the Best Bet Matchup Score Threshold
            (≥ {currentEvent.recommendedFloor.toFixed(2)}).
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-[#22c55e] font-['Inter',system-ui,sans-serif]">
            Best Bets / Total
          </div>
          <div className="text-lg font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e]">
            {trackedCount} / {rows.length}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Heatmap of ${rows.length} live matchups`}>
        {rows.map((r, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = PAD + col * (CELL_SIZE + CELL_GAP);
          const y = PAD + row * (CELL_SIZE + CELL_GAP);
          const intensity = 0.2 + (r.edge / MAX_EDGE) * 0.7;
          const stars = starsForEdge(r.edge);

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={3}
                fill="#22c55e"
                fillOpacity={intensity}
                stroke={r.isTracked ? '#22c55e' : 'transparent'}
                strokeWidth={r.isTracked ? 1.5 : 0}
              >
                <title>
                  {r.pick} over {r.opp} · edge {r.edge.toFixed(2)} · {stars}★{r.isTracked ? ' · TRACKED' : ''}
                </title>
              </rect>
              {/* Star count micro-label for the top picks (top row only) */}
              {row === 0 && (
                <text
                  x={x + CELL_SIZE / 2}
                  y={y + CELL_SIZE / 2 + 4}
                  textAnchor="middle"
                  fill="#0a0a0a"
                  fontSize="10"
                  fontWeight={700}
                  fontFamily="JetBrains Mono, SF Mono, monospace"
                >
                  {stars}
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${PAD}, ${H - 30})`}>
          <text
            x={0}
            y={6}
            fill="#737373"
            fontSize="9"
            letterSpacing="1"
            fontFamily="Inter, system-ui, sans-serif"
          >
            EDGE: LOW
          </text>
          {[0.25, 0.45, 0.65, 0.85].map((op, i) => (
            <rect
              key={i}
              x={70 + i * 14}
              y={-2}
              width={12}
              height={12}
              rx={2}
              fill="#22c55e"
              fillOpacity={op}
            />
          ))}
          <text
            x={70 + 4 * 14 + 6}
            y={6}
            fill="#737373"
            fontSize="9"
            letterSpacing="1"
            fontFamily="Inter, system-ui, sans-serif"
          >
            HIGH
          </text>
          <rect
            x={170}
            y={-2}
            width={12}
            height={12}
            rx={2}
            fill="#22c55e"
            fillOpacity={0.5}
            stroke="#22c55e"
            strokeWidth={1.5}
          />
          <text
            x={186}
            y={6}
            fill="#737373"
            fontSize="9"
            letterSpacing="1"
            fontFamily="Inter, system-ui, sans-serif"
          >
            RINGED = TRACKED (≥ {currentEvent.recommendedFloor.toFixed(2)})
          </text>
        </g>
      </svg>

      <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed mt-3">
        Hover any cell for the pick / opponent / edge. Top row labeled with the star
        count. The ringed cells are Best Bets &mdash; matchups at or above the venue&rsquo;s
        Best Bet Matchup Score Threshold. Everything else is a below-threshold
        model pick scored internally for backtesting.
      </p>
    </div>
  );
}
