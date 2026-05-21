/**
 * Glossary — defines the distinct concepts used on the site so users
 * don't conflate them. In particular: a bet's STAR RATING is not the
 * same thing as the venue MATCHUP SCORE THRESHOLD. The star rating is
 * a property of the bet's edge; the threshold is our cutoff.
 *
 * Rendered prominently at the top of the Methodology page. Linked from
 * every RecommendedFloorBadge tooltip + the Matchups disclaimer copy.
 */

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
    short: 'A property of an individual bet, based on its edge.',
    detail:
      'A bet’s star rating reflects how big its edge is, in fixed bands. ★ = edge 0.95–1.94, ★★ = edge 1.95–2.94, ★★★ = edge 2.95–3.94, etc. The star rating ALSO determines the size of the bet (★ → 0.5–1u, ★★ → 1.5–2u, ★★★ → 2.5–3u, etc.). It is a property of the bet itself — it does not change based on the venue.',
  },
  {
    term: 'Matchup Score Threshold',
    short: 'Our venue-specific cutoff for what counts as a "recommended" bet.',
    detail:
      'The threshold is the minimum X-Score Edge we require before treating a matchup as a tracked/recommended bet. It IS venue-specific: a less-predictable course gets a higher threshold. The threshold may sit MID-tier (e.g. 2.45 sits inside the ★★ band) — meaning some ★★ bets pass the threshold and others don’t. Lower picks are still scored internally for backtesting.',
  },
  {
    term: 'Course Predictability',
    short: 'How much past performance at a course predicts future results.',
    detail:
      'Computed as the mean |total course history adjustment| across a tournament’s field. Augusta National is the highest on Tour at 0.144 — historical performance there is strongly indicative. Most other venues are far lower (e.g. Aronimink at 0.041, TPC Craig Ranch at 0.037). Lower predictability raises the matchup score threshold.',
  },
  {
    term: 'Tracked Bet vs. Scored Bet',
    short: 'Tracked = part of the public record. Scored = internal-only.',
    detail:
      'Every matchup with edge ≥ 0.95 is scored internally for backtesting. A bet only counts as TRACKED (and appears in the public record + recommendation set) if it also clears the venue’s matchup score threshold. This lets us refine the threshold formula without losing data.',
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
        A bet&rsquo;s <span className="text-[#22c55e] font-semibold">star rating</span> and our
        venue <span className="text-[#22c55e] font-semibold">matchup score threshold</span> are
        two different things. The star rating is a property of an individual bet (based on its
        edge). The threshold is the cutoff we use to decide which matchups become tracked
        recommendations. These can diverge &mdash; some &#9733;&#9733; bets clear the threshold,
        others don&rsquo;t.
      </p>

      <div className="space-y-4">
        {terms.map((t) => (
          <div
            key={t.term}
            className="border-l-2 border-[#22c55e]/40 pl-4"
          >
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
        ))}
      </div>
    </div>
  );
}
