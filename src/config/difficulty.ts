/**
 * DIFFICULTY_THRESHOLDS_V0 — SINGLE SOURCE of the tunable classification constants (spec §7.5).
 * Imported by the app (map coloring / legend) AND the offline pipeline (scripts/scoring).
 *
 * Radius bands are contiguous & half-open so every value lands in exactly one tier:
 *   hairpin   [0, 30)  AND heading > 150°   (else falls through to technical)
 *   technical [30, 80)
 *   medium    [80, 200]
 *   easy      (200, +∞]
 * See scripts/scoring/classify.ts for the precedence ladder + escalators.
 */
export const DIFFICULTY_THRESHOLDS_V0 = {
  version: 0,
  hairpinMaxRadiusM: 30,
  technicalMaxRadiusM: 80,
  easyMinRadiusM: 200,
  hairpinMinHeadingDeg: 150,
  sustainedTightMinHeadingDeg: 150, // easy/medium escalate to technical at/above this heading change
  easyMaxAbsGradientPct: 6, // easy downgrades to medium when |gradient| exceeds this
  /** continuous blended score for map interpolation (weights sum to 1.0) */
  scoreWeights: { curvature: 0.6, heading: 0.25, gradient: 0.15 },
} as const;

export type DifficultyThresholds = typeof DIFFICULTY_THRESHOLDS_V0;
