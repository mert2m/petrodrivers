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
