import { useState, useMemo, useRef, useEffect } from 'react';
import type { PlayerData, Matchup, BucketType, MatchupOddsEntry, TournamentId } from '../types';
import { TOURNAMENTS } from '../types';
import { r2MatchupOddsData, r3MatchupOddsData, r4MatchupOddsData } from '../data/matchupOdds';
import { heritageR2MatchupOdds } from '../data/heritageMatchupOdds';
import { threeBallOddsData, type ThreeBallOddsEntry } from '../data/threeBallData';
import SignalBadge from './SignalBadge';

interface MatchupsViewProps {
  data: PlayerData[];
  tournament?: TournamentId;
}

type MatchupSort = 'edge-high' | 'edge-low';
type MatchupRound = 'R2' | 'R3' | 'R4' | 'All';

function parseOdds(odds: string): number {
  const n = parseInt(odds, 10);
  if (isNaN(n)) return 999;
  return n;
}

function isBuySide(p: PlayerData): boolean {
  return ['STRONGEST BUY', 'STRONG BUY', 'BUY', 'LEAN BUY'].includes(p.signal);
}

function isFadeSide(p: PlayerData): boolean {
  return ['LEAN FADE', 'FADE', 'STRONG FADE', 'STRONGEST FADE', 'LEAN SELL', 'SELL', 'STRONG SELL', 'STRONGEST SELL'].includes(p.signal);
}

function getBucket(pick: PlayerData, opponent: PlayerData): BucketType {
  const pickBuy = isBuySide(pick);
  const oppFade = isFadeSide(opponent);
  if (pickBuy && oppFade) return 'BUY vs FADE';
  if (pickBuy) return 'BUY vs OTHER';
  if (oppFade) return 'FADE vs OTHER';
  return 'OTHER vs OTHER';
}

function generateMatchups(data: PlayerData[], oddsData: MatchupOddsEntry[]): Matchup[] {
  const playerMap = new Map<string, PlayerData>();
  data.forEach((p) => playerMap.set(p.player_name, p));

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
    fanduel: 'FanDuel',
    datagolf: 'DataGolf',
  };
  return names[book] || book;
}

const sportsbookUrls: Record<string, string> = {
  bet365: 'https://www.bet365.com/#/AC/B18/C20604387/D48/E1/F2/',
  Bet365: 'https://www.bet365.com/#/AC/B18/C20604387/D48/E1/F2/',
  betmgm: 'https://sports.betmgm.com/en/sports/golf-9',
  BetMGM: 'https://sports.betmgm.com/en/sports/golf-9',
  betonline: 'https://www.betonline.ag/sportsbook/golf',
  BetOnline: 'https://www.betonline.ag/sportsbook/golf',
  bovada: 'https://www.bovada.lv/sports/golf',
  Bovada: 'https://www.bovada.lv/sports/golf',
  caesars: 'https://www.caesars.com/sportsbook-and-casino/golf',
  Caesars: 'https://www.caesars.com/sportsbook-and-casino/golf',
  draftkings: 'https://sportsbook.draftkings.com/leagues/golf',
  DraftKings: 'https://sportsbook.draftkings.com/leagues/golf',
  fanduel: 'https://sportsbook.fanduel.com/golf',
  FanDuel: 'https://sportsbook.fanduel.com/golf',
  pinnacle: 'https://www.pinnacle.com/en/golf/',
  Pinnacle: 'https://www.pinnacle.com/en/golf/',
  pointsbet: 'https://pointsbet.com/sports/golf',
  PointsBet: 'https://pointsbet.com/sports/golf',
  unibet: 'https://www.unibet.com/betting/sports/golf',
  Unibet: 'https://www.unibet.com/betting/sports/golf',
  betcris: 'https://www.betcris.com/en/sports/golf',
  Betcris: 'https://www.betcris.com/en/sports/golf',
};

function SportsbookLink({ bookName }: { bookName: string }) {
  const url = sportsbookUrls[bookName];
  if (!url) {
    return <span className="text-[#d4d4d4]">({bookName})</span>;
  }
  return (
    <span className="text-[#d4d4d4]">
      (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#22c55e] hover:underline transition-colors"
      >
        {bookName}
        <span className="ml-0.5 text-[10px]">{'\u2197'}</span>
      </a>
      )
    </span>
  );
}

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

// --- 3-Ball Pick Types and Logic ---

interface ThreeBallPick {
  tier: 'BEST BET' | 'STRONG PLAY' | 'LEAN';
  pick: PlayerData;
  fades: [PlayerData, PlayerData];
  edge: number;
  bestOdds: string;
  bestBook: string;
  entry: ThreeBallOddsEntry;
  pickKey: 'p1' | 'p2' | 'p3';
}

function generateThreeBallPicks(data: PlayerData[]): ThreeBallPick[] {
  const playerMap = new Map<string, PlayerData>();
  data.forEach((p) => playerMap.set(p.player_name, p));

  const picks: ThreeBallPick[] = [];

  for (const entry of threeBallOddsData) {
    const players = [
      { key: 'p1' as const, name: entry.p1_player_name },
      { key: 'p2' as const, name: entry.p2_player_name },
      { key: 'p3' as const, name: entry.p3_player_name },
    ];

    const resolved = players.map(p => ({ ...p, data: playerMap.get(p.name) }));
    if (resolved.some(r => !r.data)) continue;

    // Find combos where exactly 2 are fades (x_score <= -0.50) and 1 is the pick
    const fadeThreshold = -0.50;
    const fadeIndices: number[] = [];
    const nonFadeIndices: number[] = [];

    resolved.forEach((r, i) => {
      if (r.data!.x_score <= fadeThreshold) {
        fadeIndices.push(i);
      } else {
        nonFadeIndices.push(i);
      }
    });

    // Must have exactly 2 fades and 1 non-fade
    if (fadeIndices.length !== 2 || nonFadeIndices.length !== 1) continue;

    const pickIdx = nonFadeIndices[0];
    const pickPlayer = resolved[pickIdx].data!;
    const fade1 = resolved[fadeIndices[0]].data!;
    const fade2 = resolved[fadeIndices[1]].data!;

    const fadeAvg = (fade1.x_score + fade2.x_score) / 2;
    const edge = +(pickPlayer.x_score - fadeAvg).toFixed(2);

    if (edge < 0.95) continue;

    // Find best odds for the pick
    const pickKey = resolved[pickIdx].key;
    let bestOdds = '';
    let bestBook = '';
    let bestOddsValue = -Infinity;

    for (const [book, vals] of Object.entries(entry.odds)) {
      if (book === 'datagolf') continue;
      const oddsStr = vals[pickKey];
      const oddsVal = parseOdds(oddsStr);
      if (oddsVal > bestOddsValue) {
        bestOddsValue = oddsVal;
        bestOdds = oddsStr;
        bestBook = book;
      }
    }

    let tier: ThreeBallPick['tier'] = 'LEAN';
    if (edge >= 1.95) tier = 'BEST BET';
    else if (edge >= 1.45) tier = 'STRONG PLAY';

    picks.push({
      tier,
      pick: pickPlayer,
      fades: [fade1, fade2],
      edge,
      bestOdds,
      bestBook: formatBookName(bestBook),
      entry,
      pickKey,
    });
  }

  picks.sort((a, b) => b.edge - a.edge);
  return picks;
}

// --- Player Stat Popup ---

function PlayerStatPopup({ player, onClose }: { player: PlayerData; onClose: () => void }) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const fmtScore = (v: number) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2));
  const scoreColor = (v: number) => (v > 0 ? 'text-[#22c55e]' : v < 0 ? 'text-red-400' : 'text-[#f5f5f5]');

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-[#111111] border border-[#262626] rounded-lg p-4 shadow-xl w-72 left-0 top-full mt-1"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
          {player.player_name}
        </span>
        <button onClick={onClose} className="text-[#a1a1aa] hover:text-white text-xs cursor-pointer">X</button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <SignalBadge signal={player.signal} />
        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          {player.purity}
        </span>
      </div>
      <div className="mb-3">
        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          X Score
        </span>
        <div className={`text-xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] ${scoreColor(player.x_score)}`}>
          {fmtScore(player.x_score)}
        </div>
      </div>
      <div className="border-t border-[#1a1a1a] pt-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          X Score Breakdown
        </span>
        <div className="grid grid-cols-2 gap-1 mt-1 text-xs font-['JetBrains_Mono','SF_Mono',monospace]">
          <span className="text-[#a1a1aa]">SG Score (L1)</span>
          <span className={scoreColor(player.sg_score_l1)}>{fmtScore(player.sg_score_l1)}</span>
          <span className="text-[#a1a1aa]">History (L2)</span>
          <span className={scoreColor(player.course_history_l2)}>{fmtScore(player.course_history_l2)}</span>
          <span className="text-[#a1a1aa]">Fit (L3)</span>
          <span className={scoreColor(player.fit_plus_category_l3)}>{fmtScore(player.fit_plus_category_l3)}</span>
          <span className="text-[#a1a1aa]">Major (L4)</span>
          <span className={scoreColor(player.major_adj_l4)}>{fmtScore(player.major_adj_l4)}</span>
        </div>
      </div>
      <div className="border-t border-[#1a1a1a] pt-2">
        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          Strokes Gained
        </span>
        <div className="grid grid-cols-2 gap-1 mt-1 text-xs font-['JetBrains_Mono','SF_Mono',monospace]">
          <span className="text-[#a1a1aa]">PUTT</span>
          <span className={scoreColor(player.sg_putt)}>{fmtScore(player.sg_putt)}</span>
          <span className="text-[#a1a1aa]">APP</span>
          <span className={scoreColor(player.sg_app)}>{fmtScore(player.sg_app)}</span>
          <span className="text-[#a1a1aa]">OTT</span>
          <span className={scoreColor(player.sg_ott)}>{fmtScore(player.sg_ott)}</span>
        </div>
      </div>
    </div>
  );
}

function ClickablePlayerName({
  player,
  className,
  children,
}: {
  player: PlayerData;
  className?: string;
  children?: React.ReactNode;
}) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        onClick={() => setShowPopup(!showPopup)}
        className={`cursor-pointer hover:underline decoration-[#22c55e]/50 underline-offset-2 ${className || ''}`}
      >
        {children || player.player_name}
      </span>
      {showPopup && <PlayerStatPopup player={player} onClose={() => setShowPopup(false)} />}
    </span>
  );
}

// --- Main Component ---

function MatchupDefinitionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Matchup Definitions
          </h3>
          <button
            onClick={onClose}
            className="text-[#d4d4d4] hover:text-white text-xl cursor-pointer"
          >
            x
          </button>
        </div>
        <div className="space-y-3 text-sm font-['Inter',system-ui,sans-serif]">
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">X Score</span>
            <p className="text-[#d4d4d4] mt-1">The BirdieX proprietary putting regression rating</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">Edge</span>
            <p className="text-[#d4d4d4] mt-1">X Score difference between the pick and opponent</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">Pure Buy</span>
            <p className="text-[#d4d4d4] mt-1">OTT and APP both support the buy signal (neither below -0.45)</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">Pure Sell</span>
            <p className="text-[#d4d4d4] mt-1">OTT and APP both support the sell signal (neither above +0.45)</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">Conflicted</span>
            <p className="text-[#d4d4d4] mt-1">One of OTT or APP contradicts the signal direction</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">Best Odds</span>
            <p className="text-[#d4d4d4] mt-1">The most favorable odds available across all sportsbooks</p>
          </div>
          <div>
            <span className="text-[#22c55e] font-semibold">Tier Thresholds</span>
            <p className="text-[#d4d4d4] mt-1">
              <span className="text-[#22c55e] font-medium">BEST BET:</span> Edge &gt;= 1.95 &nbsp;|&nbsp;
              <span className="text-emerald-400 font-medium">STRONG PLAY:</span> Edge 1.45-1.94 &nbsp;|&nbsp;
              <span className="text-[#a1a1aa] font-medium">LEAN:</span> Edge 0.95-1.44
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchupsView({ data, tournament = 'masters' }: MatchupsViewProps) {
  return <MatchupsBody data={data} tournament={tournament} />;
}

function MatchupsBody({ data, tournament }: { data: PlayerData[]; tournament: TournamentId }) {
  const isHeritage = tournament === 'heritage';
  const availableRounds: MatchupRound[] = isHeritage ? ['R2'] : ['R2', 'R3', 'R4', 'All'];
  const [sortBy, setSortBy] = useState<MatchupSort>('edge-high');
  const [roundFilter, setRoundFilter] = useState<MatchupRound>(isHeritage ? 'R2' : 'R4');
  const [showDefinitions, setShowDefinitions] = useState(false);

  const activeOddsData = useMemo(() => {
    if (isHeritage) return heritageR2MatchupOdds;
    switch (roundFilter) {
      case 'R2': return r2MatchupOddsData;
      case 'R3': return r3MatchupOddsData;
      case 'R4': return r4MatchupOddsData;
      case 'All': return [...r2MatchupOddsData, ...r3MatchupOddsData, ...r4MatchupOddsData];
    }
  }, [roundFilter, isHeritage]);

  const rawMatchups = useMemo(() => generateMatchups(data, activeOddsData), [data, activeOddsData]);
  const threeBallPicks = useMemo(() => generateThreeBallPicks(data), [data]);

  const matchups = useMemo(() => {
    const sorted = [...rawMatchups];
    switch (sortBy) {
      case 'edge-high':
        sorted.sort((a, b) => b.matchupScore - a.matchupScore);
        break;
      case 'edge-low':
        sorted.sort((a, b) => a.matchupScore - b.matchupScore);
        break;
    }
    return sorted;
  }, [rawMatchups, sortBy]);

  const fmtXScore = (v: number) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2));

  return (
    <div>
      {/* Tournament banner */}
      <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-[#22c55e]/15 text-[#22c55e] text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-['Inter',system-ui,sans-serif]">
            {TOURNAMENTS[tournament].status}
          </span>
        </div>
        <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
          {isHeritage
            ? `${TOURNAMENTS.heritage.name} R2 matchup picks at ${TOURNAMENTS.heritage.course}. X Score edge is computed from R1 strokes-gained with Harbour Town course-fit weighting. Best odds shown across all books that posted a line.`
            : 'The Masters 2026 is complete. The matchups below show the R4 picks that were recommended by the X Score model. Check the Results tab for full tournament performance: 130-70-21, +46.60u, 17.8% ROI.'}
        </p>
      </div>

      {showDefinitions && <MatchupDefinitionsModal onClose={() => setShowDefinitions(false)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
              {roundFilter === 'All' ? 'All Rounds' : roundFilter} Matchup Recommendations (Historical)
            </h2>
            <p className="text-sm text-[#d4d4d4] mt-1 font-['Inter',system-ui,sans-serif]">
              Picks ranked by X Score edge -- Min edge: 0.95
            </p>
          </div>
          <button
            onClick={() => setShowDefinitions(true)}
            className="w-5 h-5 rounded-full border border-[#22c55e]/50 text-[#22c55e] text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-[#22c55e]/10 transition-colors shrink-0"
          >
            ?
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-[#22c55e]/50 rounded-full p-0.5">
            {availableRounds.map((r) => (
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as MatchupSort)}
            className="bg-[#0a0a0a] border border-[#22c55e]/50 rounded-lg px-3 py-1.5 text-xs text-[#f5f5f5] focus:outline-none focus:border-[#22c55e] font-['Inter',system-ui,sans-serif] cursor-pointer"
          >
            <option value="edge-high">Edge: High &rarr; Low</option>
            <option value="edge-low">Edge: Low &rarr; High</option>
          </select>
        </div>
      </div>

      {/* 2-column layout (Heritage: full width, no 3-balls yet) */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: H2H Matchups */}
        <div className={`w-full ${isHeritage ? '' : 'md:w-[60%]'}`}>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
              H2H Matchups
            </h3>
            <span className="text-[10px] font-bold font-['JetBrains_Mono','SF_Mono',monospace] bg-[#22c55e]/15 text-[#22c55e] rounded-full px-2 py-0.5">
              {matchups.length}
            </span>
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

                <div className="border-t border-[#1a1a1a] mb-3" />

                {/* Players row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                      <ClickablePlayerName player={m.pick}>
                        {m.pick.player_name}
                      </ClickablePlayerName>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e]">
                        X Score: {fmtXScore(m.pick.x_score)}
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

                  <div className="text-[#d4d4d4] text-xs font-bold font-['Inter',system-ui,sans-serif] shrink-0">
                    vs
                  </div>

                  <div className="flex-1 text-right">
                    <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                      <ClickablePlayerName player={m.opponent}>
                        {m.opponent.player_name}
                      </ClickablePlayerName>
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
                        X Score: {fmtXScore(m.opponent.x_score)}
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
                    {' '}<SportsbookLink bookName={m.bestBook} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3-Ball Picks (Masters only) */}
        {!isHeritage && <div className="w-full md:w-[40%]">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
              3-Ball Picks
            </h3>
            <span className="text-[10px] font-bold font-['JetBrains_Mono','SF_Mono',monospace] bg-[#22c55e]/15 text-[#22c55e] rounded-full px-2 py-0.5">
              {threeBallPicks.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {threeBallPicks.length === 0 && (
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 text-center text-sm text-[#a1a1aa]">
                No qualifying 3-ball picks found (need 2 fades with edge &gt;= 0.95)
              </div>
            )}
            {threeBallPicks.map((tb, idx) => (
              <div
                key={idx}
                className={`bg-[#0a0a0a] border border-[#262626] border-l-4 ${tierBorderColor[tb.tier]} rounded-lg p-4 hover:bg-[#111111] transition-colors`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-semibold font-['Inter',system-ui,sans-serif] ${tierBadgeColor[tb.tier]} ${
                      tb.tier === 'BEST BET' ? 'animate-pulse' : ''
                    }`}
                  >
                    {tb.tier}
                  </span>
                  <span className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
                    Edge:{' '}
                    <span className="text-[#22c55e] font-bold font-['JetBrains_Mono','SF_Mono',monospace]">
                      {tb.edge.toFixed(2)}
                    </span>
                  </span>
                </div>

                <div className="border-t border-[#1a1a1a] mb-3" />

                {/* Pick */}
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif]">
                      PICK:
                    </span>
                    <span className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                      <ClickablePlayerName player={tb.pick}>
                        {tb.pick.player_name}
                      </ClickablePlayerName>
                    </span>
                    {isBuySide(tb.pick) && (
                      <span className="text-[10px] text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif]">
                        BUY
                        <svg width="8" height="8" viewBox="0 0 16 16" className="inline ml-0.5 -mt-0.5">
                          <path fill="currentColor" d="M6.5 12.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e] ml-10">
                    X: {fmtXScore(tb.pick.x_score)}
                  </span>
                </div>

                {/* Fades */}
                {tb.fades.map((fade, fi) => (
                  <div key={fi} className="mb-1 ml-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">vs</span>
                      <span className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
                        <ClickablePlayerName player={fade} className="text-[#d4d4d4]">
                          {fade.player_name}
                        </ClickablePlayerName>
                      </span>
                      <span className="text-[10px] text-red-400 font-medium font-['Inter',system-ui,sans-serif]">
                        FADE
                      </span>
                    </div>
                    <span className="text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-red-400 ml-8">
                      X: {fmtXScore(fade.x_score)}
                    </span>
                  </div>
                ))}

                {/* Best odds */}
                <div className="border-t border-[#1a1a1a] mt-3 pt-2">
                  <div className="text-xs font-['Inter',system-ui,sans-serif]">
                    <span className="text-[#d4d4d4]">Best Odds: </span>
                    <span className="text-[#f5f5f5] font-bold font-['JetBrains_Mono','SF_Mono',monospace]">
                      {tb.bestOdds}
                    </span>
                    {' '}<SportsbookLink bookName={tb.bestBook} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>}
      </div>
    </div>
  );
}
