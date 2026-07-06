// scripts/scoring/pipeline.ts — orchestration seam. Pure stages (geo/classify) are implemented;
// the IO-bound stages (overpass/elevation/postgis) are interfaces with stubbed bodies (Phase 1 work).
import type { ScoringConfig } from './config';
import type { ElevationProvider } from './io/elevation';
import type { OverpassClient, RoadCenterline } from './io/overpass';
import type { PostgisWriter } from './io/postgis';

export type RoadSource =
  | { kind: 'osm'; osmId: number; osmType: 'way' | 'relation'; roadId: string }
  | { kind: 'geojson'; roadId: string; feature: RoadCenterline };

export interface PipelineDeps {
  elevation: ElevationProvider;
  overpass: OverpassClient;
  db: PostgisWriter;
  config: ScoringConfig;
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

/** Score ONE road end-to-end. Idempotent for the same roadId (stage 6 delete+reinsert in a tx). */
export async function scoreRoad(_source: RoadSource, _deps: PipelineDeps): Promise<PipelineResult> {
  // TODO(Phase 1): ingest -> enrichElevation -> resample+smooth+segmentize -> computeSegmentMetrics
  //                -> classify -> writeToPostGIS, wrapped in a per-road transaction.
  throw new Error('scoreRoad not implemented — Phase 1');
}

/** Batch runner: bounded concurrency, per-road isolation, aggregate report; never aborts on one failure. */
export async function runScoringPipeline(
  _sources: RoadSource[],
  _deps: PipelineDeps,
  _opts?: { concurrency?: number; continueOnError?: boolean },
): Promise<PipelineResult[]> {
  // TODO(Phase 1): map scoreRoad with a concurrency limit (respect provider rate limits).
  throw new Error('runScoringPipeline not implemented — Phase 1');
}
