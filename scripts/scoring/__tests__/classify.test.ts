import { classifyDifficulty, difficultyScore } from '../classify';
import { DEFAULT_CONFIG } from '../config';
import type { ClassifierInput, Difficulty } from '../types';
import { CLASSIFIER_FIXTURES } from './fixtures';

const cfg = DEFAULT_CONFIG;
const ALL: Difficulty[] = ['easy', 'medium', 'technical', 'hairpin'];

describe('classifyDifficulty', () => {
  it.each(CLASSIFIER_FIXTURES)('$name -> $expected', ({ input, expected }) => {
    expect(classifyDifficulty(input, cfg)).toBe(expected);
  });

  it('closes the sub-hairpin-radius gap: r<30 with low heading is technical, not hairpin', () => {
    expect(classifyDifficulty(mk({ minRadiusM: 25, headingChangeDeg: 150 }), cfg)).toBe(
      'technical',
    );
    expect(classifyDifficulty(mk({ minRadiusM: 25, headingChangeDeg: 151 }), cfg)).toBe('hairpin');
  });

  it('boundary at exactly 80 m -> medium (technical is < 80)', () => {
    expect(classifyDifficulty(mk({ minRadiusM: 80 }), cfg)).toBe('medium');
    expect(classifyDifficulty(mk({ minRadiusM: 79.9 }), cfg)).toBe('technical');
  });

  it('boundary at exactly 200 m -> medium; just above -> easy', () => {
    expect(classifyDifficulty(mk({ minRadiusM: 200 }), cfg)).toBe('medium');
    expect(classifyDifficulty(mk({ minRadiusM: 200.1 }), cfg)).toBe('easy');
  });

  it('sustained-tight escalator fires at exactly the heading threshold (>=150)', () => {
    expect(classifyDifficulty(mk({ minRadiusM: 300, headingChangeDeg: 149 }), cfg)).toBe('easy');
    expect(classifyDifficulty(mk({ minRadiusM: 300, headingChangeDeg: 150 }), cfg)).toBe(
      'technical',
    );
  });

  it('is total: every input (incl. +Infinity) yields a valid Difficulty', () => {
    for (let i = 0; i < 500; i++) {
      const r = i % 7 === 0 ? Infinity : (i * 3.13) % 1200;
      const h = (i * 1.7) % 360;
      const g = ((i % 21) - 10) * 1.5;
      const out = classifyDifficulty(
        mk({ minRadiusM: r, headingChangeDeg: h, gradientPct: g }),
        cfg,
      );
      expect(ALL).toContain(out);
    }
  });
});

describe('difficultyScore', () => {
  it('stays within [0,1] across the fixture set', () => {
    for (const f of CLASSIFIER_FIXTURES) {
      const s = difficultyScore(f.input, cfg);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  it('is non-increasing in radius (tighter corner => higher score)', () => {
    const tight = difficultyScore(mk({ minRadiusM: 20 }), cfg);
    const open = difficultyScore(mk({ minRadiusM: 500 }), cfg);
    expect(tight).toBeGreaterThan(open);
  });

  it('straight segment (r=+Infinity, no heading) scores ~0', () => {
    expect(difficultyScore(mk({ minRadiusM: Infinity, headingChangeDeg: 0 }), cfg)).toBeCloseTo(
      0,
      5,
    );
  });

  it('unknown gradient renormalizes weights and stays in range', () => {
    const known = difficultyScore(
      mk({ minRadiusM: 100, headingChangeDeg: 90, gradientPct: 0, gradientKnown: true }),
      cfg,
    );
    const unknown = difficultyScore(
      mk({ minRadiusM: 100, headingChangeDeg: 90, gradientKnown: false }),
      cfg,
    );
    expect(unknown).toBeGreaterThanOrEqual(0);
    expect(unknown).toBeLessThanOrEqual(1);
    // With gradient=0 either way, renormalization should make the unknown case score at least as high.
    expect(unknown).toBeGreaterThanOrEqual(known - 1e-9);
  });
});

function mk(p: Partial<ClassifierInput>): ClassifierInput {
  return {
    minRadiusM: 100,
    avgRadiusM: 100,
    headingChangeDeg: 0,
    gradientPct: 0,
    gradientKnown: true,
    ...p,
  };
}
