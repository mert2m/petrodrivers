# CLAUDE.md — PetroDrivers conventions & running decision log

Premium iOS + Android app for discovering scenic/technical **driving roads** on a difficulty-colored map.
Discovery-first wedge (spec §1). This file is the source of truth for conventions and decisions. Keep it
updated every phase.

> **Legal/store guardrail (non-negotiable, spec §11):** framed as legal, scenic, enjoyable driving
> discovery. **NO speed, lap-time, or pace metrics anywhere.** Stats are count/coverage based only.
> `check_ins` has no speed column _by schema_. A one-time safety disclaimer shows on first run.

## Stack (LOCKED — see `docs/phase-0-plan.md` Part 1 for versions/rationale)

Expo SDK 57 (managed) + Expo Router · TypeScript strict · Supabase (Postgres/PostGIS, Auth, Storage,
Edge Fns) · Mapbox `@rnmapbox/maps` · TanStack Query · Zustand · NativeWind v4 (Tailwind v3) ·
Reanimated v4 · Zod · Sentry.

**Additions beyond the locked list (justified):** `react-native-worklets` (required peer of Reanimated
v4); `react-dom` (SDK-required peer, pinned to match `react`); `@expo/vector-icons` (tab icons; no longer
bundled by `expo`); `i18next` + `react-i18next` + `expo-localization` (Turkish + English support — see
Internationalization); `services/entitlements` no-op paywall seam; OpenWeather fallback + OpenTopoData/
Copernicus pipeline tooling (build-time only, not shipped). Add nothing else without a note here.

**Deviation from spec:** spec said Reanimated **v3**; SDK 57 bundles **v4 + worklets** and v3 won't run
once worklets is installed. We ship **v4**. This is the only intentional stack override.

## Architecture rules (enforce in review)

1. Data flow: `services/supabase` (typed client) → feature `api/` → React Query `hooks/` → components.
   **UI never imports `@/services/supabase` directly.** `app/` screens are thin.
2. `services/` is the only outside-world boundary (Supabase, map, weather proxy, Sentry, analytics,
   entitlements). Features import services, never raw SDKs (e.g. never import `@rnmapbox/maps` in a screen —
   go through `services/map`).
3. **React Query owns all server state. Zustand is ephemeral UI state only** — never server cache.
4. **Zod validates every boundary**: env (`src/config/env.ts`), Edge payloads, third-party responses,
   PostGIS columns (wrap at feature `api/` — generated types surface geography/geometry as loose).
5. **Migrations are the schema source of truth** (`supabase/migrations`). `src/types/database.ts` is
   generated (`npm run gen:types`) — never hand-edit.
6. `strict: true`; no implicit `any`; exhaustive discriminated unions for `difficulty`/enums; avoid
   unjustified non-null assertions in app code.
7. No business logic in `app/` screens — they compose feature components + hooks.
8. Every screen handles **loading / empty / error** — no silent failures, no infinite spinners.

## Design system (spec §4)

Dark-mode only, black glassmorphism, orange accent. Tokens: single source in `src/theme/palette.json`
(colors + radii) consumed by both `tailwind.config.js` and `src/theme/tokens.ts` (which adds spacing,
type scale, motion/springs). **Blur discipline:** blur only on modals / floating cards / detail-sheet
header (`GlassCard blur`); flat surfaces for the map canvas and long lists. Prefer NativeWind classes;
reach for tokens for imperative/animation code. Primitives in `src/components/ui`: `Screen`, `Text`,
`Button`, `GlassCard`, `DifficultyBadge`, `ListRow`, `SegmentedControl`, `Sheet`.

Utility naming (palette groups use `DEFAULT`): `bg-surface`, `bg-surface-elevated`, `text-fg`,
`text-fg-secondary`, `bg-accent`, `border-line`, `bg-difficulty-easy|medium|technical|hairpin`.

## Internationalization (EN + TR)

All user-facing copy goes through i18n — **no hardcoded UI strings in components**. Setup lives in
`src/i18n`: `locales/en.ts` is the shape source of truth; `locales/tr.ts` is typed as a widened
`typeof en`, so a missing/extra key is a compile error. `react-i18next.d.ts` augments `t()` for
autocomplete + typo-safety. Device language is auto-detected (`expo-localization`); the user's choice
persists in AsyncStorage and is switchable from the Profile tab (EN / Türkçe). Use it as:
`const { t } = useTranslation(); t('map.title')`; interpolate with `t('road.roadId', { id })`. Init is a
side-effect import of `@/i18n` at the top of `app/_layout.tsx`. A jest test asserts EN/TR key parity.
When adding copy: add the key to `en.ts` first (compile forces the TR translation), never inline a string.

## Difficulty scoring (offline — spec §7)

Colored segments come from the offline pipeline in `scripts/scoring`, NOT on-device. App only reads
pre-scored `road_segments`. Tunable thresholds are a **single source**: `src/config/difficulty.ts`
(`DIFFICULTY_THRESHOLDS_V0`), re-used by `scripts/scoring/config.ts` so app + pipeline never drift.
Pure, tested core (implemented now): `scripts/scoring/{geo,classify}.ts`. IO stages
(`io/{overpass,elevation,postgis}`) are interfaces stubbed for Phase 1. Curvature is fit on **projected
metres** (`toPlanar`), never degrees; line is **resampled + smoothed before** any radius triplet.

## Backend / RLS notes

RLS is **deny-by-default**: every access path is an explicit policy (a table with RLS on but no policy
silently denies). Public read: `roads`, `road_segments`, `achievements`, curated `road_photos` (user_id
NULL), plus `road_reports`/`comments`. Owner-only writes elsewhere; `vehicle_setups` ownership is
**indirect** (setup → vehicle → user) via `EXISTS`. Storage owner-write keys off the first path segment:
upload to `<bucket>/<uid>/<file>`. Buckets: `road-photos` (public read), `avatars`.

## v2 seams (interfaces only — DO NOT implement)

`features/codriver` (AI co-driver/TTS) and `features/music` (Spotify): README + `types/*.ts` only. They
slot in later via the existing map selection state + Edge Function + entitlement seams. "Never" items get
no seam: speed/lap telemetry, live turn-by-turn nav, multiplayer/live location.

## Commands

- `npm run typecheck` · `npm run lint` · `npm test` (Jest) · `npm run format`
- `npm run gen:types` — regenerate `src/types/database.ts` from local Supabase after a migration change
- `bash scripts/db/verify-migrations.sh` — apply migrations + shims to a throwaway PostGIS container
  (proves they parse, index, enforce RLS, and are idempotent). CI also runs a TCP variant.

## Open questions carried into build (defaults chosen; confirm to change)

(a) Mapbox vs MapLibre — **Mapbox v1**, re-eval ~20–25k MAU. (b) Providers — **Open-Meteo + OpenTopoData/
GLO-30**. (c) Monetization — **free v1**, entitlement seam stubbed. (d) Launch region — **global/EU-first**
(GLO-30 default; US-first ⇒ USGS 3DEP 10m). (e) Supabase region — co-locate with launch region.

**Sentry resolved:** `expo install --fix` pinned `@sentry/react-native` to **7.11.0** (the SDK-57 tested
version), superseding the research's 8.x guess. Remaining Sentry risk is just a device smoke test at build.

## Known toolchain notes

- **`expo install --fix` crashes** on this exact `@expo/cli` (57.0.2) build: `Cannot find module
'./utils/autoAddConfigPlugins.js'`. It happens **after** versions are written to `package.json`, so the
  alignment still applies — only the config-plugin auto-add step fails. Add new deps with `npm install`
  (or `expo install <pkg>` may hit the same bug); revisit on the next `@expo/cli` patch.
- **Native modules not in Expo Go:** `@rnmapbox/maps` (+ its config plugin) needs a dev build.
- `react` is pinned to **19.2.3** (SDK 57), so `react-dom` and `react-test-renderer` are pinned to
  **19.2.3** to match. `@expo/vector-icons` is a direct dep (no longer bundled by `expo`).

## Phase status

- **Phase 0 (Foundation): DONE** — scaffold, theme/tokens, primitives, env (Zod), query client, services
  seams, CI, tests. Scoring pure-core implemented + tested. Migrations verified in PostGIS (15 tables /
  43 policies, idempotent). `database.ts` generated.
- **i18n (EN + TR): DONE** — `src/i18n` with device detection + Profile language switcher; all screens
  localized; EN/TR parity test. (37 tests green.)
- Next: **Phase 1** — Supabase project wiring, seed 3–5 real roads through the pipeline, then ~50; typed
  `roads` api + first React Query hooks. (Needs a real Supabase project — URL + anon/service keys.)

## How to verify Phase 0

`npm install` → `npm run typecheck` → `npm run lint` → `npm test` (all currently green: tsc 0, eslint 0,
37 tests). DB: with Docker running, `npm run db:verify` (auto-starts a throwaway PostGIS container). Running
the app needs a dev build (`npx expo run:ios`/`run:android`) with a Mapbox token in `.env` — not Expo Go
(`@rnmapbox/maps` is a native module). Note: `expo install --fix` aligns native versions but currently
crashes at the plugin step on `@expo/cli` 57.0.2 (see Known toolchain notes) — versions are already pinned.
