/**
 * SimulatorPage — Tournament Simulator tab.
 *
 * One-click Monte Carlo: 10,000 simulated tournaments. Each click runs a
 * fresh simulation using DataGolf skill estimates + BirdieX X Score
 * adjustments. Progressive reveal animation while results stream in.
 *
 * After the run completes, results table shows BirdieX MC probabilities
 * side-by-side with DataGolf's published projections — so users can see
 * where the two models agree and where they diverge.
 *
 * Inspired by the BracketX SIMULATE button experience.
 */
import { useMemo, useState, useEffect, useRef } from 'react';
import { currentEvent } from '../config/event';
import { headshots } from '../data/headshots';
import {
  buildSimInputs,
  runSimulation,
  fmtPct,
  type SimulationResult,
} from '../lib/simulator';
import RecommendedFloorBadge from './RecommendedFloorBadge';

const N_SIMS = 10000;
const REVEAL_BATCH_MS = 70; // ms between successive row reveals
const SIMULATING_MIN_MS = 2200; // min "running" time for engagement

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
  const [results, setResults] = useState<RowWithDg[] | null>(null);
  const [revealCount, setRevealCount] = useState(0);
  const [runCount, setRunCount] = useState(0);
  const revealTimer = useRef<number | null>(null);

  // DataGolf comparison data — keyed by player_name.
  const dgByName = useMemo(() => {
    const m = new Map<string, RowWithDg['dg_win_prob' | 'dg_top5_prob' | 'dg_top10_prob' | 'dg_top20_prob' | 'dg_make_cut_prob']>() as unknown as Map<string, {
      dg_win_prob: number | null;
      dg_top5_prob: number | null;
      dg_top10_prob: number | null;
      dg_top20_prob: number | null;
      dg_make_cut_prob: number | null;
    }>;
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

  const runSim = () => {
    if (running) return;
    setRunning(true);
    setResults(null);
    setRevealCount(0);
    if (revealTimer.current) {
      clearInterval(revealTimer.current);
      revealTimer.current = null;
    }

    // Yield to the UI before running the heavy sim.
    const start = performance.now();
    setTimeout(() => {
      const inputs = buildSimInputs(currentEvent.rankingsRound, currentEvent.skillEstimates);
      const rawResults = runSimulation(inputs, N_SIMS);
      const enriched: RowWithDg[] = rawResults.map((r) => {
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

      // Hold the "SIMULATING..." state for at least SIMULATING_MIN_MS so
      // the click feels like a real computation (engagement, not lag).
      const elapsed = performance.now() - start;
      const delay = Math.max(0, SIMULATING_MIN_MS - elapsed);
      setTimeout(() => {
        setResults(enriched);
        setRunning(false);
        setRunCount((c) => c + 1);

        // Progressive row reveal.
        let i = 0;
        revealTimer.current = window.setInterval(() => {
          i++;
          setRevealCount(i);
          if (i >= 25) {
            // After top 25 reveal fully, reveal the rest at once
            setRevealCount(enriched.length);
            if (revealTimer.current) {
              clearInterval(revealTimer.current);
              revealTimer.current = null;
            }
          }
        }, REVEAL_BATCH_MS);
      }, delay);
    }, 30);
  };

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearInterval(revealTimer.current);
    };
  }, []);

  const visibleResults = results ? results.slice(0, Math.max(revealCount, 0)) : [];

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
              Monte Carlo simulation of <span className="text-[#22c55e] font-semibold font-['JetBrains_Mono','SF_Mono',monospace]">{N_SIMS.toLocaleString()}</span>{' '}
              tournaments. Each run draws 4 rounds per player from a normal
              distribution centered on the BirdieX-adjusted skill estimate.
              Compare our results to DataGolf&rsquo;s published projections in
              the rightmost columns.
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
              Run #{runCount} · {N_SIMS.toLocaleString()} sims
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {!results && !running && (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-8 text-center">
          <div className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] mb-3">
            Ready to Run
          </div>
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] max-w-md mx-auto leading-relaxed">
            Click <span className="text-[#22c55e] font-semibold">Run Simulation</span> to generate{' '}
            {N_SIMS.toLocaleString()} tournament outcomes using the current field. Win, Top-5,
            Top-10, Top-20, and Cut probabilities will populate below.
          </p>
        </div>
      )}

      {running && (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-8 text-center">
          <div className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] mb-3">
            Simulating Tournament
          </div>
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] max-w-md mx-auto leading-relaxed mb-5">
            Running {N_SIMS.toLocaleString()} Monte Carlo simulations…
          </p>
          {/* Indeterminate progress bar */}
          <div className="max-w-md mx-auto h-1 bg-[#262626] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#22c55e] rounded-full"
              style={{
                width: '40%',
                animation: 'simBar 1.4s ease-in-out infinite',
              }}
            />
          </div>
          <style>{`
            @keyframes simBar {
              0%   { transform: translateX(-100%); }
              50%  { transform: translateX(125%); }
              100% { transform: translateX(250%); }
            }
            @media (prefers-reduced-motion: reduce) {
              [style*="animation: simBar"] { animation: none !important; width: 100% !important; }
            }
          `}</style>
        </div>
      )}

      {results && (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
              Results · Top {Math.min(visibleResults.length, 50)}
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
                {visibleResults.slice(0, 50).map((row, i) => {
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
                      {/* BirdieX MC columns */}
                      {[
                        row.result.win_prob,
                        row.result.top_5_prob,
                        row.result.top_10_prob,
                        row.result.top_20_prob,
                        row.result.made_cut_prob,
                      ].map((p, j) => (
                        <td
                          key={`bx-${j}`}
                          className="px-3 py-2 text-right text-xs text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium"
                        >
                          {fmtPct(p)}
                        </td>
                      ))}
                      {/* DataGolf comparison columns */}
                      {[
                        row.dg_win_prob,
                        row.dg_top5_prob,
                        row.dg_top10_prob,
                        row.dg_top20_prob,
                        row.dg_make_cut_prob,
                      ].map((p, j) => (
                        <td
                          key={`dg-${j}`}
                          className="px-3 py-2 text-right text-xs text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace]"
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
            BirdieX MC uses each player&rsquo;s DataGolf skill estimate plus the
            BirdieX X-Score adjustment as a per-round expected strokes-gained.
            Each round draws from a normal distribution with σ = 2.7 strokes
            (PGA Tour empirical). DataGolf&rsquo;s model uses a similar but
            independent formulation &mdash; differences in our columns reflect
            our X-Score tilt (course history + fit + major adjustments).
          </div>
        </div>
      )}
    </div>
  );
}
