# functions/

Supabase Edge Functions.

- `weather-proxy` (Phase 2) — proxies Open-Meteo so the provider key stays server-side; the client's
  `services/weather` calls this, never the provider directly. Validate the response with Zod.

Future v2 siblings drop in here behind the same seam: co-driver TTS token-signing, Spotify OAuth callback.
