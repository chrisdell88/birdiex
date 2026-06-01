/**
 * BacktestLab — PRIVATE backtest page (#lab).
 *
 * Per-tier W-L-P / units / ROI breakdown across every graded round. This is
 * an INTERNAL tool for refining the model — never linked from public nav,
 * never quoted as official model results. The CLAUDE.md hard rule still
 * holds: anything we publish publicly stays gated to the venue-floor
 * Best Bets only.
 *
 * Access is gated through a Postgres SECURITY DEFINER function
 * (verify_lab_password) — the password hash never leaves Supabase.
 */
import { useEffect, useMemo, useState } from 'react';
import type { BetRecord } from '../types';
import { verifyLabPassword, supabaseConfigured } from '../lib/supabase';

import { r2Results as cjR2 } from '../data/cjCupR2Results';
import { r3Results as cjR3 } from '../data/cjCupR3Results';
import { r4Results as cjR4 } from '../data/cjCupR4Results';
import { r2Results as pgaR2 } from '../data/pgaChampR2Results';
import { r3Results as pgaR3 } from '../data/pgaChampR3Results';
import { r4Results as pgaR4 } from '../data/pgaChampR4Results';
import { betLog as mastersBets } from '../data/resultsData';
// Charles Schwab — picked up dynamically via Vite glob, so every cscR<N>
// the auto-roll grades shows up here automatically with no manual edits.
const cscResultModules = import.meta.glob<Record<string, unknown>>(
  '../data/cscR*Results.ts',
  { eager: true }
);
const cscRoundsList = Object.entries(cscResultModules)
  .map(([path, mod]) => {
    const m = path.match(/cscR(\d+)Results\.ts$/);
    if (!m) return null;
    const round = Number(m[1]);
    const bets = (mod as Record<string, unknown>)[`r${round}Results`] as BetRecord[] | undefined;
    return Array.isArray(bets) ? { round, bets } : null;
  })
  .filter((x): x is { round: number; bets: BetRecord[] } => x !== null)
  .sort((a, b) => a.round - b.round);

// Masters 2026 — bets live in resultsData.betLog with a `dataSet` field
// distinguishing "round-only" vs "cumulative". Each round can have both
// variants. To avoid double-counting in the all-time roll-up, we include
// only the canonical dataset per round: R2 = round-only (R2 cumulative IS
// round-only by definition since R1 doesn't generate picks), R3/R4 = cumulative
// (matches how every other event in this lab is graded — cumulative is what
// the Matchups page displays to users).
const mastersR2 = mastersBets.filter((b) => b.round === 2 && b.dataSet === 'round-only');
const mastersR3 = mastersBets.filter((b) => b.round === 3 && b.dataSet === 'cumulative');
const mastersR4 = mastersBets.filter((b) => b.round === 4 && b.dataSet === 'cumulative');

interface EventBucket {
  label: string;
  rounds: { label: string; bets: BetRecord[] }[];
}

// Every graded round across every event, ORDERED NEWEST EVENT FIRST.
// Charles Schwab's per-round entries are derived dynamically from the
// Vite glob above, so the auto-roll just needs to drop a new
// cscR<N>Results.ts file and it shows up here on the next deploy.
const EVENTS: EventBucket[] = [
  {
    label: 'Charles Schwab Challenge 2026',
    rounds: cscRoundsList.map((r) => ({ label: `R${r.round}`, bets: r.bets })),
  },
  {
    label: 'CJ Cup Byron Nelson 2026',
    rounds: [
      { label: 'R2', bets: cjR2 },
      { label: 'R3', bets: cjR3 },
      { label: 'R4', bets: cjR4 },
    ],
  },
  {
    label: 'PGA Championship 2026',
    rounds: [
      { label: 'R2', bets: pgaR2 },
      { label: 'R3', bets: pgaR3 },
      { label: 'R4', bets: pgaR4 },
    ],
  },
  {
    label: 'Masters 2026',
    rounds: [
      { label: 'R2', bets: mastersR2 },
      { label: 'R3', bets: mastersR3 },
      { label: 'R4', bets: mastersR4 },
    ],
  },
];

// Edge tiers shown on every StatsTable. Step is 0.5 to match the sizing
// ladder in src/lib/sizing.ts (each band = one star size). Extended all
// the way through 5.45+ (the top sizing band caps at 5u) so the right
// tail is visible — without that, the high-edge bets that drive most of
// the +EV story would be lumped into the 2.95+ row and the story is half-told.
const TIERS = [
  0.95, 1.45, 1.95, 2.45, 2.95,
  3.45, 3.95, 4.45, 4.95, 5.45,
] as const;

// Use the SHARED summariser so Lab numbers cannot disagree with Results at
// the same edge floor. Below we keep the local computeStats name so the
// existing render code stays intact, but internally it delegates to the
// shared lib. ROI now uses the real stake (unitsForEdge * stakeToWin1),
// same as the Results page.
import { summariseInRange, type BetSummary } from '../lib/statSummarise';
import { floorForEvent, type EventId } from '../config/venues';

type Stats = BetSummary;
/** 'cumulative' = edge >= tier (open-ended top).
 *  'band'       = edge in [tier, nextTier) — tier-only band.            */
export type TierMode = 'cumulative' | 'band';

function computeStats(bets: BetRecord[], lower: number, upper: number | undefined): Stats {
  return summariseInRange(bets, lower, upper);
}

// Map each Lab EVENT label → the venues.ts EventId so we can pass the
// matching venue floor into the StatsTable for visual highlighting.
const LABEL_TO_EVENT_ID: Record<string, EventId> = {
  'Charles Schwab Challenge 2026': 'charles-schwab-challenge-2026',
  'CJ Cup Byron Nelson 2026': 'cj-cup-byron-nelson-2026',
  'PGA Championship 2026': 'pga-2026',
  'Masters 2026': 'masters-2026',
};

function fmtUnits(u: number): string {
  const rounded = Math.round(u * 100) / 100;
  return `${rounded > 0 ? '+' : ''}${rounded}u`;
}

function fmtRoi(r: number): string {
  return `${r > 0 ? '+' : ''}${Math.round(r)}%`;
}

function colorForUnits(u: number): string {
  if (u > 0) return 'text-[#22c55e]';
  if (u < 0) return 'text-red-400';
  return 'text-[#a1a1aa]';
}

const mono = "font-['JetBrains_Mono','SF_Mono',monospace]";

// ─── Login screen ────────────────────────────────────────────────────────

function LoginScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!supabaseConfigured) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p className="text-sm text-red-400">
          Supabase not configured. Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const ok = await verifyLabPassword(pw);
      if (ok) {
        sessionStorage.setItem('lab-auth', '1');
        onUnlock();
      } else {
        setErr('Wrong password.');
      }
    } catch {
      setErr('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6">
        <h1 className={`text-lg font-bold text-[#f5f5f5] mb-1 ${mono} uppercase tracking-wider`}>
          Lab Access
        </h1>
        <p className="text-xs text-[#a1a1aa] mb-4">
          Internal backtest page. Not for public consumption.
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Password"
            className={`bg-[#141414] border border-[#262626] rounded px-3 py-2 text-sm text-[#f5f5f5] ${mono} focus:border-[#22c55e] focus:outline-none`}
          />
          <button
            type="submit"
            disabled={busy || !pw}
            className="bg-[#22c55e] text-[#0a0a0a] text-sm font-bold py-2 rounded uppercase tracking-wider hover:bg-[#16a34a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Checking…' : 'Unlock'}
          </button>
          {err && <p className="text-xs text-red-400">{err}</p>}
        </form>
      </div>
    </div>
  );
}

// ─── Stats table ─────────────────────────────────────────────────────────

function TierRow({ label, stats, isFloor }: { label: string; stats: Stats; isFloor?: boolean }) {
  return (
    <tr className={`border-t border-[#1a1a1a] ${isFloor ? 'bg-[#22c55e]/5' : ''}`}>
      <td className={`px-3 py-2 text-xs ${mono} text-[#f5f5f5] whitespace-nowrap`}>
        ≥ {label}
        {isFloor && (
          <span className="ml-2 text-[9px] uppercase tracking-wider text-[#22c55e]">venue floor</span>
        )}
      </td>
      <td className={`px-3 py-2 text-xs ${mono} text-[#d4d4d4] text-right`}>{stats.bets}</td>
      <td className={`px-3 py-2 text-xs ${mono} text-[#d4d4d4] text-right whitespace-nowrap`}>
        {stats.wins}-{stats.losses}-{stats.pushes}
      </td>
      <td className={`px-3 py-2 text-xs ${mono} ${colorForUnits(stats.units)} text-right font-bold whitespace-nowrap`}>
        {fmtUnits(stats.units)}
      </td>
      <td className={`px-3 py-2 text-xs ${mono} ${colorForUnits(stats.roi)} text-right whitespace-nowrap`}>
        {fmtRoi(stats.roi)}
      </td>
    </tr>
  );
}

function StatsTable({
  title,
  bets,
  venueFloor,
  mode,
}: {
  title: string;
  bets: BetRecord[];
  venueFloor?: number;
  mode: TierMode;
}) {
  // For cumulative mode each row is edge >= tier (open-ended).
  // For band mode each row is edge in [tier, nextTier) — last tier still
  // open-ended since there's no higher tier above 5.45.
  const colHeader = mode === 'cumulative' ? 'Edge ≥ tier' : 'Edge band';
  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
        <span className={`text-xs uppercase tracking-wider text-[#f5f5f5] font-bold ${mono}`}>{title}</span>
        <span className="text-[10px] text-[#737373] uppercase tracking-wider">{bets.length} total graded</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#262626]">
              <th className={`px-3 py-2 text-[10px] uppercase tracking-wider text-[#a1a1aa] text-left ${mono}`}>{colHeader}</th>
              <th className={`px-3 py-2 text-[10px] uppercase tracking-wider text-[#a1a1aa] text-right ${mono}`}>Bets</th>
              <th className={`px-3 py-2 text-[10px] uppercase tracking-wider text-[#a1a1aa] text-right ${mono}`}>W-L-P</th>
              <th className={`px-3 py-2 text-[10px] uppercase tracking-wider text-[#a1a1aa] text-right ${mono}`}>Units</th>
              <th className={`px-3 py-2 text-[10px] uppercase tracking-wider text-[#a1a1aa] text-right ${mono}`}>ROI</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t, i) => {
              const next = TIERS[i + 1];
              const upper = mode === 'cumulative' ? undefined : next;
              // Label format:
              //   cumulative → "≥2.45"
              //   band       → "2.45–2.95" (or "≥5.45" for the open-ended top)
              const label =
                mode === 'cumulative'
                  ? `≥${t.toFixed(2)}`
                  : next !== undefined
                    ? `${t.toFixed(2)}–${next.toFixed(2)}`
                    : `≥${t.toFixed(2)}`;
              return (
                <TierRow
                  key={t}
                  label={label}
                  stats={computeStats(bets, t, upper)}
                  isFloor={mode === 'cumulative' && venueFloor !== undefined && Math.abs(t - venueFloor) < 0.01}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────

export default function BacktestLab() {
  const [unlocked, setUnlocked] = useState(false);
  // Event filter — default to the most recent event (first in EVENTS, which
  // is sorted newest-first) so the page opens compact. 'all' shows every
  // event. Persisted in sessionStorage so refreshes keep the selection.
  const [eventFilter, setEventFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('lab-event-filter');
      if (saved && (saved === 'all' || EVENTS.some((e) => e.label === saved))) return saved;
    }
    return EVENTS[0]?.label ?? 'all';
  });
  // Tier mode — 'cumulative' = each row is edge ≥ X (good for "where to set
  // the floor"), 'band' = each row is edge in [X, nextX) (good for "which
  // edge ranges actually print"). Default to 'band' — that's the view that
  // surfaces tier-by-tier signal without the cumulative row dilution.
  const [tierMode, setTierMode] = useState<TierMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('lab-tier-mode');
      if (saved === 'cumulative' || saved === 'band') return saved;
    }
    return 'band';
  });

  useEffect(() => {
    if (sessionStorage.getItem('lab-auth') === '1') setUnlocked(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') sessionStorage.setItem('lab-event-filter', eventFilter);
  }, [eventFilter]);

  useEffect(() => {
    if (typeof window !== 'undefined') sessionStorage.setItem('lab-tier-mode', tierMode);
  }, [tierMode]);

  const allBets = useMemo(() => EVENTS.flatMap((e) => e.rounds.flatMap((r) => r.bets)), []);
  const visibleEvents = useMemo(
    () => (eventFilter === 'all' ? EVENTS : EVENTS.filter((e) => e.label === eventFilter)),
    [eventFilter]
  );

  if (!unlocked) return <LoginScreen onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="max-w-6xl mx-auto py-2">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className={`text-2xl font-bold text-[#f5f5f5] ${mono} uppercase tracking-wider`}>Backtest Lab</h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Per-tier W-L-P breakdown across every graded round.
            Internal tool — public results page still shows venue-floor Best Bets only.
          </p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('lab-auth');
            setUnlocked(false);
          }}
          className="text-[10px] uppercase tracking-wider text-[#a1a1aa] hover:text-[#22c55e] transition-colors"
        >
          Lock
        </button>
      </div>

      {/* Tier-mode toggle — band vs cumulative. Band answers "which edge
          ranges actually print"; cumulative answers "where should the floor
          be". Default is band so each row tells you about that specific
          tier in isolation — without the row above lumping its results in. */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`text-[10px] uppercase tracking-wider text-[#a1a1aa] ${mono} mr-1`}>Tier view:</span>
        {(['band', 'cumulative'] as const).map((opt) => {
          const active = tierMode === opt;
          const label = opt === 'band' ? 'Band only (tier-to-next)' : 'Cumulative (≥ tier)';
          return (
            <button
              key={opt}
              onClick={() => setTierMode(opt)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-md border transition-colors font-['Inter',system-ui,sans-serif] cursor-pointer ${
                active
                  ? 'bg-[#22c55e] text-[#0a0a0a] border-[#22c55e] font-semibold'
                  : 'bg-transparent text-[#a1a1aa] border-[#262626] hover:text-[#f5f5f5] hover:border-[#404040]'
              }`}
            >
              {label}
            </button>
          );
        })}
        <span className="ml-2 text-[10px] text-[#737373] font-['Inter',system-ui,sans-serif]">
          {tierMode === 'band'
            ? 'Each row = bets whose edge falls in that band only. Rows do not include the bands above.'
            : 'Each row = bets at that floor or higher. Rows include every tier above them.'}
        </span>
      </div>

      {/* All-time across every event — always shown regardless of filter */}
      <StatsTable title="All-time (every event, every round)" bets={allBets} mode={tierMode} />

      {/* Event filter pills — default to most recent so page opens compact.
          Click "All Events" to expand everything. Selection persists across
          refreshes via sessionStorage. */}
      <div className="flex flex-wrap items-center gap-2 mb-6 mt-2">
        <span className={`text-[10px] uppercase tracking-wider text-[#a1a1aa] ${mono} mr-1`}>Event:</span>
        {(['all', ...EVENTS.map((e) => e.label)] as const).map((opt) => {
          const active = eventFilter === opt;
          const label = opt === 'all' ? 'All Events' : opt;
          return (
            <button
              key={opt}
              onClick={() => setEventFilter(opt)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-md border transition-colors font-['Inter',system-ui,sans-serif] cursor-pointer ${
                active
                  ? 'bg-[#22c55e] text-[#0a0a0a] border-[#22c55e] font-semibold'
                  : 'bg-transparent text-[#a1a1aa] border-[#262626] hover:text-[#f5f5f5] hover:border-[#404040]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Per-event. Pass the event's venue floor so the tier row that maps
          to the public Results figure is visually highlighted — making the
          Lab ↔ Results mirror obvious at a glance. */}
      {visibleEvents.map((ev) => {
        const evBets = ev.rounds.flatMap((r) => r.bets);
        const eventId = LABEL_TO_EVENT_ID[ev.label];
        const venueFloor = eventId ? floorForEvent(eventId).floor : undefined;
        return (
          <div key={ev.label} className="mb-8">
            <h2 className={`text-sm font-bold text-[#22c55e] ${mono} uppercase tracking-wider mb-3`}>
              {ev.label}
              {venueFloor !== undefined && (
                <span className="ml-2 text-[10px] text-[#a1a1aa] font-normal tracking-normal">
                  (Results-page floor: {venueFloor.toFixed(2)})
                </span>
              )}
            </h2>
            <StatsTable title={`${ev.label} — all rounds`} bets={evBets} venueFloor={venueFloor} mode={tierMode} />
            {/* Rounds shown newest first (R4 → R3 → R2) so the most recent
                round is at the top, matching the event ordering above. */}
            {[...ev.rounds].reverse().map((r) => (
              <StatsTable key={r.label} title={`${ev.label} — ${r.label}`} bets={r.bets} venueFloor={venueFloor} mode={tierMode} />
            ))}
          </div>
        );
      })}

      <p className="text-[10px] text-[#525252] mt-6 text-center">
        Units assume the standard sizing band per edge bucket
        (0.5u / 1.0u / 1.5u / 2.0u / 2.5u). ROI = units ÷ staked × 100.
      </p>
    </div>
  );
}
