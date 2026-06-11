/**
 * POLICY GUARDS — Chris's locked rules, enforced by the build.
 *
 * Every rule here was decided by Chris and previously violated by a session
 * acting on bad judgment. The point of this file is that the next violation
 * fails CI/build loudly instead of reaching the live site. Do not weaken a
 * test to make a change pass — if a rule needs to change, that is Chris's
 * call, made explicitly.
 *
 * Violations these would have caught:
 *   - RBC Canadian Open staged at Hamilton G&CC when the real venue was
 *     TPC Toronto at Osprey Valley (June 2026).
 *   - R1 picks published for the RBC Canadian Open (June 2026) despite the
 *     no-Round-1-picks policy.
 *   - New event added to ResultsPage but missing from allTimeStats'
 *     prefix map (the frozen Methodology banner, June 2026).
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EVENT_SCHEDULE } from '../data/eventSchedule';
import { VENUES } from '../config/venues';
import { currentEvent } from '../config/event';

const DATA_DIR = join(__dirname, '..', 'data');
const COURSES_SRC = readFileSync(join(__dirname, '..', '..', 'scripts', 'lib', 'courses.ts'), 'utf8');

describe('POLICY: no Round 1 picks, ever', () => {
  it('no <prefix>R1Results.ts file exists for any event', () => {
    // The model needs a completed round of live SG data. R1 is never graded
    // because R1 picks are never published.
    const r1Results = readdirSync(DATA_DIR).filter((f) => /R1Results\.ts$/.test(f));
    expect(r1Results).toEqual([]);
  });

  it('MatchupsView refuses to show picks when picksRound <= 1', () => {
    const src = readFileSync(join(__dirname, '..', 'components', 'MatchupsView.tsx'), 'utf8');
    expect(src).toMatch(/picksRound <= 1/);
    expect(src).toMatch(/Picks Begin With Round 2/i);
  });
});

describe('POLICY: venue integrity (the Hamilton/TPC-Toronto staging error)', () => {
  it('every scheduled event\'s courseKey exists in courses.ts', () => {
    for (const ev of EVENT_SCHEDULE) {
      expect(COURSES_SRC, `courseKey '${ev.courseKey}' (${ev.name}) missing from courses.ts`)
        .toContain(`'${ev.courseKey}'`);
    }
  });

  it('every scheduled event\'s courseName matches its courses.ts entry name', () => {
    for (const ev of EVENT_SCHEDULE) {
      // The name: line that follows the courseKey in courses.ts must match
      // the schedule's courseName — a mismatch means someone staged a venue
      // without reconciling the two files.
      const keyIdx = COURSES_SRC.indexOf(`'${ev.courseKey}'`);
      expect(keyIdx, `courseKey '${ev.courseKey}' not found`).toBeGreaterThan(-1);
      const nameMatch = COURSES_SRC.slice(keyIdx).match(/name:\s*'([^']+)'/);
      expect(nameMatch?.[1], `no name for courseKey '${ev.courseKey}'`).toBe(ev.courseName);
    }
  });

  it('every scheduled event\'s eventId exists in venues.ts with the same course name', () => {
    for (const ev of EVENT_SCHEDULE) {
      const venue = VENUES[ev.eventId as keyof typeof VENUES];
      expect(venue, `eventId '${ev.eventId}' missing from venues.ts`).toBeDefined();
      expect(venue.course, `venues.ts course for ${ev.eventId} disagrees with eventSchedule`)
        .toBe(ev.courseName);
    }
  });

  it('the current event\'s displayed course comes from venues.ts (no hardcoded venue)', () => {
    const venue = VENUES[currentEvent.eventId];
    expect(currentEvent.course).toBe(venue.course);
  });
});

describe('POLICY: every event with graded results is wired into allTimeStats', () => {
  it('each <prefix>R<N>Results.ts prefix appears in PREFIX_TO_EVENT_ID', () => {
    const src = readFileSync(join(__dirname, '..', 'lib', 'allTimeStats.ts'), 'utf8');
    const prefixes = new Set(
      readdirSync(DATA_DIR)
        .map((f) => f.match(/^([a-zA-Z]+)R\d+Results\.ts$/)?.[1])
        .filter((p): p is string => !!p)
    );
    for (const p of prefixes) {
      expect(src, `results prefix '${p}' missing from allTimeStats PREFIX_TO_EVENT_ID — its record is invisible to the all-time banners`)
        .toMatch(new RegExp(`\\b${p}:`));
    }
  });
});

describe('POLICY: suspicious odds are flagged, never auto-dropped (Chris 2026-06-11)', () => {
  it('build-matchups contains the flag-only logic and no absolute odds cap', () => {
    const src = readFileSync(join(__dirname, '..', '..', 'scripts', 'build-matchups.ts'), 'utf8');
    expect(src).toMatch(/flag-only/i);
    expect(src, 'an absolute odds cap (MAX_ABS_H2H_ODDS) crept back in — Chris rejected this').not.toMatch(/MAX_ABS_H2H_ODDS/);
  });
});
