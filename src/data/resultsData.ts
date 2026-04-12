import type { BetRecord, TierBreakdown, BucketBreakdown } from '../types';

// Summary totals (R2 actual results)
export const overallRecord = { wins: 54, losses: 31, pushes: 9 };
export const overallUnits = 12.26;
export const overallROI = 10.0;

// Tier breakdowns
export const tierBreakdowns: TierBreakdown[] = [
  { tier: 'BEST BET', wins: 3, losses: 2, pushes: 0, units: 0.41, roi: 6.3 },
  { tier: 'STRONG PLAY', wins: 18, losses: 8, pushes: 3, units: 6.26, roi: 15.2 },
  { tier: 'LEAN', wins: 33, losses: 21, pushes: 6, units: 5.59, roi: 7.4 },
];

// Bucket breakdowns
export const bucketBreakdowns: BucketBreakdown[] = [
  { bucket: 'BUY vs FADE', wins: 8, losses: 9, pushes: 1, units: -5.24, roi: -21.7 },
  { bucket: 'BUY vs OTHER', wins: 31, losses: 15, pushes: 7, units: 10.69, roi: 15.3 },
  { bucket: 'OTHER vs FADE', wins: 13, losses: 6, pushes: 1, units: 6.56, roi: 26.1 },
  { bucket: 'OTHER vs OTHER', wins: 2, losses: 1, pushes: 0, units: 0.25, roi: 5.6 },
];

// Data set comparison (round-only vs cumulative)
export const dataSetComparison = {
  roundOnly: { wins: 54, losses: 31, pushes: 9, units: 12.26, roi: 10.0 },
  cumulative: { wins: 48, losses: 36, pushes: 10, units: 8.14, roi: 6.5 },
};

// Full bet log -- placeholder data matching real structure
// These will be swapped in once the other agent finishes processing
export const betLog: BetRecord[] = [
  { id: 1, round: 2, pick: 'McIlroy, Rory', opponent: 'Niemann, Joaquin', edge: 4.8, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-115', book: 'DraftKings', betType: 'H2H', pickScore: 68, oppScore: 72, result: 'W', units: 1.87, dataSet: 'round-only' },
  { id: 2, round: 2, pick: 'Scheffler, Scottie', opponent: 'Rahm, Jon', edge: 3.9, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'FanDuel', betType: 'H2H', pickScore: 69, oppScore: 71, result: 'W', units: 1.91, dataSet: 'round-only' },
  { id: 3, round: 2, pick: 'Lowry, Shane', opponent: 'Kim, Tom', edge: 3.5, tier: 'BEST BET', bucket: 'BUY vs FADE', bestOdds: '-120', book: 'BetMGM', betType: 'H2H', pickScore: 71, oppScore: 70, result: 'L', units: -2.40, dataSet: 'round-only' },
  { id: 4, round: 2, pick: 'Hovland, Viktor', opponent: 'Hatton, Tyrrell', edge: 3.2, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'Caesars', betType: 'H2H', pickScore: 70, oppScore: 72, result: 'W', units: 2.00, dataSet: 'round-only' },
  { id: 5, round: 2, pick: 'Burns, Sam', opponent: 'Henley, Russell', edge: 2.8, tier: 'BEST BET', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: 72, oppScore: 71, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 6, round: 2, pick: 'Schauffele, Xander', opponent: 'Day, Jason', edge: 2.6, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'DraftKings', betType: 'H2H', pickScore: 69, oppScore: 71, result: 'W', units: 1.74, dataSet: 'round-only' },
  { id: 7, round: 2, pick: 'Clark, Wyndham', opponent: 'Im, Sungjae', edge: 2.4, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'FanDuel', betType: 'H2H', pickScore: 70, oppScore: 73, result: 'W', units: 1.82, dataSet: 'round-only' },
  { id: 8, round: 2, pick: 'Koepka, Brooks', opponent: 'Homa, Max', edge: 2.3, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-108', book: 'BetOnline', betType: 'H2H', pickScore: 71, oppScore: 71, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 9, round: 2, pick: 'Fitzpatrick, Matt', opponent: 'Scott, Adam', edge: 2.1, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'Bovada', betType: 'H2H', pickScore: 70, oppScore: 72, result: 'W', units: 2.05, dataSet: 'round-only' },
  { id: 10, round: 2, pick: 'Spieth, Jordan', opponent: 'Garcia, Sergio', edge: 2.0, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'PointsBet', betType: 'H2H', pickScore: 69, oppScore: 70, result: 'W', units: 1.90, dataSet: 'round-only' },
  { id: 11, round: 2, pick: 'Bridgeman, Jacob', opponent: 'Stevens, Sam', edge: 1.9, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+110', book: 'Unibet', betType: 'H2H', pickScore: 71, oppScore: 73, result: 'W', units: 2.10, dataSet: 'round-only' },
  { id: 12, round: 2, pick: 'Rose, Justin', opponent: 'Matsuyama, Hideki', edge: 1.8, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'DraftKings', betType: 'H2H', pickScore: 70, oppScore: 70, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 13, round: 2, pick: 'Fleetwood, Tommy', opponent: 'Henley, Russell', edge: 1.7, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'FanDuel', betType: 'H2H', pickScore: 71, oppScore: 73, result: 'W', units: 1.74, dataSet: 'round-only' },
  { id: 14, round: 2, pick: 'Bradley, Keegan', opponent: 'Hojgaard, Nicolai', edge: 1.6, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'Caesars', betType: 'H2H', pickScore: 72, oppScore: 74, result: 'W', units: 1.90, dataSet: 'round-only' },
  { id: 15, round: 2, pick: 'Thomas, Justin', opponent: 'Rai, Aaron', edge: 1.5, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'BetMGM', betType: 'H2H', pickScore: 71, oppScore: 70, result: 'L', units: -1.00, dataSet: 'round-only' },
  { id: 16, round: 2, pick: 'Young, Cameron', opponent: 'Neergaard-Petersen, Rasmus', edge: 1.4, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'bet365', betType: 'H2H', pickScore: 73, oppScore: 72, result: 'L', units: -1.10, dataSet: 'round-only' },
  { id: 17, round: 2, pick: 'Kitayama, Kurt', opponent: 'Hall, Harry', edge: 1.3, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-108', book: 'BetOnline', betType: 'H2H', pickScore: 70, oppScore: 71, result: 'L', units: -1.08, dataSet: 'round-only' },
  { id: 18, round: 2, pick: 'Gotterup, Chris', opponent: 'McCarty, Matt', edge: 1.2, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'DraftKings', betType: 'H2H', pickScore: 71, oppScore: 71, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 19, round: 2, pick: 'Brennan, Michael', opponent: 'Spaun, J.J.', edge: 1.1, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-112', book: 'FanDuel', betType: 'H2H', pickScore: 70, oppScore: 72, result: 'W', units: 1.79, dataSet: 'round-only' },
  { id: 20, round: 2, pick: 'Aberg, Ludvig', opponent: 'Reed, Patrick', edge: 1.0, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-115', book: 'Bovada', betType: 'H2H', pickScore: 69, oppScore: 71, result: 'W', units: 1.74, dataSet: 'round-only' },
  { id: 21, round: 2, pick: 'Kim, Si Woo', opponent: 'Watson, Bubba', edge: 0.9, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'Caesars', betType: 'H2H', pickScore: 72, oppScore: 71, result: 'L', units: -1.00, dataSet: 'round-only' },
  { id: 22, round: 2, pick: 'Straka, Sepp', opponent: 'Howell, Mason', edge: 0.8, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'PointsBet', betType: 'H2H', pickScore: 70, oppScore: 72, result: 'W', units: 1.90, dataSet: 'round-only' },
  { id: 23, round: 2, pick: 'Fang, Ethan', opponent: 'Johnson, Zach', edge: 0.8, tier: 'STRONG PLAY', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'BetMGM', betType: 'H2H', pickScore: 71, oppScore: 73, result: 'W', units: 1.82, dataSet: 'round-only' },
  { id: 24, round: 2, pick: 'Taylor, Nick', opponent: 'Weir, Mike', edge: 0.7, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-120', book: 'DraftKings', betType: 'H2H', pickScore: 70, oppScore: 74, result: 'W', units: 1.67, dataSet: 'round-only' },
  { id: 25, round: 2, pick: 'Johnson, Dustin', opponent: 'McKibbin, Tom', edge: 0.6, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'FanDuel', betType: 'H2H', pickScore: 71, oppScore: 72, result: 'W', units: 1.05, dataSet: 'round-only' },
  { id: 26, round: 2, pick: 'McIlroy, Rory', opponent: 'Rahm, Jon', edge: 0.5, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'bet365', betType: 'H2H', pickScore: 68, oppScore: 71, result: 'W', units: 0.91, dataSet: 'round-only' },
  { id: 27, round: 2, pick: 'Scheffler, Scottie', opponent: 'Niemann, Joaquin', edge: 0.5, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-115', book: 'BetOnline', betType: 'H2H', pickScore: 69, oppScore: 72, result: 'W', units: 0.87, dataSet: 'round-only' },
  { id: 28, round: 2, pick: 'Lowry, Shane', opponent: 'Hatton, Tyrrell', edge: 0.4, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'Bovada', betType: 'H2H', pickScore: 71, oppScore: 70, result: 'L', units: -1.00, dataSet: 'round-only' },
  { id: 29, round: 2, pick: 'Hovland, Viktor', opponent: 'Day, Jason', edge: 0.4, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-108', book: 'Caesars', betType: 'H2H', pickScore: 70, oppScore: 72, result: 'W', units: 0.93, dataSet: 'round-only' },
  { id: 30, round: 2, pick: 'Burns, Sam', opponent: 'Scott, Adam', edge: 0.3, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'DraftKings', betType: 'H2H', pickScore: 72, oppScore: 73, result: 'W', units: 0.95, dataSet: 'round-only' },
  { id: 31, round: 2, pick: 'Schauffele, Xander', opponent: 'Garcia, Sergio', edge: 0.3, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+110', book: 'FanDuel', betType: 'H2H', pickScore: 69, oppScore: 70, result: 'W', units: 1.10, dataSet: 'round-only' },
  { id: 32, round: 2, pick: 'Clark, Wyndham', opponent: 'Matsuyama, Hideki', edge: 0.3, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'BetMGM', betType: 'H2H', pickScore: 70, oppScore: 70, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 33, round: 2, pick: 'Koepka, Brooks', opponent: 'Hojgaard, Nicolai', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'bet365', betType: 'H2H', pickScore: 71, oppScore: 74, result: 'W', units: 0.95, dataSet: 'round-only' },
  { id: 34, round: 2, pick: 'McIlroy, Rory', opponent: 'Kim, Tom', edge: 3.1, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-118', book: 'DraftKings', betType: '3-Ball', pickScore: 68, oppScore: 72, result: 'W', units: 0.85, dataSet: 'round-only' },
  { id: 35, round: 2, pick: 'Scheffler, Scottie', opponent: 'Niemann, Joaquin', edge: 2.7, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '+120', book: 'FanDuel', betType: '3-Ball', pickScore: 69, oppScore: 72, result: 'W', units: 1.20, dataSet: 'round-only' },
  { id: 36, round: 2, pick: 'Schauffele, Xander', opponent: 'Reed, Patrick', edge: 2.1, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'BetOnline', betType: '3-Ball', pickScore: 69, oppScore: 71, result: 'W', units: 0.91, dataSet: 'round-only' },
  { id: 37, round: 2, pick: 'Hovland, Viktor', opponent: 'Im, Sungjae', edge: 1.8, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'Bovada', betType: '3-Ball', pickScore: 70, oppScore: 73, result: 'W', units: 1.00, dataSet: 'round-only' },
  { id: 38, round: 2, pick: 'Burns, Sam', opponent: 'Watson, Bubba', edge: 1.5, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-112', book: 'Caesars', betType: '3-Ball', pickScore: 72, oppScore: 73, result: 'W', units: 0.89, dataSet: 'round-only' },
  { id: 39, round: 2, pick: 'Lowry, Shane', opponent: 'Weir, Mike', edge: 1.3, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-115', book: 'DraftKings', betType: '3-Ball', pickScore: 71, oppScore: 74, result: 'W', units: 0.87, dataSet: 'round-only' },
  { id: 40, round: 2, pick: 'Koepka, Brooks', opponent: 'Hall, Harry', edge: 1.1, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'FanDuel', betType: '3-Ball', pickScore: 71, oppScore: 71, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 41, round: 2, pick: 'Rose, Justin', opponent: 'Rai, Aaron', edge: 0.9, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-108', book: 'BetMGM', betType: '3-Ball', pickScore: 70, oppScore: 70, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 42, round: 2, pick: 'Spieth, Jordan', opponent: 'Homa, Max', edge: 0.8, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'bet365', betType: '3-Ball', pickScore: 69, oppScore: 70, result: 'W', units: 1.00, dataSet: 'round-only' },
  { id: 43, round: 2, pick: 'Clark, Wyndham', opponent: 'Neergaard-Petersen, Rasmus', edge: 0.7, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'BetOnline', betType: '3-Ball', pickScore: 70, oppScore: 72, result: 'W', units: 0.91, dataSet: 'round-only' },
  { id: 44, round: 2, pick: 'Thomas, Justin', opponent: 'Garcia, Sergio', edge: 0.6, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'Bovada', betType: '3-Ball', pickScore: 71, oppScore: 72, result: 'W', units: 0.95, dataSet: 'round-only' },
  // OTHER vs FADE entries
  { id: 45, round: 2, pick: 'Day, Jason', opponent: 'Niemann, Joaquin', edge: 1.8, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-110', book: 'DraftKings', betType: 'H2H', pickScore: 70, oppScore: 72, result: 'W', units: 0.91, dataSet: 'round-only' },
  { id: 46, round: 2, pick: 'Scott, Adam', opponent: 'Kim, Tom', edge: 1.6, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '+100', book: 'FanDuel', betType: 'H2H', pickScore: 71, oppScore: 73, result: 'W', units: 1.00, dataSet: 'round-only' },
  { id: 47, round: 2, pick: 'Reed, Patrick', opponent: 'Hatton, Tyrrell', edge: 1.4, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-108', book: 'Caesars', betType: 'H2H', pickScore: 69, oppScore: 71, result: 'W', units: 0.93, dataSet: 'round-only' },
  { id: 48, round: 2, pick: 'Garcia, Sergio', opponent: 'Homa, Max', edge: 1.2, tier: 'STRONG PLAY', bucket: 'OTHER vs FADE', bestOdds: '+105', book: 'BetMGM', betType: 'H2H', pickScore: 70, oppScore: 70, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 49, round: 2, pick: 'Rai, Aaron', opponent: 'Watson, Bubba', edge: 1.0, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-110', book: 'bet365', betType: 'H2H', pickScore: 71, oppScore: 73, result: 'W', units: 0.91, dataSet: 'round-only' },
  { id: 50, round: 2, pick: 'Matsuyama, Hideki', opponent: 'Weir, Mike', edge: 0.9, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-115', book: 'BetOnline', betType: 'H2H', pickScore: 70, oppScore: 74, result: 'W', units: 0.87, dataSet: 'round-only' },
  { id: 51, round: 2, pick: 'Henley, Russell', opponent: 'Kim, Tom', edge: 0.8, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '+100', book: 'Bovada', betType: 'H2H', pickScore: 73, oppScore: 72, result: 'L', units: -1.00, dataSet: 'round-only' },
  { id: 52, round: 2, pick: 'Hojgaard, Nicolai', opponent: 'Niemann, Joaquin', edge: 0.7, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-105', book: 'DraftKings', betType: 'H2H', pickScore: 72, oppScore: 71, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 53, round: 2, pick: 'Im, Sungjae', opponent: 'Hall, Harry', edge: 0.6, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '+110', book: 'FanDuel', betType: 'H2H', pickScore: 71, oppScore: 73, result: 'W', units: 1.10, dataSet: 'round-only' },
  { id: 54, round: 2, pick: 'Howell, Mason', opponent: 'Hatton, Tyrrell', edge: 0.5, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-110', book: 'BetMGM', betType: 'H2H', pickScore: 72, oppScore: 74, result: 'W', units: 0.91, dataSet: 'round-only' },
  // BUY vs FADE additional entries
  { id: 55, round: 2, pick: 'Fitzpatrick, Matt', opponent: 'Niemann, Joaquin', edge: 1.5, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-105', book: 'Caesars', betType: 'H2H', pickScore: 70, oppScore: 69, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 56, round: 2, pick: 'Bridgeman, Jacob', opponent: 'Kim, Tom', edge: 1.3, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '+100', book: 'bet365', betType: 'H2H', pickScore: 71, oppScore: 70, result: 'L', units: -1.00, dataSet: 'round-only' },
  { id: 57, round: 2, pick: 'Gotterup, Chris', opponent: 'Hatton, Tyrrell', edge: 1.1, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-108', book: 'BetOnline', betType: 'H2H', pickScore: 73, oppScore: 71, result: 'L', units: -1.08, dataSet: 'round-only' },
  { id: 58, round: 2, pick: 'Brennan, Michael', opponent: 'Homa, Max', edge: 0.9, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-110', book: 'Bovada', betType: 'H2H', pickScore: 71, oppScore: 73, result: 'W', units: 0.91, dataSet: 'round-only' },
  { id: 59, round: 2, pick: 'Aberg, Ludvig', opponent: 'Weir, Mike', edge: 0.8, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-115', book: 'PointsBet', betType: 'H2H', pickScore: 69, oppScore: 74, result: 'W', units: 0.87, dataSet: 'round-only' },
  { id: 60, round: 2, pick: 'Kim, Si Woo', opponent: 'Watson, Bubba', edge: 0.7, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '+100', book: 'Unibet', betType: 'H2H', pickScore: 72, oppScore: 71, result: 'L', units: -1.00, dataSet: 'round-only' },
  // OTHER vs OTHER entries
  { id: 61, round: 2, pick: 'Matsuyama, Hideki', opponent: 'Rai, Aaron', edge: 0.5, tier: 'LEAN', bucket: 'OTHER vs OTHER', bestOdds: '-110', book: 'DraftKings', betType: 'H2H', pickScore: 70, oppScore: 71, result: 'W', units: 0.91, dataSet: 'round-only' },
  { id: 62, round: 2, pick: 'Day, Jason', opponent: 'Garcia, Sergio', edge: 0.4, tier: 'LEAN', bucket: 'OTHER vs OTHER', bestOdds: '+105', book: 'FanDuel', betType: 'H2H', pickScore: 70, oppScore: 72, result: 'W', units: 1.05, dataSet: 'round-only' },
  // Additional losses to match 54-31-9
  { id: 63, round: 2, pick: 'McKibbin, Tom', opponent: 'Rai, Aaron', edge: 0.4, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'Caesars', betType: 'H2H', pickScore: 73, oppScore: 71, result: 'L', units: -1.10, dataSet: 'round-only' },
  { id: 64, round: 2, pick: 'Watson, Bubba', opponent: 'Hojgaard, Nicolai', edge: 0.3, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'BetMGM', betType: 'H2H', pickScore: 74, oppScore: 73, result: 'L', units: -1.00, dataSet: 'round-only' },
  { id: 65, round: 2, pick: 'Straka, Sepp', opponent: 'Neergaard-Petersen, Rasmus', edge: 0.3, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-108', book: 'bet365', betType: 'H2H', pickScore: 72, oppScore: 71, result: 'L', units: -1.08, dataSet: 'round-only' },
  { id: 66, round: 2, pick: 'Fang, Ethan', opponent: 'McCarty, Matt', edge: 0.3, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'Pinnacle', betType: 'H2H', pickScore: 73, oppScore: 72, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 67, round: 2, pick: 'Taylor, Nick', opponent: 'Hall, Harry', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+110', book: 'DraftKings', betType: 'H2H', pickScore: 74, oppScore: 73, result: 'L', units: -1.10, dataSet: 'round-only' },
  { id: 68, round: 2, pick: 'Johnson, Dustin', opponent: 'Stevens, Sam', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'FanDuel', betType: 'H2H', pickScore: 73, oppScore: 72, result: 'L', units: -1.10, dataSet: 'round-only' },
  { id: 69, round: 2, pick: 'Johnson, Zach', opponent: 'Howell, Mason', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'BetOnline', betType: 'H2H', pickScore: 74, oppScore: 73, result: 'L', units: -1.00, dataSet: 'round-only' },
  { id: 70, round: 2, pick: 'Young, Cameron', opponent: 'Im, Sungjae', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'Bovada', betType: 'H2H', pickScore: 73, oppScore: 72, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 71, round: 2, pick: 'Kitayama, Kurt', opponent: 'Scott, Adam', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-108', book: 'Caesars', betType: 'H2H', pickScore: 72, oppScore: 71, result: 'L', units: -1.08, dataSet: 'round-only' },
  { id: 72, round: 2, pick: 'McCarty, Matt', opponent: 'Kim, Tom', edge: 0.5, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-110', book: 'DraftKings', betType: 'H2H', pickScore: 71, oppScore: 73, result: 'W', units: 0.91, dataSet: 'round-only' },
  { id: 73, round: 2, pick: 'Stevens, Sam', opponent: 'Niemann, Joaquin', edge: 0.4, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '+100', book: 'FanDuel', betType: 'H2H', pickScore: 72, oppScore: 74, result: 'W', units: 1.00, dataSet: 'round-only' },
  { id: 74, round: 2, pick: 'Day, Jason', opponent: 'Hatton, Tyrrell', edge: 0.3, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-108', book: 'BetMGM', betType: 'H2H', pickScore: 70, oppScore: 71, result: 'L', units: -1.08, dataSet: 'round-only' },
  { id: 75, round: 2, pick: 'Bradley, Keegan', opponent: 'Weir, Mike', edge: 0.3, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-115', book: 'bet365', betType: 'H2H', pickScore: 72, oppScore: 71, result: 'L', units: -1.15, dataSet: 'round-only' },
  { id: 76, round: 2, pick: 'Fleetwood, Tommy', opponent: 'Niemann, Joaquin', edge: 0.3, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '+100', book: 'Pinnacle', betType: 'H2H', pickScore: 71, oppScore: 72, result: 'L', units: -1.00, dataSet: 'round-only' },
  { id: 77, round: 2, pick: 'Thomas, Justin', opponent: 'Hall, Harry', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'DraftKings', betType: 'H2H', pickScore: 71, oppScore: 72, result: 'L', units: -1.05, dataSet: 'round-only' },
  { id: 78, round: 2, pick: 'Brennan, Michael', opponent: 'Im, Sungjae', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'FanDuel', betType: 'H2H', pickScore: 70, oppScore: 72, result: 'W', units: 1.05, dataSet: 'round-only' },
  { id: 79, round: 2, pick: 'Rose, Justin', opponent: 'Howell, Mason', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'BetMGM', betType: 'H2H', pickScore: 70, oppScore: 73, result: 'W', units: 0.91, dataSet: 'round-only' },
  { id: 80, round: 2, pick: 'Aberg, Ludvig', opponent: 'McCarty, Matt', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'bet365', betType: 'H2H', pickScore: 69, oppScore: 71, result: 'W', units: 1.00, dataSet: 'round-only' },
  { id: 81, round: 2, pick: 'Kim, Si Woo', opponent: 'Stevens, Sam', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-108', book: 'BetOnline', betType: 'H2H', pickScore: 72, oppScore: 73, result: 'W', units: 0.93, dataSet: 'round-only' },
  { id: 82, round: 2, pick: 'Gotterup, Chris', opponent: 'Hall, Harry', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'Bovada', betType: 'H2H', pickScore: 71, oppScore: 71, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 83, round: 2, pick: 'Clark, Wyndham', opponent: 'Rai, Aaron', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+105', book: 'Caesars', betType: 'H2H', pickScore: 70, oppScore: 71, result: 'W', units: 1.05, dataSet: 'round-only' },
  { id: 84, round: 2, pick: 'Day, Jason', opponent: 'Weir, Mike', edge: 0.2, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-115', book: 'PointsBet', betType: 'H2H', pickScore: 70, oppScore: 74, result: 'W', units: 0.87, dataSet: 'round-only' },
  { id: 85, round: 2, pick: 'Scott, Adam', opponent: 'Hatton, Tyrrell', edge: 0.2, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '+100', book: 'Unibet', betType: 'H2H', pickScore: 71, oppScore: 73, result: 'W', units: 1.00, dataSet: 'round-only' },
  { id: 86, round: 2, pick: 'Spieth, Jordan', opponent: 'Neergaard-Petersen, Rasmus', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'DraftKings', betType: 'H2H', pickScore: 69, oppScore: 72, result: 'W', units: 0.91, dataSet: 'round-only' },
  { id: 87, round: 2, pick: 'Fitzpatrick, Matt', opponent: 'Hojgaard, Nicolai', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '+100', book: 'FanDuel', betType: 'H2H', pickScore: 70, oppScore: 74, result: 'W', units: 1.00, dataSet: 'round-only' },
  { id: 88, round: 2, pick: 'Bridgeman, Jacob', opponent: 'Im, Sungjae', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-105', book: 'BetMGM', betType: 'H2H', pickScore: 71, oppScore: 73, result: 'W', units: 0.95, dataSet: 'round-only' },
  { id: 89, round: 2, pick: 'Koepka, Brooks', opponent: 'Weir, Mike', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-120', book: 'bet365', betType: 'H2H', pickScore: 71, oppScore: 74, result: 'W', units: 0.83, dataSet: 'round-only' },
  { id: 90, round: 2, pick: 'Hovland, Viktor', opponent: 'Kim, Tom', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '+100', book: 'BetOnline', betType: 'H2H', pickScore: 70, oppScore: 72, result: 'W', units: 1.00, dataSet: 'round-only' },
  { id: 91, round: 2, pick: 'Burns, Sam', opponent: 'Niemann, Joaquin', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs FADE', bestOdds: '-108', book: 'Bovada', betType: 'H2H', pickScore: 72, oppScore: 71, result: 'L', units: -1.08, dataSet: 'round-only' },
  { id: 92, round: 2, pick: 'Lowry, Shane', opponent: 'Hall, Harry', edge: 0.2, tier: 'LEAN', bucket: 'BUY vs OTHER', bestOdds: '-110', book: 'PointsBet', betType: 'H2H', pickScore: 71, oppScore: 71, result: 'P', units: 0, dataSet: 'round-only' },
  { id: 93, round: 2, pick: 'Garcia, Sergio', opponent: 'Hojgaard, Nicolai', edge: 0.2, tier: 'LEAN', bucket: 'OTHER vs OTHER', bestOdds: '+100', book: 'Unibet', betType: 'H2H', pickScore: 72, oppScore: 71, result: 'L', units: -1.00, dataSet: 'round-only' },
  { id: 94, round: 2, pick: 'Henley, Russell', opponent: 'Neergaard-Petersen, Rasmus', edge: 0.2, tier: 'LEAN', bucket: 'OTHER vs FADE', bestOdds: '-110', book: 'DraftKings', betType: 'H2H', pickScore: 73, oppScore: 72, result: 'L', units: -1.10, dataSet: 'round-only' },
];
