import type { BetRecord, TierBreakdown, BucketBreakdown } from '../types';

// ===== OVERALL SUMMARY (All Rounds Combined: R2 + R3 + R4) =====
export const overallRecord = { wins: 130, losses: 70, pushes: 21 };
export const overallUnits = 46.60;
export const overallROI = 17.8;

// ===== R2 SUMMARY =====
export const r2Summary = {
  record: '36-23-4',
  wins: 36, losses: 23, pushes: 4,
  units: 5.15, roi: 6.5,
};

// ===== R3 ROUND-ONLY SUMMARY =====
export const r3RoundOnlySummary = {
  record: '21-14-3',
  wins: 21, losses: 14, pushes: 3,
  units: 4.37, roi: 10.6,
};

// ===== R3 CUMULATIVE SUMMARY =====
export const r3CumulativeSummary = {
  record: '20-14-6',
  wins: 20, losses: 14, pushes: 6,
  units: 2.96, roi: 7.4,
};

// ===== R4 ROUND-ONLY SUMMARY =====
export const r4RoundOnlySummary = {
  record: '13-10-3',
  wins: 13, losses: 10, pushes: 3,
  units: 3.21, roi: 9.7,
};

// ===== R4 CUMULATIVE SUMMARY =====
export const r4CumulativeSummary = {
  record: '40-9-5',
  wins: 40, losses: 9, pushes: 5,
  units: 30.91, roi: 45.6,
};

// Tier breakdowns -- R2
export const r2TierBreakdowns: TierBreakdown[] = [{"tier":"BEST BET","wins":9,"losses":5,"pushes":1,"units":1.42,"roi":6.72},{"tier":"STRONG PLAY","wins":14,"losses":5,"pushes":2,"units":7.25,"roi":28.75},{"tier":"LEAN","wins":13,"losses":13,"pushes":1,"units":-3.52,"roi":-10.49}];

// Tier breakdowns -- R3 round-only
export const r3ROTierBreakdowns: TierBreakdown[] = [{"tier":"BEST BET","wins":4,"losses":2,"pushes":0,"units":1.72,"roi":25.44},{"tier":"STRONG PLAY","wins":4,"losses":2,"pushes":2,"units":1.64,"roi":22.34},{"tier":"LEAN","wins":13,"losses":10,"pushes":1,"units":1.01,"roi":3.69}];

// Tier breakdowns -- R3 cumulative
export const r3CumTierBreakdowns: TierBreakdown[] = [{"tier":"BEST BET","wins":5,"losses":5,"pushes":3,"units":-1.28,"roi":-10.41},{"tier":"STRONG PLAY","wins":7,"losses":3,"pushes":1,"units":3.71,"roi":34.04},{"tier":"LEAN","wins":8,"losses":6,"pushes":2,"units":0.53,"roi":3.12}];

// Tier breakdowns -- R4 round-only
export const r4ROTierBreakdowns: TierBreakdown[] = [{"tier":"BEST BET","wins":2,"losses":2,"pushes":1,"units":-0.10,"roi":-1.75},{"tier":"STRONG PLAY","wins":4,"losses":4,"pushes":2,"units":0.12,"roi":0.93},{"tier":"LEAN","wins":7,"losses":4,"pushes":0,"units":3.19,"roi":22.49}];

// Tier breakdowns -- R4 cumulative
export const r4CumTierBreakdowns: TierBreakdown[] = [{"tier":"BEST BET","wins":25,"losses":5,"pushes":3,"units":20.05,"roi":46.93},{"tier":"STRONG PLAY","wins":6,"losses":1,"pushes":1,"units":5.20,"roi":56.35},{"tier":"LEAN","wins":9,"losses":3,"pushes":1,"units":5.67,"roi":35.81}];

// Tier breakdowns -- Tournament total (all bets combined)
export const totalTierBreakdowns: TierBreakdown[] = [{"tier":"BEST BET","wins":45,"losses":19,"pushes":8,"units":21.80,"roi":24.57},{"tier":"STRONG PLAY","wins":35,"losses":15,"pushes":8,"units":17.92,"roi":27.25},{"tier":"LEAN","wins":50,"losses":36,"pushes":5,"units":6.88,"roi":6.38}];

// Combined tier breakdowns (for backward compat)
export const tierBreakdowns: TierBreakdown[] = totalTierBreakdowns;

// Bucket breakdowns -- R2
export const r2BucketBreakdowns: BucketBreakdown[] = [{"bucket":"BUY vs FADE","wins":8,"losses":9,"pushes":1,"units":-5.24,"roi":-22.7},{"bucket":"FADE vs OTHER","wins":10,"losses":3,"pushes":1,"units":6.52,"roi":37.34},{"bucket":"BUY vs OTHER","wins":18,"losses":11,"pushes":2,"units":3.87,"roi":9.84}];

// Bucket breakdowns -- R3 round-only
export const r3ROBucketBreakdowns: BucketBreakdown[] = [{"bucket":"BUY vs FADE","wins":6,"losses":1,"pushes":0,"units":4.95,"roi":59.78},{"bucket":"BUY vs OTHER","wins":13,"losses":12,"pushes":3,"units":-1.38,"roi":-4.75},{"bucket":"FADE vs OTHER","wins":2,"losses":1,"pushes":0,"units":0.8,"roi":19.51}];

// Bucket breakdowns -- R3 cumulative
export const r3CumBucketBreakdowns: BucketBreakdown[] = [{"bucket":"BUY vs FADE","wins":6,"losses":2,"pushes":0,"units":3.95,"roi":43.08},{"bucket":"BUY vs OTHER","wins":11,"losses":8,"pushes":6,"units":0.82,"roi":3.69},{"bucket":"FADE vs OTHER","wins":3,"losses":4,"pushes":0,"units":-1.81,"roi":-20.62}];

// Bucket breakdowns -- R4 round-only
export const r4ROBucketBreakdowns: BucketBreakdown[] = [{"bucket":"BUY vs FADE","wins":3,"losses":3,"pushes":1,"units":-0.11,"roi":-1.38},{"bucket":"BUY vs OTHER","wins":8,"losses":4,"pushes":1,"units":3.66,"roi":20.70},{"bucket":"FADE vs OTHER","wins":2,"losses":3,"pushes":1,"units":-0.34,"roi":-4.59}];

// Bucket breakdowns -- R4 cumulative
export const r4CumBucketBreakdowns: BucketBreakdown[] = [{"bucket":"BUY vs FADE","wins":12,"losses":1,"pushes":1,"units":11.05,"roi":61.89},{"bucket":"BUY vs OTHER","wins":24,"losses":8,"pushes":3,"units":15.86,"roi":35.68},{"bucket":"FADE vs OTHER","wins":4,"losses":0,"pushes":1,"units":4.00,"roi":73.46}];

// Bucket breakdowns -- Tournament total
export const totalBucketBreakdowns: BucketBreakdown[] = [{"bucket":"BUY vs FADE","wins":35,"losses":16,"pushes":3,"units":14.60,"roi":22.02},{"bucket":"BUY vs OTHER","wins":74,"losses":43,"pushes":15,"units":22.84,"roi":14.95},{"bucket":"FADE vs OTHER","wins":21,"losses":11,"pushes":3,"units":9.17,"roi":21.19}];

// Combined bucket breakdowns (for backward compat)
export const bucketBreakdowns: BucketBreakdown[] = totalBucketBreakdowns;

// Data set comparison
export const dataSetComparison = {
  roundOnly: { wins: 70, losses: 47, pushes: 10, units: 12.73, roi: 8.24 },
  cumulative: { wins: 60, losses: 23, pushes: 11, units: 33.87, roi: 31.38 },
};

// Per-book breakdowns -- R2
export const r2BookBreakdowns = {
  "betcris": { "record": "10-9-2", "units": -3.33, "roi": "-12.4%" },
  "draftkings": { "record": "3-1-1", "units": 2.02, "roi": "46.76%" },
  "betonline": { "record": "9-6-0", "units": 1.04, "roi": "5.09%" },
  "unibet": { "record": "17-13-2", "units": -1.66, "roi": "-3.88%" },
  "pinnacle": { "record": "3-3-1", "units": -0.12, "roi": "-1.59%" },
  "bet365": { "record": "1-2-0", "units": -1.25, "roi": "-39.06%" },
  "bovada": { "record": "1-2-0", "units": -1.25, "roi": "-39.06%" },
  "betmgm": { "record": "3-1-0", "units": 2.05, "roi": "46.38%" },
};

// Per-book breakdowns -- R3 round-only
export const r3ROBookBreakdowns = {
  "bet365": { "record": "13-8-1", "units": 3.59, "roi": "14.46%" },
  "pointsbet": { "record": "6-4-0", "units": 1.31, "roi": "9.86%" },
  "betonline": { "record": "5-4-1", "units": 0.28, "roi": "2.67%" },
  "draftkings": { "record": "3-1-0", "units": 1.9, "roi": "41.21%" },
  "betcris": { "record": "2-3-1", "units": -2.26, "roi": "-32.52%" },
  "bovada": { "record": "1-0-0", "units": 1, "roi": "135.14%" },
};

// Per-book breakdowns -- R4 round-only
export const r4ROBookBreakdowns = {
  "bet365": { "record": "9-8-1", "units": 1.15, "roi": "4.76%" },
  "bovada": { "record": "4-4-0", "units": -0.48, "roi": "-4.94%" },
  "fanduel": { "record": "3-0-1", "units": 3.00, "roi": "55.97%" },
  "betonline": { "record": "3-1-0", "units": 2.05, "roi": "45.38%" },
  "pointsbet": { "record": "3-4-0", "units": -0.33, "roi": "-3.39%" },
  "betcris": { "record": "2-1-1", "units": 0.85, "roi": "16.57%" },
};

// Per-book breakdowns -- R4 cumulative
export const r4CumBookBreakdowns = {
  "bet365": { "record": "25-6-1", "units": 18.92, "roi": "45.6%" },
  "bovada": { "record": "10-3-1", "units": 6.65, "roi": "37.46%" },
  "betcris": { "record": "8-1-2", "units": 6.85, "roi": "47.19%" },
  "betonline": { "record": "12-1-1", "units": 11.05, "roi": "67.65%" },
  "fanduel": { "record": "6-1-2", "units": 4.89, "roi": "44.22%" },
  "pointsbet": { "record": "13-3-0", "units": 10.23, "roi": "48.45%" },
};

// Per-book breakdowns -- Tournament total
export const totalBookBreakdowns = {
  "bet365": { "record": "58-31-5", "units": 23.97, "roi": "21.16%" },
  "betonline": { "record": "32-16-4", "units": 12.63, "roi": "20.9%" },
  "betcris": { "record": "27-16-7", "units": 4.16, "roi": "6.64%" },
  "pointsbet": { "record": "30-14-0", "units": 15.60, "roi": "27.17%" },
  "bovada": { "record": "16-9-1", "units": 5.92, "roi": "18.8%" },
  "fanduel": { "record": "9-1-3", "units": 7.89, "roi": "48.06%" },
  "draftkings": { "record": "10-4-2", "units": 5.64, "roi": "35.6%" },
  "unibet": { "record": "17-13-2", "units": -1.66, "roi": "-3.88%" },
  "pinnacle": { "record": "3-3-1", "units": -0.12, "roi": "-1.59%" },
  "betmgm": { "record": "3-1-0", "units": 2.05, "roi": "46.38%" },
};

// ===== FULL BET LOG =====
export const betLog: BetRecord[] = [
{ id: 1, round: 2, pick: 'Fang, Ethan', opponent: 'Riley, Davis', edge: 3.06, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-140', book: 'Betcris', betType: 'H2H', pickScore: 6, oppScore: 8, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 2, round: 2, pick: 'Lowry, Shane', opponent: 'Bhatia, Akshay', edge: 2.96, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-110', book: 'DraftKings', betType: 'H2H', pickScore: -3, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 3, round: 2, pick: 'Kitayama, Kurt', opponent: 'Hojgaard, Rasmus', edge: 2.85, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-145', book: 'BetOnline', betType: 'H2H', pickScore: 7, oppScore: -2, result: 'L', units: -1.45, dataSet: 'round-only' },
  { id: 4, round: 2, pick: 'Clark, Wyndham', opponent: 'Kim, Michael', edge: 2.74, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-137', book: 'Betcris', betType: 'H2H', pickScore: -4, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 5, round: 2, pick: 'McCarty, Matt', opponent: 'Hojgaard, Rasmus', edge: 2.55, tier: 'BEST BET', bucket: 'FADE vs OTHER', bestOdds: '-114', book: 'Unibet', betType: 'H2H', pickScore: 1, oppScore: -2, result: 'L', units: -1.14, dataSet: 'round-only' },
  { id: 6, round: 2, pick: 'Bradley, Keegan', opponent: 'Gerard, Ryan', edge: 2.35, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-114', book: 'Unibet', betType: 'H2H', pickScore: 2, oppScore: 0, result: 'L', units: -1.14, dataSet: 'round-only' },
  { id: 7, round: 2, pick: 'Scheffler, Scottie', opponent: 'MacIntyre, Robert', edge: 2.25, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-240', book: 'Unibet', betType: 'H2H', pickScore: 2, oppScore: -1, result: 'L', units: -2.4, dataSet: 'round-only' },
  { id: 8, round: 2, pick: 'Brennan, Michael', opponent: 'Conners, Corey', edge: 2.21, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '+104', book: 'Unibet', betType: 'H2H', pickScore: -1, oppScore: 1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 9, round: 2, pick: 'Fitzpatrick, Matt', opponent: 'Bhatia, Akshay', edge: 2.16, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-148', book: 'Pinnacle', betType: 'H2H', pickScore: -3, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 10, round: 2, pick: 'Bridgeman, Jacob', opponent: 'Conners, Corey', edge: 2.1, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-145', book: 'BetOnline', betType: 'H2H', pickScore: 2, oppScore: 1, result: 'L', units: -1.45, dataSet: 'round-only' },
  { id: 11, round: 2, pick: 'McIlroy, Rory', opponent: 'DeChambeau, Bryson', edge: 2.07, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-138', book: 'BetOnline', betType: 'H2H', pickScore: -7, oppScore: 2, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 12, round: 2, pick: 'Scheffler, Scottie', opponent: 'Woodland, Gary', edge: 2.01, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-335', book: 'Unibet', betType: 'H2H', pickScore: 2, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 13, round: 2, pick: 'Fleetwood, Tommy', opponent: 'Bhatia, Akshay', edge: 2, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-167', book: 'Unibet', betType: 'H2H', pickScore: -4, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 14, round: 2, pick: 'Hovland, Viktor', opponent: 'Noren, Alex', edge: 1.98, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-143', book: 'Unibet', betType: 'H2H', pickScore: -1, oppScore: -1, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 15, round: 2, pick: 'Johnson, Zach', opponent: 'Kim, Michael', edge: 1.96, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '+120', book: 'Unibet', betType: 'H2H', pickScore: 3, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 16, round: 2, pick: 'Taylor, Nick', opponent: 'Gerard, Ryan', edge: 1.88, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-103', book: 'Unibet', betType: 'H2H', pickScore: 0, oppScore: 0, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 17, round: 2, pick: 'Hatton, Tyrrell', opponent: 'Griffin, Ben', edge: 1.82, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-118', book: 'DraftKings', betType: 'H2H', pickScore: -6, oppScore: -3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 18, round: 2, pick: 'Johnson, Zach', opponent: 'Willett, Danny', edge: 1.78, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-170', book: 'Betcris', betType: 'H2H', pickScore: 3, oppScore: 1, result: 'L', units: -1.7, dataSet: 'round-only' },
  { id: 19, round: 2, pick: 'Spaun, J.J.', opponent: 'Conners, Corey', edge: 1.78, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-135', book: 'Pinnacle', betType: 'H2H', pickScore: 3, oppScore: 1, result: 'L', units: -1.35, dataSet: 'round-only' },
  { id: 20, round: 2, pick: 'Schauffele, Xander', opponent: 'DeChambeau, Bryson', edge: 1.76, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-132', book: 'Unibet', betType: 'H2H', pickScore: 0, oppScore: 2, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 21, round: 2, pick: 'Neergaard-Petersen, Rasmus', opponent: 'Potgieter, Aldrich', edge: 1.76, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '-152', book: 'Unibet', betType: 'H2H', pickScore: 2, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 22, round: 2, pick: 'Aberg, Ludvig', opponent: 'MacIntyre, Robert', edge: 1.75, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-132', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 23, round: 2, pick: 'Singh, Vijay', opponent: 'Kataoka, Naoyuki', edge: 1.75, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '-106', book: 'Betcris', betType: 'H2H', pickScore: 3, oppScore: 3, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 24, round: 2, pick: 'Stevens, Sam', opponent: 'Kim, Michael', edge: 1.74, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: 2, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 25, round: 2, pick: 'Hojgaard, Nicolai', opponent: 'Kim, Michael', edge: 1.72, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '-162', book: 'Unibet', betType: 'H2H', pickScore: 2, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 26, round: 2, pick: 'Lowry, Shane', opponent: 'Henley, Russell', edge: 1.65, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 27, round: 2, pick: 'Thomas, Justin', opponent: 'Conners, Corey', edge: 1.65, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-120', book: 'bet365', betType: 'H2H', pickScore: 2, oppScore: 1, result: 'L', units: -1.2, dataSet: 'round-only' },
  { id: 28, round: 2, pick: 'Burns, Sam', opponent: 'Knapp, Jake', edge: 1.61, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-107', book: 'Unibet', betType: 'H2H', pickScore: -1, oppScore: -3, result: 'L', units: -1.07, dataSet: 'round-only' },
  { id: 29, round: 2, pick: 'Burns, Sam', opponent: 'Smith, Cameron', edge: 1.6, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-143', book: 'Unibet', betType: 'H2H', pickScore: -1, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 30, round: 2, pick: 'Homa, Max', opponent: 'Ortiz, Carlos', edge: 1.59, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '-125', book: 'Unibet', betType: 'H2H', pickScore: -2, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 31, round: 2, pick: 'Homa, Max', opponent: 'Potgieter, Aldrich', edge: 1.57, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '-180', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 32, round: 2, pick: 'Kitayama, Kurt', opponent: 'Reitan, Kristoffer', edge: 1.57, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-143', book: 'Unibet', betType: 'H2H', pickScore: 7, oppScore: -4, result: 'L', units: -1.43, dataSet: 'round-only' },
  { id: 33, round: 2, pick: 'Hatton, Tyrrell', opponent: 'McNealy, Maverick', edge: 1.55, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-103', book: 'Unibet', betType: 'H2H', pickScore: -6, oppScore: -2, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 34, round: 2, pick: 'McIlroy, Rory', opponent: 'Matsuyama, Hideki', edge: 1.53, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-138', book: 'Betcris', betType: 'H2H', pickScore: -7, oppScore: -2, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 35, round: 2, pick: 'Day, Jason', opponent: 'Bhatia, Akshay', edge: 1.49, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '-118', book: 'BetMGM', betType: 'H2H', pickScore: -1, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 36, round: 2, pick: 'Lowry, Shane', opponent: 'Day, Jason', edge: 1.46, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-114', book: 'Pinnacle', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 37, round: 2, pick: 'Hovland, Viktor', opponent: 'Cantlay, Patrick', edge: 1.45, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-114', book: 'Unibet', betType: 'H2H', pickScore: -1, oppScore: -5, result: 'L', units: -1.14, dataSet: 'round-only' },
  { id: 38, round: 2, pick: 'Reed, Patrick', opponent: 'Bhatia, Akshay', edge: 1.44, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-125', book: 'Unibet', betType: 'H2H', pickScore: -3, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 39, round: 2, pick: 'Rose, Justin', opponent: 'Lee, Min Woo', edge: 1.44, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-129', book: 'BetOnline', betType: 'H2H', pickScore: -3, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 40, round: 2, pick: 'Li, Haotong', opponent: 'Ortiz, Carlos', edge: 1.41, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-153', book: 'BetOnline', betType: 'H2H', pickScore: -3, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 41, round: 2, pick: 'Bridgeman, Jacob', opponent: 'Lee, Min Woo', edge: 1.4, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-103', book: 'Betcris', betType: 'H2H', pickScore: 2, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 42, round: 2, pick: 'Fitzpatrick, Matt', opponent: 'DeChambeau, Bryson', edge: 1.4, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-120', book: 'Unibet', betType: 'H2H', pickScore: -3, oppScore: 2, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 43, round: 2, pick: 'Kitayama, Kurt', opponent: 'Jarvis, Casey', edge: 1.36, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-152', book: 'Unibet', betType: 'H2H', pickScore: 7, oppScore: 3, result: 'L', units: -1.52, dataSet: 'round-only' },
  { id: 44, round: 2, pick: 'Rose, Justin', opponent: 'Woodland, Gary', edge: 1.36, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-182', book: 'Pinnacle', betType: 'H2H', pickScore: -3, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 45, round: 2, pick: 'Bradley, Keegan', opponent: 'Knapp, Jake', edge: 1.35, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+114', book: 'Pinnacle', betType: 'H2H', pickScore: 2, oppScore: -3, result: 'L', units: -0.88, dataSet: 'round-only' },
  { id: 46, round: 2, pick: 'Bradley, Keegan', opponent: 'Smith, Cameron', edge: 1.34, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-111', book: 'BetMGM', betType: 'H2H', pickScore: 2, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 47, round: 2, pick: 'Watson, Bubba', opponent: 'Echavarria, Nico', edge: 1.31, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-103', book: 'Unibet', betType: 'H2H', pickScore: 1, oppScore: 6, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 48, round: 2, pick: 'Henley, Russell', opponent: 'Bhatia, Akshay', edge: 1.3, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: -1, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 49, round: 2, pick: 'Lowry, Shane', opponent: 'Johnson, Dustin', edge: 1.29, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-186', book: 'Unibet', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 50, round: 2, pick: 'Hall, Harry', opponent: 'Conners, Corey', edge: 1.28, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-113', book: 'Betcris', betType: 'H2H', pickScore: 0, oppScore: 1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 51, round: 2, pick: 'McCarty, Matt', opponent: 'Reitan, Kristoffer', edge: 1.27, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: -4, result: 'L', units: -1.35, dataSet: 'round-only' },
  { id: 52, round: 2, pick: 'Hovland, Viktor', opponent: 'Henley, Russell', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-108', book: 'DraftKings', betType: 'H2H', pickScore: -1, oppScore: -1, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 53, round: 2, pick: 'McKibbin, Tom', opponent: 'Campbell, Brian', edge: 1.26, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-200', book: 'Unibet', betType: 'H2H', pickScore: 4, oppScore: 1, result: 'L', units: -2, dataSet: 'round-only' },
  { id: 54, round: 2, pick: 'McIlroy, Rory', opponent: 'Young, Cameron', edge: 1.25, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-136', book: 'Unibet', betType: 'H2H', pickScore: -7, oppScore: -5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 55, round: 2, pick: 'Fleetwood, Tommy', opponent: 'DeChambeau, Bryson', edge: 1.24, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-106', book: 'DraftKings', betType: 'H2H', pickScore: -4, oppScore: 2, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 56, round: 2, pick: 'Kim, Si Woo', opponent: 'English, Harris', edge: 1.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-142', book: 'Betcris', betType: 'H2H', pickScore: 1, oppScore: -1, result: 'L', units: -1.42, dataSet: 'round-only' },
  { id: 57, round: 2, pick: 'Straka, Sepp', opponent: 'Griffin, Ben', edge: 1.18, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-119', book: 'Betcris', betType: 'H2H', pickScore: 0, oppScore: -3, result: 'L', units: -1.19, dataSet: 'round-only' },
  { id: 58, round: 2, pick: 'Thomas, Justin', opponent: 'Griffin, Ben', edge: 1.15, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-132', book: 'Unibet', betType: 'H2H', pickScore: 2, oppScore: -3, result: 'L', units: -1.32, dataSet: 'round-only' },
  { id: 59, round: 2, pick: 'Hovland, Viktor', opponent: 'Reed, Patrick', edge: 1.13, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'BetMGM', betType: 'H2H', pickScore: -1, oppScore: -3, result: 'L', units: -0.95, dataSet: 'round-only' },
  { id: 60, round: 2, pick: 'Kim, Si Woo', opponent: 'Penge, Marco', edge: 1.03, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-167', book: 'Unibet', betType: 'H2H', pickScore: 1, oppScore: -3, result: 'L', units: -1.67, dataSet: 'round-only' },
  { id: 61, round: 2, pick: 'Smith, Cameron', opponent: 'Gerard, Ryan', edge: 1.01, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '+101', book: 'Betcris', betType: 'H2H', pickScore: 5, oppScore: 0, result: 'L', units: -0.99, dataSet: 'round-only' },
  { id: 62, round: 2, pick: 'Spaun, J.J.', opponent: 'McNealy, Maverick', edge: 1.01, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-120', book: 'Unibet', betType: 'H2H', pickScore: 3, oppScore: -2, result: 'L', units: -1.2, dataSet: 'round-only' },
  { id: 63, round: 2, pick: 'Hovland, Viktor', opponent: 'Young, Cameron', edge: 0.99, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+112', book: 'Pinnacle', betType: 'H2H', pickScore: -1, oppScore: -5, result: 'L', units: -0.89, dataSet: 'round-only' },
  { id: 64, round: 3, pick: 'Cantlay, Patrick', opponent: 'Im, Sungjae', edge: 2.92, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-110', book: 'bet365', betType: 'H2H', pickScore: -6, oppScore: -3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 65, round: 3, pick: 'Hojgaard, Rasmus', opponent: 'Kitayama, Kurt', edge: 2.33, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '+102', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 66, round: 3, pick: 'Rose, Justin', opponent: 'Lowry, Shane', edge: 2.1, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-128', book: 'BetOnline', betType: 'H2H', pickScore: -3, oppScore: -4, result: 'L', units: -1.28, dataSet: 'round-only' },
  { id: 67, round: 3, pick: 'Clark, Wyndham', opponent: 'Griffin, Ben', edge: 2.04, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'bet365', betType: 'H2H', pickScore: 0, oppScore: -2, result: 'L', units: -1, dataSet: 'round-only' },
  { id: 68, round: 3, pick: 'Young, Cameron', opponent: 'Fleetwood, Tommy', edge: 1.98, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'DraftKings', betType: 'H2H', pickScore: -7, oppScore: 1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 69, round: 3, pick: 'Young, Cameron', opponent: 'Day, Jason', edge: 1.98, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'PointsBet', betType: 'H2H', pickScore: -7, oppScore: -4, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 70, round: 3, pick: 'Cantlay, Patrick', opponent: 'Hovland, Viktor', edge: 1.93, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'bet365', betType: 'H2H', pickScore: -6, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 71, round: 3, pick: 'Cantlay, Patrick', opponent: 'Knapp, Jake', edge: 1.9, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'BetOnline', betType: 'H2H', pickScore: -6, oppScore: -3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 72, round: 3, pick: 'Spieth, Jordan', opponent: 'Bridgeman, Jacob', edge: 1.63, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-131', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: -3, result: 'L', units: -1.31, dataSet: 'round-only' },
  { id: 73, round: 3, pick: 'McIlroy, Rory', opponent: 'Fleetwood, Tommy', edge: 1.61, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: 1, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 74, round: 3, pick: 'Hatton, Tyrrell', opponent: 'Day, Jason', edge: 1.57, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'BetOnline', betType: 'H2H', pickScore: 0, oppScore: -4, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 75, round: 3, pick: 'Henley, Russell', opponent: 'Johnson, Dustin', edge: 1.56, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-143', book: 'bet365', betType: 'H2H', pickScore: -6, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 76, round: 3, pick: 'Cantlay, Patrick', opponent: 'Henley, Russell', edge: 1.54, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-104', book: 'Betcris', betType: 'H2H', pickScore: -6, oppScore: -6, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 77, round: 3, pick: 'Hojgaard, Rasmus', opponent: 'Schwartzel, Charl', edge: 1.51, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'PointsBet', betType: 'H2H', pickScore: 1, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 78, round: 3, pick: 'Bradley, Keegan', opponent: 'Woodland, Gary', edge: 1.41, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-112', book: 'DraftKings', betType: 'H2H', pickScore: 1, oppScore: 4, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 79, round: 3, pick: 'Clark, Wyndham', opponent: 'Homa, Max', edge: 1.35, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'DraftKings', betType: 'H2H', pickScore: 0, oppScore: -1, result: 'L', units: -1.1, dataSet: 'round-only' },
  { id: 80, round: 3, pick: 'Rose, Justin', opponent: 'Koepka, Brooks', edge: 1.32, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 81, round: 3, pick: 'Stevens, Sam', opponent: 'Im, Sungjae', edge: 1.31, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: -3, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 82, round: 3, pick: 'Morikawa, Collin', opponent: 'Campbell, Brian', edge: 1.3, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-180', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: -3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 83, round: 3, pick: 'McIlroy, Rory', opponent: 'Burns, Sam', edge: 1.29, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-140', book: 'PointsBet', betType: 'H2H', pickScore: 1, oppScore: -4, result: 'L', units: -1.4, dataSet: 'round-only' },
  { id: 84, round: 3, pick: 'Bradley, Keegan', opponent: 'McCarty, Matt', edge: 1.28, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'bet365', betType: 'H2H', pickScore: 1, oppScore: 0, result: 'L', units: -1.15, dataSet: 'round-only' },
  { id: 85, round: 3, pick: 'Rai, Aaron', opponent: 'McCarty, Matt', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-117', book: 'Betcris', betType: 'H2H', pickScore: 6, oppScore: 0, result: 'L', units: -1.17, dataSet: 'round-only' },
  { id: 86, round: 3, pick: 'Rose, Justin', opponent: 'Reed, Patrick', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: 0, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 87, round: 3, pick: 'Stevens, Sam', opponent: 'Woodland, Gary', edge: 1.26, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-125', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: 4, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 88, round: 3, pick: 'Schauffele, Xander', opponent: 'Knapp, Jake', edge: 1.19, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-135', book: 'PointsBet', betType: 'H2H', pickScore: -2, oppScore: -3, result: 'L', units: -1.35, dataSet: 'round-only' },
  { id: 89, round: 3, pick: 'Schwartzel, Charl', opponent: 'Campbell, Brian', edge: 1.16, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-120', book: 'bet365', betType: 'H2H', pickScore: 5, oppScore: -3, result: 'L', units: -1.2, dataSet: 'round-only' },
  { id: 90, round: 3, pick: 'Schauffele, Xander', opponent: 'Matsuyama, Hideki', edge: 1.15, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-144', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: 0, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 91, round: 3, pick: 'Stevens, Sam', opponent: 'McCarty, Matt', edge: 1.13, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: 0, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 92, round: 3, pick: 'Hatton, Tyrrell', opponent: 'Matsuyama, Hideki', edge: 1.11, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'bet365', betType: 'H2H', pickScore: 0, oppScore: 0, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 93, round: 3, pick: 'Spieth, Jordan', opponent: 'Straka, Sepp', edge: 1.11, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: -3, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 94, round: 3, pick: 'Spieth, Jordan', opponent: 'Hovland, Viktor', edge: 1.08, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-124', book: 'DraftKings', betType: 'H2H', pickScore: -2, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 95, round: 3, pick: 'Reed, Patrick', opponent: 'Fleetwood, Tommy', edge: 1.08, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+120', book: 'bet365', betType: 'H2H', pickScore: 0, oppScore: 1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 96, round: 3, pick: 'Scott, Adam', opponent: 'Woodland, Gary', edge: 1.04, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: 4, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 97, round: 3, pick: 'Rai, Aaron', opponent: 'Bridgeman, Jacob', edge: 1.01, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+135', book: 'PointsBet', betType: 'H2H', pickScore: 6, oppScore: -3, result: 'L', units: -0.74, dataSet: 'round-only' },
  { id: 98, round: 3, pick: 'Straka, Sepp', opponent: 'English, Harris', edge: 0.98, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-110', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 99, round: 3, pick: 'Conners, Corey', opponent: 'Kim, Si Woo', edge: 0.98, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+135', book: 'bet365', betType: 'H2H', pickScore: -1, oppScore: 0, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 100, round: 3, pick: 'Fitzpatrick, Matt', opponent: 'Morikawa, Collin', edge: 0.96, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-178', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: -4, result: 'L', units: -1.78, dataSet: 'round-only' },
  { id: 101, round: 3, pick: 'Harman, Brian', opponent: 'Noren, Alex', edge: 0.96, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+107', book: 'BetOnline', betType: 'H2H', pickScore: -5, oppScore: -3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 102, round: 3, pick: 'Clark, Wyndham', opponent: 'Griffin, Ben', edge: 3.65, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '+100', book: 'bet365', betType: 'H2H', pickScore: 0, oppScore: -2, result: 'L', units: -1, dataSet: 'cumulative' },
  { id: 103, round: 3, pick: 'Cantlay, Patrick', opponent: 'Im, Sungjae', edge: 2.69, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-110', book: 'bet365', betType: 'H2H', pickScore: -6, oppScore: -3, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 104, round: 3, pick: 'Hatton, Tyrrell', opponent: 'Day, Jason', edge: 2.68, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'BetOnline', betType: 'H2H', pickScore: 0, oppScore: -4, result: 'L', units: -1.05, dataSet: 'cumulative' },
  { id: 105, round: 3, pick: 'Hatton, Tyrrell', opponent: 'Matsuyama, Hideki', edge: 2.62, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'bet365', betType: 'H2H', pickScore: 0, oppScore: 0, result: 'P', units: 0, dataSet: 'cumulative' },
  { id: 106, round: 3, pick: 'Schauffele, Xander', opponent: 'Matsuyama, Hideki', edge: 2.46, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-144', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: 0, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 107, round: 3, pick: 'Bradley, Keegan', opponent: 'Woodland, Gary', edge: 2.36, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-112', book: 'DraftKings', betType: 'H2H', pickScore: 1, oppScore: 4, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 108, round: 3, pick: 'Clark, Wyndham', opponent: 'Homa, Max', edge: 2.34, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'DraftKings', betType: 'H2H', pickScore: 0, oppScore: -1, result: 'L', units: -1.1, dataSet: 'cumulative' },
  { id: 109, round: 3, pick: 'Young, Cameron', opponent: 'Day, Jason', edge: 2.28, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'PointsBet', betType: 'H2H', pickScore: -7, oppScore: -4, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 110, round: 3, pick: 'Fitzpatrick, Matt', opponent: 'Morikawa, Collin', edge: 2.23, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-178', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: -4, result: 'L', units: -1.78, dataSet: 'cumulative' },
  { id: 111, round: 3, pick: 'Schauffele, Xander', opponent: 'Knapp, Jake', edge: 2.21, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-135', book: 'PointsBet', betType: 'H2H', pickScore: -2, oppScore: -3, result: 'L', units: -1.35, dataSet: 'cumulative' },
  { id: 112, round: 3, pick: 'Straka, Sepp', opponent: 'English, Harris', edge: 2.21, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-110', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 113, round: 3, pick: 'McIlroy, Rory', opponent: 'Fleetwood, Tommy', edge: 2.11, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: 1, result: 'P', units: 0, dataSet: 'cumulative' },
  { id: 114, round: 3, pick: 'Lowry, Shane', opponent: 'Day, Jason', edge: 1.97, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-120', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: -4, result: 'P', units: 0, dataSet: 'cumulative' },
  { id: 115, round: 3, pick: 'Koepka, Brooks', opponent: 'Matsuyama, Hideki', edge: 1.92, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-112', book: 'DraftKings', betType: 'H2H', pickScore: -1, oppScore: 0, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 116, round: 3, pick: 'Rose, Justin', opponent: 'Reed, Patrick', edge: 1.92, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: 0, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 117, round: 3, pick: 'Cantlay, Patrick', opponent: 'Knapp, Jake', edge: 1.79, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'BetOnline', betType: 'H2H', pickScore: -6, oppScore: -3, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 118, round: 3, pick: 'Young, Cameron', opponent: 'Fleetwood, Tommy', edge: 1.79, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'DraftKings', betType: 'H2H', pickScore: -7, oppScore: 1, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 119, round: 3, pick: 'Gotterup, Chris', opponent: 'Day, Jason', edge: 1.76, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-118', book: 'DraftKings', betType: 'H2H', pickScore: 0, oppScore: -4, result: 'L', units: -1.18, dataSet: 'cumulative' },
  { id: 120, round: 3, pick: 'Hatton, Tyrrell', opponent: 'Reed, Patrick', edge: 1.71, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'DraftKings', betType: 'H2H', pickScore: 0, oppScore: 0, result: 'P', units: 0, dataSet: 'cumulative' },
  { id: 121, round: 3, pick: 'Bradley, Keegan', opponent: 'McCarty, Matt', edge: 1.71, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'bet365', betType: 'H2H', pickScore: 1, oppScore: 0, result: 'L', units: -1.15, dataSet: 'cumulative' },
  { id: 122, round: 3, pick: 'Homa, Max', opponent: 'Gerard, Ryan', edge: 1.71, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '+104', book: 'BetOnline', betType: 'H2H', pickScore: -1, oppScore: -4, result: 'L', units: -0.96, dataSet: 'cumulative' },
  { id: 123, round: 3, pick: 'Stevens, Sam', opponent: 'Woodland, Gary', edge: 1.6, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-125', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: 4, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 124, round: 3, pick: 'Straka, Sepp', opponent: 'Penge, Marco', edge: 1.52, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-132', book: 'Betcris', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 125, round: 3, pick: 'Lowry, Shane', opponent: 'Fleetwood, Tommy', edge: 1.48, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+150', book: 'PointsBet', betType: 'H2H', pickScore: -4, oppScore: 1, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 126, round: 3, pick: 'Stevens, Sam', opponent: 'Im, Sungjae', edge: 1.44, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: -3, result: 'L', units: -1.05, dataSet: 'cumulative' },
  { id: 127, round: 3, pick: 'Rai, Aaron', opponent: 'McCarty, Matt', edge: 1.38, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-117', book: 'Betcris', betType: 'H2H', pickScore: 6, oppScore: 0, result: 'L', units: -1.17, dataSet: 'cumulative' },
  { id: 128, round: 3, pick: 'Henley, Russell', opponent: 'Morikawa, Collin', edge: 1.37, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: -6, oppScore: -4, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 129, round: 3, pick: 'Scott, Adam', opponent: 'Woodland, Gary', edge: 1.35, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: 4, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 130, round: 3, pick: 'Homa, Max', opponent: 'Griffin, Ben', edge: 1.3, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '+115', book: 'PointsBet', betType: 'H2H', pickScore: -1, oppScore: -2, result: 'L', units: -0.87, dataSet: 'cumulative' },
  { id: 131, round: 3, pick: 'Brennan, Michael', opponent: 'Matsuyama, Hideki', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+190', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: 0, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 132, round: 3, pick: 'Thomas, Justin', opponent: 'Woodland, Gary', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-120', book: 'bet365', betType: 'H2H', pickScore: -1, oppScore: 4, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 133, round: 3, pick: 'Cantlay, Patrick', opponent: 'Henley, Russell', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-104', book: 'Betcris', betType: 'H2H', pickScore: -6, oppScore: -6, result: 'P', units: 0, dataSet: 'cumulative' },
  { id: 134, round: 3, pick: 'Knapp, Jake', opponent: 'Griffin, Ben', edge: 1.24, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-124', book: 'DraftKings', betType: 'H2H', pickScore: -3, oppScore: -2, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 135, round: 3, pick: 'Henley, Russell', opponent: 'Johnson, Dustin', edge: 1.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-143', book: 'bet365', betType: 'H2H', pickScore: -6, oppScore: 3, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 136, round: 3, pick: 'Hovland, Viktor', opponent: 'Thomas, Justin', edge: 1.19, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'BetOnline', betType: 'H2H', pickScore: -1, oppScore: -1, result: 'P', units: 0, dataSet: 'cumulative' },
  { id: 137, round: 3, pick: 'Johnson, Dustin', opponent: 'Campbell, Brian', edge: 1.15, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-178', book: 'BetOnline', betType: 'H2H', pickScore: 3, oppScore: -3, result: 'L', units: -1.78, dataSet: 'cumulative' },
  { id: 138, round: 3, pick: 'Harman, Brian', opponent: 'Hojgaard, Rasmus', edge: 1.14, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '+108', book: 'Betcris', betType: 'H2H', pickScore: -5, oppScore: 1, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 139, round: 3, pick: 'Schwartzel, Charl', opponent: 'Campbell, Brian', edge: 1.07, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-120', book: 'bet365', betType: 'H2H', pickScore: 5, oppScore: -3, result: 'L', units: -1.2, dataSet: 'cumulative' },
  { id: 140, round: 3, pick: 'Morikawa, Collin', opponent: 'Campbell, Brian', edge: 0.98, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-180', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: -3, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 141, round: 3, pick: 'McIlroy, Rory', opponent: 'Burns, Sam', edge: 0.96, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-140', book: 'PointsBet', betType: 'H2H', pickScore: 1, oppScore: -4, result: 'L', units: -1.4, dataSet: 'cumulative' },
  { id: 221, round: 4, pick: 'Thomas, Justin', opponent: 'McNealy, Maverick', edge: 1.47, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: 1, oppScore: -5, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 142, round: 4, pick: 'Im, Sungjae', opponent: 'Stevens, Sam', edge: 2.39, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'bet365', betType: 'H2H', pickScore: 5, oppScore: -2, result: 'L', units: -1.15, dataSet: 'round-only' },
  { id: 143, round: 4, pick: 'Matsuyama, Hideki', opponent: 'Gotterup, Chris', edge: 1.93, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-135', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: 1, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 144, round: 4, pick: 'Bridgeman, Jacob', opponent: 'Homa, Max', edge: 1.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-140', book: 'bet365', betType: 'H2H', pickScore: 4, oppScore: -5, result: 'L', units: -1.4, dataSet: 'round-only' },
  { id: 145, round: 4, pick: 'Reitan, Kristoffer', opponent: 'Straka, Sepp', edge: 1.06, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '+120', book: 'bet365', betType: 'H2H', pickScore: 5, oppScore: 4, result: 'L', units: -0.83, dataSet: 'round-only' },
  { id: 146, round: 4, pick: 'Schauffele, Xander', opponent: 'Fleetwood, Tommy', edge: 1.14, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: 4, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 147, round: 4, pick: 'Scheffler, Scottie', opponent: 'McIlroy, Rory', edge: 1.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-140', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: -1, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 148, round: 4, pick: 'Day, Jason', opponent: 'Lowry, Shane', edge: 0.98, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: 3, oppScore: 8, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 149, round: 4, pick: 'Johnson, Dustin', opponent: 'Bradley, Keegan', edge: 1.93, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '+130', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: -6, result: 'L', units: -0.77, dataSet: 'round-only' },
  { id: 150, round: 4, pick: 'Thomas, Justin', opponent: 'Hovland, Viktor', edge: 1.83, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '+110', book: 'bet365', betType: 'H2H', pickScore: 1, oppScore: -5, result: 'L', units: -0.91, dataSet: 'round-only' },
  { id: 151, round: 4, pick: 'Noren, Alex', opponent: 'McNealy, Maverick', edge: 1.09, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '+135', book: 'PointsBet', betType: 'H2H', pickScore: -2, oppScore: -5, result: 'L', units: -0.74, dataSet: 'round-only' },
  { id: 152, round: 4, pick: 'Bridgeman, Jacob', opponent: 'Straka, Sepp', edge: 1.64, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '+110', book: 'bet365', betType: 'H2H', pickScore: 4, oppScore: 4, result: 'P', units: 0.0, dataSet: 'round-only' },
  { id: 153, round: 4, pick: 'Brennan, Michael', opponent: 'Homa, Max', edge: 1.24, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+120', book: 'PointsBet', betType: 'H2H', pickScore: 1, oppScore: -5, result: 'L', units: -0.83, dataSet: 'round-only' },
  { id: 154, round: 4, pick: 'Fitzpatrick, Matt', opponent: 'Taylor, Nick', edge: 2.03, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-160', book: 'PointsBet', betType: 'H2H', pickScore: -1, oppScore: 5, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 155, round: 4, pick: 'Aberg, Ludvig', opponent: 'Campbell, Brian', edge: 1.45, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '-280', book: 'PointsBet', betType: 'H2H', pickScore: 0, oppScore: 1, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 156, round: 4, pick: 'Koepka, Brooks', opponent: 'Clark, Wyndham', edge: 0.99, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'bet365', betType: 'H2H', pickScore: -1, oppScore: 1, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 157, round: 4, pick: 'Schauffele, Xander', opponent: 'Gerard, Ryan', edge: 1.57, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-163', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: 5, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 158, round: 4, pick: 'Scheffler, Scottie', opponent: 'Li, Haotong', edge: 1.12, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-280', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: 8, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 159, round: 4, pick: 'Thomas, Justin', opponent: 'Conners, Corey', edge: 1.66, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-125', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: 3, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 160, round: 4, pick: 'Im, Sungjae', opponent: 'English, Harris', edge: 1.97, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'BetOnline', betType: 'H2H', pickScore: 5, oppScore: 0, result: 'L', units: -0.95, dataSet: 'round-only' },
  { id: 161, round: 4, pick: 'Brennan, Michael', opponent: 'Taylor, Nick', edge: 2.03, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-105', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: 5, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 162, round: 4, pick: 'Hatton, Tyrrell', opponent: 'Bradley, Keegan', edge: 2.06, tier: 'BEST BET', bucket: 'FADE vs OTHER', bestOdds: '-110', book: 'FanDuel', betType: 'H2H', pickScore: -6, oppScore: -6, result: 'P', units: 0.0, dataSet: 'round-only' },
  { id: 163, round: 4, pick: 'Scott, Adam', opponent: 'McNealy, Maverick', edge: 1.86, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-115', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: -5, result: 'L', units: -1.15, dataSet: 'round-only' },
  { id: 164, round: 4, pick: 'Im, Sungjae', opponent: 'Reitan, Kristoffer', edge: 1.92, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-124', book: 'Betcris', betType: 'H2H', pickScore: 5, oppScore: 5, result: 'P', units: 0.0, dataSet: 'round-only' },
  { id: 165, round: 4, pick: 'Fitzpatrick, Matt', opponent: 'Gotterup, Chris', edge: 1.0, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-150', book: 'Betcris', betType: 'H2H', pickScore: -1, oppScore: 1, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 166, round: 4, pick: 'Hatton, Tyrrell', opponent: 'Taylor, Nick', edge: 1.31, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-124', book: 'Betcris', betType: 'H2H', pickScore: -6, oppScore: 5, result: 'W', units: 1.0, dataSet: 'round-only' },
  { id: 167, round: 4, pick: 'Rai, Aaron', opponent: 'Garcia, Sergio', edge: 2.47, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: 3, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 168, round: 4, pick: 'Rahm, Jon', opponent: 'Kim, Si Woo', edge: 1.39, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-150', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: 0, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 169, round: 4, pick: 'Hovland, Viktor', opponent: 'Conners, Corey', edge: 2.51, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-140', book: 'bet365', betType: 'H2H', pickScore: -5, oppScore: 3, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 170, round: 4, pick: 'Spieth, Jordan', opponent: 'Noren, Alex', edge: 2.13, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-150', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: -2, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 171, round: 4, pick: 'Harman, Brian', opponent: 'Penge, Marco', edge: 1.75, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '+110', book: 'FanDuel', betType: 'H2H', pickScore: 1, oppScore: 6, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 172, round: 4, pick: 'Scott, Adam', opponent: 'English, Harris', edge: 3.0, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-115', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: 0, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 173, round: 4, pick: 'Bridgeman, Jacob', opponent: 'Homa, Max', edge: 1.38, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-140', book: 'bet365', betType: 'H2H', pickScore: 4, oppScore: -5, result: 'L', units: -1.4, dataSet: 'cumulative' },
  { id: 174, round: 4, pick: 'Straka, Sepp', opponent: 'Reitan, Kristoffer', edge: 1.58, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '-140', book: 'bet365', betType: 'H2H', pickScore: 4, oppScore: 5, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 175, round: 4, pick: 'Taylor, Nick', opponent: 'Gerard, Ryan', edge: 1.13, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '+105', book: 'bet365', betType: 'H2H', pickScore: 5, oppScore: 5, result: 'P', units: 0.0, dataSet: 'cumulative' },
  { id: 176, round: 4, pick: 'Schauffele, Xander', opponent: 'Fleetwood, Tommy', edge: 3.37, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: 4, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 177, round: 4, pick: 'Clark, Wyndham', opponent: 'Knapp, Jake', edge: 1.84, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+125', book: 'bet365', betType: 'H2H', pickScore: 1, oppScore: -2, result: 'L', units: -0.8, dataSet: 'cumulative' },
  { id: 178, round: 4, pick: 'Koepka, Brooks', opponent: 'Griffin, Ben', edge: 2.58, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'bet365', betType: 'H2H', pickScore: -1, oppScore: 5, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 179, round: 4, pick: 'Reed, Patrick', opponent: 'Morikawa, Collin', edge: 2.01, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '+110', book: 'bet365', betType: 'H2H', pickScore: 1, oppScore: -4, result: 'L', units: -0.91, dataSet: 'cumulative' },
  { id: 180, round: 4, pick: 'Scheffler, Scottie', opponent: 'McIlroy, Rory', edge: 1.55, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-140', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: -1, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 181, round: 4, pick: 'Lowry, Shane', opponent: 'Day, Jason', edge: 1.25, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'Bovada', betType: 'H2H', pickScore: 8, oppScore: 3, result: 'L', units: -1.1, dataSet: 'cumulative' },
  { id: 182, round: 4, pick: 'Rai, Aaron', opponent: 'Schwartzel, Charl', edge: 5.54, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-120', book: 'PointsBet', betType: 'H2H', pickScore: -2, oppScore: 3, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 183, round: 4, pick: 'Woodland, Gary', opponent: 'Kitayama, Kurt', edge: 1.88, tier: 'STRONG PLAY', bucket: 'FADE vs OTHER', bestOdds: '+120', book: 'bet365', betType: 'H2H', pickScore: -6, oppScore: 0, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 184, round: 4, pick: 'Rahm, Jon', opponent: 'Garcia, Sergio', edge: 1.51, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-190', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: 3, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 185, round: 4, pick: 'Hovland, Viktor', opponent: 'Thomas, Justin', edge: 1.08, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'bet365', betType: 'H2H', pickScore: -5, oppScore: 1, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 186, round: 4, pick: 'Scott, Adam', opponent: 'Penge, Marco', edge: 3.75, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-110', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: 6, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 187, round: 4, pick: 'Stevens, Sam', opponent: 'English, Harris', edge: 1.96, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '+120', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: 0, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 188, round: 4, pick: 'Spieth, Jordan', opponent: 'Harman, Brian', edge: 3.08, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-130', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: 1, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 189, round: 4, pick: 'Gotterup, Chris', opponent: 'Reitan, Kristoffer', edge: 2.79, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-125', book: 'bet365', betType: 'H2H', pickScore: 1, oppScore: 5, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 190, round: 4, pick: 'Brennan, Michael', opponent: 'Homa, Max', edge: 3.01, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '+120', book: 'PointsBet', betType: 'H2H', pickScore: 1, oppScore: -5, result: 'L', units: -0.83, dataSet: 'cumulative' },
  { id: 191, round: 4, pick: 'Fitzpatrick, Matt', opponent: 'Taylor, Nick', edge: 2.47, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-160', book: 'PointsBet', betType: 'H2H', pickScore: -1, oppScore: 5, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 192, round: 4, pick: 'Aberg, Ludvig', opponent: 'Campbell, Brian', edge: 4.85, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-280', book: 'PointsBet', betType: 'H2H', pickScore: 0, oppScore: 1, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 193, round: 4, pick: 'Hatton, Tyrrell', opponent: 'Fleetwood, Tommy', edge: 2.95, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '+162', book: 'bet365', betType: 'H2H', pickScore: -6, oppScore: 4, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 194, round: 4, pick: 'Schauffele, Xander', opponent: 'Gerard, Ryan', edge: 4.56, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-163', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: 5, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 195, round: 4, pick: 'Knapp, Jake', opponent: 'Griffin, Ben', edge: 1.13, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: 5, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 196, round: 4, pick: 'Cantlay, Patrick', opponent: 'Henley, Russell', edge: 1.3, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+120', book: 'PointsBet', betType: 'H2H', pickScore: 1, oppScore: -4, result: 'L', units: -0.83, dataSet: 'cumulative' },
  { id: 197, round: 4, pick: 'Scheffler, Scottie', opponent: 'Li, Haotong', edge: 3.23, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-280', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: 8, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 198, round: 4, pick: 'Rose, Justin', opponent: 'Day, Jason', edge: 2.58, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: 3, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 199, round: 4, pick: 'Rai, Aaron', opponent: 'Hojgaard, Rasmus', edge: 3.3, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '+113', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: 5, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 200, round: 4, pick: 'Bradley, Keegan', opponent: 'McCarty, Matt', edge: 1.32, tier: 'LEAN', bucket: 'FADE vs OTHER', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: -6, oppScore: -3, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 201, round: 4, pick: 'Thomas, Justin', opponent: 'Conners, Corey', edge: 1.43, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-125', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: 3, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 202, round: 4, pick: 'Hovland, Viktor', opponent: 'McNealy, Maverick', edge: 1.89, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'BetOnline', betType: 'H2H', pickScore: -5, oppScore: -5, result: 'P', units: 0.0, dataSet: 'cumulative' },
  { id: 203, round: 4, pick: 'Noren, Alex', opponent: 'Penge, Marco', edge: 2.7, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-111', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: 6, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 204, round: 4, pick: 'Stevens, Sam', opponent: 'Harman, Brian', edge: 0.96, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-127', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: 1, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 205, round: 4, pick: 'Im, Sungjae', opponent: 'English, Harris', edge: 2.48, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '+105', book: 'BetOnline', betType: 'H2H', pickScore: 5, oppScore: 0, result: 'L', units: -0.95, dataSet: 'cumulative' },
  { id: 206, round: 4, pick: 'Spieth, Jordan', opponent: 'Matsuyama, Hideki', edge: 1.71, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+113', book: 'Betcris', betType: 'H2H', pickScore: -4, oppScore: -3, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 207, round: 4, pick: 'Gotterup, Chris', opponent: 'Straka, Sepp', edge: 1.21, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-127', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: 4, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 208, round: 4, pick: 'Brennan, Michael', opponent: 'Taylor, Nick', edge: 2.86, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: 5, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 209, round: 4, pick: 'Clark, Wyndham', opponent: 'Gerard, Ryan', edge: 4.02, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-105', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: 5, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 210, round: 4, pick: 'Cantlay, Patrick', opponent: 'Day, Jason', edge: 2.1, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: 3, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 211, round: 4, pick: 'Cantlay, Patrick', opponent: 'Morikawa, Collin', edge: 3.41, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-111', book: 'FanDuel', betType: 'H2H', pickScore: 1, oppScore: -4, result: 'L', units: -1.11, dataSet: 'cumulative' },
  { id: 212, round: 4, pick: 'Spieth, Jordan', opponent: 'Scott, Adam', edge: 1.08, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'FanDuel', betType: 'H2H', pickScore: -4, oppScore: -2, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 213, round: 4, pick: 'Rose, Justin', opponent: 'Lowry, Shane', edge: 1.32, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-150', book: 'FanDuel', betType: 'H2H', pickScore: -2, oppScore: 8, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 214, round: 4, pick: 'Hatton, Tyrrell', opponent: 'Bradley, Keegan', edge: 2.77, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'FanDuel', betType: 'H2H', pickScore: -6, oppScore: -6, result: 'P', units: 0.0, dataSet: 'cumulative' },
  { id: 215, round: 4, pick: 'Scott, Adam', opponent: 'McNealy, Maverick', edge: 1.98, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: -5, result: 'L', units: -1.15, dataSet: 'cumulative' },
  { id: 216, round: 4, pick: 'Im, Sungjae', opponent: 'Reitan, Kristoffer', edge: 2.29, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-124', book: 'Betcris', betType: 'H2H', pickScore: 5, oppScore: 5, result: 'P', units: 0.0, dataSet: 'cumulative' },
  { id: 217, round: 4, pick: 'Hatton, Tyrrell', opponent: 'Taylor, Nick', edge: 3.02, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-124', book: 'Betcris', betType: 'H2H', pickScore: -6, oppScore: 5, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 218, round: 4, pick: 'Aberg, Ludvig', opponent: 'Fleetwood, Tommy', edge: 2.37, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-107', book: 'Betcris', betType: 'H2H', pickScore: 0, oppScore: 4, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 219, round: 4, pick: 'Cantlay, Patrick', opponent: 'Li, Haotong', edge: 2.4, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-173', book: 'Betcris', betType: 'H2H', pickScore: 1, oppScore: 8, result: 'W', units: 1.0, dataSet: 'cumulative' },
  { id: 220, round: 4, pick: 'Scheffler, Scottie', opponent: 'Henley, Russell', edge: 2.13, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-210', book: 'Betcris', betType: 'H2H', pickScore: -4, oppScore: -4, result: 'P', units: 0.0, dataSet: 'cumulative' },
];
