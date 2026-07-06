/**
 * MapProvider seam (spec Open Question a). v1 uses Mapbox (@rnmapbox/maps); this interface keeps the
 * swap to MapLibre + self-hosted tiles a provider change, not a rewrite. Screens/features depend on
 * THIS shape, never on @rnmapbox/maps directly. The concrete Mapbox implementation lands in Phase 2.
 */
import { env } from '@/config/env';

export interface OfflineRegionSpec {
  id: string;
  styleUrl: string;
  bounds: [[number, number], [number, number]]; // [[west,south],[east,north]]
  minZoom: number;
  maxZoom: number;
}

export interface OfflineRegionStatus {
  id: string;
  percentage: number;
  completed: boolean;
}

export interface MapProvider {
  /** Vector style URL for the dark, minimal basemap. */
  getStyleUrl(): string;
  /** Download a tile pack for offline use (spec §8 offline caching). */
  downloadRegion(spec: OfflineRegionSpec): Promise<OfflineRegionStatus>;
  /** Remove a previously downloaded pack. */
  deleteRegion(id: string): Promise<void>;
  /** List downloaded packs. */
  listRegions(): Promise<OfflineRegionStatus[]>;
}

/** Static config for the active provider (Mapbox in v1). Token comes from the validated env. */
export const mapConfig = {
  provider: 'mapbox' as const,
  publicToken: env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN,
  // Dark, minimal basemap; a custom Studio style URL slots in here later.
  defaultStyleUrl: 'mapbox://styles/mapbox/dark-v11',
} as const;
