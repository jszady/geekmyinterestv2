-- 005: Row Level Security for public.tags and public.post_tags
-- Supersedes / aligns with supabase/schema-tags.sql (drops same policy names, adds UPDATE/DELETE for tags).

alter table public.tags enable row level security;
alter table public.post_tags enable row level security;

-- ----- tags -----
drop policy if exists "tags_select_public" on public.tags;
create policy "tags_select_public"
  on public.tags
  for select
  to anon, authenticated
  using (true);

drop policy if exists "tags_insert_admin" on public.tags;
create policy "tags_insert_admin"
  on public.tags
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

drop policy if exists "tags_update_admin" on public.tags;
create policy "tags_update_admin"
  on public.tags
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

drop policy if exists "tags_delete_admin" on public.tags;
create policy "tags_delete_admin"
  on public.tags
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

-- ----- post_tags -----
drop policy if exists "post_tags_select_public" on public.post_tags;
create policy "post_tags_select_public"
  on public.post_tags
  for select
  to anon, authenticated
  using (true);

drop policy if exists "post_tags_insert_admin" on public.post_tags;
create policy "post_tags_insert_admin"
  on public.post_tags
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

drop policy if exists "post_tags_delete_admin" on public.post_tags;
create policy "post_tags_delete_admin"
  on public.post_tags
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

-- Junction rows are typically replaced via delete+insert; no UPDATE policy required.
