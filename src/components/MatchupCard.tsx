/**
 * MatchupCard — THE single canonical matchup-card template for the site.
 *
 * EVERY surface that renders a head-to-head matchup card (the current-round
 * Matchups page, the next-round R4 preview, future event-overview cards,
 * anywhere) uses THIS component. No exceptions. No copy-paste card JSX
 * anywhere else. If a card layout needs to change, this file is the only
 * file that gets edited.
 *
 * Build-time guard: `scripts/verify-matchup-card-singleton.ts` runs on
 * every build and fails loud if any other component file defines its own
 * matchup card markup (looks for the canonical class strings + "Matchup
 * Score" label outside this file).
 *
 * Why this exists: 2026-06-07 Chris caught the R4 cards displaying unit
 * size in the top-right corner instead of the "Cumulative data" dataset
 * chip. Root cause: I had two copies of the card JSX (one in MatchupsView,
 * one in NextRoundPreview) and they drifted. Two sources of truth →
 * inevitable inconsistency. One template + slots fixes it permanently.
 */
import type { ReactNode } from 'react';
import type { PlayerData } from '../types';

type MatchupTier = 'BEST BET' | 'STRONG PLAY' | 'LEAN';
import { starsForEdge } from '../lib/sizing';
import { signalTextColorClass } from '../lib/signalDisplay';
import { formatPlayerName } from '../lib/formatName';
import SignalBadge from './SignalBadge';
import PurityIcon from './PurityIcon';
import Avatar from './Avatar';

const fmtXScore = (v: number) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2));

export interface MatchupCardProps {
  /** Numeric edge / matchup score (e.g. 2.45). Drives the star count + Best Bet flag. */
  matchupScore: number;
  /** Matchup tier — BEST BET / STRONG PLAY / LEAN. Drives the Best Bet pill. */
  tier: MatchupTier;
  /** The picked player (higher X-Score side). */
  pick: PlayerData;
  /** The fade / opponent side. */
  opponent: PlayerData;
  /** Best odds string (American format) for the pick side, e.g. "-150". */
  bestOdds: string;
  /** Element to render for the sportsbook link/badge after bestOdds. */
  sportsbookLink: ReactNode;
  /** Top-right slot chip — e.g. "Round 2 data", "Cumulative data". Hide by passing null. */
  datasetChip: ReactNode | null;
  /** Hide Signal Badge + Purity icon under each player name. Pre-R1 = true. */
  hideSignal?: boolean;
  /** Render Double Signal pill next to stars when true. */
  doubleSignal?: boolean;
  /** Optional wrappers for the player name (e.g. ClickablePlayerName for popup behavior). */
  renderPickName?: (player: PlayerData) => ReactNode;
  renderOpponentName?: (player: PlayerData) => ReactNode;
}

export default function MatchupCard({
  matchupScore,
  tier,
  pick,
  opponent,
  bestOdds,
  sportsbookLink,
  datasetChip,
  hideSignal = false,
  doubleSignal = false,
  renderPickName,
  renderOpponentName,
}: MatchupCardProps) {
  const stars = starsForEdge(matchupScore);
  return (
    <div className="bg-[#0a0a0a] border border-[#262626] border-l-4 border-l-[#22c55e] rounded-lg p-4 hover:bg-[#111111] transition-colors">
      {/* Top row — matchup score + stars + flags on the left, dataset chip on the right. */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium font-['Inter',system-ui,sans-serif]">
            Matchup Score
          </span>
          <span className="text-sm font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#22c55e]">
            {matchupScore.toFixed(2)}
          </span>
          <span
            className={`text-[#22c55e] text-sm tracking-tight ${stars === 5 ? 'star-glow' : ''}`}
            title={`${stars}-star play`}
            aria-label={`${stars} star play`}
          >
            {'★'.repeat(stars)}
          </span>
          {/* Best Bet pill always shows first when the matchup clears the
              floor. Double Signal pill renders to its RIGHT when both views
              flagged the pair (per Chris's spec — two green pills side by
              side, Best Bet first). */}
          {tier === 'BEST BET' && (
            <span className="text-[9px] uppercase tracking-wider font-bold font-['Inter',system-ui,sans-serif] bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/40 rounded-full px-2 py-0.5">
              Best Bet
            </span>
          )}
          {doubleSignal && (
            <span
              className="text-[9px] uppercase tracking-wider font-bold font-['Inter',system-ui,sans-serif] bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/40 rounded-full px-2 py-0.5"
              title="Both round-only AND cumulative datasets flagged this matchup."
            >
              Double Signal
            </span>
          )}
        </div>
        {datasetChip && (
          <span className="text-[9px] uppercase tracking-wider font-medium font-['Inter',system-ui,sans-serif] bg-[#1a1a1a] text-[#a1a1aa] rounded-full px-2 py-0.5">
            {datasetChip}
          </span>
        )}
      </div>

      <div className="border-t border-[#1a1a1a] mb-3" />

      {/* Players row. Same vertical stack order on both sides. */}
      <div className="flex items-start justify-between gap-4">
        {/* Pick (left) */}
        <div className="flex-1 flex items-start gap-2 min-w-0">
          <Avatar playerName={pick.player_name} size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif] leading-snug">
              {renderPickName ? renderPickName(pick) : formatPlayerName(pick.player_name)}
            </div>
            <div className={`mt-1 text-xs font-['JetBrains_Mono','SF_Mono',monospace] ${signalTextColorClass(pick.signal, pick.purity === 'CONFLICTED')}`}>
              X Score: {fmtXScore(pick.x_score)}
            </div>
            {!hideSignal && (
              <div className="mt-1 flex items-center gap-2">
                <SignalBadge signal={pick.signal} compact conflicted={pick.purity === 'CONFLICTED'} />
                <PurityIcon player={pick} />
              </div>
            )}
          </div>
        </div>

        <div className="text-[#d4d4d4] text-xs font-bold font-['Inter',system-ui,sans-serif] shrink-0 mt-1">
          vs
        </div>

        {/* Opponent (right) — mirrored layout, identical stack order. */}
        <div className="flex-1 flex items-start gap-2 justify-end min-w-0">
          <div className="min-w-0 text-right">
            <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif] leading-snug">
              {renderOpponentName ? renderOpponentName(opponent) : formatPlayerName(opponent.player_name)}
            </div>
            <div className={`mt-1 text-xs font-['JetBrains_Mono','SF_Mono',monospace] ${signalTextColorClass(opponent.signal, opponent.purity === 'CONFLICTED')}`}>
              X Score: {fmtXScore(opponent.x_score)}
            </div>
            {!hideSignal && (
              <div className="mt-1 flex items-center justify-end gap-2">
                <SignalBadge signal={opponent.signal} compact conflicted={opponent.purity === 'CONFLICTED'} />
                <PurityIcon player={opponent} align="right" />
              </div>
            )}
          </div>
          <Avatar playerName={opponent.player_name} size="sm" />
        </div>
      </div>

      {/* Best odds row. */}
      <div className="border-t border-[#1a1a1a] mt-3 pt-3">
        <div className="text-xs font-['Inter',system-ui,sans-serif]">
          <span className="text-[#d4d4d4]">Best Odds: </span>
          <span className="text-[#f5f5f5] font-bold font-['JetBrains_Mono','SF_Mono',monospace]">{bestOdds}</span>
          {' '}{sportsbookLink}
        </div>
      </div>
    </div>
  );
}
