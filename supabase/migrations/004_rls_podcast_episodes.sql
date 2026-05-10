-- 004: Row Level Security for public.podcast_episodes
-- Assumes: status ('draft' | 'published'), author_id uuid, etc.

alter table public.podcast_episodes enable row level security;

drop policy if exists "podcast_episodes_select_published_or_admin" on public.podcast_episodes;
create policy "podcast_episodes_select_published_or_admin"
  on public.podcast_episodes
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

drop policy if exists "podcast_episodes_insert_admin" on public.podcast_episodes;
create policy "podcast_episodes_insert_admin"
  on public.podcast_episodes
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

drop policy if exists "podcast_episodes_update_admin" on public.podcast_episodes;
create policy "podcast_episodes_update_admin"
  on public.podcast_episodes
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

drop policy if exists "podcast_episodes_delete_admin" on public.podcast_episodes;
create policy "podcast_episodes_delete_admin"
  on public.podcast_episodes
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
