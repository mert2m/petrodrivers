// scripts/scoring/classify.ts — pure, total, deterministic difficulty classification.
import type { ScoringConfig } from './config';
import type { ClassifierInput, Difficulty } from './types';

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * Total, deterministic tier. Precedence ladder (first match wins), all edges from cfg.thresholds:
 *   1 hairpin   : minRadius < hairpinMax AND heading > hairpinMinHeading
 *   2 technical : minRadius < technicalMax      (also catches sub-hairpin radius with low heading)
 *   3 medium    : minRadius <= easyMin
 *   4 easy      : otherwise (incl. +Infinity)
 * Then escalators (at most one applies): sustained-tight raises easy/medium -> technical;
 * steep-easy raises easy -> medium. Escalators never raise technical/hairpin, so the ladder is monotone.
 */
export function classifyDifficulty(m: ClassifierInput, cfg: ScoringConfig): Difficulty {
  const t = cfg.thresholds;
  let tier: Difficulty;
  if (m.minRadiusM < t.hairpinMaxRadiusM && m.headingChangeDeg > t.hairpinMinHeadingDeg) {
    tier = 'hairpin';
  } else if (m.minRadiusM < t.technicalMaxRadiusM) {
    tier = 'technical';
  } else if (m.minRadiusM <= t.easyMinRadiusM) {
    tier = 'medium';
  } else {
    tier = 'easy';
  }

  if (
    (tier === 'easy' || tier === 'medium') &&
    m.headingChangeDeg >= t.sustainedTightMinHeadingDeg
  ) {
    return 'technical';
  }
  if (tier === 'easy' && m.gradientKnown && Math.abs(m.gradientPct) > t.easyMaxAbsGradientPct) {
    return 'medium';
  }
  return tier;
}

/**
 * Continuous 0..1 difficulty score for map interpolation. Weighted blend; monotone (non-increasing in
 * radius, non-decreasing in heading/|gradient|). When gradient is unknown, its weight is redistributed
 * across curvature+heading so the result stays in [0,1].
 */
export function difficultyScore(m: ClassifierInput, cfg: ScoringConfig): number {
  const n = cfg.scoreNorm;
  const curvature = clamp01((n.radiusCeilM - m.minRadiusM) / (n.radiusCeilM - n.radiusFloorM));
  const heading = clamp01(m.headingChangeDeg / n.headingFullScaleDeg);
  const gradient = m.gradientKnown ? clamp01(Math.abs(m.gradientPct) / n.gradientFullScalePct) : 0;

  const w = cfg.scoreWeights;
  if (!m.gradientKnown) {
    const denom = w.curvature + w.heading || 1;
    return clamp01((w.curvature * curvature + w.heading * heading) / denom);
  }
  return clamp01(w.curvature * curvature + w.heading * heading + w.gradient * gradient);
}
