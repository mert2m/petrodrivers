-- 0006_functions.sql — read RPCs for the map. Return geometry as GeoJSON text (generated Supabase types
-- surface geography as loose, so we hand the client ready-to-parse GeoJSON). Viewport queries use the
-- GIST index on road_segments.geom via the && operator against a geography envelope.
set search_path = public, extensions;

-- Visible road segments for a viewport bbox, colored by difficulty. Powers the data-driven line layer.
create or replace function segments_in_bbox(
  min_lng double precision, min_lat double precision,
  max_lng double precision, max_lat double precision
)
returns table (
  id uuid,
  road_id uuid,
  difficulty difficulty,
  difficulty_score numeric,
  geojson text
)
language sql
stable
as $$
  select s.id, s.road_id, s.difficulty, s.difficulty_score, ST_AsGeoJSON(s.geom) as geojson
  from road_segments s
  where s.geom && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
$$;

-- Roads whose bbox intersects the viewport (for the Discover list / labels).
create or replace function roads_in_bbox(
  min_lng double precision, min_lat double precision,
  max_lng double precision, max_lat double precision
)
returns table (
  id uuid,
  name text,
  region text,
  country text,
  scenic_rating smallint,
  length_m double precision,
  geojson text
)
language sql
stable
as $$
  select r.id, r.name, r.region, r.country, r.scenic_rating, r.length_m, ST_AsGeoJSON(r.centerline) as geojson
  from roads r
  where r.bbox && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
$$;

grant execute on function segments_in_bbox(double precision, double precision, double precision, double precision) to anon, authenticated;
grant execute on function roads_in_bbox(double precision, double precision, double precision, double precision) to anon, authenticated;
