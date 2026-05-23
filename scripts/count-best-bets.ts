#!/usr/bin/env tsx
/**
 * Count Best Bets at the current event's venue threshold. Prints just the
 * integer count to stdout (so callers can parse it cleanly).
 *
 * Best Bet = matchup whose X-Score edge (pick.x_score - opp.x_score) is
 * at or above the venue's recommendedFloor.
 *
 * Used by scripts/auto-roll.ts to detect when new Best Bets appear so we
 * can fire a Discord + email notification.
 */
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PROJECT_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

async function main(): Promise<void> {
  const { currentEvent } = await import(join(PROJECT_ROOT, 'src/config/event.ts'));
  // Use cumulative X scores — matches what the matchups page displays
  // and computes edges against. rankingsRound (round-only) gives a
  // different and incorrect number.
  const players: { player_name: string; x_score: number }[] = currentEvent.rankingsCumulative;
  const matchups: { p1_player_name: string; p2_player_name: string }[] = currentEvent.matchups;
  const floor: number = currentEvent.recommendedFloor;

  const playerMap = new Map<string, number>();
  for (const p of players) playerMap.set(p.player_name, p.x_score);

  let count = 0;
  for (const m of matchups) {
    const x1 = playerMap.get(m.p1_player_name);
    const x2 = playerMap.get(m.p2_player_name);
    if (x1 == null || x2 == null) continue;
    const matchupScore = Math.abs(x1 - x2);
    if (matchupScore >= floor) count++;
  }

  // Just the number — no trailing text — so callers can parseInt it.
  process.stdout.write(`${count}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
