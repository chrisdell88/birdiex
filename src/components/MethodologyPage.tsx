export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* The X Score */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#f5f5f5] mb-2 font-['Inter',system-ui,sans-serif]">
          The X Score
        </h2>
        <p className="text-sm text-[#a1a1aa] mb-6 font-['Inter',system-ui,sans-serif] leading-relaxed">
          The X Score is BirdieX's proprietary composite metric for evaluating golfer performance
          and identifying betting value. It combines four analytical layers into a single number
          that separates real skill from noise, luck, and short-term variance.
        </p>

        {/* Formula visual */}
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 mb-8">
          <div className="text-center mb-4">
            <span className="text-xs text-[#52525b] uppercase tracking-widest font-['Inter',system-ui,sans-serif]">
              Formula
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
            <div className="bg-[#006747]/20 border border-[#006747]/30 rounded-lg px-4 py-3 min-w-[100px]">
              <div className="text-[10px] text-[#52525b] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">Layer 1</div>
              <div className="text-sm font-semibold text-[#00a86b] font-['Inter',system-ui,sans-serif]">SG Score</div>
            </div>
            <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace] text-lg">+</span>
            <div className="bg-[#006747]/15 border border-[#006747]/25 rounded-lg px-4 py-3 min-w-[100px]">
              <div className="text-[10px] text-[#52525b] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">Layer 2</div>
              <div className="text-sm font-semibold text-[#00a86b] font-['Inter',system-ui,sans-serif]">History</div>
            </div>
            <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace] text-lg">+</span>
            <div className="bg-[#006747]/10 border border-[#006747]/20 rounded-lg px-4 py-3 min-w-[100px]">
              <div className="text-[10px] text-[#52525b] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">Layer 3</div>
              <div className="text-sm font-semibold text-[#00a86b] font-['Inter',system-ui,sans-serif]">Fit</div>
            </div>
            <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace] text-lg">+</span>
            <div className="bg-[#006747]/5 border border-[#006747]/15 rounded-lg px-4 py-3 min-w-[100px]">
              <div className="text-[10px] text-[#52525b] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">Layer 4</div>
              <div className="text-sm font-semibold text-[#00a86b] font-['Inter',system-ui,sans-serif]">Major</div>
            </div>
            <span className="text-[#52525b] font-['JetBrains_Mono','SF_Mono',monospace] text-lg">=</span>
            <div className="bg-[#00a86b]/20 border border-[#00a86b]/40 rounded-lg px-5 py-3 min-w-[100px]">
              <div className="text-[10px] text-[#00a86b] uppercase tracking-wider font-bold font-['Inter',system-ui,sans-serif]">Result</div>
              <div className="text-sm font-bold text-[#00a86b] font-['Inter',system-ui,sans-serif]">X Score</div>
            </div>
          </div>
        </div>

        {/* Layer explanations */}
        <div className="space-y-6">
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-[#006747]/30 text-[#00a86b] text-xs font-bold px-2.5 py-1 rounded font-['JetBrains_Mono','SF_Mono',monospace]">
                L1
              </span>
              <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                SG Score -- Strokes Gained Regression
              </h3>
            </div>
            <p className="text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed">
              The foundation of the X Score. We run a 4-layer putting regression across all
              strokes gained categories (Off the Tee, Approach, Around the Green, Putting) to
              isolate true skill from round-to-round variance. This layer carries the most weight
              and tells us how a player is actually performing versus how their scorecard reads.
            </p>
          </div>

          <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-[#006747]/30 text-[#00a86b] text-xs font-bold px-2.5 py-1 rounded font-['JetBrains_Mono','SF_Mono',monospace]">
                L2
              </span>
              <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                Course History Adjustment
              </h3>
            </div>
            <p className="text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed">
              Some players simply play certain courses better than others. This layer adjusts the
              X Score based on a player's historical performance at the specific venue. A player
              like Justin Rose at Augusta gets a significant boost here, while a first-timer gets
              a slight penalty for the unknown.
            </p>
          </div>

          <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-[#006747]/30 text-[#00a86b] text-xs font-bold px-2.5 py-1 rounded font-['JetBrains_Mono','SF_Mono',monospace]">
                L3
              </span>
              <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                Course Fit + SG Category Adjustment
              </h3>
            </div>
            <p className="text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed">
              Different courses reward different skill sets. Augusta demands elite approach play and
              distance. This layer combines a course-fit analysis (does this player's game match what
              the course demands?) with a strokes gained category adjustment that weights the SG
              categories most relevant to success at this venue.
            </p>
          </div>

          <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-[#006747]/30 text-[#00a86b] text-xs font-bold px-2.5 py-1 rounded font-['JetBrains_Mono','SF_Mono',monospace]">
                L4
              </span>
              <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                Major Championship Adjustment
              </h3>
            </div>
            <p className="text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed">
              Majors are different. The pressure is higher, the setups are tougher, and some players
              consistently rise to the occasion while others shrink. This final layer adjusts for a
              player's track record in major championships -- rewarding proven major performers and
              penalizing those who historically underperform when it matters most.
            </p>
          </div>
        </div>
      </section>

      {/* Signal System */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 font-['Inter',system-ui,sans-serif]">
          Signal System
        </h2>
        <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
          <p className="text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed mb-4">
            Based on the final X Score, each player receives one of seven signals that indicate
            our confidence level for future rounds:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-['Inter',system-ui,sans-serif]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-[#a1a1aa]">STRONGEST BUY -- Highest conviction pick</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-600"></span>
              <span className="text-[#a1a1aa]">STRONG BUY -- High confidence value</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400/50"></span>
              <span className="text-[#a1a1aa]">BUY -- Positive value identified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-500"></span>
              <span className="text-[#a1a1aa]">HOLD -- Neutral, no clear edge</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400/50"></span>
              <span className="text-[#a1a1aa]">FADE -- Negative value identified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600"></span>
              <span className="text-[#a1a1aa]">STRONG FADE -- High confidence fade</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-[#a1a1aa]">STRONGEST FADE -- Highest conviction fade</span>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 font-['Inter',system-ui,sans-serif]">
          About BirdieX
        </h2>
        <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
          <p className="text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed">
            BirdieX is a PGA Tour betting analytics platform built by sports bettors, for sports
            bettors. Part of the BallerX family of products, BirdieX brings institutional-grade
            analytics to everyday golf fans. Our models are designed to cut through the noise and
            deliver clear, actionable signals for each tournament.
          </p>
        </div>
      </section>

      {/* Data Sources */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 font-['Inter',system-ui,sans-serif]">
          Data Sources
        </h2>
        <div className="bg-[#111111] border border-[#262626] rounded-lg p-5">
          <p className="text-sm text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-relaxed">
            All strokes gained data, player statistics, and historical performance metrics are
            sourced from <span className="text-[#00a86b] font-medium">DataGolf</span>, our
            official data partner. DataGolf provides the most comprehensive and accurate golf
            analytics data available, powering our X Score model with real-time tournament data.
          </p>
        </div>
      </section>
    </div>
  );
}
