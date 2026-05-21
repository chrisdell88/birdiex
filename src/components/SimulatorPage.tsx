/**
 * SimulatorPage — Tournament Simulator with a live-converging leaderboard.
 *
 * Click "Run Simulation" and the Monte Carlo runs in 10 chunks of 1,000
 * sims each. After each chunk, the displayed leaderboard updates so you
 * can watch the probabilities converge to their final values in real
 * time. After all 10,000 sims complete, the full results table appears
 * with the DataGolf comparison columns.
 *
 * Visual style: clean, data-forward, modern. No gimmicks — the animation
 * IS the data, watching it stabilize.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { currentEvent } from '../config/event';
import { headshots } from '../data/headshots';
import {
  buildSimInputs,
  createAccumulator,
  runSimChunk,
  finalizeResults,
  fmtPct,
  type SimulationResult,
} from '../lib/simulator';
import RecommendedFloorBadge from './RecommendedFloorBadge';

const TOTAL_SIMS = 10000;
const CHUNK_SIZE = 1000;
const TOTAL_CHUNKS = TOTAL_SIMS / CHUNK_SIZE;
const CHUNK_MIN_INTERVAL_MS = 140; // visual pacing so users see the convergence

function getInitials(name: string): string {
  const parts = name.split(',').map((s) => s.trim());
  if (parts.length >= 2) {
    const first = parts[1] ?? '';
    const last = parts[0] ?? '';
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface RowWithDg {
  result: SimulationResult;
  dg_win_prob: number | null;
  dg_top5_prob: number | null;
  dg_top10_prob: number | null;
  dg_top20_prob: number | null;
  dg_make_cut_prob: number | null;
}

export default function SimulatorPage() {
  const [running, setRunning] = useState(false);
  const [chunksDone, setChunksDone] = useState(0);
  const [liveResults, setLiveResults] = useState<SimulationResult[] | null>(null);
  const [results, setResults] = useState<RowWithDg[] | null>(null);
  const [runCount, setRunCount] = useState(0);
  const cancelRef = useRef(false);

  const dgByName = useMemo(() => {
    const m = new Map<string, {
      dg_win_prob: number | null;
      dg_top5_prob: number | null;
      dg_top10_prob: number | null;
      dg_top20_prob: number | null;
      dg_make_cut_prob: number | null;
    }>();
    for (const s of currentEvent.skillEstimates) {
      m.set(s.player_name, {
        dg_win_prob: s.dg_win_prob,
        dg_top5_prob: s.dg_top5_prob,
        dg_top10_prob: s.dg_top10_prob,
        dg_top20_prob: s.dg_top20_prob,
        dg_make_cut_prob: s.dg_make_cut_prob,
      });
    }
    return m;
  }, []);

  const runSim = async () => {
    if (running) return;
    cancelRef.current = false;
    setRunning(true);
    setResults(null);
    setLiveResults(null);
    setChunksDone(0);

    // Yield to UI before allocating.
    await new Promise((r) => setTimeout(r, 30));

    const inputs = buildSimInputs(currentEvent.rankingsRound, currentEvent.skillEstimates);
    const acc = createAccumulator(inputs);

    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      if (cancelRef.current) {
        setRunning(false);
        return;
      }
      const chunkStart = performance.now();
      runSimChunk(acc, CHUNK_SIZE);
      const partial = finalizeResults(acc);
      setLiveResults(partial);
      setChunksDone(i + 1);

      // Pace the visual update — wait at least CHUNK_MIN_INTERVAL_MS so
      // users can see the convergence (compute is much faster than that).
      const elapsed = performance.now() - chunkStart;
      const wait = Math.max(0, CHUNK_MIN_INTERVAL_MS - elapsed);
      await new Promise((r) => setTimeout(r, wait));
    }

    // Build the enriched final results with DG comparison columns.
    const final = finalizeResults(acc).map((r) => {
      const dg = dgByName.get(r.player_name);
      return {
        result: r,
        dg_win_prob: dg?.dg_win_prob ?? null,
        dg_top5_prob: dg?.dg_top5_prob ?? null,
        dg_top10_prob: dg?.dg_top10_prob ?? null,
        dg_top20_prob: dg?.dg_top20_prob ?? null,
        dg_make_cut_prob: dg?.dg_make_cut_prob ?? null,
      };
    });

    // Small final pause before revealing full table.
    await new Promise((r) => setTimeout(r, 200));
    setResults(final);
    setRunning(false);
    setRunCount((c) => c + 1);
  };

  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const liveTop10 = liveResults?.slice(0, 10) ?? [];
  const progress = chunksDone / TOTAL_CHUNKS;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#0a0a0a] border border-[#22c55e]/30 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="bg-[#22c55e]/15 text-[#22c55e] text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full font-['Inter',system-ui,sans-serif]">
                Tournament Simulator
              </span>
              <span className="text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
                {currentEvent.name} · {currentEvent.course}
              </span>
            </div>
            <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed max-w-2xl">
              Monte Carlo of <span className="text-[#22c55e] font-semibold font-['JetBrains_Mono','SF_Mono',monospace]">{TOTAL_SIMS.toLocaleString()}</span>{' '}
              tournaments. Each player&rsquo;s 4 rounds drawn from a normal
              distribution centered on their BirdieX-adjusted skill. Watch the
              live leaderboard converge as runs accumulate, then compare to
              DataGolf&rsquo;s model.
            </p>
          </div>
          <RecommendedFloorBadge
            threshold={currentEvent.recommendedFloor}
            course={currentEvent.course}
          />
        </div>

        {/* Run controls */}
        <div className="flex items-center gap-4 flex-wrap mt-4 pt-4 border-t border-[#262626]">
          <button
            type="button"
            onClick={runSim}
            disabled={running}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg font-['Inter',system-ui,sans-serif] transition-all ${
              running
                ? 'bg-[#22c55e]/20 text-[#22c55e]/70 cursor-not-allowed'
                : results
                  ? 'bg-[#0a0a0a] border border-[#22c55e]/50 text-[#22c55e] hover:bg-[#22c55e]/10 cursor-pointer'
                  : 'bg-[#22c55e] text-[#0a0a0a] hover:bg-[#16a34a] cursor-pointer shadow-lg shadow-[#22c55e]/20'
            }`}
          >
            {running ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                Simulating…
              </span>
            ) : results ? (
              <span>↺ Re-Simulate</span>
            ) : (
              <span>▶ Run Simulation</span>
            )}
          </button>

          {runCount > 0 && (
            <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
              Run #{runCount} · {TOTAL_SIMS.toLocaleString()} sims
            </span>
          )}
        </div>
      </div>

      {/* Idle empty state */}
      {!results && !running && (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-8 text-center">
          <div className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] mb-3">
            Ready to Run
          </div>
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] max-w-md mx-auto leading-relaxed">
            Click <span className="text-[#22c55e] font-semibold">Run Simulation</span> to generate{' '}
            {TOTAL_SIMS.toLocaleString()} tournament outcomes using the current field. Win, Top-5,
            Top-10, Top-20, and Cut probabilities will converge live below.
          </p>
        </div>
      )}

      {/* Running — live converging leaderboard */}
      {running && (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden">
          {/* Progress strip */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif]">
                  Simulating Tournament
                </div>
                <div className="text-sm text-[#f5f5f5] font-['JetBrains_Mono','SF_Mono',monospace] mt-1">
                  {(chunksDone * CHUNK_SIZE).toLocaleString()}
                  <span className="text-[#737373]"> / {TOTAL_SIMS.toLocaleString()}</span>
                  <span className="text-[10px] text-[#a1a1aa] ml-2 font-['Inter',system-ui,sans-serif] uppercase tracking-wider">
                    simulations complete
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
                  Convergence
                </div>
                <div className="text-lg font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e]">
                  {(progress * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#22c55e]/70 via-[#22c55e] to-[#4ade80] rounded-full transition-[width] duration-150 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Live top-10 leaderboard */}
          <div className="px-5 pb-5">
            <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] mt-4 mb-3">
              Live Leaderboard — Top 10 by Win Probability
            </div>
            <div className="space-y-1.5">
              {liveTop10.length === 0 ? (
                // Initial frame before chunk 1 completes
                <div className="text-xs text-[#737373] py-6 text-center font-['Inter',system-ui,sans-serif]">
                  Drawing initial round scores…
                </div>
              ) : (
                liveTop10.map((r, i) => {
                  const url = headshots[r.player_name];
                  // Bar width = win_prob normalized to the top player.
                  const maxWin = liveTop10[0]?.win_prob || 1;
                  const barWidth = (r.win_prob / maxWin) * 100;
                  return (
                    <div
                      key={r.player_name}
                      className="flex items-center gap-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md px-3 py-1.5"
                      style={{ transition: 'all 200ms ease' }}
                    >
                      <span className="text-[10px] text-[#737373] font-['JetBrains_Mono','SF_Mono',monospace] w-4 shrink-0">
                        {i + 1}
                      </span>
                      <span className="w-7 h-7 rounded-full overflow-hidden border border-[#262626] bg-[#1a1a1a] shrink-0 inline-flex items-center justify-center">
                        {url ? (
                          <img
                            src={url}
                            alt={r.player_name}
                            className="w-full h-full object-cover object-top"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                            {getInitials(r.player_name)}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-[#f5f5f5] font-['Inter',system-ui,sans-serif] w-44 shrink-0 truncate">
                        {r.player_name}
                      </span>
                      <div className="flex-1 relative h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#22c55e]/60 to-[#22c55e] rounded-full"
                          style={{
                            width: `${barWidth}%`,
                            transition: 'width 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e] w-14 text-right shrink-0 tabular-nums"
                        style={{ transition: 'color 200ms ease' }}
                      >
                        {fmtPct(r.win_prob)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <style>{`
            @media (prefers-reduced-motion: reduce) {
              [style*="transition"] { transition: none !important; }
            }
          `}</style>
        </div>
      )}

      {/* Completed — full comparison table */}
      {results && !running && (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
              Results · Top {Math.min(results.length, 50)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
              BirdieX MC vs. DataGolf model
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] sticky left-0 bg-[#0a0a0a] z-10">
                    #
                  </th>
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]">
                    Player
                  </th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif]" colSpan={5}>
                    BirdieX MC
                  </th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]" colSpan={5}>
                    DataGolf Model
                  </th>
                </tr>
                <tr className="border-b border-[#262626] bg-[#0a0a0a]">
                  <th className="px-3 py-2 sticky left-0 bg-[#0a0a0a] z-10" />
                  <th className="px-3 py-2" />
                  {(['WIN', 'T5', 'T10', 'T20', 'CUT'] as const).map((c) => (
                    <th
                      key={`bx-${c}`}
                      className="px-3 py-2 text-right text-[9px] uppercase tracking-wider text-[#22c55e]/80 font-medium font-['Inter',system-ui,sans-serif]"
                    >
                      {c}
                    </th>
                  ))}
                  {(['WIN', 'T5', 'T10', 'T20', 'CUT'] as const).map((c) => (
                    <th
                      key={`dg-${c}`}
                      className="px-3 py-2 text-right text-[9px] uppercase tracking-wider text-[#737373] font-medium font-['Inter',system-ui,sans-serif]"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 50).map((row, i) => {
                  const url = headshots[row.result.player_name];
                  return (
                    <tr
                      key={row.result.player_name}
                      className={`border-t border-[#1a1a1a] transition-colors ${
                        i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'
                      }`}
                      style={{
                        animation: 'simRowIn 280ms ease forwards',
                        opacity: 0,
                        animationDelay: `${Math.min(i, 25) * 22}ms`,
                      }}
                    >
                      <td
                        className={`px-3 py-2 text-xs text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace] sticky left-0 z-10 ${
                          i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'
                        }`}
                      >
                        {i + 1}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full overflow-hidden border border-[#262626] bg-[#1a1a1a] shrink-0 inline-flex items-center justify-center">
                            {url ? (
                              <img
                                src={url}
                                alt={row.result.player_name}
                                className="w-full h-full object-cover object-top"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-[9px] font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                                {getInitials(row.result.player_name)}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                            {row.result.player_name}
                          </span>
                        </div>
                      </td>
                      {[
                        row.result.win_prob,
                        row.result.top_5_prob,
                        row.result.top_10_prob,
                        row.result.top_20_prob,
                        row.result.made_cut_prob,
                      ].map((p, j) => (
                        <td
                          key={`bx-${j}`}
                          className="px-3 py-2 text-right text-xs text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium tabular-nums"
                        >
                          {fmtPct(p)}
                        </td>
                      ))}
                      {[
                        row.dg_win_prob,
                        row.dg_top5_prob,
                        row.dg_top10_prob,
                        row.dg_top20_prob,
                        row.dg_make_cut_prob,
                      ].map((p, j) => (
                        <td
                          key={`dg-${j}`}
                          className="px-3 py-2 text-right text-xs text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace] tabular-nums"
                        >
                          {fmtPct(p ?? undefined)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <style>{`
            @keyframes simRowIn {
              from { opacity: 0; transform: translateY(6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              tr[style*="simRowIn"] { animation: none !important; opacity: 1 !important; }
            }
          `}</style>

          <div className="px-4 py-3 border-t border-[#262626] text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed">
            BirdieX MC uses each player&rsquo;s DataGolf skill estimate plus
            the BirdieX X-Score adjustment as a per-round expected
            strokes-gained. Each round draws from a normal distribution with
            σ = 2.7 strokes (PGA Tour empirical). Differences vs the DataGolf
            columns reflect our X-Score tilt (course history + fit + major
            adjustments).
          </div>
        </div>
      )}
    </div>
  );
}
