/**
 * MatchupsGlossary — terse, always-visible reference at the bottom of the
 * Matchups page. Mirrors the look/feel of RankingsGlossary so the two pages
 * feel like one product. Defines only terms specific to the matchups view
 * (Matchup Score, Best Bets, tiers, sportsbook concepts) — terms shared
 * with the Rankings page point readers there.
 */

interface Term {
  label: string;
  def: string;
}

const MATCHUP_TERMS: Term[] = [
  {
    label: 'Matchup Score',
    def: 'X Score difference between the pick and opponent. Higher = more conviction.',
  },
  {
    label: 'Best Bet',
    def: 'A matchup at or above the venue\'s Best Bet Matchup Score Threshold. These are the bets we officially track.',
  },
  {
    label: 'All Matchups',
    def: 'The full model output (matchup score ≥ 0.95) including picks below the venue threshold. Not tracked — shown for transparency.',
  },
  {
    label: 'Best Bet Matchup Score Threshold',
    def: 'Venue-specific cutoff above which a model pick counts as a tracked Best Bet. Lower at predictable courses, higher at unpredictable ones.',
  },
  {
    label: 'Best Odds',
    def: 'The most favorable American odds on the pick across all 11 real-money sportsbooks.',
  },
];

const TIER_TERMS: Term[] = [
  {
    label: 'BEST BET',
    def: 'Matchup Score ≥ 1.95. Highest-conviction tracked bets.',
  },
  {
    label: 'STRONG PLAY',
    def: 'Matchup Score 1.45 to 1.94.',
  },
  {
    label: 'LEAN',
    def: 'Matchup Score 0.95 to 1.44.',
  },
  {
    label: '★ Stars',
    def: 'Encode the unit size of an individual bet. More edge = more stars = bigger play. ★ 0.95–1.95 | ★★ 1.95–2.95 | ★★★ 2.95–3.95 | ★★★★ 3.95–4.95 | ★★★★★ 4.95+',
  },
];

const PURITY_TERMS: Term[] = [
  {
    label: 'PURE BUY',
    def: 'OTT and APP both support the buy signal (neither below -0.45). High-confidence buy.',
  },
  {
    label: 'PURE FADE',
    def: 'OTT and APP both support the fade signal (neither above +0.45). High-confidence fade.',
  },
  {
    label: 'CONFLICTED',
    def: 'Ball-striking contradicts the signal direction — proceed with caution.',
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

export default function MatchupsGlossary() {
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
        <Section title="Matchup Concepts" terms={MATCHUP_TERMS} />
        <Section title="Tiers & Stars" terms={TIER_TERMS} />
        <Section title="Purity" terms={PURITY_TERMS} />
      </div>
    </div>
  );
}
