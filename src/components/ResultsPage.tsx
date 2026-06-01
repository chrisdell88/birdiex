import { useState, useMemo } from 'react';
import type { BetRecord, TierType, ResultsSortField, SortDirection, Sportsbook } from '../types';
import PlayerSearch from './PlayerSearch';
import RecommendedFloorBadge from './RecommendedFloorBadge';
import EquityCurve from './EquityCurve';
import HitRateByTier from './HitRateByTier';
import TournamentSummaryBanner from './TournamentSummaryBanner';
import { r2Results, r2Summary as pgaR2SummaryRaw } from '../data/pgaChampR2Results';
import { r3Results, r3Summary as pgaR3SummaryRaw } from '../data/pgaChampR3Results';
import { r4Results, r4Summary as pgaR4SummaryRaw } from '../data/pgaChampR4Results';
import { r2Results as cjR2RawBets } from '../data/cjCupR2Results';
import { r3Results as cjR3RawBets } from '../data/cjCupR3Results';
import { r4Results as cjR4RawBets } from '../data/cjCupR4Results';
// Charles Schwab — IN PROGRESS event. Picked up dynamically via Vite glob,
// so any cscR<N>Results.ts file the auto-roll drops gets wired in on the
// next deploy — no manual import per round.
const cscResultModules = import.meta.glob<Record<string, unknown>>(
  '../data/cscR*Results.ts',
  { eager: true }
);
import { starsForEdge, unitsForEdge, stakeToWin1 } from '../lib/sizing';
import { floorForEvent } from '../config/venues';
import {
  overallRecord,
  overallUnits,
  overallROI,
  r2Summary,
  r3RoundOnlySummary,
  r3CumulativeSummary,
  r4RoundOnlySummary,
  r4CumulativeSummary,
  totalBucketBreakdowns,
  r2BucketBreakdowns,
  r3ROBucketBreakdowns,
  r3CumBucketBreakdowns,
  r4ROBucketBreakdowns,
  r4CumBucketBreakdowns,
  dataSetComparison,
  betLog,
} from '../data/resultsData';

// ─────────────────────────────────────────────────────────────────
// VENUE-AWARE RECOMMENDED-FLOOR FILTERING
// ─────────────────────────────────────────────────────────────────
// Every event has a venue-specific floor (see src/config/venues.ts). The
// public/displayed record is the subset of graded bets at or above that
// floor — the "tracked" or "recommended" bets. The raw bet arrays still
// contain every bet from 0.95+ (kept for internal backtesting).

const mastersFloor = floorForEvent('masters-2026');
const pgaFloor = floorForEvent('pga-2026');
const cjCupFloor = floorForEvent('cj-cup-byron-nelson-2026');
const cscFloor = floorForEvent('charles-schwab-challenge-2026');

// Single source of truth for the trackedAt + summarise pair, shared with
// BacktestLab. Guarantees both pages cannot disagree about the same
// (bets, floor) input.
import { trackedAt, summariseBets as summarise } from '../lib/statSummarise';

// Tracked-bet subsets per event.
const mastersTracked = trackedAt(betLog, mastersFloor.floor);
const pgaR2Tracked = trackedAt(r2Results, pgaFloor.floor);
const pgaR3Tracked = trackedAt(r3Results, pgaFloor.floor);
const pgaR4Tracked = trackedAt(r4Results, pgaFloor.floor);
const pgaTracked = [...pgaR2Tracked, ...pgaR3Tracked, ...pgaR4Tracked];

// Venue-aware summaries (replace the raw imports for display purposes).
const mastersSummary = summarise(mastersTracked);
const pgaR2Summary = summarise(pgaR2Tracked);
const pgaR3Summary = summarise(pgaR3Tracked);
const pgaR4Summary = summarise(pgaR4Tracked);
const pgaSummary = summarise(pgaTracked);

// CJ Cup — COMPLETE after R4. Filter to Best Bets only at the venue floor.
const cjR2Tracked = trackedAt(cjR2RawBets, cjCupFloor.floor);
const cjR3Tracked = trackedAt(cjR3RawBets, cjCupFloor.floor);
const cjR4Tracked = trackedAt(cjR4RawBets, cjCupFloor.floor);
const cjR2Summary = summarise(cjR2Tracked);
const cjR3Summary = summarise(cjR3Tracked);
const cjR4Summary = summarise(cjR4Tracked);
const cjTracked = [...cjR2Tracked, ...cjR3Tracked, ...cjR4Tracked];
const cjSummary = summarise(cjTracked);

// Charles Schwab — IN PROGRESS. Auto-roll drops cscR<N>Results.ts files as
// each round grades; the Vite glob above picks them up at build time, so
// THIS BLOCK NEEDS NO PER-ROUND EDITS. Sort by round, then summarise.
const cscRounds = Object.entries(cscResultModules)
  .map(([path, mod]) => {
    const m = path.match(/cscR(\d+)Results\.ts$/);
    if (!m) return null;
    const round = Number(m[1]);
    const bets = (mod as Record<string, unknown>)[`r${round}Results`] as BetRecord[] | undefined;
    if (!Array.isArray(bets)) return null;
    const tracked = trackedAt(bets, cscFloor.floor);
    return { round, bets: tracked, summary: summarise(tracked) };
  })
  .filter((x): x is { round: number; bets: BetRecord[]; summary: ReturnType<typeof summarise> } => x !== null)
  .sort((a, b) => a.round - b.round);
const cscTracked = cscRounds.flatMap((r) => r.bets);
const cscSummary = summarise(cscTracked);

// All-time = Masters + PGA + CJ Cup + Charles Schwab (all tracked Best Bets).
const ALL_TIME_BETS = [...mastersTracked, ...pgaTracked, ...cjTracked, ...cscTracked];

// Silence unused-import warnings — these raw summaries are kept for
// reference / backtesting comparisons; the venue-aware values above
// are what's actually rendered.
void pgaR2SummaryRaw; void pgaR3SummaryRaw; void pgaR4SummaryRaw;

// ─────────────────────────────────────────────────────────────────
// EVENT REGISTRY — single source of truth for the tournaments shown
// in the picker, the All-Time card grid, and the default-view logic.
// To add a new event: append an entry here with status: 'IN PROGRESS';
// flip to 'COMPLETE' when it ends. The Results page automatically
// defaults to whichever event is currently IN PROGRESS, or falls back
// to All-Time when nothing is live.
// ─────────────────────────────────────────────────────────────────
type EventStatus = 'IN PROGRESS' | 'COMPLETE';
interface EventEntry {
  id: 'masters-2026' | 'pga-2026' | 'cj-cup-byron-nelson-2026' | 'charles-schwab-challenge-2026';
  name: string;
  status: EventStatus;
  wins: number;
  losses: number;
  pushes: number;
  units: number;
  roi: number;
  /** Numeric matchup-score threshold (edge cutoff) at this venue. */
  threshold: number;
  /** Course name. */
  course: string;
  /** Course predictability score. */
  predictability: number;
}

const EVENT_REGISTRY: EventEntry[] = [
  {
    id: 'masters-2026',
    name: 'Masters 2026',
    status: 'COMPLETE',
    wins: mastersSummary.wins,
    losses: mastersSummary.losses,
    pushes: mastersSummary.pushes,
    units: mastersSummary.units,
    roi: mastersSummary.roi,
    threshold: mastersFloor.floor,
    course: mastersFloor.course,
    predictability: mastersFloor.predictability,
  },
  {
    id: 'pga-2026',
    name: 'PGA Championship 2026',
    status: 'COMPLETE',
    wins: pgaSummary.wins,
    losses: pgaSummary.losses,
    pushes: pgaSummary.pushes,
    units: pgaSummary.units,
    roi: pgaSummary.roi,
    threshold: pgaFloor.floor,
    course: pgaFloor.course,
    predictability: pgaFloor.predictability,
  },
  {
    id: 'cj-cup-byron-nelson-2026',
    name: 'CJ Cup Byron Nelson 2026',
    status: 'COMPLETE',
    wins: cjSummary.wins,
    losses: cjSummary.losses,
    pushes: cjSummary.pushes,
    units: cjSummary.units,
    roi: cjSummary.roi,
    threshold: cjCupFloor.floor,
    course: cjCupFloor.course,
    predictability: cjCupFloor.predictability,
  },
  {
    id: 'charles-schwab-challenge-2026',
    name: 'Charles Schwab Challenge 2026',
    status: 'IN PROGRESS',
    wins: cscSummary.wins,
    losses: cscSummary.losses,
    pushes: cscSummary.pushes,
    units: cscSummary.units,
    roi: cscSummary.roi,
    threshold: cscFloor.floor,
    course: cscFloor.course,
    predictability: cscFloor.predictability,
  },
];

// --- All-time totals (sum of venue-tracked records across every event) ---
const allTimeWins = mastersSummary.wins + pgaSummary.wins + cjSummary.wins + cscSummary.wins;
const allTimeLosses = mastersSummary.losses + pgaSummary.losses + cjSummary.losses + cscSummary.losses;
const allTimePushes = mastersSummary.pushes + pgaSummary.pushes + cjSummary.pushes + cscSummary.pushes;
const allTimeUnits = +(mastersSummary.units + pgaSummary.units + cjSummary.units + cscSummary.units).toFixed(2);
const allTimeStaked = mastersSummary.staked + pgaSummary.staked + cjSummary.staked + cscSummary.staked;
const allTimeROI = allTimeStaked > 0 ? +((allTimeUnits / allTimeStaked) * 100).toFixed(1) : 0;
const allTimeBets = allTimeWins + allTimeLosses + allTimePushes;

// --- Helpers ---
function formatUnits(u: number): string {
  if (u === 0) return '0.00';
  return (u > 0 ? '+' : '') + u.toFixed(2);
}

function formatROI(r: number): string {
  return (r > 0 ? '+' : '') + r.toFixed(1) + '%';
}

function unitColor(u: number): string {
  if (u > 0) return 'text-[#22c55e]';
  if (u < 0) return 'text-[#ef4444]';
  return 'text-[#d4d4d4]';
}

function borderColor(u: number): string {
  if (u > 0) return 'border-[#22c55e]/30';
  if (u < 0) return 'border-[#ef4444]/30';
  return 'border-[#262626]';
}

function resultBadge(r: 'W' | 'L' | 'P') {
  const base = "inline-flex items-center justify-center w-7 h-7 rounded font-bold text-xs font-['JetBrains_Mono','SF_Mono',monospace]";
  if (r === 'W') return <span className={`${base} bg-[#22c55e]/15 text-[#22c55e]`}>W</span>;
  if (r === 'L') return <span className={`${base} bg-[#ef4444]/15 text-[#ef4444]`}>L</span>;
  return <span className={`${base} bg-[#a1a1aa]/15 text-[#a1a1aa]`}>P</span>;
}

// --- Sort logic ---
function compareValues(a: BetRecord, b: BetRecord, field: ResultsSortField, dir: SortDirection): number {
  let aVal: string | number | null;
  let bVal: string | number | null;

  switch (field) {
    case 'id': aVal = a.id; bVal = b.id; break;
    case 'round': aVal = a.round; bVal = b.round; break;
    case 'pick': aVal = a.pick; bVal = b.pick; break;
    case 'opponent': aVal = a.opponent; bVal = b.opponent; break;
    case 'edge': aVal = a.edge; bVal = b.edge; break;
    case 'tier': {
      const tierOrder: Record<TierType, number> = { 'BEST BET': 0, 'STRONG PLAY': 1, 'LEAN': 2 };
      aVal = tierOrder[a.tier]; bVal = tierOrder[b.tier]; break;
    }
    case 'bucket': aVal = a.bucket; bVal = b.bucket; break;
    case 'bestOdds': aVal = parseInt(a.bestOdds); bVal = parseInt(b.bestOdds); break;
    case 'book': aVal = a.book; bVal = b.book; break;
    case 'pickScore': aVal = a.pickScore ?? 999; bVal = b.pickScore ?? 999; break;
    case 'oppScore': aVal = a.oppScore ?? 999; bVal = b.oppScore ?? 999; break;
    case 'result': {
      const resOrder = { W: 0, L: 1, P: 2 };
      aVal = resOrder[a.result]; bVal = resOrder[b.result]; break;
    }
    case 'units': aVal = a.units; bVal = b.units; break;
    default: aVal = a.id; bVal = b.id;
  }

  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  }
  const numA = Number(aVal);
  const numB = Number(bVal);
  return dir === 'asc' ? numA - numB : numB - numA;
}

// --- Sportsbook URLs ---
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

// --- Sportsbook list (Masters bet log filter) ---
const sportsbooks: Sportsbook[] = [
  'Best Odds (Overall)', 'DraftKings', 'FanDuel', 'BetMGM', 'Caesars',
  'bet365', 'BetOnline', 'Bovada', 'PointsBet', 'Unibet', 'Betcris', 'Pinnacle',
];

const mastersRounds = ['All Rounds', 'Round 2', 'Round 3', 'Round 4'];

type TournamentView = 'all-time' | 'masters-2026' | 'pga-2026' | 'cj-cup-byron-nelson-2026' | 'charles-schwab-challenge-2026';

// --- Shared style tokens ---
const mono = "font-['JetBrains_Mono','SF_Mono',monospace]";
const label = "text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]";

// --- Per-star breakdown card row ---
function StarBreakdown({ bets, heading }: { bets: BetRecord[]; heading?: string }) {
  const rows = useMemo(() => {
    const out: { stars: number; n: number; w: number; l: number; p: number; units: number; roi: number }[] = [];
    for (let s = 1; s <= 5; s++) {
      const sub = bets.filter((b) => starsForEdge(b.edge) === s);
      if (!sub.length) continue;
      const w = sub.filter((b) => b.result === 'W').length;
      const l = sub.filter((b) => b.result === 'L').length;
      const p = sub.filter((b) => b.result === 'P').length;
      const units = +sub.reduce((u, b) => u + b.units, 0).toFixed(2);
      let staked = 0;
      for (const b of sub) {
        if (b.result === 'P') continue;
        staked += unitsForEdge(b.edge) * stakeToWin1(b.bestOdds);
      }
      const roi = staked > 0 ? +((units / staked) * 100).toFixed(1) : 0;
      out.push({ stars: s, n: sub.length, w, l, p, units, roi });
    }
    return out;
  }, [bets]);

  if (!rows.length) return null;
  return (
    <div className="mb-5">
      {heading && (
        <h4 className={label + ' mb-3'}>{heading}</h4>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {rows.map((r) => (
          <div
            key={r.stars}
            className={`bg-[#0a0a0a] border ${borderColor(r.units)} rounded-lg p-3.5 flex flex-col gap-1`}
          >
            <div className="text-[#22c55e] text-base tracking-tight leading-none">
              {'★'.repeat(r.stars)}
            </div>
            <div className={`text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]`}>
              {r.n} {r.n === 1 ? 'bet' : 'bets'}
            </div>
            <div className={`text-base font-bold ${mono} text-[#f5f5f5] mt-0.5`}>
              {r.w}-{r.l}{r.p > 0 ? `-${r.p}` : ''}
            </div>
            <div className={`text-sm font-bold ${mono} ${unitColor(r.units)}`}>
              {formatUnits(r.units)}u
            </div>
            <div className={`text-xs ${mono} ${unitColor(r.roi)}`}>
              {formatROI(r.roi)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sortable per-round bet table — clickable column headers (including
// Edge / matchup score), used by every per-event view. Each instance
// holds its own sortField/sortDir state so different rounds on the
// same page can be sorted independently.
// ─────────────────────────────────────────────────────────────────
function SortableBetTable({ bets, round, floor }: { bets: BetRecord[]; round: number; floor: number }) {
  const [sortField, setSortField] = useState<ResultsSortField>('edge');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const handleSort = (field: ResultsSortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // For numeric columns where bigger = "better" by default, start desc.
      setSortDir(field === 'edge' || field === 'units' ? 'desc' : 'asc');
    }
  };

  const sortArrow = (field: ResultsSortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const sortedBets = useMemo(
    () => [...bets].sort((a, b) => compareValues(a, b, sortField, sortDir)),
    [bets, sortField, sortDir]
  );

  if (bets.length === 0) {
    return (
      <p className="text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] italic">
        No matchups cleared the {floor.toFixed(2)} venue threshold this round.
      </p>
    );
  }

  const columns: [ResultsSortField, string][] = [
    ['id', '#'],
    ['pick', 'Pick'],
    ['opponent', 'Opp'],
    ['edge', 'Edge'],
    ['bestOdds', 'Best Odds'],
    ['book', 'Book'],
    ['result', 'Result'],
    ['units', 'Units +/-'],
  ];

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#262626]">
              {columns.map(([field, headerLabel]) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`px-3 py-3 text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] cursor-pointer hover:text-[#22c55e] transition-colors whitespace-nowrap select-none ${
                    sortField === field ? 'text-[#22c55e]' : 'text-[#a1a1aa]'
                  }`}
                >
                  {headerLabel}{sortArrow(field)}
                </th>
              ))}
              <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] whitespace-nowrap">Stars</th>
            </tr>
          </thead>
          <tbody>
            {sortedBets.map((bet, i) => (
              <tr key={bet.id} className={`border-b border-[#1a1a1a] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'} hover:bg-[#141414] transition-colors`}>
                <td className={`px-3 py-2 text-xs ${mono} text-[#a1a1aa]`}>{bet.id}</td>
                <td className="px-3 py-2 text-xs text-[#f5f5f5] font-['Inter',system-ui,sans-serif] whitespace-nowrap">{bet.pick}</td>
                <td className="px-3 py-2 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] whitespace-nowrap">{bet.opponent}</td>
                <td className={`px-3 py-2 text-xs ${mono} text-[#d4d4d4]`}>{bet.edge.toFixed(2)}</td>
                <td className={`px-3 py-2 text-xs ${mono} text-[#d4d4d4]`}>{bet.bestOdds}</td>
                <td className="px-3 py-2 text-xs font-['Inter',system-ui,sans-serif] whitespace-nowrap">
                  {sportsbookUrls[bet.book] ? (
                    <a href={sportsbookUrls[bet.book]} target="_blank" rel="noopener noreferrer" className="text-[#22c55e] hover:underline transition-colors">
                      {bet.book}<span className="ml-0.5 text-[10px]">{'↗'}</span>
                    </a>
                  ) : (
                    <span className="text-[#a1a1aa]">{bet.book}</span>
                  )}
                </td>
                <td className="px-3 py-2">{resultBadge(bet.result)}</td>
                <td className={`px-3 py-2 text-xs ${mono} ${unitColor(bet.units)} font-bold`}>{formatUnits(bet.units)}</td>
                <td className="px-3 py-2">
                  <span className="text-[#22c55e] text-xs tracking-tight" aria-label={`${starsForEdge(bet.edge)} star play`}>
                    {'★'.repeat(starsForEdge(bet.edge))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-[#262626] text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
        {sortedBets.length} Best Bet{sortedBets.length === 1 ? '' : 's'} — Round {round}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-VIEWS
// ─────────────────────────────────────────────────────────────────

// --- All-Time View ---
function AllTimeView() {
  const tournaments = EVENT_REGISTRY;

  return (
    <div>
      <p className="text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mb-5">
        Combined record across all tracked tournaments. Each event uses its own venue-specific
        bet floor — see each tournament card for that event&rsquo;s recommended floor. Lower-tier
        bets are scored internally for backtesting but not surfaced as recommendations.
      </p>

      {/* Equity curve — every tracked bet, in order. */}
      <div className="mb-6">
        <EquityCurve />
      </div>

      {/* Hit rate by star tier */}
      <div className="mb-6">
        <HitRateByTier />
      </div>

      <StarBreakdown bets={ALL_TIME_BETS} heading="By Star Rating — All-Time (tracked bets)" />
      <div className="grid grid-cols-1 gap-3">
        {tournaments.map(t => {
          const isComplete = t.status === 'COMPLETE';
          return (
            <div
              key={t.name}
              className={`bg-[#0a0a0a] border ${borderColor(t.units)} rounded-lg p-5`}
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full font-['Inter',system-ui,sans-serif] ${
                  isComplete
                    ? 'bg-[#22c55e]/15 text-[#22c55e]'
                    : 'bg-[#a1a1aa]/15 text-[#a1a1aa]'
                }`}>
                  {t.status}
                </span>
                <span className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">{t.name}</span>
                <RecommendedFloorBadge
                  threshold={t.threshold}
                  course={t.course}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className={label}>Record</div>
                  <div className={`text-base font-bold ${mono} text-[#f5f5f5]`}>
                    {t.wins}-{t.losses}-{t.pushes}
                  </div>
                </div>
                <div>
                  <div className={label}>Units</div>
                  <div className={`text-base font-bold ${mono} ${unitColor(t.units)}`}>
                    {formatUnits(t.units)}u
                  </div>
                </div>
                <div>
                  <div className={label}>ROI</div>
                  <div className={`text-base font-bold ${mono} ${unitColor(t.roi)}`}>
                    {formatROI(t.roi)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Masters 2026 View ---
function MastersView() {
  const [roundFilter, setRoundFilter] = useState('All Rounds');
  const [dataSetFilter, setDataSetFilter] = useState<'round-only' | 'cumulative'>('round-only');
  const [bookFilter, setBookFilter] = useState<Sportsbook>('Best Odds (Overall)');
  const [sortField, setSortField] = useState<ResultsSortField>('id');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const mastersBetLogPlayerNames = useMemo(() => {
    const names = new Set<string>();
    betLog.forEach((b) => {
      names.add(b.pick);
      names.add(b.opponent);
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, []);

  const handleSort = (field: ResultsSortField) => {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'edge' || field === 'units' ? 'desc' : 'asc');
    }
  };

  const sortArrow = (field: ResultsSortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const showDataSetToggle = roundFilter === 'Round 3' || roundFilter === 'Round 4' || roundFilter === 'All Rounds';

  const activeSummary = useMemo(() => {
    if (roundFilter === 'All Rounds') {
      return { wins: overallRecord.wins, losses: overallRecord.losses, pushes: overallRecord.pushes, units: overallUnits, roi: overallROI };
    }
    if (roundFilter === 'Round 2') {
      return { wins: r2Summary.wins, losses: r2Summary.losses, pushes: r2Summary.pushes, units: r2Summary.units, roi: r2Summary.roi };
    }
    if (roundFilter === 'Round 3') {
      const s = dataSetFilter === 'cumulative' ? r3CumulativeSummary : r3RoundOnlySummary;
      return { wins: s.wins, losses: s.losses, pushes: s.pushes, units: s.units, roi: s.roi };
    }
    if (roundFilter === 'Round 4') {
      const s = dataSetFilter === 'cumulative' ? r4CumulativeSummary : r4RoundOnlySummary;
      return { wins: s.wins, losses: s.losses, pushes: s.pushes, units: s.units, roi: s.roi };
    }
    return { wins: overallRecord.wins, losses: overallRecord.losses, pushes: overallRecord.pushes, units: overallUnits, roi: overallROI };
  }, [roundFilter, dataSetFilter]);


  const activeBucketBreakdowns = useMemo(() => {
    if (roundFilter === 'All Rounds') return totalBucketBreakdowns;
    if (roundFilter === 'Round 2') return r2BucketBreakdowns;
    if (roundFilter === 'Round 3') return dataSetFilter === 'cumulative' ? r3CumBucketBreakdowns : r3ROBucketBreakdowns;
    if (roundFilter === 'Round 4') return dataSetFilter === 'cumulative' ? r4CumBucketBreakdowns : r4ROBucketBreakdowns;
    return totalBucketBreakdowns;
  }, [roundFilter, dataSetFilter]);

  const filteredBets = useMemo(() => {
    let bets = [...betLog];
    if (roundFilter !== 'All Rounds') {
      const rn = parseInt(roundFilter.replace('Round ', ''));
      bets = bets.filter(b => b.round === rn);
    }
    if (roundFilter === 'Round 3' || roundFilter === 'Round 4') {
      bets = bets.filter(b => b.dataSet === dataSetFilter);
    }
    if (bookFilter !== 'Best Odds (Overall)') {
      bets = bets.filter(b => b.book === bookFilter);
    }
    if (selectedPlayer) {
      bets = bets.filter(
        (b) => b.pick === selectedPlayer || b.opponent === selectedPlayer
      );
    }
    bets.sort((a, b) => compareValues(a, b, sortField, sortDir));
    return bets;
  }, [roundFilter, dataSetFilter, bookFilter, selectedPlayer, sortField, sortDir]);

  return (
    <div>
      <TournamentSummaryBanner
        status="COMPLETE"
        eventName="The Masters 2026"
        course={mastersFloor.course}
        threshold={mastersFloor.floor}
        record={{ wins: overallRecord.wins, losses: overallRecord.losses, pushes: overallRecord.pushes }}
        units={overallUnits}
        roi={overallROI}
        bets={mastersSummary.bets}
        recordLabel="Total Record"
      />

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
          <div className={label + ' mb-3'}>
            {roundFilter === 'All Rounds' ? 'Overall Record' : `${roundFilter} Record`}
            {(roundFilter === 'Round 3' || roundFilter === 'Round 4') && (
              <span className="text-[#22c55e] ml-1">({dataSetFilter})</span>
            )}
          </div>
          <div className={`text-2xl font-bold ${mono} text-[#f5f5f5]`}>
            {activeSummary.wins}-{activeSummary.losses}-{activeSummary.pushes}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1 font-['Inter',system-ui,sans-serif]">
            Win rate: {(activeSummary.wins + activeSummary.losses) > 0 ? ((activeSummary.wins / (activeSummary.wins + activeSummary.losses)) * 100).toFixed(1) + '%' : '--'}
          </div>
        </div>

        <div className={`bg-[#0a0a0a] border ${borderColor(activeSummary.units)} rounded-lg p-5`}>
          <div className={label + ' mb-3'}>Units +/-</div>
          <div className={`text-2xl font-bold ${mono} ${unitColor(activeSummary.units)}`}>
            {formatUnits(activeSummary.units)}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1 font-['Inter',system-ui,sans-serif]">
            {activeSummary.wins + activeSummary.losses + activeSummary.pushes} total bets
          </div>
        </div>

        <div className={`bg-[#0a0a0a] border ${borderColor(activeSummary.roi)} rounded-lg p-5`}>
          <div className={label + ' mb-3'}>ROI %</div>
          <div className={`text-2xl font-bold ${mono} ${unitColor(activeSummary.roi)}`}>
            {formatROI(activeSummary.roi)}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1 font-['Inter',system-ui,sans-serif]">
            Return on investment
          </div>
        </div>
      </div>

      {/* By Star Rating — respects the round/dataset filter via filteredBets */}
      <StarBreakdown bets={filteredBets} heading="By Star Rating" />

      {/* Bucket Breakdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {activeBucketBreakdowns.map(b => (
          <div key={b.bucket} className={`bg-[#0a0a0a] border ${borderColor(b.units)} rounded-lg p-5`}>
            <div className={label + ' mb-3'}>{b.bucket}</div>
            <div className={`text-lg font-bold ${mono} text-[#f5f5f5]`}>
              {b.wins}-{b.losses}{b.pushes > 0 ? `-${b.pushes}` : ''}
            </div>
            <div className="flex gap-4 mt-2">
              <span className={`text-xs ${mono} ${unitColor(b.units)}`}>{formatUnits(b.units)}u</span>
              <span className={`text-xs ${mono} ${unitColor(b.roi)}`}>{formatROI(b.roi)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={roundFilter}
            onChange={e => setRoundFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] focus:border-[#22c55e]/50 focus:outline-none cursor-pointer"
          >
            {mastersRounds.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {showDataSetToggle && (
            <div className="flex border border-[#262626] rounded-full p-0.5">
              <button
                onClick={() => setDataSetFilter('round-only')}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded-full transition-colors font-['Inter',system-ui,sans-serif] cursor-pointer ${
                  dataSetFilter === 'round-only'
                    ? 'bg-[#22c55e] text-[#0a0a0a]'
                    : 'text-[#d4d4d4] hover:text-white'
                }`}
              >
                Round-Only
              </button>
              <button
                onClick={() => setDataSetFilter('cumulative')}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded-full transition-colors font-['Inter',system-ui,sans-serif] cursor-pointer ${
                  dataSetFilter === 'cumulative'
                    ? 'bg-[#22c55e] text-[#0a0a0a]'
                    : 'text-[#d4d4d4] hover:text-white'
                }`}
              >
                Cumulative
              </button>
            </div>
          )}

          <select
            value={bookFilter}
            onChange={e => setBookFilter(e.target.value as Sportsbook)}
            className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] focus:border-[#22c55e]/50 focus:outline-none cursor-pointer"
          >
            {sportsbooks.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Player search — filters the bet log */}
      <div className="mb-4">
        <PlayerSearch
          players={mastersBetLogPlayerNames}
          selected={selectedPlayer}
          onSelect={setSelectedPlayer}
          onClear={() => setSelectedPlayer(null)}
          placeholder="Filter bet log by player..."
        />
        {selectedPlayer && (
          <p className="mt-2 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            Showing bets for{' '}
            <span className="text-[#22c55e] font-medium">{selectedPlayer}</span>
            {' '}({filteredBets.length} bet{filteredBets.length !== 1 ? 's' : ''})
          </p>
        )}
      </div>

      {/* Full Bet Log Table */}
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#262626]">
                {([
                  ['id', '#'],
                  ['round', 'Rd'],
                  ['pick', 'Pick'],
                  ['opponent', 'Over'],
                  ['edge', 'Edge'],
                  ['tier', 'Tier'],
                  ['bucket', 'Bucket'],
                  ['bestOdds', 'Best Odds'],
                  ['book', 'Book'],
                  ['pickScore', 'Pick Score'],
                  ['oppScore', 'Opp Score'],
                  ['result', 'Result'],
                  ['units', 'Units +/-'],
                ] as [ResultsSortField, string][]).map(([field, headerLabel]) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] cursor-pointer hover:text-[#22c55e] transition-colors whitespace-nowrap select-none ${
                      sortField === field ? 'text-[#22c55e]' : ''
                    }`}
                  >
                    {headerLabel}{sortArrow(field)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBets.map((bet, i) => (
                <tr
                  key={bet.id}
                  className={`border-b border-[#1a1a1a] ${
                    i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'
                  } hover:bg-[#141414] transition-colors`}
                >
                  <td className={`px-3 py-2.5 text-xs ${mono} text-[#a1a1aa]`}>{bet.id}</td>
                  <td className={`px-3 py-2.5 text-xs ${mono} text-[#d4d4d4]`}>R{bet.round}</td>
                  <td className="px-3 py-2.5 text-xs text-[#f5f5f5] font-['Inter',system-ui,sans-serif] whitespace-nowrap">{bet.pick}</td>
                  <td className="px-3 py-2.5 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] whitespace-nowrap">{bet.opponent}</td>
                  <td className={`px-3 py-2.5 text-xs ${mono} text-[#d4d4d4]`}>{bet.edge.toFixed(1)}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className="text-[#22c55e] text-xs tracking-tight"
                      aria-label={`${starsForEdge(bet.edge)} star play`}
                    >
                      {'★'.repeat(starsForEdge(bet.edge))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] whitespace-nowrap">{bet.bucket}</td>
                  <td className={`px-3 py-2.5 text-xs ${mono} text-[#d4d4d4]`}>{bet.bestOdds}</td>
                  <td className="px-3 py-2.5 text-xs font-['Inter',system-ui,sans-serif] whitespace-nowrap">
                    {sportsbookUrls[bet.book] ? (
                      <a
                        href={sportsbookUrls[bet.book]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#22c55e] hover:underline transition-colors"
                      >
                        {bet.book}<span className="ml-0.5 text-[10px]">{'↗'}</span>
                      </a>
                    ) : (
                      <span className="text-[#a1a1aa]">{bet.book}</span>
                    )}
                  </td>
                  <td className={`px-3 py-2.5 text-xs ${mono} text-[#d4d4d4]`}>{bet.pickScore ?? '--'}</td>
                  <td className={`px-3 py-2.5 text-xs ${mono} text-[#d4d4d4]`}>{bet.oppScore ?? '--'}</td>
                  <td className="px-3 py-2.5">{resultBadge(bet.result)}</td>
                  <td className={`px-3 py-2.5 text-xs ${mono} ${unitColor(bet.units)} font-bold`}>
                    {formatUnits(bet.units)}
                  </td>
                </tr>
              ))}
              {filteredBets.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-3 py-8 text-center text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
                    No bets match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#262626] text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          Showing {filteredBets.length} of {betLog.length} bets
        </div>
      </div>

      {/* Data Set Comparison */}
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 mb-8">
        <div className={label + ' mb-4'}>Data Set Comparison (Full Tournament)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#262626]">
                <th className={`px-3 py-2 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]`}>Metric</th>
                <th className={`px-3 py-2 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]`}>Round-Only</th>
                <th className={`px-3 py-2 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]`}>Cumulative</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#1a1a1a]">
                <td className="px-3 py-2.5 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">Record</td>
                <td className={`px-3 py-2.5 text-xs ${mono} text-[#f5f5f5]`}>
                  {dataSetComparison.roundOnly.wins}-{dataSetComparison.roundOnly.losses}-{dataSetComparison.roundOnly.pushes}
                </td>
                <td className={`px-3 py-2.5 text-xs ${mono} text-[#f5f5f5]`}>
                  {dataSetComparison.cumulative.wins}-{dataSetComparison.cumulative.losses}-{dataSetComparison.cumulative.pushes}
                </td>
              </tr>
              <tr className="border-b border-[#1a1a1a]">
                <td className="px-3 py-2.5 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">Units</td>
                <td className={`px-3 py-2.5 text-xs ${mono} ${unitColor(dataSetComparison.roundOnly.units)}`}>
                  {formatUnits(dataSetComparison.roundOnly.units)}
                </td>
                <td className={`px-3 py-2.5 text-xs ${mono} ${unitColor(dataSetComparison.cumulative.units)}`}>
                  {formatUnits(dataSetComparison.cumulative.units)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">ROI</td>
                <td className={`px-3 py-2.5 text-xs ${mono} ${unitColor(dataSetComparison.roundOnly.roi)}`}>
                  {formatROI(dataSetComparison.roundOnly.roi)}
                </td>
                <td className={`px-3 py-2.5 text-xs ${mono} ${unitColor(dataSetComparison.cumulative.roi)}`}>
                  {formatROI(dataSetComparison.cumulative.roi)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          Compares performance using round-only stats vs cumulative tournament stats for player scoring data
        </div>
      </div>
    </div>
  );
}

// --- PGA Championship 2026 View ---
function PGAView() {
  const [sortField, setSortField] = useState<ResultsSortField>('id');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const pgaPlayerNames = useMemo(() => {
    const names = new Set<string>();
    [...r2Results, ...r3Results, ...r4Results].forEach((b) => {
      names.add(b.pick);
      names.add(b.opponent);
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, []);

  const handleSort = (field: ResultsSortField) => {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'edge' || field === 'units' ? 'desc' : 'asc');
    }
  };

  const sortArrow = (field: ResultsSortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const { sortedR2, sortedR3, sortedR4 } = useMemo(() => {
    // Tables show TRACKED bets only — bets that pass the venue floor and
    // would actually have been recommended. The full graded set lives in
    // the raw data files and the backtest sweep (docs/THRESHOLD_SWEEP.md).
    const view = (raw: BetRecord[]) => {
      let bets = [...raw];
      if (selectedPlayer) {
        bets = bets.filter(
          (b) => b.pick === selectedPlayer || b.opponent === selectedPlayer
        );
      }
      return bets.sort((a, b) => compareValues(a, b, sortField, sortDir));
    };
    return {
      sortedR2: view(pgaR2Tracked),
      sortedR3: view(pgaR3Tracked),
      sortedR4: view(pgaR4Tracked),
    };
  }, [sortField, sortDir, selectedPlayer]);
  const filteredCount = sortedR2.length + sortedR3.length + sortedR4.length;

  // Newest round first (R4 → R3 → R2) — matches the descending-event order
  // at the top of the page.
  const rounds = [
    { round: 4, summary: pgaR4Summary, bets: sortedR4 },
    { round: 3, summary: pgaR3Summary, bets: sortedR3 },
    { round: 2, summary: pgaR2Summary, bets: sortedR2 },
  ];

  return (
    <div>
      <TournamentSummaryBanner
        status="COMPLETE"
        eventName="PGA Championship 2026"
        course={pgaFloor.course}
        threshold={pgaFloor.floor}
        record={{ wins: pgaSummary.wins, losses: pgaSummary.losses, pushes: pgaSummary.pushes }}
        units={pgaSummary.units}
        roi={pgaSummary.roi}
        bets={pgaSummary.bets}
        recordLabel="Total Record"
      />

      {/* Player search — filters bet logs */}
      <div className="mb-5">
        <PlayerSearch
          players={pgaPlayerNames}
          selected={selectedPlayer}
          onSelect={setSelectedPlayer}
          onClear={() => setSelectedPlayer(null)}
          placeholder="Filter bet log by player..."
        />
        {selectedPlayer && (
          <p className="mt-2 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            Showing bets for{' '}
            <span className="text-[#22c55e] font-medium">{selectedPlayer}</span>
            {' '}({filteredCount} bet{filteredCount !== 1 ? 's' : ''})
          </p>
        )}
      </div>

      <StarBreakdown bets={[...sortedR2, ...sortedR3, ...sortedR4]} heading="By Star Rating" />

      {rounds.map(({ round, summary, bets }) => (
        <div key={round} className="mb-8">
          {/* Round summary */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-0.5 h-5 rounded-full ${summary.units >= 0 ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
            <span className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">Round {round}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
              <div className={label}>Record</div>
              <div className={`text-lg font-bold ${mono} text-[#f5f5f5] mt-1`}>{summary.record}</div>
            </div>
            <div className={`bg-[#0a0a0a] border ${borderColor(summary.units)} rounded-lg p-4`}>
              <div className={label}>Units</div>
              <div className={`text-lg font-bold ${mono} ${unitColor(summary.units)} mt-1`}>{formatUnits(summary.units)}u</div>
            </div>
            <div className={`bg-[#0a0a0a] border ${borderColor(summary.roi)} rounded-lg p-4`}>
              <div className={label}>ROI</div>
              <div className={`text-lg font-bold ${mono} ${unitColor(summary.roi)} mt-1`}>{formatROI(summary.roi)}</div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
              <div className={label}>Bets</div>
              <div className={`text-lg font-bold ${mono} text-[#f5f5f5] mt-1`}>{summary.bets}</div>
            </div>
          </div>

          {/* Bet log table */}
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#262626]">
                    {([
                      ['id', '#'],
                      ['pick', 'Pick'],
                      ['opponent', 'Over'],
                      ['edge', 'Edge'],
                      ['tier', 'Stars'],
                      ['bestOdds', 'Best Odds'],
                      ['book', 'Book'],
                      ['result', 'Result'],
                      ['units', 'Units +/-'],
                    ] as [ResultsSortField, string][]).map(([field, headerLabel]) => (
                      <th
                        key={field}
                        onClick={() => handleSort(field)}
                        className={`px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] cursor-pointer hover:text-[#22c55e] transition-colors whitespace-nowrap select-none ${
                          sortField === field ? 'text-[#22c55e]' : ''
                        }`}
                      >
                        {headerLabel}{sortArrow(field)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bets.map((bet, i) => (
                    <tr
                      key={bet.id}
                      className={`border-b border-[#1a1a1a] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'} hover:bg-[#141414] transition-colors`}
                    >
                      <td className={`px-3 py-2 text-xs ${mono} text-[#a1a1aa]`}>{bet.id}</td>
                      <td className="px-3 py-2 text-xs text-[#f5f5f5] font-['Inter',system-ui,sans-serif] whitespace-nowrap">{bet.pick}</td>
                      <td className="px-3 py-2 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] whitespace-nowrap">{bet.opponent}</td>
                      <td className={`px-3 py-2 text-xs ${mono} text-[#d4d4d4]`}>{bet.edge.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <span
                          className="text-[#22c55e] text-xs tracking-tight"
                          aria-label={`${starsForEdge(bet.edge)} star play`}
                        >
                          {'★'.repeat(starsForEdge(bet.edge))}
                        </span>
                      </td>
                      <td className={`px-3 py-2 text-xs ${mono} text-[#d4d4d4]`}>{bet.bestOdds}</td>
                      <td className="px-3 py-2 text-xs font-['Inter',system-ui,sans-serif] whitespace-nowrap">
                        {sportsbookUrls[bet.book] ? (
                          <a href={sportsbookUrls[bet.book]} target="_blank" rel="noopener noreferrer" className="text-[#22c55e] hover:underline transition-colors">
                            {bet.book}<span className="ml-0.5 text-[10px]">{'↗'}</span>
                          </a>
                        ) : (
                          <span className="text-[#a1a1aa]">{bet.book}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{resultBadge(bet.result)}</td>
                      <td className={`px-3 py-2 text-xs ${mono} ${unitColor(bet.units)} font-bold`}>{formatUnits(bet.units)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-[#262626] text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
              {bets.length} bets graded — Round {round} complete
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- CJ Cup Byron Nelson View — COMPLETE after R4, graded round-by-round ---
function CJCupView() {
  // Best Bets only, per round. Event complete — newest round first (R4 → R3 → R2).
  const gradedRounds = [
    { round: 4, summary: cjR4Summary, bets: cjR4Tracked },
    { round: 3, summary: cjR3Summary, bets: cjR3Tracked },
    { round: 2, summary: cjR2Summary, bets: cjR2Tracked },
  ];

  return (
    <div>
      <TournamentSummaryBanner
        status="COMPLETE"
        eventName="CJ Cup Byron Nelson 2026"
        course={cjCupFloor.course}
        threshold={cjCupFloor.floor}
        record={{ wins: cjSummary.wins, losses: cjSummary.losses, pushes: cjSummary.pushes }}
        units={cjSummary.units}
        roi={cjSummary.roi}
        bets={cjSummary.bets}
        recordLabel="Best Bets — Final"
      />

      {gradedRounds.length === 0 && (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6 text-center">
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
            No Best Bets graded yet for this event.
          </p>
        </div>
      )}

      {gradedRounds.map(({ round, summary, bets }) => (
        <div key={round} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-0.5 h-5 rounded-full ${summary.units >= 0 ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
            <span className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
              Round {round} — Best Bets
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
              <div className={label}>Record</div>
              <div className={`text-lg font-bold ${mono} text-[#f5f5f5] mt-1`}>{summary.record}</div>
            </div>
            <div className={`bg-[#0a0a0a] border ${borderColor(summary.units)} rounded-lg p-4`}>
              <div className={label}>Units</div>
              <div className={`text-lg font-bold ${mono} ${unitColor(summary.units)} mt-1`}>{formatUnits(summary.units)}u</div>
            </div>
            <div className={`bg-[#0a0a0a] border ${borderColor(summary.roi)} rounded-lg p-4`}>
              <div className={label}>ROI</div>
              <div className={`text-lg font-bold ${mono} ${unitColor(summary.roi)} mt-1`}>{formatROI(summary.roi)}</div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
              <div className={label}>Best Bets</div>
              <div className={`text-lg font-bold ${mono} text-[#f5f5f5] mt-1`}>{summary.bets}</div>
            </div>
          </div>

          <SortableBetTable bets={bets} round={round} floor={cjCupFloor.floor} />
        </div>
      ))}

    </div>
  );
}

// --- Charles Schwab Challenge View — pre-tournament placeholder until R1 grades ---
function CharlesSchwabView() {
  // gradedRounds is derived from the cscR*Results.ts files Vite found at
  // build time — every new round graded by auto-roll appears here on the
  // next deploy with zero manual edits. Newest round first (R4 → R3 → R2).
  const gradedRounds = [...cscRounds].reverse();

  return (
    <div>
      <TournamentSummaryBanner
        status="IN PROGRESS"
        eventName="Charles Schwab Challenge 2026"
        course={cscFloor.course}
        threshold={cscFloor.floor}
        record={{ wins: cscSummary.wins, losses: cscSummary.losses, pushes: cscSummary.pushes }}
        units={cscSummary.units}
        roi={cscSummary.roi}
        bets={cscSummary.bets}
        recordLabel="Best Bets so far"
      />

      {gradedRounds.length === 0 && (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6 text-center">
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
            No Best Bets graded yet for this event.
          </p>
        </div>
      )}

      {gradedRounds.map(({ round, summary, bets }) => (
        <div key={round} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-0.5 h-5 rounded-full ${summary.units >= 0 ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
            <span className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
              Round {round} — Best Bets
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
              <div className={label}>Record</div>
              <div className={`text-lg font-bold ${mono} text-[#f5f5f5] mt-1`}>{summary.record}</div>
            </div>
            <div className={`bg-[#0a0a0a] border ${borderColor(summary.units)} rounded-lg p-4`}>
              <div className={label}>Units</div>
              <div className={`text-lg font-bold ${mono} ${unitColor(summary.units)} mt-1`}>{formatUnits(summary.units)}u</div>
            </div>
            <div className={`bg-[#0a0a0a] border ${borderColor(summary.roi)} rounded-lg p-4`}>
              <div className={label}>ROI</div>
              <div className={`text-lg font-bold ${mono} ${unitColor(summary.roi)} mt-1`}>{formatROI(summary.roi)}</div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
              <div className={label}>Best Bets</div>
              <div className={`text-lg font-bold ${mono} text-[#f5f5f5] mt-1`}>{summary.bets}</div>
            </div>
          </div>

          <SortableBetTable bets={bets} round={round} floor={cscFloor.floor} />
        </div>
      ))}

      <div className="bg-[#0a0a0a] border border-dashed border-[#262626] rounded-lg p-5 text-center">
        <p className="text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          Tournament still in progress — later rounds will populate here as they grade.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

const tournamentOptions: { value: TournamentView; label: string }[] = [
  { value: 'all-time', label: 'All-Time' },
  ...EVENT_REGISTRY.map((e) => ({ value: e.id, label: e.name })),
];

// Default view: whichever event is currently IN PROGRESS; otherwise All-Time.
const DEFAULT_VIEW: TournamentView =
  EVENT_REGISTRY.find((e) => e.status === 'IN PROGRESS')?.id ?? 'all-time';

export default function ResultsPage() {
  const [activeView, setActiveView] = useState<TournamentView>(DEFAULT_VIEW);

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── All-Time Hero ── */}
      <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="bg-[#22c55e]/15 text-[#22c55e] text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full font-['Inter',system-ui,sans-serif]">
            All-Time Record
          </span>
          <span className="text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            {allTimeBets} bets across {tournamentOptions.length - 1} tournaments
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <div className={label + ' mb-1'}>Record</div>
            <div className={`text-2xl md:text-3xl font-black ${mono} text-[#f5f5f5] leading-none whitespace-nowrap`}>
              {allTimeWins}-{allTimeLosses}-{allTimePushes}
            </div>
            <div className="text-[10px] text-[#a1a1aa] mt-1.5 font-['Inter',system-ui,sans-serif]">
              {(allTimeWins + allTimeLosses) > 0 ? ((allTimeWins / (allTimeWins + allTimeLosses)) * 100).toFixed(1) + '%' : '--'} win rate
            </div>
          </div>

          <div>
            <div className={label + ' mb-1'}>Total Units</div>
            <div className={`text-3xl font-black ${mono} text-[#22c55e] leading-none`}>
              {formatUnits(allTimeUnits)}
            </div>
            <div className="text-[10px] text-[#a1a1aa] mt-1.5 font-['Inter',system-ui,sans-serif]">units profit</div>
          </div>

          <div>
            <div className={label + ' mb-1'}>ROI</div>
            <div className={`text-3xl font-black ${mono} text-[#22c55e] leading-none`}>
              {formatROI(allTimeROI)}
            </div>
            <div className="text-[10px] text-[#a1a1aa] mt-1.5 font-['Inter',system-ui,sans-serif]">return on investment</div>
          </div>

          <div>
            <div className={label + ' mb-1'}>Total Bets</div>
            <div className={`text-3xl font-black ${mono} text-[#f5f5f5] leading-none`}>
              {allTimeBets}
            </div>
            <div className="text-[10px] text-[#a1a1aa] mt-1.5 font-['Inter',system-ui,sans-serif]">graded H2H picks</div>
          </div>
        </div>
      </div>

      {/* ── Tournament Picker (dropdown — cleaner than pills) ── */}
      <div className="flex items-center gap-3 mb-6">
        <label htmlFor="results-view-select" className={label}>View</label>
        <select
          id="results-view-select"
          value={activeView}
          onChange={(e) => setActiveView(e.target.value as TournamentView)}
          className={`bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs ${mono} text-[#f5f5f5] cursor-pointer hover:border-[#404040] focus:border-[#22c55e] focus:outline-none transition-colors`}
        >
          {tournamentOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* ── View Content ── */}
      <div key={activeView} className="fade-in">
        {activeView === 'all-time' && <AllTimeView />}
        {activeView === 'masters-2026' && <MastersView />}
        {activeView === 'pga-2026' && <PGAView />}
        {activeView === 'cj-cup-byron-nelson-2026' && <CJCupView />}
        {activeView === 'charles-schwab-challenge-2026' && <CharlesSchwabView />}
      </div>
    </div>
  );
}
