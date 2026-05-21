# Why We Bet a Different Threshold at Augusta vs. Aronimink

**Not all golf courses are bettable in the same way. Here's the math.**

After the 2026 PGA Championship at Aronimink Golf Club, BirdieX's tracked record at that event was 52-53-12, **−9.51 units, −8.5% ROI**.

The Masters at Augusta National two months earlier: 130-70-21, **+74.80 units, +26.2% ROI**.

Same model. Same edge floor (0.95). Same sizing ladder. Two events. Wildly different outcomes.

When that happened, we had two choices: blame variance and move on, or figure out what's actually different between those venues. We dug in.

## The thing that changes: course predictability

Some PGA Tour venues are *predictable*. The same kinds of players do well there year after year — Augusta National being the canonical example. Other venues are *random* — players who finished T5 last year miss the cut this year, the leaderboard turns over with no clear pattern.

DataGolf measures this with a metric called **course predictability**: the mean absolute course-history adjustment across the field. A high value means the model can lean heavily on past performance to forecast future results. A low value means past performance is mostly noise.

The numbers, computed from DataGolf's player decompositions data:

| Course | Predictability |
|---|---:|
| Augusta National | **0.144** |
| Aronimink Golf Club | **0.041** |
| TPC Craig Ranch | **0.037** |

Augusta is on the high end of the PGA Tour. Aronimink and Craig Ranch are near the bottom. Roughly 3.5× different signal-to-noise.

## What this does to a betting model

When course history is strong signal (Augusta), our X Score is heavily informed by who has played well there before. The Layer 2 contribution is big, the model is confident, and most picks at the 0.95 edge floor are real opportunities.

When course history is noise (Aronimink, Craig Ranch), Layer 2 contributes basically nothing — the model is forced back onto general skill data, which is the same data the betting market already prices. **The edge collapses at the lower tiers.** A 0.95 edge at Aronimink isn't the same as a 0.95 edge at Augusta; it's a much weaker signal.

We backtested this directly. Holding the sizing ladder constant, we walked the edge floor from 0.95 up to 5.00 in 0.05 increments and recomputed PGA Championship's record at each cutoff:

| Floor | Bets | Record | Units | ROI |
|---:|---:|:---|---:|---:|
| 0.95 (model floor) | 117 | 52-53-12 | −9.51u | −8.5% |
| 1.95 | 18 | 8-10-0 | −4.55u | −11.5% |
| **2.45** | **5** | **5-0-0** | **+10.50u** | **+70.4%** |

At Aronimink, the model only became profitable at edge ≥ 2.45 — a substantially higher cutoff than Augusta needed (Augusta is profitable at every floor from 0.95 upward).

## The formula

Two data points define a line:

- Augusta (predictability 0.144) → break-even at floor 0.95
- Aronimink (predictability 0.041) → break-even at floor 2.45

Solving:

```
recommended_floor = clamp(3.05 − 14.62 × predictability, 0.95, 2.95)
```

Then snap up to the next clean tier boundary in {0.95, 1.45, 1.95, 2.45, 2.95}. That gives us a venue-specific **matchup score threshold** — the edge a pick has to clear before we'll publicly recommend it.

At Augusta: ≥ 0.95. At Aronimink: ≥ 2.45. At TPC Craig Ranch: ≥ 2.95 (the formula moves a full tier higher than Aronimink because Craig Ranch is even less predictable).

## "But that's n=2"

Yes. With only two completed events, the line is a fit, not a validated model. Every new tournament we add gives us another data point. The formula is a **prior** — it'll get refined event by event.

What we *don't* do: change the underlying graded bet data when we re-fit the formula. Every model pick with edge ≥ 0.95 is scored internally for backtest purposes; only picks ≥ the venue threshold are surfaced as tracked recommendations. The raw log preserves everything. The threshold formula is the only thing that evolves.

## What this means for users

When you look at a BirdieX bet recommendation, the threshold badge tells you the *minimum edge required* at that venue. At Augusta in April, you saw badges like `Matchup Score ≥ 0.95 · Augusta National`. At Aronimink in May: `Matchup Score ≥ 2.45 · Aronimink Golf Club`. At Craig Ranch this weekend: `Matchup Score ≥ 2.95 · TPC Craig Ranch`.

That changing number isn't arbitrary. It's the formula above, applied to the venue's predictability. And it's the difference between losing money pretending all courses are Augusta — and being selective at the venues where the model has the least to work with.

---

*Next in this series: the sizing ladder. How a bet's edge determines its unit size, and why one of those things is NOT the same as its star rating.*
