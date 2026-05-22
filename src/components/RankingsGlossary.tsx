/**
 * RankingsGlossary — terse, always-visible reference at the bottom of the
 * Rankings page. Only defines terms users WOULDN'T know — column headers
 * like POS / Player / SCORE are common sense and intentionally omitted.
 *
 * Two sections: Column metrics (the BirdieX-specific ones) and Signal
 * tiers (the 9 BUY/FADE levels + Pure/Conflicted purity).
 */

interface Term {
  label: string;
  def: string;
}

// Only BirdieX-specific column metrics. POS/Player/SCORE/History/Fit/Major
// are common sense or context-obvious; they're omitted on purpose.
const COLUMN_TERMS: Term[] = [
  {
    label: 'X Score',
    def: 'BirdieX\'s proprietary rating. Positive = expected to improve; negative = expected to regress.',
  },
  {
    label: 'SG_OTT',
    def: 'Strokes Gained: Off-the-Tee. Driving performance vs. field average.',
  },
  {
    label: 'SG_APP',
    def: 'Strokes Gained: Approach. Iron play / approach shots into greens.',
  },
  {
    label: 'SG_ARG',
    def: 'Strokes Gained: Around the Green. Chipping + bunker play within ~30 yards.',
  },
  {
    label: 'SG_PUTT',
    def: 'Strokes Gained: Putting. The X Score SUBTRACTS this — putting is the least repeatable skill.',
  },
  {
    label: 'SG Score / DG Skill',
    def: 'Layer 1 of the model. Post-R1: course-weighted strokes-gained from the latest round. Pre-R1: DataGolf\'s baseline skill estimate.',
  },
];

const SIGNAL_TERMS: Term[] = [
  { label: 'STRONGEST BUY', def: 'X Score ≥ 1.50. Highest-conviction "expect to improve" pick.' },
  { label: 'STRONG BUY', def: 'X Score 1.00 to 1.49.' },
  { label: 'BUY', def: 'X Score 0.50 to 0.99.' },
  { label: 'LEAN BUY', def: 'X Score 0.00 to 0.49.' },
  { label: 'NEUTRAL', def: 'X Score between -0.50 and 0.00. No directional opinion.' },
  { label: 'LEAN FADE', def: 'X Score -0.50 to -1.00.' },
  { label: 'FADE', def: 'X Score -1.00 to -1.50.' },
  { label: 'STRONG FADE', def: 'X Score -1.50 to -2.00.' },
  { label: 'STRONGEST FADE', def: 'X Score ≤ -2.00. Highest-conviction "expect to regress" pick.' },
];

const PURITY_TERMS: Term[] = [
  { label: 'PURE', def: 'The player\'s ball-striking stats (OTT + APP) confirm the signal direction.' },
  { label: 'CONFLICTED', def: 'Ball-striking stats contradict the signal. Proceed with caution.' },
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
          Quick definitions for the BirdieX-specific terms on this page.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
        <Section title="Column Metrics" terms={COLUMN_TERMS} />
        <Section title="Signal Levels" terms={SIGNAL_TERMS} />
        <Section title="Signal Purity" terms={PURITY_TERMS} />
      </div>
    </div>
  );
}
