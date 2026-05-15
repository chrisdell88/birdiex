# BirdieX -- The X Score Formula (Complete Reference)

---

## 1. Overview

The X Score is BirdieX's proprietary golfer rating that combines live round putting regression analysis with DataGolf's structural pre-tournament adjustments. It produces a single number per golfer per round that powers all buy/fade signals and matchup recommendations.

```
X Score = Layer 1 (SG Score) + Layer 2 (Course History) + Layer 3 (Course Fit) + Layer 4 (Major Adjustment)
```

All values are in strokes-gained per round units.

---

## 2. Layer 1 -- SG Score (Live Putting Regression)

**Source:** Live round data from DataGolf API (`preds/live-tournament-stats`)
**Updates:** After each round completes
**What it does:** Measures ball striking and tee-to-green performance vs putting. Players who strike it well but putt poorly score high (likely to improve). Players carried by hot putting score low (likely to regress).

### Step 1a -- Get Course Fit Coefficients

**Source:** DataGolf course fit tool coefficients per venue

Example (Augusta National):

| Category | Coefficient |
|----------|-------------|
| OTT      | 0.749       |
| APP      | 0.652       |
| ARG      | 0.390       |
| PUTT     | 0.408       |

### Step 1b -- Scale by Course Predictability

**Definition (verified 2026-05-14):**

```
predictability = mean( |total_course_history_adjustment| ) over the event field
```

Take every player in the field, take the absolute value of their
`total_course_history_adjustment` (a field returned directly by the DataGolf
API endpoint `/preds/player-decompositions`), and average them.

This was reverse-engineered and verified: computed over the 91-player Masters
field it yields **0.1440**, matching the 0.1439 recorded for Augusta. The
signed mean (+0.108) and standard deviation (0.175) do NOT match — only the
mean of absolute values does.

**This means predictability is fully computable from the pipeline.** It does
NOT require the DataGolf web tool. (Only the course-fit coefficients still
require the web tool — see Step 1a.)

```
Augusta predictability   = 0.1439  (highest on tour, #1 of 64 courses)
Aronimink predictability = 0.0413  (PGA Championship 2026 venue — low)
Normalized = predictability / 0.15  (capped at 1.0; 0.15 ~ maximum possible)
Augusta normalized   = 0.96
Aronimink normalized = 0.28
```

Blended weight formula:

```
w = (normalized_predictability x course_coefficient) + ((1 - normalized_predictability) x 1.0)
```

Augusta example:

```
w_OTT  = (0.96 x 0.749) + (0.04 x 1.0) = 0.759
w_APP  = (0.96 x 0.652) + (0.04 x 1.0) = 0.666
w_ARG  = (0.96 x 0.390) + (0.04 x 1.0) = 0.414
w_PUTT = (0.96 x 0.408) + (0.04 x 1.0) = 0.432
```

### Step 1c -- Calculate SG Score

```
SG Score = (w_OTT x SG_OTT + w_APP x SG_APP + w_ARG x SG_ARG - w_PUTT x SG_PUTT)
           / (w_OTT + w_APP + w_ARG + w_PUTT)
```

**Note:** SG_PUTT is SUBTRACTED (minus sign). This is the putting regression -- the core of our model.

Denominator at Augusta = 0.759 + 0.666 + 0.414 + 0.432 = **2.271**

### Worked Example -- Scottie Scheffler, Masters R1

```
SG_OTT = 2.74, SG_APP = 1.28, SG_ARG = 0.96, SG_PUTT = -0.34

SG Score = (0.759 x 2.74 + 0.666 x 1.28 + 0.414 x 0.96 - 0.432 x (-0.34)) / 2.271
         = (2.080 + 0.852 + 0.397 + 0.147) / 2.271
         = 3.477 / 2.271
         = 1.53
```

---

## 3. Layer 2 -- Course History Adjustment

**Source:** DataGolf API (`preds/player-decompositions` -> `total_course_history_adjustment`)
**Updates:** Pre-tournament (changes per event)
**What it does:** Adjusts for how this specific golfer has historically performed at this specific course, beyond what their skill level would predict.

### Formula

```
total_course_history_adj = course_history_adj + course_experience_adj
```

- `course_history_adj` = actual scoring vs expectation at this course historically
- `course_experience_adj` = bonus for rounds played here (caps at +0.2374 SG/round)

No custom weighting needed -- DataGolf already factors in course predictability when calculating this number. At highly predictable courses like Augusta, history adjustments are naturally larger. At low-predictability courses, they shrink automatically.

### Augusta Examples

| Player    | Adjustment | Notes                                  |
|-----------|------------|----------------------------------------|
| Rose      | +0.621     | Augusta legend, massive history        |
| Spieth    | +0.498     | 2015 champion, consistent outperformer |
| Scheffler | +0.305     | 2x champion                            |
| Rahm      | +0.322     | Strong Augusta history                 |
| Burns     | -0.015     | Minimal Augusta history                |
| Aberg     | +0.102     | Limited history                        |

---

## 4. Layer 3 -- Course Fit + SG Category Reweight

**Source:** DataGolf API (`preds/player-decompositions` -> `total_fit_adjustment` + `strokes_gained_category_adjustment`)
**Updates:** Pre-tournament (changes per event)
**What it does:** Adjusts for whether this player's overall skill PROFILE matches what the course rewards, AND boosts ball-strikers while penalizing putting-dependent players.

### Formula

```
Layer 3 = total_fit_adjustment + strokes_gained_category_adjustment
```

- `total_fit_adjustment` = does their skill profile match course demands (driving distance, accuracy, approach, short game fit). Includes sub-components: `driving_distance_adjustment`, `driving_accuracy_adjustment`, `cf_approach_comp`, `cf_short_comp`, `other_fit_adjustment`
- `strokes_gained_category_adjustment` = DataGolf's version of regression applied to baseline skill. OTT weighted ~1.2x (most predictive), APP ~1.0x, ARG ~0.9x, PUTT ~0.6x (least predictive). Ball-strikers get boosted, putting-dependent players get penalized.

### Augusta Examples

| Player    | Fit Adj | SG Cat Adj | Layer 3 Total | Notes                                                |
|-----------|---------|------------|---------------|------------------------------------------------------|
| McIlroy   | +0.111  | +0.261     | +0.372        | Elite ball-striker, great Augusta fit                 |
| Rahm      | +0.077  | +0.116     | +0.193        |                                                      |
| Scheffler | +0.074  | -0.110     | -0.036        | Slight negative -- putting skill above avg, discounted |
| Lowry     | -0.021  | -0.138     | -0.159        | Shorter driver, less predictive SG profile            |

---

## 5. Layer 4 -- Major Championship Adjustment

**Source:** DataGolf API (`preds/player-decompositions` -> `major_adjustment`)
**Updates:** Pre-tournament
**What it does:** Captures whether this player consistently over/under-performs at major championships specifically. At non-major events, this value is 0.000 for all players.

**Only active at:** The Masters, PGA Championship, U.S. Open, The Open Championship
**At all other events:** Layer 4 = 0.000 for everyone (formula effectively becomes 3 layers)

### Augusta Examples

| Player     | Major Adj |
|------------|-----------|
| Koepka     | +0.176    |
| Schauffele  | +0.144    |
| McIlroy    | +0.129    |
| Reed       | +0.103    |
| Scheffler  | +0.086    |
| Burns      | +0.036    |

---

## 6. The Complete X Score Formula

```
X Score = SG Score + total_course_history_adj + (total_fit_adj + sg_category_adj) + major_adj
        = Layer 1  + Layer 2                  + Layer 3                           + Layer 4
```

All components are in strokes-gained per round. They simply add together.

### Worked Example -- Scheffler, Masters R1

```
Layer 1 (SG Score):           +1.530  (live round putting regression, course-weighted)
Layer 2 (Course History):     +0.305  (strong Augusta track record)
Layer 3 (Fit + SG Category):  -0.036  (slight negative from SG category reweight)
Layer 4 (Major Adj):          +0.086  (good major performer)
-----------------------------------------------
X SCORE:                      +1.885
```

### Worked Example -- Burns, Masters R1

```
Layer 1 (SG Score):           +1.360
Layer 2 (Course History):     -0.015  (no Augusta history)
Layer 3 (Fit + SG Category):  -0.045
Layer 4 (Major Adj):          +0.036
-----------------------------------------------
X SCORE:                      +1.336
```

### Worked Example -- Regular Event (Rocket Mortgage, Detroit GC)

```
Layer 1: Course fit weights change to Detroit's coefficients.
         Predictability = 0.037 (low) -> weights stay close to equal
         (mostly raw putting regression)
Layer 2: Course history adjustments are smaller (low predictability course)
Layer 3: Same mechanic, different fit values for Detroit
Layer 4: major_adj = 0.000 for everyone
```

---

## 7. Buy/Fade Signal Thresholds

Applied to the final X Score:

| X Score Range   | Signal          |
|-----------------|-----------------|
| >= 1.50         | STRONGEST BUY   |
| >= 1.00         | STRONG BUY      |
| >= 0.50         | BUY             |
| > -0.50         | HOLD            |
| >= -1.00        | FADE            |
| >= -1.50        | STRONG FADE     |
| < -1.50         | STRONGEST FADE  |

---

## 8. Matchup Score

For head-to-head and 3-ball matchup bets:

```
Matchup Edge = Player A X Score - Player B X Score
```

| Matchup Edge | Signal                         |
|--------------|--------------------------------|
| >= 1.95      | BEST BET (historically strongest) |
| >= 1.45      | STRONG PLAY                    |
| 0.95 - 1.44  | LEAN                           |
| < 0.95       | NO PLAY                        |

---

## 9. What's Proprietary vs Public Data

| Component                                                    | Source                              | Proprietary?             |
|--------------------------------------------------------------|-------------------------------------|--------------------------|
| SG Score formula (Layer 1) with course-weighted putting regression | Our formula applied to live data     | YES -- our edge          |
| Course fit weights inside Layer 1                            | DataGolf course fit coefficients    | Public API data          |
| Predictability scaling inside Layer 1                        | DataGolf course history tool        | Public API data          |
| Layers 2-4 adjustments                                       | DataGolf player decompositions API  | Public API data          |
| The combination as the X Score                               | Our unique blend                    | YES -- unique combination |
| Buy/Fade/Matchup thresholds                                  | Our historical tracking             | YES -- calibrated by us  |

---

## 10. Data Sources & API Endpoints

All data from DataGolf (`feeds.datagolf.com`):

| Data                    | Endpoint                                                                                             |
|-------------------------|------------------------------------------------------------------------------------------------------|
| Live round SG data      | `GET /preds/live-tournament-stats?stats=sg_putt,sg_arg,sg_app,sg_ott,sg_bs,sg_t2g&round={1,2,3,4}` |
| Player decompositions   | `GET /preds/player-decompositions?tour=pga`                                                         |
| Course fit coefficients | DataGolf course fit tool (per venue)                                                                 |
| Course predictability   | DataGolf course history tool (per venue)                                                             |
| Matchup odds            | `GET /betting-tools/matchups?tour=pga&market={round_matchups,tournament_matchups,3_balls}`           |
| Outright odds           | `GET /betting-tools/outrights?tour=pga&market={win,top_5,top_10,top_20}`                            |
| Field/tee times         | `GET /field-updates?tour=pga`                                                                        |

**Rate limit:** 45 requests per minute
**API key required** for all endpoints

---

## 11. Course Predictability Rankings (Top 20)

| Rank | Course                | Predictability |
|------|-----------------------|----------------|
| 1    | Augusta National      | 0.1439         |
| 2    | Riviera CC            | 0.0997         |
| 3    | Bay Hill              | 0.0873         |
| 4    | TPC San Antonio       | 0.0869         |
| 5    | TPC Scottsdale        | 0.0767         |
| 6    | TPC Summerlin         | 0.0750         |
| 7    | Quail Hollow          | 0.0742         |
| 8    | Waialae CC            | 0.0737         |
| 9    | East Lake GC          | 0.0711         |
| 10   | Trump National Doral  | 0.0674         |
| 11   | Muirfield Village     | 0.0649         |
| 12   | Silverado Resort      | 0.0633         |
| 13   | Sedgefield CC         | 0.0574         |
| 14   | TPC River Highlands   | 0.0574         |
| 15   | Harbour Town          | 0.0544         |
| 16   | Torrey Pines (South)  | 0.0530         |
| 17   | Kapalua (Plantation)  | 0.0529         |
| 18   | Colonial CC           | 0.0525         |
| 19   | Sea Island (Seaside)  | 0.0505         |
| 20   | TPC Southwind         | 0.0488         |

---

*BirdieX -- X Score Formula Reference Document*
