/**
 * OutrightsTable — winner-odds comparison across all real sportsbooks.
 * Renders below the H2H section on the Odds page. Same look-and-feel as
 * the H2H table (sticky first column, hover row, best-odds highlight).
 *
 * Data: currentEvent.outrights (built from DataGolf's /betting-tools/outrights
 * win market for the current event). Sorted favorites-first by best odds.
 */
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

export default function OutrightsTable({ outrights }: Props) {
  if (!outrights.length) return null;

  // Use the top ~30 by best implied payout (skip super-long-shots) to keep
  // the table readable.
  const display = [...outrights]
    .sort((a, b) => oddsToPayout(a.bestOdds) - oddsToPayout(b.bestOdds))
    .slice(0, 30);

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
              <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap sticky left-0 bg-[#0a0a0a] z-10">
                Player
              </th>
              <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif] whitespace-nowrap">
                Best
              </th>
              {REAL_BOOKS.map((b) => (
                <th
                  key={b}
                  className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap"
                >
                  {b}
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
