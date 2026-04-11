import { useMemo } from 'react';
import type { PlayerData, Matchup, BucketType } from '../types';
import { matchupOddsData } from '../data/matchupOdds';
import SignalBadge from './SignalBadge';

interface MatchupsViewProps {
  data: PlayerData[];
}

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

    // Pick = player with higher X Score
    const pick = p1.x_score >= p2.x_score ? p1 : p2;
    const opponent = pick === p1 ? p2 : p1;
    const pickIsP1 = pick === p1;

    const matchupScore = +(pick.x_score - opponent.x_score).toFixed(4);
    if (matchupScore < 0.95) continue;

    // Find best odds for the pick across all books (excluding datagolf)
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
      // Higher is better for the bettor (more plus or less minus)
      if (oddsVal > bestOddsValue) {
        bestOddsValue = oddsVal;
        bestOdds = pickOddsStr;
        bestBook = book;
      }
    }

    // If no non-DG books, use DG
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

  // Deduplicate: keep only the best matchup for each pick/opponent pair
  const seen = new Map<string, Matchup>();
  for (const m of matchups) {
    const key = `${m.pick.player_name}::${m.opponent.player_name}`;
    const existing = seen.get(key);
    if (!existing || parseOdds(m.bestOdds) > parseOdds(existing.bestOdds)) {
      seen.set(key, m);
    }
  }

  const deduplicated = Array.from(seen.values());
  deduplicated.sort((a, b) => b.matchupScore - a.matchupScore);
  return deduplicated;
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

const tierBorderColor: Record<Matchup['tier'], string> = {
  'BEST BET': 'border-l-green-400',
  'STRONG PLAY': 'border-l-emerald-500',
  'LEAN': 'border-l-gray-500',
};

const tierBadgeColor: Record<Matchup['tier'], string> = {
  'BEST BET': 'bg-green-500/15 text-green-400',
  'STRONG PLAY': 'bg-emerald-500/15 text-emerald-400',
  'LEAN': 'bg-gray-500/15 text-gray-400',
};

const bucketColor: Record<BucketType, string> = {
  'BUY vs FADE': 'text-green-400',
  'BUY vs OTHER': 'text-emerald-400',
  'OTHER vs FADE': 'text-orange-400',
  'OTHER vs OTHER': 'text-gray-400',
};

const purityBadge: Record<string, string> = {
  'PURE BUY': 'text-green-400',
  'PURE FADE': 'text-red-400',
  'CONFLICTED': 'text-yellow-400',
  'HOLD': 'text-gray-500',
};

export default function MatchupsView({ data }: MatchupsViewProps) {
  const matchups = useMemo(() => generateMatchups(data), [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Matchup Recommendations
          </h2>
          <p className="text-sm text-[#52525b] mt-1 font-['Inter',system-ui,sans-serif]">
            Real sportsbook matchups ranked by X Score edge -- Min edge: 0.95
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#00a86b]">
            {matchups.length}
          </span>
          <span className="text-xs text-[#52525b] block uppercase tracking-wider font-['Inter',system-ui,sans-serif]">
            Matchups
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matchups.map((m, idx) => (
          <div
            key={idx}
            className={`bg-[#111111] border border-[#262626] border-l-4 ${tierBorderColor[m.tier]} rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors ${
              m.isDoubleSignal ? 'ring-1 ring-green-500/30' : ''
            }`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium font-['Inter',system-ui,sans-serif] ${tierBadgeColor[m.tier]}`}
                >
                  {m.tier}
                </span>
                {m.isDoubleSignal && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium bg-green-500/25 text-green-300 font-['Inter',system-ui,sans-serif] animate-pulse">
                    DOUBLE SIGNAL
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#52525b] font-['Inter',system-ui,sans-serif]">
                  Edge:{' '}
                  <span className="text-[#00a86b] font-bold font-['JetBrains_Mono','SF_Mono',monospace]">
                    {m.matchupScore.toFixed(2)}
                  </span>
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] ${bucketColor[m.bucket]}`}>
                  {m.bucket}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#262626] mb-3" />

            {/* Players */}
            <div className="flex items-start justify-between gap-4">
              {/* Pick */}
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                  {m.pick.player_name}
                </div>
                <div className={`text-[10px] uppercase tracking-wider mt-0.5 font-medium font-['Inter',system-ui,sans-serif] ${purityBadge[m.pick.purity]}`}>
                  {m.pick.purity}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-green-400">
                    X: {m.pick.x_score > 0 ? '+' : ''}
                    {m.pick.x_score.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <SignalBadge signal={m.pick.signal} compact />
                </div>
              </div>

              {/* VS */}
              <div className="text-[#52525b] text-xs font-bold font-['Inter',system-ui,sans-serif] shrink-0 pt-2">
                vs
              </div>

              {/* Opponent */}
              <div className="flex-1 text-right">
                <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                  {m.opponent.player_name}
                </div>
                <div className={`text-[10px] uppercase tracking-wider mt-0.5 font-medium font-['Inter',system-ui,sans-serif] ${purityBadge[m.opponent.purity]}`}>
                  {m.opponent.purity}
                </div>
                <div className="flex items-center justify-end gap-2 mt-1.5">
                  <span className="text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-red-400">
                    X: {m.opponent.x_score > 0 ? '+' : ''}
                    {m.opponent.x_score.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1.5 flex justify-end">
                  <SignalBadge signal={m.opponent.signal} compact />
                </div>
              </div>
            </div>

            {/* Odds row */}
            <div className="border-t border-[#262626] mt-3 pt-3 flex items-center justify-between">
              <div className="text-xs font-['Inter',system-ui,sans-serif]">
                <span className="text-[#52525b]">Best Odds: </span>
                <span className="text-[#f5f5f5] font-bold font-['JetBrains_Mono','SF_Mono',monospace]">
                  {m.bestOdds}
                </span>
                <span className="text-[#52525b]"> ({m.bestBook})</span>
              </div>
              <div className="text-xs font-['Inter',system-ui,sans-serif]">
                <span className="text-[#52525b]">DG Model: </span>
                <span className="text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace]">
                  {m.dgOdds || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
