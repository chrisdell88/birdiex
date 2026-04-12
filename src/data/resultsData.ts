import type { BetRecord, TierBreakdown, BucketBreakdown } from '../types';

// ===== OVERALL SUMMARY (R2 + R3 round-only combined) =====
export const overallRecord = { wins: 57, losses: 37, pushes: 7 };
export const overallUnits = 9.52;
export const overallROI = 7.85;

// ===== R2 SUMMARY =====
export const r2Summary = {
  record: '36-23-4',
  wins: 36, losses: 23, pushes: 4,
  units: 5.15, roi: 6.45,
};

// ===== R3 ROUND-ONLY SUMMARY =====
export const r3RoundOnlySummary = {
  record: '21-14-3',
  wins: 21, losses: 14, pushes: 3,
  units: 4.37, roi: 10.55,
};

// ===== R3 CUMULATIVE SUMMARY =====
export const r3CumulativeSummary = {
  record: '20-14-6',
  wins: 20, losses: 14, pushes: 6,
  units: 2.96, roi: 7.37,
};

// Tier breakdowns -- R2
export const r2TierBreakdowns: TierBreakdown[] = [{"tier":"BEST BET","wins":9,"losses":5,"pushes":1,"units":1.42,"roi":6.72},{"tier":"STRONG PLAY","wins":14,"losses":5,"pushes":2,"units":7.25,"roi":28.75},{"tier":"LEAN","wins":13,"losses":13,"pushes":1,"units":-3.52,"roi":-10.49}];

// Tier breakdowns -- R3 round-only
export const r3ROTierBreakdowns: TierBreakdown[] = [{"tier":"BEST BET","wins":4,"losses":2,"pushes":0,"units":1.72,"roi":25.44},{"tier":"STRONG PLAY","wins":4,"losses":2,"pushes":2,"units":1.64,"roi":22.34},{"tier":"LEAN","wins":13,"losses":10,"pushes":1,"units":1.01,"roi":3.69}];

// Tier breakdowns -- R3 cumulative
export const r3CumTierBreakdowns: TierBreakdown[] = [{"tier":"BEST BET","wins":5,"losses":5,"pushes":3,"units":-1.28,"roi":-10.41},{"tier":"STRONG PLAY","wins":7,"losses":3,"pushes":1,"units":3.71,"roi":34.04},{"tier":"LEAN","wins":8,"losses":6,"pushes":2,"units":0.53,"roi":3.12}];

// Combined tier breakdowns (for backward compat)
export const tierBreakdowns: TierBreakdown[] = r2TierBreakdowns;

// Bucket breakdowns -- R2
export const r2BucketBreakdowns: BucketBreakdown[] = [{"bucket":"BUY vs FADE","wins":8,"losses":9,"pushes":1,"units":-5.24,"roi":-22.7},{"bucket":"OTHER vs FADE","wins":10,"losses":3,"pushes":1,"units":6.52,"roi":37.34},{"bucket":"BUY vs OTHER","wins":18,"losses":11,"pushes":2,"units":3.87,"roi":9.84}];

// Bucket breakdowns -- R3 round-only
export const r3ROBucketBreakdowns: BucketBreakdown[] = [{"bucket":"BUY vs FADE","wins":6,"losses":1,"pushes":0,"units":4.95,"roi":59.78},{"bucket":"BUY vs OTHER","wins":13,"losses":12,"pushes":3,"units":-1.38,"roi":-4.75},{"bucket":"OTHER vs FADE","wins":2,"losses":1,"pushes":0,"units":0.8,"roi":19.51}];

// Bucket breakdowns -- R3 cumulative  
export const r3CumBucketBreakdowns: BucketBreakdown[] = [{"bucket":"BUY vs FADE","wins":6,"losses":2,"pushes":0,"units":3.95,"roi":43.08},{"bucket":"BUY vs OTHER","wins":11,"losses":8,"pushes":6,"units":0.82,"roi":3.69},{"bucket":"OTHER vs FADE","wins":3,"losses":4,"pushes":0,"units":-1.81,"roi":-20.62}];

// Combined bucket breakdowns (for backward compat)
export const bucketBreakdowns: BucketBreakdown[] = r2BucketBreakdowns;

// Data set comparison
export const dataSetComparison = {
  roundOnly: { wins: 57, losses: 37, pushes: 7, units: 9.52, roi: 7.85 },
  cumulative: { wins: 20, losses: 14, pushes: 6, units: 2.96, roi: 7.37 },
};

// Per-book breakdowns -- R2
export const r2BookBreakdowns = {
  "betcris": {
    "record": "10-9-2",
    "units": -3.33,
    "roi": "-12.4%"
  },
  "draftkings": {
    "record": "3-1-1",
    "units": 2.02,
    "roi": "46.76%"
  },
  "betonline": {
    "record": "9-6-0",
    "units": 1.04,
    "roi": "5.09%"
  },
  "unibet": {
    "record": "17-13-2",
    "units": -1.66,
    "roi": "-3.88%"
  },
  "pinnacle": {
    "record": "3-3-1",
    "units": -0.12,
    "roi": "-1.59%"
  },
  "bet365": {
    "record": "1-2-0",
    "units": -1.25,
    "roi": "-39.06%"
  },
  "bovada": {
    "record": "1-2-0",
    "units": -1.25,
    "roi": "-39.06%"
  },
  "betmgm": {
    "record": "3-1-0",
    "units": 2.05,
    "roi": "46.38%"
  }
};

// Per-book breakdowns -- R3 round-only
export const r3ROBookBreakdowns = {
  "bet365": {
    "record": "13-8-1",
    "units": 3.59,
    "roi": "14.46%"
  },
  "pointsbet": {
    "record": "6-4-0",
    "units": 1.31,
    "roi": "9.86%"
  },
  "betonline": {
    "record": "5-4-1",
    "units": 0.28,
    "roi": "2.67%"
  },
  "draftkings": {
    "record": "3-1-0",
    "units": 1.9,
    "roi": "41.21%"
  },
  "betcris": {
    "record": "2-3-1",
    "units": -2.26,
    "roi": "-32.52%"
  },
  "bovada": {
    "record": "1-0-0",
    "units": 1,
    "roi": "135.14%"
  }
};

// ===== FULL BET LOG =====
export const betLog: BetRecord[] = [
  { id: 1, round: 2, pick: 'Fang, Ethan', opponent: 'Riley, Davis', edge: 3.06, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-140', book: 'Betcris', betType: 'H2H', pickScore: 6, oppScore: 8, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 2, round: 2, pick: 'Lowry, Shane', opponent: 'Bhatia, Akshay', edge: 2.96, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-110', book: 'DraftKings', betType: 'H2H', pickScore: -3, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 3, round: 2, pick: 'Kitayama, Kurt', opponent: 'Hojgaard, Rasmus', edge: 2.85, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-145', book: 'BetOnline', betType: 'H2H', pickScore: 7, oppScore: -2, result: 'L', units: -1.45, dataSet: 'round-only' },
  { id: 4, round: 2, pick: 'Clark, Wyndham', opponent: 'Kim, Michael', edge: 2.74, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-137', book: 'Betcris', betType: 'H2H', pickScore: -4, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 5, round: 2, pick: 'McCarty, Matt', opponent: 'Hojgaard, Rasmus', edge: 2.55, tier: 'BEST BET', bucket: 'OTHER vs FADE', bestOdds: '-114', book: 'Unibet', betType: 'H2H', pickScore: 1, oppScore: -2, result: 'L', units: -1.14, dataSet: 'round-only' },
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
  { id: 21, round: 2, pick: 'Neergaard-Petersen, Rasmus', opponent: 'Potgieter, Aldrich', edge: 1.76, tier: 'STRONG PLAY', bucket: 'OTHER vs FADE', bestOdds: '-152', book: 'Unibet', betType: 'H2H', pickScore: 2, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 22, round: 2, pick: 'Aberg, Ludvig', opponent: 'MacIntyre, Robert', edge: 1.75, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-132', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 23, round: 2, pick: 'Singh, Vijay', opponent: 'Kataoka, Naoyuki', edge: 1.75, tier: 'STRONG PLAY', bucket: 'OTHER vs FADE', bestOdds: '-106', book: 'Betcris', betType: 'H2H', pickScore: 3, oppScore: 3, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 24, round: 2, pick: 'Stevens, Sam', opponent: 'Kim, Michael', edge: 1.74, tier: 'STRONG PLAY', bucket: 'OTHER vs FADE', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: 2, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 25, round: 2, pick: 'Hojgaard, Nicolai', opponent: 'Kim, Michael', edge: 1.72, tier: 'STRONG PLAY', bucket: 'OTHER vs FADE', bestOdds: '-162', book: 'Unibet', betType: 'H2H', pickScore: 2, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 26, round: 2, pick: 'Lowry, Shane', opponent: 'Henley, Russell', edge: 1.65, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 27, round: 2, pick: 'Thomas, Justin', opponent: 'Conners, Corey', edge: 1.65, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-120', book: 'bet365', betType: 'H2H', pickScore: 2, oppScore: 1, result: 'L', units: -1.2, dataSet: 'round-only' },
  { id: 28, round: 2, pick: 'Burns, Sam', opponent: 'Knapp, Jake', edge: 1.61, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-107', book: 'Unibet', betType: 'H2H', pickScore: -1, oppScore: -3, result: 'L', units: -1.07, dataSet: 'round-only' },
  { id: 29, round: 2, pick: 'Burns, Sam', opponent: 'Smith, Cameron', edge: 1.6, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-143', book: 'Unibet', betType: 'H2H', pickScore: -1, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 30, round: 2, pick: 'Homa, Max', opponent: 'Ortiz, Carlos', edge: 1.59, tier: 'STRONG PLAY', bucket: 'OTHER vs FADE', bestOdds: '-125', book: 'Unibet', betType: 'H2H', pickScore: -2, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 31, round: 2, pick: 'Homa, Max', opponent: 'Potgieter, Aldrich', edge: 1.57, tier: 'STRONG PLAY', bucket: 'OTHER vs FADE', bestOdds: '-180', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 32, round: 2, pick: 'Kitayama, Kurt', opponent: 'Reitan, Kristoffer', edge: 1.57, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-143', book: 'Unibet', betType: 'H2H', pickScore: 7, oppScore: -4, result: 'L', units: -1.43, dataSet: 'round-only' },
  { id: 33, round: 2, pick: 'Hatton, Tyrrell', opponent: 'McNealy, Maverick', edge: 1.55, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-103', book: 'Unibet', betType: 'H2H', pickScore: -6, oppScore: -2, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 34, round: 2, pick: 'McIlroy, Rory', opponent: 'Matsuyama, Hideki', edge: 1.53, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-138', book: 'Betcris', betType: 'H2H', pickScore: -7, oppScore: -2, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 35, round: 2, pick: 'Day, Jason', opponent: 'Bhatia, Akshay', edge: 1.49, tier: 'STRONG PLAY', bucket: 'OTHER vs FADE', bestOdds: '-118', book: 'BetMGM', betType: 'H2H', pickScore: -1, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 36, round: 2, pick: 'Lowry, Shane', opponent: 'Day, Jason', edge: 1.46, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-114', book: 'Pinnacle', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 37, round: 2, pick: 'Hovland, Viktor', opponent: 'Cantlay, Patrick', edge: 1.45, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-114', book: 'Unibet', betType: 'H2H', pickScore: -1, oppScore: -5, result: 'L', units: -1.14, dataSet: 'round-only' },
  { id: 38, round: 2, pick: 'Reed, Patrick', opponent: 'Bhatia, Akshay', edge: 1.44, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-125', book: 'Unibet', betType: 'H2H', pickScore: -3, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 39, round: 2, pick: 'Rose, Justin', opponent: 'Lee, Min Woo', edge: 1.44, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-129', book: 'BetOnline', betType: 'H2H', pickScore: -3, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 40, round: 2, pick: 'Li, Haotong', opponent: 'Ortiz, Carlos', edge: 1.41, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-153', book: 'BetOnline', betType: 'H2H', pickScore: -3, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 41, round: 2, pick: 'Bridgeman, Jacob', opponent: 'Lee, Min Woo', edge: 1.4, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-103', book: 'Betcris', betType: 'H2H', pickScore: 2, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 42, round: 2, pick: 'Fitzpatrick, Matt', opponent: 'DeChambeau, Bryson', edge: 1.4, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-120', book: 'Unibet', betType: 'H2H', pickScore: -3, oppScore: 2, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 43, round: 2, pick: 'Kitayama, Kurt', opponent: 'Jarvis, Casey', edge: 1.36, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-152', book: 'Unibet', betType: 'H2H', pickScore: 7, oppScore: 3, result: 'L', units: -1.52, dataSet: 'round-only' },
  { id: 44, round: 2, pick: 'Rose, Justin', opponent: 'Woodland, Gary', edge: 1.36, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-182', book: 'Pinnacle', betType: 'H2H', pickScore: -3, oppScore: 3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 45, round: 2, pick: 'Bradley, Keegan', opponent: 'Knapp, Jake', edge: 1.35, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+114', book: 'Pinnacle', betType: 'H2H', pickScore: 2, oppScore: -3, result: 'L', units: -0.88, dataSet: 'round-only' },
  { id: 46, round: 2, pick: 'Bradley, Keegan', opponent: 'Smith, Cameron', edge: 1.34, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-111', book: 'BetMGM', betType: 'H2H', pickScore: 2, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 47, round: 2, pick: 'Watson, Bubba', opponent: 'Echavarria, Nico', edge: 1.31, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-103', book: 'Unibet', betType: 'H2H', pickScore: 1, oppScore: 6, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 48, round: 2, pick: 'Henley, Russell', opponent: 'Bhatia, Akshay', edge: 1.3, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: -1, oppScore: 5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 49, round: 2, pick: 'Lowry, Shane', opponent: 'Johnson, Dustin', edge: 1.29, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-186', book: 'Unibet', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 50, round: 2, pick: 'Hall, Harry', opponent: 'Conners, Corey', edge: 1.28, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-113', book: 'Betcris', betType: 'H2H', pickScore: 0, oppScore: 1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 51, round: 2, pick: 'McCarty, Matt', opponent: 'Reitan, Kristoffer', edge: 1.27, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: 1, oppScore: -4, result: 'L', units: -1.35, dataSet: 'round-only' },
  { id: 52, round: 2, pick: 'Hovland, Viktor', opponent: 'Henley, Russell', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-108', book: 'DraftKings', betType: 'H2H', pickScore: -1, oppScore: -1, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 53, round: 2, pick: 'McKibbin, Tom', opponent: 'Campbell, Brian', edge: 1.26, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-200', book: 'Unibet', betType: 'H2H', pickScore: 4, oppScore: 1, result: 'L', units: -2, dataSet: 'round-only' },
  { id: 54, round: 2, pick: 'McIlroy, Rory', opponent: 'Young, Cameron', edge: 1.25, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-136', book: 'Unibet', betType: 'H2H', pickScore: -7, oppScore: -5, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 55, round: 2, pick: 'Fleetwood, Tommy', opponent: 'DeChambeau, Bryson', edge: 1.24, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-106', book: 'DraftKings', betType: 'H2H', pickScore: -4, oppScore: 2, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 56, round: 2, pick: 'Kim, Si Woo', opponent: 'English, Harris', edge: 1.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-142', book: 'Betcris', betType: 'H2H', pickScore: 1, oppScore: -1, result: 'L', units: -1.42, dataSet: 'round-only' },
  { id: 57, round: 2, pick: 'Straka, Sepp', opponent: 'Griffin, Ben', edge: 1.18, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-119', book: 'Betcris', betType: 'H2H', pickScore: 0, oppScore: -3, result: 'L', units: -1.19, dataSet: 'round-only' },
  { id: 58, round: 2, pick: 'Thomas, Justin', opponent: 'Griffin, Ben', edge: 1.15, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-132', book: 'Unibet', betType: 'H2H', pickScore: 2, oppScore: -3, result: 'L', units: -1.32, dataSet: 'round-only' },
  { id: 59, round: 2, pick: 'Hovland, Viktor', opponent: 'Reed, Patrick', edge: 1.13, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'BetMGM', betType: 'H2H', pickScore: -1, oppScore: -3, result: 'L', units: -0.95, dataSet: 'round-only' },
  { id: 60, round: 2, pick: 'Kim, Si Woo', opponent: 'Penge, Marco', edge: 1.03, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-167', book: 'Unibet', betType: 'H2H', pickScore: 1, oppScore: -3, result: 'L', units: -1.67, dataSet: 'round-only' },
  { id: 61, round: 2, pick: 'Smith, Cameron', opponent: 'Gerard, Ryan', edge: 1.01, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '+101', book: 'Betcris', betType: 'H2H', pickScore: 5, oppScore: 0, result: 'L', units: -0.99, dataSet: 'round-only' },
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
  { id: 82, round: 3, pick: 'Morikawa, Collin', opponent: 'Campbell, Brian', edge: 1.3, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-180', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: -3, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 83, round: 3, pick: 'McIlroy, Rory', opponent: 'Burns, Sam', edge: 1.29, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-140', book: 'PointsBet', betType: 'H2H', pickScore: 1, oppScore: -4, result: 'L', units: -1.4, dataSet: 'round-only' },
  { id: 84, round: 3, pick: 'Bradley, Keegan', opponent: 'McCarty, Matt', edge: 1.28, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'bet365', betType: 'H2H', pickScore: 1, oppScore: 0, result: 'L', units: -1.15, dataSet: 'round-only' },
  { id: 85, round: 3, pick: 'Rai, Aaron', opponent: 'McCarty, Matt', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-117', book: 'Betcris', betType: 'H2H', pickScore: 6, oppScore: 0, result: 'L', units: -1.17, dataSet: 'round-only' },
  { id: 86, round: 3, pick: 'Rose, Justin', opponent: 'Reed, Patrick', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: 0, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 87, round: 3, pick: 'Stevens, Sam', opponent: 'Woodland, Gary', edge: 1.26, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-125', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: 4, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 88, round: 3, pick: 'Schauffele, Xander', opponent: 'Knapp, Jake', edge: 1.19, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-135', book: 'PointsBet', betType: 'H2H', pickScore: -2, oppScore: -3, result: 'L', units: -1.35, dataSet: 'round-only' },
  { id: 89, round: 3, pick: 'Schwartzel, Charl', opponent: 'Campbell, Brian', edge: 1.16, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-120', book: 'bet365', betType: 'H2H', pickScore: 5, oppScore: -3, result: 'L', units: -1.2, dataSet: 'round-only' },
  { id: 90, round: 3, pick: 'Schauffele, Xander', opponent: 'Matsuyama, Hideki', edge: 1.15, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-144', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: 0, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 91, round: 3, pick: 'Stevens, Sam', opponent: 'McCarty, Matt', edge: 1.13, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: 0, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 92, round: 3, pick: 'Hatton, Tyrrell', opponent: 'Matsuyama, Hideki', edge: 1.11, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'bet365', betType: 'H2H', pickScore: 0, oppScore: 0, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 93, round: 3, pick: 'Spieth, Jordan', opponent: 'Straka, Sepp', edge: 1.11, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: -3, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 94, round: 3, pick: 'Spieth, Jordan', opponent: 'Hovland, Viktor', edge: 1.08, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-124', book: 'DraftKings', betType: 'H2H', pickScore: -2, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 95, round: 3, pick: 'Reed, Patrick', opponent: 'Fleetwood, Tommy', edge: 1.08, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+120', book: 'bet365', betType: 'H2H', pickScore: 0, oppScore: 1, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 96, round: 3, pick: 'Scott, Adam', opponent: 'Woodland, Gary', edge: 1.04, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: 4, result: 'W', units: 1, dataSet: 'round-only' },
  { id: 97, round: 3, pick: 'Rai, Aaron', opponent: 'Bridgeman, Jacob', edge: 1.01, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+135', book: 'PointsBet', betType: 'H2H', pickScore: 6, oppScore: -3, result: 'L', units: -0.74, dataSet: 'round-only' },
  { id: 98, round: 3, pick: 'Straka, Sepp', opponent: 'English, Harris', edge: 0.98, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-110', book: 'bet365', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'round-only' },
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
  { id: 122, round: 3, pick: 'Homa, Max', opponent: 'Gerard, Ryan', edge: 1.71, tier: 'STRONG PLAY', bucket: 'OTHER vs FADE', bestOdds: '+104', book: 'BetOnline', betType: 'H2H', pickScore: -1, oppScore: -4, result: 'L', units: -0.96, dataSet: 'cumulative' },
  { id: 123, round: 3, pick: 'Stevens, Sam', opponent: 'Woodland, Gary', edge: 1.6, tier: 'STRONG PLAY', bucket: 'BUY vs FADE', bestOdds: '-125', book: 'Betcris', betType: 'H2H', pickScore: -2, oppScore: 4, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 124, round: 3, pick: 'Straka, Sepp', opponent: 'Penge, Marco', edge: 1.52, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-132', book: 'Betcris', betType: 'H2H', pickScore: -3, oppScore: -1, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 125, round: 3, pick: 'Lowry, Shane', opponent: 'Fleetwood, Tommy', edge: 1.48, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+150', book: 'PointsBet', betType: 'H2H', pickScore: -4, oppScore: 1, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 126, round: 3, pick: 'Stevens, Sam', opponent: 'Im, Sungjae', edge: 1.44, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: -3, result: 'L', units: -1.05, dataSet: 'cumulative' },
  { id: 127, round: 3, pick: 'Rai, Aaron', opponent: 'McCarty, Matt', edge: 1.38, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-117', book: 'Betcris', betType: 'H2H', pickScore: 6, oppScore: 0, result: 'L', units: -1.17, dataSet: 'cumulative' },
  { id: 128, round: 3, pick: 'Henley, Russell', opponent: 'Morikawa, Collin', edge: 1.37, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: -6, oppScore: -4, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 129, round: 3, pick: 'Scott, Adam', opponent: 'Woodland, Gary', edge: 1.35, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-135', book: 'BetOnline', betType: 'H2H', pickScore: -2, oppScore: 4, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 130, round: 3, pick: 'Homa, Max', opponent: 'Griffin, Ben', edge: 1.3, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '+115', book: 'PointsBet', betType: 'H2H', pickScore: -1, oppScore: -2, result: 'L', units: -0.87, dataSet: 'cumulative' },
  { id: 131, round: 3, pick: 'Brennan, Michael', opponent: 'Matsuyama, Hideki', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+190', book: 'bet365', betType: 'H2H', pickScore: -2, oppScore: 0, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 132, round: 3, pick: 'Thomas, Justin', opponent: 'Woodland, Gary', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-120', book: 'bet365', betType: 'H2H', pickScore: -1, oppScore: 4, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 133, round: 3, pick: 'Cantlay, Patrick', opponent: 'Henley, Russell', edge: 1.27, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-104', book: 'Betcris', betType: 'H2H', pickScore: -6, oppScore: -6, result: 'P', units: 0, dataSet: 'cumulative' },
  { id: 134, round: 3, pick: 'Knapp, Jake', opponent: 'Griffin, Ben', edge: 1.24, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-124', book: 'DraftKings', betType: 'H2H', pickScore: -3, oppScore: -2, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 135, round: 3, pick: 'Henley, Russell', opponent: 'Johnson, Dustin', edge: 1.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-143', book: 'bet365', betType: 'H2H', pickScore: -6, oppScore: 3, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 136, round: 3, pick: 'Hovland, Viktor', opponent: 'Thomas, Justin', edge: 1.19, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-125', book: 'BetOnline', betType: 'H2H', pickScore: -1, oppScore: -1, result: 'P', units: 0, dataSet: 'cumulative' },
  { id: 137, round: 3, pick: 'Johnson, Dustin', opponent: 'Campbell, Brian', edge: 1.15, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-178', book: 'BetOnline', betType: 'H2H', pickScore: 3, oppScore: -3, result: 'L', units: -1.78, dataSet: 'cumulative' },
  { id: 138, round: 3, pick: 'Harman, Brian', opponent: 'Hojgaard, Rasmus', edge: 1.14, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '+108', book: 'Betcris', betType: 'H2H', pickScore: -5, oppScore: 1, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 139, round: 3, pick: 'Schwartzel, Charl', opponent: 'Campbell, Brian', edge: 1.07, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-120', book: 'bet365', betType: 'H2H', pickScore: 5, oppScore: -3, result: 'L', units: -1.2, dataSet: 'cumulative' },
  { id: 140, round: 3, pick: 'Morikawa, Collin', opponent: 'Campbell, Brian', edge: 0.98, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-180', book: 'bet365', betType: 'H2H', pickScore: -4, oppScore: -3, result: 'W', units: 1, dataSet: 'cumulative' },
  { id: 141, round: 3, pick: 'McIlroy, Rory', opponent: 'Burns, Sam', edge: 0.96, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-140', book: 'PointsBet', betType: 'H2H', pickScore: 1, oppScore: -4, result: 'L', units: -1.4, dataSet: 'cumulative' },
];
