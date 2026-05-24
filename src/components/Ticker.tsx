import { tickerData, tickerRound } from '../data/ticker';

/** Score-to-par display + color (under par green, over par red). */
function score(s: number | null): { text: string; cls: string } {
  if (s == null || s === 0) return { text: 'E', cls: 'text-[#d4d4d4]' };
  if (s < 0) return { text: String(s), cls: 'text-[#22c55e]' };
  return { text: `+${s}`, cls: 'text-[#ef4444]' };
}

/**
 * Tee-times / scores ticker — a horizontal marquee of the upcoming round's
 * field. Auto-scrolls; pauses on hover (see .ticker-track in index.css).
 */
export default function Ticker() {
  if (!tickerData.length) return null;
  // Duplicate the list so the marquee loop is seamless.
  const items = [...tickerData, ...tickerData];

  return (
    <div className="border-b border-[#262626] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto flex items-stretch">
        <div className="flex-shrink-0 bg-[#22c55e]/10 border-r border-[#262626] px-3 md:px-4 flex items-center">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#22c55e] whitespace-nowrap font-['Inter',system-ui,sans-serif]">
            R{tickerRound} Tee Times / Leaderboard
          </span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track flex w-max">
            {items.map((e, i) => {
              const s = score(e.score);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 whitespace-nowrap border-r border-[#1a1a1a]"
                >
                  <span className="text-xs font-medium text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                    {e.player}
                  </span>
                  <span className={`text-xs font-['JetBrains_Mono','SF_Mono',monospace] ${s.cls}`}>
                    {s.text}
                  </span>
                  <span className="text-[10px] text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace]">
                    {e.teeTime}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
