// scripts/scoring/io/postgis.ts — write seam. Idempotent per road: upsert the road, then delete+reinsert
// its segments in ONE transaction so a re-run leaves exactly one clean set. Build-time tooling (uses `pg`
// against a direct Postgres connection); never imported by the app.
import { Pool } from 'pg';

import type { Coordinate, RoadSegmentRecord } from '../types';

export interface PostgisWriter {
  upsertRoad(road: { roadId: string; name: string; centerline: Coordinate[] }): Promise<void>;
  /** DELETE road_segments WHERE road_id=$1 then bulk INSERT, in one transaction. Returns row count. */
  replaceSegments(roadId: string, rows: RoadSegmentRecord[]): Promise<number>;
  close(): Promise<void>;
}

function centerlineGeoJson(coords: Coordinate[]): string {
  return JSON.stringify({
    type: 'LineString',
    coordinates: coords.map((c) => (c.z !== undefined ? [c.lng, c.lat, c.z] : [c.lng, c.lat])),
  });
}

/** A PostgisWriter backed by node-postgres. Pass a direct connection string (service-side only). */
export function createPgPostgisWriter(connectionString: string): PostgisWriter {
  const pool = new Pool({ connectionString });

  return {
    async upsertRoad({ roadId, name, centerline }) {
      const geojson = centerlineGeoJson(centerline);
      await pool.query(
        `insert into roads (id, name, curated, centerline, bbox, length_m)
         values ($1, $2, true,
                 ST_GeomFromGeoJSON($3)::geography,
                 ST_Envelope(ST_GeomFromGeoJSON($3)),
                 ST_Length(ST_GeomFromGeoJSON($3)::geography))
         on conflict (id) do update
           set name = excluded.name,
               curated = true,
               centerline = excluded.centerline,
               bbox = excluded.bbox,
               length_m = excluded.length_m`,
        [roadId, name, geojson],
      );
    },

    async replaceSegments(roadId, rows) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query('delete from road_segments where road_id = $1', [roadId]);
        for (const r of rows) {
          await client.query(
            `insert into road_segments
               (road_id, geom, order_index, length_m, avg_radius_m, min_radius_m,
                heading_change_deg, gradient_pct, surface_quality, difficulty, difficulty_score)
             values ($1, ST_GeomFromGeoJSON($2)::geography, $3, $4, $5, $6, $7, $8,
                     $9::surface_quality, $10::difficulty, $11)`,
            [
              roadId,
              r.geom,
              r.order_index,
              r.length_m,
              r.avg_radius_m,
              r.min_radius_m,
              r.heading_change_deg,
              r.gradient_pct,
              r.surface_quality,
              r.difficulty,
              r.difficulty_score,
            ],
          );
        }
        await client.query('commit');
        return rows.length;
      } catch (e) {
        await client.query('rollback');
        throw e;
      } finally {
        client.release();
      }
    },

    async close() {
      await pool.end();
    },
  };
}
