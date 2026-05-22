/**
 * RankingsGlossary — full reference glossary rendered at the BOTTOM of
 * the Rankings page (above the footer). No button, no modal — it just
 * sits there and is always available to scroll to.
 *
 * Covers every column header on the rankings table + every signal level
 * + the key concepts users see in the UI.
 */
import { currentEvent } from '../config/event';

interface Term {
  label: string;
  def: string;
}

const COLUMN_TERMS: Term[] = [
  { label: 'POS', def: 'Live leaderboard position at this event. "T3" = tied for 3rd.' },
  { label: 'Player', def: 'Last, First — matches DataGolf\'s naming convention.' },
  {
    label: 'X Score',
    def: 'BirdieX\'s proprietary rating combining four model layers. Higher = stronger pick. Lower (negative) = expected to regress.',
  },
  {
    label: 'Signal',
    def: 'Directional label derived from the X Score. Buy = expected to improve. Fade = expected to regress. Strength tiers from Strongest to Lean to Neutral.',
  },
  {
    label: 'To Win',
    def: 'DataGolf-modeled American odds to win the tournament outright. Reference only — BirdieX targets H2H matchups, not outrights.',
  },
  { label: 'SCORE', def: 'Score to par at the event (negative = under par).' },
  { label: 'SG_OTT', def: 'Strokes Gained: Off-the-Tee. Driving performance vs. field average. Positive = above field, negative = below.' },
  { label: 'SG_APP', def: 'Strokes Gained: Approach. Iron play / approach shots into greens.' },
  { label: 'SG_PUTT', def: 'Strokes Gained: Putting. The X Score SUBTRACTS this — putting is the least repeatable skill.' },
  {
    label: 'DG Skill (pre-R1) / SG Score (post-R1)',
    def: 'Layer 1 of the model. Pre-tournament: DataGolf\'s baseline skill estimate (strokes-gained per round vs. field). Post-R1: course-weighted strokes-gained from the actual round.',
  },
  { label: 'History', def: 'Layer 2. Course history adjustment — how the player has performed at this venue historically.' },
  { label: 'Fit', def: 'Layer 3. Course-fit adjustment — does the player\'s skill set match what this course demands?' },
  { label: 'Major', def: 'Layer 4. Major-championship adjustment — only present on majors (zeroed out elsewhere).' },
];

const SIGNAL_TERMS: Term[] = [
  { label: 'STRONGEST BUY', def: 'X Score ≥ 1.50. Model\'s highest-conviction "expect to improve" pick.' },
  { label: 'STRONG BUY', def: 'X Score 1.00 to 1.49.' },
  { label: 'BUY', def: 'X Score 0.50 to 0.99.' },
  { label: 'LEAN BUY', def: 'X Score 0.00 to 0.49.' },
  { label: 'NEUTRAL', def: 'X Score between -0.50 and 0.00. No directional opinion.' },
  { label: 'LEAN FADE', def: 'X Score -0.50 to -1.00 (fade = expected to regress down).' },
  { label: 'FADE', def: 'X Score -1.00 to -1.50.' },
  { label: 'STRONG FADE', def: 'X Score -1.50 to -2.00.' },
  { label: 'STRONGEST FADE', def: 'X Score ≤ -2.00. Model\'s highest-conviction "expect to regress" pick.' },
];

const PURITY_TERMS: Term[] = [
  { label: 'PURE', def: 'The player\'s ball-striking stats (OTT + APP) confirm the signal direction. The buy/fade is well-supported.' },
  { label: 'CONFLICTED', def: 'Ball-striking stats contradict the signal direction. The X Score points one way but the underlying data is mixed. Proceed with caution.' },
];

const CONCEPT_TERMS: Term[] = [
  {
    label: 'Matchup Score (X Score Edge)',
    def: 'The difference between the picked golfer\'s X Score and their opponent\'s in an H2H matchup. Bigger edge = bigger bet.',
  },
  {
    label: 'Matchup Score Threshold',
    def: 'The minimum X Score Edge that qualifies a pick as a tracked recommendation. Venue-specific — currently ≥ ' +
      currentEvent.recommendedFloor.toFixed(2) +
      ' at ' +
      currentEvent.course +
      '. Picks below the threshold are scored internally but not surfaced as recommendations.',
  },
  {
    label: 'Course Predictability',
    def: 'How much past performance at the venue predicts future results. Higher = stronger course history signal = lower required threshold.',
  },
  {
    label: 'Star Rating (★ to ★★★★★)',
    def: 'Bet SIZE in units, in half-star precision. ½★ = 0.5u, ★ = 1u, ★½ = 1.5u, ★★ = 2u … up to ★★★★★ = 5u.',
  },
  {
    label: 'Tracked vs. Scored',
    def: 'Tracked = part of the public record + tracked bet list. Scored = internal grading for backtesting. All picks at edge ≥ 0.95 are scored; only those at or above the venue threshold are tracked.',
  },
];

function Section({ title, terms }: { title: string; terms: Term[] }) {
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-widest text-[#22c55e] font-bold font-['Inter',system-ui,sans-serif] mb-3">
        {title}
      </h4>
      <dl className="space-y-2.5">
        {terms.map((t) => (
          <div key={t.label} className="text-xs font-['Inter',system-ui,sans-serif] leading-relaxed">
            <dt className="text-[#f5f5f5] font-semibold inline">{t.label}:</dt>{' '}
            <dd className="text-[#a1a1aa] inline">{t.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function RankingsGlossary() {
  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 mt-8">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
          Glossary
        </h3>
        <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
          Definitions for every column, signal, and key term on this page.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
        <Section title="Rankings Columns" terms={COLUMN_TERMS} />
        <Section title="Signal Levels" terms={SIGNAL_TERMS} />
        <div className="space-y-6">
          <Section title="Signal Purity" terms={PURITY_TERMS} />
          <Section title="Key Concepts" terms={CONCEPT_TERMS} />
        </div>
      </div>
    </div>
  );
}
