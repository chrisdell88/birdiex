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
  simulateOneTournament,
  type SingleTournamentResult,
} from '../lib/simulator';
import RecommendedFloorBadge from './RecommendedFloorBadge';

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


export default function SimulatorPage() {
  // Simulator mode. Defaults to current-leaderboard if R1+ has finished
  // (so the user sees realistic projections from where the field actually
  // sits); otherwise pre-tournament. Always togglable.
  const completedRounds = (Math.max(0, Math.min(3, currentEvent.picksRound - 1))) as 0 | 1 | 2 | 3;
  const defaultMode: 'pre-tournament' | 'current-leaderboard' =
    completedRounds >= 1 ? 'current-leaderboard' : 'pre-tournament';
  const [simMode, setSimMode] = useState<'pre-tournament' | 'current-leaderboard'>(defaultMode);

  // Single-tournament state
  const [single, setSingle] = useState<SingleTournamentResult[] | null>(null);
  const [stage, setStage] = useState<RevealStage>('idle');


  const [runCount, setRunCount] = useState(0);
  const cancelRef = useRef(false);

  // Skip flags: in current-leaderboard mode, completed rounds are locked
  // (their scores come from real life). Their reveal stages aren't needed
  // because the data is already known — we just display it.
  const skipR1Stage = simMode === 'current-leaderboard' && completedRounds >= 1;
  const skipR2Stage = simMode === 'current-leaderboard' && completedRounds >= 2;
  const skipR3Stage = simMode === 'current-leaderboard' && completedRounds >= 3;
  // The cut already happened in real life if R2 is locked.
  const skipCutStage = skipR2Stage;

  /**
   * Drives the R1 → R2 → cut → R3 → R4 → final stage reveal. Skipped
   * stages are jumped over (their data is already locked). Used by BOTH
   * single-tournament and 10K-aggregate runs so they share the same UI.
   */
  const playStageReveal = async (): Promise<boolean> => {
    const stages: { stage: RevealStage; ms: number; skip: boolean }[] = [
      { stage: 'r1',  ms: SINGLE_REVEAL_R1_MS,  skip: skipR1Stage },
      { stage: 'r2',  ms: SINGLE_REVEAL_R2_MS,  skip: skipR2Stage },
      { stage: 'cut', ms: SINGLE_REVEAL_CUT_MS, skip: skipCutStage },
      { stage: 'r3',  ms: SINGLE_REVEAL_R3_MS,  skip: skipR3Stage },
      { stage: 'r4',  ms: SINGLE_REVEAL_R4_MS,  skip: false },
    ];
    for (const { stage, ms, skip } of stages) {
      if (skip) continue;
      setStage(stage);
      await new Promise((r) => setTimeout(r, ms));
      if (cancelRef.current) return false;
    }
    setStage('final');
    return true;
  };

  // ─────────────────────────────────────────────────────────────
  // Mode 1: Single Tournament
  // ─────────────────────────────────────────────────────────────
  const runSingle = async () => {
    if (stage !== 'idle' && stage !== 'final') return;
    cancelRef.current = false;
    setSingle(null);
    setStage('idle');

    await new Promise((r) => setTimeout(r, 30));

    const inputs = buildSimInputs(currentEvent.rankingsRound, currentEvent.skillEstimates, completedRounds);
    const result = simulateOneTournament(inputs, simMode, completedRounds);
    setSingle(result);

    const ok = await playStageReveal();
    if (ok) setRunCount((c) => c + 1);
  };

  useEffect(() => () => { cancelRef.current = true; }, []);

  const singleRunning = stage !== 'idle' && stage !== 'final';

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
              Plays out ONE weekend round-by-round. Different result every click —
              shows how the X Score model translates into a real tournament weekend.
            </p>
          </div>
          <RecommendedFloorBadge
            threshold={currentEvent.recommendedFloor}
            course={currentEvent.course}
          />
        </div>

        {/* Run button */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#262626] flex-wrap">
          <button
            type="button"
            onClick={runSingle}
            disabled={singleRunning}
            className={`ml-auto px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg font-['Inter',system-ui,sans-serif] transition-all ${
              singleRunning
                ? 'bg-[#22c55e]/20 text-[#22c55e]/70 cursor-not-allowed'
                : single
                  ? 'bg-[#0a0a0a] border border-[#22c55e]/50 text-[#22c55e] hover:bg-[#22c55e]/10 cursor-pointer'
                  : 'bg-[#22c55e] text-[#0a0a0a] hover:bg-[#16a34a] cursor-pointer shadow-lg shadow-[#22c55e]/20'
            }`}
          >
            {singleRunning ? 'Playing…' : single ? '↺ Play Another' : '▶ Play Tournament'}
          </button>
        </div>

        {runCount > 0 && (
          <div className="mt-2 text-[10px] uppercase tracking-wider text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
            Runs this session: {runCount}
          </div>
        )}

        {/* Field-state toggle: pre-tournament vs current leaderboard.
            Pre-tournament re-simulates all 4 rounds. Current leaderboard
            locks each player at their actual score-to-par through the
            completed rounds and only simulates what's left. */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#262626] flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif] mr-1">
            Field state:
          </span>
          <div className="flex border border-[#22c55e]/50 rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setSimMode('current-leaderboard')}
              className={`px-3.5 py-1 text-[11px] uppercase tracking-wider font-medium rounded-full font-['Inter',system-ui,sans-serif] cursor-pointer transition-colors ${
                simMode === 'current-leaderboard'
                  ? 'bg-[#22c55e] text-[#0a0a0a]'
                  : 'text-[#d4d4d4] hover:text-white'
              }`}
              title="Lock each player's actual score-to-par through the completed rounds, simulate only what's left."
            >
              Current Leaderboard
            </button>
            <button
              type="button"
              onClick={() => setSimMode('pre-tournament')}
              className={`px-3.5 py-1 text-[11px] uppercase tracking-wider font-medium rounded-full font-['Inter',system-ui,sans-serif] cursor-pointer transition-colors ${
                simMode === 'pre-tournament'
                  ? 'bg-[#22c55e] text-[#0a0a0a]'
                  : 'text-[#d4d4d4] hover:text-white'
              }`}
              title="Re-simulate all 4 rounds from scratch. Ignores what's already happened."
            >
              Pre-Tournament
            </button>
          </div>
          <span className="text-[10px] text-[#737373] font-['Inter',system-ui,sans-serif] ml-2">
            {simMode === 'current-leaderboard'
              ? completedRounds === 0
                ? 'No rounds completed yet — same result as Pre-Tournament.'
                : `Locking R1${completedRounds >= 2 ? '+R2' : ''}${completedRounds >= 3 ? '+R3' : ''} at actual scores · simulating ${4 - completedRounds} round${4 - completedRounds === 1 ? '' : 's'}.`
              : 'All 4 rounds simulated fresh each run.'}
          </span>
        </div>
      </div>

      <SingleTournamentView single={single} stage={stage} />
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

