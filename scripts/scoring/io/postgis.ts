// scripts/scoring/io/postgis.ts — write seam (Phase 1). Idempotent per road: upsert road, then
// delete+reinsert its segments in ONE transaction so a re-run leaves exactly one clean set.
import type { Coordinate, RoadSegmentRecord } from '../types';

export interface PostgisWriter {
  upsertRoad(road: { roadId: string; name: string; centerline: Coordinate[] }): Promise<void>;
  /** DELETE road_segments WHERE road_id=$1 then bulk INSERT, in one transaction. Returns row count. */
  replaceSegments(roadId: string, rows: RoadSegmentRecord[]): Promise<number>;
}

// TODO(Phase 1): implement with node-postgres / supabase-js service_role against the PostGIS schema.
