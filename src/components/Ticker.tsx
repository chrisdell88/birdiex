import { tickerData, tickerRound } from '../data/ticker';
import { formatPlayerName } from '../lib/formatName';
import { currentEvent } from '../config/event';

/** Score-to-par display + color (under par green, over par red). */
function score(s: number | null): { text: string; cls: string } {
  if (s == null || s === 0) return { text: 'E', cls: 'text-[#d4d4d4]' };
  if (s < 0) return { text: String(s), cls: 'text-[#22c55e]' };
  return { text: `+${s}`, cls: 'text-[#ef4444]' };
}

/** Live status pill — what to show next to the score:
 *   - thru >= 18: "F" (finished)
 *   - 0 < thru < 18: "Thru N" (on course right now)
 *   - thru null/0: the player's tee time (hasn't started yet) */
function statusFor(thru: number | null, teeTime: string): { text: string; cls: string } {
  if (thru != null && thru >= 18) return { text: 'F', cls: 'text-[#a1a1aa]' };
  if (thru != null && thru > 0) return { text: `Thru ${thru}`, cls: 'text-[#22c55e]' };
  return { text: teeTime, cls: 'text-[#a1a1aa]' };
}

/**
 * Tee-times / scores ticker — a horizontal marquee of the upcoming round's
 * field. Auto-scrolls; pauses on hover (see .ticker-track in index.css).
 *
 * Two modes:
 *   - Live: per-round tee times + scores. Title "R{N} Tee Times / Leaderboard".
 *   - Post-final (isComplete): final leaderboard, no tee times. Title
 *     "Final Leaderboard".
 */
export default function Ticker() {
  if (!tickerData.length) return null;
  const isFinal = currentEvent.isComplete;
  // Duplicate the list so the marquee loop is seamless.
  const items = [...tickerData, ...tickerData];

  return (
    <div className="border-b border-[#262626] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto flex items-stretch">
        <div className="flex-shrink-0 bg-[#22c55e]/10 border-r border-[#262626] px-3 md:px-4 flex items-center">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#22c55e] whitespace-nowrap font-['Inter',system-ui,sans-serif]">
            {isFinal ? 'Final Leaderboard' : `R${tickerRound} Tee Times / Leaderboard`}
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
                  <span className="text-[10px] font-bold text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] tabular-nums">
                    {e.pos}
                  </span>
                  <span className="text-xs font-medium text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                    {formatPlayerName(e.player)}
                  </span>
                  <span className={`text-xs font-['JetBrains_Mono','SF_Mono',monospace] ${s.cls}`}>
                    {s.text}
                  </span>
                  {!isFinal && (() => {
                    const st = statusFor(e.thru, e.teeTime);
                    if (!st.text) return null;
                    return (
                      <span className={`text-[10px] font-['JetBrains_Mono','SF_Mono',monospace] ${st.cls}`}>
                        {st.text}
                      </span>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
