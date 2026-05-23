import { allTimeStats } from '../lib/allTimeStats';
import CourseAdaptiveChart from './CourseAdaptiveChart';
import Glossary from './Glossary';
import PuttingRegressionChart from './PuttingRegressionChart';
import SgPersistenceChart from './SgPersistenceChart';
import PredictabilityBarChart from './PredictabilityBarChart';
import EdgeDistributionChart from './EdgeDistributionChart';

interface MethodologyPageProps {
  onNavigateToResults?: () => void;
}

export default function MethodologyPage({ onNavigateToResults }: MethodologyPageProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Results Banner — All-Time tracked record (venue-aware floors). */}
      <div className="mb-8 bg-[#0a0a0a] border border-[#22c55e]/30 rounded-xl p-5">
        <div className="text-center">
          <div className="text-xs text-[#22c55e] uppercase tracking-widest font-semibold font-['Inter',system-ui,sans-serif] mb-2">
            All-Time Tracked Record
          </div>
          <div className="text-2xl font-bold text-[#f5f5f5] font-['JetBrains_Mono','SF_Mono',monospace] mb-1">
            {allTimeStats.wins}-{allTimeStats.losses}-{allTimeStats.pushes} &nbsp;|&nbsp;{' '}
            {allTimeStats.units > 0 ? '+' : ''}{allTimeStats.units.toFixed(2)} units &nbsp;|&nbsp;{' '}
            {allTimeStats.roi > 0 ? '+' : ''}{allTimeStats.roi.toFixed(1)}% ROI
          </div>
          <div className="text-xs text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-1">
            Best Bets &mdash; bets that cleared each venue&rsquo;s Best Bet
            Matchup Score Threshold. See Results for per-tournament breakdown.
          </div>
          {onNavigateToResults && (
            <button
              onClick={onNavigateToResults}
              className="mt-3 text-sm text-[#22c55e] hover:text-[#4ade80] font-medium font-['Inter',system-ui,sans-serif] underline underline-offset-2 cursor-pointer transition-colors"
            >
              View Full Results &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Section 0: Glossary — definitions first so nothing else reads as
          misleading. Most users will skim once and skip after that. */}
      <section className="mb-10">
        <Glossary />
      </section>

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

        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 mb-8">
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            The X Score combines four proprietary layers into a single rating. Layer 1 applies
            course-specific weights to strokes gained categories, with putting subtracted as a
            regression indicator. The exact weights and methodology are proprietary.
          </p>
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

        {/* Two-chart pairing: year-over-year persistence (the thesis-scale
            relationship) + R1→R2 round-to-round persistence (the single-
            tournament noise floor). Both honest about timescale. */}
        <div className="mt-5">
          <SgPersistenceChart />
        </div>

        <div className="mt-5">
          <PuttingRegressionChart />
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
            <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
              The foundation. Course-weighted strokes-gained where putting is
              <span className="text-[#22c55e] font-medium"> subtracted</span> &mdash; a golfer
              gaining via ball striking scores higher than one gaining the same strokes via
              putting. Per-category weights blend toward each venue&rsquo;s coefficients based
              on its historical predictability.
            </p>
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
              Per-player venue track record. Stronger at highly predictable courses (Augusta
              at <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">0.144</span>,
              the highest on Tour) and weaker at low-predictability venues
              (Aronimink <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">0.041</span>,
              TPC Craig Ranch <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">0.037</span>),
              where the Best Bet Matchup Score Threshold rises to compensate.
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
              Skill-profile match. Long hitters get a boost at distance-rewarding venues like
              Augusta and a penalty at accuracy-first venues like Harbour Town. Calibrated per
              course from DataGolf fit research.
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
              Per-player major track record. Rewards consistent over-performers at majors,
              penalizes consistent under-performers. Zeroed out at non-major tournaments.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3.5: From X Score to Best Bet */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 font-['Inter',system-ui,sans-serif]">
          From X Score to Best Bet
        </h2>

        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 space-y-4 mb-6">
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            The X Score outputs a number for every player in the field. To turn that into an
            actual <span className="text-[#22c55e] font-semibold">bet</span>, we pair players
            into head-to-head matchups and compute the <span className="text-[#22c55e] font-semibold">edge</span>
            {' '}(the difference in X Scores between the pick and the opponent). The model only
            considers matchups with edge{' '}
            <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">
              &ge; 0.95
            </span>
            {' '}&mdash; the hard pick floor below which the signal isn&rsquo;t actionable.
          </p>
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            Each qualifying matchup gets a <span className="text-[#22c55e] font-semibold">unit
            size</span> from the Bet Sizing Ladder above &mdash; bigger edges get bigger sizes,
            in 10 precise sub-bands. The star rating shown on the bet is just that unit size
            rounded for visual clarity.
          </p>
        </div>

        <h3 className="text-base font-semibold text-[#f5f5f5] mb-3 font-['Inter',system-ui,sans-serif]">
          Course-Adaptive Threshold
        </h3>
        <CourseAdaptiveChart />

        <div className="mt-5">
          <PredictabilityBarChart />
        </div>

        <div className="mt-5">
          <EdgeDistributionChart />
        </div>

        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 mt-5 space-y-4">
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            Not every model pick becomes a Best Bet. Each venue gets its own{' '}
            <span className="text-[#22c55e] font-semibold">Best Bet Matchup Score Threshold</span>{' '}
            &mdash; a numeric edge cutoff derived from how predictable that course is. On the
            most predictable courses (e.g., Augusta National at 0.144) we trust the model down to
            the 0.95 hard floor. On less predictable courses (Aronimink at 0.041, TPC Craig Ranch
            at 0.037) we raise the threshold significantly &mdash; only the strongest edges
            qualify as Best Bets.
          </p>
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            The threshold formula is backtest-derived: we sweep the entire edge floor across
            every event we&rsquo;ve scored, then snap to a clean tier boundary so the public
            record reflects what we&rsquo;d <span className="italic">actually</span> have
            recommended. As we add more events, the formula gets re-fitted with more data points.
          </p>
        </div>
      </section>

      {/* Section 3.6: Backtesting + Continuous Refinement */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 font-['Inter',system-ui,sans-serif]">
          Backtesting & Continuous Refinement
        </h2>
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 space-y-4">
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            Every model pick with edge &ge; 0.95 is scored internally and stored in our raw bet
            log, even if it falls below the venue&rsquo;s Best Bet Matchup Score Threshold. This
            gives us a clean dataset to backtest sizing rules, threshold formulas, and signal
            definitions against future tournament results without the bias of after-the-fact
            filtering.
          </p>
          <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
            The Best Bet Matchup Score Threshold itself was derived from this approach. After the
            Masters (high predictability, +26.2% ROI at the 0.95 floor) and PGA Championship (low
            predictability, &minus;8.5% at 0.95), we ran a sweep of every edge floor from 0.95 to
            5.00 to find where each venue actually broke even. The relationship between
            predictability and required floor gave us the linear formula behind the chart above.
          </p>
          <div className="border-l-2 border-[#22c55e]/40 pl-4 mt-2">
            <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed italic">
              The public record reflects only Best Bets &mdash; the picks we&rsquo;d have
              actually recommended at each venue. The raw log preserves everything for ongoing
              backtest work. As the model evolves, only the threshold formula changes &mdash;
              never the historical bet data.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-[#262626]">
            <h4 className="text-[11px] uppercase tracking-wider text-[#22c55e] font-semibold font-['Inter',system-ui,sans-serif] mb-2">
              Pre-Round-1 X Score
            </h4>
            <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed">
              When no rounds have been played yet, Layer 1 uses DataGolf&rsquo;s tour-wide skill
              estimate (strokes-gained per round vs. field) as the baseline. The X Score is then
              this baseline plus the same venue-specific adjustments (history, fit, major) used
              post-round. Once Round 1 grades, Layer 1 switches to the measured course-weighted
              strokes-gained signal &mdash; the locked formula that has reproduced every historical
              X Score row exactly.
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
            scorecard shows. Fade signals indicate negative regression -- the golfer is
            benefiting from unsustainable putting and is likely to fall back.
          </p>

          <div>
            <h4 className="text-xs text-[#999] uppercase tracking-wider mb-3 font-['Inter',system-ui,sans-serif]">
              Direction
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-['Inter',system-ui,sans-serif]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>
                <span className="text-[#d4d4d4]">{'STRONG BUY -- X Score >= +1.00'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-600"></span>
                <span className="text-[#d4d4d4]">{'BUY -- X Score +0.50 to +0.99'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#22c55e]/50"></span>
                <span className="text-[#d4d4d4]">{'SOFT BUY -- X Score 0.00 to +0.49'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                <span className="text-[#d4d4d4]">NEUTRAL -- X Score between -0.50 and 0.00</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400/50"></span>
                <span className="text-[#d4d4d4]">SOFT FADE -- X Score -1.00 to -0.50</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600"></span>
                <span className="text-[#d4d4d4]">FADE -- X Score -1.50 to -1.00</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-[#d4d4d4]">STRONG FADE -- X Score &lt;= -1.50</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs text-[#999] uppercase tracking-wider mb-3 font-['Inter',system-ui,sans-serif]">
              Purity
            </h4>
            <p className="text-sm text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mb-3">
              Purity flags signals where ball-striking <em>contradicts</em> the X Score direction.
              We use a <span className="text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] font-medium">+/-0.45</span> threshold
              on OTT and APP strokes gained:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-['Inter',system-ui,sans-serif]">
              <div className="flex items-start gap-2">
                <span className="text-[#22c55e] font-bold mt-0.5">PURE</span>
                <span className="text-[#d4d4d4]">Ball-striking doesn&rsquo;t contradict the signal. For a buy: neither OTT nor APP is at or below -0.45. For a fade: neither OTT nor APP is at or above +0.45.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold mt-0.5">CONFLICTED</span>
                <span className="text-[#d4d4d4]">A buy where OTT or APP is &le; -0.45, or a fade where OTT or APP is &ge; +0.45 &mdash; proceed with caution.</span>
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
            Founder & CEO of{' '}
            <span className="text-[#22c55e] font-medium">Fantasy Edge Media</span>{' '}
            <span className="text-[#a1a1aa]">(formerly Betting Predators)</span>.
            A former sports writer and news editor with an M.A. in Entrepreneurial Journalism from
            the Craig Newmark Graduate School of Journalism, Chris has spent over a decade building
            data-driven sports media products and grinding PGA Tour models on spreadsheets before
            turning them into BirdieX in 2026.
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

    </div>
  );
}
