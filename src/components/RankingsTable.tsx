import { useState, useMemo } from 'react';
import type { PlayerData, SortField, SortDirection, Signal } from '../types';
import SignalBadge from './SignalBadge';
import PurityIcon from './PurityIcon';
import SummaryCards from './SummaryCards';
import PlayerDetailCard from './PlayerDetailCard';

interface RankingsTableProps {
  data: PlayerData[];
}

function formatScore(score: number): string {
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

const signalOrder: Record<Signal, number> = {
  'STRONGEST BUY': 1,
  'STRONG BUY': 2,
  'BUY': 3,
  'HOLD': 4,
  'FADE': 5,
  'STRONG FADE': 6,
  'STRONGEST FADE': 7,
};

function parsePosition(pos: string): number {
  const n = parseInt(pos.replace('T', ''), 10);
  return isNaN(n) ? 999 : n;
}

export default function RankingsTable({ data }: RankingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [search, setSearch] = useState('');
  const [signalFilter, setSignalFilter] = useState<string>('ALL');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

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
      } else if (signalFilter === 'HOLDS') {
        result = result.filter((p) => p.signal === 'HOLD');
      } else if (signalFilter === 'FADES') {
        result = result.filter((p) =>
          ['FADE', 'STRONG FADE', 'STRONGEST FADE'].includes(p.signal)
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
    { field: 'score_to_par', label: 'R1' },
    { field: 'sg_score_l1', label: 'SG Score' },
    { field: 'course_history_l2', label: 'History', hideOnMobile: true },
    { field: 'fit_plus_category_l3', label: 'Fit', hideOnMobile: true },
    { field: 'major_adj_l4', label: 'Major', hideOnMobile: true },
    { field: 'x_score', label: 'X Score' },
    { field: 'signal', label: 'Signal' },
  ];

  return (
    <div>
      <SummaryCards data={data} />

      {/* Last updated + filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <span className="text-[11px] text-[#52525b] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">
          Last Updated: Masters R1 - April 10, 2026
        </span>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#52525b] focus:outline-none focus:border-[#006747] flex-1 sm:flex-none sm:w-48 font-['Inter',system-ui,sans-serif]"
          />
          <select
            value={signalFilter}
            onChange={(e) => setSignalFilter(e.target.value)}
            className="bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#006747] font-['Inter',system-ui,sans-serif] cursor-pointer"
          >
            <option value="ALL">All Signals</option>
            <option value="BUYS">Buys</option>
            <option value="HOLDS">Holds</option>
            <option value="FADES">Fades</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#262626]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#111111] sticky top-0 z-10">
              {columns.map((col) => (
                <th
                  key={col.field}
                  onClick={() => handleSort(col.field)}
                  className={`px-3 py-3 text-left text-[10px] uppercase tracking-wider text-[#52525b] font-medium cursor-pointer hover:text-[#a1a1aa] transition-colors whitespace-nowrap font-['Inter',system-ui,sans-serif] ${
                    col.hideOnMobile ? 'hidden md:table-cell' : ''
                  }`}
                >
                  {col.label}{sortArrow(col.field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((player, idx) => (
              <>
                <tr
                  key={player.player_name}
                  onClick={() =>
                    setExpandedPlayer(
                      expandedPlayer === player.player_name ? null : player.player_name
                    )
                  }
                  className={`cursor-pointer transition-colors border-t border-[#1a1a1a] hover:bg-[#1a1a1a] ${
                    idx % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-[#111111]'
                  }`}
                >
                  <td className="px-3 py-2.5 text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace] text-xs">
                    {player.rank}
                  </td>
                  <td className="px-3 py-2.5 text-[#f5f5f5] font-medium font-['Inter',system-ui,sans-serif] text-sm whitespace-nowrap">
                    {player.player_name}
                  </td>
                  <td className="px-3 py-2.5 text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace] text-xs">
                    {player.position}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs">
                    <span className={
                      player.score_to_par < 0 ? 'text-green-400' : player.score_to_par > 0 ? 'text-red-400' : 'text-[#a1a1aa]'
                    }>
                      {formatScore(player.score_to_par)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#a1a1aa]">
                    {player.sg_score_l1.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#a1a1aa] hidden md:table-cell">
                    {player.course_history_l2.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#a1a1aa] hidden md:table-cell">
                    {player.fit_plus_category_l3.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#a1a1aa] hidden md:table-cell">
                    {player.major_adj_l4.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-base font-bold font-['JetBrains_Mono','SF_Mono',monospace] ${
                      player.x_score > 0 ? 'text-green-400' : player.x_score < 0 ? 'text-red-400' : 'text-[#f5f5f5]'
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
                  <PlayerDetailCard key={`detail-${player.player_name}`} player={player} />
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-[#52525b] text-center font-['Inter',system-ui,sans-serif]">
        Showing {filtered.length} of {data.length} players -- Click any row to expand details
      </div>
    </div>
  );
}
