-- 0003_indexes.sql — spatial GIST for viewport queries + btree for FK joins/sorts. All if-not-exists.
set search_path = public, extensions;

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
