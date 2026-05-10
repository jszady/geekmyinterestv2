-- Run in Supabase SQL editor (or migrate) before using post tags in the app.
-- Tables: tags, post_tags

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  constraint tags_slug_unique unique (slug),
  constraint tags_name_len check (char_length(trim(name)) between 1 and 120)
);

create index if not exists tags_slug_idx on public.tags (slug);

create table if not exists public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists post_tags_tag_id_idx on public.post_tags (tag_id);
create index if not exists post_tags_post_id_idx on public.post_tags (post_id);

-- RLS (adjust if your auth model differs)
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;

create policy "tags_select_public"
  on public.tags for select
  using (true);

create policy "tags_insert_admin"
  on public.tags for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "post_tags_select_public"
  on public.post_tags for select
  using (true);

create policy "post_tags_insert_admin"
  on public.post_tags for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "post_tags_delete_admin"
  on public.post_tags for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
