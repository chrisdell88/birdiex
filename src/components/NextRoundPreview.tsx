/**
 * NextRoundPreview — shows the next round's H2H matchups + best odds across
 * sportsbooks. Renders ABOVE the current-round matchups when sportsbooks
 * post the next round early (e.g. R4 lines while R3 is in play/suspended).
 *
 * No X-Score / edge / Best Bet flag — those require the previous round to
 * be fully complete (clean cumulative SG data). When R3 completes, the
 * rankings file refreshes and the picks for R4 become actionable; this
 * preview is just the public sportsbook information so users can see
 * what's available right now.
 */
import { useMemo, useState } from 'react';
import type { MatchupOddsEntry } from '../types';
import { formatPlayerName } from '../lib/formatName';

interface Props {
  roundNumber: number;
  matchups: MatchupOddsEntry[];
}

/** Parse American odds → stake to win 1 unit (lower = more favorable). */
function stakeToWin1(odds: string | undefined): number {
  if (!odds) return Infinity;
  const n = parseInt(odds, 10);
  if (!Number.isFinite(n) || n === 0) return Infinity;
  return n < 0 ? Math.abs(n) / 100 : 100 / n;
}

/** Find the best (lowest stake-to-win-1) book + odds for each side. */
function bestForSide(odds: Record<string, { p1?: string; p2?: string }>, side: 'p1' | 'p2') {
  let bestBook = '';
  let bestOdds = '';
  let bestStake = Infinity;
  for (const [book, line] of Object.entries(odds)) {
    if (book === 'datagolf') continue; // model's own odds, not a real book
    const o = line[side];
    if (!o) continue;
    const s = stakeToWin1(o);
    if (s < bestStake) {
      bestStake = s;
      bestBook = book;
      bestOdds = o;
    }
  }
  return { book: bestBook, odds: bestOdds };
}

export default function NextRoundPreview({ roundNumber, matchups }: Props) {
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    return matchups.map((m) => ({
      p1: m.p1_player_name,
      p2: m.p2_player_name,
      p1Best: bestForSide(m.odds, 'p1'),
      p2Best: bestForSide(m.odds, 'p2'),
    })).sort((a, b) => a.p1.localeCompare(b.p1));
  }, [matchups]);

  if (matchups.length === 0) return null;

  const visible = showAll ? rows : rows.slice(0, 8);

  return (
    <div className="bg-[#0a0a0a] border border-[#22c55e]/30 rounded-lg p-5 mb-6">
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className="bg-[#22c55e]/15 text-[#22c55e] text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-['Inter',system-ui,sans-serif]">
          Round {roundNumber} · Preview
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          {matchups.length} matchup{matchups.length === 1 ? '' : 's'} posted by books
        </span>
      </div>
      <p className="text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mb-4 leading-relaxed">
        Sportsbooks have posted R{roundNumber} lines while the current round is still in play.
        Edges + Best Bet flags will appear once R{roundNumber - 1} completes and the model
        finalizes the cumulative X-Scores.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#262626] text-[10px] uppercase tracking-wider text-[#737373] font-['Inter',system-ui,sans-serif]">
              <th className="text-left py-2 pr-3">P1</th>
              <th className="text-right py-2 pr-3">Best Odds</th>
              <th className="text-left py-2 pr-3 text-[#737373]">vs</th>
              <th className="text-left py-2 pr-3">P2</th>
              <th className="text-right py-2">Best Odds</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className="border-b border-[#1a1a1a]">
                <td className="py-2 pr-3 text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                  {formatPlayerName(r.p1)}
                </td>
                <td className="py-2 pr-3 text-right font-['JetBrains_Mono','SF_Mono',monospace] text-xs">
                  <span className="text-[#22c55e]">{r.p1Best.odds || '—'}</span>
                  {r.p1Best.book && <span className="text-[#737373] ml-1">({r.p1Best.book})</span>}
                </td>
                <td className="py-2 pr-3 text-[#737373] text-xs">vs</td>
                <td className="py-2 pr-3 text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                  {formatPlayerName(r.p2)}
                </td>
                <td className="py-2 text-right font-['JetBrains_Mono','SF_Mono',monospace] text-xs">
                  <span className="text-[#22c55e]">{r.p2Best.odds || '—'}</span>
                  {r.p2Best.book && <span className="text-[#737373] ml-1">({r.p2Best.book})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 8 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-[11px] text-[#22c55e] hover:text-[#4ade80] font-medium cursor-pointer underline underline-offset-2 font-['Inter',system-ui,sans-serif]"
        >
          {showAll ? 'Show fewer' : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}
