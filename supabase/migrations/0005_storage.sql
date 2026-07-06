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
