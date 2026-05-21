/**
 * OutrightsTable — winner-odds comparison across all real sportsbooks.
 * Renders below the H2H section on the Odds page. Same look-and-feel as
 * the H2H table (sticky first column, hover row, best-odds highlight).
 *
 * Data: currentEvent.outrights (built from DataGolf's /betting-tools/outrights
 * win market for the current event). Sorted favorites-first by best odds.
 */
import { useState } from 'react';
import type { OutrightEntry } from '../types';

const REAL_BOOKS = [
  'bet365',
  'betmgm',
  'caesars',
  'draftkings',
  'fanduel',
  'pinnacle',
  'pointsbet',
  'betonline',
  'bovada',
  'unibet',
  'betcris',
] as const;

const sportsbookUrls: Record<string, string> = {
  bet365: 'https://www.bet365.com/#/AC/B18/C20604387/D48/E1/F2/',
  betmgm: 'https://sports.betmgm.com/en/sports/golf-9',
  betonline: 'https://www.betonline.ag/sportsbook/golf',
  bovada: 'https://www.bovada.lv/sports/golf',
  caesars: 'https://www.caesars.com/sportsbook-and-casino/golf',
  draftkings: 'https://sportsbook.draftkings.com/leagues/golf',
  fanduel: 'https://sportsbook.fanduel.com/golf',
  pinnacle: 'https://www.pinnacle.com/en/golf/',
  pointsbet: 'https://pointsbet.com/sports/golf',
  unibet: 'https://www.unibet.com/betting/sports/golf',
  betcris: 'https://www.betcris.com/en/sports/golf',
};

const mono = "font-['JetBrains_Mono','SF_Mono',monospace]";

function oddsToPayout(odds: string): number {
  const n = parseInt(odds, 10);
  if (!Number.isFinite(n) || n === 0) return -Infinity;
  return n < 0 ? 100 / Math.abs(n) : n / 100;
}

interface Props {
  outrights: OutrightEntry[];
}

type SortKey = 'player' | 'best' | typeof REAL_BOOKS[number];
type SortDir = 'asc' | 'desc';

export default function OutrightsTable({ outrights }: Props) {
  // Sortable table. Default = by best implied payout, ascending (favorites
  // first — shortest odds at top).
  const [sortKey, setSortKey] = useState<SortKey>('best');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  if (!outrights.length) return null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'player' ? 'asc' : 'asc');
    }
  };

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  // Sort, then slice to top 30 favorites by best (the most-common entry
  // point) so we don't drown the user in 147 longshots.
  const sorted = [...outrights].sort((a, b) => {
    let av: number | string;
    let bv: number | string;
    if (sortKey === 'player') {
      av = a.player_name;
      bv = b.player_name;
    } else if (sortKey === 'best') {
      av = oddsToPayout(a.bestOdds);
      bv = oddsToPayout(b.bestOdds);
    } else {
      av = oddsToPayout(a.allBooks[sortKey] ?? '0');
      bv = oddsToPayout(b.allBooks[sortKey] ?? '0');
    }
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });
  // Show the top 30 favorites in whatever sort is active.
  const display = sorted.slice(0, 30);

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden mb-8">
      <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
        <span className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
          Outright Winner Odds
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          Top {display.length} favorites &mdash; reference only, not a recommendation
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#262626]">
              <th
                onClick={() => handleSort('player')}
                className={`px-3 py-3 text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap sticky left-0 bg-[#0a0a0a] z-10 cursor-pointer hover:text-[#22c55e] transition-colors select-none ${
                  sortKey === 'player' ? 'text-[#22c55e]' : 'text-[#a1a1aa]'
                }`}
              >
                Player{sortArrow('player')}
              </th>
              <th
                onClick={() => handleSort('best')}
                className={`px-3 py-3 text-[10px] uppercase tracking-wider font-semibold font-['Inter',system-ui,sans-serif] whitespace-nowrap cursor-pointer hover:text-[#4ade80] transition-colors select-none ${
                  sortKey === 'best' ? 'text-[#4ade80]' : 'text-[#22c55e]'
                }`}
              >
                Best{sortArrow('best')}
              </th>
              {REAL_BOOKS.map((b) => (
                <th
                  key={b}
                  onClick={() => handleSort(b)}
                  className={`px-3 py-3 text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap cursor-pointer hover:text-[#22c55e] transition-colors select-none ${
                    sortKey === b ? 'text-[#22c55e]' : 'text-[#a1a1aa]'
                  }`}
                >
                  {b}{sortArrow(b)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((o, i) => (
              <tr
                key={o.dg_id}
                className={`border-t border-[#1a1a1a] hover:bg-[#141414] transition-colors ${
                  i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'
                }`}
              >
                <td
                  className={`px-3 py-2 text-xs text-[#f5f5f5] font-['Inter',system-ui,sans-serif] whitespace-nowrap sticky left-0 z-10 ${
                    i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'
                  }`}
                >
                  {o.player_name}
                </td>
                <td className={`px-3 py-2 text-xs ${mono} text-[#22c55e] font-bold whitespace-nowrap`}>
                  {o.bestOdds}{' '}
                  <span className="text-[10px] text-[#737373] font-normal">{o.bestBook}</span>
                </td>
                {REAL_BOOKS.map((b) => {
                  const v = o.allBooks[b];
                  const isBest = v === o.bestOdds && b === o.bestBook;
                  return (
                    <td
                      key={b}
                      className={`px-3 py-2 text-xs ${mono} whitespace-nowrap ${
                        isBest
                          ? 'text-[#22c55e] font-bold'
                          : v
                            ? 'text-[#d4d4d4]'
                            : 'text-[#525252]'
                      }`}
                    >
                      {v ? (
                        sportsbookUrls[b] ? (
                          <a
                            href={sportsbookUrls[b]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {v}
                          </a>
                        ) : (
                          v
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-[#262626] text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
        BirdieX doesn&rsquo;t recommend outrights &mdash; the model targets H2H matchups. This
        section is reference-only for scoping the field.
      </div>
    </div>
  );
}
