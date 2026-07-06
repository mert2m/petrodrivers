/**
 * Env boundary — validated once at boot with Zod (spec §10). Access env ONLY through `env` from here;
 * never read process.env elsewhere. EXPO_PUBLIC_* vars are inlined by Metro at build time.
 */
import { z } from 'zod';

// "true"/"1" -> true, anything else (incl. undefined) -> false. Default is on the string input, so the
// types line up cleanly (input string, output boolean).
const boolish = z
  .string()
  .default('false')
  .transform((v) => v === 'true' || v === '1');

const EnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN: z.string().min(1),
  EXPO_PUBLIC_WEATHER_PROXY_URL: z.string().url().optional(),
  EXPO_PUBLIC_SENTRY_ENABLED: boolish,
  EXPO_PUBLIC_SENTRY_DSN: z.string().optional().default(''),
  EXPO_PUBLIC_ANALYTICS_ENABLED: boolish,
  EXPO_PUBLIC_APP_ENV: z
    .enum(['development', 'test', 'preview', 'production'])
    .default('development'),
});

// Referenced explicitly so Metro's static replacement of process.env.EXPO_PUBLIC_* works (no dynamic keys).
const raw = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN,
  EXPO_PUBLIC_WEATHER_PROXY_URL: process.env.EXPO_PUBLIC_WEATHER_PROXY_URL,
  EXPO_PUBLIC_SENTRY_ENABLED: process.env.EXPO_PUBLIC_SENTRY_ENABLED,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  EXPO_PUBLIC_ANALYTICS_ENABLED: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
};

const parsed = EnvSchema.safeParse(raw);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(
    `Invalid environment configuration. Check your .env against .env.example:\n${issues}`,
  );
}

export const env = parsed.data;
export type Env = typeof env;
