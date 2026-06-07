/**
 * NextRoundPreview — renders Best Bets / Leans for the NEXT round's
 * matchups using cumulative-through-{N-1} X-Scores. Same visual format
 * as the current-round cards because BOTH render via the canonical
 * `MatchupCard` template. No copy-pasted JSX here — if the card layout
 * needs to change, edit MatchupCard.tsx and every surface updates
 * identically.
 *
 * Data flow:
 *   - `rankings`: PlayerData[] with cumulative-through-{N-1} X-Scores
 *     (Memorial R4 = cumulative-through-R3 SG sum for the 21 finished
 *     players; built via build-event.ts --lock-at-round 3).
 *   - `matchups`: MatchupOddsEntry[] from <event>R{N}Matchups.ts.
 *
 * Books only post next-round H2H lines for players who completed the
 * prior round, so edges are clean for every matchup that enters this
 * section. Players missing from the rankings (unfinished prior round)
 * are silently skipped because their matchups don't exist in the
 * sportsbook data anyway.
 */
import { useMemo, useState } from 'react';
import type { PlayerData, MatchupOddsEntry, Matchup, BucketType } from '../types';
import { tierForEdge } from '../lib/sizing';
import { isBuy, isFade } from '../lib/signalDisplay';
import MatchupCard from './MatchupCard';

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
    if (!bestBook && dgOdds) { bestOdds = dgOdds; bestBook = 'datagolf'; }
    const tier = tierForEdge(matchupScore, floor);
    matchups.push({
      pick, opponent, matchupScore, tier,
      bucket: getBucket(pick, opponent),
      bestOdds,
      bestBook,
      dgOdds,
      isDoubleSignal: false,
    });
  }
  return matchups.sort((a, b) => b.matchupScore - a.matchupScore);
}

export default function NextRoundPreview({ roundNumber, rankings, matchups, floor, course }: Props) {
  const [showAll, setShowAll] = useState(false);
  const allMatchups = useMemo(() => generateNextMatchups(rankings, matchups, floor), [rankings, matchups, floor]);
  const bestBets = useMemo(() => allMatchups.filter((m) => m.matchupScore >= floor), [allMatchups, floor]);
  const leans = useMemo(() => allMatchups.filter((m) => m.matchupScore < floor && m.matchupScore >= floor - 0.5), [allMatchups, floor]);

  if (matchups.length === 0) return null;

  const renderCards = (set: Matchup[]) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {set.map((m, i) => (
        <MatchupCard
          key={i}
          matchupScore={m.matchupScore}
          tier={m.tier}
          pick={m.pick}
          opponent={m.opponent}
          bestOdds={m.bestOdds}
          sportsbookLink={<SportsbookLink bookKey={m.bestBook} />}
          datasetChip="Cumulative data"
        />
      ))}
    </div>
  );

  return (
    <div className="mb-10">
      <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-[#22c55e]/15 text-[#22c55e] text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-['Inter',system-ui,sans-serif]">
            Round {roundNumber} · Picks
          </span>
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
            <span className="ml-2 text-[10px] font-bold font-['JetBrains_Mono','SF_Mono',monospace] bg-[#22c55e]/15 text-[#22c55e] rounded-full px-2 py-0.5 align-middle">
              {bestBets.length}
            </span>
          </h3>
          {renderCards(bestBets)}
        </div>
      )}

      {bestBets.length === 0 && leans.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace] mb-2">
            R{roundNumber} Leans
            <span className="ml-2 text-[10px] font-bold font-['JetBrains_Mono','SF_Mono',monospace] bg-[#22c55e]/15 text-[#22c55e] rounded-full px-2 py-0.5 align-middle">
              {leans.length}
            </span>
          </h3>
          <p className="text-xs text-[#a1a1aa] mb-3 font-['Inter',system-ui,sans-serif]">
            No matchups cleared the {floor.toFixed(2)} floor. Showing edges between {(floor - 0.5).toFixed(2)} and {floor.toFixed(2)}.
          </p>
          {renderCards(leans)}
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
          {showAll && <div className="mt-4">{renderCards(allMatchups)}</div>}
        </div>
      )}
    </div>
  );
}
