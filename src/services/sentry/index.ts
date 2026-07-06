/**
 * Crash/error reporting behind a flag (spec §10). No-ops entirely unless EXPO_PUBLIC_SENTRY_ENABLED
 * and a DSN are set, so dev/test never phone home. Keep captures PII-free beyond user id.
 */
import * as Sentry from '@sentry/react-native';

import { env } from '@/config/env';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!env.EXPO_PUBLIC_SENTRY_ENABLED || !env.EXPO_PUBLIC_SENTRY_DSN) return;
  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    environment: env.EXPO_PUBLIC_APP_ENV,
    enableAutoSessionTracking: true,
    tracesSampleRate: env.EXPO_PUBLIC_APP_ENV === 'production' ? 0.2 : 1.0,
  });
  initialized = true;
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) {
    if (__DEV__) console.error('[captureError]', error, context);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

/** Associate crashes with a user id only (no email/name/PII). */
export function setSentryUser(userId: string | null): void {
  if (!initialized) return;
  Sentry.setUser(userId ? { id: userId } : null);
}
