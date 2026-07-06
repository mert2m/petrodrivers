// scripts/scoring/geo.ts — geodesic + planar geometry helpers. All distances are METRES, never degrees.
import type { Coordinate, PlanarPoint } from './types';

const EARTH_R = 6371008.8; // mean Earth radius (m)
const AREA_EPS = 1e-6; // planar area below which three points are treated as collinear (m^2)
const LEN_EPS = 1e-6; // side length below which two points are treated as coincident (m)

const toRad = (d: number): number => (d * Math.PI) / 180;
const toDeg = (r: number): number => (r * 180) / Math.PI;

/** Great-circle distance in metres (haversine). */
export function haversineM(a: Coordinate, b: Coordinate): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing a->b in degrees, normalized to [0, 360). */
export function bearingDeg(a: Coordinate, b: Coordinate): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Normalize a heading delta to (-180, 180]. */
export function normalizeDeltaDeg(delta: number): number {
  let d = ((delta + 180) % 360) - 180;
  if (d <= -180) d += 360;
  return d;
}

/** Sum of absolute bearing changes across the polyline (degrees, >= 0). */
export function headingChangeDeg(coords: Coordinate[]): number {
  if (coords.length < 3) return 0;
  let total = 0;
  for (let i = 1; i < coords.length - 1; i++) {
    const b1 = bearingDeg(coords[i - 1]!, coords[i]!);
    const b2 = bearingDeg(coords[i]!, coords[i + 1]!);
    total += Math.abs(normalizeDeltaDeg(b2 - b1));
  }
  return total;
}

/** Signed gradient percent from first->last elevation over the horizontal run. */
export function gradientPct(coords: Coordinate[]): { pct: number; known: boolean } {
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (!first || !last || first.z === undefined || last.z === undefined) {
    return { pct: 0, known: false };
  }
  let run = 0;
  for (let i = 1; i < coords.length; i++) run += haversineM(coords[i - 1]!, coords[i]!);
  if (run < LEN_EPS) return { pct: 0, known: false };
  return { pct: ((last.z - first.z) / run) * 100, known: true };
}

/** Project WGS84 -> local planar metres (equirectangular about the centroid). Isotropic in metres. */
export function toPlanar(coords: Coordinate[]): PlanarPoint[] {
  if (coords.length === 0) return [];
  const lat0 = toRad(coords.reduce((s, c) => s + c.lat, 0) / coords.length);
  const lng0 = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
  const cosLat0 = Math.cos(lat0);
  return coords.map((c) => ({
    x: EARTH_R * toRad(c.lng - lng0) * cosLat0,
    y: EARTH_R * toRad(c.lat),
    z: c.z,
  }));
}

/**
 * Circumscribed-circle radius through three PROJECTED planar points, in metres.
 * radius = (|ab||bc||ca|) / (4 * area). Returns +Infinity for collinear/coincident inputs (no NaN).
 */
export function circumRadius(a: PlanarPoint, b: PlanarPoint, c: PlanarPoint): number {
  const ab = Math.hypot(b.x - a.x, b.y - a.y);
  const bc = Math.hypot(c.x - b.x, c.y - b.y);
  const ca = Math.hypot(a.x - c.x, a.y - c.y);
  if (ab < LEN_EPS || bc < LEN_EPS || ca < LEN_EPS) return Infinity;
  const area = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
  if (area < AREA_EPS) return Infinity;
  return (ab * bc * ca) / (4 * area);
}

export const mengerCurvature = (a: PlanarPoint, b: PlanarPoint, c: PlanarPoint): number =>
  1 / circumRadius(a, b, c);

/** Uniform geodesic resample at spacingM. Endpoints preserved; lng/lat/z linearly interpolated. */
export function resample(coords: Coordinate[], spacingM: number): Coordinate[] {
  if (coords.length < 2 || spacingM <= 0) return coords.slice();
  const out: Coordinate[] = [coords[0]!];
  let covered = 0; // cumulative distance from the start, up to the start of the current edge
  let nextMark = spacingM; // distance-from-start at which to place the next resampled point
  for (let i = 1; i < coords.length; i++) {
    const p0 = coords[i - 1]!;
    const p1 = coords[i]!;
    const segLen = haversineM(p0, p1);
    if (segLen < LEN_EPS) continue;
    while (nextMark <= covered + segLen) {
      const t = (nextMark - covered) / segLen;
      out.push(lerpCoord(p0, p1, t));
      nextMark += spacingM;
    }
    covered += segLen;
  }
  const last = coords[coords.length - 1]!;
  const tail = out[out.length - 1]!;
  if (haversineM(tail, last) > LEN_EPS) out.push(last);
  return out;
}

function lerpCoord(a: Coordinate, b: Coordinate, t: number): Coordinate {
  const z = a.z !== undefined && b.z !== undefined ? a.z + (b.z - a.z) * t : undefined;
  return { lng: a.lng + (b.lng - a.lng) * t, lat: a.lat + (b.lat - a.lat) * t, z };
}

/** Centered moving average (odd window). Endpoints are preserved. Run AFTER resample, BEFORE curvature. */
export function smooth(coords: Coordinate[], window: number): Coordinate[] {
  if (window <= 1 || coords.length < 3) return coords.slice();
  const half = Math.floor(window / 2);
  const out: Coordinate[] = coords.map((c) => ({ ...c }));
  for (let i = half; i < coords.length - half; i++) {
    let sx = 0;
    let sy = 0;
    let sz = 0;
    let zc = 0;
    for (let k = -half; k <= half; k++) {
      const c = coords[i + k]!;
      sx += c.lng;
      sy += c.lat;
      if (c.z !== undefined) {
        sz += c.z;
        zc++;
      }
    }
    out[i] = {
      lng: sx / window,
      lat: sy / window,
      z: zc === window ? sz / window : coords[i]!.z,
    };
  }
  return out;
}

/** Split a polyline into segments of ~targetLengthM, >=3 points each, merging a runt tail (< minLengthM). */
export function segmentize(
  coords: Coordinate[],
  targetLengthM: number,
  minLengthM: number,
): Coordinate[][] {
  if (coords.length < 2) return coords.length ? [coords.slice()] : [];
  const segments: Coordinate[][] = [];
  let current: Coordinate[] = [coords[0]!];
  let acc = 0;
  for (let i = 1; i < coords.length; i++) {
    const p0 = coords[i - 1]!;
    const p1 = coords[i]!;
    acc += haversineM(p0, p1);
    current.push(p1);
    if (acc >= targetLengthM && i < coords.length - 1) {
      segments.push(current);
      current = [p1]; // share the boundary vertex so segments stay connected
      acc = 0;
    }
  }
  if (current.length >= 2) segments.push(current);

  // merge a too-short tail into the previous segment
  if (segments.length >= 2) {
    const tail = segments[segments.length - 1]!;
    if (segmentLengthM(tail) < minLengthM) {
      const prev = segments[segments.length - 2]!;
      prev.push(...tail.slice(1));
      segments.pop();
    }
  }
  return segments;
}

export function segmentLengthM(coords: Coordinate[]): number {
  let len = 0;
  for (let i = 1; i < coords.length; i++) len += haversineM(coords[i - 1]!, coords[i]!);
  return len;
}
