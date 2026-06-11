/**
 * Course-specific data for the X Score model.
 *
 * predictability:
 *   = mean of |total_course_history_adjustment| across the event field.
 *   Verified: reproduces Augusta's 0.1439 (computed 0.1440 over the 91-player
 *   Masters field). The `total_course_history_adjustment` field comes straight
 *   from the DataGolf API (`/preds/player-decompositions`) — so predictability
 *   is fully computable from the pipeline, no manual web scraping needed.
 *
 * coefficients:
 *   come from DataGolf's "course fit tool" radar plot per venue (Relative
 *   Importance toggle OFF). The radar gives 5 axes; the model needs 4:
 *     APP / ARG / PUTT  = direct reads of the Approach / Around-Green / Putting axes
 *     OTT               = the higher of Driving Distance and Driving Accuracy
 *   These are NOT in the public API — pulled from the DataGolf web tool.
 *   Full reasoning: docs/COURSE_COEFFICIENTS_RESEARCH.md.
 *
 * When a venue is missing, the pipeline falls back to `DEFAULT_LOW_PREDICTABILITY_COURSE`,
 * which yields nearly-equal weights (~raw putting regression).
 */

export interface CourseProfile {
  /** Display name */
  name: string;
  /** Course predictability (avg course history adj per venue). 0–~0.15. */
  predictability: number;
  /** Raw course fit coefficients per SG category */
  coefficients: {
    ott: number;
    app: number;
    arg: number;
    putt: number;
  };
  /** When this profile was last updated (manual pull from DataGolf web tools) */
  source_date: string;
  /** Whether this is a major championship venue (drives Layer 4) */
  is_major: boolean;
}

/**
 * Used when we have no specific profile for the venue. Predictability is set
 * to a low non-zero value so weights stay close to 1.0 (equal weights).
 * Result: model behaves like nearly-raw putting regression.
 */
export const DEFAULT_LOW_PREDICTABILITY_COURSE: CourseProfile = {
  name: 'Unknown Course (default)',
  predictability: 0.04,
  coefficients: { ott: 1.0, app: 1.0, arg: 1.0, putt: 1.0 },
  source_date: 'n/a',
  is_major: false,
};

/** Maximum predictability used to normalize (0–1 scale). Per formula doc. */
export const MAX_PREDICTABILITY = 0.15;

// All predictability values below come from DataGolf's Course History Tool
// ("Where is course history most predictive?" chart), pulled 2026-05-25.
// Exact bar heights are stored in src/data/dataGolfPredictability.ts.
// Scaling: predictability = dgBarPct × 0.001580 (anchored so Augusta = 0.1439).
export const COURSES: Record<string, CourseProfile> = {
  'augusta-national': {
    name: 'Augusta National',
    // DataGolf bar pct: 91.11 → 0.1439 (anchor — matches existing).
    predictability: 0.1439,
    coefficients: { ott: 0.749, app: 0.652, arg: 0.39, putt: 0.408 },
    source_date: '2026-05-25',
    is_major: true,
  },
  // PGA Championship 2026 venue.
  // Aronimink Golf Club — Newtown Square, PA. Par 70, ~7,267 yards.
  'aronimink': {
    name: 'Aronimink Golf Club',
    // DataGolf bar pct: 9.08 → 0.0143. Aronimink is one of the LOW-predictability
    // PGA Tour venues (rare host, sparse history). This shifts the venue floor
    // from 2.45 (old proxy value) to 2.95 — tighter Best Bet threshold.
    predictability: 0.0143,
    // coefficients: DataGolf Course Fit radar, Relative Importance OFF, pulled
    // 2026-05-15. Radar axes: DrivingDistance 0.780, DrivingAccuracy 0.428,
    // Approach 0.723, AroundGreen 0.413, Putting 0.524.
    // ott = higher of DrivingDistance (0.780) and DrivingAccuracy (0.428) = 0.780.
    coefficients: { ott: 0.780, app: 0.723, arg: 0.413, putt: 0.524 },
    source_date: '2026-05-25',
    is_major: true,
  },
  // CJ Cup Byron Nelson — TPC Craig Ranch, McKinney TX. Par 71, ~7,569 yards.
  'tpc-craig-ranch': {
    name: 'TPC Craig Ranch',
    // DataGolf bar pct: 22.14 → 0.0350. Floor stays at 2.45 — slight adjustment
    // from the old proxy 0.0373 but same recommended tier.
    predictability: 0.0350,
    // coefficients: DataGolf Course Fit Tool, Relative Importance OFF, 2026-05-21.
    // Radar: DD 0.80, DA 0.50, APP 0.70, ARG 0.40, PUTT 0.50.
    // ott = max(DD, DA) = 0.80.
    coefficients: { ott: 0.80, app: 0.70, arg: 0.40, putt: 0.50 },
    source_date: '2026-05-25',
    is_major: false,
  },
  // Charles Schwab Challenge — Colonial Country Club, Fort Worth TX. Par 70,
  // ~7,209 yards. "Hogan's Alley" — historic shotmaker's course.
  'colonial-country-club': {
    name: 'Colonial Country Club',
    // DataGolf bar pct: 31.84 → 0.0503. Floor: 2.45 (★★+). Colonial is a
    // moderate-predictability venue — long-tenured PGA stop where some players
    // genuinely "own" the course.
    predictability: 0.0503,
    // coefficients: DataGolf Course Fit Tool, 2026-05-25. ott=0.60 (= max(DD, DA),
    // DD higher), APP=0.70, ARG=0.40, PUTT=0.50.
    coefficients: { ott: 0.60, app: 0.70, arg: 0.40, putt: 0.50 },
    source_date: '2026-05-25',
    is_major: false,
  },
  // The Memorial Tournament — Muirfield Village Golf Club, Dublin OH. Par 72,
  // ~7,569 yards. Jack Nicklaus's home tournament. Tree-lined course that
  // rewards iron play + driving accuracy. Long-tenured PGA stop with strong
  // historical signal.
  'muirfield-village': {
    name: 'Muirfield Village Golf Club',
    // DataGolf bar pct: 39.32 → 0.0621 (anchored against Augusta=0.1439=91.11%).
    // Floor: 1.95 (★★+). Moderately predictive — Memorial has long history.
    predictability: 0.0621,
    // coefficients: DataGolf Course Fit Tool radar, re-verified 2026-06-05.
    // Read directly from SVG against the "1.0" gridline circle (radius 166.32px).
    // Relative Importance OFF. Radar axes:
    //   DD 111.95/166.32 = 0.673
    //   DA 111.88/166.32 = 0.673
    //   APP 125.58/166.32 = 0.755
    //   ARG  79.98/166.32 = 0.481
    //   PUTT 78.49/166.32 = 0.472
    // ott = max(DD, DA) = 0.67 (both axes are 0.673).
    // Previous value was 0.68 — arithmetic error in original extraction.
    coefficients: { ott: 0.67, app: 0.76, arg: 0.48, putt: 0.47 },
    source_date: '2026-06-05',
    is_major: false,
  },
  // RBC Canadian Open — Hamilton G&CC, Ancaster ON. Par 70, ~6,996 yards.
  // Traditional parkland course, narrow tree-lined fairways. Distance not the
  // primary edge — premium on driving + iron play accuracy.
  'hamilton-gcc': {
    name: 'Hamilton Golf & Country Club',
    // DataGolf bar pct: 8.97 → 0.0142. Floor: 2.95 (★★★+) — one of the
    // lowest-predictability PGA Tour venues (rarely hosts, sparse history).
    // NOTE: staged for RBC Canadian Open 2026 but WRONG — the 2026 venue is
    // TPC Toronto at Osprey Valley (below). Kept for future Hamilton years.
    predictability: 0.0142,
    // coefficients: DataGolf Course Fit Tool radar, 2026-06-05 (extracted via
    // Chrome MCP). Relative Importance OFF.
    // Radar: DD 0.69, DA 0.49, APP 0.71, ARG 0.43, PUTT 0.47.
    // ott = max(DD, DA) = 0.69.
    coefficients: { ott: 0.69, app: 0.71, arg: 0.43, putt: 0.47 },
    source_date: '2026-06-05',
    is_major: false,
  },
  // RBC Canadian Open 2026 — ACTUAL venue per DataGolf field-updates
  // (event_id 32, course_name "TPC Toronto at Osprey Valley (North Course)").
  'tpc-toronto-osprey-north': {
    name: 'TPC Toronto at Osprey Valley (North Course)',
    // DataGolf bar pct: 6.06 → 0.0096. Floor: 2.95 (★★★+) — bottom of the
    // predictability table (first-time/rare host, no course history).
    predictability: 0.0096,
    // coefficients: PLACEHOLDER 0.50 across. At predictability 0.0096 the
    // blend normalizer is 0.0096/0.15 = 0.064, so Layer-1 weights are
    // w = 0.064·coeff + 0.936 — between coeff 0.3 and 0.8 the weight moves
    // less than ±3.5%, i.e. the radar values are numerically irrelevant at
    // this venue. Replace with real Course Fit radar reads when available
    // (needs the DataGolf web tool), but X-Scores are insensitive to it here.
    coefficients: { ott: 0.5, app: 0.5, arg: 0.5, putt: 0.5 },
    source_date: '2026-06-11',
    is_major: false,
  },
};

/**
 * Per the formula doc:
 *   normalized_predictability = predictability / MAX_PREDICTABILITY  (clamped to [0,1])
 *   w = (normalized_predictability × course_coef) + ((1 - normalized_predictability) × 1.0)
 *
 * At Augusta (highly predictable): w ≈ course-specific.
 * At Aronimink (low predictability): w ≈ 1.0 across the board.
 */
export function computeBlendedWeights(profile: CourseProfile) {
  const norm = Math.min(1, Math.max(0, profile.predictability / MAX_PREDICTABILITY));
  const w = {
    ott: norm * profile.coefficients.ott + (1 - norm) * 1.0,
    app: norm * profile.coefficients.app + (1 - norm) * 1.0,
    arg: norm * profile.coefficients.arg + (1 - norm) * 1.0,
    putt: norm * profile.coefficients.putt + (1 - norm) * 1.0,
  };
  return {
    weights: w,
    denominator: w.ott + w.app + w.arg + w.putt,
    normalized_predictability: norm,
  };
}
