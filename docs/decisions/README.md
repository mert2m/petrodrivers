# Architecture Decision Records

The consolidated Phase-0 decision log lives in [`../phase-0-plan.md`](../phase-0-plan.md) (Part 1 §1.3).
Record future material decisions as numbered ADRs here (e.g. `0001-map-provider.md`) when they change or
add to that log. Key locked decisions to date:

- **SDK / New Architecture** — Expo SDK 57, New Arch required (Reanimated v4 + rnmapbox 10.x).
- **Map provider** — Mapbox (`@rnmapbox/maps`) for v1 behind the `services/map` MapProvider seam; MapLibre
  - self-hosted tiles is the swap lever at a defined MAU trigger.
- **Reanimated v4** — overrides the spec's "v3" (SDK 57 bundles v4 + worklets). See [`CLAUDE.md`](../../CLAUDE.md).
- **Weather** — Open-Meteo (commercial) via Edge proxy; OpenWeather fallback.
- **Elevation** — self-hosted OpenTopoData + Copernicus GLO-30 (offline pipeline only).
- **Styling** — NativeWind v4 on Tailwind v3 (NOT Tailwind v4 / NativeWind v5 preview).
