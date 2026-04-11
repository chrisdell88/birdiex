import { useMemo } from 'react';
import type { PlayerData, Matchup } from '../types';
import SignalBadge from './SignalBadge';

interface MatchupsViewProps {
  data: PlayerData[];
}

function generateMatchups(data: PlayerData[]): Matchup[] {
  const buys = data.filter((p) =>
    ['STRONGEST BUY', 'STRONG BUY', 'BUY'].includes(p.signal)
  );
  const fades = data.filter((p) =>
    ['FADE', 'STRONG FADE', 'STRONGEST FADE'].includes(p.signal)
  );

  const matchups: Matchup[] = [];

  for (const buy of buys) {
    for (const fade of fades) {
      const edge = +(buy.x_score - fade.x_score).toFixed(4);
      if (edge >= 0.95) {
        let tier: Matchup['tier'] = 'LEAN';
        if (edge >= 3.0) tier = 'BEST BET';
        else if (edge >= 2.0) tier = 'STRONG PLAY';

        matchups.push({ player1: buy, player2: fade, edge, tier });
      }
    }
  }

  matchups.sort((a, b) => b.edge - a.edge);
  return matchups.slice(0, 20);
}

function formatScore(score: number): string {
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

const tierBorderColor: Record<Matchup['tier'], string> = {
  'BEST BET': 'border-l-green-500',
  'STRONG PLAY': 'border-l-[#006747]',
  'LEAN': 'border-l-gray-500',
};

const tierBadgeColor: Record<Matchup['tier'], string> = {
  'BEST BET': 'bg-green-500/15 text-green-400',
  'STRONG PLAY': 'bg-[#006747]/20 text-[#00a86b]',
  'LEAN': 'bg-gray-500/15 text-gray-400',
};

export default function MatchupsView({ data }: MatchupsViewProps) {
  const matchups = useMemo(() => generateMatchups(data), [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Matchup Recommendations
          </h2>
          <p className="text-sm text-[#52525b] mt-1 font-['Inter',system-ui,sans-serif]">
            Top matchups ranked by X Score edge differential
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] text-[#00a86b]">
            {matchups.length}
          </span>
          <span className="text-xs text-[#52525b] block uppercase tracking-wider font-['Inter',system-ui,sans-serif]">
            Matchups
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matchups.map((m, idx) => (
          <div
            key={idx}
            className={`bg-[#111111] border border-[#262626] border-l-4 ${tierBorderColor[m.tier]} rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium font-['Inter',system-ui,sans-serif] ${tierBadgeColor[m.tier]}`}>
                {m.tier}
              </span>
              <span className="text-xs text-[#52525b] font-['Inter',system-ui,sans-serif]">
                Edge:{' '}
                <span className="text-[#00a86b] font-bold font-['JetBrains_Mono','SF_Mono',monospace]">
                  {m.edge.toFixed(2)}
                </span>
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-[#262626] mb-3" />

            {/* Matchup */}
            <div className="flex items-center justify-between gap-4">
              {/* Player 1 */}
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                  {m.player1.player_name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-green-400">
                    X: {m.player1.x_score > 0 ? '+' : ''}{m.player1.x_score.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace]">
                    {m.player1.position} ({formatScore(m.player1.score_to_par)})
                  </span>
                </div>
                <div className="mt-2">
                  <SignalBadge signal={m.player1.signal} compact />
                </div>
              </div>

              {/* VS */}
              <div className="text-[#52525b] text-xs font-bold font-['Inter',system-ui,sans-serif] shrink-0">
                vs
              </div>

              {/* Player 2 */}
              <div className="flex-1 text-right">
                <div className="text-sm font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                  {m.player2.player_name}
                </div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-xs font-['JetBrains_Mono','SF_Mono',monospace] text-red-400">
                    X: {m.player2.x_score > 0 ? '+' : ''}{m.player2.x_score.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-xs text-[#a1a1aa] font-['JetBrains_Mono','SF_Mono',monospace]">
                    {m.player2.position} ({formatScore(m.player2.score_to_par)})
                  </span>
                </div>
                <div className="mt-2 flex justify-end">
                  <SignalBadge signal={m.player2.signal} compact />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
