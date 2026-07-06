-- 0001_extensions.sql — enable required extensions (Supabase convention: dedicated schema).
create schema if not exists extensions;
create extension if not exists postgis  with schema extensions;  -- geography/geometry, GIST, spatial fns
create extension if not exists pgcrypto with schema extensions;  -- gen_random_uuid()
-- We do NOT ALTER DATABASE search_path (needs elevated privs / mutates global state);
-- each later file sets a local search_path including `extensions`.
