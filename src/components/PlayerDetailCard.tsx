import type { PlayerData } from '../types';
import StatBar from './StatBar';
import SignalBadge from './SignalBadge';

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

  return (
    <tr>
      <td colSpan={10} className="px-0 py-0">
        <div className="bg-[#141414] border border-[#262626] rounded-lg mx-4 my-2 p-5">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Player info */}
            <div className="md:w-48 shrink-0">
              <h3 className="text-[#f5f5f5] text-lg font-semibold font-['Inter',system-ui,sans-serif]">
                {player.player_name}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[#a1a1aa] text-sm">{player.position}</span>
                <span className="text-[#52525b]">|</span>
                <span className="text-[#a1a1aa] text-sm font-['JetBrains_Mono','SF_Mono',monospace]">
                  {player.score_to_par > 0 ? `+${player.score_to_par}` : player.score_to_par === 0 ? 'E' : player.score_to_par}
                </span>
              </div>
              <div className="mt-3">
                <SignalBadge signal={player.signal} />
              </div>
              <div className="mt-4">
                <span className="text-[#52525b] text-xs uppercase tracking-wider font-['Inter',system-ui,sans-serif]">X Score</span>
                <div className={`text-2xl font-bold font-['JetBrains_Mono','SF_Mono',monospace] mt-0.5 ${
                  player.x_score > 0 ? 'text-green-400' : player.x_score < 0 ? 'text-red-400' : 'text-[#f5f5f5]'
                }`}>
                  {player.x_score > 0 ? '+' : ''}{player.x_score.toFixed(4)}
                </div>
              </div>
            </div>

            {/* SG Stats */}
            <div className="flex-1">
              <h4 className="text-[#52525b] text-xs uppercase tracking-wider mb-2 font-['Inter',system-ui,sans-serif]">
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
              <h4 className="text-[#52525b] text-xs uppercase tracking-wider mb-2 font-['Inter',system-ui,sans-serif]">
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
