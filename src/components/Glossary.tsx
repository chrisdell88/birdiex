/**
 * Glossary — defines the distinct concepts used on the site so users
 * don't conflate them. In particular: a bet's STAR RATING is not the
 * same thing as the venue MATCHUP SCORE THRESHOLD. The star rating is
 * a property of the bet's edge; the threshold is our cutoff.
 *
 * Includes the canonical BetSizingLadder so the bands are visually
 * unambiguous.
 *
 * Rendered prominently at the top of the Methodology page. Linked from
 * every RecommendedFloorBadge tooltip + the Matchups disclaimer copy.
 */
import BetSizingLadder from './BetSizingLadder';

interface Term {
  term: string;
  short: string;
  detail: string;
}

const terms: Term[] = [
  {
    term: 'X-Score Edge',
    short: 'The model’s rating for a head-to-head pick.',
    detail:
      'The X-Score Edge is the difference between the model’s X-Score for the picked golfer and the opponent in a matchup. The bigger the edge, the more the model favors the pick. Every matchup the model produces has an edge ≥ 0.95 (its hard pick floor).',
  },
  {
    term: 'Star Rating (★ to ★★★★★)',
    short: 'Bet size. Nothing else.',
    detail:
      'The stars on a bet tell you the unit size we sized the bet to win. ★ = 0.5–1u, ★★ = 1.5–2u, ★★★ = 2.5–3u, ★★★★ = 3.5–4u, ★★★★★ = 4.5–5u. The star count is driven by the bet’s edge (bigger edge → bigger size), but it is NOT a "quality tier" or a recommendation cutoff. Two bets with the same star count are the same SIZE, not the same threshold of recommendation.',
  },
  {
    term: 'Best Bet Matchup Score Threshold',
    short: 'A numeric edge cutoff. No stars involved.',
    detail:
      'The threshold is the minimum X-Score Edge we require before treating a matchup as a Best Bet (the recommendations we officially track). It is a number (e.g. 2.45 at Aronimink, 2.95 at TPC Craig Ranch, 0.95 at Augusta). It is venue-specific: a less-predictable course gets a higher threshold. Picks below the threshold are still scored internally for backtesting, but are not Best Bets. Star ratings are unrelated to this — a ★★ bet may or may not clear a given threshold, depending on the venue.',
  },
  {
    term: 'Course Predictability',
    short: 'How much past performance at a course predicts future results.',
    detail:
      'Computed as the mean |total course history adjustment| across a tournament’s field. Augusta National is the highest on Tour at 0.144 — historical performance there is strongly indicative. Most other venues are far lower (e.g. Aronimink at 0.041, TPC Craig Ranch at 0.037). Lower predictability raises the Best Bet Matchup Score Threshold.',
  },
  {
    term: 'Best Bet vs. Scored Bet',
    short: 'Best Bet = part of the public record. Scored = internal-only.',
    detail:
      'Every matchup with edge ≥ 0.95 is scored internally for backtesting. A bet only counts as a BEST BET (and appears in the public record + recommendation set) if it also clears the venue’s Best Bet Matchup Score Threshold. This lets us refine the threshold formula without losing data.',
  },
];

export default function Glossary() {
  return (
    <div
      id="glossary"
      className="bg-[#0a0a0a] border border-[#22c55e]/30 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
          Glossary &mdash; What These Terms Actually Mean
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          Start Here
        </span>
      </div>

      <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mb-5">
        <span className="text-[#22c55e] font-semibold">Stars are a bet&rsquo;s unit size</span>{' '}
        &mdash; how many units we sized the bet to win. The{' '}
        <span className="text-[#22c55e] font-semibold">Best Bet Matchup Score Threshold</span> is
        a numeric edge cutoff &mdash; whether we recommend the bet at all. They&rsquo;re separate
        concepts. A &#9733;&#9733; bet at one venue is the same SIZE as a &#9733;&#9733; bet at
        another, but only some venues recommend it depending on the threshold.
      </p>

      <div className="space-y-4">
        {terms.map((t, i) => (
          <div key={t.term}>
            <div className="border-l-2 border-[#22c55e]/40 pl-4">
              <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                {t.term}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-[#22c55e] font-['Inter',system-ui,sans-serif] mt-0.5">
                {t.short}
              </div>
              <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mt-1.5">
                {t.detail}
              </p>
            </div>

            {/* Drop the sizing ladder under the Star Rating term so the
                edge → star → unit-size mapping is unambiguous and visible. */}
            {i === 1 && (
              <div className="mt-4 ml-4">
                <BetSizingLadder />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
