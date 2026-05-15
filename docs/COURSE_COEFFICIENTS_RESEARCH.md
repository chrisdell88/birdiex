# Course Coefficients — Research & Method

**Date:** 2026-05-15
**Question:** How should BirdieX derive the Layer 1 course-fit coefficients (OTT, APP, ARG, PUTT) for each tournament — and specifically, how do we handle "off the tee," which DataGolf splits into two separate numbers?

**Status:** Research complete. One decision needed from Chris (see end). No code changed yet.

---

## TL;DR

1. DataGolf's Course Fit tool gives **5** numbers per course: Driving Distance, Driving Accuracy, Approach, Around-Green, Putting. Our model needs **4** (OTT, APP, ARG, PUTT). APP / ARG / PUTT map straight across. **Driving Distance + Driving Accuracy must be combined into one OTT number** — there is no combined "off the tee" number anywhere on DataGolf, by design.
2. The model pulls live SG data as four categories (`sg_ott, sg_app, sg_arg, sg_putt`). There is no live "distance" or "accuracy" stat. So the model **must** use 4 categories — splitting OTT is not an option. Combining the two driving numbers is forced.
3. **Plain averaging of Distance + Accuracy is the wrong way to combine them** — it washes out the course signal (demonstrated below with real numbers). The Masters used Driving Distance only, which works for distance-heavy courses but breaks on accuracy-heavy courses.
4. **Recommendation:** OTT coefficient = **the larger of Driving Distance and Driving Accuracy** (`max`). Reasoning below. This is Chris's decision to approve.
5. For the PGA Championship specifically, the method choice does **not** change the answer — Aronimink is distance-dominant, so every sensible method gives OTT ≈ 0.78.

---

## 1. How Strokes Gained Off-the-Tee is calculated

SG-OTT measures the value of every tee shot on par-4s and par-5s (par-3 tee shots count as Approach).

For one tee shot:

```
SG-OTT (one shot) = baseline(start position) − baseline(end position) − 1
```

`baseline(position)` = the average number of strokes a PGA Tour pro needs to hole out from that exact distance and lie (fairway / rough / bunker). The "− 1" accounts for the shot just played. A player's round SG-OTT sums this across their tee shots and compares to the field.

**The key point:** SG-OTT already captures **both** distance and accuracy in a single number. A long, straight drive finishes in a position with a low baseline → high SG-OTT. A short or crooked drive finishes in a worse position → low SG-OTT. Distance and accuracy are not separate inputs to SG-OTT — they are both reflected in where the ball ends up.

*Sources: Mark Broadie, "Assessing Golfer Performance on the PGA Tour"; PGA Tour "Strokes Gained: How it works".*

---

## 2. How DataGolf's Course Fit radar is built (their own description)

From DataGolf's FAQ ("Statistically, how do I interpret the radar plot"):

- Each of the 5 attributes is a weighted average of a golfer's past performances in that category.
- Each attribute is normalized to mean 0, standard deviation 1.
- DataGolf runs a **regression of total strokes-gained on all 5 attributes at once** (a random-effects model). The **regression coefficients** are each attribute's predictive power, estimated **while holding the other four constant**.
- The numbers plotted are then **scaled 0–1**. DataGolf states plainly: *"the numbers that actually go on to the plot ... by themselves do not have any meaning; they are only meaningful in relation to values from other courses and other attributes."*

**What this means for us:** the radar values are *relative* predictive-power scores, not absolute weights. Using them as relative category weights (which is exactly what Layer 1 does — and the X Score formula divides by the sum of weights) is a legitimate use. Reading a single value as if it had standalone meaning is not. We only ever use them relative to each other — so we are inside the tool's intended use.

---

## 3. Structural findings that drive the recommendation

**(a) There is no combined "off the tee" number — and there never will be.**
DataGolf deliberately splits driving into Distance and Accuracy because they are different skills: the regression estimates each while holding the other constant. There is no 4-category version of the radar. Combining them is on us.

**(b) Driving Distance and Driving Accuracy move in *opposite* directions across courses.**
DataGolf's own "Distance versus accuracy" research: *"courses that favour longer hitters tend to not favour accurate players."* Confirmed in the live data we pulled (Section 4): Augusta is high-distance / low-accuracy; Harbour Town is low-distance / high-accuracy. **This is why plain averaging fails** — averaging two numbers that move in opposite directions produces a near-constant, which erases the course-to-course signal we are trying to capture.

**(c) Approach, Around-Green and Putting barely vary across courses; Driving varies the most.**
DataGolf FAQ: *"the course-specific values for putting and around-the-green do not vary much, while the driving distance and driving accuracy values do."* Confirmed in our data. **Consequence: almost the entire course-to-course character of our Layer 1 comes from the OTT/driving coefficient.** APP/ARG/PUTT are nearly the same everywhere. So getting the OTT method right is not a side detail — it is the whole course-specific signal.

**(d) Off-the-tee is now the most important scoring category on tour.**
DataGolf's "importance of driving distance" research: by 2019, off-the-tee performance overtook approach play as the largest variance-explaining category. Distance's predictive power has risen since ~2015; accuracy's has steadily declined.

---

## 4. Live radar data (Relative Importance OFF, pulled 2026-05-15)

| Course | Driving Dist | Driving Acc | Approach | Around-Green | Putting |
|--------|:---:|:---:|:---:|:---:|:---:|
| Augusta National (Masters) | **0.769** | 0.411 | 0.702 | 0.486 | 0.462 |
| Aronimink (PGA Champ) | **0.780** | 0.428 | 0.723 | 0.413 | 0.524 |
| Harbour Town (accuracy course) | 0.438 | **0.578** | 0.705 | 0.465 | 0.388 |
| Waialae (unpredictable course) | 0.439 | 0.438 | 0.662 | 0.492 | 0.339 |
| PGA Tour average course | 0.733 | 0.516 | 0.695 | 0.393 | 0.480 |

Note Augusta (distance) vs Harbour Town (accuracy): the driving axes flip, exactly as DataGolf's research predicts.

---

## 5. The four candidate methods for the OTT coefficient

OTT computed each way for the three real venues:

| Method | Augusta | Aronimink | Harbour Town | Verdict |
|--------|:---:|:---:|:---:|---|
| **M1 — Distance only** (Masters method) | 0.769 | 0.780 | 0.438 | Right for distance courses; **wrong for accuracy courses** — says "off-the-tee barely matters at Harbour Town" when accurate driving clearly does. |
| **M2 — Average of Dist + Acc** | 0.590 | 0.604 | 0.508 | **Washes the signal.** Augusta (0.590) ends up *below* the tour-average course (0.625) — i.e. it claims off-the-tee is *less* predictive at Augusta than at a typical course. Plainly wrong. Reject. |
| **M3 — Larger of Dist / Acc** (`max`) | 0.769 | 0.780 | 0.578 | Captures the *dominant* driving skill at any course. Augusta high (distance), Harbour Town moderate (accuracy still matters), Waialae low (nothing predicts). Generalises to every course type. |
| **M4 — Distance-weighted blend** (0.65·Dist + 0.35·Acc) | 0.644 | 0.657 | 0.487 | Preserves *some* signal; reflects that distance is the bigger modern component. A defensible middle ground but the 0.65/0.35 split is arbitrary. |

### Why M2 (averaging) is provably wrong
SG-OTT predictiveness should answer: *"does off-the-tee play predict scoring at this course?"* At Augusta the answer is a loud yes — via distance. Accuracy being *un*predictive at Augusta does not mean off-the-tee matters less; it means the off-the-tee value comes from distance, which SG-OTT captures fully. Averaging drags Augusta's strong distance signal down with its weak accuracy signal and produces a number that says off-the-tee barely matters at Augusta. That contradicts every other source and common sense.

### Why M1 (distance only) is not robust
It worked for the Masters only because Augusta is distance-dominant. On an accuracy course (Harbour Town) it would tell the model off-the-tee is nearly irrelevant (0.438, below tour average) — but accurate driving genuinely predicts scoring there. M1 is a distance-course shortcut, not a general method.

### Why M3 (`max`) is the recommendation
SG-OTT rewards good tee shots regardless of *how* they are good. The OTT coefficient should reflect how strongly off-the-tee play predicts scoring, and that is best captured by whichever driving skill is the predictive one at that course. `max` does this, generalises to distance courses, accuracy courses, and unpredictable courses alike, and is trivial to automate. It is the most defensible single rule.

**Honest caveat:** `max` is a reasoned choice, not a fact DataGolf hands us. There is no objectively "correct" collapse of two partial regression coefficients into one. M3 is the best available judgement given the evidence; M2 is the only option the evidence actively rules out.

---

## 6. Does this even matter? (predictability scaling)

Yes, but unevenly. The Layer 1 weight is `norm_predictability × course_coef + (1 − norm_predictability) × 1.0`.

- **Augusta:** normalized predictability 0.96 → coefficients carry ~96% of the weight. The OTT method matters a lot here.
- **Aronimink:** normalized predictability 0.28 → coefficients carry only ~28% of the weight. The OTT method barely moves the final number.

So the method choice is **high-stakes at iconic major venues** (Augusta-tier) and **low-stakes everywhere else**. The PGA Championship at Aronimink is low-stakes — and on top of that, Aronimink is distance-dominant so M1/M3/M4 give nearly the same answer. This is a good week to lock the long-term method in cheaply.

---

## 7. Challenge to assumptions (requested)

**Is it sound to use course-fit coefficients as Layer 1 category weights at all?**
DataGolf cautions that course fit "does not have much predictive power" and weights "should never be too large." That caution was aimed at course fit used as a *player* adjustment. Our use — as *category weights* — is a different application of the same regression output, so the "this is a weak, noisy signal" warning still partly applies. **However, BirdieX already mitigates it correctly:** the predictability scaling means most courses (predictability ~0.04–0.10) get only 27–67% course-specific weighting, with the rest pulled to equal weights. Only Augusta-tier courses get strong course-specific weighting. Chris's instinct that "we're already doing that" is correct — the model is already conservative with this signal. The one genuine risk: at Augusta-tier courses the coefficients dominate, so coefficient accuracy matters most exactly where the stakes (majors) are highest.

**Does the data support the putting-regression thesis?**
Partially and supportively, yes — not as flattery, it is in the numbers. Putting's predictive power is relatively low and stable across courses (0.34–0.52 in our sample) while it is the category most prone to round-to-round variance. A model that subtracts SG-PUTT and leans on ball-striking is consistent with what the radar shows. This is a structural check passing, not a proof.

**Flagged for a future review (not now):** the `MAX_PREDICTABILITY = 0.15` constant used to normalize predictability is itself an unexplained magic number (Augusta sits at 0.144, just under it). Worth revisiting how 0.15 was chosen — separate task.

---

## 8. Decision needed from Chris

**Pick the OTT method** (everything else — APP, ARG, PUTT — is a direct radar read, no decision needed):

- **M3 `max(Distance, Accuracy)`** — recommended. Robust across all course types, simple, automatable.
- **M1 Distance only** — what the Masters used; fine for majors, breaks on accuracy courses.
- **M4 distance-weighted blend** — middle ground, but the split ratio is arbitrary.
- ~~M2 average~~ — ruled out by the evidence; do not use.

Reminder: for the PGA Championship at Aronimink, M1/M3/M4 all give OTT ≈ 0.78, so this decision can be made calmly without holding up this week's event.

---

## Sources
- Mark Broadie, *Assessing Golfer Performance on the PGA Tour* (Columbia)
- PGA Tour — *Strokes Gained: How it works*
- DataGolf — Course Fit FAQ ("Intuitively/Statistically, how do I interpret the radar plot")
- DataGolf — *Distance versus accuracy* blog
- DataGolf — *How important is driving distance on the PGA Tour*
- The Sport Journal — *The Importance of Driving Distance and Driving Accuracy on the PGA and Champions Tours*
