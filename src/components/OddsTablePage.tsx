import { useState, useMemo } from 'react';
import type { PlayerData, MatchupOddsEntry, DataSet } from '../types';
import { currentEvent } from '../config/event';
import { starsForEdge } from '../lib/sizing';
import DataSetToggle from './DataSetToggle';
import RecommendedFloorBadge from './RecommendedFloorBadge';
import OutrightsTable from './OutrightsTable';

interface OddsTablePageProps {
  data: PlayerData[];
  dataSet: DataSet;
  onDataSetChange: (ds: DataSet) => void;
}

type OddsSortField = 'edge' | 'pick' | 'opp' | 'tier' | 'bet365' | 'betmgm' | 'betonline' | 'bovada' | 'caesars' | 'draftkings' | 'fanduel' | 'pinnacle' | 'pointsbet' | 'unibet' | 'betcris' | 'best';
type SortDir = 'asc' | 'desc';

const sportsbookKeys = ['bet365', 'betmgm', 'betonline', 'bovada', 'caesars', 'draftkings', 'fanduel', 'pinnacle', 'pointsbet', 'unibet', 'betcris'] as const;

const sportsbookLabels: Record<string, string> = {
  bet365: 'bet365',
  betmgm: 'BetMGM',
  betonline: 'BetOnline',
  bovada: 'Bovada',
  caesars: 'Caesars',
  draftkings: 'DraftKings',
  fanduel: 'FanDuel',
  pinnacle: 'Pinnacle',
  pointsbet: 'PointsBet',
  unibet: 'Unibet',
  betcris: 'Betcris',
};

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

function parseOdds(odds: string): number {
  const n = parseInt(odds, 10);
  if (isNaN(n)) return -9999;
  return n;
}

function isBuySide(p: PlayerData): boolean {
  return ['STRONGEST BUY', 'STRONG BUY', 'BUY', 'LEAN BUY'].includes(p.signal);
}

interface H2HRow {
  pick: PlayerData;
  opponent: PlayerData;
  edge: number;
  tier: 'BEST BET' | 'STRONG PLAY' | 'LEAN';
  pickSignal: string;
  bookOdds: Record<string, string>; // key=sportsbook key, value=American odds string for our pick
  bestOdds: string;
  bestBook: string;
}

function buildH2HRows(data: PlayerData[], oddsData: MatchupOddsEntry[]): H2HRow[] {
  const playerMap = new Map<string, PlayerData>();
  data.forEach((p) => playerMap.set(p.player_name, p));

  const rows: H2HRow[] = [];

  for (const entry of oddsData) {
    const p1 = playerMap.get(entry.p1_player_name);
    const p2 = playerMap.get(entry.p2_player_name);
    if (!p1 || !p2) continue;

    const p1XScore = p1.x_score;
    const p2XScore = p2.x_score;

    const pick = p1XScore >= p2XScore ? p1 : p2;
    const opponent = pick === p1 ? p2 : p1;
    const pickIsP1 = pick === p1;
    const pickXScore = pickIsP1 ? p1XScore : p2XScore;
    const oppXScore = pickIsP1 ? p2XScore : p1XScore;

    const edge = +(pickXScore - oppXScore).toFixed(4);
    if (edge < 0.95) continue;

    let tier: H2HRow['tier'] = 'LEAN';
    if (edge >= 1.95) tier = 'BEST BET';
    else if (edge >= 1.45) tier = 'STRONG PLAY';

    const bookOdds: Record<string, string> = {};
    let bestOddsVal = -Infinity;
    let bestOdds = '';
    let bestBook = '';

    for (const [book, vals] of Object.entries(entry.odds)) {
      if (book === 'datagolf') continue;
      const pickOddsStr = pickIsP1 ? vals.p1 : vals.p2;
      bookOdds[book] = pickOddsStr;
      const oddsVal = parseOdds(pickOddsStr);
      if (oddsVal > bestOddsVal) {
        bestOddsVal = oddsVal;
        bestOdds = pickOddsStr;
        bestBook = book;
      }
    }

    rows.push({
      pick,
      opponent,
      edge,
      tier,
      pickSignal: pick.signal,
      bookOdds,
      bestOdds,
      bestBook,
    });
  }

  // Deduplicate - keep best odds for each pick/opponent pair
  const seen = new Map<string, H2HRow>();
  for (const r of rows) {
    const key = `${r.pick.player_name}::${r.opponent.player_name}`;
    const existing = seen.get(key);
    if (!existing || parseOdds(r.bestOdds) > parseOdds(existing.bestOdds)) {
      seen.set(key, r);
    }
  }

  return Array.from(seen.values());
}

const mono = "font-['JetBrains_Mono','SF_Mono',monospace]";
const label = "text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]";


type OddsTab = 'matchups' | 'outrights';

export default function OddsTablePage({ data, dataSet, onDataSetChange }: OddsTablePageProps) {
  const [activeTab, setActiveTab] = useState<OddsTab>('outrights');
  // Default Min Edge = the venue's recommended floor. Users can lower it
  // to see internally-graded picks below the recommended floor.
  const [minEdge, setMinEdge] = useState<number>(currentEvent.recommendedFloor);
  const [sortField, setSortField] = useState<OddsSortField>('edge');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (field: OddsSortField) => {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'edge' ? 'desc' : 'asc');
    }
  };

  const sortArrow = (field: OddsSortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  // Build R3 H2H rows
  const h2hRows = useMemo(() => {
    return buildH2HRows(data, currentEvent.matchups).filter(r => r.edge >= minEdge);
  }, [data, minEdge]);

  // Sort H2H rows
  const sortedH2H = useMemo(() => {
    const sorted = [...h2hRows];
    sorted.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      if (sortField === 'edge') { aVal = a.edge; bVal = b.edge; }
      else if (sortField === 'pick') { aVal = a.pick.player_name; bVal = b.pick.player_name; }
      else if (sortField === 'opp') { aVal = a.opponent.player_name; bVal = b.opponent.player_name; }
      else if (sortField === 'tier') {
        const tierOrder = { 'BEST BET': 0, 'STRONG PLAY': 1, 'LEAN': 2 };
        aVal = tierOrder[a.tier]; bVal = tierOrder[b.tier];
      } else if (sortField === 'best') {
        aVal = parseOdds(a.bestOdds); bVal = parseOdds(b.bestOdds);
      } else if (sportsbookKeys.includes(sortField as typeof sportsbookKeys[number])) {
        aVal = parseOdds(a.bookOdds[sortField] || ''); bVal = parseOdds(b.bookOdds[sortField] || '');
      } else {
        aVal = a.edge; bVal = b.edge;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [h2hRows, sortField, sortDir]);

  function getOddsColor(odds: string, bestOdds: string): string {
    const oddsVal = parseOdds(odds);
    const bestVal = parseOdds(bestOdds);
    if (oddsVal === bestVal) return 'text-[#22c55e] font-bold';
    // "20 cents worse" means the odds value is 20+ lower
    if (bestVal - oddsVal >= 20) return 'text-[#ef4444]';
    return 'text-[#d4d4d4]';
  }

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
              Odds Comparison
            </h2>
            <p className="text-sm text-[#d4d4d4] mt-1 font-['Inter',system-ui,sans-serif]">
              {activeTab === 'matchups'
                ? 'H2H matchup odds across all 11 sportsbooks. Best odds highlighted.'
                : 'Outright winner odds across all 11 sportsbooks. Reference only — model targets H2H matchups, not outrights.'}
            </p>
          </div>
          {activeTab === 'matchups' && (
            <RecommendedFloorBadge
              threshold={currentEvent.recommendedFloor}
              course={currentEvent.course}
            />
          )}
        </div>

        {/* H2H / Outrights toggle */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex border border-[#22c55e]/50 rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('outrights')}
              className={`px-4 py-1.5 text-xs uppercase tracking-wider font-medium rounded-full font-['Inter',system-ui,sans-serif] cursor-pointer transition-colors ${
                activeTab === 'outrights'
                  ? 'bg-[#22c55e] text-[#0a0a0a]'
                  : 'text-[#d4d4d4] hover:text-white'
              }`}
            >
              Outrights
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matchups')}
              className={`px-4 py-1.5 text-xs uppercase tracking-wider font-medium rounded-full font-['Inter',system-ui,sans-serif] cursor-pointer transition-colors ${
                activeTab === 'matchups'
                  ? 'bg-[#22c55e] text-[#0a0a0a]'
                  : 'text-[#d4d4d4] hover:text-white'
              }`}
            >
              H2H Matchups
            </button>
          </div>
        </div>

        {/* Cumulative vs Round toggle — only meaningful for the H2H matchup
            view since outright winner odds are tournament-wide. Sits BELOW
            the H2H/Outrights toggle so the visual hierarchy flows top-down. */}
        {activeTab === 'matchups' && currentEvent.picksRound > 1 && (
          <div className="mt-3">
            <DataSetToggle dataSet={dataSet} onChange={onDataSetChange} />
          </div>
        )}
      </div>

      {/* ───────── H2H Matchups tab ───────── */}
      {activeTab === 'matchups' && (<>

      {/* Filter Controls */}
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Round badge */}
          <div className="border border-[#22c55e]/50 rounded-full px-3 py-1">
            <span className="text-[10px] uppercase tracking-wider font-medium text-[#22c55e] font-['Inter',system-ui,sans-serif]">
              Round {currentEvent.picksRound}
            </span>
          </div>

          {/* Minimum edge */}
          <select
            value={minEdge}
            onChange={(e) => setMinEdge(parseFloat(e.target.value))}
            className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] focus:border-[#22c55e]/50 focus:outline-none cursor-pointer"
          >
            <option value={0.95}>Min Edge: 0.95</option>
            <option value={1.45}>Min Edge: 1.45</option>
            <option value={1.95}>Min Edge: 1.95</option>
            <option value={2.45}>Min Edge: 2.45</option>
            <option value={2.95}>Min Edge: 2.95</option>
            <option value={3.45}>Min Edge: 3.45</option>
          </select>

          <span className={`${label} ml-auto`}>
            {sortedH2H.length} H2H bets
          </span>
        </div>
      </div>

      {/* H2H Odds Table */}
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-[#262626]">
            <span className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
              H2H Matchups
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th
                    onClick={() => handleSort('pick')}
                    className={`px-3 py-3 text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] cursor-pointer hover:text-[#22c55e] transition-colors whitespace-nowrap select-none sticky left-0 bg-[#0a0a0a] z-10 ${sortField === 'pick' ? 'text-[#22c55e]' : 'text-[#a1a1aa]'}`}
                  >
                    Pick{sortArrow('pick')}
                  </th>
                  <th
                    onClick={() => handleSort('opp')}
                    className={`px-3 py-3 text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] cursor-pointer hover:text-[#22c55e] transition-colors whitespace-nowrap select-none ${sortField === 'opp' ? 'text-[#22c55e]' : 'text-[#a1a1aa]'}`}
                  >
                    Opp{sortArrow('opp')}
                  </th>
                  <th
                    onClick={() => handleSort('edge')}
                    className={`px-3 py-3 text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] cursor-pointer hover:text-[#22c55e] transition-colors whitespace-nowrap select-none ${sortField === 'edge' ? 'text-[#22c55e]' : 'text-[#a1a1aa]'}`}
                  >
                    Edge{sortArrow('edge')}
                  </th>
                  <th
                    onClick={() => handleSort('tier')}
                    className={`px-3 py-3 text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] cursor-pointer hover:text-[#22c55e] transition-colors whitespace-nowrap select-none ${sortField === 'tier' ? 'text-[#22c55e]' : 'text-[#a1a1aa]'}`}
                  >
                    Stars{sortArrow('tier')}
                  </th>
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap">
                    Signal
                  </th>
                  {sportsbookKeys.map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key as OddsSortField)}
                      className={`px-3 py-3 text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] cursor-pointer hover:text-[#22c55e] transition-colors whitespace-nowrap select-none ${sortField === key ? 'text-[#22c55e]' : 'text-[#a1a1aa]'}`}
                    >
                      <a
                        href={sportsbookUrls[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sportsbookLabels[key]}
                      </a>
                      {sortArrow(key as OddsSortField)}
                    </th>
                  ))}
                  <th
                    onClick={() => handleSort('best')}
                    className={`px-3 py-3 text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] cursor-pointer hover:text-[#22c55e] transition-colors whitespace-nowrap select-none ${sortField === 'best' ? 'text-[#22c55e]' : 'text-[#a1a1aa]'}`}
                  >
                    Best{sortArrow('best')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedH2H.map((row, i) => (
                  <tr
                    key={`${row.pick.player_name}-${row.opponent.player_name}-${i}`}
                    className={`border-b border-[#1a1a1a] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'} hover:bg-[#141414] transition-colors`}
                  >
                    <td className="px-3 py-2.5 text-xs text-[#f5f5f5] font-['Inter',system-ui,sans-serif] whitespace-nowrap sticky left-0 bg-inherit z-10">
                      {row.pick.player_name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] whitespace-nowrap">
                      {row.opponent.player_name}
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${mono} text-[#22c55e] font-bold`}>
                      {row.edge.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5">
                      {(() => {
                        const stars = starsForEdge(row.edge);
                        return (
                          <span
                            className={`text-[#22c55e] text-xs tracking-tight ${stars === 5 ? 'star-glow' : ''}`}
                            aria-label={`${stars} star play`}
                          >
                            {'★'.repeat(stars)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2.5">
                      {isBuySide(row.pick) && (
                        <span className="text-[10px] uppercase tracking-wider bg-[#22c55e]/15 text-[#22c55e] px-2 py-0.5 rounded-full font-semibold font-['Inter',system-ui,sans-serif]">
                          BUY
                        </span>
                      )}
                    </td>
                    {sportsbookKeys.map((key) => {
                      const odds = row.bookOdds[key];
                      return (
                        <td key={key} className={`px-3 py-2.5 text-xs ${mono} whitespace-nowrap ${odds ? getOddsColor(odds, row.bestOdds) : 'text-[#525252]'}`}>
                          {odds || '\u2014'}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2.5 text-xs ${mono} whitespace-nowrap`}>
                      <span className="text-[#22c55e] font-bold">{row.bestOdds}</span>
                      <span className="text-[#a1a1aa] ml-1 text-[10px]">
                        <a
                          href={sportsbookUrls[row.bestBook]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#22c55e] hover:underline"
                        >
                          {sportsbookLabels[row.bestBook] || row.bestBook}{'\u2197'}
                        </a>
                      </span>
                    </td>
                  </tr>
                ))}
                {sortedH2H.length === 0 && (
                  <tr>
                    <td colSpan={5 + sportsbookKeys.length + 1} className="px-3 py-8 text-center text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
                      No H2H matchups match the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </>)}

      {/* ───────── Outrights tab ───────── */}
      {activeTab === 'outrights' && (
        <OutrightsTable outrights={currentEvent.outrights} />
      )}
    </div>
  );
}
