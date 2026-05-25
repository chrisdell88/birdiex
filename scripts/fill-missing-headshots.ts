/**
 * Fill missing entries in src/data/headshots.ts by searching ESPN for
 * each player by name. Used when ESPN's leaderboard endpoint hasn't
 * switched to the current event yet (so build-headshots.ts can't match
 * everyone via the leaderboard route).
 *
 * Reads cscPreData (or whatever pre-event roster file is current),
 * compares to the headshots map, and queries ESPN's v2 search for any
 * players still missing. Merges results back into headshots.ts.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

function parseArgs(): { players: string } {
  const a = process.argv.slice(2);
  const o: Record<string, string> = { players: 'cscPreData' };
  for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, '')] = a[i + 1];
  return o as { players: string };
}

/** "Henley, Russell" → "Russell Henley". */
function toFirstLast(name: string): string {
  const i = name.indexOf(',');
  if (i < 0) return name.trim();
  const last = name.slice(0, i).trim();
  const first = name.slice(i + 1).trim();
  return `${first} ${last}`;
}

interface ESPNPlayer {
  type?: string;
  displayName?: string;
  id?: string;
  sport?: string;
  image?: string | { default?: string };
}

async function searchESPN(name: string): Promise<string | null> {
  const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&limit=5`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = (await res.json()) as { results?: Array<{ contents?: ESPNPlayer[] }> };
    for (const r of d.results ?? []) {
      for (const c of r.contents ?? []) {
        if ((c.type ?? '').toLowerCase() === 'player' && c.sport === 'golf') {
          const img = typeof c.image === 'string' ? c.image : c.image?.default;
          if (img && c.displayName?.toLowerCase() === name.toLowerCase()) return img;
        }
      }
    }
    // Fallback: first golf player result if no exact name match.
    for (const r of d.results ?? []) {
      for (const c of r.contents ?? []) {
        if ((c.type ?? '').toLowerCase() === 'player' && c.sport === 'golf') {
          const img = typeof c.image === 'string' ? c.image : c.image?.default;
          if (img) return img;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  const { players } = parseArgs();

  // Load roster
  const mod = await import(pathToFileURL(join(PROJECT_ROOT, 'src', 'data', `${players}.ts`)).href);
  const roster: string[] = (mod.roundOnlyData as Array<{ player_name: string }>).map((p) => p.player_name);

  // Load existing headshots
  const headshotsPath = join(PROJECT_ROOT, 'src', 'data', 'headshots.ts');
  const raw = await readFile(headshotsPath, 'utf8');
  const m = raw.match(/export const headshots[^=]*=\s*(\{[\s\S]*?\});/);
  if (!m) {
    console.error('Could not parse existing headshots map');
    process.exit(1);
  }
  const existing: Record<string, string> = JSON.parse(m[1]);

  // Find missing players
  const missing = roster.filter((n) => !existing[n]);
  console.log(`Roster: ${roster.length} players. Already covered: ${roster.length - missing.length}. Missing: ${missing.length}.`);

  // Search ESPN for each missing player
  let filled = 0;
  for (const name of missing) {
    const query = toFirstLast(name);
    const img = await searchESPN(query);
    if (img) {
      existing[name] = img;
      filled++;
      console.log(`  ✓ ${query} → ${img}`);
    } else {
      console.log(`  ✗ ${query} (no match)`);
    }
    // Be polite to ESPN
    await new Promise((r) => setTimeout(r, 150));
  }

  // Write back
  const sorted = Object.keys(existing)
    .sort()
    .reduce<Record<string, string>>((acc, k) => {
      acc[k] = existing[k];
      return acc;
    }, {});

  const newFile = [
    `// Last updated by scripts/fill-missing-headshots.ts on ${new Date().toISOString()}.`,
    `// Source: ESPN leaderboard + per-player search fallback.`,
    `// Total players in cumulative map: ${Object.keys(sorted).length}.`,
    `// Players not in the map fall back to an initials avatar. DO NOT EDIT BY HAND.`,
    ``,
    `export const headshots: Record<string, string> = ${JSON.stringify(sorted, null, 2)};`,
    ``,
  ].join('\n');

  await writeFile(headshotsPath, newFile);
  console.log(`\n✅ Filled ${filled} of ${missing.length} missing players. Map now has ${Object.keys(sorted).length} entries.`);
}

main().catch((e) => {
  console.error('fill-missing-headshots failed:', e);
  process.exit(1);
});
