/**
 * NextRoundPreview — renders the NEXT round's matchup cards using the EXACT
 * same visual format as the current-round Best Bets cards (matchup score,
 * stars, X-Score per side, Signal Badge, Purity, Best Odds, sportsbook).
 *
 * Data inputs:
 *   - `rankings`: PlayerData[] containing X-Scores for the next round.
 *     For Memorial R4 picks this is cumulative-through-R3 X-Scores (only
 *     the 21 players who completed R3 will have clean values; books only
 *     post R4 matchups for those players so the other 32 are not in the
 *     matchups list anyway).
 *   - `matchups`: MatchupOddsEntry[] from src/data/<event>R<N+1>Matchups.ts.
 *
 * Why this exists: when R3 suspends mid-round but the 21 finished players
 * have clean cumulative data + books have posted R4 lines for them, this
 * shows real R4 picks (not a "preview") with the same matchup-card format
 * as the current round. Renders ABOVE the current-round view.
 */
import { useMemo, useState } from 'react';
import type { PlayerData, MatchupOddsEntry, Matchup, BucketType } from '../types';
import { starsForEdge, tierForEdge } from '../lib/sizing';
import { isBuy, isFade, signalTextColorClass } from '../lib/signalDisplay';
import { formatPlayerName } from '../lib/formatName';
import SignalBadge from './SignalBadge';
import PurityIcon from './PurityIcon';
import Avatar from './Avatar';

interface Props {
  roundNumber: number;
  rankings: PlayerData[];
  matchups: MatchupOddsEntry[];
  floor: number;
  course: string;
}

function parseOdds(odds: string): number {
  const n = parseInt(odds, 10);
  if (isNaN(n)) return 999;
  return n;
}

function getBucket(pick: PlayerData, opponent: PlayerData): BucketType {
  const pickBuy = isBuy(pick.signal);
  const oppFade = isFade(opponent.signal);
  if (pickBuy && oppFade) return 'BUY vs FADE';
  if (pickBuy) return 'BUY vs OTHER';
  if (oppFade) return 'FADE vs OTHER';
  return 'OTHER vs OTHER';
}

const BOOK_DISPLAY: Record<string, string> = {
  bet365: 'Bet365', bovada: 'Bovada', draftkings: 'DraftKings', pinnacle: 'Pinnacle',
  betcris: 'Betcris', betonline: 'BetOnline', unibet: 'Unibet', betmgm: 'BetMGM',
  caesars: 'Caesars', pointsbet: 'PointsBet', fanduel: 'FanDuel', datagolf: 'DataGolf',
};
const BOOK_URLS: Record<string, string> = {
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

function SportsbookLink({ bookKey }: { bookKey: string }) {
  const display = BOOK_DISPLAY[bookKey.toLowerCase()] ?? bookKey;
  const url = BOOK_URLS[bookKey.toLowerCase()];
  if (!url) return <span className="text-[#d4d4d4]">({display})</span>;
  return (
    <span className="text-[#d4d4d4]">
      (<a href={url} target="_blank" rel="noopener noreferrer" className="text-[#22c55e] hover:underline transition-colors">
        {display}<span className="ml-0.5 text-[10px]">↗</span>
      </a>)
    </span>
  );
}

function generateNextMatchups(rankings: PlayerData[], oddsData: MatchupOddsEntry[], floor: number): Matchup[] {
  const playerMap = new Map<string, PlayerData>();
  rankings.forEach((p) => playerMap.set(p.player_name, p));

  const matchups: Matchup[] = [];
  for (const entry of oddsData) {
    const p1 = playerMap.get(entry.p1_player_name);
    const p2 = playerMap.get(entry.p2_player_name);
    if (!p1 || !p2) continue; // skip if either player isn't in our rankings (e.g. unfinished R3)

    const pick = p1.x_score >= p2.x_score ? p1 : p2;
    const opponent = pick === p1 ? p2 : p1;
    const pickIsP1 = pick === p1;
    const matchupScore = +(pick.x_score - opponent.x_score).toFixed(4);
    if (matchupScore < 0.95) continue;

    let bestOdds = '';
    let bestBook = '';
    let bestOddsValue = -Infinity;
    let dgOdds = '';
    for (const [book, vals] of Object.entries(entry.odds) as [string, { p1: string; p2: string }][]) {
      const pickOddsStr = pickIsP1 ? vals.p1 : vals.p2;
      if (book === 'datagolf') { dgOdds = pickOddsStr; continue; }
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
    const tier = tierForEdge(matchupScore, floor);
    matchups.push({
      pick, opponent, matchupScore, tier,
      bucket: getBucket(pick, opponent),
      bestOdds,
      bestBook: BOOK_DISPLAY[bestBook] ?? bestBook,
      dgOdds,
      isDoubleSignal: false,
    });
  }
  return matchups.sort((a, b) => b.matchupScore - a.matchupScore);
}

const fmtXScore = (v: number) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2));

function MatchupCard({ m }: { m: Matchup }) {
  const stars = starsForEdge(m.matchupScore);
  return (
    <div className="bg-[#0a0a0a] border border-[#262626] border-l-4 border-l-[#22c55e] rounded-lg p-4 hover:bg-[#111111] transition-colors">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]">Matchup Score</span>
          <span className="text-sm font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e]">{m.matchupScore.toFixed(2)}</span>
          <span className={`text-[#22c55e] text-sm tracking-tight ${stars === 5 ? 'star-glow' : ''}`}>{'★'.repeat(stars)}</span>
          {m.tier === 'BEST BET' && (
            <span className="text-[9px] uppercase tracking-wider font-bold font-['Inter',system-ui,sans-serif] bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/40 rounded-full px-2 py-0.5">Best Bet</span>
          )}
        </div>
        {/* Dataset chip — R4 picks are computed off cumulative-through-R3 SG,
            same data source the R3 cumulative card uses. Matches the R3
            card's top-right chip exactly. */}
        <span className="text-[9px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] bg-[#1a1a1a] text-[#a1a1aa] rounded-full px-2 py-0.5">
          Cumulative data
        </span>
      </div>
      <div className="border-t border-[#1a1a1a] mb-3" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 flex items-start gap-2 min-w-0">
          <Avatar playerName={m.pick.player_name} size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif] leading-snug">{formatPlayerName(m.pick.player_name)}</div>
            <div className={`mt-1 text-xs font-['JetBrains_Mono','SF_Mono',monospace] ${signalTextColorClass(m.pick.signal, m.pick.purity === 'CONFLICTED')}`}>X Score: {fmtXScore(m.pick.x_score)}</div>
            <div className="mt-1 flex items-center gap-2">
              <SignalBadge signal={m.pick.signal} compact conflicted={m.pick.purity === 'CONFLICTED'} />
              <PurityIcon player={m.pick} />
            </div>
          </div>
        </div>
        <div className="text-[#d4d4d4] text-xs font-bold font-['Inter',system-ui,sans-serif] shrink-0 mt-1">vs</div>
        <div className="flex-1 flex items-start gap-2 justify-end min-w-0">
          <div className="min-w-0 text-right">
            <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif] leading-snug">{formatPlayerName(m.opponent.player_name)}</div>
            <div className={`mt-1 text-xs font-['JetBrains_Mono','SF_Mono',monospace] ${signalTextColorClass(m.opponent.signal, m.opponent.purity === 'CONFLICTED')}`}>X Score: {fmtXScore(m.opponent.x_score)}</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <SignalBadge signal={m.opponent.signal} compact conflicted={m.opponent.purity === 'CONFLICTED'} />
              <PurityIcon player={m.opponent} align="right" />
            </div>
          </div>
          <Avatar playerName={m.opponent.player_name} size="sm" />
        </div>
      </div>
      <div className="border-t border-[#1a1a1a] mt-3 pt-3">
        <div className="text-xs font-['Inter',system-ui,sans-serif]">
          <span className="text-[#d4d4d4]">Best Odds: </span>
          <span className="text-[#f5f5f5] font-bold font-['JetBrains_Mono','SF_Mono',monospace]">{m.bestOdds}</span>{' '}
          <SportsbookLink bookKey={m.bestBook} />
        </div>
      </div>
    </div>
  );
}

export default function NextRoundPreview({ roundNumber, rankings, matchups, floor, course }: Props) {
  const [showAll, setShowAll] = useState(false);
  const allMatchups = useMemo(() => generateNextMatchups(rankings, matchups, floor), [rankings, matchups, floor]);
  const bestBets = useMemo(() => allMatchups.filter((m) => m.matchupScore >= floor), [allMatchups, floor]);
  const leans = useMemo(() => allMatchups.filter((m) => m.matchupScore < floor && m.matchupScore >= floor - 0.5), [allMatchups, floor]);

  if (matchups.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-[#22c55e]/15 text-[#22c55e] text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-['Inter',system-ui,sans-serif]">Round {roundNumber} · Picks</span>
          <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            {bestBets.length} Best Bet{bestBets.length === 1 ? '' : 's'} · {allMatchups.length} total matchups
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            Threshold ≥ {floor.toFixed(2)} at {course}
          </span>
        </div>
      </div>

      {bestBets.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace] mb-3">
            R{roundNumber} Best Bets
            <span className="ml-2 text-[10px] font-bold font-['JetBrains_Mono','SF_Mono',monospace] bg-[#22c55e]/15 text-[#22c55e] rounded-full px-2 py-0.5 align-middle">{bestBets.length}</span>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {bestBets.map((m, i) => <MatchupCard key={i} m={m} />)}
          </div>
        </div>
      )}

      {bestBets.length === 0 && leans.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace] mb-2">
            R{roundNumber} Leans
            <span className="ml-2 text-[10px] font-bold font-['JetBrains_Mono','SF_Mono',monospace] bg-[#22c55e]/15 text-[#22c55e] rounded-full px-2 py-0.5 align-middle">{leans.length}</span>
          </h3>
          <p className="text-xs text-[#a1a1aa] mb-3 font-['Inter',system-ui,sans-serif]">No matchups cleared the {floor.toFixed(2)} floor. Showing edges between {(floor - 0.5).toFixed(2)} and {floor.toFixed(2)}.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {leans.map((m, i) => <MatchupCard key={i} m={m} />)}
          </div>
        </div>
      )}

      {allMatchups.length > (bestBets.length + (bestBets.length === 0 ? leans.length : 0)) && (
        <div className="text-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-[11px] text-[#22c55e] hover:text-[#4ade80] font-medium cursor-pointer underline underline-offset-2 font-['Inter',system-ui,sans-serif]"
          >
            {showAll ? 'Hide other matchups' : `Show all ${allMatchups.length} R${roundNumber} matchups`}
          </button>
          {showAll && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {allMatchups.map((m, i) => <MatchupCard key={i} m={m} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
