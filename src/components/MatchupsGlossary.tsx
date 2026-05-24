/**
 * MatchupsGlossary — bottom-of-page reference.
 *
 * Only contains terms Chris explicitly approved:
 *   - Matchup Score
 *   - Best Bet
 *   - Best Bet Matchup Score Threshold
 *   - Cumulative Data (added 2026-05-24)
 *   - Round-Only Data (added 2026-05-24)
 *   - Conflicted Signal (added 2026-05-24)
 *   - All seven signal tiers (added 2026-05-24)
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
  {
    label: 'Cumulative Data',
    def: 'X Scores computed from a player\'s strokes-gained TOTAL across every round played so far. The whole-tournament view of a player\'s form.',
  },
  {
    label: 'Round-Only Data',
    def: 'X Scores computed from a player\'s strokes-gained in JUST the most-recently completed round. The "what just happened" view — useful when a player heats up or cools off mid-event.',
  },
  {
    label: 'Conflicted Signal',
    def: 'The yellow warning icon next to a signal badge. Means the player\'s ball-striking (OTT or APP) contradicts the signal direction — e.g. a STRONG BUY where the player is gaining a lot off-the-tee but losing strokes on approach. Proceed with caution.',
  },
  {
    label: 'STRONG BUY',
    def: 'X Score ≥ +1.00. Highest-conviction "expect to improve" pick.',
  },
  {
    label: 'BUY',
    def: 'X Score +0.50 to +0.99. Moderate-conviction improvement pick.',
  },
  {
    label: 'SOFT BUY',
    def: 'X Score 0.00 to +0.49. Slight lean toward improvement.',
  },
  {
    label: 'NEUTRAL',
    def: 'X Score between -0.50 and 0.00. No directional opinion.',
  },
  {
    label: 'SOFT FADE',
    def: 'X Score -1.00 to -0.50. Slight lean toward regression.',
  },
  {
    label: 'FADE',
    def: 'X Score -1.50 to -1.00. Moderate-conviction regression pick.',
  },
  {
    label: 'STRONG FADE',
    def: 'X Score ≤ -1.50. Highest-conviction "expect to regress" pick.',
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
