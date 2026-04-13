import type { TabId, DataSet } from '../types';

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  dataSet: DataSet;
  onDataSetChange: (ds: DataSet) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'rankings', label: 'RANKINGS' },
  { id: 'matchups', label: 'MATCHUPS' },
  { id: 'odds', label: 'ODDS' },
  { id: 'methodology', label: 'METHODOLOGY' },
  { id: 'results', label: 'RESULTS' },
];

export default function Header({ activeTab, onTabChange, dataSet, onDataSetChange }: HeaderProps) {
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
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#22c55e] font-['Inter',system-ui,sans-serif]">
                X
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">
                Putting Regression Model
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Round/Cumulative toggle */}
            <div className="flex border border-[#22c55e]/50 rounded-full p-0.5">
              <button
                onClick={() => onDataSetChange('round')}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-medium rounded-full transition-colors font-['Inter',system-ui,sans-serif] cursor-pointer ${
                  dataSet === 'round'
                    ? 'bg-[#22c55e] text-[#0a0a0a]'
                    : 'text-[#f5f5f5] hover:text-white'
                }`}
              >
                Round
              </button>
              <button
                onClick={() => onDataSetChange('cumulative')}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-medium rounded-full transition-colors font-['Inter',system-ui,sans-serif] cursor-pointer ${
                  dataSet === 'cumulative'
                    ? 'bg-[#22c55e] text-[#0a0a0a]'
                    : 'text-[#f5f5f5] hover:text-white'
                }`}
              >
                Cumulative
              </button>
            </div>

            {/* Tournament badge */}
            <div className="border border-[#22c55e]/50 rounded-full px-3 md:px-4 py-1.5 bg-[#0a0a0a]">
              <span className="text-[10px] md:text-xs text-[#f5f5f5] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif]">
                The Masters 2026 <span className="text-[#f5f5f5]/50">|</span> FINAL
              </span>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex gap-0 -mb-px">
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
