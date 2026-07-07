// scripts/seed-roads.ts — run the offline scoring pipeline over the curated seed roads and write the
// scored segments to Postgres. Idempotent (re-run safe). Usage:
//   DATABASE_URL=postgres://postgres:postgres@localhost:55432/petrodrivers npx tsx scripts/seed-roads.ts
//   DRY=1 npx tsx scripts/seed-roads.ts   # score in memory + print difficulty distribution (no DB)
import { CURATED_ROADS } from '../supabase/seed/curated-roads';
import { DEFAULT_CONFIG } from './scoring/config';
import { createPgPostgisWriter, type PostgisWriter } from './scoring/io/postgis';
import { runScoringPipeline } from './scoring/pipeline';
import type { RoadSegmentRecord } from './scoring/types';

/** In-memory writer for dry runs: tallies the difficulty distribution instead of hitting a DB. */
function createMemoryWriter(): PostgisWriter & { tally: Map<string, Record<string, number>> } {
  const tally = new Map<string, Record<string, number>>();
  return {
    tally,
    async upsertRoad() {},
    async replaceSegments(roadId: string, rows: RoadSegmentRecord[]) {
      const counts: Record<string, number> = {};
      for (const r of rows) counts[r.difficulty] = (counts[r.difficulty] ?? 0) + 1;
      tally.set(roadId, counts);
      return rows.length;
    },
    async close() {},
  };
}

async function main(): Promise<void> {
  const dry = process.env.DRY === '1';
  const connectionString =
    process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:55432/petrodrivers';
  const mem = dry ? createMemoryWriter() : null;
  const db: PostgisWriter = mem ?? createPgPostgisWriter(connectionString);

  try {
    const results = await runScoringPipeline(CURATED_ROADS, { db, config: DEFAULT_CONFIG });
    for (const r of results) {
      const name = CURATED_ROADS.find((s) => s.roadId === r.roadId);
      const label =
        name && 'feature' in name && 'name' in name.feature ? name.feature.name : r.roadId;
      const line =
        r.status === 'ok'
          ? `  ✓ ${label}: ${r.segmentsWritten} segments`
          : `  ✗ ${label}: ${r.status}${r.error ? ' — ' + r.error : ''}`;
      console.log(line);
    }
    if (mem) {
      console.log('\n  difficulty distribution:');
      for (const [roadId, counts] of mem.tally) {
        const label = CURATED_ROADS.find((s) => s.roadId === roadId);
        const nm =
          label && 'feature' in label && 'name' in label.feature ? label.feature.name : roadId;
        console.log(`    ${nm}: ${JSON.stringify(counts)}`);
      }
    }
    if (results.some((r) => r.status === 'failed')) process.exitCode = 1;
  } finally {
    await db.close();
  }
}

void main();
