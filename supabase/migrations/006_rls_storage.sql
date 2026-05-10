-- 006: Storage RLS for buckets used by this app (post-images, podcast-images)
-- Prerequisite: buckets exist in Storage (Dashboard → Storage → New bucket) with these exact IDs.
-- Public read keeps CDN/public URLs working; writes are admin-only.

-- post-images
drop policy if exists "post_images_select_public" on storage.objects;
create policy "post_images_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'post-images');

drop policy if exists "post_images_insert_admin" on storage.objects;
create policy "post_images_insert_admin"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

drop policy if exists "post_images_update_admin" on storage.objects;
create policy "post_images_update_admin"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  )
  with check (
    bucket_id = 'post-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

drop policy if exists "post_images_delete_admin" on storage.objects;
create policy "post_images_delete_admin"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

-- podcast-images
drop policy if exists "podcast_images_select_public" on storage.objects;
create policy "podcast_images_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'podcast-images');

drop policy if exists "podcast_images_insert_admin" on storage.objects;
create policy "podcast_images_insert_admin"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'podcast-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

drop policy if exists "podcast_images_update_admin" on storage.objects;
create policy "podcast_images_update_admin"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'podcast-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  )
  with check (
    bucket_id = 'podcast-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

drop policy if exists "podcast_images_delete_admin" on storage.objects;
create policy "podcast_images_delete_admin"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'podcast-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );
