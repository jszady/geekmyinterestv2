-- 002: Row Level Security for public.posts
-- Assumes columns: id, status ('draft' | 'published'), author_id (uuid), etc.

alter table public.posts enable row level security;

drop policy if exists "posts_select_published_or_admin" on public.posts;
create policy "posts_select_published_or_admin"
  on public.posts
  for select
  to anon, authenticated
  using (
    status = 'published'
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

drop policy if exists "posts_insert_admin" on public.posts;
create policy "posts_insert_admin"
  on public.posts
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

drop policy if exists "posts_update_admin" on public.posts;
create policy "posts_update_admin"
  on public.posts
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

drop policy if exists "posts_delete_admin" on public.posts;
create policy "posts_delete_admin"
  on public.posts
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );
