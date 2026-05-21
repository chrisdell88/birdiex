import type { Signal } from '../types';

const signalStyles: Record<Signal, string> = {
  'STRONGEST BUY': 'bg-green-500 text-green-950 font-semibold',
  'STRONG BUY': 'bg-green-600/70 text-green-100 font-semibold',
  'BUY': 'bg-green-500/15 text-green-400 border border-green-500/30',
  'LEAN BUY': 'bg-green-500/10 text-green-500/70 border border-green-500/20',
  'HOLD': 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  'NEUTRAL': 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  'LEAN FADE': 'bg-red-500/10 text-red-500/70 border border-red-500/20',
  'FADE': 'bg-red-500/15 text-red-400 border border-red-500/30',
  'STRONG FADE': 'bg-red-600/70 text-red-100 font-semibold',
  'STRONGEST FADE': 'bg-red-500 text-red-950 font-semibold',
  'LEAN SELL': 'bg-red-500/10 text-red-500/70 border border-red-500/20',
  'SELL': 'bg-red-500/15 text-red-400 border border-red-500/30',
  'STRONG SELL': 'bg-red-600/70 text-red-100 font-semibold',
  'STRONGEST SELL': 'bg-red-500 text-red-950 font-semibold',
};

// When a signal is CONFLICTED, override green/red with yellow at the same
// strength tier so the badge itself reads as "caution" at a glance — not
// just the small ⚠️ icon next to it.
const conflictedStyles: Record<Signal, string> = {
  'STRONGEST BUY': 'bg-yellow-400 text-yellow-950 font-semibold',
  'STRONG BUY': 'bg-yellow-500/70 text-yellow-50 font-semibold',
  'BUY': 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  'LEAN BUY': 'bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/20',
  'HOLD': 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  'NEUTRAL': 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  'LEAN FADE': 'bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/20',
  'FADE': 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  'STRONG FADE': 'bg-yellow-500/70 text-yellow-50 font-semibold',
  'STRONGEST FADE': 'bg-yellow-400 text-yellow-950 font-semibold',
  'LEAN SELL': 'bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/20',
  'SELL': 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  'STRONG SELL': 'bg-yellow-500/70 text-yellow-50 font-semibold',
  'STRONGEST SELL': 'bg-yellow-400 text-yellow-950 font-semibold',
};

interface SignalBadgeProps {
  signal: Signal;
  compact?: boolean;
  conflicted?: boolean;
}

export default function SignalBadge({ signal, compact = false, conflicted = false }: SignalBadgeProps) {
  const styles = conflicted ? conflictedStyles[signal] : signalStyles[signal];
  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap font-['Inter',system-ui,sans-serif] ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      } tracking-wide uppercase ${styles}`}
    >
      {signal}
    </span>
  );
}
