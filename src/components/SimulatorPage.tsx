/**
 * SimulatorPage — Tournament Simulator with TWO modes:
 *
 * 1. SINGLE TOURNAMENT (default) — Run ONE simulated weekend. Rounds
 *    reveal one at a time (R1 → R2 → cut → R3 → R4 → final leaderboard).
 *    Different result every click. Scheffler doesn't win every time.
 *    This is the "watch the tournament happen" experience.
 *
 * 2. 10K AGGREGATE — Run the full Monte Carlo (10,000 sims) with a
 *    live-converging top-10 leaderboard. Final table compares BirdieX
 *    probabilities vs DataGolf's published projections.
 *
 * Each mode addresses a different question:
 *   "What might happen?"        → Single Tournament
 *   "What's most likely to happen?" → 10K Aggregate
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { currentEvent } from '../config/event';
import { headshots } from '../data/headshots';
import {
  buildSimInputs,
  createAccumulator,
  runSimChunk,
  finalizeResults,
  simulateOneTournament,
  fmtPct,
  type SimulationResult,
  type SingleTournamentResult,
} from '../lib/simulator';
import RecommendedFloorBadge from './RecommendedFloorBadge';

type Mode = 'single' | 'aggregate';

const TOTAL_SIMS = 10000;
const CHUNK_SIZE = 1000;
const TOTAL_CHUNKS = TOTAL_SIMS / CHUNK_SIZE;
const CHUNK_MIN_INTERVAL_MS = 140;

// Single-tournament reveal pacing — how long each phase takes
const SINGLE_REVEAL_R1_MS = 700;
const SINGLE_REVEAL_R2_MS = 700;
const SINGLE_REVEAL_CUT_MS = 500;
const SINGLE_REVEAL_R3_MS = 700;
const SINGLE_REVEAL_R4_MS = 700;

type RevealStage = 'idle' | 'r1' | 'r2' | 'cut' | 'r3' | 'r4' | 'final';

function getInitials(name: string): string {
  const parts = name.split(',').map((s) => s.trim());
  if (parts.length >= 2) {
    const first = parts[1] ?? '';
    const last = parts[0] ?? '';
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function fmtScore(s: number | null): string {
  if (s == null) return '—';
  if (s === 0) return 'E';
  return s > 0 ? `+${s.toFixed(1)}` : s.toFixed(1);
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
  const [mode, setMode] = useState<Mode>('single');

  // Single-tournament state
  const [single, setSingle] = useState<SingleTournamentResult[] | null>(null);
  const [stage, setStage] = useState<RevealStage>('idle');

  // Aggregate state
  const [aggRunning, setAggRunning] = useState(false);
  const [aggChunksDone, setAggChunksDone] = useState(0);
  const [aggLive, setAggLive] = useState<SimulationResult[] | null>(null);
  const [aggResults, setAggResults] = useState<RowWithDg[] | null>(null);
  // After each 10K run, ALSO simulate ONE fresh tournament and show its
  // winner. This adds visible variance — the aggregate ranking is
  // deterministic (same player always #1 because their win prob is
  // highest), but the "sample tournament winner" differs per re-sim.

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

  // ─────────────────────────────────────────────────────────────
  // Mode 1: Single Tournament
  // ─────────────────────────────────────────────────────────────
  const runSingle = async () => {
    if (stage !== 'idle' && stage !== 'final') return;
    cancelRef.current = false;
    setSingle(null);
    setStage('r1');

    await new Promise((r) => setTimeout(r, 30));

    const inputs = buildSimInputs(currentEvent.rankingsRound, currentEvent.skillEstimates);
    const result = simulateOneTournament(inputs);

    // Phase-by-phase reveal: R1 → R2 → cut → R3 → R4 → final
    setSingle(result);
    await new Promise((r) => setTimeout(r, SINGLE_REVEAL_R1_MS));
    if (cancelRef.current) return;
    setStage('r2');
    await new Promise((r) => setTimeout(r, SINGLE_REVEAL_R2_MS));
    if (cancelRef.current) return;
    setStage('cut');
    await new Promise((r) => setTimeout(r, SINGLE_REVEAL_CUT_MS));
    if (cancelRef.current) return;
    setStage('r3');
    await new Promise((r) => setTimeout(r, SINGLE_REVEAL_R3_MS));
    if (cancelRef.current) return;
    setStage('r4');
    await new Promise((r) => setTimeout(r, SINGLE_REVEAL_R4_MS));
    if (cancelRef.current) return;
    setStage('final');
    setRunCount((c) => c + 1);
  };

  // ─────────────────────────────────────────────────────────────
  // Mode 2: 10K Aggregate
  // ─────────────────────────────────────────────────────────────
  const runAggregate = async () => {
    if (aggRunning) return;
    cancelRef.current = false;
    setAggRunning(true);
    setAggResults(null);
    setAggLive(null);
    setAggChunksDone(0);
    await new Promise((r) => setTimeout(r, 30));

    const inputs = buildSimInputs(currentEvent.rankingsRound, currentEvent.skillEstimates);
    const acc = createAccumulator(inputs);

    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      if (cancelRef.current) {
        setAggRunning(false);
        return;
      }
      const chunkStart = performance.now();
      runSimChunk(acc, CHUNK_SIZE);
      const partial = finalizeResults(acc);
      setAggLive(partial);
      setAggChunksDone(i + 1);
      const elapsed = performance.now() - chunkStart;
      const wait = Math.max(0, CHUNK_MIN_INTERVAL_MS - elapsed);
      await new Promise((r) => setTimeout(r, wait));
    }

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

    await new Promise((r) => setTimeout(r, 200));
    setAggResults(final);
    setAggRunning(false);
    setRunCount((c) => c + 1);
  };

  useEffect(() => () => { cancelRef.current = true; }, []);

  // Reset all state when switching modes
  const handleSwitchMode = (m: Mode) => {
    if (m === mode) return;
    cancelRef.current = true;
    setMode(m);
    setSingle(null);
    setStage('idle');
    setAggRunning(false);
    setAggLive(null);
    setAggResults(null);
    setAggChunksDone(0);
  };

  const singleRunning = stage !== 'idle' && stage !== 'final';
  const aggProgress = aggChunksDone / TOTAL_CHUNKS;
  const aggLiveTop10 = aggLive?.slice(0, 10) ?? [];

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
              Two modes. <span className="text-[#22c55e] font-semibold">Single Tournament</span>{' '}
              plays out ONE weekend round-by-round (different result every click).{' '}
              <span className="text-[#22c55e] font-semibold">10K Aggregate</span> runs the full
              Monte Carlo and shows long-run probabilities vs. DataGolf&rsquo;s model.
            </p>
          </div>
          <RecommendedFloorBadge
            threshold={currentEvent.recommendedFloor}
            course={currentEvent.course}
          />
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#262626] flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] mr-1">
            Mode:
          </span>
          <div className="flex border border-[#22c55e]/50 rounded-full p-0.5">
            <button
              type="button"
              onClick={() => handleSwitchMode('single')}
              className={`px-3.5 py-1 text-[11px] uppercase tracking-wider font-medium rounded-full font-['Inter',system-ui,sans-serif] cursor-pointer transition-colors ${
                mode === 'single'
                  ? 'bg-[#22c55e] text-[#0a0a0a]'
                  : 'text-[#d4d4d4] hover:text-white'
              }`}
            >
              Single Tournament
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('aggregate')}
              className={`px-3.5 py-1 text-[11px] uppercase tracking-wider font-medium rounded-full font-['Inter',system-ui,sans-serif] cursor-pointer transition-colors ${
                mode === 'aggregate'
                  ? 'bg-[#22c55e] text-[#0a0a0a]'
                  : 'text-[#d4d4d4] hover:text-white'
              }`}
            >
              10K Aggregate
            </button>
          </div>

          {/* Run button — adapts to current mode */}
          <button
            type="button"
            onClick={mode === 'single' ? runSingle : runAggregate}
            disabled={mode === 'single' ? singleRunning : aggRunning}
            className={`ml-auto px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg font-['Inter',system-ui,sans-serif] transition-all ${
              (mode === 'single' ? singleRunning : aggRunning)
                ? 'bg-[#22c55e]/20 text-[#22c55e]/70 cursor-not-allowed'
                : (mode === 'single' ? single : aggResults)
                  ? 'bg-[#0a0a0a] border border-[#22c55e]/50 text-[#22c55e] hover:bg-[#22c55e]/10 cursor-pointer'
                  : 'bg-[#22c55e] text-[#0a0a0a] hover:bg-[#16a34a] cursor-pointer shadow-lg shadow-[#22c55e]/20'
            }`}
          >
            {mode === 'single'
              ? singleRunning
                ? 'Playing…'
                : single
                  ? '↺ Play Another'
                  : '▶ Play Tournament'
              : aggRunning
                ? 'Simulating…'
                : aggResults
                  ? '↺ Re-Simulate'
                  : '▶ Run 10K Sim'}
          </button>
        </div>

        {runCount > 0 && (
          <div className="mt-2 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            Runs this session: {runCount}
          </div>
        )}
      </div>

      {/* ───────────── Mode 1: Single Tournament ───────────── */}
      {mode === 'single' && (
        <SingleTournamentView single={single} stage={stage} />
      )}

      {/* ───────────── Mode 2: 10K Aggregate ───────────── */}
      {mode === 'aggregate' && (
        <AggregateView
          running={aggRunning}
          progress={aggProgress}
          chunksDone={aggChunksDone}
          liveTop10={aggLiveTop10}
          results={aggResults}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Single Tournament View — rounds reveal one at a time
// ─────────────────────────────────────────────────────────────
function SingleTournamentView({
  single,
  stage,
}: {
  single: SingleTournamentResult[] | null;
  stage: RevealStage;
}) {
  // Compute current leaderboard given the stage
  const currentLeaderboard = useMemo(() => {
    if (!single) return [];
    const withCurrentTotal = single.map((p) => {
      let total = 0;
      if (stage === 'r1' || stage === 'r2' || stage === 'cut' || stage === 'r3' || stage === 'r4' || stage === 'final') {
        total += p.r1_score;
      }
      if (stage === 'r2' || stage === 'cut' || stage === 'r3' || stage === 'r4' || stage === 'final') {
        total += p.r2_score;
      }
      if ((stage === 'r3' || stage === 'r4' || stage === 'final') && p.r3_score != null) {
        total += p.r3_score;
      }
      if ((stage === 'r4' || stage === 'final') && p.r4_score != null) {
        total += p.r4_score;
      }
      const survivors = stage === 'cut' || stage === 'r3' || stage === 'r4' || stage === 'final';
      const visibleAfterCut = survivors ? p.made_cut : true;
      return { ...p, currentTotal: total, visible: visibleAfterCut };
    });
    return withCurrentTotal
      .filter((p) => p.visible)
      .sort((a, b) => a.currentTotal - b.currentTotal);
  }, [single, stage]);

  const labels: Record<RevealStage, string> = {
    idle: 'Press play to start the tournament',
    r1: 'Round 1 in progress',
    r2: 'Round 2 in progress',
    cut: 'Cut applied — top 65 survive',
    r3: 'Round 3 in progress',
    r4: 'Round 4 in progress',
    final: 'Tournament complete',
  };

  if (stage === 'idle') {
    return (
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-8 text-center">
        <div className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] mb-3">
          Ready to Play
        </div>
        <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] max-w-md mx-auto leading-relaxed">
          Click <span className="text-[#22c55e] font-semibold">Play Tournament</span> to simulate
          ONE weekend at {currentEvent.course}. Rounds 1 through 4 will reveal one at a time, with
          the cut applied after Round 2. Different result every click.
        </p>
      </div>
    );
  }

  const top15 = currentLeaderboard.slice(0, 15);

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden">
      {/* Stage indicator */}
      <div className="px-5 py-3 border-b border-[#262626] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif]">
            {labels[stage]}
          </span>
          {stage !== 'final' && (
            <span className="inline-block w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          )}
        </div>
        <RoundStrip stage={stage} />
      </div>

      {/* Live leaderboard */}
      <div className="px-5 py-4">
        <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] mb-3">
          Live Leaderboard — Top 15
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#262626]">
                <th className="px-2 py-2 text-[9px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] w-8">
                  POS
                </th>
                <th className="px-2 py-2 text-[9px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]">
                  Player
                </th>
                {(['R1', 'R2', 'R3', 'R4'] as const).map((r) => (
                  <th
                    key={r}
                    className="px-2 py-2 text-right text-[9px] uppercase tracking-wider text-[#737373] font-medium font-['Inter',system-ui,sans-serif] w-12"
                  >
                    {r}
                  </th>
                ))}
                <th className="px-2 py-2 text-right text-[9px] uppercase tracking-wider text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif] w-16">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {top15.map((p, i) => {
                const url = headshots[p.player_name];
                const r1Visible = true;
                const r2Visible = stage !== 'r1';
                const r3Visible = stage === 'r3' || stage === 'r4' || stage === 'final';
                const r4Visible = stage === 'r4' || stage === 'final';
                return (
                  <tr
                    key={p.player_name}
                    className={`border-t border-[#1a1a1a] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'}`}
                    style={{ transition: 'all 350ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                  >
                    <td className="px-2 py-2 text-xs text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace]">
                      {i + 1}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full overflow-hidden border border-[#262626] bg-[#1a1a1a] shrink-0 inline-flex items-center justify-center">
                          {url ? (
                            <img
                              src={url}
                              alt={p.player_name}
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-[8px] font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                              {getInitials(p.player_name)}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                          {p.player_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-['JetBrains_Mono','SF_Mono',monospace] tabular-nums">
                      <span className={p.r1_score < 0 ? 'text-[#22c55e]' : p.r1_score > 0 ? 'text-red-400' : 'text-[#d4d4d4]'}>
                        {r1Visible ? fmtScore(p.r1_score) : '—'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-['JetBrains_Mono','SF_Mono',monospace] tabular-nums">
                      <span className={p.r2_score < 0 ? 'text-[#22c55e]' : p.r2_score > 0 ? 'text-red-400' : 'text-[#d4d4d4]'}>
                        {r2Visible ? fmtScore(p.r2_score) : '—'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-['JetBrains_Mono','SF_Mono',monospace] tabular-nums">
                      <span className={p.r3_score != null && p.r3_score < 0 ? 'text-[#22c55e]' : p.r3_score != null && p.r3_score > 0 ? 'text-red-400' : 'text-[#d4d4d4]'}>
                        {r3Visible ? fmtScore(p.r3_score) : '—'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-['JetBrains_Mono','SF_Mono',monospace] tabular-nums">
                      <span className={p.r4_score != null && p.r4_score < 0 ? 'text-[#22c55e]' : p.r4_score != null && p.r4_score > 0 ? 'text-red-400' : 'text-[#d4d4d4]'}>
                        {r4Visible ? fmtScore(p.r4_score) : '—'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-['JetBrains_Mono','SF_Mono',monospace] font-bold tabular-nums text-[#22c55e]">
                      {fmtScore(p.currentTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Winner card on final */}
      {stage === 'final' && single && single[0] && (
        <div className="px-5 pb-5">
          <div className="bg-gradient-to-r from-[#22c55e]/15 via-[#22c55e]/10 to-transparent border border-[#22c55e]/50 rounded-lg p-4 flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest text-[#22c55e] font-bold font-['Inter',system-ui,sans-serif]">
              🏆 Sim Winner
            </span>
            <span className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#22c55e] bg-[#1a1a1a] shrink-0">
              {headshots[single[0].player_name] ? (
                <img
                  src={headshots[single[0].player_name]}
                  alt={single[0].player_name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <span className="w-full h-full inline-flex items-center justify-center text-xs font-bold text-[#f5f5f5]">
                  {getInitials(single[0].player_name)}
                </span>
              )}
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                {single[0].player_name}
              </div>
              <div className="text-[11px] text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace]">
                {fmtScore(single[0].total)} · 4 rounds at {currentEvent.course}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-3 leading-relaxed">
            One possible weekend &mdash; not a prediction. Run it again for a different outcome. To see
            who&rsquo;s most likely to win across thousands of these, switch to{' '}
            <span className="text-[#22c55e]">10K Aggregate</span> mode.
          </p>
        </div>
      )}

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [style*="transition"] { transition: none !important; }
          .animate-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

// Mini round indicator strip — shows progress through R1 → R2 → R3 → R4
function RoundStrip({ stage }: { stage: RevealStage }) {
  const stages: { id: RevealStage; label: string }[] = [
    { id: 'r1', label: 'R1' },
    { id: 'r2', label: 'R2' },
    { id: 'cut', label: 'CUT' },
    { id: 'r3', label: 'R3' },
    { id: 'r4', label: 'R4' },
  ];
  const order = ['idle', 'r1', 'r2', 'cut', 'r3', 'r4', 'final'];
  const currentIdx = order.indexOf(stage);

  return (
    <div className="flex items-center gap-1.5">
      {stages.map((s) => {
        const idx = order.indexOf(s.id);
        const active = idx === currentIdx;
        const complete = idx < currentIdx;
        return (
          <span
            key={s.id}
            className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded font-['Inter',system-ui,sans-serif] transition-colors ${
              active
                ? 'bg-[#22c55e] text-[#0a0a0a]'
                : complete
                  ? 'bg-[#22c55e]/15 text-[#22c55e]'
                  : 'bg-[#1a1a1a] text-[#525252]'
            }`}
          >
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Aggregate View (existing 10K converging leaderboard)
// ─────────────────────────────────────────────────────────────
function AggregateView({
  running,
  progress,
  chunksDone,
  liveTop10,
  results,
}: {
  running: boolean;
  progress: number;
  chunksDone: number;
  liveTop10: SimulationResult[];
  results: RowWithDg[] | null;
}) {
  if (!results && !running) {
    return (
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-8 text-center">
        <div className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] mb-3">
          Ready to Run
        </div>
        <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] max-w-md mx-auto leading-relaxed">
          Click <span className="text-[#22c55e] font-semibold">Run 10K Sim</span> to generate
          10,000 tournament outcomes using the current field. Win, Top-5, Top-10, Top-20, and
          Cut probabilities will converge live below.
        </p>
      </div>
    );
  }

  if (running) {
    return (
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif]">
                Running Monte Carlo
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

        <div className="px-5 pb-5">
          <div className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] mt-4 mb-3">
            Live Leaderboard — Top 10 by Win Probability
          </div>
          <div className="space-y-1.5">
            {liveTop10.length === 0 ? (
              <div className="text-xs text-[#737373] py-6 text-center font-['Inter',system-ui,sans-serif]">
                Drawing initial round scores…
              </div>
            ) : (
              liveTop10.map((r, i) => {
                const url = headshots[r.player_name];
                const maxWin = liveTop10[0]?.win_prob || 1;
                const barWidth = (r.win_prob / maxWin) * 100;
                const winsSoFar = Math.round(r.win_prob * chunksDone * CHUNK_SIZE);
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
                        <img src={url} alt={r.player_name} className="w-full h-full object-cover object-top" loading="lazy" />
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
                        style={{ width: `${barWidth}%`, transition: 'width 300ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                      />
                    </div>
                    <span className="text-xs font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e] w-14 text-right shrink-0 tabular-nums" style={{ transition: 'color 200ms ease' }}>
                      {fmtPct(r.win_prob)}
                    </span>
                    <span className="text-[10px] font-['JetBrains_Mono','SF_Mono',monospace] text-[#737373] w-20 text-right shrink-0 tabular-nums hidden md:inline">
                      {winsSoFar.toLocaleString()} wins
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <p className="text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed mt-3">
            Each row shows how many simulated tournaments that player has won
            so far. Win % = wins ÷ sims complete. Bars are sized relative to
            the current leader.
          </p>
        </div>
        <style>{`@media (prefers-reduced-motion: reduce) { [style*="transition"] { transition: none !important; } }`}</style>
      </div>
    );
  }

  // results !== null
  if (!results) return null;

  // Top player's aggregate win prob — shown alongside actual wins for
  // unambiguous interpretation ("won 3300 of 10000, not every time").
  return (
    <>
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
          Results · Top {Math.min(results.length, 50)}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
          BirdieX Model vs. DataGolf Model
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#262626]">
              <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] sticky left-0 bg-[#0a0a0a] z-10">#</th>
              <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]">Player</th>
              <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif]" colSpan={5}>BirdieX Model</th>
              <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]" colSpan={5}>DataGolf Model</th>
            </tr>
            <tr className="border-b border-[#262626] bg-[#0a0a0a]">
              <th className="px-3 py-2 sticky left-0 bg-[#0a0a0a] z-10" />
              <th className="px-3 py-2" />
              {(['WIN', 'T5', 'T10', 'T20', 'CUT'] as const).map((c) => (
                <th key={`bx-${c}`} className="px-3 py-2 text-right text-[9px] uppercase tracking-wider text-[#22c55e]/80 font-medium font-['Inter',system-ui,sans-serif]">{c}</th>
              ))}
              {(['WIN', 'T5', 'T10', 'T20', 'CUT'] as const).map((c) => (
                <th key={`dg-${c}`} className="px-3 py-2 text-right text-[9px] uppercase tracking-wider text-[#737373] font-medium font-['Inter',system-ui,sans-serif]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 50).map((row, i) => {
              const url = headshots[row.result.player_name];
              return (
                <tr
                  key={row.result.player_name}
                  className={`border-t border-[#1a1a1a] transition-colors ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'}`}
                  style={{ animation: 'simRowIn 280ms ease forwards', opacity: 0, animationDelay: `${Math.min(i, 25) * 22}ms` }}
                >
                  <td className={`px-3 py-2 text-xs text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace] sticky left-0 z-10 ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'}`}>{i + 1}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full overflow-hidden border border-[#262626] bg-[#1a1a1a] shrink-0 inline-flex items-center justify-center">
                        {url ? (
                          <img src={url} alt={row.result.player_name} className="w-full h-full object-cover object-top" loading="lazy" />
                        ) : (
                          <span className="text-[9px] font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">{getInitials(row.result.player_name)}</span>
                        )}
                      </span>
                      <span className="text-xs text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">{row.result.player_name}</span>
                    </div>
                  </td>
                  {[row.result.win_prob, row.result.top_5_prob, row.result.top_10_prob, row.result.top_20_prob, row.result.made_cut_prob].map((p, j) => (
                    <td key={`bx-${j}`} className="px-3 py-2 text-right text-xs text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium tabular-nums">{fmtPct(p)}</td>
                  ))}
                  {[row.dg_win_prob, row.dg_top5_prob, row.dg_top10_prob, row.dg_top20_prob, row.dg_make_cut_prob].map((p, j) => (
                    <td key={`dg-${j}`} className="px-3 py-2 text-right text-xs text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace] tabular-nums">{fmtPct(p ?? undefined)}</td>
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
      <div className="px-4 py-3 border-t border-[#262626] text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed space-y-1">
        <p>
          <span className="text-[#f5f5f5] font-medium">How to read this:</span>{' '}
          a 30% WIN value means the player won 3,000 of the 10,000 simulated
          tournaments &mdash; not that they win every time. The most-likely
          winner sits at #1 because they have the highest win frequency
          across the long run; they still lose more sims than they win.
        </p>
        <p>
          BirdieX Model uses each player&rsquo;s X-Score (DataGolf skill
          estimate or measured SG once R1 grades, plus venue adjustments)
          as the per-round expected strokes-gained, then runs 10,000 Monte
          Carlo tournaments with σ = 2.7 strokes per round.
        </p>
      </div>
    </div>
    </>
  );
}
