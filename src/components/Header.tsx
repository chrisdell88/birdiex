import type { TabId } from '../types';
import { currentEvent } from '../config/event';

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'rankings', label: 'RANKINGS' },
  { id: 'matchups', label: 'MATCHUPS' },
  { id: 'odds', label: 'ODDS' },
  { id: 'simulator', label: 'SIMULATOR' },
  { id: 'methodology', label: 'METHODOLOGY' },
  { id: 'results', label: 'RESULTS' },
  { id: 'alerts', label: 'ALERTS' },
];

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="border-b border-[#262626] bg-[#0a0a0a] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            {/* Logo — clicking returns to Rankings (home). Treated as a true
                home link so it works once we split tabs into separate routes. */}
            <button
              type="button"
              onClick={() => onTabChange('rankings')}
              aria-label="BirdieX — go to home / Rankings"
              className="flex items-baseline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm transition-opacity hover:opacity-80"
            >
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-['Inter',system-ui,sans-serif]">
                BIRDIE
              </span>
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#22c55e] font-['Inter',system-ui,sans-serif]">
                X
              </span>
            </button>
            <div className="hidden sm:block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
                Putting Regression Model
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tournament badge — course · event · last-updated. Hidden on
                mobile (no room; the round context is shown on every page's
                own content). */}
            <div className="hidden sm:block border border-[#22c55e]/50 rounded-full px-3 md:px-4 py-1.5 bg-[#0a0a0a]">
              <span className="text-[10px] md:text-xs text-[#f5f5f5] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif]">
                {currentEvent.course}{' '}
                <span className="text-[#f5f5f5]/50">·</span>{' '}
                {currentEvent.name}{' '}
                <span className="text-[#f5f5f5]/50">·</span>{' '}
                <span className="text-[#a1a1aa]">
                  Updated{' '}
                  {new Date(currentEvent.dataUpdatedAt).toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZoneName: 'short',
                  })}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation tabs — scroll horizontally on mobile so all tabs stay reachable */}
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 md:px-6 py-3 text-[13px] md:text-[14px] tracking-[0.12em] font-medium transition-colors border-b-2 font-['JetBrains_Mono','SF_Mono','Fira_Code',monospace] uppercase cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#22c55e] text-[#22c55e]'
                  : 'border-transparent text-[#f5f5f5] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
