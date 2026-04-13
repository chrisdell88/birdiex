export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Section 1: The X Score */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#f5f5f5] mb-2 font-['Inter',system-ui,sans-serif]">
          The X Score
        </h2>
        <p className="text-sm text-[#d4d4d4] mb-6 font-['Inter',system-ui,sans-serif] leading-relaxed">
          The X Score is BirdieX's proprietary regression-based rating that identifies golfers
          whose scoring is artificially inflated or deflated by putting performance -- a skill
          category that historically regresses to the mean faster than any other. The result is a
          single number that tells you whether a golfer's next round is likely to be better or worse
          than their scorecard suggests.
        </p>

        {/* Formula visual */}
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 mb-8">
          <div className="text-center mb-4">
            <span className="text-xs text-[#d4d4d4] uppercase tracking-widest font-['Inter',system-ui,sans-serif]">
              Formula
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
            <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg px-4 py-3 min-w-[100px]">
              <div className="text-[10px] text-[#d4d4d4] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">Layer 1</div>
              <div className="text-sm font-semibold text-[#22c55e] font-['Inter',system-ui,sans-serif]">SG Score</div>
            </div>
            <span className="text-[#d4d4d4] font-['JetBrains_Mono','SF_Mono',monospace] text-lg">+</span>
            <div className="bg-[#22c55e]/8 border border-[#22c55e]/25 rounded-lg px-4 py-3 min-w-[100px]">
              <div className="text-[10px] text-[#d4d4d4] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">Layer 2</div>
              <div className="text-sm font-semibold text-[#22c55e] font-['Inter',system-ui,sans-serif]">History</div>
            </div>
            <span className="text-[#d4d4d4] font-['JetBrains_Mono','SF_Mono',monospace] text-lg">+</span>
            <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-lg px-4 py-3 min-w-[100px]">
              <div className="text-[10px] text-[#d4d4d4] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">Layer 3</div>
              <div className="text-sm font-semibold text-[#22c55e] font-['Inter',system-ui,sans-serif]">Fit</div>
            </div>
            <span className="text-[#d4d4d4] font-['JetBrains_Mono','SF_Mono',monospace] text-lg">+</span>
            <div className="bg-[#22c55e]/3 border border-[#22c55e]/15 rounded-lg px-4 py-3 min-w-[100px]">
              <div className="text-[10px] text-[#d4d4d4] uppercase tracking-wider font-['Inter',system-ui,sans-serif]">Layer 4</div>
              <div className="text-sm font-semibold text-[#22c55e] font-['Inter',system-ui,sans-serif]">Major</div>
            </div>
            <span className="text-[#d4d4d4] font-['JetBrains_Mono','SF_Mono',monospace] text-lg">=</span>
            <div className="bg-[#22c55e]/15 border border-[#22c55e]/40 rounded-lg px-5 py-3 min-w-[100px]">
              <div className="text-[10px] text-[#22c55e] uppercase tracking-wider font-bold font-['Inter',system-ui,sans-serif]">Result</div>
              <div className="text-sm font-bold text-[#22c55e] font-['Inter',system-ui,sans-serif]">X Score</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Why Putting Regression? */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 font-['Inter',system-ui,sans-serif]">
          Why Putting Regression?
        </h2>
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 space-y-4">
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            Putting is the least predictive strokes gained category in professional golf. Research
            across PGA Tour data shows that first-round putting performance has an R-squared of
            just <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">0.001</span> when
            predicting second-round putting -- essentially zero predictive value. Compare that to
            tee-to-green performance, which carries an R-squared roughly 30x higher.
          </p>
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            Year-over-year, tee-to-green performance correlates at <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">R = 0.69</span>,
            meaning golfers sustain most of their ball-striking ability season to season. Putting
            correlates at just <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">R = 0.54</span>,
            meaning nearly half of a golfer's putting performance regresses to the mean the following year.
            The gap widens for long putts: putts from 25+ feet show a correlation of just{' '}
            <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">R = 0.10</span>,
            making them nearly random.
          </p>
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            DataGolf's predictive model confirms this hierarchy. Their regression coefficients for
            predicting future performance weight each SG category differently: OTT
            at <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">~1.2</span>,
            APP at <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">~1.0</span>,
            ARG at <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">~0.9</span>,
            and Putting at just <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">~0.6</span>.
            A one-stroke gain off the tee is worth twice as much as a one-stroke gain on the greens
            when projecting future rounds.
          </p>
          <div className="border-l-2 border-[#22c55e]/40 pl-4 mt-4">
            <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed italic">
              The betting edge: the market reacts to scores, not how those scores were achieved. A
              golfer who shoots -5 via hot putting gets priced similarly to one who shoots -5 via
              elite ball striking. But their projections going forward should be very different --
              and that's where BirdieX finds value.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: The 4-Layer Model */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 font-['Inter',system-ui,sans-serif]">
          The 4-Layer Model
        </h2>
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-[#22c55e]/20 text-[#22c55e] text-xs font-bold px-2.5 py-1 rounded font-['JetBrains_Mono','SF_Mono',monospace]">
                L1
              </span>
              <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                SG Score -- Putting Regression
              </h3>
            </div>
            <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mb-3">
              The foundation of the X Score. We apply a course-weighted putting regression across
              all four strokes gained categories -- rewarding ball striking (OTT, APP) and penalizing
              putting dependency. Weights adjust per course based on DataGolf's fit coefficients and
              the venue's historical predictability score.
            </p>
            <div className="bg-[#111] border border-[#333] rounded-md p-3">
              <p className="text-xs text-[#999] font-['JetBrains_Mono','SF_Mono',monospace] leading-relaxed">
                (w_OTT x SG_OTT + w_APP x SG_APP + w_ARG x SG_ARG - w_PUTT x SG_PUTT) / sum(weights)
              </p>
              <p className="text-xs text-[#666] font-['Inter',system-ui,sans-serif] mt-2">
                Putting is subtracted, not added. A golfer gaining strokes via ball striking scores higher
                than one gaining the same strokes via putting.
              </p>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-[#22c55e]/20 text-[#22c55e] text-xs font-bold px-2.5 py-1 rounded font-['JetBrains_Mono','SF_Mono',monospace]">
                L2
              </span>
              <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                Course History
              </h3>
            </div>
            <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
              Some players consistently outperform at specific courses. This layer adjusts the X Score
              using a golfer's historical performance at the venue. Courses with longer track records
              produce stronger signals -- Augusta's predictability score
              of <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">0.144</span> is
              the highest on Tour, meaning past performance there is more indicative of future results
              than at any other venue.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-[#22c55e]/20 text-[#22c55e] text-xs font-bold px-2.5 py-1 rounded font-['JetBrains_Mono','SF_Mono',monospace]">
                L3
              </span>
              <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                Course Fit
              </h3>
            </div>
            <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
              Different courses reward different skill profiles. This layer measures how well a
              golfer's strengths align with what the course demands. At Augusta, driving distance
              matters roughly 2x more than the Tour average, while at a tight, tree-lined course
              like Harbour Town, accuracy dominates. A long hitter at Augusta gets a boost here; the
              same player at Harbour Town gets penalized.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-[#22c55e]/20 text-[#22c55e] text-xs font-bold px-2.5 py-1 rounded font-['JetBrains_Mono','SF_Mono',monospace]">
                L4
              </span>
              <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                Major Championship Adjustment
              </h3>
            </div>
            <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
              Majors are different. The pressure is higher, the setups are tougher, and some players
              consistently elevate while others shrink. This layer adjusts for a player's major
              championship track record. Koepka, for example, gains
              an additional <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">+0.18</span> strokes
              per round at majors versus regular Tour events. This layer is zeroed out at non-major
              tournaments.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Signal System */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 font-['Inter',system-ui,sans-serif]">
          Signal System
        </h2>
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 space-y-5">
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            Each golfer receives a directional signal based on their X Score. Buy signals indicate
            positive regression is expected -- the golfer is likely playing better than their
            scorecard shows. Sell signals indicate negative regression -- the golfer is
            benefiting from unsustainable putting and is likely to fall back.
          </p>

          <div>
            <h4 className="text-xs text-[#999] uppercase tracking-wider mb-3 font-['Inter',system-ui,sans-serif]">
              Direction
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-['Inter',system-ui,sans-serif]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>
                <span className="text-[#d4d4d4]">{'STRONGEST BUY -- X Score >= 1.50'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-600"></span>
                <span className="text-[#d4d4d4]">{'STRONG BUY -- X Score >= 1.00'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#22c55e]/50"></span>
                <span className="text-[#d4d4d4]">{'BUY -- X Score >= 0.50'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                <span className="text-[#d4d4d4]">NEUTRAL -- X Score between -0.50 and 0.50</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400/50"></span>
                <span className="text-[#d4d4d4]">FADE -- X Score &lt;= -0.50</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600"></span>
                <span className="text-[#d4d4d4]">STRONG FADE -- X Score &lt;= -1.00</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-[#d4d4d4]">STRONGEST FADE -- X Score &lt;= -1.50</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs text-[#999] uppercase tracking-wider mb-3 font-['Inter',system-ui,sans-serif]">
              Purity
            </h4>
            <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mb-3">
              Purity measures whether a golfer's ball-striking stats confirm the signal. We use
              a <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">+/-0.45</span> threshold
              on OTT and APP strokes gained:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-['Inter',system-ui,sans-serif]">
              <div className="flex items-start gap-2">
                <span className="text-[#22c55e] font-bold mt-0.5">PURE</span>
                <span className="text-[#d4d4d4]">OTT and APP both support the signal direction (both above +0.45 for buys, both below -0.45 for fades)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold mt-0.5">CONFLICTED</span>
                <span className="text-[#d4d4d4]">Ball-striking stats contradict the signal -- proceed with caution</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: About BirdieX */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 font-['Inter',system-ui,sans-serif]">
          About BirdieX
        </h2>
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 space-y-4">
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            Built by sports bettors, for sports bettors.
          </p>
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            BirdieX was founded by <span className="text-[#f5f5f5] font-medium">Chris Dell</span>,
            Founder & CEO of Fantasy Edge Media
            and <span className="text-[#22c55e] font-medium">BettingPredators.com</span>.
            A former sports writer and news editor with an M.A. in Entrepreneurial Journalism from
            the Craig Newmark Graduate School of Journalism, Chris has spent over a decade building
            data-driven sports media products and grinding PGA Tour models on spreadsheets before
            turning them into BirdieX.
          </p>
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            BirdieX is part of the <span className="text-[#f5f5f5] font-medium">BallerX</span> family
            of sports analytics
            tools: <span className="text-[#22c55e]">MockX</span> (NFL Draft
            stock), <span className="text-[#22c55e]">BracketX</span> (March Madness),
            and <span className="text-[#22c55e]">BirdieX</span> (PGA Tour betting).
          </p>
          <p className="text-xs text-[#999] font-['Inter',system-ui,sans-serif]">
            Data provided by <span className="text-[#22c55e] font-medium">DataGolf</span>.
            All strokes gained data, player statistics, and historical performance metrics are
            sourced from DataGolf's API.
          </p>
        </div>
      </section>

      {/* Section 6: Why BirdieX? */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 font-['Inter',system-ui,sans-serif]">
          Why BirdieX?
        </h2>
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 space-y-4">
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            Most golf betting tools show you odds, projections, and ownership percentages. BirdieX
            does something different: it tells you <span className="text-[#f5f5f5] font-medium italic">why</span> a
            golfer's score is misleading and which direction it's likely to move.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] text-xs mt-1 shrink-0">01</span>
              <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
                <span className="text-[#f5f5f5] font-medium">Regression-first approach.</span>{' '}
                No other public golf betting tool applies a putting regression model as its core
                thesis. The X Score is built on the statistical fact that putting is the least
                persistent skill in professional golf.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] text-xs mt-1 shrink-0">02</span>
              <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
                <span className="text-[#f5f5f5] font-medium">Backed by data, not vibes.</span>{' '}
                The putting regression thesis is supported by years of PGA Tour strokes gained
                research. DataGolf's own model weights putting at roughly half the value of
                off-the-tee performance when predicting future rounds.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] text-xs mt-1 shrink-0">03</span>
              <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
                <span className="text-[#f5f5f5] font-medium">Transparent results.</span>{' '}
                Every signal is logged, every bet tracked, every unit recorded. No cherry-picked
                screenshots -- just an honest ledger of what the model said and what happened.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] text-xs mt-1 shrink-0">04</span>
              <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
                <span className="text-[#f5f5f5] font-medium">Actionable, not academic.</span>{' '}
                BirdieX translates strokes gained regression analysis into clear Buy, Fade, and
                Neutral signals with purity grades -- so you know exactly where to look and how
                confident the model is.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
