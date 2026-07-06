// Classifier fixtures — each pins a real-world case + its expected tier (spec §7 / Part 3 §3.4).
import type { ClassifierInput, Difficulty } from '../types';

const base = { avgRadiusM: 0, headingChangeDeg: 0, gradientPct: 0, gradientKnown: true };

export const CLASSIFIER_FIXTURES: {
  name: string;
  input: ClassifierInput;
  expected: Difficulty;
}[] = [
  {
    name: 'KNOWN_HAIRPIN',
    input: { ...base, minRadiusM: 12, avgRadiusM: 18, headingChangeDeg: 178 },
    expected: 'hairpin',
  },
  {
    name: 'TIGHT_BUT_STRAIGHTISH',
    input: { ...base, minRadiusM: 22, avgRadiusM: 60, headingChangeDeg: 40 },
    expected: 'technical',
  },
  {
    name: 'KNOWN_TECHNICAL',
    input: { ...base, minRadiusM: 55, avgRadiusM: 70, headingChangeDeg: 60 },
    expected: 'technical',
  },
  {
    name: 'SUSTAINED_TIGHT',
    input: { ...base, minRadiusM: 130, avgRadiusM: 150, headingChangeDeg: 160 },
    expected: 'technical',
  },
  {
    name: 'STEEP_EASY',
    input: { ...base, minRadiusM: 400, avgRadiusM: 500, headingChangeDeg: 10, gradientPct: 9 },
    expected: 'medium',
  },
  {
    name: 'MISSING_ELEV_STAYS_EASY',
    input: {
      ...base,
      minRadiusM: 400,
      avgRadiusM: 500,
      headingChangeDeg: 10,
      gradientPct: 0,
      gradientKnown: false,
    },
    expected: 'easy',
  },
  {
    name: 'BOUNDARY_80',
    input: { ...base, minRadiusM: 80, avgRadiusM: 120, headingChangeDeg: 30 },
    expected: 'medium',
  },
  {
    name: 'BOUNDARY_200',
    input: { ...base, minRadiusM: 200, avgRadiusM: 260, headingChangeDeg: 20 },
    expected: 'medium',
  },
  {
    name: 'KNOWN_HIGHWAY',
    input: { ...base, minRadiusM: 900, avgRadiusM: 1200, headingChangeDeg: 8 },
    expected: 'easy',
  },
  {
    name: 'STRAIGHT_SEGMENT',
    input: { ...base, minRadiusM: Infinity, avgRadiusM: Infinity, headingChangeDeg: 0 },
    expected: 'easy',
  },
];
