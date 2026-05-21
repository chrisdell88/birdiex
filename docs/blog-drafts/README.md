# BirdieX Blog Drafts

Ready-to-publish blog posts. Each one stands alone, has been spell-checked
and fact-checked against the live BirdieX site + data, and runs ~600–900 words.

When the blog launches, copy these into the CMS / static post directory and
update internal links. They're written assuming a public reader audience —
some golf knowledge, no quant background.

## Drafts in this folder

1. **01-putting-regresses.md** — Putting Regresses. Ball-Striking Sustains.
   The core BirdieX thesis with the 4-panel SG persistence chart as the hook.
   Cites real PGA Champ 2026 R1 → R2 R² values.

2. **02-venue-aware-thresholds.md** — Why We Bet a Different Threshold at
   Augusta vs. Aronimink. Walks through the backtest that drove the
   predictability-aware matchup score threshold formula. Cites the actual
   sweep numbers from `docs/THRESHOLD_SWEEP.md`.

3. **03-sizing-ladder.md** — The Sizing Ladder: Why Edge Determines Stake,
   Not Star Count. Disambiguates stars (bet size) from matchup score threshold
   (recommendation cutoff). References the 10-band sizing table.

## Future post ideas (parked)

- **The 4-Layer X Score** — How L1 (strokes-gained), L2 (course history),
  L3 (course fit), L4 (major championship adjustment) fuse into one number.
- **Course Fit & Heads on a Scatter** — Walkthrough of the Course Fit Scatter
  on the home page; how to read the quadrants.
- **What Makes a Course "Predictable"?** — DataGolf's predictability metric
  explained, with the bar chart of every venue we've tracked.
- **Tracked vs. Scored: How We Keep the Public Record Honest** — The
  internal-vs-public distinction, the cumulative bet log, why we never
  rewrite history when the threshold formula updates.
- **The Edge Distribution** — A close look at the histogram on the
  methodology page. How rare is a 3-star+ bet, really?

## Voice + style notes

- **Sound like a builder, not a marketer.** Real numbers, real verbs, real
  judgments. Push back on conventional wisdom when it's wrong.
- **Cite DataGolf as the foundation.** They publish the underlying data we
  build on. Never frame us as competitive with them — frame us as the
  betting layer on top.
- **No em-dashes.** Use commas, periods, or "..." instead.
- **No yes-manning.** When a chart shows something surprising or
  unflattering (n=2 limit, single-event small samples), say so.
- **Mobile-first paragraphs.** Short paragraphs, mix one-sentence and
  2-3 sentence runs. Read well on a phone.

## Source-of-truth references

When updating a post, cross-reference these to ensure numbers stay accurate:

- `docs/X_SCORE_FORMULA.md` — model math (locked)
- `docs/THRESHOLD_SWEEP.md` — backtest sweep data
- `docs/COURSE_COEFFICIENTS_RESEARCH.md` — L3 derivation
- `src/lib/sizing.ts` — sizing ladder + threshold formula
- `src/config/venues.ts` — per-event predictability
- `src/lib/allTimeStats.ts` — current all-time tracked record
- `MEMORY.md` — overall project state + latest milestones
