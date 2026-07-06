/** App-wide constants. Keep tunables that aren't secrets or difficulty thresholds here. */

export const APP_NAME = 'PetroDrivers';

/** Map viewport loading: don't ship the world — query segments by bbox with a small padding. */
export const MAP = {
  /** fraction of viewport to pad the bbox query by, so panning feels seamless */
  viewportPadRatio: 0.25,
  /** minimum zoom at which we start requesting segments (avoid whole-country pulls) */
  minSegmentZoom: 7,
} as const;

/** React Query cache tuning (server data is relatively static for the curated catalog). */
export const QUERY = {
  staleTimeMs: 5 * 60 * 1000, // 5 min
  gcTimeMs: 30 * 60 * 1000, // 30 min
  retry: 2,
} as const;

/** First-run safety disclaimer copy (spec §11). Shown once; framed as legal, scenic driving. */
export const SAFETY_DISCLAIMER = {
  title: 'Drive within the law and conditions',
  body: 'PetroDrivers helps you discover great roads to enjoy responsibly. Obey all speed limits and traffic laws, drive to the conditions, and never interact with the app while driving.',
} as const;
