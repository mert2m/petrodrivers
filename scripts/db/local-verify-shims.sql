-- local-verify-shims.sql — LOCAL VERIFICATION ONLY. **NOT a migration. Never applied to Supabase.**
-- Stands in for the auth/storage schema objects that Supabase provides at runtime, so the real
-- migrations (0001..0005) can be applied against a bare postgis/postgis container to prove they
-- parse, create, and index cleanly (including the RLS policies that reference auth.uid()/storage).

-- Supabase built-in roles (policies use `to authenticated`).
do $$ begin create role anon;          exception when duplicate_object then null; end $$;
do $$ begin create role authenticated;  exception when duplicate_object then null; end $$;
do $$ begin create role service_role;   exception when duplicate_object then null; end $$;

-- auth schema + minimal users table + auth.uid() (real one reads the JWT; here it returns NULL).
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);
create or replace function auth.uid() returns uuid
  language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

-- storage schema + buckets/objects + foldername() (splits path, returns all but the last segment).
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text not null, public boolean not null default false
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  created_at timestamptz default now()
);
create or replace function storage.foldername(name text) returns text[]
  language sql immutable as $$
    select (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1]
  $$;
