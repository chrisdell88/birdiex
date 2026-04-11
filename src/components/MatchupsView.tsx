import { useState, useMemo } from 'react';
import type { PlayerData, Matchup, BucketType } from '../types';
import { matchupOddsData } from '../data/matchupOdds';

interface MatchupsViewProps {
  data: PlayerData[];
}

type MatchupSort = 'edge-high' | 'edge-low' | 'tier';

function parseOdds(odds: string): number {
  const n = parseInt(odds, 10);
  if (isNaN(n)) return 999;
  return n;
}

function isBuySide(p: PlayerData): boolean {
  return ['STRONGEST BUY', 'STRONG BUY', 'BUY'].includes(p.signal);
}

function isFadeSide(p: PlayerData): boolean {
  return ['FADE', 'STRONG FADE', 'STRONGEST FADE'].includes(p.signal);
}

function getBucket(pick: PlayerData, opponent: PlayerData): BucketType {
  const pickBuy = isBuySide(pick);
  const oppFade = isFadeSide(opponent);
  if (pickBuy && oppFade) return 'BUY vs FADE';
  if (pickBuy) return 'BUY vs OTHER';
  if (oppFade) return 'OTHER vs FADE';
  return 'OTHER vs OTHER';
}

function generateMatchups(data: PlayerData[]): Matchup[] {
  const playerMap = new Map<string, PlayerData>();
  data.forEach((p) => playerMap.set(p.player_name, p));

  const matchups: Matchup[] = [];

  for (const entry of matchupOddsData) {
    const p1 = playerMap.get(entry.p1_player_name);
    const p2 = playerMap.get(entry.p2_player_name);
    if (!p1 || !p2) continue;

    const pick = p1.x_score >= p2.x_score ? p1 : p2;
    const opponent = pick === p1 ? p2 : p1;
    const pickIsP1 = pick === p1;

    const matchupScore = +(pick.x_score - opponent.x_score).toFixed(4);
    if (matchupScore < 0.95) continue;

    let bestOdds = '';
    let bestBook = '';
    let bestOddsValue = -Infinity;
    let dgOdds = '';

    for (const [book, vals] of Object.entries(entry.odds)) {
      const pickOddsStr = pickIsP1 ? vals.p1 : vals.p2;
      if (book === 'datagolf') {
        dgOdds = pickOddsStr;
        continue;
      }
      const oddsVal = parseOdds(pickOddsStr);
      if (oddsVal > bestOddsValue) {
        bestOddsValue = oddsVal;
        bestOdds = pickOddsStr;
        bestBook = book;
      }
    }

    if (!bestBook && dgOdds) {
      bestOdds = dgOdds;
      bestBook = 'datagolf';
    }

    let tier: Matchup['tier'] = 'LEAN';
    if (matchupScore >= 1.95) tier = 'BEST BET';
    else if (matchupScore >= 1.45) tier = 'STRONG PLAY';

    const bucket = getBucket(pick, opponent);
    const isDoubleSignal =
      pick.purity === 'PURE BUY' &&
      opponent.purity === 'PURE FADE' &&
      tier === 'BEST BET';

    matchups.push({
      pick,
      opponent,
      matchupScore,
      tier,
      bucket,
      bestOdds,
      bestBook: formatBookName(bestBook),
      dgOdds,
      isDoubleSignal,
    });
  }

  const seen = new Map<string, Matchup>();
  for (const m of matchups) {
    const key = `${m.pick.player_name}::${m.opponent.player_name}`;
    const existing = seen.get(key);
    if (!existing || parseOdds(m.bestOdds) > parseOdds(existing.bestOdds)) {
      seen.set(key, m);
    }
  }

  return Array.from(seen.values());
}

function formatBookName(book: string): string {
  const names: Record<string, string> = {
    bet365: 'Bet365',
    bovada: 'Bovada',
    draftkings: 'DraftKings',
    pinnacle: 'Pinnacle',
    betcris: 'Betcris',
    betonline: 'BetOnline',
    unibet: 'Unibet',
    betmgm: 'BetMGM',
    caesars: 'Caesars',
    pointsbet: 'PointsBet',
    datagolf: 'DataGolf',
  };
  return names[book] || book;
}

const tierOrder: Record<Matchup['tier'], number> = {
  'BEST BET': 1,
  'STRONG PLAY': 2,
  'LEAN': 3,
};

const tierBorderColor: Record<Matchup['tier'], string> = {
  'BEST BET': 'border-l-[#22c55e]',
  'STRONG PLAY': 'border-l-emerald-500',
  'LEAN': 'border-l-gray-600',
};

const tierBadgeColor: Record<Matchup['tier'], string> = {
  'BEST BET': 'bg-[#22c55e]/15 text-[#22c55e]',
  'STRONG PLAY': 'bg-emerald-500/15 text-emerald-400',
  'LEAN': 'bg-gray-500/15 text-gray-400',
};

export default function MatchupsView({ data }: MatchupsViewProps) {
  const [sortBy, setSortBy] = useState<MatchupSort>('edge-high');
  const rawMatchups = useMemo(() => generateMatchups(data), [data]);

  const matchups = useMemo(() => {
    const sorted = [...rawMatchups];
    switch (sortBy) {
      case 'edge-high':
        sorted.sort((a, b) => b.matchupScore - a.matchupScore);
        break;
      case 'edge-low':
        sorted.sort((a, b) => a.matchupScore - b.matchupScore);
        break;
      case 'tier':
        sorted.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier] || b.matchupScore - a.matchupScore);
        break;
    }
    return sorted;
  }, [rawMatchups, sortBy]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Matchup Recommendations
          </h2>
          <p className="text-sm text-[#d4d4d4] mt-1 font-['Inter',system-ui,sans-serif]">
            Real sportsbook matchups ranked by X Score edge -- Min edge: 0.95
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as MatchupSort)}
            className="bg-[#0a0a0a] border border-[#22c55e]/50 rounded-lg px-3 py-1.5 text-xs text-[#f5f5f5] focus:outline-none focus:border-[#22c55e] font-['Inter',system-ui,sans-serif] cursor-pointer"
          >
            <option value="edge-high">Edge (High-Low)</option>
            <option value="edge-low">Edge (Low-High)</option>
            <option value="tier">Tier</option>
          </select>
          <div className="text-right">
            <span className="text-2xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e]">
              {matchups.length}
            </span>
            <span className="text-xs text-[#d4d4d4] block uppercase tracking-wider font-['Inter',system-ui,sans-serif]">
              Matchups
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {matchups.map((m, idx) => (
          <div
            key={idx}
            className={`bg-[#0a0a0a] border border-[#262626] border-l-4 ${tierBorderColor[m.tier]} rounded-lg p-4 hover:bg-[#111111] transition-colors`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-semibold font-['Inter',system-ui,sans-serif] ${tierBadgeColor[m.tier]} ${
                  m.tier === 'BEST BET' ? 'animate-pulse' : ''
                }`}
              >
                {m.tier}
              </span>
              <span className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
                Edge:{' '}
                <span className="text-[#22c55e] font-bold font-['JetBrains_Mono','SF_Mono',monospace]">
                  {m.matchupScore.toFixed(2)}
                </span>
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-[#1a1a1a] mb-3" />

            {/* Players row */}
            <div className="flex items-center justify-between gap-4">
              {/* Pick */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                  {m.pick.player_name}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e]">
                    X Score: {m.pick.x_score > 0 ? '+' : ''}
                    {m.pick.x_score.toFixed(2)}
                  </span>
                  {m.pick.purity === 'PURE BUY' && (
                    <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif]">
                      PURE BUY
                      <svg width="10" height="10" viewBox="0 0 16 16" className="inline ml-0.5 -mt-0.5 text-[#22c55e]">
                        <path fill="currentColor" d="M6.5 12.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              {/* VS */}
              <div className="text-[#d4d4d4] text-xs font-bold font-['Inter',system-ui,sans-serif] shrink-0">
                vs
              </div>

              {/* Opponent */}
              <div className="flex-1 text-right">
                <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                  {m.opponent.player_name}
                </div>
                <div className="flex items-center justify-end gap-3 mt-1">
                  {m.opponent.purity === 'PURE FADE' && (
                    <span className="text-[10px] uppercase tracking-wider text-red-400 font-medium font-['Inter',system-ui,sans-serif]">
                      PURE FADE
                      <svg width="10" height="10" viewBox="0 0 16 16" className="inline ml-0.5 -mt-0.5 text-red-400">
                        <path fill="currentColor" d="M6.5 12.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
                      </svg>
                    </span>
                  )}
                  <span className="text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-red-400">
                    X Score: {m.opponent.x_score > 0 ? '+' : ''}
                    {m.opponent.x_score.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Best odds */}
            <div className="border-t border-[#1a1a1a] mt-3 pt-3">
              <div className="text-xs font-['Inter',system-ui,sans-serif]">
                <span className="text-[#d4d4d4]">Best Odds: </span>
                <span className="text-[#f5f5f5] font-bold font-['JetBrains_Mono','SF_Mono',monospace]">
                  {m.bestOdds}
                </span>
                <span className="text-[#d4d4d4]"> ({m.bestBook})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
