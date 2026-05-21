/**
 * CourseAdaptiveChart — methodology-page visual that explains the thesis:
 * "More predictable courses get more recommended bets."
 *
 * The chart shows a green curve ascending from lower-left (low predictability,
 * fewer recommendations) to upper-right (high predictability, broader
 * recommendation set). Two labeled anchor points: Aronimink (low pred) and
 * Augusta (high pred). No edge numbers, no formula — just course names + tier
 * badges.
 *
 * Pure SVG, no chart library, fully responsive via viewBox.
 */
export default function CourseAdaptiveChart() {
  // SVG viewBox: 600 wide × 360 tall.
  // Plot area: x in [70, 560], y in [60, 270].
  //
  // Anchors (mirrored from previous "descending" layout so curve ascends):
  //   Aronimink (predictability 0.0413) → lower-left  → (x=182, y=245)
  //   Augusta   (predictability 0.1439) → upper-right → (x=462, y=120)

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-base font-semibold text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
          More Predictable Courses, More Recommended Bets
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-[#22c55e] font-medium font-['Inter',system-ui,sans-serif] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full px-2.5 py-0.5">
          Course-Aware
        </span>
      </div>

      <svg
        viewBox="0 0 600 360"
        className="w-full h-auto"
        role="img"
        aria-label="Chart showing the number of bets we recommend rising as course predictability rises. Aronimink, a low-predictability venue, lands at the lower-left — we recommend only higher-tier bets. Augusta National, a high-predictability venue, lands at the upper-right — we recommend every star-tier bet the model produces."
      >
        <defs>
          {/* Subtle green glow for the curve */}
          <filter id="curveGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient under the curve for emphasis (fades from green at the
              curve down to transparent at the x-axis) */}
          <linearGradient id="curveFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>

          {/* Dot halo */}
          <radialGradient id="dotHalo">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* === Grid (very subtle) === */}
        {[100, 150, 200, 250].map((y) => (
          <line
            key={`gridy-${y}`}
            x1={70}
            x2={560}
            y1={y}
            y2={y}
            stroke="#262626"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
        ))}
        {[170, 290, 410, 530].map((x) => (
          <line
            key={`gridx-${x}`}
            x1={x}
            x2={x}
            y1={60}
            y2={270}
            stroke="#262626"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
        ))}

        {/* === Axes === */}
        <line x1={70} y1={270} x2={560} y2={270} stroke="#404040" strokeWidth={1.5} />
        <line x1={70} y1={60} x2={70} y2={270} stroke="#404040" strokeWidth={1.5} />

        {/* === Axis labels === */}
        {/* X axis title */}
        <text
          x={315}
          y={335}
          textAnchor="middle"
          fill="#d4d4d4"
          fontSize="12"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="1.5"
        >
          COURSE PREDICTABILITY →
        </text>

        {/* Y axis title (rotated) */}
        <text
          x={20}
          y={165}
          textAnchor="middle"
          fill="#d4d4d4"
          fontSize="12"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="1.5"
          transform="rotate(-90, 20, 165)"
        >
          BETS RECOMMENDED →
        </text>

        {/* X axis ticks: Low / High */}
        <text
          x={75}
          y={290}
          fill="#999"
          fontSize="10"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="1"
        >
          LOW
        </text>
        <text
          x={555}
          y={290}
          textAnchor="end"
          fill="#999"
          fontSize="10"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="1"
        >
          HIGH
        </text>

        {/* Y axis labels: MORE at top, FEWER at bottom */}
        <text
          x={62}
          y={75}
          textAnchor="end"
          fill="#999"
          fontSize="10"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="1"
        >
          MORE
        </text>
        <text
          x={62}
          y={265}
          textAnchor="end"
          fill="#999"
          fontSize="10"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="1"
        >
          FEWER
        </text>

        {/* === Fill under the curve (mirrors the descending curve into an
            ascending one and fills DOWN to the x-axis) === */}
        <path
          d="M 70 265 C 130 260, 200 250, 260 215 S 400 125, 560 95 L 560 270 L 70 270 Z"
          fill="url(#curveFade)"
        />

        {/* === Main curve (ascending, lower-left → upper-right) === */}
        <path
          d="M 70 265 C 130 260, 200 250, 260 215 S 400 125, 560 95"
          fill="none"
          stroke="#22c55e"
          strokeWidth={3}
          strokeLinecap="round"
          filter="url(#curveGlow)"
        />

        {/* === Anchor point: Aronimink (low pred → fewer bets recommended,
            lower-left of chart) === */}
        {/* Halo */}
        <circle cx={182} cy={245} r={18} fill="url(#dotHalo)" />
        {/* Dot */}
        <circle
          cx={182}
          cy={245}
          r={6}
          fill="#f5f5f5"
          stroke="#22c55e"
          strokeWidth={2}
        />
        {/* Label box — UP-RIGHT of the dot so it doesn't run off the left
            edge or block the curve */}
        <g transform="translate(182, 245)">
          <rect
            x={14}
            y={-50}
            width={148}
            height={36}
            rx={6}
            fill="#0a0a0a"
            stroke="#22c55e"
            strokeOpacity={0.4}
            strokeWidth={1}
          />
          <text
            x={88}
            y={-34}
            textAnchor="middle"
            fill="#f5f5f5"
            fontSize="11"
            fontWeight={600}
            fontFamily="Inter, system-ui, sans-serif"
          >
            Aronimink
          </text>
          <text
            x={88}
            y={-20}
            textAnchor="middle"
            fill="#22c55e"
            fontSize="10"
            fontFamily="Inter, system-ui, sans-serif"
            letterSpacing="0.5"
          >
            ★★+ only
          </text>
        </g>

        {/* === Anchor point: Augusta (high pred → broader recommendation set,
            upper-right of chart) === */}
        {/* Halo */}
        <circle cx={462} cy={120} r={18} fill="url(#dotHalo)" />
        {/* Dot */}
        <circle
          cx={462}
          cy={120}
          r={6}
          fill="#f5f5f5"
          stroke="#22c55e"
          strokeWidth={2}
        />
        {/* Label box — DOWN-LEFT of the dot so it doesn't run off the top
            edge or block the curve */}
        <g transform="translate(462, 120)">
          <rect
            x={-180}
            y={14}
            width={170}
            height={36}
            rx={6}
            fill="#0a0a0a"
            stroke="#22c55e"
            strokeOpacity={0.4}
            strokeWidth={1}
          />
          <text
            x={-95}
            y={30}
            textAnchor="middle"
            fill="#f5f5f5"
            fontSize="11"
            fontWeight={600}
            fontFamily="Inter, system-ui, sans-serif"
          >
            Augusta National
          </text>
          <text
            x={-95}
            y={44}
            textAnchor="middle"
            fill="#22c55e"
            fontSize="10"
            fontFamily="Inter, system-ui, sans-serif"
            letterSpacing="0.5"
          >
            every ★+ bet recommended
          </text>
        </g>
      </svg>

      {/* Caption */}
      <p className="text-xs text-[#d4d4d4] font-['Inter',system-ui,sans-serif] leading-relaxed mt-4">
        Not every PGA Tour venue carries the same signal. Augusta National has the highest course
        predictability on Tour — historical performance there is genuinely indicative of future
        results, so we trust the full ★+ recommendation set. At a low-predictability venue like
        Aronimink, signal-to-noise drops — we raise the floor and only recommend higher-tier
        plays. Every event gets a venue-specific floor that reflects how much we trust the data
        there.
      </p>
    </div>
  );
}
