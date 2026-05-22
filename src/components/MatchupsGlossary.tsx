/**
 * MatchupsGlossary — bottom-of-page reference.
 *
 * Only contains terms Chris explicitly approved:
 *   - Matchup Score
 *   - Best Bet
 *   - Best Bet Matchup Score Threshold
 *
 * Do NOT add new entries to this file without asking Chris first.
 * Removed (do not re-add without explicit approval): All Matchups,
 * Best Odds, Purity section, absolute BEST BET / STRONG PLAY / LEAN tier
 * definitions, Lean, Stars (could be misread as recommended bets when
 * the venue threshold is the actual recommendation cutoff).
 */

interface Term {
  label: string;
  def: string;
}

const TERMS: Term[] = [
  {
    label: 'Matchup Score',
    def: 'X Score difference between the pick and opponent. Higher = more conviction.',
  },
  {
    label: 'Best Bet',
    def: 'A matchup at or above the venue\'s Best Bet Matchup Score Threshold. These are the bets we officially track.',
  },
  {
    label: 'Best Bet Matchup Score Threshold',
    def: 'Venue-specific cutoff above which a model pick counts as a tracked Best Bet. Lower at predictable courses, higher at unpredictable ones.',
  },
];

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

      <dl className="space-y-3 max-w-3xl">
        {TERMS.map((t) => (
          <div key={t.label} className="text-xs font-['Inter',system-ui,sans-serif] leading-relaxed">
            <dt className="text-[#f5f5f5] font-semibold inline">{t.label}:</dt>{' '}
            <dd className="text-[#a1a1aa] inline">{t.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
