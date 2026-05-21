/**
 * SgPersistenceChart — bar chart of year-over-year correlation for each
 * strokes-gained category. Complements PuttingRegressionChart (which shows
 * R1→R2 round-to-round) by displaying the BROADER, season-over-season
 * persistence — the timescale that actually drives the X Score's putting-
 * regression thesis.
 *
 * Numbers are widely cited PGA Tour research (DataGolf, FantasyNational,
 * @LouStagner, multiple academic studies).
 */

interface Row {
  label: string;
  fullName: string;
  r: number;
  caption: string;
}

const ROWS: Row[] = [
  { label: 'OTT',  fullName: 'Off-the-Tee',     r: 0.69, caption: 'A real, season-long skill' },
  { label: 'APP',  fullName: 'Approach',        r: 0.60, caption: 'Mostly skill, some variance' },
  { label: 'ARG',  fullName: 'Around the Green', r: 0.40, caption: 'Variance-heavy' },
  { label: 'PUTT', fullName: 'Putting',         r: 0.54, caption: 'Half regresses' },
];

const MAX_R = 0.8;

export default function SgPersistenceChart() {
  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
            Year-Over-Year SG Persistence
          </h3>
          <p className="text-[11px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] mt-0.5">
            Correlation (R) of each player&rsquo;s strokes-gained category from
            one season to the next, across the PGA Tour. Higher bars = more
            sustained skill, less regression.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          PGA Tour Research
        </span>
      </div>

      <div className="space-y-2 mt-4">
        {ROWS.map((row) => {
          const width = (row.r / MAX_R) * 100;
          return (
            <div key={row.label} className="flex items-center gap-3">
              <div className="w-12 shrink-0">
                <div className="text-[11px] font-bold text-[#22c55e] font-['Inter',system-ui,sans-serif]">
                  {row.label}
                </div>
              </div>
              <div className="flex-1 relative h-6 bg-[#1a1a1a] rounded-md overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#22c55e]/40 to-[#22c55e]/85 rounded-md"
                  style={{ width: `${width}%` }}
                />
                <div className="absolute inset-0 flex items-center px-2 text-[10px] text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
                  <span className="font-medium">{row.fullName}</span>
                </div>
              </div>
              <div className="w-32 shrink-0 text-right">
                <span className="text-xs font-bold text-[#22c55e] font-['JetBrains_Mono','SF_Mono',monospace] tabular-nums">
                  R = {row.r.toFixed(2)}
                </span>
                <div className="text-[9px] text-[#a1a1aa] font-['Inter',system-ui,sans-serif] leading-tight">
                  {row.caption}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mt-5">
        Off-the-tee is the most sustained skill year-over-year &mdash; a good
        driver this season is a good driver next season. Putting persists less
        (a hot putting year doesn&rsquo;t reliably predict the next one), and
        around-the-green is even more variance-heavy. <span className="text-[#f5f5f5] font-semibold">
        This is the broad thesis the X Score is built on.</span> Our other chart
        below shows the same data at the round-to-round timescale within a
        single tournament &mdash; where even APP looks random because one
        round&rsquo;s pin placements + conditions matter more than season-long
        skill.
      </p>
    </div>
  );
}
