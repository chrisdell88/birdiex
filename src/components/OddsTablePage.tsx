import { useState, useMemo } from 'react';
import type { PlayerData, MatchupOddsEntry, TournamentId } from '../types';
import { r2MatchupOddsData, r3MatchupOddsData, r4MatchupOddsData, r2XScores, r3XScores, r4XScores } from '../data/matchupOdds';
import { heritageR2MatchupOdds } from '../data/heritageMatchupOdds';
import { threeBallOddsData, type ThreeBallOddsEntry } from '../data/threeBallData';

interface OddsTablePageProps {
  data: PlayerData[];
  tournament?: TournamentId;
}

type OddsRoundFilter = 'R2' | 'R3' | 'R4' | 'All';
type OddsTypeFilter = 'H2H' | '3-Ball' | 'All';
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

interface ThreeBallRow {
  pick: PlayerData;
  fade1: PlayerData;
  fade2: PlayerData;
  edge: number;
  tier: 'BEST BET' | 'STRONG PLAY' | 'LEAN';
  bookOdds: Record<string, string>;
  bestOdds: string;
  bestBook: string;
}

function buildH2HRows(data: PlayerData[], oddsData: MatchupOddsEntry[], xScoreLookup?: Record<string, number>): H2HRow[] {
  const playerMap = new Map<string, PlayerData>();
  data.forEach((p) => playerMap.set(p.player_name, p));

  const rows: H2HRow[] = [];

  for (const entry of oddsData) {
    const p1 = playerMap.get(entry.p1_player_name);
    const p2 = playerMap.get(entry.p2_player_name);
    if (!p1 || !p2) continue;

    // Use round-specific X Scores if provided, otherwise fall back to player data
    const p1XScore = xScoreLookup ? (xScoreLookup[entry.p1_player_name] ?? p1.x_score) : p1.x_score;
    const p2XScore = xScoreLookup ? (xScoreLookup[entry.p2_player_name] ?? p2.x_score) : p2.x_score;

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

function buildThreeBallRows(data: PlayerData[], tbData: ThreeBallOddsEntry[]): ThreeBallRow[] {
  const playerMap = new Map<string, PlayerData>();
  data.forEach((p) => playerMap.set(p.player_name, p));

  const rows: ThreeBallRow[] = [];

  for (const entry of tbData) {
    const players = [
      { key: 'p1' as const, name: entry.p1_player_name },
      { key: 'p2' as const, name: entry.p2_player_name },
      { key: 'p3' as const, name: entry.p3_player_name },
    ];

    const resolved = players.map(p => ({ ...p, data: playerMap.get(p.name) }));
    if (resolved.some(r => !r.data)) continue;

    const fadeThreshold = -0.50;
    const fadeIndices: number[] = [];
    const nonFadeIndices: number[] = [];

    resolved.forEach((r, i) => {
      if (r.data!.x_score <= fadeThreshold) fadeIndices.push(i);
      else nonFadeIndices.push(i);
    });

    if (fadeIndices.length !== 2 || nonFadeIndices.length !== 1) continue;

    const pickIdx = nonFadeIndices[0];
    const pickPlayer = resolved[pickIdx].data!;
    const fade1 = resolved[fadeIndices[0]].data!;
    const fade2 = resolved[fadeIndices[1]].data!;

    const fadeAvg = (fade1.x_score + fade2.x_score) / 2;
    const edge = +(pickPlayer.x_score - fadeAvg).toFixed(2);

    if (edge < 0.95) continue;

    const pickKey = resolved[pickIdx].key;
    const bookOdds: Record<string, string> = {};
    let bestOddsVal = -Infinity;
    let bestOdds = '';
    let bestBook = '';

    for (const [book, vals] of Object.entries(entry.odds)) {
      if (book === 'datagolf') continue;
      const oddsStr = vals[pickKey];
      bookOdds[book] = oddsStr;
      const oddsVal = parseOdds(oddsStr);
      if (oddsVal > bestOddsVal) {
        bestOddsVal = oddsVal;
        bestOdds = oddsStr;
        bestBook = book;
      }
    }

    let tier: ThreeBallRow['tier'] = 'LEAN';
    if (edge >= 1.95) tier = 'BEST BET';
    else if (edge >= 1.45) tier = 'STRONG PLAY';

    rows.push({ pick: pickPlayer, fade1, fade2, edge, tier, bookOdds, bestOdds, bestBook });
  }

  rows.sort((a, b) => b.edge - a.edge);
  return rows;
}

const mono = "font-['JetBrains_Mono','SF_Mono',monospace]";
const label = "text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]";

const tierBadge: Record<string, string> = {
  'BEST BET': 'bg-[#22c55e]/15 text-[#22c55e]',
  'STRONG PLAY': 'bg-emerald-500/15 text-emerald-400',
  'LEAN': 'bg-gray-500/15 text-gray-400',
};

export default function OddsTablePage({ data, tournament = 'masters' }: OddsTablePageProps) {
  return <OddsBody data={data} tournament={tournament} />;
}

function OddsBody({ data, tournament }: { data: PlayerData[]; tournament: TournamentId }) {
  const isHeritage = tournament === 'heritage';
  const [roundFilter, setRoundFilter] = useState<OddsRoundFilter>(isHeritage ? 'R2' : 'R4');
  const [typeFilter, setTypeFilter] = useState<OddsTypeFilter>('H2H');
  const [minEdge, setMinEdge] = useState<number>(0.95);
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

  // Build H2H rows with round-specific X Scores
  const h2hRows = useMemo(() => {
    if (isHeritage) {
      return buildH2HRows(data, heritageR2MatchupOdds).filter(r => r.edge >= minEdge);
    }
    switch (roundFilter) {
      case 'R2': return buildH2HRows(data, r2MatchupOddsData, r2XScores).filter(r => r.edge >= minEdge);
      case 'R3': return buildH2HRows(data, r3MatchupOddsData, r3XScores).filter(r => r.edge >= minEdge);
      case 'R4': return buildH2HRows(data, r4MatchupOddsData, r4XScores).filter(r => r.edge >= minEdge);
      case 'All': return [
        ...buildH2HRows(data, r2MatchupOddsData, r2XScores),
        ...buildH2HRows(data, r3MatchupOddsData, r3XScores),
        ...buildH2HRows(data, r4MatchupOddsData, r4XScores),
      ].filter(r => r.edge >= minEdge);
    }
  }, [data, roundFilter, minEdge, isHeritage]);

  // Build 3-ball rows
  const threeBallRows = useMemo(() => {
    return buildThreeBallRows(data, threeBallOddsData).filter(r => r.edge >= minEdge);
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

  const showH2H = typeFilter === 'H2H' || typeFilter === 'All';
  const showThreeBall = (typeFilter === '3-Ball' || typeFilter === 'All') && threeBallRows.length > 0;

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
          Odds Comparison Table
        </h2>
        <p className="text-sm text-[#d4d4d4] mt-1 font-['Inter',system-ui,sans-serif]">
          Recommended bets with odds from all 11 sportsbooks
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Round filter */}
          <div className="flex border border-[#22c55e]/50 rounded-full p-0.5">
            {(isHeritage ? (['R2'] as const) : (['R2', 'R3', 'R4', 'All'] as const)).map((r) => (
              <button
                key={r}
                onClick={() => setRoundFilter(r)}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-medium rounded-full transition-colors font-['Inter',system-ui,sans-serif] cursor-pointer ${
                  roundFilter === r
                    ? 'bg-[#22c55e] text-[#0a0a0a]'
                    : 'text-[#f5f5f5] hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Type filter (Masters only - Heritage is H2H only) */}
          {!isHeritage && (
          <div className="flex border border-[#262626] rounded-full p-0.5">
            {(['H2H', '3-Ball', 'All'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-medium rounded-full transition-colors font-['Inter',system-ui,sans-serif] cursor-pointer ${
                  typeFilter === t
                    ? 'bg-[#22c55e] text-[#0a0a0a]'
                    : 'text-[#d4d4d4] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          )}

          {/* Minimum edge */}
          <select
            value={minEdge}
            onChange={(e) => setMinEdge(parseFloat(e.target.value))}
            className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] focus:border-[#22c55e]/50 focus:outline-none cursor-pointer"
          >
            <option value={0.95}>Min Edge: 0.95</option>
            <option value={1.45}>Min Edge: 1.45</option>
            <option value={1.95}>Min Edge: 1.95</option>
          </select>

          <span className={`${label} ml-auto`}>
            {showH2H ? sortedH2H.length : 0} H2H {showThreeBall ? `+ ${threeBallRows.length} 3-Ball` : ''} bets
          </span>
        </div>
      </div>

      {/* H2H Odds Table */}
      {showH2H && (
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
                    Tier{sortArrow('tier')}
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
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold font-['Inter',system-ui,sans-serif] ${tierBadge[row.tier]}`}>
                        {row.tier}
                      </span>
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
      )}

      {/* 3-Ball Odds Table */}
      {showThreeBall && (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-[#262626]">
            <span className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
              3-Ball Picks
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap sticky left-0 bg-[#0a0a0a] z-10">Pick</th>
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap">Fade 1</th>
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap">Fade 2</th>
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap">Edge</th>
                  {sportsbookKeys.map((key) => (
                    <th key={key} className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap">
                      <a
                        href={sportsbookUrls[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-[#22c55e]"
                      >
                        {sportsbookLabels[key]}
                      </a>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap">Best</th>
                </tr>
              </thead>
              <tbody>
                {threeBallRows.map((row, i) => (
                  <tr
                    key={`${row.pick.player_name}-${i}`}
                    className={`border-b border-[#1a1a1a] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'} hover:bg-[#141414] transition-colors`}
                  >
                    <td className="px-3 py-2.5 text-xs text-[#f5f5f5] font-['Inter',system-ui,sans-serif] whitespace-nowrap sticky left-0 bg-inherit z-10">
                      {row.pick.player_name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] whitespace-nowrap">
                      {row.fade1.player_name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] whitespace-nowrap">
                      {row.fade2.player_name}
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${mono} text-[#22c55e] font-bold`}>
                      {row.edge.toFixed(2)}
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
                {threeBallRows.length === 0 && (
                  <tr>
                    <td colSpan={4 + sportsbookKeys.length + 1} className="px-3 py-8 text-center text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
                      No 3-ball picks match the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
