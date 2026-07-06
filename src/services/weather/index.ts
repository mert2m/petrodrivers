/**
 * Weather seam (spec §6). Fetched at VIEW TIME, never stored. The client calls a Supabase Edge Function
 * proxy (Open-Meteo behind it) so the provider key stays server-side. Responses are Zod-validated at
 * this boundary. Concrete fetch lands in Phase 2; the schema + interface are fixed now.
 */
import { z } from 'zod';

import { env } from '@/config/env';

export const WeatherSchema = z.object({
  tempC: z.number(),
  apparentTempC: z.number().optional(),
  windKph: z.number(),
  /** WMO weather code (Open-Meteo). Mapped to an icon/label in the UI. */
  weatherCode: z.number().int(),
  isDay: z.boolean(),
  observedAt: z.string(), // ISO timestamp from the proxy
});
export type Weather = z.infer<typeof WeatherSchema>;

export interface WeatherProvider {
  current(lat: number, lng: number): Promise<Weather>;
}

/** Guard so callers fail loudly if the proxy URL isn't configured. */
export function weatherProxyUrl(): string {
  const url = env.EXPO_PUBLIC_WEATHER_PROXY_URL;
  if (!url) throw new Error('EXPO_PUBLIC_WEATHER_PROXY_URL is not configured');
  return url;
}

// TODO(Phase 2): implement fetch(weatherProxyUrl()) -> WeatherSchema.parse(json). Attribution: Open-Meteo (CC BY 4.0).
