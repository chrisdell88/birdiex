import { useState, useMemo, Fragment } from 'react';
import type { PlayerData, SortField, SortDirection, Signal } from '../types';
import SignalBadge from './SignalBadge';
import PurityIcon from './PurityIcon';
import SummaryCards from './SummaryCards';
import PlayerDetailCard from './PlayerDetailCard';
import { currentEvent } from '../config/event';

interface RankingsTableProps {
  data: PlayerData[];
}

function formatScore(score: number): string {
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

function formatSG(value: number): string {
  return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

const signalOrder: Record<Signal, number> = {
  'STRONGEST BUY': 1,
  'STRONG BUY': 2,
  'BUY': 3,
  'LEAN BUY': 4,
  'HOLD': 5,
  'NEUTRAL': 5,
  'LEAN FADE': 6,
  'LEAN SELL': 6,
  'FADE': 7,
  'SELL': 7,
  'STRONG FADE': 8,
  'STRONG SELL': 8,
  'STRONGEST FADE': 9,
  'STRONGEST SELL': 9,
};

function parsePosition(pos: string): number {
  const n = parseInt(pos.replace('T', ''), 10);
  return isNaN(n) ? 999 : n;
}

function StatsKeyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Stats Key
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
            <p className="text-[#d4d4d4] mt-1">BirdieX proprietary rating combining 4 layers of analysis</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">SG Score (Layer 1)</span>
            <p className="text-[#d4d4d4] mt-1">Course-weighted putting regression</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">History (Layer 2)</span>
            <p className="text-[#d4d4d4] mt-1">DataGolf course history adjustment</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">Fit (Layer 3)</span>
            <p className="text-[#d4d4d4] mt-1">Course fit + skill category adjustment</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">Major (Layer 4)</span>
            <p className="text-[#d4d4d4] mt-1">Major championship performance adjustment</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">SG_PUTT / SG_APP / SG_OTT</span>
            <p className="text-[#d4d4d4] mt-1">Raw strokes gained stats from the round (Putting, Approach, Off the Tee)</p>
          </div>
          <div className="border-b border-[#1a1a1a] pb-3">
            <span className="text-[#22c55e] font-semibold">Signal</span>
            <p className="text-[#d4d4d4] mt-1">Buy/Fade recommendation based on X Score thresholds</p>
          </div>
          <div>
            <span className="text-[#22c55e] font-semibold">Purity</span>
            <p className="text-[#d4d4d4] mt-1">Whether OTT and APP stats support the signal (+/-0.45 threshold)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RankingsTable({ data }: RankingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [search, setSearch] = useState('');
  const [signalFilter, setSignalFilter] = useState<string>('ALL');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [showStatsKey, setShowStatsKey] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'player_name' ? 'asc' : 'asc');
    }
  };

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  const handleCardFilter = (filter: string) => {
    setSignalFilter(filter);
  };

  const filtered = useMemo(() => {
    let result = [...data];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.player_name.toLowerCase().includes(q));
    }

    if (signalFilter !== 'ALL') {
      if (signalFilter === 'BUYS') {
        result = result.filter((p) =>
          ['STRONGEST BUY', 'STRONG BUY', 'BUY'].includes(p.signal)
        );
      } else if (signalFilter === 'SELLS') {
        result = result.filter((p) =>
          ['FADE', 'STRONG FADE', 'STRONGEST FADE', 'SELL', 'STRONG SELL', 'STRONGEST SELL', 'LEAN SELL', 'LEAN FADE'].includes(p.signal)
        );
      }
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'rank':
          cmp = a.rank - b.rank;
          break;
        case 'player_name':
          cmp = a.player_name.localeCompare(b.player_name);
          break;
        case 'position':
          cmp = parsePosition(a.position) - parsePosition(b.position);
          break;
        case 'score_to_par':
          cmp = a.score_to_par - b.score_to_par;
          break;
        case 'sg_putt':
          cmp = b.sg_putt - a.sg_putt;
          break;
        case 'sg_app':
          cmp = b.sg_app - a.sg_app;
          break;
        case 'sg_ott':
          cmp = b.sg_ott - a.sg_ott;
          break;
        case 'sg_score_l1':
          cmp = b.sg_score_l1 - a.sg_score_l1;
          break;
        case 'course_history_l2':
          cmp = b.course_history_l2 - a.course_history_l2;
          break;
        case 'fit_plus_category_l3':
          cmp = b.fit_plus_category_l3 - a.fit_plus_category_l3;
          break;
        case 'major_adj_l4':
          cmp = b.major_adj_l4 - a.major_adj_l4;
          break;
        case 'x_score':
          cmp = b.x_score - a.x_score;
          break;
        case 'signal':
          cmp = signalOrder[a.signal] - signalOrder[b.signal];
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [data, search, signalFilter, sortField, sortDir]);

  const columns: { field: SortField; label: string; hideOnMobile?: boolean }[] = [
    { field: 'rank', label: '#' },
    { field: 'player_name', label: 'Player' },
    { field: 'position', label: 'POS' },
    { field: 'score_to_par', label: 'SCORE' },
    { field: 'sg_putt', label: 'SG_PUTT', hideOnMobile: true },
    { field: 'sg_app', label: 'SG_APP', hideOnMobile: true },
    { field: 'sg_ott', label: 'SG_OTT', hideOnMobile: true },
    { field: 'sg_score_l1', label: 'SG Score' },
    { field: 'course_history_l2', label: 'History', hideOnMobile: true },
    { field: 'fit_plus_category_l3', label: 'Fit', hideOnMobile: true },
    { field: 'major_adj_l4', label: 'Major', hideOnMobile: true },
    { field: 'x_score', label: 'X Score' },
    { field: 'signal', label: 'Signal' },
  ];

  return (
    <div>
      <SummaryCards data={data} activeFilter={signalFilter} onFilterChange={handleCardFilter} />

      {showStatsKey && <StatsKeyModal onClose={() => setShowStatsKey(false)} />}

      {/* Last updated + filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#d4d4d4] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">
            Last Updated: {currentEvent.lastUpdated}
          </span>
          <button
            onClick={() => setShowStatsKey(true)}
            className="w-5 h-5 rounded-full border border-[#22c55e]/50 text-[#22c55e] text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-[#22c55e]/10 transition-colors"
          >
            ?
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#a1a1aa] focus:outline-none focus:border-[#22c55e] flex-1 sm:flex-none sm:w-48 font-['Inter',system-ui,sans-serif]"
          />
          <select
            value={signalFilter}
            onChange={(e) => setSignalFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#22c55e]/50 rounded-lg px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#22c55e] font-['Inter',system-ui,sans-serif] cursor-pointer"
          >
            <option value="ALL">All Signals</option>
            <option value="BUYS">Buys</option>
            <option value="SELLS">Sells</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#262626]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0a0a0a] sticky top-0 z-10">
              {columns.map((col) => (
                <th
                  key={col.field}
                  onClick={() => handleSort(col.field)}
                  className={`px-3 py-3 text-left text-[10px] uppercase tracking-wider text-[#d4d4d4] font-medium cursor-pointer hover:text-[#f5f5f5] transition-colors whitespace-nowrap font-['Inter',system-ui,sans-serif] ${
                    col.hideOnMobile ? 'hidden md:table-cell' : ''
                  }`}
                >
                  {col.label}{sortArrow(col.field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => (
              <Fragment key={player.player_name}>
                <tr
                  onClick={() =>
                    setExpandedPlayer(
                      expandedPlayer === player.player_name ? null : player.player_name
                    )
                  }
                  className="cursor-pointer transition-colors border-t border-[#1a1a1a] hover:bg-[#111111] bg-[#0a0a0a]"
                >
                  <td className="px-3 py-2.5 text-[#d4d4d4] font-['JetBrains_Mono','SF_Mono',monospace] text-xs">
                    {player.rank}
                  </td>
                  <td className="px-3 py-2.5 text-[#f5f5f5] font-medium font-['Inter',system-ui,sans-serif] text-sm whitespace-nowrap">
                    {player.player_name}
                  </td>
                  <td className="px-3 py-2.5 text-[#d4d4d4] font-['JetBrains_Mono','SF_Mono',monospace] text-xs">
                    {player.position}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs">
                    <span className={
                      player.score_to_par < 0 ? 'text-[#22c55e]' : player.score_to_par > 0 ? 'text-red-400' : 'text-[#d4d4d4]'
                    }>
                      {formatScore(player.score_to_par)}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs hidden md:table-cell ${
                    player.sg_putt >= 0 ? 'text-[#22c55e]' : 'text-red-400'
                  }`}>
                    {formatSG(player.sg_putt)}
                  </td>
                  <td className={`px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs hidden md:table-cell ${
                    player.sg_app >= 0 ? 'text-[#22c55e]' : 'text-red-400'
                  }`}>
                    {formatSG(player.sg_app)}
                  </td>
                  <td className={`px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs hidden md:table-cell ${
                    player.sg_ott >= 0 ? 'text-[#22c55e]' : 'text-red-400'
                  }`}>
                    {formatSG(player.sg_ott)}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#d4d4d4]">
                    {player.sg_score_l1.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#d4d4d4] hidden md:table-cell">
                    {player.course_history_l2.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#d4d4d4] hidden md:table-cell">
                    {player.fit_plus_category_l3.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#d4d4d4] hidden md:table-cell">
                    {player.major_adj_l4.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-base font-bold font-['JetBrains_Mono','SF_Mono',monospace] ${
                      player.x_score > 0 ? 'text-[#22c55e]' : player.x_score < 0 ? 'text-red-400' : 'text-[#f5f5f5]'
                    }`}>
                      {player.x_score > 0 ? '+' : ''}{player.x_score.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <SignalBadge signal={player.signal} compact />
                      <PurityIcon player={player} />
                    </div>
                  </td>
                </tr>
                {expandedPlayer === player.player_name && (
                  <PlayerDetailCard player={player} />
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-[#d4d4d4] text-center font-['Inter',system-ui,sans-serif]">
        Showing {filtered.length} of {data.length} players -- Click any row to expand details
      </div>
    </div>
  );
}
