import type { Signal } from '../types';
import { normalizeSignal, type DisplaySignal } from '../lib/signalDisplay';

const signalStyles: Record<DisplaySignal, string> = {
  'STRONG BUY':  'bg-green-500 text-green-950 font-semibold',
  'BUY':         'bg-green-600/70 text-green-100 font-semibold',
  'SOFT BUY':    'bg-green-500/15 text-green-400 border border-green-500/30',
  'NEUTRAL':     'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  'SOFT FADE':   'bg-red-500/15 text-red-400 border border-red-500/30',
  'FADE':        'bg-red-600/70 text-red-100 font-semibold',
  'STRONG FADE': 'bg-red-500 text-red-950 font-semibold',
};

// CONFLICTED override — yellow at the same strength tier as the underlying
// direction signal so the badge itself reads as "caution" at a glance.
const conflictedStyles: Record<DisplaySignal, string> = {
  'STRONG BUY':  'bg-yellow-400 text-yellow-950 font-semibold',
  'BUY':         'bg-yellow-500/70 text-yellow-50 font-semibold',
  'SOFT BUY':    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  'NEUTRAL':     'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  'SOFT FADE':   'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  'FADE':        'bg-yellow-500/70 text-yellow-50 font-semibold',
  'STRONG FADE': 'bg-yellow-400 text-yellow-950 font-semibold',
};

interface SignalBadgeProps {
  signal: Signal;
  compact?: boolean;
  conflicted?: boolean;
}

export default function SignalBadge({ signal, compact = false, conflicted = false }: SignalBadgeProps) {
  const display = normalizeSignal(signal);
  const styles = conflicted ? conflictedStyles[display] : signalStyles[display];
  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap font-['Inter',system-ui,sans-serif] ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      } tracking-wide uppercase ${styles}`}
    >
      {display}
    </span>
  );
}
