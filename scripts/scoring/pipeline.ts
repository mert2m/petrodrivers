// scripts/scoring/pipeline.ts — orchestration. The pure path (GeoJSON centerline -> scored segments)
// is implemented; OSM ingestion + live elevation are optional plug-ins (deps.overpass / deps.elevation).
import { classifyDifficulty, difficultyScore } from './classify';
import type { ScoringConfig } from './config';
import { resample, segmentize, segmentLengthM, smooth } from './geo';
import type { ElevationProvider } from './io/elevation';
import type { OverpassClient, RoadCenterline } from './io/overpass';
import type { PostgisWriter } from './io/postgis';
import { computeSegmentMetrics } from './metrics';
import { toRoadSegmentRecords } from './records';
import type { ClassifiedSegment, Coordinate, Segment } from './types';

export type RoadSource =
  | { kind: 'osm'; osmId: number; osmType: 'way' | 'relation'; roadId: string; name: string }
  | { kind: 'geojson'; roadId: string; feature: RoadCenterline };

export interface PipelineDeps {
  db: PostgisWriter;
  config: ScoringConfig;
  overpass?: OverpassClient; // required only for osm sources
  elevation?: ElevationProvider; // optional; when absent, gradient stays unknown
  logger?: (evt: PipelineEvent) => void;
}

export interface PipelineResult {
  roadId: string;
  segmentsWritten: number;
  status: 'ok' | 'skipped' | 'failed';
  error?: string;
}

export type PipelineStage = 'ingest' | 'enrich' | 'segment' | 'metrics' | 'classify' | 'write';
export interface PipelineEvent {
  stage: PipelineStage;
  roadId: string;
  level: 'info' | 'warn' | 'error';
  msg: string;
}

interface Ingested {
  roadId: string;
  name: string;
  coords: Coordinate[];
}

function dedupeConsecutive(coords: Coordinate[]): Coordinate[] {
  return coords.filter(
    (c, i) => i === 0 || c.lng !== coords[i - 1]!.lng || c.lat !== coords[i - 1]!.lat,
  );
}

async function ingest(source: RoadSource, deps: PipelineDeps): Promise<Ingested> {
  if (source.kind === 'geojson') {
    const f = source.feature;
    const coords: Coordinate[] =
      'coords' in f ? f.coords : f.geometry.coordinates.map(([lng, lat, z]) => ({ lng, lat, z }));
    const name =
      'name' in f && f.name ? f.name : ('properties' in f && f.properties.name) || 'Unnamed road';
    return { roadId: source.roadId, name, coords: dedupeConsecutive(coords) };
  }
  if (!deps.overpass) throw new Error('osm source requires deps.overpass');
  const coords = await deps.overpass.fetchCenterline(source.osmType, source.osmId);
  return { roadId: source.roadId, name: source.name, coords: dedupeConsecutive(coords) };
}

async function enrichElevation(ing: Ingested, deps: PipelineDeps): Promise<Coordinate[]> {
  if (!deps.elevation) return ing.coords;
  const zs = await deps.elevation.lookup(ing.coords);
  return ing.coords.map((c, i) => {
    const z = zs[i];
    return z === null || z === undefined ? c : { ...c, z };
  });
}

/** Score ONE road end-to-end. Idempotent for the same roadId (writer delete+reinsert in a tx). */
export async function scoreRoad(source: RoadSource, deps: PipelineDeps): Promise<PipelineResult> {
  const cfg = deps.config;
  try {
    const ing = await ingest(source, deps);
    if (ing.coords.length < 2) {
      return {
        roadId: source.roadId,
        segmentsWritten: 0,
        status: 'skipped',
        error: 'too few points',
      };
    }
    const withZ = await enrichElevation(ing, deps);

    // resample + smooth BEFORE any curvature triplet, then cut into segments
    const dense = smooth(
      resample(withZ, cfg.segment.resampleSpacingM),
      cfg.segment.smoothingWindow,
    );
    const slices = segmentize(dense, cfg.segment.targetLengthM, cfg.segment.minLengthM);

    const classified: ClassifiedSegment[] = slices.map((coords, orderIndex) => {
      const seg: Segment = {
        roadId: ing.roadId,
        orderIndex,
        coords,
        lengthM: segmentLengthM(coords),
      };
      const scored = computeSegmentMetrics(seg, cfg);
      return {
        ...scored,
        difficulty: classifyDifficulty(scored, cfg),
        difficultyScore: difficultyScore(scored, cfg),
      };
    });

    await deps.db.upsertRoad({ roadId: ing.roadId, name: ing.name, centerline: withZ });
    const segmentsWritten = await deps.db.replaceSegments(
      ing.roadId,
      toRoadSegmentRecords(classified),
    );
    deps.logger?.({
      stage: 'write',
      roadId: ing.roadId,
      level: 'info',
      msg: `${segmentsWritten} segments`,
    });
    return { roadId: ing.roadId, segmentsWritten, status: 'ok' };
  } catch (e) {
    return {
      roadId: source.roadId,
      segmentsWritten: 0,
      status: 'failed',
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Batch runner: per-road isolation, never aborts the whole batch on one failure. */
export async function runScoringPipeline(
  sources: RoadSource[],
  deps: PipelineDeps,
): Promise<PipelineResult[]> {
  const results: PipelineResult[] = [];
  for (const source of sources) {
    results.push(await scoreRoad(source, deps)); // sequential — respects provider rate limits
  }
  return results;
}
