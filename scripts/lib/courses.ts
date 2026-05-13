/**
 * Course-specific data for the X Score model.
 *
 * Per `BirdieX_X_Score_Formula.md`:
 *   predictability comes from DataGolf "course history tool" (avg history adj per venue)
 *   coefficients come from DataGolf "course fit tool" per venue
 *
 * These values are NOT exposed via the public DataGolf API — they must be
 * pulled manually from DataGolf's web tools and recorded here.
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
    predictability: 0.04, // placeholder — verify against DataGolf course history tool
    coefficients: { ott: 1.0, app: 1.0, arg: 1.0, putt: 1.0 }, // placeholder — verify against course fit tool
    source_date: '2026-05-13-placeholder',
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
