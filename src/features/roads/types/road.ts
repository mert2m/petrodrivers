// Domain types for the roads feature + Zod schemas that validate the GeoJSON coming back from the RPCs
// (the DB hands us geometry as a JSON string; we parse + validate at this boundary).
import { z } from 'zod';

import type { Difficulty } from '@/theme/tokens';

export interface LatLng {
  lng: number;
  lat: number;
}

export interface Bbox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/** A road segment ready for the map's data-driven line layer. */
export interface MapSegment {
  id: string;
  roadId: string;
  difficulty: Difficulty;
  difficultyScore: number;
  path: LatLng[];
}

/** A road summary for the Discover list / map labels. */
export interface RoadSummary {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  scenicRating: number | null;
  lengthM: number | null;
  centerline: LatLng[];
}

const LineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.array(z.number()).min(2)),
});

/** Parse a GeoJSON LineString string into LatLng[]. Throws (Zod) on malformed input. */
export function parseLineString(geojson: string): LatLng[] {
  const parsed = LineStringSchema.parse(JSON.parse(geojson));
  return parsed.coordinates.map((c) => ({ lng: c[0]!, lat: c[1]! }));
}
