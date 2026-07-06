// scripts/scoring/config.ts — single source of tunable constants. Thresholds re-use the app's
// DIFFICULTY_THRESHOLDS_V0 so app + pipeline can never drift.
import { DIFFICULTY_THRESHOLDS_V0 } from '../../src/config/difficulty';

export interface ScoringConfig {
  elevation: {
    sampleSpacingM: number;
    batchSize: number;
    dataset: 'copernicus-glo30' | 'srtm30' | 'usgs-3dep-10m';
  };
  segment: {
    targetLengthM: number;
    minLengthM: number;
    resampleSpacingM: number; // resample+smooth BEFORE curvature; must be << targetLengthM
    smoothingWindow: number; // odd, >= 1
    minTrustedRadiusM: number; // ignore triplets tighter than this (noise) unless the turn is real
    minTrustedTurnDeg: number;
  };
  thresholds: {
    hairpinMaxRadiusM: number;
    technicalMaxRadiusM: number;
    easyMinRadiusM: number;
    hairpinMinHeadingDeg: number;
    sustainedTightMinHeadingDeg: number;
    easyMaxAbsGradientPct: number;
  };
  scoreWeights: { curvature: number; heading: number; gradient: number };
  scoreNorm: {
    radiusFloorM: number;
    radiusCeilM: number;
    headingFullScaleDeg: number;
    gradientFullScalePct: number;
  };
}

export const DEFAULT_CONFIG: ScoringConfig = {
  elevation: { sampleSpacingM: 30, batchSize: 100, dataset: 'copernicus-glo30' },
  segment: {
    targetLengthM: 100,
    minLengthM: 40,
    resampleSpacingM: 10,
    smoothingWindow: 3,
    minTrustedRadiusM: 8,
    minTrustedTurnDeg: 12,
  },
  thresholds: {
    hairpinMaxRadiusM: DIFFICULTY_THRESHOLDS_V0.hairpinMaxRadiusM,
    technicalMaxRadiusM: DIFFICULTY_THRESHOLDS_V0.technicalMaxRadiusM,
    easyMinRadiusM: DIFFICULTY_THRESHOLDS_V0.easyMinRadiusM,
    hairpinMinHeadingDeg: DIFFICULTY_THRESHOLDS_V0.hairpinMinHeadingDeg,
    sustainedTightMinHeadingDeg: DIFFICULTY_THRESHOLDS_V0.sustainedTightMinHeadingDeg,
    easyMaxAbsGradientPct: DIFFICULTY_THRESHOLDS_V0.easyMaxAbsGradientPct,
  },
  scoreWeights: { ...DIFFICULTY_THRESHOLDS_V0.scoreWeights },
  scoreNorm: {
    radiusFloorM: 15,
    radiusCeilM: 300,
    headingFullScaleDeg: 180,
    gradientFullScalePct: 15,
  },
};
