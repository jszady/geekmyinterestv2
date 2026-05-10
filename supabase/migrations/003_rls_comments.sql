-- 003: Row Level Security for public.comments
-- Assumes: post_id -> posts(id), user_id = commenter auth user, parent_comment_id optional.

alter table public.comments enable row level security;

-- Read comments on published articles (or admins read all)
drop policy if exists "comments_select_published_or_admin" on public.comments;
create policy "comments_select_published_or_admin"
  on public.comments
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.posts po
      where po.id = comments.post_id
        and po.status = 'published'
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

-- Authenticated users comment only as themselves, only on published posts
drop policy if exists "comments_insert_authenticated" on public.comments;
create policy "comments_insert_authenticated"
  on public.comments
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.posts po
      where po.id = comments.post_id
        and po.status = 'published'
    )
  );

-- Optional: replies must target a comment on the same post (DB FK usually enforces parent exists)
-- If parent_comment_id is set, parent row must share post_id — add CHECK in schema if not present.

drop policy if exists "comments_delete_own_or_admin" on public.comments;
create policy "comments_delete_own_or_admin"
  on public.comments
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );
