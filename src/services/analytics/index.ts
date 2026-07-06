/**
 * Thin analytics wrapper emitting the spec §2 success events. No vendor SDK wired yet — logs in dev,
 * no-ops unless enabled. Keep payloads PII-free beyond user id. Swap the sink in one place later.
 */
import { env } from '@/config/env';

/** The v1 success signals to instrument from day one (spec §2). */
export type AnalyticsEvent =
  | { name: 'road_detail_viewed'; roadId: string }
  | { name: 'favorite_added'; roadId: string }
  | { name: 'favorite_removed'; roadId: string }
  | { name: 'check_in_created'; roadId: string }
  | { name: 'map_opened' }
  | { name: 'offline_region_downloaded'; regionId: string };

export function track(event: AnalyticsEvent): void {
  if (!env.EXPO_PUBLIC_ANALYTICS_ENABLED) {
    if (__DEV__) console.log('[analytics:disabled]', event);
    return;
  }
  // TODO: forward to the chosen analytics sink (kept behind this seam).
  if (__DEV__) console.log('[analytics]', event);
}
