// scripts/scoring/types.ts — pipeline data shapes. Kept in lock-step with the road_segments columns.
import type { Difficulty } from '../../src/theme/tokens';

export type { Difficulty };

/** Geographic coordinate. z = elevation in metres; undefined until the enrichment stage fills it. */
export interface Coordinate {
  lng: number;
  lat: number;
  z?: number;
}

/** Local planar point in METRES (via toPlanar). Curvature is fit on these, never on lng/lat degrees. */
export interface PlanarPoint {
  x: number;
  y: number;
  z?: number;
}

// Mirrors the DB surface_quality enum; "unknown" is an in-memory sentinel that writes as SQL NULL.
export type SurfaceQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unpaved' | 'unknown';

export interface Segment {
  roadId: string;
  orderIndex: number;
  coords: Coordinate[];
  lengthM: number;
}

export interface ScoredSegment extends Segment {
  minRadiusM: number; // tightest circumscribed-circle radius (m); +Infinity if straight
  avgRadiusM: number; // mean over valid (non-collinear) triplets; +Infinity if none curve
  headingChangeDeg: number; // total absolute bearing change (>= 0)
  gradientPct: number; // signed; 0 when unknown
  gradientKnown: boolean; // false when elevation missing -> gradient excluded from classification
  surfaceQuality: SurfaceQuality;
}

export interface ClassifiedSegment extends ScoredSegment {
  difficulty: Difficulty;
  difficultyScore: number; // 0..1
}

/** Minimal input to the pure classifiers. */
export interface ClassifierInput {
  minRadiusM: number;
  avgRadiusM: number;
  headingChangeDeg: number;
  gradientPct: number;
  gradientKnown: boolean;
}

/** Final row shape — maps 1:1 onto road_segments (Part 2 §0002). */
export interface RoadSegmentRecord {
  road_id: string;
  order_index: number;
  geom: string; // GeoJSON LineString -> ST_GeomFromGeoJSON
  length_m: number;
  min_radius_m: number | null; // +Infinity (straight) -> null
  avg_radius_m: number | null; // no triplet curves -> null
  heading_change_deg: number;
  gradient_pct: number | null; // gradientKnown=false -> null
  surface_quality: Exclude<SurfaceQuality, 'unknown'> | null; // "unknown" -> null
  difficulty: Difficulty;
  difficulty_score: number;
}
