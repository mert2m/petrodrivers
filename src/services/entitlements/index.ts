/**
 * Entitlement seam (spec Open Question c). v1 ships FREE: everyone is `free`. This no-op exists so a
 * later paywall (premium co-driver, music, offline expansion) gates on `tier` WITHOUT touching auth.
 * Do not add billing here in v1 — just the shape.
 */
export type EntitlementTier = 'free' | 'premium';

export interface Entitlements {
  tier: EntitlementTier;
}

/** Hook form so features read entitlements the same way they will once a real provider lands. */
export function useEntitlements(): Entitlements {
  return { tier: 'free' };
}

export function hasPremium(e: Entitlements): boolean {
  return e.tier === 'premium';
}
