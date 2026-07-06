-- 0002_enums_and_core_tables.sql — enum types + all core tables. NO speed/telemetry columns anywhere.
-- `set search_path` (not `set local`) so geography/geometry resolve whether or not the migration
-- runner wraps the file in a transaction (short-lived migration connection; reset on close).
set search_path = public, extensions;

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

-- road_segments: the unit that DRIVES MAP COLORS. Columns MUST match RoadSegmentRecord in scripts/scoring.
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
