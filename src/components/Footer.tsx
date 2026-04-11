import { useState } from 'react';

function ShareButtons() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
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
    "px-3 py-1 text-[10px] uppercase tracking-wider font-medium rounded-full border border-[#22c55e]/50 bg-transparent text-[#f5f5f5] hover:bg-[#22c55e]/10 transition-colors cursor-pointer font-['Inter',system-ui,sans-serif]";

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

export default function Footer() {
  return (
    <footer className="border-t border-[#262626] bg-[#0a0a0a] mt-auto">
      {/* Share bar */}
      <div className="border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-white tracking-wider font-['JetBrains_Mono','SF_Mono','Fira_Code',monospace]">
            Chris Dell: Founder
          </span>
          <ShareButtons />
        </div>
      </div>

      {/* Existing footer content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white font-['Inter',system-ui,sans-serif]">BirdieX</span>
            <span className="text-[#d4d4d4] text-sm font-['Inter',system-ui,sans-serif]">
              -- Part of the BallerX family
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
            <a href="https://mockx.co" target="_blank" rel="noopener noreferrer" className="hover:text-[#f5f5f5] transition-colors">
              MockX.co
            </a>
            <span className="text-[#262626]">|</span>
            <a href="https://bracketx.co" target="_blank" rel="noopener noreferrer" className="hover:text-[#f5f5f5] transition-colors">
              BracketX.co
            </a>
            <span className="text-[#262626]">|</span>
            <a href="https://ballerx.co" target="_blank" rel="noopener noreferrer" className="hover:text-[#f5f5f5] transition-colors">
              BallerX.co
            </a>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1 text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
            <span>Data provided by DataGolf</span>
            <span>&copy; 2026 BirdieX. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
