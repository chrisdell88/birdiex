import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { PlayerData, Matchup, BucketType, MatchupOddsEntry, DataSet } from '../types';
import { currentEvent } from '../config/event';
import SignalBadge from './SignalBadge';
import PlayerSearch from './PlayerSearch';
import RecommendedFloorBadge from './RecommendedFloorBadge';
import { tierForEdge } from '../lib/sizing';
import NextRoundPreview from './NextRoundPreview';
import MatchupCard from './MatchupCard';
import { isBuy, isFade } from '../lib/signalDisplay';
import MatchupsGlossary from './MatchupsGlossary';
import { formatPlayerName } from '../lib/formatName';
import PurityIcon from './PurityIcon';

interface MatchupsViewProps {
  data: PlayerData[];
  dataSet: DataSet;
  onDataSetChange: (ds: DataSet) => void;
}

type MatchupSort = 'edge-high' | 'edge-low';

function parseOdds(odds: string): number {
  const n = parseInt(odds, 10);
  if (isNaN(n)) return 999;
  return n;
}

function isBuySide(p: PlayerData): boolean {
  // Normalized 7-tier: any buy tier (STRONG BUY / BUY / SOFT BUY).
  return isBuy(p.signal);
}

function isFadeSide(p: PlayerData): boolean {
  // Normalized 7-tier: any fade tier (SOFT FADE / FADE / STRONG FADE).
  return isFade(p.signal);
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

    // Tier is venue-aware: BEST BET ≥ venue floor, STRONG PLAY ≥ floor−0.5.
    // Single source of truth lives in src/lib/sizing.ts::tierForEdge.
    const tier: Matchup['tier'] = tierForEdge(matchupScore, currentEvent.recommendedFloor);

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

// --- Player Stat Popup ---

function PlayerStatPopup({ player, onClose, dataSet, align = 'left' }: { player: PlayerData; onClose: () => void; dataSet?: 'round-only' | 'cumulative'; align?: 'left' | 'right' }) {
  // Suppress signal pre-R1 — it isn't meaningful before live SG data exists.
  const hideSignal = currentEvent.picksRound <= 1;
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

  const completedRound = Math.max(0, currentEvent.picksRound - 1);
  const dsLabel = dataSet === 'round-only'
    ? `Round ${completedRound} data`
    : dataSet === 'cumulative'
      ? 'Cumulative data'
      : null;

  return (
    <div
      ref={popupRef}
      // Pure black background + green border for active-selection feel.
      // w-72 preferred, capped to viewport so it never overflows mobile.
      // Anchor left for the pick (left side of card), right for the
      // opponent — otherwise the popup opens off-screen for the right
      // player on narrow viewports.
      className={`absolute z-50 bg-[#0a0a0a] border border-[#22c55e]/40 rounded-lg p-4 shadow-xl w-72 max-w-[calc(100vw-2rem)] top-full mt-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif] truncate pr-2">
          {formatPlayerName(player.player_name)}
        </span>
        <button onClick={onClose} className="text-[#a1a1aa] hover:text-white text-xs cursor-pointer shrink-0">X</button>
      </div>
      {!hideSignal && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <SignalBadge signal={player.signal} conflicted={player.purity === 'CONFLICTED'} />
          <PurityIcon player={player} />
        </div>
      )}
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
        {/* 3-col grid: label | source tag | value. The dedicated tag
            column means 'historical' / 'profile' / 'live' never wrap
            into a second line. */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-2 gap-y-1 mt-1 text-xs font-['JetBrains_Mono','SF_Mono',monospace] items-baseline">
          <span className="text-[#a1a1aa]">SG Score (L1)</span>
          <span className="text-[9px] text-[#525252] font-['Inter',system-ui,sans-serif] normal-case tracking-normal">live</span>
          <span className={`text-right ${scoreColor(player.sg_score_l1)}`}>{fmtScore(player.sg_score_l1)}</span>

          <span className="text-[#a1a1aa]">History (L2)</span>
          <span className="text-[9px] text-[#525252] font-['Inter',system-ui,sans-serif] normal-case tracking-normal">historical</span>
          <span className={`text-right ${scoreColor(player.course_history_l2)}`}>{fmtScore(player.course_history_l2)}</span>

          <span className="text-[#a1a1aa]">Fit (L3)</span>
          <span className="text-[9px] text-[#525252] font-['Inter',system-ui,sans-serif] normal-case tracking-normal">profile</span>
          <span className={`text-right ${scoreColor(player.fit_plus_category_l3)}`}>{fmtScore(player.fit_plus_category_l3)}</span>

          <span className="text-[#a1a1aa]">Major (L4)</span>
          <span className="text-[9px] text-[#525252] font-['Inter',system-ui,sans-serif] normal-case tracking-normal">historical</span>
          <span className={`text-right ${scoreColor(player.major_adj_l4)}`}>{fmtScore(player.major_adj_l4)}</span>
        </div>
      </div>
      <div className="border-t border-[#1a1a1a] pt-2">
        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          Strokes Gained <span className="text-[9px] text-[#525252] normal-case tracking-normal">({dsLabel ?? 'live'})</span>
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
  dataSet,
  align,
}: {
  player: PlayerData;
  className?: string;
  children?: React.ReactNode;
  dataSet?: 'round-only' | 'cumulative';
  align?: 'left' | 'right';
}) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        onClick={() => setShowPopup(!showPopup)}
        className={`cursor-pointer hover:underline decoration-[#22c55e]/50 underline-offset-2 ${className || ''}`}
      >
        {children || formatPlayerName(player.player_name)}
      </span>
      {showPopup && <PlayerStatPopup player={player} onClose={() => setShowPopup(false)} dataSet={dataSet} align={align} />}
    </span>
  );
}

// --- Main Component ---

function MatchupDefinitionsModal({ onClose }: { onClose: () => void }) {
  // Render to document.body via a portal so the modal escapes any parent
  // stacking context, transform, overflow, or contain rule. This was the
  // recurring "? button does nothing" bug — the modal was technically
  // mounting but getting trapped by an ancestor's stacking context. Portal
  // moves it to <body> so fixed positioning works against the viewport.
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70" onClick={onClose}>
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
            <span className="text-[#22c55e] font-semibold">Matchup Score</span>
            <p className="text-[#d4d4d4] mt-1">X Score difference between the pick and opponent. Higher = more conviction.</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">Best Bet</span>
            <p className="text-[#d4d4d4] mt-1">A matchup at or above the venue's Best Bet Matchup Score Threshold. These are the bets we officially track.</p>
          </div>
          <div>
            <span className="text-[#22c55e] font-semibold">Best Bet Matchup Score Threshold</span>
            <p className="text-[#d4d4d4] mt-1">Venue-specific cutoff above which a model pick counts as a Best Bet. Lower at predictable courses, higher at unpredictable ones.</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function MatchupsView(_: MatchupsViewProps) {
  // Props are kept for API parity with the rest of the app but no longer
  // used here — we read both datasets directly from currentEvent and
  // combine them, with each card labelled by source.
  void _;
  const [sortBy, setSortBy] = useState<MatchupSort>('edge-high');
  const [showDefinitions, setShowDefinitions] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const isPreTournament = currentEvent.picksRound <= 1;

  // Build matchups for BOTH datasets and combine. Cards display a chip
  // for the dataset they came from; duplicates (same pick+opp in both)
  // get a 'DOUBLE SIGNAL' marker so the user can see when round-only and
  // cumulative agree. Tracking treats each as its own bet — when both
  // signals fire, the pick is implicitly bet 2x (per Chris's rule).
  //
  // Pre-tournament + R2 picks: round-only == cumulative (only one round of
  // data exists), so we skip the duplicate combine and just show one set.
  const datasetsIdentical = currentEvent.picksRound <= 2;

  const roundMatchups = useMemo(
    () => generateMatchups(currentEvent.rankingsRound, currentEvent.matchups),
    [],
  );
  const cumulativeMatchups = useMemo(
    () => generateMatchups(currentEvent.rankingsCumulative, currentEvent.matchups),
    [],
  );

  const floor = currentEvent.recommendedFloor;

  const rawMatchups = useMemo(() => {
    if (datasetsIdentical) {
      return cumulativeMatchups.map((m) => ({
        ...m,
        dataSet: 'cumulative' as const,
        doubleSignal: false,
      }));
    }
    const keyOf = (m: Matchup) => `${m.pick.player_name}::${m.opponent.player_name}`;
    // Double Signal = SAME matchup is a Best Bet (edge ≥ venue floor) in
    // BOTH datasets. Not "appears in both above 0.95" — that gave false
    // positives where a Best Bet in cumulative was flagged just because
    // a low-edge version of the pair also existed in round-only.
    const roundBBKeys = new Set(roundMatchups.filter((m) => m.matchupScore >= floor).map(keyOf));
    const cumBBKeys = new Set(cumulativeMatchups.filter((m) => m.matchupScore >= floor).map(keyOf));
    const bothBB = (m: Matchup) => roundBBKeys.has(keyOf(m)) && cumBBKeys.has(keyOf(m));

    const tagged: Array<Matchup & { dataSet: 'round-only' | 'cumulative'; doubleSignal: boolean }> = [];
    for (const m of roundMatchups) {
      tagged.push({ ...m, dataSet: 'round-only', doubleSignal: bothBB(m) });
    }
    for (const m of cumulativeMatchups) {
      tagged.push({ ...m, dataSet: 'cumulative', doubleSignal: bothBB(m) });
    }
    return tagged;
  }, [roundMatchups, cumulativeMatchups, datasetsIdentical, floor]);

  // Three bands:
  //   bestBets — matchupScore ≥ venue floor (the tracked recommendations)
  //   leans    — immediate snap-tier below floor (close calls; shown as a
  //              fallback when Best Bets is empty so the user always sees
  //              SOMETHING when they click Best Bets)
  //   below    — further below floor (research only; only visible in
  //              All Matchups view)
  const bestBets = useMemo(
    () => rawMatchups.filter((m) => m.matchupScore >= floor),
    [rawMatchups, floor],
  );
  const leans = useMemo(
    () => rawMatchups.filter((m) => m.matchupScore >= floor - 0.5 && m.matchupScore < floor),
    [rawMatchups, floor],
  );

  // Default view:
  //   • PRE-R1 → All Matchups (we don't track anything pre-tournament)
  //   • POST-R1 → Best Bets (UI handles the empty case with a Leans fallback,
  //     so the button is always clickable and we always land on tracked-first)
  const [showAll, setShowAll] = useState<boolean>(isPreTournament);

  // All unique player names that appear in qualifying matchups
  const matchupPlayerNames = useMemo(() => {
    const names = new Set<string>();
    rawMatchups.forEach((m) => {
      names.add(m.pick.player_name);
      names.add(m.opponent.player_name);
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [rawMatchups]);

  // Sort + selectedPlayer filter applied to whichever set we render.
  const refine = useMemo(() => {
    return (set: Matchup[]): Matchup[] => {
      let sorted = [...set];
      if (sortBy === 'edge-high') sorted.sort((a, b) => b.matchupScore - a.matchupScore);
      else sorted.sort((a, b) => a.matchupScore - b.matchupScore);
      if (selectedPlayer) {
        sorted = sorted.filter(
          (m) =>
            m.pick.player_name === selectedPlayer ||
            m.opponent.player_name === selectedPlayer
        );
      }
      return sorted;
    };
  }, [sortBy, selectedPlayer]);

  const displayBestBets = useMemo(() => refine(bestBets), [refine, bestBets]);
  const displayLeans = useMemo(() => refine(leans), [refine, leans]);
  const displayAll = useMemo(() => refine(rawMatchups), [refine, rawMatchups]);

  // When showAll is false we're in "Best Bets" mode. If there are zero best
  // bets we fall through to the Leans subsection instead of an empty grid.
  const showLeansFallback = !showAll && displayBestBets.length === 0;

  // Pre-R1 we hide signal + purity icons (no live SG data to back them up).
  const hideSignal = isPreTournament;

  // After the final round, there are no upcoming matchups. Show a clean
  // "complete" placeholder instead of stale picks. Rendered AFTER all hooks
  // (Rules of Hooks: never return early before hooks fire — React 19's
  // compiler will crash the component if you do).
  if (currentEvent.isComplete) {
    return (
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-8 text-center">
        <h2 className="text-lg font-bold text-[#f5f5f5] font-['JetBrains_Mono','SF_Mono',monospace] uppercase tracking-wider mb-2">
          {currentEvent.name} — Complete
        </h2>
        <p className="text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mb-4">
          The tournament is over. New matchups will appear once the next event opens.
        </p>
        <p className="text-xs text-[#737373] font-['Inter',system-ui,sans-serif]">
          See the <span className="text-[#22c55e]">Results</span> tab for the final graded record.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Next-round picks — when sportsbooks post the next round's H2H lines
          ahead of the current round finishing (e.g. R4 while R3 is suspended),
          render the same Best Bets cards using cumulative-through-{N-1}
          X-Scores. Books only post matchups for players who completed the
          prior round, so edges are clean for everyone in the section. */}
      {currentEvent.nextRoundMatchups && currentEvent.nextRoundNumber && currentEvent.nextRoundRankings && (
        <NextRoundPreview
          roundNumber={currentEvent.nextRoundNumber}
          rankings={currentEvent.nextRoundRankings}
          matchups={currentEvent.nextRoundMatchups}
          floor={currentEvent.recommendedFloor}
          course={currentEvent.course}
        />
      )}

      {/* Round picks banner */}
      <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-[#22c55e]/15 text-[#22c55e] text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-['Inter',system-ui,sans-serif]">
            ROUND {currentEvent.picksRound}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            {currentEvent.name}
          </span>
          {currentEvent.picksRound > 1 && (
            <RecommendedFloorBadge
              threshold={currentEvent.recommendedFloor}
              course={currentEvent.course}
            />
          )}
          {currentEvent.picksRound <= 1 && (
            <span className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
              BirdieX model starts tracking at R2.
            </span>
          )}
        </div>
      </div>

      {showDefinitions && <MatchupDefinitionsModal onClose={() => setShowDefinitions(false)} />}

      {/* Player search */}
      <div className="mb-5">
        <PlayerSearch
          players={matchupPlayerNames}
          selected={selectedPlayer}
          onSelect={setSelectedPlayer}
          onClear={() => setSelectedPlayer(null)}
          placeholder="Filter by player..."
        />
        {selectedPlayer && (() => {
          // Count matches the set currently being rendered.
          const count = showAll
            ? displayAll.length
            : showLeansFallback
              ? displayLeans.length
              : displayBestBets.length;
          return (
            <p className="mt-2 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
              Showing matchups involving{' '}
              <span className="text-[#22c55e] font-medium">{selectedPlayer}</span>
              {' '}({count} result{count !== 1 ? 's' : ''})
            </p>
          );
        })()}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
              R{currentEvent.picksRound} Matchups
            </h2>
            <p className="text-sm text-[#d4d4d4] mt-1 font-['Inter',system-ui,sans-serif]">
              {currentEvent.picksRound <= 1 ? (
                <>Browse for context &mdash; R1 picks are not tracked.</>
              ) : (
                <>
                  Best Bet Matchup Score Threshold:{' '}
                  <span className="font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e]">
                    ≥ {currentEvent.recommendedFloor.toFixed(2)}
                  </span>{' '}
                  at {currentEvent.course}.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            aria-label="Open matchup definitions"
            onClick={(e) => {
              e.stopPropagation();
              setShowDefinitions(true);
            }}
            className="w-5 h-5 rounded-full border border-[#22c55e]/50 text-[#22c55e] text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-[#22c55e]/10 transition-colors shrink-0"
          >
            ?
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Best Bets / All Matchups toggle — hidden pre-R1 since we don't
              track anything there. Both buttons are always clickable; when
              Best Bets has zero matches the UI falls through to a Leans
              section so users never land on a fully empty view. */}
          {!isPreTournament && (
            <div className="flex border border-[#22c55e]/50 rounded-full p-0.5">
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-medium rounded-full font-['Inter',system-ui,sans-serif] cursor-pointer transition-colors ${
                  !showAll ? 'bg-[#22c55e] text-[#0a0a0a]' : 'text-[#d4d4d4] hover:text-white'
                }`}
              >
                Best Bets
              </button>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-medium rounded-full font-['Inter',system-ui,sans-serif] cursor-pointer transition-colors ${
                  showAll ? 'bg-[#22c55e] text-[#0a0a0a]' : 'text-[#d4d4d4] hover:text-white'
                }`}
              >
                All Matchups
              </button>
            </div>
          )}

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

      {/* Card renderer — delegates to the canonical MatchupCard template.
          Every matchup-card surface on the site renders through that one
          component; the dataset chip + name wrapper differ per surface. */}
      {(() => {
        const renderCard = (m: Matchup & { dataSet?: 'round-only' | 'cumulative'; doubleSignal?: boolean }, idx: number) => {
          const dsLabel = m.dataSet === 'round-only'
            ? `Round ${currentEvent.picksRound - 1} data`
            : m.dataSet === 'cumulative'
              ? 'Cumulative data'
              : null;
          return (
            <MatchupCard
              key={idx}
              matchupScore={m.matchupScore}
              tier={m.tier}
              pick={m.pick}
              opponent={m.opponent}
              bestOdds={m.bestOdds}
              sportsbookLink={<SportsbookLink bookName={m.bestBook} />}
              datasetChip={dsLabel}
              hideSignal={hideSignal}
              doubleSignal={m.doubleSignal}
              renderPickName={(p) => (
                <ClickablePlayerName player={p} dataSet={m.dataSet}>
                  {formatPlayerName(p.player_name)}
                </ClickablePlayerName>
              )}
              renderOpponentName={(p) => (
                <ClickablePlayerName player={p} dataSet={m.dataSet} align="right">
                  {formatPlayerName(p.player_name)}
                </ClickablePlayerName>
              )}
            />
          );
        };

        // All Matchups mode — just dump the full set.
        if (showAll) {
          return (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
                  H2H Matchups
                </h3>
                <span className="text-[10px] font-bold font-['JetBrains_Mono','SF_Mono',monospace] bg-[#22c55e]/15 text-[#22c55e] rounded-full px-2 py-0.5">
                  {displayAll.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayAll.length === 0 && (
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6 text-center md:col-span-2">
                    <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed max-w-md mx-auto">
                      No matchups to show. The field may not be pulled yet
                      for this round.
                    </p>
                  </div>
                )}
                {displayAll.map((m, i) => renderCard(m, i))}
              </div>
            </div>
          );
        }

        // Best Bets mode — show tracked bets, OR fall through to Leans when
        // the tracked set is empty.
        return (
          <>
            {!showLeansFallback && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
                    Best Bets
                  </h3>
                  <span className="text-[10px] font-bold font-['JetBrains_Mono','SF_Mono',monospace] bg-[#22c55e]/15 text-[#22c55e] rounded-full px-2 py-0.5">
                    {displayBestBets.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayBestBets.map((m, i) => renderCard(m, i))}
                </div>
              </div>
            )}

            {showLeansFallback && (
              <>
                <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 mb-6">
                  <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
                    No current matchups cross the Best Bet Matchup Score
                    Threshold (≥{' '}
                    <span className="font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e]">
                      {floor.toFixed(2)}
                    </span>
                    ) for Round {currentEvent.picksRound}. Showing{' '}
                    <span className="text-[#22c55e] font-semibold">Leans</span>{' '}
                    instead — the tier just below the threshold.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
                      Leans
                    </h3>
                    <span className="text-[10px] font-bold font-['JetBrains_Mono','SF_Mono',monospace] bg-[#22c55e]/15 text-[#22c55e] rounded-full px-2 py-0.5">
                      {displayLeans.length}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
                      {(floor - 0.5).toFixed(2)} – {floor.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayLeans.length === 0 && (
                      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6 text-center md:col-span-2">
                        <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed max-w-md mx-auto">
                          No matchups in the Leans band either. Switch to{' '}
                          <span className="text-[#22c55e]">All Matchups</span>{' '}
                          to see the full model output.
                        </p>
                      </div>
                    )}
                    {displayLeans.map((m, i) => renderCard(m, i))}
                  </div>
                </div>
              </>
            )}
          </>
        );
      })()}

      {/* Glossary — always at the bottom, mirrors the Rankings page. */}
      <MatchupsGlossary />
    </div>
  );
}
