/**
 * Resolve the CURRENT event identity (slug / courseKey / dataPrefix) from the
 * committed repo state — src/config/event.ts (which data files are imported)
 * mapped through src/data/eventSchedule.ts.
 *
 * WHY THIS EXISTS: the GitHub workflow YAMLs carry SLUG / COURSE / SLUG_PREFIX
 * env values that must be hand-rotated every event. When that rotation is
 * missed (or the YAML push is blocked by OAuth workflow-scope), every script
 * keeps operating on LAST week's event: pulls the wrong slug, builds the wrong
 * ticker, and the auto-roll detector reads a finished tournament's feed and
 * misfires. That exact failure froze the site for the Memorial → RBC Canadian
 * handoff (June 2026).
 *
 * Scripts should call resolveCurrentEvent() and PREFER its answer over env or
 * argv, logging loudly when they disagree. The env/argv values remain as
 * fallbacks for events that predate eventSchedule.ts.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = new URL('../..', import.meta.url).pathname;

export interface CurrentEventIdentity {
  slug: string;
  courseKey: string;
  dataPrefix: string;
  name: string;
}

/**
 * Returns the current event identity, or null when it cannot be resolved
 * (missing schedule file, prefix not in schedule, unparsable event.ts).
 * Callers fall back to their env/argv values on null.
 */
export async function resolveCurrentEvent(): Promise<CurrentEventIdentity | null> {
  try {
    const raw = await readFile(join(ROOT, 'src/config/event.ts'), 'utf8');
    // The main rankings import names the active event's data file prefix,
    // e.g. `from '../data/rbcCanadianPreData'` → prefix "rbcCanadian".
    const m = raw.match(/from '\.\.\/data\/([a-zA-Z]+)(?:Pre|R\d)Data'/);
    if (!m) return null;
    const prefix = m[1];
    const sched = await import(pathToFileURL(join(ROOT, 'src/data/eventSchedule.ts')).href);
    const found = (sched.EVENT_SCHEDULE as Array<{ slug: string; courseKey: string; dataPrefix: string; name: string }>)
      .find((e) => e.dataPrefix === prefix);
    if (!found) return null;
    return {
      slug: found.slug,
      courseKey: found.courseKey,
      dataPrefix: found.dataPrefix,
      name: found.name,
    };
  } catch {
    return null;
  }
}

/**
 * Convenience wrapper: returns resolved identity, warning + overriding when
 * the provided fallback values (typically from env or argv) disagree.
 */
export async function resolveWithOverride(fallback: {
  slug: string;
  courseKey?: string;
  dataPrefix?: string;
}): Promise<{ slug: string; courseKey: string; dataPrefix: string }> {
  const resolved = await resolveCurrentEvent();
  if (!resolved) {
    return {
      slug: fallback.slug,
      courseKey: fallback.courseKey ?? '',
      dataPrefix: fallback.dataPrefix ?? '',
    };
  }
  if (fallback.slug && fallback.slug !== resolved.slug) {
    console.warn(
      `⚠️  Event identity override: env/argv says slug "${fallback.slug}" but the committed ` +
      `event config resolves to "${resolved.slug}" (${resolved.name}). Using the committed config. ` +
      `(Workflow YAML env is stale — rotate it when possible, but scripts no longer depend on it.)`
    );
  }
  return { slug: resolved.slug, courseKey: resolved.courseKey, dataPrefix: resolved.dataPrefix };
}
