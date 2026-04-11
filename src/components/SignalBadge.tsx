import type { Signal } from '../types';

const signalStyles: Record<Signal, string> = {
  'STRONGEST BUY': 'bg-green-500 text-green-950 font-semibold',
  'STRONG BUY': 'bg-green-600/70 text-green-100 font-semibold',
  'BUY': 'bg-green-500/15 text-green-400 border border-green-500/30',
  'HOLD': 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  'FADE': 'bg-red-500/15 text-red-400 border border-red-500/30',
  'STRONG FADE': 'bg-red-600/70 text-red-100 font-semibold',
  'STRONGEST FADE': 'bg-red-500 text-red-950 font-semibold',
};

interface SignalBadgeProps {
  signal: Signal;
  compact?: boolean;
}

export default function SignalBadge({ signal, compact = false }: SignalBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap font-['Inter',system-ui,sans-serif] ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      } tracking-wide uppercase ${signalStyles[signal]}`}
    >
      {signal}
    </span>
  );
}
