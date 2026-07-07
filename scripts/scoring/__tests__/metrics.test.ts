import { classifyDifficulty } from '../classify';
import { DEFAULT_CONFIG } from '../config';
import { computeSegmentMetrics } from '../metrics';
import type { Coordinate, Segment } from '../types';

const cfg = DEFAULT_CONFIG;
const M_PER_DEG = 111_320;

/** Build a circular arc of radius `rM` spanning `sweepDeg`, sampled into `n` points. */
function arc(
  centerLat: number,
  centerLng: number,
  rM: number,
  sweepDeg: number,
  n = 30,
): Coordinate[] {
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const coords: Coordinate[] = [];
  for (let i = 0; i < n; i++) {
    const theta = (sweepDeg * (i / (n - 1)) * Math.PI) / 180;
    const dx = rM * Math.cos(theta);
    const dy = rM * Math.sin(theta);
    coords.push({ lng: centerLng + dx / (M_PER_DEG * cosLat), lat: centerLat + dy / M_PER_DEG });
  }
  return coords;
}

function seg(coords: Coordinate[]): Segment {
  return { roadId: 'test', orderIndex: 0, coords, lengthM: 0 };
}

describe('computeSegmentMetrics + classify (end to end on synthetic arcs)', () => {
  it('tight 160° arc (r≈18m) -> hairpin', () => {
    const m = computeSegmentMetrics(seg(arc(46.5, 10.4, 18, 160)), cfg);
    expect(m.minRadiusM).toBeGreaterThan(14);
    expect(m.minRadiusM).toBeLessThan(24);
    expect(m.headingChangeDeg).toBeGreaterThan(150);
    expect(classifyDifficulty(m, cfg)).toBe('hairpin');
  });

  it('moderate 40° arc (r≈55m) -> technical', () => {
    const m = computeSegmentMetrics(seg(arc(44.2, 7.0, 55, 40)), cfg);
    expect(m.minRadiusM).toBeGreaterThan(45);
    expect(m.minRadiusM).toBeLessThan(70);
    expect(classifyDifficulty(m, cfg)).toBe('technical');
  });

  it('shallow 15° arc (r≈400m) -> easy', () => {
    const m = computeSegmentMetrics(seg(arc(36.1, -5.3, 400, 15)), cfg);
    expect(m.minRadiusM).toBeGreaterThan(300);
    expect(m.headingChangeDeg).toBeLessThan(cfg.thresholds.sustainedTightMinHeadingDeg);
    expect(classifyDifficulty(m, cfg)).toBe('easy');
  });

  it('straight line -> +Infinity radius, easy, gradient unknown (no z)', () => {
    const coords: Coordinate[] = [
      { lng: 0, lat: 0 },
      { lng: 0, lat: 0.001 },
      { lng: 0, lat: 0.002 },
      { lng: 0, lat: 0.003 },
    ];
    const m = computeSegmentMetrics(seg(coords), cfg);
    expect(m.minRadiusM).toBe(Infinity);
    expect(m.gradientKnown).toBe(false);
    expect(classifyDifficulty(m, cfg)).toBe('easy');
  });
});
