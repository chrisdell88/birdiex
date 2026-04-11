import type { PlayerData } from '../types';

interface SummaryCardsProps {
  data: PlayerData[];
}

export default function SummaryCards({ data }: SummaryCardsProps) {
  const buys = data.filter((p) =>
    ['STRONGEST BUY', 'STRONG BUY', 'BUY'].includes(p.signal)
  ).length;
  const holds = data.filter((p) => p.signal === 'HOLD').length;
  const fades = data.filter((p) =>
    ['FADE', 'STRONG FADE', 'STRONGEST FADE'].includes(p.signal)
  ).length;

  const cards = [
    { label: 'PLAYERS', value: data.length, color: 'text-[#f5f5f5]', borderColor: 'border-[#262626]' },
    { label: 'BUYS', value: buys, color: 'text-green-400', borderColor: 'border-green-500/30' },
    { label: 'HOLDS', value: holds, color: 'text-gray-400', borderColor: 'border-gray-500/30' },
    { label: 'FADES', value: fades, color: 'text-red-400', borderColor: 'border-red-500/30' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-[#111111] border ${card.borderColor} rounded-lg p-4 text-center`}
        >
          <div className={`text-2xl md:text-3xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] ${card.color}`}>
            {card.value}
          </div>
          <div className="text-[10px] md:text-xs text-[#52525b] uppercase tracking-widest mt-1 font-['Inter',system-ui,sans-serif]">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
