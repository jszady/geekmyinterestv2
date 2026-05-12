-- V2 flexible article body: JSON array of { id, type, order, data }.
-- Null = legacy section-based posts (section_N_* columns).

alter table public.posts
  add column if not exists content_blocks jsonb default null;

comment on column public.posts.content_blocks is
  'V2 block-based article body. When non-empty array, clients render blocks instead of section_N_* fields.';
