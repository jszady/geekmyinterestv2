-- 012: Storage RLS for public bucket `author-headers` (admin author page banners).
-- Prerequisite: create bucket `author-headers` in Dashboard → Storage (public bucket).

drop policy if exists "author_headers_select_public" on storage.objects;
create policy "author_headers_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'author-headers');

drop policy if exists "author_headers_insert_own_folder" on storage.objects;
create policy "author_headers_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'author-headers'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );

drop policy if exists "author_headers_update_own_or_admin" on storage.objects;
create policy "author_headers_update_own_or_admin"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'author-headers'
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
    bucket_id = 'author-headers'
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

drop policy if exists "author_headers_delete_own_or_admin" on storage.objects;
create policy "author_headers_delete_own_or_admin"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'author-headers'
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
