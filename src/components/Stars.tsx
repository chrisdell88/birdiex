/**
 * Stars — renders a star rating with HALF-STAR precision.
 *
 *   units = 0.5  → "½★"
 *   units = 1.0  → "★"
 *   units = 1.5  → "★½"
 *   units = 2.0  → "★★"
 *   units = 2.5  → "★★½"
 *   ...
 *
 * Implementation: SVG so the half-star is a real partial fill (not a
 * unicode "½" glyph next to a full star). Each star is 14px wide.
 */
import type { ReactElement } from 'react';

interface Props {
  /** Unit size (0.5 → 5.0 in 0.5 steps). */
  units: number;
  /** Optional star size in px. Defaults to 14. */
  size?: number;
  /** Fill color (defaults to BirdieX green). */
  color?: string;
  /** Override CSS class on the wrapper span. */
  className?: string;
}

function fullStar(cx: number, cy: number, r: number, color: string, key: string) {
  // 5-point star path.
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return <polygon key={key} points={points.join(' ')} fill={color} />;
}

function halfStarPath(cx: number, cy: number, r: number): string {
  // Same path as fullStar but only the LEFT half via a clipping rect later;
  // for simplicity we just render the left half of the star as a closed
  // polygon (5 outer pts × 2 inner pts on the left side + center).
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

export default function Stars({ units, size = 14, color = '#22c55e', className = '' }: Props) {
  // Round to nearest 0.5 so we don't render quarter-stars.
  const rounded = Math.round(units * 2) / 2;
  const fullCount = Math.floor(rounded);
  const hasHalf = rounded - fullCount >= 0.5;
  const totalSlots = 5;
  const gap = 1;
  const r = size / 2;
  const width = totalSlots * size + (totalSlots - 1) * gap;
  const height = size;

  const stars: ReactElement[] = [];
  for (let i = 0; i < totalSlots; i++) {
    const cx = r + i * (size + gap);
    const cy = r;
    if (i < fullCount) {
      stars.push(fullStar(cx, cy, r * 0.95, color, `f-${i}`));
    } else if (i === fullCount && hasHalf) {
      // Render the full star then clip to the LEFT half via a clipPath.
      stars.push(
        <g key={`h-${i}`}>
          <defs>
            <clipPath id={`stars-half-${i}`}>
              <rect x={cx - r} y={cy - r} width={r} height={size} />
            </clipPath>
          </defs>
          <polygon points={halfStarPath(cx, cy, r * 0.95)} fill={color} clipPath={`url(#stars-half-${i})`} />
          {/* faint outline so the unfilled half still reads as a star */}
          <polygon points={halfStarPath(cx, cy, r * 0.95)} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={0.8} />
        </g>,
      );
    } else {
      // Empty slot — faint outline so the user sees the "max" of 5 stars.
      stars.push(
        <polygon
          key={`e-${i}`}
          points={halfStarPath(cx, cy, r * 0.95)}
          fill="none"
          stroke={color}
          strokeOpacity={0.18}
          strokeWidth={0.8}
        />,
      );
    }
  }

  return (
    <span className={`inline-block align-middle ${className}`} aria-label={`${rounded} star${rounded === 1 ? '' : 's'}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img">
        {stars}
      </svg>
    </span>
  );
}
