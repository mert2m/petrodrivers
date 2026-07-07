// scripts/scoring/metrics.ts — turn a (resampled + smoothed) segment into per-segment metrics.
// Pure; curvature is fit on projected metres via geo.ts. Noise guard: a very tight triplet only counts
// if the local turn is genuinely sharp, so digitization jitter doesn't invent hairpins.
import type { ScoringConfig } from './config';
import {
  bearingDeg,
  circumRadius,
  gradientPct,
  headingChangeDeg,
  normalizeDeltaDeg,
  toPlanar,
} from './geo';
import type { ScoredSegment, Segment } from './types';

export function computeSegmentMetrics(seg: Segment, cfg: ScoringConfig): ScoredSegment {
  const planar = toPlanar(seg.coords);
  const radii: number[] = [];

  for (let i = 1; i < planar.length - 1; i++) {
    const r = circumRadius(planar[i - 1]!, planar[i]!, planar[i + 1]!);
    if (!Number.isFinite(r)) continue; // straight/collinear triplet — no curvature contribution
    if (r < cfg.segment.minTrustedRadiusM) {
      const turn = Math.abs(
        normalizeDeltaDeg(
          bearingDeg(seg.coords[i]!, seg.coords[i + 1]!) -
            bearingDeg(seg.coords[i - 1]!, seg.coords[i]!),
        ),
      );
      if (turn <= cfg.segment.minTrustedTurnDeg) continue; // noise — drop
    }
    radii.push(r);
  }

  const minRadiusM = radii.length ? Math.min(...radii) : Infinity;
  const avgRadiusM = radii.length ? radii.reduce((s, r) => s + r, 0) / radii.length : Infinity;
  const g = gradientPct(seg.coords);

  return {
    ...seg,
    minRadiusM,
    avgRadiusM,
    headingChangeDeg: headingChangeDeg(seg.coords),
    gradientPct: g.pct,
    gradientKnown: g.known,
    surfaceQuality: 'unknown', // GeoJSON path carries no surface tag; OSM path can set this later
  };
}
