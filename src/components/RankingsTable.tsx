import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import type { PlayerData, SortField, SortDirection, Signal, DataSet } from '../types';
import SignalBadge from './SignalBadge';
import PurityIcon from './PurityIcon';
import SummaryCards from './SummaryCards';
import PlayerDetailCard from './PlayerDetailCard';
import PlayerSearch from './PlayerSearch';
import Avatar from './Avatar';
import DataSetToggle from './DataSetToggle';
import RankingsGlossary from './RankingsGlossary';
import { formatPlayerName } from '../lib/formatName';
import { normalizeSignal, isFade } from '../lib/signalDisplay';
import CourseFitScatter from './CourseFitScatter';
import PastChampions from './PastChampions';
import { currentEvent } from '../config/event';

interface RankingsTableProps {
  data: PlayerData[];
  dataSet: DataSet;
  onDataSetChange: (ds: DataSet) => void;
}

function formatScore(score: number): string {
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

function formatSG(value: number): string {
  return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

/** ISO data-pull timestamp -> friendly Eastern time, e.g. "6:05 PM ET". */
function formatUpdated(iso: string): string {
  const t = new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
  return `${t} ET`;
}

// Sort order for the signal column. Lower = ranked higher (strongest BUY
// first → strongest FADE last). Both legacy and new tier names map to the
// same buckets so historical data sorts correctly alongside new data.
const signalOrder: Record<Signal, number> = {
  // New 7-tier names
  'STRONG BUY': 1,
  'BUY': 2,
  'SOFT BUY': 3,
  'NEUTRAL': 4,
  'SOFT FADE': 5,
  'FADE': 6,
  'STRONG FADE': 7,
  // Legacy names — collapsed into the matching new tier rank
  'STRONGEST BUY': 1,
  'LEAN BUY': 3,
  'HOLD': 4,
  'LEAN FADE': 5,
  'STRONGEST FADE': 7,
  'LEAN SELL': 5,
  'SELL': 6,
  'STRONG SELL': 6,
  'STRONGEST SELL': 7,
};

function parsePosition(pos: string): number {
  const n = parseInt(pos.replace('T', ''), 10);
  return isNaN(n) ? 999 : n;
}

// StatsKeyModal removed — replaced by RankingsGlossary at the bottom of
// the page (no modal, no "?" button, always visible by scrolling).

export default function RankingsTable({ data, dataSet, onDataSetChange }: RankingsTableProps) {
  // Default sort: leaderboard position pre/post round (the most user-intuitive
  // ordering). Pre-tournament there's no leaderboard yet, so we fall back to
  // X Score as the default sort. Users can re-sort by any column.
  const isPreTournament = currentEvent.picksRound <= 1;
  // After the final round finishes, signals/picks are historical clutter —
  // there's no next round to bet on. Hide the Signal column, the BUYS/SELLS
  // counter cards, the signal filter dropdown, and switch the caption to
  // "Final Standings". X Score column stays as historical reference.
  const isComplete = currentEvent.isComplete;
  const [sortField, setSortField] = useState<SortField>(isPreTournament ? 'x_score' : 'position');
  const [sortDir, setSortDir] = useState<SortDirection>(
    // ascending for position (lower is better); descending for X Score
    isPreTournament ? 'desc' : 'asc',
  );
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [signalFilter, setSignalFilter] = useState<string>('ALL');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  // When the user clicks a head in the Course Fit Scatter, we need to scroll
  // to the newly-expanded row in the table. React 18 concurrent rendering can
  // delay the DOM commit past a single rAF, so we set a "pending scroll" flag
  // and a useEffect (keyed on expandedPlayer) does the scrollIntoView once
  // the row is actually in the DOM.
  const pendingScrollRef = useRef<string | null>(null);

  useEffect(() => {
    if (pendingScrollRef.current && pendingScrollRef.current === expandedPlayer) {
      const el = document.getElementById(
        `player-row-${expandedPlayer.replace(/[^a-z0-9]/gi, '-')}`,
      );
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      pendingScrollRef.current = null;
    }
  }, [expandedPlayer]);

  const playerNames = useMemo(
    () => [...data].map((p) => p.player_name).sort((a, b) => a.localeCompare(b)),
    [data]
  );

  // Outright winner odds keyed by player_name for fast lookup per row.
  // We display DataGolf's modeled `baseline_history_fit` odds so every player
  // is on an apples-to-apples basis. Best-of-book odds vary per player which
  // makes column-wide comparison confusing.
  const outrightsByName = useMemo(() => {
    const m = new Map<string, { odds: string; source: string }>();
    for (const o of currentEvent.outrights) {
      if (o.dgOdds) m.set(o.player_name, { odds: o.dgOdds, source: 'datagolf' });
    }
    return m;
  }, []);

  // American odds → payout multiplier (larger = longer shot, used for sort).
  const oddsToPayout = (odds: string): number => {
    const n = parseInt(odds, 10);
    if (!Number.isFinite(n) || n === 0) return Infinity;
    return n < 0 ? 100 / Math.abs(n) : n / 100;
  };

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

    // selectedPlayer is an exact match (set by dropdown); search is free-type substring
    if (selectedPlayer) {
      result = result.filter((p) => p.player_name === selectedPlayer);
    } else if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.player_name.toLowerCase().includes(q));
    }

    if (signalFilter !== 'ALL') {
      if (signalFilter === 'BUYS') {
        result = result.filter((p) => {
          const d = normalizeSignal(p.signal);
          return d === 'STRONG BUY' || d === 'BUY';
        });
      } else if (signalFilter === 'SELLS') {
        result = result.filter((p) => isFade(p.signal));
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
        case 'outright_odds': {
          const aOdds = outrightsByName.get(a.player_name)?.odds;
          const bOdds = outrightsByName.get(b.player_name)?.odds;
          const aP = aOdds ? oddsToPayout(aOdds) : Infinity;
          const bP = bOdds ? oddsToPayout(bOdds) : Infinity;
          cmp = aP - bP;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [data, search, selectedPlayer, signalFilter, sortField, sortDir, outrightsByName]);

  // Pre-tournament has no live SG / score / position data yet — hide those
  // columns until R1 grades. Signal is also hidden pre-R1.

  // Live-only side columns (SG splits). Live POS + SCORE are surfaced as
  // the very FIRST columns instead, replacing the old "#" rank column.
  const sgSplitColumns: { field: SortField; label: string }[] = isPreTournament
    ? []
    : [
        { field: 'sg_putt', label: 'SG_PUTT' },
        { field: 'sg_app', label: 'SG_APP' },
        { field: 'sg_ott', label: 'SG_OTT' },
      ];

  const columns: { field: SortField; label: string }[] = [
    // POS + SCORE first post-R1; nothing meaningful pre-R1.
    ...(isPreTournament
      ? []
      : [
          { field: 'position' as SortField, label: 'POS' },
          { field: 'score_to_par' as SortField, label: 'SCORE' },
        ]),
    { field: 'player_name', label: 'Player' },
    { field: 'x_score', label: 'X Score' },
    ...(isPreTournament || isComplete ? [] : [{ field: 'signal' as SortField, label: 'Signal' }]),
    { field: 'outright_odds', label: 'To Win' },
    ...sgSplitColumns,
    { field: 'sg_score_l1', label: isPreTournament ? 'DG Skill' : 'SG Score' },
    { field: 'course_history_l2', label: 'History' },
    { field: 'fit_plus_category_l3', label: 'Fit' },
    ...(currentEvent.isMajor ? [{ field: 'major_adj_l4' as SortField, label: 'Major' }] : []),
  ];

  // Reference blocks (Course Fit Scatter + Champions strip) sit at the TOP
  // pre-R1 (when the live table is mostly empty) and move to the BOTTOM
  // post-R1 (once the rankings table has real data and becomes the headline).
  // Chart comes first, then Champions below it.
  const referenceBlocks = (
    <>
      <div className="mb-6">
        <CourseFitScatter
          onPlayerClick={(p) => {
            pendingScrollRef.current = p.player_name;
            setSelectedPlayer(p.player_name);
            setExpandedPlayer(p.player_name);
            setSearch('');
          }}
        />
      </div>
      <PastChampions />
    </>
  );

  // Filters bar — last-updated + player search + signal select.
  // Threshold badge + "?" button removed (badge belongs on the Matchups
  // page; "?" replaced by the always-visible bottom glossary).
  const filtersBar = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-[#d4d4d4] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">
          Last Updated: {formatUpdated(currentEvent.dataUpdatedAt)} —{' '}
          {isComplete
            ? 'Final Standings'
            : currentEvent.picksRound > 1
              ? dataSet === 'cumulative'
                ? 'Cumulative Data Below'
                : `Round ${currentEvent.picksRound - 1} Data Below`
              : 'Pre-Tournament Rankings Below'}
        </span>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <PlayerSearch
          players={playerNames}
          selected={selectedPlayer}
          onSelect={(name) => {
            setSelectedPlayer(name);
            setSearch('');
          }}
          onClear={() => {
            setSelectedPlayer(null);
            setSearch('');
          }}
        />
        {!isComplete && (
          <select
            value={signalFilter}
            onChange={(e) => setSignalFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#22c55e]/50 rounded-lg px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#22c55e] font-['Inter',system-ui,sans-serif] cursor-pointer"
          >
            <option value="ALL">All Signals</option>
            <option value="BUYS">Buys</option>
            <option value="SELLS">Sells</option>
          </select>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Tournament-complete banner — sits above everything else so users
          immediately know they're looking at historical / final data, not
          live picks for an upcoming round. */}
      {isComplete && (
        <div className="mb-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg px-4 py-3 flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-[#22c55e] font-bold font-['Inter',system-ui,sans-serif]">
            Tournament Complete — Final Standings
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            Picks resume at the next event
          </span>
        </div>
      )}

      {/* Pre-R1: no data toggle yet (no rounds played). Post-R1 the toggle
          appears with the latest-round pill enabled + Cumulative disabled
          until 2+ rounds exist. Post-final: also hidden — historical data
          only, no toggle meaningful. */}
      {!isPreTournament && !isComplete && (
        <DataSetToggle dataSet={dataSet} onChange={onDataSetChange} />
      )}

      {/* PRE-R1: reference blocks (champions, chart) at top, then summary
          cards, then filters, then table. The table is mostly empty pre-R1
          so we lead with the visual + historical references.

          POST-R1 (live): filters + cards + table FIRST (the rankings table is
          the headline content once we have real data). Reference blocks move
          to the bottom.

          POST-FINAL: hide the BUYS/SELLS counter cards — those signals point
          at picks for a round that no longer exists. */}
      {isPreTournament ? (
        <>
          {referenceBlocks}
          <SummaryCards data={data} activeFilter={signalFilter} onFilterChange={handleCardFilter} />
          {filtersBar}
        </>
      ) : isComplete ? (
        <>{filtersBar}</>
      ) : (
        <>
          {filtersBar}
          <SummaryCards data={data} activeFilter={signalFilter} onFilterChange={handleCardFilter} />
        </>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#262626]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0a0a0a] sticky top-0 z-10">
              {columns.map((col) => (
                <th
                  key={col.field}
                  onClick={() => handleSort(col.field)}
                  className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-[#d4d4d4] font-medium cursor-pointer hover:text-[#f5f5f5] transition-colors whitespace-nowrap font-['Inter',system-ui,sans-serif]"
                >
                  {col.label}{sortArrow(col.field)}
                  {col.field === 'x_score' && (
                    <span
                      className="ml-1 text-[#22c55e]/70"
                      title="Scroll right for full stats"
                    >
                      →
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => (
              <Fragment key={player.player_name}>
                <tr
                  id={`player-row-${player.player_name.replace(/[^a-z0-9]/gi, '-')}`}
                  onClick={() =>
                    setExpandedPlayer(
                      expandedPlayer === player.player_name ? null : player.player_name
                    )
                  }
                  className="cursor-pointer transition-colors border-t border-[#1a1a1a] hover:bg-[#111111] bg-[#0a0a0a]"
                >
                  {/* POS + SCORE first post-R1 (replaces the old "#" column);
                      both are absent pre-R1. */}
                  {!isPreTournament && (
                    <>
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
                    </>
                  )}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Avatar playerName={player.player_name} size="sm" />
                      <span className="text-[#f5f5f5] font-medium font-['Inter',system-ui,sans-serif] text-sm whitespace-nowrap">
                        {formatPlayerName(player.player_name)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-base font-bold font-['JetBrains_Mono','SF_Mono',monospace] ${
                      player.x_score > 0 ? 'text-[#22c55e]' : player.x_score < 0 ? 'text-red-400' : 'text-[#f5f5f5]'
                    }`}>
                      {player.x_score > 0 ? '+' : ''}{player.x_score.toFixed(2)}
                    </span>
                  </td>
                  {!isPreTournament && (
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <SignalBadge signal={player.signal} compact conflicted={player.purity === 'CONFLICTED'} />
                        <PurityIcon player={player} />
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs whitespace-nowrap">
                    {(() => {
                      const o = outrightsByName.get(player.player_name);
                      if (!o) return <span className="text-[#525252]">—</span>;
                      return (
                        <span
                          className="text-[#22c55e]"
                          title={`DataGolf modeled winner odds (baseline + history + fit)`}
                        >
                          {o.odds}
                          <span className="text-[#737373] ml-1 text-[10px]">dg</span>
                        </span>
                      );
                    })()}
                  </td>
                  {!isPreTournament && (
                    <>
                      <td className={`px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs ${
                        player.sg_putt >= 0 ? 'text-[#22c55e]' : 'text-red-400'
                      }`}>
                        {formatSG(player.sg_putt)}
                      </td>
                      <td className={`px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs ${
                        player.sg_app >= 0 ? 'text-[#22c55e]' : 'text-red-400'
                      }`}>
                        {formatSG(player.sg_app)}
                      </td>
                      <td className={`px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs ${
                        player.sg_ott >= 0 ? 'text-[#22c55e]' : 'text-red-400'
                      }`}>
                        {formatSG(player.sg_ott)}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#d4d4d4]">
                    {player.sg_score_l1.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#d4d4d4]">
                    {player.course_history_l2.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#d4d4d4]">
                    {player.fit_plus_category_l3.toFixed(2)}
                  </td>
                  {currentEvent.isMajor && (
                    <td className="px-3 py-2.5 font-['JetBrains_Mono','SF_Mono',monospace] text-xs text-[#d4d4d4]">
                      {player.major_adj_l4.toFixed(2)}
                    </td>
                  )}
                </tr>
                {expandedPlayer === player.player_name && (
                  <PlayerDetailCard player={player} colSpan={columns.length} />
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-[#d4d4d4] text-center font-['Inter',system-ui,sans-serif]">
        Showing {filtered.length} of {data.length} players -- Click any row to expand details
      </div>

      {/* Post-R1: reference blocks demoted to the bottom now that the
          rankings table has taken the top slot. */}
      {!isPreTournament && (
        <div className="mt-8">{referenceBlocks}</div>
      )}

      {/* Full glossary — always at the bottom, above the footer. */}
      <RankingsGlossary />
    </div>
  );
}
