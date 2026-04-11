import { useState } from 'react';
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
  { id: 'methodology', label: 'METHODOLOGY' },
  { id: 'results', label: 'RESULTS' },
];

function ShareButtons() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://birdiex.co');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareX = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent('https://birdiex.co')}&text=${encodeURIComponent('Check out BirdieX - PGA Tour betting analytics powered by the X Score Model')}`,
      '_blank'
    );
  };

  const handleShareText = () => {
    window.open(`sms:?body=${encodeURIComponent('Check out BirdieX - PGA Tour betting analytics: https://birdiex.co')}`);
  };

  const handleShareEmail = () => {
    window.open(
      `mailto:?subject=${encodeURIComponent('BirdieX - PGA Tour Betting Analytics')}&body=${encodeURIComponent('Check out BirdieX - PGA Tour betting analytics powered by the X Score Model: https://birdiex.co')}`,
      '_blank'
    );
  };

  const btnClass =
    'px-3 py-1 text-[10px] uppercase tracking-wider font-medium rounded-full border border-[#22c55e]/50 bg-transparent text-[#f5f5f5] hover:bg-[#22c55e]/10 transition-colors cursor-pointer font-[\'Inter\',system-ui,sans-serif]';

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={handleCopyLink} className={btnClass}>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button onClick={handleShareX} className={btnClass}>
        X
      </button>
      <button onClick={handleShareText} className={btnClass}>
        Text
      </button>
      <button onClick={handleShareEmail} className={btnClass}>
        Email
      </button>
    </div>
  );
}

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
                X Score Model
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Share buttons - hidden on small screens */}
            <div className="hidden lg:block">
              <ShareButtons />
            </div>

            {/* Founder credit */}
            <div className="hidden md:block">
              <span className="text-[10px] text-[#a1a1aa] tracking-wider font-['JetBrains_Mono','SF_Mono',monospace]">
                Chris Dell: Founder
              </span>
            </div>

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
            <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-3 md:px-4 py-1.5">
              <span className="text-[10px] md:text-xs text-[#22c55e] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif]">
                The Masters 2026 <span className="text-[#22c55e]/50">|</span> Round 1
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
              className={`px-4 md:px-6 py-3 text-xs md:text-sm tracking-wider font-medium transition-colors border-b-2 font-['Inter',system-ui,sans-serif] cursor-pointer ${
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
