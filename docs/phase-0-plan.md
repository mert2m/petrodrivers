# PetroDrivers — Phase-0 Planning Package

_Prepared for founder sign-off. Spec §12. Nothing here is app code — this is the planning artifact. All versions/pricing verified against mid-2026 research (2026-07-06); pin with caret/tilde and let `npx expo install` reconcile SDK-native modules._

---

## Executive Summary

PetroDrivers is a dark-themed, offline-capable driving-roads app: a difficulty-colored map over a curated set of iconic roads, backed by a Postgres/PostGIS catalog and an offline scoring pipeline that classifies every road segment (easy/medium/technical/hairpin) from curvature, heading change, and gradient. The architecture is **feature-first with a hard services boundary** — UI never touches Supabase, React Query owns all server state, Zustand holds only ephemeral UI state, and every external SDK sits behind a swappable wrapper. The **three load-bearing decisions**: (1) **Expo SDK 57 + New Architecture is mandatory** (Reanimated v4 and `@rnmapbox/maps` 10.3.x are New-Arch-only) — this forces a one-line override of the spec's "Reanimated v3"; (2) **Mapbox for v1 behind a MapProvider seam**, free to ~25k MAU with MAU-included offline packs, with MapLibre + self-hosted tiles as a config swap at a defined MAU trigger; (3) **a licensing-clean offline pipeline** — self-hosted OpenTopoData/Copernicus GLO-30 elevation and proxied Open-Meteo weather, because the pipeline stores/derives data that Google/Mapbox elevation TOS forbid caching. A **no-op entitlements seam** is stubbed so a later paywall needs no auth refactor. Everything is consistent across the schema, the SQL, and the scoring interface — the `road_segments` columns, difficulty enum, and `DIFFICULTY_THRESHOLDS_V0` values are a single source of truth shared by app and pipeline.

---

# Part 1 — Architecture, Folder Tree & Decision Log (§12.1)

## 1.1 Opinionated defaults (stated as assumptions)

- **Expo SDK 57** (RN 0.86, React 19.2.3), **New Architecture / Fabric required** by the stack.
- **Mapbox (`@rnmapbox/maps`) for v1** — free at your scale, offline downloads MAU-included on the Mapbox Maps SDK v10/v11 native it wraps, best offline ergonomics. Behind a **MapProvider seam** so MapLibre + self-hosted PMTiles is a provider swap, not a rewrite.
- **Reanimated v4.5 + worklets** — the spec's "Reanimated v3" is outdated for SDK 57. **This is the one place this package overrides the LOCKED spec** (justified in §1.3). `react-native-worklets` is a mandatory SDK-bundled peer, not a discretionary dependency.
- **Weather:** Open-Meteo (paid commercial plan) via Edge Function proxy; OpenWeather One Call 3.0 fallback. Both behind `services/weather`.
- **Elevation:** self-hosted OpenTopoData + Copernicus GLO-30 in the offline `scripts/` pipeline (SRTM fallback; USGS 3DEP 10m added if US-first launch). Build-time pipeline tooling, not app-runtime stack.
- **Monetization assumption:** v1 ships **free**, but an **entitlement seam** (`useEntitlements()` → `{ tier: 'free' }`) is stubbed. _(See Open Question c.)_

_Stack-addition ledger: the only additions beyond the LOCKED tech list are (1) `react-native-worklets` — a required peer of the Reanimated v4 override; (2) the `services/entitlements/` no-op seam (Open Question c); (3) the OpenWeather fallback and the OpenTopoData/Copernicus pipeline tooling — none of which ship in the app bundle. No other runtime dependency is introduced._

## 1.2 Folder Tree (spec §5)

`codriver/` and `music/` are **README + TODO-interface only** v2 seams.

```
petrodrivers/
├── app/                              # Expo Router routes ONLY. Thin screens. NO business logic, NO Supabase calls.
│   ├── _layout.tsx                   # Root: providers (QueryClient, Sentry, theme, auth gate, Mapbox token init)
│   ├── index.tsx                     # Entry redirect (→ auth or → (tabs)/map)
│   ├── (auth)/{_layout,sign-in,sign-up}.tsx
│   ├── (tabs)/                       # Main tab bar (dark, glass)
│   │   ├── _layout.tsx
│   │   ├── map.tsx                   # → features/map screen
│   │   ├── discover.tsx              # curated 50 + collections browse
│   │   ├── garage.tsx                # → features/garage
│   │   └── dashboard.tsx             # → features/dashboard (passport, stats, favorites)
│   ├── road/[id].tsx                 # Road detail sheet → features/roads screen
│   ├── collection/[id].tsx
│   ├── profile/[id].tsx
│   └── +not-found.tsx
│
├── src/
│   ├── features/                     # FEATURE-FIRST. Each owns api/components/hooks/stores/types/utils.
│   │   ├── map/                      # difficulty-colored map, viewport bbox queries, offline packs
│   │   │   ├── api/                  # bbox → segments query (calls services/supabase)
│   │   │   ├── components/           # MapCanvas, SegmentLineLayer (data-driven difficulty expr), OfflineDownloadButton
│   │   │   ├── hooks/                # useSegmentsInViewport, useOfflinePacks
│   │   │   ├── stores/               # ephemeral: camera state, selected segment (Zustand)
│   │   │   ├── types/  utils/        # difficulty→color expression builder
│   │   ├── roads/                    # detail: photos, elevation profile, corners, surface, scenic, reports
│   │   ├── favorites/                # favorites + collections
│   │   ├── auth/                     # session, profile bootstrap
│   │   ├── garage/                   # vehicles, tires, suspension, notes
│   │   ├── community/                # check-ins (NO speed), photos, comments, drive history
│   │   ├── dashboard/                # passport/achievements, count-based stats, favorites roll-up
│   │   ├── codriver/                 # ⛔ v2 SEAM — README.md + types/codriver.ts ONLY. No impl.
│   │   └── music/                    # ⛔ v2 SEAM — README.md + types/music.ts (Spotify) ONLY. No impl.
│   │
│   ├── components/ui/                # Cross-feature PRIMITIVES: Screen, GlassCard, Text, Button,
│   │                                 #   Chip/DifficultyBadge, Sheet, ListRow, SegmentedControl
│   ├── services/                     # The ONLY things that touch the outside world
│   │   ├── supabase/                 # typed createClient<Database>(); AsyncStorage auth; detectSessionInUrl:false
│   │   ├── map/                      # MapProvider SEAM: getStyleUrl(), downloadRegion(), deleteRegion() over offlineManager
│   │   ├── weather/                  # → Edge Function proxy (Open-Meteo); Zod-validated; NOT stored
│   │   ├── entitlements/             # useEntitlements() → {tier:'free'}. No-op paywall seam (Open Question c).
│   │   └── sentry/                   # init + capture wrappers
│   ├── lib/                          # Pure, dependency-light helpers (formatters, geo math, result types)
│   ├── theme/                        # Design tokens (dark-only, orange accent) → Tailwind config
│   ├── config/                       # App config — incl. DIFFICULTY_THRESHOLDS_V0 (single source; see §1.3)
│   └── types/database.ts             # GENERATED: supabase gen types typescript. PostGIS cols come out loose → wrap at api/.
│
├── supabase/                         # SCHEMA SOURCE OF TRUTH
│   ├── migrations/                   # every schema change = a SQL migration (Part 2). PostGIS, GIST, RLS.
│   ├── functions/                    # Edge Functions: weather-proxy (+ future signed-token helpers)
│   ├── seed.sql
│   └── config.toml
│
├── scripts/                          # OFFLINE scoring pipeline (Part 3). NOT shipped. Node + Docker (OpenTopoData).
│   ├── ingest/ elevation/ segment/ score/ write/ curated/
│   │                                 # score/ imports the SAME DIFFICULTY_THRESHOLDS_V0 config as the app
│   └── docker-compose.opentopodata.yml
│
├── docs/{architecture.md, decisions/}   # ADRs: map provider, weather, elevation, SDK
├── .env.example                      # validated by Zod at boot (supabase, map token, weather proxy url)
├── app.config.ts                     # Expo config plugins: @rnmapbox/maps (download token), sentry/expo, dev-client
├── babel.config.js                   # babel-preset-expo (auto-configures reanimated/worklets plugin)
├── tailwind.config.js                # NativeWind v4 → Tailwind v3; tokens from src/theme
├── metro.config.js                   # nativewind + sentry metro
├── tsconfig.json                     # strict: true; noImplicitAny; no unjustified non-null assertions
└── package.json
```

## 1.3 Decision Log

All versions verified 2026-07-06. **Pin with caret/tilde; run `npx expo install` for SDK-native modules** rather than hand-pinning.

| Decision                     | Choice                                                                             | Version / Value                                                      | Rationale                                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Expo SDK**                 | SDK 57 (New Arch, Fabric)                                                          | `expo ~57.0.x`                                                       | Stable, released 2026-06-30; bundles RN 0.86 + React 19.2.3. New Arch **required** (Reanimated v4 + rnmapbox 10.3.x New-Arch-only).                                                                                                                                                                              |
| React Native                 | bundled                                                                            | `0.86.x` (via `expo install`)                                        | SDK 57 bundled; no user-facing breaks vs 0.85.                                                                                                                                                                                                                                                                   |
| React                        | bundled                                                                            | `~19.2.3`                                                            | Unchanged from SDK 56.                                                                                                                                                                                                                                                                                           |
| Expo Router                  | bundled                                                                            | `~6.x`                                                               | React Navigation v7 transitive — do not hand-pin.                                                                                                                                                                                                                                                                |
| **Map SDK**                  | **Mapbox `@rnmapbox/maps`** (not MapLibre for v1)                                  | `^10.3.2`                                                            | New-Arch/Fabric only; wraps Mapbox Maps SDK v11; data-driven line styling for difficulty; **offline packs MAU-included on the v10/v11 native SDK**; free ≤25k MAU. Config plugin → **dev client required** (not Expo Go). _(Open Question a.)_                                                                   |
| **Animations**               | **Reanimated v4** (⚠️ spec said v3 — LOCKED-spec override)                         | `react-native-reanimated ~4.5.x` + `react-native-worklets ~0.10.x`   | Spec's "v3" is **outdated for SDK 57**, which bundles Reanimated 4.5 + worklets 0.10; v4 requires New Arch + the worklets peer, and **v3 will not run once worklets is installed**. Greenfield migration cost ~0 (same `useSharedValue`/`useAnimatedStyle`/`withTiming`).                                        |
| Gesture Handler              | bundled                                                                            | `~2.32.x`                                                            | Do **not** jump ahead of the SDK-bundled version.                                                                                                                                                                                                                                                                |
| Server state                 | React Query                                                                        | `@tanstack/react-query ^5.101.x`                                     | **Server state only.**                                                                                                                                                                                                                                                                                           |
| UI state                     | Zustand                                                                            | `^5.0.14`                                                            | **Ephemeral/UI state only — never server cache.**                                                                                                                                                                                                                                                                |
| Styling                      | NativeWind v4 (⚠️ not v5)                                                          | `nativewind ^4.x` + `tailwindcss ~3.4.x`                             | v4 = Tailwind v3 stable. **NativeWind v5 (Tailwind v4) is preview — do NOT ship v1 on it.** Dark-only tokens from `src/theme`.                                                                                                                                                                                   |
| Validation                   | Zod v4                                                                             | `zod ^4.4.x`                                                         | ~14× faster than v3; boundary validation. Note v4 namespace/error-API changes vs v3 examples online.                                                                                                                                                                                                             |
| Crash/errors                 | Sentry                                                                             | `@sentry/react-native ^8.17.x`                                       | ⚠️ **SDK 57 support tracked in open issue #6384 at research time.** Wire `/expo` plugin + `/metro`; **confirm a clean EAS dev build against SDK 57 before locking the pin.** The one verify-on-device item.                                                                                                      |
| DB client                    | Supabase JS (typed)                                                                | `@supabase/supabase-js ^2.110.0`                                     | `createClient<Database>()`; AsyncStorage auth, `detectSessionInUrl:false`. 2.110 dropped Node 20 → **Edge/CI runtime must be Node 22+** (does not affect RN runtime).                                                                                                                                            |
| Type gen                     | Supabase CLI (dev dep)                                                             | `supabase ^2.109.0`                                                  | `gen types typescript → src/types/database.ts`. **PostGIS geography/geometry come out loose → wrap with Zod at `api/`.**                                                                                                                                                                                         |
| **Weather**                  | **Open-Meteo (paid commercial)** via Edge proxy; OpenWeather One Call 3.0 fallback | —                                                                    | Free Open-Meteo is **non-commercial only** → commercial Standard (1M/mo) likely sufficient with ~10-min proxy caching. CC BY 4.0 → attribution on weather block. Fetched at view-time, **not stored**. Apple WeatherKit deferred to a possible iOS v2. _(Open Question b.)_                                      |
| **Elevation**                | **Self-hosted OpenTopoData + Copernicus GLO-30** (SRTM fallback)                   | OpenTopoData (MIT) + GLO-30 30m                                      | Build-time pipeline only, which **stores/derives** elevation → Google Elevation **disqualified** (TOS forbids caching); Mapbox Terrain-RGB barred from redistribution. GLO-30 OK w/ © DLR/Airbus attribution. **US-first launch → add USGS 3DEP 10m (public domain) as primary layer.** _(Open Questions b, d.)_ |
| **Difficulty thresholds v0** | Single config object                                                               | `src/config/difficulty.ts`, imported by app **and** `scripts/score/` | Tunable constants in ONE place (spec §7.5). Values below are authoritative and match the pipeline config in Part 3.                                                                                                                                                                                              |

### `DIFFICULTY_THRESHOLDS_V0` (single source — spec §7.5)

```ts
// src/config/difficulty.ts — SINGLE SOURCE. Imported by app AND scripts/score/.
// Radius bands are contiguous & half-open so every value lands in exactly one tier (see Part 3 §4).
export const DIFFICULTY_THRESHOLDS_V0 = {
  version: 0,
  hairpinMaxRadiusM: 30, // hairpin band:   [0, 30)   AND heading > 150°  (else falls to technical)
  technicalMaxRadiusM: 80, // technical band: [30, 80)
  easyMinRadiusM: 200, // medium band:    [80, 200] ; easy: (200, +∞]
  hairpinMinHeadingDeg: 150, // hairpin also requires total heading change > 150°
  sustainedTightMinHeadingDeg: 150, // escalator: medium/easy → technical at/above this heading
  easyMaxAbsGradientPct: 6, // steep-easy downgrade: easy → medium when |gradient| exceeds this
  // continuous blended score for map-coloring interpolation (weights sum to 1.0)
  scoreWeights: { curvature: 0.6, heading: 0.25, gradient: 0.15 },
} as const;
```

> Reconciliation note: this consolidates the two slightly different weight sets seen in the source drafts (0.6/0.3/0.1 vs 0.6/0.25/0.15) onto the **0.6/0.25/0.15** blend used by the Part 3 pipeline, and drops the earlier duplicate/contradicting `sustainedTightHeadingDeg` constant in favor of a single `sustainedTightMinHeadingDeg: 150`. App and pipeline now read identical values.

## 1.4 Layering Rules

1. **Supabase typed client → feature `api/` → React Query hooks → components.** UI **never** calls Supabase directly; `app/` screens are thin.
2. **`services/` is the only outside-world boundary** (Supabase, Mapbox/offline, weather proxy, Sentry). Features import services, never raw SDKs.
3. **React Query owns all server state.** No server data in Zustand, ever.
4. **Zustand = ephemeral UI state only** (camera, selected segment, sheet state).
5. **Zod validates at every boundary** — env at boot, Edge payloads, all third-party responses. PostGIS columns Zod-wrapped at `api/`.
6. **Migrations are the schema source of truth.** Every change is a SQL migration; `database.ts` is regenerated, never hand-edited.
7. **Type-safe end to end**, `strict: true`: no implicit `any`, no unjustified non-null assertions.

## 1.5 v2 Seams (interface-only)

Both seams are **README + TypeScript interface files only**. No `services/codriver` or `services/music` exist in v1 — those directories are deliberately absent until v2.

```ts
// features/codriver/types/codriver.ts — TODO v2, NO implementation in v1
export interface CoDriverProvider {
  speak(text: string, opts?: SpeakOptions): Promise<void>; // TTS
  onSegmentApproach(cb: (seg: SegmentContext) => void): Unsubscribe;
  stop(): void;
}
// features/music/types/music.ts — TODO v2 (Spotify), NO implementation in v1
export interface MusicProvider {
  connect(): Promise<AuthResult>;
  nowPlaying(): Promise<Track | null>;
  play(uri: string): Promise<void>;
}
```

- **No refactor later:** the v1 map feature already tracks a _selected segment_ in its Zustand UI store for the detail sheet. A future `services/codriver/` implementing `CoDriverProvider` subscribes to that existing selection state to satisfy `onSegmentApproach` — no reshaping of the map feature. **No approach/proximity event bus, TTS, or audio scaffolding is built in v1.**
- **Cross-cutting seams already in place** (all no-op or reused-from-v1): the **entitlement seam** (`{tier:'free'}` today; gates premium later), the **Edge Function seam** (weather proxy is a v1 requirement; TTS token-signing / Spotify OAuth drop in as siblings), and the **MapProvider seam** (also the MapLibre-swap lever).
- **Explicit "never" items get no seam, deliberately:** speed/lap/racing telemetry, live turn-by-turn navigation, multiplayer/live location sharing. Enforced structurally — `check_ins` has **no speed column** by schema.

---

# Part 2 — Phase 1 DB Migration Plan (SQL) (§12.2)

**Status: PROPOSED — review before applying. Do not run until approved.**

Migration-first initial schema for the Supabase (Postgres + PostGIS) database, to live in `supabase/migrations/`. Apply in filename order via `supabase db push` / `supabase migration up`. **Every file is genuinely re-runnable** — enums are created guardedly, tables/indexes use `if not exists`, and every policy is `drop policy if exists` + `create policy`.

Design notes:

- **`roads.bbox` is `geometry(Polygon,4326)`, not `geography`** — bbox is an axis-aligned envelope for cheap viewport culling, where planar `&&` / `ST_MakeEnvelope` semantics are exactly right. Centerlines and segment geoms stay `geography(LineString,4326)` because their **metric length** (`length_m`) and distance queries must be spheroid-accurate.
- **`gen_random_uuid()`** for all PKs (via `pgcrypto`).
- **RLS is deny-by-default** — every access path is an explicit policy.
- **PostGIS type resolution** is made deterministic: each DDL file sets `set local search_path = public, extensions;` so `geography`/`geometry` (installed in `extensions`) resolve during migration.

### `0001_extensions.sql`

```sql
-- 0001_extensions.sql — enable required extensions (Supabase convention: dedicated schema).
create schema if not exists extensions;
create extension if not exists postgis  with schema extensions;  -- geography/geometry, GIST, spatial fns
create extension if not exists pgcrypto with schema extensions;  -- gen_random_uuid()
-- We do NOT ALTER DATABASE search_path (needs elevated privs / mutates global state);
-- each later file sets a local search_path including `extensions`.
```

### `0002_enums_and_core_tables.sql`

```sql
-- 0002_enums_and_core_tables.sql — enum types + all core tables. NO speed/telemetry columns anywhere.
set local search_path = public, extensions;

-- ENUMS (guarded so the file is re-runnable)
do $$ begin create type surface_quality  as enum ('excellent','good','fair','poor','unpaved');
  exception when duplicate_object then null; end $$;
do $$ begin create type difficulty       as enum ('easy','medium','technical','hairpin');  -- easy<...<hairpin; maps to green/yellow/red/black
  exception when duplicate_object then null; end $$;
do $$ begin create type road_report_type as enum ('surface','hazard','closure','scenic','note');
  exception when duplicate_object then null; end $$;

-- profiles: id IS the auth user id (1:1 with auth.users).
create table if not exists profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text, avatar_url text, bio text,
  created_at    timestamptz not null default now()
);

-- roads: curated + auto-scored. centerline geography (metric length); bbox planar geometry (viewport cull).
create table if not exists roads (
  id                uuid primary key default gen_random_uuid(),
  name              text not null, region text, country text, description text,
  centerline        geography(LineString, 4326) not null,   -- spheroid: metric length & distance
  bbox              geometry(Polygon, 4326),                 -- bbox && ST_MakeEnvelope(...) index-only overlap
  length_m          double precision,                        -- ST_Length(centerline) spheroid metres
  curated           boolean not null default false,
  scenic_rating     smallint,                                -- 1..5
  best_time_window  text,                                    -- curated string, NOT live weather
  cover_photo_url   text,
  created_at        timestamptz not null default now(),
  constraint roads_scenic_rating_range check (scenic_rating is null or scenic_rating between 1 and 5)
);

-- road_segments: the unit that DRIVES MAP COLORS. Columns MUST match RoadSegmentRecord in Part 3 §6.
create table if not exists road_segments (
  id                 uuid primary key default gen_random_uuid(),
  road_id            uuid not null references roads (id) on delete cascade,   -- segments die with their road
  geom               geography(LineString, 4326) not null,                    -- spheroid: metric length/curvature
  order_index        integer not null,                                        -- position along the road
  length_m           double precision,
  avg_radius_m       double precision,                                        -- menger/circumscribed-circle
  min_radius_m       double precision,
  heading_change_deg double precision,                                        -- total bearing change over segment
  gradient_pct       double precision,                                        -- dElev / horizontal run * 100
  surface_quality    surface_quality,
  difficulty         difficulty not null,
  difficulty_score   numeric,                                                 -- continuous 0..1 blend
  constraint road_segments_road_order_uniq unique (road_id, order_index)
);

-- road_photos: user_id NULL => curated (public); user_id set => user upload.
create table if not exists road_photos (
  id uuid primary key default gen_random_uuid(),
  road_id uuid not null references roads (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,   -- NULL = curated
  storage_path text not null,                                 -- path within 'road-photos' bucket
  caption text, created_at timestamptz not null default now()
);

create table if not exists road_reports (
  id uuid primary key default gen_random_uuid(),
  road_id uuid not null references roads (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  type road_report_type not null, body text not null,
  created_at timestamptz not null default now()
);

-- vehicles (garage)
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  make text, model text, year smallint, color text, notes text,
  constraint vehicles_year_sane check (year is null or year between 1885 and 2100)
);

-- vehicle_setups: ownership is INDIRECT (setup -> vehicle -> user); RLS joins through vehicles.
create table if not exists vehicle_setups (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  tires text, suspension text, notes text,
  updated_at timestamptz not null default now()
);

-- favorites: composite PK => favorite a road at most once.
create table if not exists favorites (
  user_id uuid not null references profiles (id) on delete cascade,
  road_id uuid not null references roads (id)    on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, road_id)
);

-- check_ins: light drive logging. COUNT/COVERAGE only. EXPLICITLY NO speed/pace/lap/telemetry.
create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  road_id uuid not null references roads (id)    on delete cascade,
  driven_at timestamptz not null default now(),
  vehicle_id uuid references vehicles (id) on delete set null,  -- keep history if vehicle removed
  note text, created_at timestamptz not null default now()
  -- NO speed column. (Hard store-compliance constraint.)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  road_id uuid not null references roads (id)    on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  body text not null, created_at timestamptz not null default now()
);

-- achievements / user_achievements (passport)
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                     -- stable machine key, e.g. 'hairpins_10'
  name text not null, description text, icon text,
  created_at timestamptz not null default now()
);
create table if not exists user_achievements (
  user_id uuid not null references profiles (id)     on delete cascade,
  achievement_id uuid not null references achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
```

### `0003_indexes.sql`

```sql
-- 0003_indexes.sql — spatial GIST for viewport queries + btree for FK joins/sorts. All if-not-exists.
set local search_path = public, extensions;

-- SPATIAL (GIST)
create index if not exists roads_centerline_gix    on roads         using gist (centerline);  -- "roads near me"
create index if not exists roads_bbox_gix          on roads         using gist (bbox);        -- primary viewport-cull (bbox && envelope)
create index if not exists road_segments_geom_gix  on road_segments using gist (geom);        -- hot path: visible segments

-- BTREE
create index if not exists road_segments_road_order_idx on road_segments (road_id, order_index);
create index if not exists road_photos_road_id_idx on road_photos (road_id);
create index if not exists road_photos_user_id_idx on road_photos (user_id);
create index if not exists road_photos_curated_idx on road_photos (road_id) where user_id is null;
create index if not exists road_reports_road_id_idx on road_reports (road_id);
create index if not exists road_reports_user_id_idx on road_reports (user_id);
create index if not exists vehicles_user_id_idx        on vehicles (user_id);
create index if not exists vehicle_setups_vehicle_idx  on vehicle_setups (vehicle_id);
create index if not exists favorites_road_id_idx on favorites (road_id);  -- (user_id side covered by composite PK)
create index if not exists check_ins_user_id_idx    on check_ins (user_id);
create index if not exists check_ins_road_id_idx    on check_ins (road_id);
create index if not exists check_ins_vehicle_id_idx on check_ins (vehicle_id);
create index if not exists comments_road_id_idx on comments (road_id);
create index if not exists comments_user_id_idx on comments (user_id);
create index if not exists user_achievements_user_idx on user_achievements (user_id, earned_at);
```

### `0004_rls.sql`

```sql
-- 0004_rls.sql — Row Level Security. Deny-by-default: EVERY access path is an explicit policy.
-- Every policy is drop-if-exists + create for re-runnability. auth.uid() = authenticated user (NULL for anon).

-- PUBLIC CATALOG: roads, road_segments, achievements (read-only; populated by pipeline via service_role)
alter table roads enable row level security;
alter table road_segments enable row level security;
alter table achievements enable row level security;
drop policy if exists roads_public_read on roads;
create policy roads_public_read on roads for select using (true);
drop policy if exists road_segments_public_read on road_segments;
create policy road_segments_public_read on road_segments for select using (true);
drop policy if exists achievements_public_read on achievements;
create policy achievements_public_read on achievements for select using (true);
-- No client write policies on these => clients cannot write; service_role bypasses RLS.

-- profiles: public read; owner writes only.
alter table profiles enable row level security;
drop policy if exists profiles_public_read on profiles;
create policy profiles_public_read on profiles for select using (true);
drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles for insert with check (auth.uid() = id);
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_delete_own on profiles;
create policy profiles_delete_own on profiles for delete using (auth.uid() = id);

-- road_photos: read curated (user_id IS NULL) or own; owner-only write.
alter table road_photos enable row level security;
drop policy if exists road_photos_read_curated_or_own on road_photos;
create policy road_photos_read_curated_or_own on road_photos for select
  using (user_id is null or auth.uid() = user_id);
drop policy if exists road_photos_insert_own on road_photos;   -- auth.uid()=user_id also rejects NULL (curated) rows
create policy road_photos_insert_own on road_photos for insert with check (auth.uid() = user_id);
drop policy if exists road_photos_update_own on road_photos;
create policy road_photos_update_own on road_photos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists road_photos_delete_own on road_photos;
create policy road_photos_delete_own on road_photos for delete using (auth.uid() = user_id);

-- road_reports + comments: public read (community content); owner-only write.
alter table road_reports enable row level security;
alter table comments enable row level security;
drop policy if exists road_reports_public_read on road_reports;
create policy road_reports_public_read on road_reports for select using (true);
drop policy if exists road_reports_insert_own on road_reports;
create policy road_reports_insert_own on road_reports for insert with check (auth.uid() = user_id);
drop policy if exists road_reports_update_own on road_reports;
create policy road_reports_update_own on road_reports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists road_reports_delete_own on road_reports;
create policy road_reports_delete_own on road_reports for delete using (auth.uid() = user_id);
drop policy if exists comments_public_read on comments;
create policy comments_public_read on comments for select using (true);
drop policy if exists comments_insert_own on comments;
create policy comments_insert_own on comments for insert with check (auth.uid() = user_id);
drop policy if exists comments_update_own on comments;
create policy comments_update_own on comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists comments_delete_own on comments;
create policy comments_delete_own on comments for delete using (auth.uid() = user_id);

-- favorites: PRIVATE to owner (insert/delete only).
alter table favorites enable row level security;
drop policy if exists favorites_select_own on favorites;
create policy favorites_select_own on favorites for select using (auth.uid() = user_id);
drop policy if exists favorites_insert_own on favorites;
create policy favorites_insert_own on favorites for insert with check (auth.uid() = user_id);
drop policy if exists favorites_delete_own on favorites;
create policy favorites_delete_own on favorites for delete using (auth.uid() = user_id);

-- check_ins + vehicles: PRIVATE; owner-only all ops.
alter table check_ins enable row level security;
alter table vehicles enable row level security;
drop policy if exists check_ins_select_own on check_ins;
create policy check_ins_select_own on check_ins for select using (auth.uid() = user_id);
drop policy if exists check_ins_insert_own on check_ins;
create policy check_ins_insert_own on check_ins for insert with check (auth.uid() = user_id);
drop policy if exists check_ins_update_own on check_ins;
create policy check_ins_update_own on check_ins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists check_ins_delete_own on check_ins;
create policy check_ins_delete_own on check_ins for delete using (auth.uid() = user_id);
drop policy if exists vehicles_select_own on vehicles;
create policy vehicles_select_own on vehicles for select using (auth.uid() = user_id);
drop policy if exists vehicles_insert_own on vehicles;
create policy vehicles_insert_own on vehicles for insert with check (auth.uid() = user_id);
drop policy if exists vehicles_update_own on vehicles;
create policy vehicles_update_own on vehicles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists vehicles_delete_own on vehicles;
create policy vehicles_delete_own on vehicles for delete using (auth.uid() = user_id);

-- vehicle_setups: INDIRECT ownership (setup -> vehicle -> user) via EXISTS. WITH CHECK blocks
-- attaching a setup to someone else's vehicle. (Foreign vehicle_id is invisible => EXISTS false => denied.)
alter table vehicle_setups enable row level security;
drop policy if exists vehicle_setups_select_own on vehicle_setups;
create policy vehicle_setups_select_own on vehicle_setups for select
  using (exists (select 1 from vehicles v where v.id = vehicle_setups.vehicle_id and v.user_id = auth.uid()));
drop policy if exists vehicle_setups_insert_own on vehicle_setups;
create policy vehicle_setups_insert_own on vehicle_setups for insert
  with check (exists (select 1 from vehicles v where v.id = vehicle_setups.vehicle_id and v.user_id = auth.uid()));
drop policy if exists vehicle_setups_update_own on vehicle_setups;
create policy vehicle_setups_update_own on vehicle_setups for update
  using  (exists (select 1 from vehicles v where v.id = vehicle_setups.vehicle_id and v.user_id = auth.uid()))
  with check (exists (select 1 from vehicles v where v.id = vehicle_setups.vehicle_id and v.user_id = auth.uid()));
drop policy if exists vehicle_setups_delete_own on vehicle_setups;
create policy vehicle_setups_delete_own on vehicle_setups for delete
  using (exists (select 1 from vehicles v where v.id = vehicle_setups.vehicle_id and v.user_id = auth.uid()));

-- user_achievements: user reads own; writes via service_role (server-side granting).
alter table user_achievements enable row level security;
drop policy if exists user_achievements_select_own on user_achievements;
create policy user_achievements_select_own on user_achievements for select using (auth.uid() = user_id);
```

### `0005_storage.sql`

```sql
-- 0005_storage.sql — buckets + storage.objects RLS. "owner-write" = first path segment is the uploader's uid:
--   <bucket>/<auth.uid()>/<file>.  (storage.foldername(name))[1] returns that segment.
-- auth.uid() wrapped as (select auth.uid()) so it evaluates once per statement (initPlan), not per row.

insert into storage.buckets (id, name, public) values ('road-photos','road-photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars','avatars', true)         on conflict (id) do nothing;

-- road-photos
drop policy if exists road_photos_object_public_read on storage.objects;
create policy road_photos_object_public_read on storage.objects for select using ( bucket_id = 'road-photos' );
drop policy if exists road_photos_object_insert_own on storage.objects;
create policy road_photos_object_insert_own on storage.objects for insert to authenticated
  with check ( bucket_id = 'road-photos' and (storage.foldername(name))[1] = (select auth.uid())::text );
drop policy if exists road_photos_object_update_own on storage.objects;
create policy road_photos_object_update_own on storage.objects for update to authenticated
  using      ( bucket_id = 'road-photos' and (storage.foldername(name))[1] = (select auth.uid())::text )
  with check ( bucket_id = 'road-photos' and (storage.foldername(name))[1] = (select auth.uid())::text );
drop policy if exists road_photos_object_delete_own on storage.objects;
create policy road_photos_object_delete_own on storage.objects for delete to authenticated
  using ( bucket_id = 'road-photos' and (storage.foldername(name))[1] = (select auth.uid())::text );
-- Curated photos: uploaded by pipeline via service_role under a 'curated/' prefix (road_photos.user_id = NULL).

-- avatars
drop policy if exists avatars_object_public_read on storage.objects;
create policy avatars_object_public_read on storage.objects for select using ( bucket_id = 'avatars' );
drop policy if exists avatars_object_insert_own on storage.objects;
create policy avatars_object_insert_own on storage.objects for insert to authenticated
  with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text );
drop policy if exists avatars_object_update_own on storage.objects;
create policy avatars_object_update_own on storage.objects for update to authenticated
  using      ( bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text )
  with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text );
drop policy if exists avatars_object_delete_own on storage.objects;
create policy avatars_object_delete_own on storage.objects for delete to authenticated
  using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text );
```

**Client upload convention:** upload to `road-photos/<uid>/<uuid>.jpg` and `avatars/<uid>/<uuid>.jpg`; store the returned path in `road_photos.storage_path` / `profiles.avatar_url`.

### Regenerating `src/types/database.ts`

```bash
# local (after supabase db reset / migration up):
npx supabase gen types typescript --local > src/types/database.ts
# hosted project:
npx supabase gen types typescript --project-id <PROJECT_REF> > src/types/database.ts
```

- Pin the `supabase` CLI as a devDependency (`^2.109.0`); add a `gen:types` script and run it in CI, failing if `database.ts` is stale.
- **PostGIS caveat:** `roads.centerline`, `roads.bbox`, `road_segments.geom` generate as loosely-typed (effectively `unknown`/string), NOT GeoJSON. Wrap at feature `api/` with Zod; prefer `ST_AsGeoJSON(...)` in read queries/RPCs. Enums generate as string-literal unions. Treat `database.ts` as generated — never hand-edit.

**Apply order:** `0001 → 0002 → 0003 → 0004 → 0005`, then regenerate `database.ts`.

**One reviewer decision (not a defect):** `road_reports`/`comments` SELECT is `using(true)` (public read). If community reads should require sign-in, add `to authenticated` to those two `_public_read` policies.

---

# Part 3 — Offline Scoring Pipeline Interface (§7)

Design sketch for the offline scoring pipeline in `scripts/`. Signatures, types, and config only — bodies are `// TODO` with a one-line algorithm note. Grounded in the Part 1 provider picks: **OSM/Overpass** ingestion (GeoJSON fallback), **self-hosted OpenTopoData serving Copernicus GLO-30** for elevation, and **Menger curvature / circumscribed-circle radius on projected (metre) coordinates** for corner math.

> **Two correctness invariants the design leans on:**
>
> 1. **Geodesic, not degrees.** All lengths/distances are in **metres** (haversine or projected ENU), never raw lng/lat degrees. Curvature is fit on a **local planar projection in metres** (1° lng ≠ 1° lat away from the equator).
> 2. **Smooth before you fit.** The line is **resampled to fixed spacing and moving-average smoothed _before_ any curvature triplet is fit**, so `min_radius_m` reflects real geometry, not digitization noise.

## 3.1 Pipeline overview

Six composable, **idempotent, per-road-safe** stages (`In -> Promise<Out>`). Per-road isolation means a failure on road N never corrupts N±1; re-running a single road is safe (stage 6 does delete-and-reinsert of that road's segments in a transaction).

```
ingestGeometry → enrichElevation → segmentize → computeSegmentMetrics → classify → writeToPostGIS
  RawSource       RoadCenterline    Segment[]     ScoredSegment[]         RoadSegmentRecord[] (rows)
   (z=undef)       (z filled)
```

```ts
// scripts/scoring/pipeline.ts
export type RoadSource =
  | { kind: 'osm'; osmId: number; osmType: 'way' | 'relation'; roadId: string }
  | { kind: 'geojson'; roadId: string; feature: RoadCenterline };

export interface PipelineDeps {
  elevation: ElevationProvider; // OpenTopoData/Copernicus GLO-30
  overpass: OverpassClient; // OSM ingestion
  db: PostgisWriter; // upsert road + delete/reinsert segments
  config: ScoringConfig; // single source of tunable constants (§3.3)
  logger?: (evt: PipelineEvent) => void;
}
export interface PipelineResult {
  roadId: string;
  segmentsWritten: number;
  status: 'ok' | 'skipped' | 'failed';
  error?: string;
}

/** Score ONE road end-to-end. Idempotent for the same roadId. */
export async function scoreRoad(source: RoadSource, deps: PipelineDeps): Promise<PipelineResult> {
  // TODO: ingest -> enrich -> segmentize -> metrics -> classify -> write, wrapped in a per-road tx.
}
/** Batch runner. Bounded concurrency, per-road isolation, aggregate report. */
export async function runScoringPipeline(
  sources: RoadSource[],
  deps: PipelineDeps,
  opts?: { concurrency?: number; continueOnError?: boolean },
): Promise<PipelineResult[]> {
  // TODO: map through scoreRoad with a concurrency limit (respect OpenTopoData 1 req/s on public API);
  // never abort the whole batch on one failure.
}
export type PipelineStage = 'ingest' | 'enrich' | 'segment' | 'metrics' | 'classify' | 'write';
export type PipelineEvent = {
  stage: PipelineStage;
  roadId: string;
  level: 'info' | 'warn' | 'error';
  msg: string;
};
```

## 3.2 Stage inputs/outputs

```ts
// scripts/scoring/types.ts
export interface Coordinate {
  lng: number;
  lat: number;
  z?: number;
} // z metres; undefined until enrichment
export interface PlanarPoint {
  x: number;
  y: number;
  z?: number;
} // local ENU metres (see §3.5 toPlanar)
export type RoadCenterline = GeoJSONLineStringFeature | { name: string; coords: Coordinate[] };
export interface GeoJSONLineStringFeature {
  type: 'Feature';
  properties: { name?: string; [k: string]: unknown };
  geometry: { type: 'LineString'; coordinates: [number, number][] | [number, number, number][] };
}
// Mirror the DB enums exactly (Part 2 §0002). surface_quality "unknown" maps to a NULL DB column at write time.
export type SurfaceQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unpaved' | 'unknown';
export type Difficulty = 'easy' | 'medium' | 'technical' | 'hairpin'; // EXHAUSTIVE union
```

**Stage 1 — `ingestGeometry`** → `{ roadId, name, centerline: Coordinate[] (z undef), osmSurfaceTag? }`. TODO: for `osm`, Overpass fetch + stitch nodes into one LineString; for `geojson`, normalize; **dedupe consecutive identical vertices** (guards degenerate zero-length spans).

**Stage 2 — `enrichElevation`** → `{ roadId, centerline (z filled where DEM covers), elevationComplete }`.

```ts
export interface ElevationProvider {
  // Backed by self-hosted OpenTopoData + Copernicus GLO-30. Returns null (not 0) for no-coverage
  // so "sea level" and "no data" stay distinguishable.
  lookup(points: Coordinate[]): Promise<(number | null)[]>; // metres, index-aligned
}
// TODO: resample to config.elevation.sampleSpacingM, batch-fetch (<= batchSize/req), interpolate z back
// onto every original vertex; map null -> undefined z and set elevationComplete=false.
```

**Stage 3 — `segmentize`** → `Segment[]` (`{ roadId, orderIndex, coords, lengthM }`). TODO: **FIRST resample to `config.segment.resampleSpacingM` and apply the `smoothingWindow` moving average**, THEN walk accumulating geodesic distance, cutting every ~`targetLengthM`, keeping ≥3 pts/segment and merging any runt tail shorter than `minLengthM`. Invariant: `resampleSpacingM << targetLengthM`.

**Stage 4 — `computeSegmentMetrics`** → `ScoredSegment[]`:

```ts
export interface ScoredSegment extends Segment {
  minRadiusM: number; // tightest circumscribed-circle radius (m); +Infinity if straight
  avgRadiusM: number; // mean over valid (non-collinear) triplets; +Infinity if none curve
  headingChangeDeg: number; // total absolute bearing change (>= 0)
  gradientPct: number; // signed (z_end - z_start)/geodesicRunM * 100
  gradientKnown: boolean; // false when elevation missing -> gradient not used in classification
  surfaceQuality: SurfaceQuality;
}
// TODO: project coords to local planar metres (toPlanar), run circumRadius over consecutive triplets.
// IGNORE triplets tighter than config.segment.minTrustedRadiusM UNLESS the local turn angle exceeds
// minTrustedTurnDeg (noise guard). min/avg over survivors; none curve -> +Infinity. Sum abs geodesic
// heading deltas. gradientPct from z endpoints over geodesic run; gradientKnown=false (pct 0) if any z missing.
// Map osmSurfaceTag -> SurfaceQuality ("unknown" fallback).
```

**Stage 5 — `classify`** → `ClassifiedSegment[]` (`ScoredSegment` + `difficulty`, `difficultyScore`). Maps each through the pure fns in §3.4.

**Stage 6 — `writeToPostGIS`** — final row shape **mirrors `road_segments` columns exactly** (Part 2 §0002):

```ts
export interface RoadSegmentRecord {
  road_id: string;
  order_index: number;
  geom: string; // GeoJSON LineString -> ST_GeomFromGeoJSON, geography(LineString,4326)
  length_m: number;
  min_radius_m: number | null; // +Infinity (straight) -> null (Infinity not representable in numeric)
  avg_radius_m: number | null; // no triplet curves -> null
  heading_change_deg: number;
  gradient_pct: number | null; // gradientKnown=false -> null
  surface_quality: SurfaceQuality; // "unknown" -> NULL column
  difficulty: Difficulty;
  difficulty_score: number; // 0..1
}
export interface PostgisWriter {
  upsertRoad(road: { roadId: string; name: string; centerline: Coordinate[] }): Promise<void>;
  replaceSegments(roadId: string, rows: RoadSegmentRecord[]): Promise<number>; // delete+insert in one tx
}
// TODO write(): upsertRoad (by road_id) then replaceSegments (DELETE by road_id + bulk INSERT) in one
// transaction so a re-run leaves exactly one clean set of segments. Convert +Infinity -> null,
// gradientKnown=false -> null, surface "unknown" -> null.
```

> Column reconciliation: `RoadSegmentRecord` maps 1:1 onto `road_segments` — `geom`, `order_index`, `length_m`, `min_radius_m`, `avg_radius_m`, `heading_change_deg`, `gradient_pct`, `surface_quality`, `difficulty`, `difficulty_score`. The pipeline's `SurfaceQuality` adds `"unknown"` as an in-memory sentinel that writes as SQL `NULL` (the DB enum has no `unknown` member — this is deliberate, not a mismatch).

## 3.3 CONFIG — single source of tunable constants

```ts
// scripts/scoring/config.ts — mirrors DIFFICULTY_THRESHOLDS_V0 (Part 1 §1.3). App and pipeline read identical values.
export interface ScoringConfig {
  elevation: {
    sampleSpacingM: number;
    batchSize: number;
    dataset: 'copernicus-glo30' | 'srtm30' | 'usgs-3dep-10m';
  };
  segment: {
    targetLengthM: number;
    minLengthM: number; // ~50-150m target; merge runt tails
    resampleSpacingM: number;
    smoothingWindow: number; // resample+smooth BEFORE curvature; window odd, >=1
    minTrustedRadiusM: number;
    minTrustedTurnDeg: number; // noise guard
  };
  thresholds: {
    hairpinMaxRadiusM: number;
    technicalMaxRadiusM: number;
    easyMinRadiusM: number; // contiguous half-open bands
    hairpinMinHeadingDeg: number;
    sustainedTightMinHeadingDeg: number;
    easyMaxAbsGradientPct: number;
  };
  scoreWeights: { curvature: number; heading: number; gradient: number }; // must sum to 1.0
  scoreNorm: {
    radiusFloorM: number;
    radiusCeilM: number;
    headingFullScaleDeg: number;
    gradientFullScalePct: number;
  };
}
export const DEFAULT_CONFIG: ScoringConfig = {
  elevation: { sampleSpacingM: 30, batchSize: 100, dataset: 'copernicus-glo30' },
  segment: {
    targetLengthM: 100,
    minLengthM: 40,
    resampleSpacingM: 10,
    smoothingWindow: 3,
    minTrustedRadiusM: 8,
    minTrustedTurnDeg: 12,
  },
  thresholds: {
    hairpinMaxRadiusM: 30,
    technicalMaxRadiusM: 80,
    easyMinRadiusM: 200,
    hairpinMinHeadingDeg: 150,
    sustainedTightMinHeadingDeg: 150,
    easyMaxAbsGradientPct: 6,
  },
  scoreWeights: { curvature: 0.6, heading: 0.25, gradient: 0.15 }, // sums to 1.0; matches Part 1
  scoreNorm: {
    radiusFloorM: 15,
    radiusCeilM: 300,
    headingFullScaleDeg: 180,
    gradientFullScalePct: 15,
  },
};
```

## 3.4 Classification — pure, total, deterministic

Both functions are **pure** (config in, value out) and **total** (defined for every input, including `minRadiusM === +Infinity`).

**Boundary contract (contiguous, half-open, tie-broken deterministically):**

| `minRadiusM` | tier (before escalators)                                                        |
| ------------ | ------------------------------------------------------------------------------- |
| `[0, 30)`    | hairpin _iff_ `headingChangeDeg > 150`, else **technical** (closes the old gap) |
| `[30, 80)`   | technical                                                                       |
| `[80, 200]`  | medium                                                                          |
| `(200, +∞]`  | easy                                                                            |

Escalators, applied **after** the band lookup: (1) **sustained-tight** — easy/medium with `headingChangeDeg >= sustainedTightMinHeadingDeg` → technical; (2) **steep-easy** — easy with `gradientKnown && abs(gradientPct) > easyMaxAbsGradientPct` → medium. Escalators never raise technical/hairpin and never cross the hairpin boundary, so the ladder stays monotonic and total.

```ts
// scripts/scoring/classify.ts
export interface ClassifierInput {
  minRadiusM: number;
  avgRadiusM: number;
  headingChangeDeg: number;
  gradientPct: number;
  gradientKnown: boolean;
}
/** Total, deterministic label. Precedence ladder (first match wins), all edges from cfg.thresholds:
 *   1 hairpin  : minRadiusM < hairpinMaxRadiusM AND headingChangeDeg > hairpinMinHeadingDeg
 *   2 technical: minRadiusM < technicalMaxRadiusM  (also catches sub-hairpin-radius fall-through)
 *   3 medium   : minRadiusM <= easyMinRadiusM
 *   4 easy     : otherwise (incl. +Infinity), then escalators. */
export function classifyDifficulty(m: ClassifierInput, cfg: ScoringConfig): Difficulty {
  /* TODO: ladder + escalators, no literals */
}
/** Continuous 0..1 for map coloring / difficulty_score. Weighted blend (cfg.scoreWeights):
 *   curvature = clamp01((radiusCeilM - minRadiusM)/(radiusCeilM - radiusFloorM))  // 0 for +Infinity
 *   heading   = clamp01(headingChangeDeg / headingFullScaleDeg)
 *   gradient  = gradientKnown ? clamp01(abs(gradientPct)/gradientFullScalePct) : 0
 * MONOTONIC (non-increasing in radius, non-decreasing in heading/|gradient|) so it never contradicts
 * the tier ladder. Clamp [0,1]; renormalize weights when gradient unknown so it stays in range. */
export function difficultyScore(m: ClassifierInput, cfg: ScoringConfig): number {
  /* TODO */
}
```

**Fixtures (drive both fns):** `KNOWN_HAIRPIN` (r12, h178 → hairpin); `TIGHT_BUT_STRAIGHTISH` (r22, h40 → technical, the old gap); `KNOWN_TECHNICAL` (r55 → technical); `SUSTAINED_TIGHT` (r130, h160 → technical via heading); `STEEP_EASY` (r400, grad9 → medium); `MISSING_ELEV` (r400, grad0, `gradientKnown:false` → stays easy, escalator skipped); `BOUNDARY_80` → medium; `BOUNDARY_200` → medium; `KNOWN_HIGHWAY` (r900 → easy); `STRAIGHT_SEGMENT` (r∞ → easy, score ~0).

## 3.5 Key helpers

```ts
// scripts/scoring/geo.ts
export function haversineM(a: Coordinate, b: Coordinate): number; // great-circle metres, R=6371008.8 (NEVER degrees)
/** Circumscribed-circle (Menger) radius through three PROJECTED planar points, metres.
 *  radius = (|ab||bc||ca|)/(4*area). Inputs MUST be PlanarPoint (toPlanar), not lng/lat.
 *  Returns +Infinity when area < AREA_EPS (collinear) OR any side < LEN_EPS (coincident) — no spurious/NaN radius. */
export function circumRadius(a: PlanarPoint, b: PlanarPoint, c: PlanarPoint): number;
export const mengerCurvature = (a: PlanarPoint, b: PlanarPoint, c: PlanarPoint) =>
  1 / circumRadius(a, b, c);
export function headingChangeDeg(coords: Coordinate[]): number; // sum abs geodesic-bearing deltas, each normalized to (-180,180]
export function gradientPct(coords: Coordinate[]): { pct: number; known: boolean }; // run = sum haversine; known=false if endpoint z undef
export function resample(coords: Coordinate[], spacingM: number): Coordinate[]; // uniform geodesic spacing, interp lng/lat/z
export function smooth(coords: Coordinate[], window: number): Coordinate[]; // centered moving average; run AFTER resample, BEFORE curvature
export function segmentize(
  coords: Coordinate[],
  targetLengthM: number,
  minLengthM: number,
): Coordinate[][]; // >=3 pts/slice, merge runt
/** WGS84 -> local planar metres for curvature. Equirectangular about centroid:
 *  x = R*dLng_rad*cos(lat0), y = R*dLat_rad, R=6371008.8. cos(lat0) makes x/y isotropic in metres. */
export function toPlanar(coords: Coordinate[]): PlanarPoint[];
```

## 3.6 Tuning, idempotency, tests

- **Tuning:** all knobs live in `DEFAULT_CONFIG` (§3.3) / `DIFFICULTY_THRESHOLDS_V0` (§1.3) — nothing hard-coded in `classify.ts`/`geo.ts`. Run `runScoringPipeline` over the curated 50, compare produced `difficulty` distribution against a labeled `curated-expectations.json` (road → expected dominant difficulty), assert reproduction so tuning changes are regression-guarded. A known hairpin road → black segments at switchbacks; a known highway → all green.
- **Idempotency:** stage 6 is the only stateful stage. `upsertRoad` keys `roads` on `road_id`; `replaceSegments` does `DELETE road_segments WHERE road_id=$1` then bulk `INSERT`, both in one transaction. Upstream stages are pure functions of `(source, config)`, so identical inputs produce byte-identical rows — true idempotency, per-road safe.
- **Tests:** `classifyDifficulty` over every fixture + boundary cases at exactly 30/80/200 m and heading exactly 150° (pins the inequality directions) + a randomized `minRadiusM ∈ [0,∞]` sweep asserting a valid `Difficulty` (totality); `difficultyScore` monotonicity, [0,1] clamp, `Infinity → curvature term 0`, tier-consistency, unknown-gradient renormalization; `circumRadius` (known-circle recovery, collinear/coincident → +Infinity, types force `PlanarPoint`); `resample`+`smooth` (uniform spacing, endpoints preserved, jitter spike removed); `haversineM`/`headingChangeDeg` (known distances, 180° switchback, bearing wrap-around); `gradientPct` (flat → 0/known, missing z → `{pct:0,known:false}`); `segmentize` (length preserved, ≥3 pts, no runt tail); `toRoadSegmentRecords` (`Infinity→null`, `gradientKnown=false→null`, `"unknown"→null`, GeoJSON round-trip); `writeToPostGIS` (re-run → same count and identical values).

**File layout:** `scripts/scoring/{pipeline,types,config,classify,geo}.ts` + `io/{overpass,elevation,postgis}.ts` + `__tests__/fixtures.ts`.

---

# OPEN QUESTIONS FOR YOU (before I start Phase 0)

_Each has a recommended default — you can just say "go with your defaults."_

### (a) Mapbox vs MapLibre given offline cost

**My recommendation:** **Mapbox (`@rnmapbox/maps`) for v1**, behind the MapProvider seam. It's free to ~25k MAU, offline tile packs are **MAU-included** on the wrapped Mapbox Maps SDK v10/v11 (not separately metered as on legacy SDKs), and it has the best offline ergonomics. MapLibre + self-hosted PMTiles stays a **config/provider swap, not a rewrite**.
**Cost trigger (my default):** re-evaluate the MapLibre swap at **~20–25k MAU** (as you approach the free-tier ceiling). Token posture: restricted **public** token + separate **secret download** token, set **before any `offlineManager.createPack` call** (avoids the known iOS pre-token crash). One caveat to confirm: if any use case ever needs caching **>6,000 tiles/user** (e.g. "download a whole country"), that's ToS-gated and pushes toward self-hosted tiles sooner.

### (b) Elevation + weather provider

**Elevation (my pick):** **self-hosted OpenTopoData serving Copernicus GLO-30** (SRTM fallback), one Docker service in `scripts/`. Why: the pipeline **stores/derives** elevation, which **disqualifies Google Elevation and Mapbox Terrain-RGB** (their TOS forbid caching/redistribution); GLO-30 is redistribution-clean with © DLR/Airbus attribution and zero marginal cost. If launch is US-first, add **USGS 3DEP 10m** (public domain, higher quality) as the primary layer.
**Weather (my pick):** **Open-Meteo commercial (Standard, 1M/mo)** via an Edge Function proxy with ~10-min caching; **OpenWeather One Call 3.0** as fallback, both behind `services/weather`. The free Open-Meteo tier is non-commercial only. Attribution: Open-Meteo (CC BY 4.0) on the weather block, © DLR/Airbus on an About/Licenses screen. (Apple WeatherKit is a possible iOS-only v2 behind the same interface.)

### (c) Monetization stance — v1 free vs later paywall

**My recommendation:** **ship v1 free.** **Entitlement seam I'd leave:** `services/entitlements/useEntitlements()` returns `{ tier: 'free' }` — a no-op today. Co-driver, music, and any paywall gate on `tier`, so adding premium later touches **no auth code**. Note the coupling to (a): free-and-viral pushes Mapbox MAU up fastest and pulls the MapLibre trigger closer; premium/paywalled keeps Mapbox cheap far longer.

### (d) Initial launch region for the curated 50

**My default:** **global/EU-first**, which makes **Copernicus GLO-30** the default elevation layer. If you instead want **US-first**, I re-order the pipeline to add **USGS 3DEP 10m** as the primary elevation layer. This choice directly sets the elevation dataset priority, so it's worth a one-word answer.

### (e) Supabase region

**My default:** the Supabase region **co-located with the curated-50 launch region** (lowest DB + Edge Function latency for the target users) for both Postgres and Storage. Confirm the exact region — it drives PostGIS query latency, Edge Function locality, and (if we self-host PMTiles later) tile-hosting locality.

**One verify-on-device item regardless of the above:** `@sentry/react-native` 8.x formal SDK 57 support (issue #6384 was open at research time) — I'll confirm a clean EAS dev build before locking that one pin, or we accept Sentry as the single "verify-on-device" risk.

---

On your 👍 (or "go with defaults"), I begin Phase 0 (Foundation) — no app code until then.
