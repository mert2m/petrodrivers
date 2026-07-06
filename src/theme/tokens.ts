/**
 * Design tokens (dark-only). Colors + radii come from the single-source palette.json (also consumed by
 * tailwind.config.js). Spacing/typography/motion live here as typed JS for use in RN style objects and
 * Reanimated. Prefer NativeWind classes in components; reach for these tokens for imperative/animation code.
 */
import palette from './palette.json';

export const colors = palette.colors;
export const radii = palette.radii;

/** 4pt spacing scale (numbers = px for RN styles; NativeWind's default scale mirrors this). */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** One type scale. sizes in px; weights map to RN fontWeight. */
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const;

/** Motion tokens — consistent durations + spring configs for Reanimated (spec §4). */
export const motion = {
  duration: { fast: 150, base: 240, slow: 360 },
  spring: {
    /** snappy UI (buttons, chips) */
    snappy: { damping: 20, stiffness: 260, mass: 1 },
    /** smooth sheets/cards */
    smooth: { damping: 24, stiffness: 170, mass: 1 },
    /** gentle, premium settle */
    gentle: { damping: 30, stiffness: 120, mass: 1 },
  },
} as const;

/** The 4 difficulty tiers that color the map. Single source of the string union across app + pipeline. */
export type Difficulty = 'easy' | 'medium' | 'technical' | 'hairpin';

export const theme = { colors, radii, spacing, typography, motion } as const;
export type Theme = typeof theme;
