// tailwind.config.js — NativeWind v4 (Tailwind v3). Colors/radii come from the single-source palette.json.
const palette = require('./src/theme/palette.json');

/** radii numbers (px) -> tailwind borderRadius strings */
const borderRadius = Object.fromEntries(
  Object.entries(palette.radii).map(([k, v]) => [k, `${v}px`]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // dark-only app; we render inside a forced-dark root
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: palette.colors,
      borderRadius,
      fontFamily: {
        // Wire real font files in Phase 2; system fallback keeps the premium feel for now.
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
