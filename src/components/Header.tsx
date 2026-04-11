import type { TabId } from '../types';

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'rankings', label: 'RANKINGS' },
  { id: 'matchups', label: 'MATCHUPS' },
  { id: 'methodology', label: 'METHODOLOGY' },
];

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="border-b border-[#262626] bg-[#0a0a0a] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-baseline">
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-['Inter',system-ui,sans-serif]">
                BIRDIE
              </span>
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#00a86b] font-['Inter',system-ui,sans-serif]">
                X
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#52525b] font-['Inter',system-ui,sans-serif]">
                X Score Model
              </span>
            </div>
          </div>

          {/* Tournament badge */}
          <div className="bg-[#006747]/20 border border-[#006747]/40 rounded-full px-3 md:px-4 py-1.5">
            <span className="text-[10px] md:text-xs text-[#00a86b] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif]">
              The Masters 2026 <span className="text-[#006747]">|</span> Round 1
            </span>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 md:px-6 py-3 text-xs md:text-sm tracking-wider font-medium transition-colors border-b-2 font-['Inter',system-ui,sans-serif] cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#00a86b] text-[#00a86b]'
                  : 'border-transparent text-[#52525b] hover:text-[#a1a1aa]'
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
