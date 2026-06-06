/**
 * SgPersistenceChart — how each SG category persists over a full season,
 * grouped into "Ball Striking" (the skill side: OTT + APP) vs the
 * "Short Game" (the variance side: ARG + PUTT).
 *
 * Data source: `src/data/sgPersistence.json` (committed research findings,
 * with notes on provenance). Edit the JSON to update — never hardcode here.
 */
import sgPersistence from '../data/sgPersistence.json';

interface Row {
  label: string;
  fullName: string;
  group: 'ball-striking' | 'short-game';
  r: number;
  caption: string;
}

const ROWS: Row[] = sgPersistence.rows as Row[];
const MAX_R = sgPersistence.max_r_axis;

export default function SgPersistenceChart() {
  const ballStriking = ROWS.filter((r) => r.group === 'ball-striking');
  const shortGame = ROWS.filter((r) => r.group === 'short-game');

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            How sticky is each skill?
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Year-over-year correlation (R) for each SG category across the PGA Tour.
            Higher = more skill, less regression. Ball striking sticks; the short game
            doesn&rsquo;t.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          PGA Tour Research
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ball Striking group */}
        <div className="bg-[#0a0a0a] border border-[#22c55e]/30 rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-wider text-[#22c55e] font-bold font-['Inter',system-ui,sans-serif] mb-1">
            Ball Striking
          </div>
          <div className="text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mb-3">
            The skill side. Persists season to season.
          </div>
          <div className="space-y-3">
            {ballStriking.map((row) => (
              <SkillBar key={row.label} row={row} accent="#22c55e" />
            ))}
          </div>
        </div>

        {/* Short Game group */}
        <div className="bg-[#0a0a0a] border border-[#525252]/30 rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-bold font-['Inter',system-ui,sans-serif] mb-1">
            Short Game
          </div>
          <div className="text-[10px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mb-3">
            The variance side. Regresses harder year-over-year.
          </div>
          <div className="space-y-3">
            {shortGame.map((row) => (
              <SkillBar key={row.label} row={row} accent="#737373" />
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mt-5">
        Every skill regresses to the mean over time. The question is{' '}
        <span className="text-[#f5f5f5] font-medium">how much</span>. A correlation of
        0.69 means a player&rsquo;s OTT performance this year predicts ~69% of their
        OTT performance next year &mdash; mostly skill. A correlation of 0.40 (ARG)
        means most of last year&rsquo;s number was variance, not skill. The X Score
        rewards ball striking and subtracts putting because of exactly this gap.
      </p>
    </div>
  );
}

function SkillBar({ row, accent }: { row: Row; accent: string }) {
  const width = (row.r / MAX_R) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 shrink-0">
        <div className="text-[11px] font-bold font-['Inter',system-ui,sans-serif]" style={{ color: accent }}>
          {row.label}
        </div>
      </div>
      <div className="flex-1 relative h-6 bg-[#1a1a1a] rounded-md overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-md"
          style={{
            width: `${width}%`,
            background: `linear-gradient(to right, ${accent}55, ${accent}cc)`,
          }}
        />
        <div className="absolute inset-0 flex items-center px-2 text-[10px] text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
          <span className="font-medium">{row.fullName}</span>
        </div>
      </div>
      <div className="w-12 shrink-0 text-right">
        <span className="text-xs font-bold font-['JetBrains_Mono','SF_Mono',monospace] tabular-nums" style={{ color: accent }}>
          {row.r.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
