// scripts/scoring/io/elevation.ts — elevation seam (Phase 1). Backed by self-hosted OpenTopoData +
// Copernicus GLO-30 (SRTM fallback). Returns null (not 0) for no-coverage so sea-level != no-data.
import type { Coordinate } from '../types';

export interface ElevationProvider {
  /** Metres, index-aligned with input. null where the DEM has no coverage. */
  lookup(points: Coordinate[]): Promise<(number | null)[]>;
}

// TODO(Phase 1): batch-fetch (<= batchSize/req) against OpenTopoData; map null -> undefined z upstream.
