import {
  bearingDeg,
  circumRadius,
  gradientPct,
  haversineM,
  headingChangeDeg,
  resample,
  segmentize,
  segmentLengthM,
  smooth,
  toPlanar,
} from '../geo';
import type { Coordinate, PlanarPoint } from '../types';

const p = (x: number, y: number, z?: number): PlanarPoint => ({ x, y, z });

describe('haversineM', () => {
  it('~111.2 km per degree of latitude at the equator', () => {
    expect(haversineM({ lng: 0, lat: 0 }, { lng: 0, lat: 1 })).toBeCloseTo(111195, -2);
  });
  it('is zero for identical points', () => {
    expect(haversineM({ lng: 5, lat: 45 }, { lng: 5, lat: 45 })).toBe(0);
  });
});

describe('circumRadius', () => {
  it('recovers a known circle radius', () => {
    // three points on a circle of radius 10 centered at origin
    expect(circumRadius(p(10, 0), p(0, 10), p(-10, 0))).toBeCloseTo(10, 6);
  });
  it('is +Infinity for collinear points', () => {
    expect(circumRadius(p(0, 0), p(1, 0), p(2, 0))).toBe(Infinity);
  });
  it('is +Infinity for coincident points', () => {
    expect(circumRadius(p(0, 0), p(0, 0), p(1, 1))).toBe(Infinity);
  });
});

describe('bearing + headingChangeDeg', () => {
  it('bearing due north is ~0 and due east ~90', () => {
    expect(bearingDeg({ lng: 0, lat: 0 }, { lng: 0, lat: 1 })).toBeCloseTo(0, 1);
    expect(bearingDeg({ lng: 0, lat: 0 }, { lng: 1, lat: 0 })).toBeCloseTo(90, 1);
  });
  it('a straight polyline has ~0 heading change', () => {
    const line: Coordinate[] = [
      { lng: 0, lat: 0 },
      { lng: 0, lat: 0.5 },
      { lng: 0, lat: 1 },
    ];
    expect(headingChangeDeg(line)).toBeCloseTo(0, 3);
  });
  it('a right-angle turn is ~90 degrees', () => {
    const line: Coordinate[] = [
      { lng: 0, lat: 0 },
      { lng: 0, lat: 0.01 },
      { lng: 0.01, lat: 0.01 },
    ];
    expect(headingChangeDeg(line)).toBeGreaterThan(85);
    expect(headingChangeDeg(line)).toBeLessThan(95);
  });
});

describe('gradientPct', () => {
  it('flat road with known elevations -> 0 pct, known', () => {
    const line: Coordinate[] = [
      { lng: 0, lat: 0, z: 100 },
      { lng: 0, lat: 0.001, z: 100 },
    ];
    const g = gradientPct(line);
    expect(g.known).toBe(true);
    expect(g.pct).toBeCloseTo(0, 6);
  });
  it('missing elevation -> known:false, pct:0', () => {
    const line: Coordinate[] = [
      { lng: 0, lat: 0 },
      { lng: 0, lat: 0.001 },
    ];
    expect(gradientPct(line)).toEqual({ pct: 0, known: false });
  });
  it('computes a positive climb', () => {
    const line: Coordinate[] = [
      { lng: 0, lat: 0, z: 0 },
      { lng: 0, lat: 0.001, z: 10 },
    ];
    expect(gradientPct(line).pct).toBeGreaterThan(0);
  });
});

describe('toPlanar', () => {
  it('preserves metric distance (planar ~ haversine for a short span)', () => {
    const a: Coordinate = { lng: 10, lat: 45 };
    const b: Coordinate = { lng: 10.002, lat: 45.001 };
    const [pa, pb] = toPlanar([a, b]);
    const planar = Math.hypot(pb!.x - pa!.x, pb!.y - pa!.y);
    expect(planar).toBeCloseTo(haversineM(a, b), 0);
  });
});

describe('resample', () => {
  it('produces ~uniform spacing and preserves endpoints', () => {
    const line: Coordinate[] = [
      { lng: 0, lat: 0 },
      { lng: 0, lat: 0.01 }, // ~1.11 km north
    ];
    const out = resample(line, 100); // 100 m spacing
    expect(out.length).toBeGreaterThan(8);
    expect(out[0]).toEqual(line[0]);
    const last = out[out.length - 1]!;
    expect(haversineM(last, line[1]!)).toBeLessThan(1);
    for (let i = 1; i < out.length - 1; i++) {
      expect(haversineM(out[i - 1]!, out[i]!)).toBeCloseTo(100, -1);
    }
  });
});

describe('smooth', () => {
  it('reduces a single-vertex spike', () => {
    const clean: Coordinate[] = [
      { lng: 0, lat: 0 },
      { lng: 0, lat: 0.001 },
      { lng: 0, lat: 0.002 },
    ];
    const spiked: Coordinate[] = [
      { lng: 0, lat: 0 },
      { lng: 0.0005, lat: 0.001 }, // lateral jitter
      { lng: 0, lat: 0.002 },
    ];
    const out = smooth(spiked, 3);
    expect(Math.abs(out[1]!.lng)).toBeLessThan(Math.abs(spiked[1]!.lng));
    // endpoints preserved
    expect(out[0]).toEqual(clean[0]);
  });
});

describe('segmentize', () => {
  it('splits into ~target-length pieces and preserves total length', () => {
    const line = resample(
      [
        { lng: 0, lat: 0 },
        { lng: 0, lat: 0.02 }, // ~2.2 km
      ],
      20,
    );
    const total = segmentLengthM(line);
    const segs = segmentize(line, 300, 120);
    expect(segs.length).toBeGreaterThan(1);
    const sum = segs.reduce((s, seg) => s + segmentLengthM(seg), 0);
    // shared boundary vertices mean per-seg lengths sum to the whole
    expect(sum).toBeCloseTo(total, 0);
    for (const seg of segs) expect(seg.length).toBeGreaterThanOrEqual(2);
  });
});
