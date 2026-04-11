interface StatBarProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
}

export default function StatBar({ label, value, min = -5, max = 5 }: StatBarProps) {
  const range = max - min;
  const zeroPos = ((0 - min) / range) * 100;
  const valPos = ((value - min) / range) * 100;
  const barLeft = Math.min(zeroPos, valPos);
  const barWidth = Math.abs(valPos - zeroPos);
  const isPositive = value >= 0;

  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-16 text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] shrink-0 text-right">
        {label}
      </span>
      <div className="flex-1 h-4 bg-[#1a1a1a] rounded-full relative overflow-hidden">
        <div
          className="absolute top-0 bottom-0 w-px bg-[#333]"
          style={{ left: `${zeroPos}%` }}
        />
        <div
          className={`absolute top-0.5 bottom-0.5 rounded-full ${
            isPositive ? 'bg-green-500/70' : 'bg-red-500/70'
          }`}
          style={{
            left: `${barLeft}%`,
            width: `${Math.max(barWidth, 1)}%`,
          }}
        />
      </div>
      <span
        className={`w-12 text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-right shrink-0 ${
          isPositive ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {value > 0 ? '+' : ''}{value.toFixed(2)}
      </span>
    </div>
  );
}
