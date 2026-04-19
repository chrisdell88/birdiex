import type { PlayerData, Signal, Purity } from '../types';

// RBC Heritage 2026 - Round 1 raw data from DataGolf
// Course: Harbour Town (short, tight, tree-lined)
// Harbour Town course fit weighting:
//   - SG:APP heavy (small greens, precision irons)
//   - SG:ARG heavy (scrambling critical)
//   - SG:OTT light (distance deprioritized, accuracy rewarded)
//   - SG:PUTT subtracted (putting regression factor)
//   - Accuracy bonus above Tour avg (~57%)
//   - Distance penalty above Harbour Town ideal (~282y)

interface RawRow {
  position: string;
  player_name: string;
  score: number;
  sg_putt: number;
  sg_arg: number;
  sg_app: number;
  sg_ott: number;
  distance: number;
  accuracy: number;
}

const rawData: RawRow[] = [
  { position: '1', player_name: 'Aberg, Ludvig', score: -8, sg_putt: 2.74, sg_arg: 0.34, sg_app: 3.52, sg_ott: 0.12, distance: 297.6, accuracy: 0.5 },
  { position: 'T2', player_name: 'English, Harris', score: -7, sg_putt: 4.78, sg_arg: 0.32, sg_app: 0, sg_ott: 0.62, distance: 289.6, accuracy: 0.57143 },
  { position: 'T2', player_name: 'Hovland, Viktor', score: -7, sg_putt: 3.62, sg_arg: 0.22, sg_app: 1.79, sg_ott: 0.1, distance: 289.7, accuracy: 0.57143 },
  { position: 'T4', player_name: 'Brennan, Michael', score: -6, sg_putt: 0.63, sg_arg: -0.68, sg_app: 3.93, sg_ott: 0.85, distance: 302.4, accuracy: 0.71429 },
  { position: 'T4', player_name: 'Woodland, Gary', score: -6, sg_putt: 1.57, sg_arg: 0.5, sg_app: 1.65, sg_ott: 1, distance: 291.7, accuracy: 0.71429 },
  { position: 'T4', player_name: 'Fox, Ryan', score: -6, sg_putt: 1.31, sg_arg: 3.25, sg_app: -0.9, sg_ott: 1.07, distance: 293.2, accuracy: 0.64286 },
  { position: 'T4', player_name: 'Fowler, Rickie', score: -6, sg_putt: 1.41, sg_arg: 0.29, sg_app: 2.64, sg_ott: 0.38, distance: 278.2, accuracy: 0.78571 },
  { position: 'T4', player_name: 'Novak, Andrew', score: -6, sg_putt: 2.21, sg_arg: -0.42, sg_app: 3.5, sg_ott: -0.57, distance: 286.5, accuracy: 0.5 },
  { position: 'T4', player_name: 'Fitzpatrick, Matt', score: -6, sg_putt: 2.67, sg_arg: 0.19, sg_app: 1.2, sg_ott: 0.66, distance: 290.9, accuracy: 0.71429 },
  { position: 'T10', player_name: 'MacIntyre, Robert', score: -5, sg_putt: 0.02, sg_arg: 0.9, sg_app: 1.71, sg_ott: 1.1, distance: 288.4, accuracy: 0.71429 },
  { position: 'T10', player_name: 'Im, Sungjae', score: -5, sg_putt: 1.36, sg_arg: 1.58, sg_app: -0.25, sg_ott: 1.02, distance: 293.1, accuracy: 0.64286 },
  { position: 'T10', player_name: 'Straka, Sepp', score: -5, sg_putt: 3.51, sg_arg: -1.4, sg_app: 1.18, sg_ott: 0.42, distance: 285.3, accuracy: 0.57143 },
  { position: 'T10', player_name: 'Berger, Daniel', score: -5, sg_putt: 0.13, sg_arg: 0.73, sg_app: 2.76, sg_ott: 0.1, distance: 277.8, accuracy: 0.64286 },
  { position: 'T10', player_name: 'Kim, Si Woo', score: -5, sg_putt: 1.85, sg_arg: 1.52, sg_app: 0.33, sg_ott: 0.02, distance: 274.2, accuracy: 0.64286 },
  { position: 'T15', player_name: 'Highsmith, Joe', score: -4, sg_putt: -0.56, sg_arg: 1.23, sg_app: 2.13, sg_ott: -0.07, distance: 278.7, accuracy: 0.64286 },
  { position: 'T15', player_name: 'Potgieter, Aldrich', score: -4, sg_putt: 1.14, sg_arg: -1.59, sg_app: 2.55, sg_ott: 0.61, distance: 290.1, accuracy: 0.57143 },
  { position: 'T15', player_name: 'Bradley, Keegan', score: -4, sg_putt: 1.78, sg_arg: 1.51, sg_app: -0.07, sg_ott: -0.5, distance: 287.5, accuracy: 0.5 },
  { position: 'T15', player_name: 'Conners, Corey', score: -4, sg_putt: 2.24, sg_arg: -1.45, sg_app: 0.35, sg_ott: 1.58, distance: 289.3, accuracy: 0.78571 },
  { position: 'T15', player_name: 'Morikawa, Collin', score: -4, sg_putt: -0.59, sg_arg: 0.99, sg_app: 1.19, sg_ott: 1.14, distance: 280.4, accuracy: 0.85714 },
  { position: 'T20', player_name: 'Campbell, Brian', score: -3, sg_putt: 1.45, sg_arg: 0.7, sg_app: 0.68, sg_ott: -1.11, distance: 263.3, accuracy: 0.57143 },
  { position: 'T20', player_name: 'Mouw, William', score: -3, sg_putt: -1.55, sg_arg: -0.58, sg_app: 3.91, sg_ott: -0.06, distance: 284.5, accuracy: 0.5 },
  { position: 'T20', player_name: 'Valimaki, Sami', score: -3, sg_putt: 2.56, sg_arg: -2.6, sg_app: 0.7, sg_ott: 1.05, distance: 289.4, accuracy: 0.78571 },
  { position: 'T20', player_name: 'Clark, Wyndham', score: -3, sg_putt: 1.77, sg_arg: -0.04, sg_app: -0.65, sg_ott: 0.63, distance: 288.1, accuracy: 0.64286 },
  { position: 'T20', player_name: 'Cauley, Bud', score: -3, sg_putt: 0.3, sg_arg: 0.19, sg_app: 0.47, sg_ott: 0.76, distance: 279.7, accuracy: 0.78571 },
  { position: 'T20', player_name: 'Henley, Russell', score: -3, sg_putt: 2.09, sg_arg: 0.41, sg_app: -1.27, sg_ott: 0.49, distance: 273.4, accuracy: 0.78571 },
  { position: 'T20', player_name: 'Scheffler, Scottie', score: -3, sg_putt: 1.34, sg_arg: 1.28, sg_app: 0.05, sg_ott: -0.95, distance: 290.3, accuracy: 0.64286 },
  { position: 'T27', player_name: 'Wallace, Matt', score: -2, sg_putt: 1, sg_arg: -0.1, sg_app: 1.79, sg_ott: -1.97, distance: 277.3, accuracy: 0.5 },
  { position: 'T27', player_name: 'Smith, Jordan', score: -2, sg_putt: -0.11, sg_arg: -0.15, sg_app: -0.05, sg_ott: 1.03, distance: 282.6, accuracy: 0.78571 },
  { position: 'T27', player_name: 'Fisk, Steven', score: -2, sg_putt: 0.2, sg_arg: -0.16, sg_app: 1.01, sg_ott: -0.32, distance: 282.8, accuracy: 0.57143 },
  { position: 'T27', player_name: 'Glover, Lucas', score: -2, sg_putt: -1.64, sg_arg: -0.54, sg_app: 3.22, sg_ott: -0.32, distance: 277.8, accuracy: 0.64286 },
  { position: 'T27', player_name: 'Rodgers, Patrick', score: -2, sg_putt: 1.2, sg_arg: -1.53, sg_app: 1.22, sg_ott: -0.17, distance: 293.5, accuracy: 0.42857 },
  { position: 'T27', player_name: 'McCarty, Matt', score: -2, sg_putt: -0.75, sg_arg: -0.59, sg_app: 1.09, sg_ott: 0.97, distance: 281.4, accuracy: 0.78571 },
  { position: 'T27', player_name: 'Taylor, Nick', score: -2, sg_putt: 0.06, sg_arg: -0.18, sg_app: -0.56, sg_ott: 1.4, distance: 280.8, accuracy: 0.85714 },
  { position: 'T27', player_name: 'Griffin, Ben', score: -2, sg_putt: -0.36, sg_arg: 1.19, sg_app: 0, sg_ott: -0.11, distance: 286.5, accuracy: 0.71429 },
  { position: 'T27', player_name: 'Spaun, J.J.', score: -2, sg_putt: -1.31, sg_arg: -0.06, sg_app: 1.81, sg_ott: 0.28, distance: 279.3, accuracy: 0.64286 },
  { position: 'T27', player_name: 'Spieth, Jordan', score: -2, sg_putt: 0.96, sg_arg: 2.2, sg_app: -0.29, sg_ott: -2.16, distance: 297.1, accuracy: 0.42857 },
  { position: 'T27', player_name: 'Theegala, Sahith', score: -2, sg_putt: -0.45, sg_arg: 0.46, sg_app: 1.72, sg_ott: -1.01, distance: 287, accuracy: 0.42857 },
  { position: 'T27', player_name: 'Keefer, Johnny', score: -2, sg_putt: -0.23, sg_arg: 0.31, sg_app: 1.06, sg_ott: -0.42, distance: 294.3, accuracy: 0.57143 },
  { position: 'T27', player_name: 'Coody, Pierceson', score: -2, sg_putt: 1.25, sg_arg: -0.72, sg_app: -1.14, sg_ott: 1.32, distance: 282.3, accuracy: 0.78571 },
  { position: 'T27', player_name: 'Kim, Michael', score: -2, sg_putt: 0.38, sg_arg: -0.45, sg_app: 1.13, sg_ott: -0.33, distance: 287.4, accuracy: 0.57143 },
  { position: 'T27', player_name: 'Kitayama, Kurt', score: -2, sg_putt: -1.59, sg_arg: 0.12, sg_app: 0.53, sg_ott: 1.66, distance: 298.9, accuracy: 0.64286 },
  { position: 'T27', player_name: 'Cantlay, Patrick', score: -2, sg_putt: 0.25, sg_arg: -0.1, sg_app: -0.8, sg_ott: 1.37, distance: 293.5, accuracy: 0.71429 },
  { position: 'T27', player_name: 'Schauffele, Xander', score: -2, sg_putt: -0.02, sg_arg: -0.85, sg_app: 0.72, sg_ott: 0.88, distance: 292.1, accuracy: 0.57143 },
  { position: 'T44', player_name: 'Vilips, Karl', score: -1, sg_putt: 1.57, sg_arg: -1.8, sg_app: 1.26, sg_ott: -1.31, distance: 280.8, accuracy: 0.64286 },
  { position: 'T44', player_name: 'Lee, Min Woo', score: -1, sg_putt: -1.71, sg_arg: 0.18, sg_app: -0.38, sg_ott: 1.63, distance: 287.7, accuracy: 0.78571 },
  { position: 'T44', player_name: 'Thorbjornsen, Michael', score: -1, sg_putt: -1.05, sg_arg: 0.78, sg_app: -0.35, sg_ott: 0.34, distance: 287.7, accuracy: 0.78571 },
  { position: 'T44', player_name: 'Gotterup, Chris', score: -1, sg_putt: 0.59, sg_arg: 0.19, sg_app: -0.94, sg_ott: -0.13, distance: 297, accuracy: 0.42857 },
  { position: 'T44', player_name: 'Stevens, Sam', score: -1, sg_putt: -1.28, sg_arg: 1.99, sg_app: -0.18, sg_ott: -0.81, distance: 283.7, accuracy: 0.35714 },
  { position: 'T44', player_name: 'Hall, Harry', score: -1, sg_putt: 0.1, sg_arg: 0.25, sg_app: -0.87, sg_ott: 0.25, distance: 295.8, accuracy: 0.57143 },
  { position: 'T44', player_name: 'Lowry, Shane', score: -1, sg_putt: -0.64, sg_arg: -1.08, sg_app: 0.72, sg_ott: 0.72, distance: 281.9, accuracy: 0.71429 },
  { position: 'T44', player_name: 'Burns, Sam', score: -1, sg_putt: 2.45, sg_arg: 0.14, sg_app: -1.95, sg_ott: -0.93, distance: 292.5, accuracy: 0.35714 },
  { position: 'T44', player_name: 'Day, Jason', score: -1, sg_putt: -0.98, sg_arg: 0.8, sg_app: -0.35, sg_ott: 0.24, distance: 292.7, accuracy: 0.57143 },
  { position: 'T44', player_name: 'Homa, Max', score: -1, sg_putt: -1.43, sg_arg: 0.39, sg_app: 0.22, sg_ott: 0.54, distance: 286.5, accuracy: 0.57143 },
  { position: 'T54', player_name: 'Blanchet, Chandler', score: 0, sg_putt: -0.52, sg_arg: -0.52, sg_app: 1.14, sg_ott: -1.37, distance: 277.4, accuracy: 0.5 },
  { position: 'T54', player_name: 'Poston, J.T.', score: 0, sg_putt: -1.95, sg_arg: 1.95, sg_app: -2.13, sg_ott: 0.85, distance: 285.7, accuracy: 0.71429 },
  { position: 'T54', player_name: 'Hoge, Tom', score: 0, sg_putt: 0.16, sg_arg: 0.65, sg_app: -1.69, sg_ott: -0.39, distance: 284.3, accuracy: 0.71429 },
  { position: 'T54', player_name: 'Harman, Brian', score: 0, sg_putt: -2.95, sg_arg: 0.32, sg_app: 1.04, sg_ott: 0.31, distance: 288.9, accuracy: 0.64286 },
  { position: 'T54', player_name: 'Young, Cameron', score: 0, sg_putt: -2.67, sg_arg: -0.08, sg_app: 1.24, sg_ott: 0.23, distance: 297.6, accuracy: 0.64286 },
  { position: 'T54', player_name: 'Horschel, Billy', score: 0, sg_putt: -0.08, sg_arg: -0.23, sg_app: -1.45, sg_ott: 0.48, distance: 287.9, accuracy: 0.57143 },
  { position: 'T54', player_name: 'Putnam, Andrew', score: 0, sg_putt: -0.51, sg_arg: 0.17, sg_app: 1.36, sg_ott: -2.3, distance: 261.2, accuracy: 0.5 },
  { position: 'T54', player_name: 'Knapp, Jake', score: 0, sg_putt: -0.18, sg_arg: -1.63, sg_app: 1.04, sg_ott: -0.52, distance: 288.4, accuracy: 0.5 },
  { position: 'T62', player_name: 'Lipsky, David', score: 1, sg_putt: -2.32, sg_arg: -0.27, sg_app: 0.11, sg_ott: 0.21, distance: 280.3, accuracy: 0.5 },
  { position: 'T62', player_name: 'Higgo, Garrick', score: 1, sg_putt: -0.62, sg_arg: -0.36, sg_app: -0.54, sg_ott: -0.76, distance: 274.8, accuracy: 0.71429 },
  { position: 'T62', player_name: 'Castillo, Ricky', score: 1, sg_putt: -0.51, sg_arg: 0.19, sg_app: -3.23, sg_ott: 1.26, distance: 292.3, accuracy: 0.71429 },
  { position: 'T65', player_name: 'Gerard, Ryan', score: 2, sg_putt: -1.51, sg_arg: -0.51, sg_app: -2.37, sg_ott: 1.11, distance: 289.2, accuracy: 0.71429 },
  { position: 'T65', player_name: 'Penge, Marco', score: 2, sg_putt: -0.27, sg_arg: -0.09, sg_app: -2.09, sg_ott: -0.82, distance: 293.3, accuracy: 0.35714 },
  { position: 'T65', player_name: 'Noren, Alex', score: 2, sg_putt: -1.03, sg_arg: -1.69, sg_app: 0.57, sg_ott: -1.13, distance: 281.1, accuracy: 0.5 },
  { position: 'T65', player_name: 'Hojgaard, Nicolai', score: 2, sg_putt: -1.35, sg_arg: 0.12, sg_app: -2.65, sg_ott: 0.59, distance: 286.7, accuracy: 0.64286 },
  { position: 'T65', player_name: 'Bhatia, Akshay', score: 2, sg_putt: -0.82, sg_arg: -0.3, sg_app: -1.24, sg_ott: -0.92, distance: 275.4, accuracy: 0.5 },
  { position: 'T70', player_name: 'Schenk, Adam', score: 3, sg_putt: -1.68, sg_arg: -0.22, sg_app: -3.32, sg_ott: 0.94, distance: 281.1, accuracy: 0.78571 },
  { position: 'T70', player_name: 'McCarthy, Denny', score: 3, sg_putt: -1.18, sg_arg: -0.01, sg_app: -2, sg_ott: -1.09, distance: 270.3, accuracy: 0.42857 },
  { position: 'T70', player_name: 'Pendrith, Taylor', score: 3, sg_putt: 0.55, sg_arg: -1.84, sg_app: -3.33, sg_ott: 0.34, distance: 295.1, accuracy: 0.5 },
  { position: 'T70', player_name: 'Smotherman, Austin', score: 3, sg_putt: -1.22, sg_arg: -1.18, sg_app: -0.36, sg_ott: -1.53, distance: 276.8, accuracy: 0.71429 },
  { position: 'T70', player_name: 'McNealy, Maverick', score: 3, sg_putt: -1.05, sg_arg: -0.02, sg_app: -2.98, sg_ott: -0.22, distance: 290.1, accuracy: 0.5 },
  { position: 'T70', player_name: 'Yellamaraju, Sudarshan', score: 3, sg_putt: 0.12, sg_arg: 0.19, sg_app: -2.15, sg_ott: -2.44, distance: 274.9, accuracy: 0.57143 },
  { position: 'T76', player_name: 'Hisatsune, Ryo', score: 4, sg_putt: -3.42, sg_arg: -1.19, sg_app: -0.42, sg_ott: -0.25, distance: 289.6, accuracy: 0.5 },
  { position: 'T76', player_name: 'Finau, Tony', score: 4, sg_putt: -0.08, sg_arg: 0.97, sg_app: -3.78, sg_ott: -2.39, distance: 259.4, accuracy: 0.42857 },
  { position: 'T76', player_name: 'Bridgeman, Jacob', score: 4, sg_putt: -3.07, sg_arg: 0.05, sg_app: -1.66, sg_ott: -0.6, distance: 287.6, accuracy: 0.28571 },
  { position: 'T76', player_name: 'Echavarria, Nico', score: 4, sg_putt: -0.52, sg_arg: 0.73, sg_app: -4.77, sg_ott: -0.72, distance: 271, accuracy: 0.5 },
  { position: 'T80', player_name: 'Thomas, Justin', score: 5, sg_putt: -2.8, sg_arg: -2.11, sg_app: -1.63, sg_ott: 0.26, distance: 294.3, accuracy: 0.57143 },
  { position: 'T80', player_name: 'Fleetwood, Tommy', score: 5, sg_putt: -1.93, sg_arg: 0.31, sg_app: -2.3, sg_ott: -2.36, distance: 272.7, accuracy: 0.57143 },
  { position: '82', player_name: 'Vegas, Jhonattan', score: 6, sg_putt: -2.82, sg_arg: -1.5, sg_app: -3.12, sg_ott: 0.16, distance: 280.1, accuracy: 0.71429 },
];

// Harbour Town course-fit constants
const TOUR_AVG_ACCURACY = 0.57;  // ~57% fairways on Tour
const HARBOUR_TOWN_IDEAL_DISTANCE = 282;  // yards — precision > length

function round4(n: number): number {
  return parseFloat(n.toFixed(4));
}

function computeHeritagePlayer(raw: RawRow): Omit<PlayerData, 'rank'> {
  const { sg_ott, sg_app, sg_arg, sg_putt, distance, accuracy } = raw;

  // L1: SG Score with putting regression, Harbour Town weights
  // Short/tight: down-weight OTT, up-weight APP/ARG
  const sg_score_l1 = round4(
    0.25 * (0.7 * sg_ott + 1.4 * sg_app + 1.3 * sg_arg - 0.6 * sg_putt)
  );

  // L2: Course history at Harbour Town - not in R1 CSV, 0 for now
  const course_history_l2 = 0;

  // L3: Course Fit for Harbour Town
  // - Reward accuracy above Tour avg
  // - Penalize distance above Harbour Town ideal (long hitters suffer)
  const fit_adjustment = round4(
    (accuracy - TOUR_AVG_ACCURACY) * 0.8 +
      ((HARBOUR_TOWN_IDEAL_DISTANCE - distance) / 100) * 0.25
  );
  // Short-game bonus (ARG positive contributes extra at Harbour Town)
  const sg_category_adj = round4(Math.max(0, sg_arg) * 0.05);
  const fit_plus_category_l3 = round4(fit_adjustment + sg_category_adj);

  // L4: Major adjustment - Heritage is NOT a major
  const major_adj_l4 = 0;

  const x_score = round4(
    sg_score_l1 + course_history_l2 + fit_plus_category_l3 + major_adj_l4
  );

  // Signal tiers (same thresholds as Masters)
  let signal: Signal;
  if (x_score >= 1.5) signal = 'STRONGEST BUY';
  else if (x_score >= 1.0) signal = 'STRONG BUY';
  else if (x_score >= 0.5) signal = 'BUY';
  else if (x_score >= 0.25) signal = 'LEAN BUY';
  else if (x_score > -0.25) signal = 'NEUTRAL';
  else if (x_score > -0.5) signal = 'LEAN SELL';
  else if (x_score > -1.0) signal = 'SELL';
  else if (x_score > -1.5) signal = 'STRONG SELL';
  else signal = 'STRONGEST SELL';

  // Purity: confirm ball-striking agrees with signal direction
  const PURE_THRESHOLD = 0.45;
  let purity: Purity = 'NEUTRAL';
  if (x_score >= 0.25) {
    purity =
      sg_ott >= PURE_THRESHOLD && sg_app >= PURE_THRESHOLD
        ? 'PURE BUY'
        : 'CONFLICTED';
  } else if (x_score <= -0.25) {
    purity =
      sg_ott < PURE_THRESHOLD && sg_app < PURE_THRESHOLD ? 'PURE' : 'CONFLICTED';
  }

  return {
    player_name: raw.player_name,
    position: raw.position,
    score_to_par: raw.score,
    sg_ott,
    sg_app,
    sg_arg,
    sg_putt,
    sg_score_l1,
    course_history_l2,
    fit_adjustment,
    sg_category_adj,
    fit_plus_category_l3,
    major_adj_l4,
    x_score,
    signal,
    purity,
    dg_matched: true,
  };
}

function processData(): PlayerData[] {
  const computed = rawData.map(computeHeritagePlayer);
  computed.sort((a, b) => b.x_score - a.x_score);
  return computed.map((p, i) => ({ ...p, rank: i + 1 }));
}

export const roundOnlyData: PlayerData[] = processData();

// After R1 only, cumulative == round
export const cumulativeData: PlayerData[] = roundOnlyData;
