export default function Footer() {
  return (
    <footer className="border-t border-[#262626] bg-[#0a0a0a] mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white font-['Inter',system-ui,sans-serif]">BirdieX</span>
            <span className="text-[#52525b] text-sm font-['Inter',system-ui,sans-serif]">
              -- Part of the BallerX family
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#52525b] font-['Inter',system-ui,sans-serif]">
            <a href="https://mockx.co" target="_blank" rel="noopener noreferrer" className="hover:text-[#a1a1aa] transition-colors">
              MockX.co
            </a>
            <span className="text-[#262626]">|</span>
            <a href="https://bracketx.co" target="_blank" rel="noopener noreferrer" className="hover:text-[#a1a1aa] transition-colors">
              BracketX.co
            </a>
            <span className="text-[#262626]">|</span>
            <a href="https://ballerx.co" target="_blank" rel="noopener noreferrer" className="hover:text-[#a1a1aa] transition-colors">
              BallerX.co
            </a>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1 text-xs text-[#52525b] font-['Inter',system-ui,sans-serif]">
            <span>Data provided by DataGolf</span>
            <span>&copy; 2026 BirdieX. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
