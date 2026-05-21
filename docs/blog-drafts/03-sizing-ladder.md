# The Sizing Ladder: Why Edge Determines Stake, Not Star Count

**A bet's stars tell you its size. The matchup score threshold tells you whether we recommend it at all. These are not the same thing.**

One of the most common confusions in sports-betting analytics is conflating *how much to bet* with *whether to bet at all*. BirdieX separates them deliberately.

Here's the BirdieX bet sizing ladder, in full:

| X-Score Edge | Star Rating | Unit Size (to win) |
|---:|:---|---:|
| 0.95 – 1.44 | ★ | 0.5u |
| 1.45 – 1.94 | ★ | 1.0u |
| 1.95 – 2.44 | ★★ | 1.5u |
| 2.45 – 2.94 | ★★ | 2.0u |
| 2.95 – 3.44 | ★★★ | 2.5u |
| 3.45 – 3.94 | ★★★ | 3.0u |
| 3.95 – 4.44 | ★★★★ | 3.5u |
| 4.45 – 4.94 | ★★★★ | 4.0u |
| 4.95 – 5.44 | ★★★★★ | 4.5u |
| 5.45+ | ★★★★★ | 5.0u (capped) |

Ten bands. Five stars. Each star covers a **1.00-wide edge range** and contains **two 0.5u sub-bands** for finer-grained sizing.

## Why edge-banded sizing?

Imagine two bets:

- Bet A: X-Score edge = 1.40
- Bet B: X-Score edge = 1.80

Both are nominally ★ bets — the round-to-nearest-unit math puts them both at "1 star" (Math.round(0.5) and Math.round(1.0) both come back as 1). On a flat-stake system, they'd get the same size.

But the model thinks B is **almost twice as confident** as A. That information should show up in our exposure. The ladder solves this: Bet A gets a 0.5u stake (you risk less because the edge is thinner), Bet B gets a 1.0u stake (you risk more because the model is more sure).

This is functionally a **Kelly-inspired sizing scheme** — bigger edge, bigger bet — without the volatility blow-up of full Kelly. It's bounded (max 5u even on enormous edges), it's discrete (each band has a clean rule), and it's auditable (every bet in our public record was sized via this table, no exceptions).

## Why the star rating exists at all

The granular sizing is great for math. It's terrible for skimming a leaderboard. If you see a list of 30 picks with stakes like "1.5u, 0.5u, 2.0u, 1.0u, 1.5u..." your eyes glaze over.

Stars compress that. A glance tells you "this is a ★★ play" or "this is a ★★★★ play." It's an information-dense visual abbreviation.

But — and this is the part where people get tripped up — **the stars don't determine whether the bet is a recommendation**. They just communicate its size.

## Where the matchup score threshold comes in

The **matchup score threshold** is the edge cutoff we require before treating any pick as a tracked recommendation. It's venue-specific (see our [previous post on course-aware thresholds](#)) and may sit **mid-band**.

At Aronimink, the threshold is **edge ≥ 2.45**. That means:

- A bet at edge 2.10 is rated **★★** (2-star, sized at 1.5u). It does NOT clear the threshold. It gets scored internally for backtesting but doesn't appear as a recommendation.
- A bet at edge 2.50 is also rated **★★** (2-star, sized at 2.0u). It DOES clear the threshold. It's a tracked, public recommendation.

Same star rating. Different recommendation status. **Stars ≠ threshold.**

This is why our venue-floor badge reads `Matchup Score ≥ 2.45` and not `★★+ floor`. The first is precise. The second was misleading — it implied "any 2-star bet" when the actual filter was stricter.

## How this shows up in the data

Look at the bet sizing ladder visual on our [Methodology page](#) — every bet we score, ever, fits into one of those 10 bands. We've never sized a bet outside this scheme, and we never will without publishing the change.

Our internal raw log captures every pick with edge ≥ 0.95 — that's the **model floor**, the hard line below which the X Score isn't actionable. The subset of those picks that clear the **venue threshold** become the **tracked** bets — what you see on the public Results page.

Roughly 73% of our scored picks land in the ★ band. About 5% make it to ★★★ or higher. The high-tier bets are rare — that's by design. The model isn't going to find 30 monster edges every week. It's going to find a handful of ★★ and ★★★ plays at the right venues, and a lot of marginal picks that we either size small or skip entirely depending on the course.

## What you take from this

Three rules:

1. **Stars are a bet's size.** A ★★ bet is a 1.5u or 2.0u stake. Nothing else.
2. **The matchup score threshold is the cutoff.** It's a number (0.95 at Augusta, 2.45 at Aronimink, 2.95 at Craig Ranch). It tells you whether the model thinks the pick is worth recommending.
3. **They're not the same.** A ★★ bet at one venue may or may not clear the threshold at another. The size doesn't change; the recommendation status does.

The whole point of separating them is to be honest about what the model knows. A small edge sized small is a small bet. A small edge below the venue's confidence threshold isn't a recommendation at all — and pretending otherwise is how betting models go broke.

---

*This series will continue with the next post on the X Score model — how Layer 1 strokes-gained data fuses with course history (Layer 2), course fit (Layer 3), and major championship adjustments (Layer 4) into a single number.*
