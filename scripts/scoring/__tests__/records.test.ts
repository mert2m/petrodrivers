import { toRoadSegmentRecord } from '../records';
import type { ClassifiedSegment } from '../types';

function classified(partial: Partial<ClassifiedSegment>): ClassifiedSegment {
  return {
    roadId: 'r1',
    orderIndex: 0,
    coords: [
      { lng: 10, lat: 46 },
      { lng: 10.001, lat: 46.001 },
    ],
    lengthM: 123.456,
    minRadiusM: 42.1234,
    avgRadiusM: 88.9,
    headingChangeDeg: 33.33,
    gradientPct: 4.567,
    gradientKnown: true,
    surfaceQuality: 'good',
    difficulty: 'technical',
    difficultyScore: 0.61234,
    ...partial,
  };
}

describe('toRoadSegmentRecord', () => {
  it('rounds numeric fields and emits a valid GeoJSON LineString', () => {
    const r = toRoadSegmentRecord(classified({}));
    expect(r.road_id).toBe('r1');
    expect(r.length_m).toBe(123.46);
    expect(r.min_radius_m).toBe(42.12);
    expect(r.gradient_pct).toBe(4.57);
    expect(r.difficulty_score).toBe(0.6123);
    const geom = JSON.parse(r.geom) as { type: string; coordinates: number[][] };
    expect(geom.type).toBe('LineString');
    expect(geom.coordinates).toHaveLength(2);
  });

  it('+Infinity radius -> null (not representable in numeric)', () => {
    const r = toRoadSegmentRecord(classified({ minRadiusM: Infinity, avgRadiusM: Infinity }));
    expect(r.min_radius_m).toBeNull();
    expect(r.avg_radius_m).toBeNull();
  });

  it('unknown gradient -> null; unknown surface -> null', () => {
    const r = toRoadSegmentRecord(
      classified({ gradientKnown: false, gradientPct: 0, surfaceQuality: 'unknown' }),
    );
    expect(r.gradient_pct).toBeNull();
    expect(r.surface_quality).toBeNull();
  });

  it('encodes z into GeoJSON when present', () => {
    const r = toRoadSegmentRecord(
      classified({
        coords: [
          { lng: 10, lat: 46, z: 1200 },
          { lng: 10.001, lat: 46.001, z: 1210 },
        ],
      }),
    );
    const geom = JSON.parse(r.geom) as { coordinates: number[][] };
    expect(geom.coordinates[0]).toEqual([10, 46, 1200]);
  });
});
