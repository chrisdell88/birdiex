/**
 * Signal display normalization.
 *
 * The data model supports legacy 9-tier signal names (STRONGEST BUY, LEAN
 * BUY, LEAN FADE, STRONGEST FADE, plus old SELL family) for backwards
 * compatibility with historical Masters / PGA Championship data files.
 * The UI renders the new 7-tier system uniformly:
 *
 *   STRONG BUY  →  BUY  →  SOFT BUY  →  NEUTRAL  →  SOFT FADE  →  FADE  →  STRONG FADE
 *
 * This module maps any legacy or new signal string to the display tier.
 */
import type { Signal } from '../types';

/** The 7-tier display set. */
export type DisplaySignal =
  | 'STRONG BUY'
  | 'BUY'
  | 'SOFT BUY'
  | 'NEUTRAL'
  | 'SOFT FADE'
  | 'FADE'
  | 'STRONG FADE';

/**
 * Map any Signal (new or legacy) to its display tier. Legacy STRONGEST →
 * STRONG (top tier collapses); legacy LEAN → SOFT. Legacy SELL family
 * collapses into the matching FADE tier.
 */
export function normalizeSignal(signal: Signal): DisplaySignal {
  switch (signal) {
    // Already in the new 7-tier set — pass through.
    case 'STRONG BUY':
    case 'BUY':
    case 'SOFT BUY':
    case 'NEUTRAL':
    case 'SOFT FADE':
    case 'FADE':
    case 'STRONG FADE':
      return signal;

    // Legacy → new mappings.
    case 'STRONGEST BUY':
      return 'STRONG BUY';
    case 'LEAN BUY':
      return 'SOFT BUY';
    case 'LEAN FADE':
      return 'SOFT FADE';
    case 'STRONGEST FADE':
      return 'STRONG FADE';
    case 'HOLD':
      return 'NEUTRAL';

    // Legacy SELL family — historical only. Map to matching FADE tier.
    case 'LEAN SELL':
      return 'SOFT FADE';
    case 'SELL':
      return 'FADE';
    case 'STRONG SELL':
      return 'FADE';
    case 'STRONGEST SELL':
      return 'STRONG FADE';

    default: {
      // Type-system catch — if a new signal value is added without
      // updating this switch, TS will surface it.
      const _exhaustive: never = signal;
      void _exhaustive;
      return 'NEUTRAL';
    }
  }
}

/** Is the (normalized) signal a buy tier? */
export function isBuy(signal: Signal): boolean {
  const d = normalizeSignal(signal);
  return d === 'STRONG BUY' || d === 'BUY' || d === 'SOFT BUY';
}

/** Is the (normalized) signal a fade tier? */
export function isFade(signal: Signal): boolean {
  const d = normalizeSignal(signal);
  return d === 'STRONG FADE' || d === 'FADE' || d === 'SOFT FADE';
}

/**
 * Tailwind text-color class for a signal tier — used so X-Score text on
 * matchup cards matches the SignalBadge color (per-tier intensity, not
 * pick-vs-opponent role). CONFLICTED always renders yellow.
 */
export function signalTextColorClass(signal: Signal, conflicted = false): string {
  if (conflicted) return 'text-yellow-400';
  const d = normalizeSignal(signal);
  switch (d) {
    case 'STRONG BUY':  return 'text-[#4ade80]';   // bright green
    case 'BUY':         return 'text-[#22c55e]';   // green-500
    case 'SOFT BUY':    return 'text-[#16a34a]';   // dim green
    case 'NEUTRAL':     return 'text-[#a1a1aa]';   // gray
    case 'SOFT FADE':   return 'text-[#fca5a5]';   // dim red
    case 'FADE':        return 'text-red-400';     // red-400
    case 'STRONG FADE': return 'text-red-500';     // bright red
  }
}
