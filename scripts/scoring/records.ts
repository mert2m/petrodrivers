// scripts/scoring/records.ts — map classified segments to DB rows (road_segments columns exactly).
// Non-representable / unknown values collapse to SQL NULL: +Infinity radius (straight), unknown surface,
// and gradient when elevation is missing.
import type { ClassifiedSegment, RoadSegmentRecord } from './types';

const round = (n: number, dp = 2): number => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

function geoJsonLineString(seg: ClassifiedSegment): string {
  const coordinates = seg.coords.map((c) =>
    c.z !== undefined ? [c.lng, c.lat, c.z] : [c.lng, c.lat],
  );
  return JSON.stringify({ type: 'LineString', coordinates });
}

export function toRoadSegmentRecord(seg: ClassifiedSegment): RoadSegmentRecord {
  return {
    road_id: seg.roadId,
    order_index: seg.orderIndex,
    geom: geoJsonLineString(seg),
    length_m: round(seg.lengthM),
    min_radius_m: Number.isFinite(seg.minRadiusM) ? round(seg.minRadiusM) : null,
    avg_radius_m: Number.isFinite(seg.avgRadiusM) ? round(seg.avgRadiusM) : null,
    heading_change_deg: round(seg.headingChangeDeg),
    gradient_pct: seg.gradientKnown ? round(seg.gradientPct) : null,
    surface_quality: seg.surfaceQuality === 'unknown' ? null : seg.surfaceQuality,
    difficulty: seg.difficulty,
    difficulty_score: round(seg.difficultyScore, 4),
  };
}

export function toRoadSegmentRecords(segs: ClassifiedSegment[]): RoadSegmentRecord[] {
  return segs.map(toRoadSegmentRecord);
}
