-- 009: Safe public read path for profiles (id, username, created_at only — no email/role).
-- Run after public.profiles exists and after 001_rls_profiles.sql (stricter SELECT on the table).
-- App: use .from("profiles_public") for comment authors, bylines, author pages; keep .from("profiles") for own row + admin.

drop view if exists public.profiles_public;

create view public.profiles_public
with (security_invoker = false)
as
select id, username, created_at
from public.profiles;

comment on view public.profiles_public is
  'Public-safe columns only (no email/role). security_invoker=false so reads use view owner privileges and are not blocked by RLS on public.profiles.';

grant select on table public.profiles_public to anon, authenticated, service_role;
