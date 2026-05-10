-- 010: Profile avatars (column + public view) and storage policies for bucket `profile-images`.
-- Prerequisite: create bucket `profile-images` in Dashboard → Storage (public bucket for avatars).

-- --- Table ---
alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'Public URL for profile image (Supabase Storage public object URL).';

-- --- Public view (still no email / role) ---
drop view if exists public.profiles_public;

create view public.profiles_public
with (security_invoker = false)
as
select id, username, avatar_url, created_at
from public.profiles;

comment on view public.profiles_public is
  'Public-safe columns only (no email/role). security_invoker=false so reads use view owner privileges.';

grant select on table public.profiles_public to anon, authenticated, service_role;

-- --- Storage: profile-images ---
-- Public read (CDN / Next Image).
drop policy if exists "profile_images_select_public" on storage.objects;
create policy "profile_images_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'profile-images');

-- Authenticated users: insert only under own folder (first path segment = auth.uid()).
drop policy if exists "profile_images_insert_own_folder" on storage.objects;
create policy "profile_images_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );

drop policy if exists "profile_images_update_own_or_admin" on storage.objects;
create policy "profile_images_update_own_or_admin"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and lower(trim(coalesce(p.role::text, ''))) = 'admin'
      )
    )
  )
  with check (
    bucket_id = 'profile-images'
    and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and lower(trim(coalesce(p.role::text, ''))) = 'admin'
      )
    )
  );

drop policy if exists "profile_images_delete_own_or_admin" on storage.objects;
create policy "profile_images_delete_own_or_admin"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and lower(trim(coalesce(p.role::text, ''))) = 'admin'
      )
    )
  );
