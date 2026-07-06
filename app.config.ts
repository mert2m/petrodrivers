import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Expo app config. Secrets come from the environment (see .env.example):
 *  - MAPBOX_DOWNLOAD_TOKEN: build-time secret token (sk.*) for the @rnmapbox/maps native SDK download.
 *  - SENTRY_DSN + EXPO_PUBLIC_SENTRY_ENABLED: crash reporting behind a flag.
 * Runtime client config (Supabase URL/anon key, Mapbox PUBLIC token, weather proxy) is read via
 * EXPO_PUBLIC_* vars and validated by src/config/env.ts at boot.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PetroDrivers',
  slug: 'petrodrivers',
  scheme: 'petrodrivers',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark', // dark-mode only
  // New Architecture is the default (and required by Reanimated v4 + @rnmapbox/maps 10.x) on SDK 57.
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.petrodrivers.app',
    infoPlist: {
      // Honest, minimal, feature-scoped location string (spec §11).
      NSLocationWhenInUseUsageDescription:
        'PetroDrivers uses your location to show driving roads near you and center the map. It is never used to track speed.',
    },
  },
  android: {
    package: 'com.petrodrivers.app',
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
  },
  plugins: [
    'expo-router',
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN ?? '',
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG ?? '',
        project: process.env.SENTRY_PROJECT ?? '',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
  },
});
