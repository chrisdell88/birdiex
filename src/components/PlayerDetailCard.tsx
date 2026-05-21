import type { PlayerData } from '../types';
import StatBar from './StatBar';
import SignalBadge from './SignalBadge';
import Avatar from './Avatar';
import { currentEvent } from '../config/event';

interface PlayerDetailCardProps {
  player: PlayerData;
}

export default function PlayerDetailCard({ player }: PlayerDetailCardProps) {
  const stats = [
    { label: 'OTT', value: player.sg_ott },
    { label: 'APP', value: player.sg_app },
    { label: 'ARG', value: player.sg_arg },
    { label: 'PUTT', value: player.sg_putt },
  ];

  const layers = [
    { label: 'SG Score (L1)', value: player.sg_score_l1 },
    { label: 'History (L2)', value: player.course_history_l2 },
    { label: 'Fit (L3)', value: player.fit_plus_category_l3 },
    { label: 'Major (L4)', value: player.major_adj_l4 },
  ];

  const xScoreColor =
    player.x_score > 0 ? 'text-[#22c55e]' : player.x_score < 0 ? 'text-red-400' : 'text-[#f5f5f5]';
  const xScoreText = `${player.x_score > 0 ? '+' : ''}${player.x_score.toFixed(4)}`;

  return (
    <tr>
      <td colSpan={13} className="px-0 py-0">
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg mx-3 sm:mx-4 my-2 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
              {currentEvent.picksRound > 1 ? `R${currentEvent.picksRound - 1} Data` : 'Pre-Tournament'}
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Player header — compact strip on mobile, side column on desktop */}
            <div className="md:w-48 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar playerName={player.player_name} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[#f5f5f5] text-base font-semibold font-['Inter',system-ui,sans-serif] leading-snug truncate md:whitespace-normal">
                    {player.player_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 md:mt-2 text-sm text-[#d4d4d4]">
                    <span>{player.position}</span>
                    <span className="text-[#262626]">|</span>
                    <span className="font-['JetBrains_Mono','SF_Mono',monospace]">
                      {player.score_to_par > 0 ? `+${player.score_to_par}` : player.score_to_par === 0 ? 'E' : player.score_to_par}
                    </span>
                  </div>
                </div>
                {/* X Score — inline on the right on mobile */}
                <div className="text-right shrink-0 md:hidden">
                  <div className="text-[10px] uppercase tracking-wider text-[#d4d4d4] font-['Inter',system-ui,sans-serif]">
                    X Score
                  </div>
                  <div className={`text-lg font-bold font-['JetBrains_Mono','SF_Mono',monospace] leading-tight ${xScoreColor}`}>
                    {xScoreText}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <SignalBadge signal={player.signal} conflicted={player.purity === 'CONFLICTED'} />
              </div>
              {/* X Score — block below on desktop */}
              <div className="hidden md:block mt-4">
                <span className="text-[#d4d4d4] text-xs uppercase tracking-wider font-['Inter',system-ui,sans-serif]">
                  X Score
                </span>
                <div className={`text-2xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] mt-0.5 ${xScoreColor}`}>
                  {xScoreText}
                </div>
              </div>
            </div>

            {/* SG Stats */}
            <div className="flex-1">
              <h4 className="text-[#d4d4d4] text-xs uppercase tracking-wider mb-2 font-['Inter',system-ui,sans-serif]">
                Strokes Gained Breakdown
              </h4>
              <div className="space-y-0.5">
                {stats.map((s) => (
                  <StatBar key={s.label} label={s.label} value={s.value} />
                ))}
              </div>
            </div>

            {/* Model Layers */}
            <div className="flex-1">
              <h4 className="text-[#d4d4d4] text-xs uppercase tracking-wider mb-2 font-['Inter',system-ui,sans-serif]">
                X Score Layers
              </h4>
              <div className="space-y-0.5">
                {layers.map((l) => (
                  <StatBar key={l.label} label={l.label} value={l.value} min={-3} max={3} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
