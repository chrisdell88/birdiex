export default function ResultsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif] mb-6">
        Results Tracking
      </h2>

      {/* Placeholder message */}
      <div className="bg-[#111111] border border-[#262626] rounded-lg p-8 text-center mb-8">
        <div className="text-[#00a86b] text-4xl mb-4">--</div>
        <p className="text-[#a1a1aa] text-sm font-['Inter',system-ui,sans-serif] leading-relaxed max-w-lg mx-auto">
          Results tracking begins with Round 2 of The Masters 2026. Check back
          after R2 completes for our first model performance data.
        </p>
      </div>

      {/* Placeholder cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overall W-L */}
        <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
          <h3 className="text-[10px] uppercase tracking-wider text-[#52525b] font-medium font-['Inter',system-ui,sans-serif] mb-3">
            Overall Record
          </h3>
          <div className="text-2xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#52525b]">
            -- W / -- L
          </div>
          <div className="text-xs text-[#3f3f46] mt-1 font-['Inter',system-ui,sans-serif]">
            Win rate: --%
          </div>
        </div>

        {/* W-L by Tier */}
        <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
          <h3 className="text-[10px] uppercase tracking-wider text-[#52525b] font-medium font-['Inter',system-ui,sans-serif] mb-3">
            Record by Tier
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-green-400 font-['Inter',system-ui,sans-serif]">BEST BET</span>
              <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace]">-- / --</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-emerald-400 font-['Inter',system-ui,sans-serif]">STRONG PLAY</span>
              <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace]">-- / --</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-['Inter',system-ui,sans-serif]">LEAN</span>
              <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace]">-- / --</span>
            </div>
          </div>
        </div>

        {/* W-L by Bucket */}
        <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
          <h3 className="text-[10px] uppercase tracking-wider text-[#52525b] font-medium font-['Inter',system-ui,sans-serif] mb-3">
            Record by Bucket
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-green-400 font-['Inter',system-ui,sans-serif]">BUY vs FADE</span>
              <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace]">-- / --</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-emerald-400 font-['Inter',system-ui,sans-serif]">BUY vs OTHER</span>
              <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace]">-- / --</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-orange-400 font-['Inter',system-ui,sans-serif]">OTHER vs FADE</span>
              <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace]">-- / --</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-['Inter',system-ui,sans-serif]">OTHER vs OTHER</span>
              <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace]">-- / --</span>
            </div>
          </div>
        </div>

        {/* Set A vs Set B */}
        <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
          <h3 className="text-[10px] uppercase tracking-wider text-[#52525b] font-medium font-['Inter',system-ui,sans-serif] mb-3">
            Round vs Cumulative
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">Round (Set A)</span>
              <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace]">-- / --</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#a1a1aa] font-['Inter',system-ui,sans-serif]">Cumulative (Set B)</span>
              <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace]">-- / --</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
