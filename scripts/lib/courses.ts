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
 *     OTT               = max(Driving Distance, Driving Accuracy)
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

export const COURSES: Record<string, CourseProfile> = {
  'augusta-national': {
    name: 'Augusta National',
    predictability: 0.1439,
    coefficients: { ott: 0.749, app: 0.652, arg: 0.39, putt: 0.408 },
    source_date: '2026-04-09',
    is_major: true,
  },
  // PGA Championship 2026 venue.
  // Aronimink Golf Club — Newtown Square, PA. Par 70, ~7,267 yards.
  // TODO: Pull actual coefficients + predictability from DataGolf web tool.
  // Aronimink rarely hosts PGA Tour events, so DataGolf data is likely sparse —
  // we expect low predictability and near-equal weights.
  'aronimink': {
    name: 'Aronimink Golf Club',
    // predictability: mean |total_course_history_adjustment| over the
    // 156-player PGA Championship field (data/raw/pga-championship-2026/pre).
    predictability: 0.0413,
    // coefficients: DataGolf Course Fit radar, Relative Importance OFF, pulled
    // 2026-05-15. Radar axes: DrivingDistance 0.780, DrivingAccuracy 0.428,
    // Approach 0.723, AroundGreen 0.413, Putting 0.524.
    // ott = max(0.780, 0.428) = 0.780.
    coefficients: { ott: 0.780, app: 0.723, arg: 0.413, putt: 0.524 },
    source_date: '2026-05-15',
    is_major: true,
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
