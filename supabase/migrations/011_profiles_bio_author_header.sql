-- 011: Author-facing profile fields (admin-managed) + extended profiles_public (still no email/role).

alter table public.profiles
  add column if not exists bio text;

alter table public.profiles
  add column if not exists author_header_image text;

comment on column public.profiles.bio is
  'Public author bio (shown on /authors/[username]).';

comment on column public.profiles.author_header_image is
  'Public URL for author page banner/header (Supabase Storage or preset path).';

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
