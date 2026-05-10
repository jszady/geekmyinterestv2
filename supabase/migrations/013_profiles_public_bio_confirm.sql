-- Idempotent: ensure profiles.bio exists and profiles_public exposes it (no email/role).
-- Safe to run if 011_profiles_bio_author_header.sql was already applied.

alter table public.profiles
  add column if not exists bio text;

drop view if exists public.profiles_public;

create view public.profiles_public
with (security_invoker = false)
as
select
  id,
  username,
  avatar_url,
  bio,
  author_header_image,
  created_at
from public.profiles;

comment on view public.profiles_public is
  'Public-safe columns only (no email/role).';

grant select on table public.profiles_public to anon, authenticated, service_role;
