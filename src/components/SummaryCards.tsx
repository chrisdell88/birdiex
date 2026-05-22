import type { PlayerData } from '../types';
import { normalizeSignal, isFade } from '../lib/signalDisplay';

interface SummaryCardsProps {
  data: PlayerData[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export default function SummaryCards({ data, activeFilter = 'ALL', onFilterChange }: SummaryCardsProps) {
  // BUYS = the meaningful buys (drop SOFT BUY, which is essentially noise).
  // SELLS = any fade tier (legacy SELL names included via normalizeSignal).
  const buys = data.filter((p) => {
    const d = normalizeSignal(p.signal);
    return d === 'STRONG BUY' || d === 'BUY';
  }).length;
  const sells = data.filter((p) => isFade(p.signal)).length;

  const cards = [
    { label: 'PLAYERS', value: data.length, color: 'text-[#f5f5f5]', borderColor: 'border-[#262626]', filterValue: 'ALL' },
    { label: 'BUYS', value: buys, color: 'text-[#22c55e]', borderColor: 'border-[#22c55e]/30', filterValue: 'BUYS' },
    { label: 'SELLS', value: sells, color: 'text-red-400', borderColor: 'border-red-500/30', filterValue: 'SELLS' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {cards.map((card) => {
        // Don't allow clicking BUYS/SELLS when count is 0 — would route
        // to an empty filtered view. PLAYERS card always stays clickable
        // (it's the "reset filter" button).
        const isEmpty = card.value === 0 && card.filterValue !== 'ALL';
        return (
          <button
            key={card.label}
            type="button"
            onClick={isEmpty ? undefined : () => onFilterChange?.(card.filterValue)}
            disabled={isEmpty}
            aria-disabled={isEmpty}
            title={isEmpty ? `No ${card.label.toLowerCase()} right now` : undefined}
            className={`bg-[#0a0a0a] border ${card.borderColor} rounded-lg p-4 text-center transition-all ${
              isEmpty
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:bg-[#111111]'
            } ${activeFilter === card.filterValue ? 'ring-1 ring-[#22c55e]/50' : ''}`}
          >
            <div className={`text-2xl md:text-3xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] ${card.color}`}>
              {card.value}
            </div>
            <div className="text-[10px] md:text-xs text-[#d4d4d4] uppercase tracking-widest mt-1 font-['Inter',system-ui,sans-serif]">
              {card.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
