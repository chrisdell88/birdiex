/**
 * PastChampions — horizontal strip of recent winners at the current
 * event's venue. Shown near the top of the Rankings page as historical
 * context. Headshot + name + year (+ optional score).
 *
 * Looks for champions under the current event's id in eventChampions.ts.
 * If no list exists, renders nothing.
 */
import { championsByEvent } from '../data/eventChampions';
import { headshots } from '../data/headshots';
import { currentEvent } from '../config/event';

function getInitials(name: string): string {
  const parts = name.split(',').map((s) => s.trim());
  if (parts.length >= 2) {
    const first = parts[1] ?? '';
    const last = parts[0] ?? '';
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Match the current event by name (we don't expose a slug on currentEvent). */
function lookupChampions() {
  // Try slug-based lookups first.
  const name = currentEvent.name.toLowerCase();
  for (const key of Object.keys(championsByEvent)) {
    const slug = key.replace(/-\d{4}$/, '').replace(/-/g, ' ');
    if (name.includes(slug)) {
      const list = championsByEvent[key];
      if (list && list.length > 0) return list;
    }
  }
  return [];
}

export default function PastChampions() {
  const champions = lookupChampions();
  if (!champions.length) return null;

  // Show up to the 5 most-recent.
  const recent = champions.slice(0, 5);

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif]">
            Recent Champions
          </h3>
          <p className="text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Last {recent.length} winners at {currentEvent.course}.
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {recent.map((c) => {
          const url = headshots[c.playerName];
          return (
            <div
              key={`${c.year}-${c.playerName}`}
              className="shrink-0 flex flex-col items-center w-[110px] bg-[#0a0a0a] border border-[#262626] hover:border-[#22c55e]/40 rounded-lg p-3 transition-colors"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden border border-[#262626] bg-[#1a1a1a] flex items-center justify-center mb-2 shrink-0">
                {url ? (
                  <img
                    src={url}
                    alt={c.playerName}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-sm font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                    {getInitials(c.playerName)}
                  </span>
                )}
              </div>
              <div className="text-[11px] font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif] text-center leading-tight">
                {c.playerName}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-[#22c55e] font-bold font-['JetBrains_Mono','SF_Mono',monospace]">
                  {c.year}
                </span>
                {c.score && (
                  <>
                    <span className="text-[10px] text-[#404040]">·</span>
                    <span className="text-[10px] text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace]">
                      {c.score}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
