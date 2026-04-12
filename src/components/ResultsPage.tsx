import { useState, useMemo } from 'react';
import type { BetRecord, TierType, BetType, ResultsSortField, SortDirection, Sportsbook } from '../types';
import {
  overallRecord,
  overallUnits,
  overallROI,
  tierBreakdowns,
  bucketBreakdowns,
  dataSetComparison,
  betLog,
} from '../data/resultsData';

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

// --- Sportsbook list ---
const sportsbooks: Sportsbook[] = [
  'Best Odds (Overall)', 'DraftKings', 'FanDuel', 'BetMGM', 'Caesars',
  'bet365', 'BetOnline', 'Bovada', 'PointsBet', 'Unibet', 'Betcris', 'Pinnacle',
];

const rounds = ['All Rounds', 'Round 2', 'Round 3', 'Round 4'];

// --- Main Component ---
export default function ResultsPage() {
  const [roundFilter, setRoundFilter] = useState('All Rounds');
  const [dataSetFilter, setDataSetFilter] = useState<'round-only' | 'cumulative'>('round-only');
  const [bookFilter, setBookFilter] = useState<Sportsbook>('Best Odds (Overall)');
  const [betTypeFilter, setBetTypeFilter] = useState<BetType | 'All'>('All');

  const [sortField, setSortField] = useState<ResultsSortField>('id');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

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
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  // Filtered + sorted data
  const filteredBets = useMemo(() => {
    let bets = [...betLog];

    if (roundFilter !== 'All Rounds') {
      const rn = parseInt(roundFilter.replace('Round ', ''));
      bets = bets.filter(b => b.round === rn);
    }

    if (bookFilter !== 'Best Odds (Overall)') {
      bets = bets.filter(b => b.book === bookFilter);
    }

    if (betTypeFilter !== 'All') {
      bets = bets.filter(b => b.betType === betTypeFilter);
    }

    bets.sort((a, b) => compareValues(a, b, sortField, sortDir));
    return bets;
  }, [roundFilter, bookFilter, betTypeFilter, sortField, sortDir]);

  const mono = "font-['JetBrains_Mono','SF_Mono',monospace]";
  const label = "text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Section 1: Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Overall Record */}
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
          <div className={label + ' mb-3'}>Overall Record</div>
          <div className={`text-2xl font-bold ${mono} text-[#f5f5f5]`}>
            {overallRecord.wins}-{overallRecord.losses}-{overallRecord.pushes}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1 font-['Inter',system-ui,sans-serif]">
            Win rate: {((overallRecord.wins / (overallRecord.wins + overallRecord.losses)) * 100).toFixed(1)}%
          </div>
        </div>

        {/* Units +/- */}
        <div className={`bg-[#0a0a0a] border ${borderColor(overallUnits)} rounded-lg p-5`}>
          <div className={label + ' mb-3'}>Units +/-</div>
          <div className={`text-2xl font-bold ${mono} ${unitColor(overallUnits)}`}>
            {formatUnits(overallUnits)}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1 font-['Inter',system-ui,sans-serif]">
            {overallRecord.wins + overallRecord.losses + overallRecord.pushes} total bets
          </div>
        </div>

        {/* ROI % */}
        <div className={`bg-[#0a0a0a] border ${borderColor(overallROI)} rounded-lg p-5`}>
          <div className={label + ' mb-3'}>ROI %</div>
          <div className={`text-2xl font-bold ${mono} ${unitColor(overallROI)}`}>
            {formatROI(overallROI)}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1 font-['Inter',system-ui,sans-serif]">
            Return on investment
          </div>
        </div>
      </div>

      {/* Section 2: Breakdown Cards */}
      {/* Row 1 - By Tier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {tierBreakdowns.map(t => (
          <div key={t.tier} className={`bg-[#0a0a0a] border ${borderColor(t.units)} rounded-lg p-5`}>
            <div className={label + ' mb-3'}>
              {t.tier === 'BEST BET' && <span className="text-[#22c55e]">Tier 1</span>}
              {t.tier === 'STRONG PLAY' && <span className="text-emerald-400">Tier 2</span>}
              {t.tier === 'LEAN' && <span className="text-[#a1a1aa]">Tier 3</span>}
              <span className="text-[#a1a1aa]"> ({t.tier})</span>
            </div>
            <div className={`text-lg font-bold ${mono} text-[#f5f5f5]`}>
              {t.wins}-{t.losses}{t.pushes > 0 ? `-${t.pushes}` : ''}
            </div>
            <div className="flex gap-4 mt-2">
              <span className={`text-xs ${mono} ${unitColor(t.units)}`}>{formatUnits(t.units)}u</span>
              <span className={`text-xs ${mono} ${unitColor(t.roi)}`}>{formatROI(t.roi)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2 - By Bucket */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {bucketBreakdowns.map(b => (
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

      {/* Section 3: Filter Bar */}
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Round dropdown */}
          <select
            value={roundFilter}
            onChange={e => setRoundFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] focus:border-[#22c55e]/50 focus:outline-none cursor-pointer"
          >
            {rounds.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Data Set toggle */}
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

          {/* Sportsbook dropdown */}
          <select
            value={bookFilter}
            onChange={e => setBookFilter(e.target.value as Sportsbook)}
            className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] focus:border-[#22c55e]/50 focus:outline-none cursor-pointer"
          >
            {sportsbooks.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Bet Type toggle */}
          <div className="flex border border-[#262626] rounded-full p-0.5">
            {(['H2H', '3-Ball', 'All'] as const).map(bt => (
              <button
                key={bt}
                onClick={() => setBetTypeFilter(bt)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded-full transition-colors font-['Inter',system-ui,sans-serif] cursor-pointer ${
                  betTypeFilter === bt
                    ? 'bg-[#22c55e] text-[#0a0a0a]'
                    : 'text-[#d4d4d4] hover:text-white'
                }`}
              >
                {bt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Full Bet Log Table */}
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
                    <span className={`text-[10px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] ${
                      bet.tier === 'BEST BET' ? 'text-[#22c55e]' :
                      bet.tier === 'STRONG PLAY' ? 'text-emerald-400' :
                      'text-[#a1a1aa]'
                    }`}>
                      {bet.tier}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] whitespace-nowrap">{bet.bucket}</td>
                  <td className={`px-3 py-2.5 text-xs ${mono} text-[#d4d4d4]`}>{bet.bestOdds}</td>
                  <td className="px-3 py-2.5 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] whitespace-nowrap">{bet.book}</td>
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

      {/* Section 5: Data Set Comparison */}
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 mb-8">
        <div className={label + ' mb-4'}>Data Set Comparison</div>
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
