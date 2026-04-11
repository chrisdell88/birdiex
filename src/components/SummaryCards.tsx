import type { PlayerData } from '../types';

interface SummaryCardsProps {
  data: PlayerData[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export default function SummaryCards({ data, activeFilter = 'ALL', onFilterChange }: SummaryCardsProps) {
  const buys = data.filter((p) =>
    ['STRONGEST BUY', 'STRONG BUY', 'BUY'].includes(p.signal)
  ).length;
  const fades = data.filter((p) =>
    ['FADE', 'STRONG FADE', 'STRONGEST FADE'].includes(p.signal)
  ).length;

  const cards = [
    { label: 'PLAYERS', value: data.length, color: 'text-[#f5f5f5]', borderColor: 'border-[#262626]', filterValue: 'ALL' },
    { label: 'BUYS', value: buys, color: 'text-[#22c55e]', borderColor: 'border-[#22c55e]/30', filterValue: 'BUYS' },
    { label: 'FADES', value: fades, color: 'text-red-400', borderColor: 'border-red-500/30', filterValue: 'FADES' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => onFilterChange?.(card.filterValue)}
          className={`bg-[#0a0a0a] border ${card.borderColor} rounded-lg p-4 text-center cursor-pointer transition-all hover:bg-[#111111] ${
            activeFilter === card.filterValue ? 'ring-1 ring-[#22c55e]/50' : ''
          }`}
        >
          <div className={`text-2xl md:text-3xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] ${card.color}`}>
            {card.value}
          </div>
          <div className="text-[10px] md:text-xs text-[#d4d4d4] uppercase tracking-widest mt-1 font-['Inter',system-ui,sans-serif]">
            {card.label}
          </div>
        </button>
      ))}
    </div>
  );
}
