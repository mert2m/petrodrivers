// scripts/scoring/io/overpass.ts — OSM ingestion seam (Phase 1). ODbL: derived geometry redistribution
// requires attribution — surface "© OpenStreetMap contributors" on an About/Licenses screen.
import type { Coordinate } from '../types';

export interface GeoJSONLineStringFeature {
  type: 'Feature';
  properties: { name?: string; [k: string]: unknown };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][] | [number, number, number][];
  };
}

export type RoadCenterline = GeoJSONLineStringFeature | { name: string; coords: Coordinate[] };

export interface OverpassClient {
  /** Fetch + stitch a named way/relation into a single ordered centerline. */
  fetchCenterline(osmType: 'way' | 'relation', osmId: number): Promise<Coordinate[]>;
}

// TODO(Phase 1): implement against the Overpass API; dedupe consecutive identical vertices.
