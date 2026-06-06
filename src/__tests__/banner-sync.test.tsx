/**
 * Cross-page banner sync test.
 *
 * The bug we're guarding against (caught by Chris 2026-06-06):
 *   Methodology banner showed 135-70-21 / +85.30u while Results banner
 *   showed 161-88-29 / +91.28u for the same "all-time tracked record"
 *   metric. Two surfaces, two different numbers, both authoritative.
 *
 * Today's fix points both banners at `allTimeStats` from the lib. This
 * test renders BOTH pages in jsdom and asserts the banner text actually
 * displays the same numbers — catching a future regression where someone
 * reformats one banner (`.toFixed(1)` vs `.toFixed(2)`) but not the other,
 * or hardcodes a literal number back in.
 *
 * If this test fails: the source-of-truth contract is broken. Fix by
 * making both banner JSX reference `allTimeStats` directly with identical
 * formatting (see src/lib/allTimeStats.ts).
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MethodologyPage from '../components/MethodologyPage';
import ResultsPage from '../components/ResultsPage';
import { allTimeStats } from '../lib/allTimeStats';

function visibleText(container: HTMLElement): string {
  // Normalize whitespace so layout/styling differences don't fool the match.
  return container.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('Cross-page all-time banner consistency', () => {
  it('Methodology and Results banners display the SAME wins-losses-pushes', () => {
    const { container: methContainer } = render(<MethodologyPage />);
    const { container: resContainer } = render(<ResultsPage />);
    const recordStr = `${allTimeStats.wins}-${allTimeStats.losses}-${allTimeStats.pushes}`;
    const methText = visibleText(methContainer);
    const resText = visibleText(resContainer);
    expect(methText).toContain(recordStr);
    expect(resText).toContain(recordStr);
  });

  it('Both banners display the SAME units profit (formatted to 2 decimals)', () => {
    const { container: methContainer } = render(<MethodologyPage />);
    const { container: resContainer } = render(<ResultsPage />);
    const unitsAbs = Math.abs(allTimeStats.units).toFixed(2);
    expect(visibleText(methContainer)).toContain(unitsAbs);
    expect(visibleText(resContainer)).toContain(unitsAbs);
  });

  it('Both banners display the SAME ROI (formatted to 1 decimal)', () => {
    const { container: methContainer } = render(<MethodologyPage />);
    const { container: resContainer } = render(<ResultsPage />);
    const roiAbs = Math.abs(allTimeStats.roi).toFixed(1);
    expect(visibleText(methContainer)).toContain(roiAbs);
    expect(visibleText(resContainer)).toContain(roiAbs);
  });

  it('allTimeStats is non-empty (catches a glob/registry regression)', () => {
    // If PREFIX_TO_EVENT_ID drifts or no Results.ts files are discovered,
    // allTimeStats.bets would be 0 and both banners would silently show
    // "0-0-0". Fail fast here.
    expect(allTimeStats.bets).toBeGreaterThan(0);
    expect(allTimeStats.wins + allTimeStats.losses).toBeGreaterThan(0);
  });
});
