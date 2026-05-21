/**
 * Shared all-time stats — computed once from the raw bet arrays using the
 * venue-aware tracked-bet floor. Both ResultsPage and MethodologyPage use
 * these so the banner numbers are guaranteed identical.
 *
 * "Tracked" = at or above the event's predictability-aware matchup score
 * threshold (per src/lib/sizing.ts). "Scored but not tracked" bets live in
 * the raw data files for internal backtesting; they don't appear in this
 * record.
 */
import type { BetRecord } from '../types';
import { unitsForEdge, stakeToWin1, isTrackedBet } from './sizing';
import { floorForEvent } from '../config/venues';
import { betLog } from '../data/resultsData';
import { r2Results } from '../data/pgaChampR2Results';
import { r3Results } from '../data/pgaChampR3Results';
import { r4Results } from '../data/pgaChampR4Results';

const mastersFloor = floorForEvent('masters-2026');
const pgaFloor = floorForEvent('pga-2026');

function summarise(bets: BetRecord[]) {
  let wins = 0, losses = 0, pushes = 0, units = 0, staked = 0;
  for (const b of bets) {
    if (b.result === 'W') wins++;
    else if (b.result === 'L') losses++;
    else pushes++;
    units += b.units;
    if (b.result !== 'P') staked += unitsForEdge(b.edge) * stakeToWin1(b.bestOdds);
  }
  return {
    wins,
    losses,
    pushes,
    bets: bets.length,
    units: +units.toFixed(2),
    staked: +staked.toFixed(2),
    roi: staked > 0 ? +((units / staked) * 100).toFixed(1) : 0,
  };
}

const mastersTracked = betLog.filter((b) => isTrackedBet(b.edge, mastersFloor.floor));
const pgaTracked = [...r2Results, ...r3Results, ...r4Results].filter((b) =>
  isTrackedBet(b.edge, pgaFloor.floor),
);

export const mastersStats = summarise(mastersTracked);
export const pgaStats = summarise(pgaTracked);

const allTimeBetsArr = [...mastersTracked, ...pgaTracked];
export const allTimeStats = summarise(allTimeBetsArr);
export const allTimeBets = allTimeBetsArr;
