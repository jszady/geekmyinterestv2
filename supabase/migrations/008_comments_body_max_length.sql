-- 008: Enforce maximum length on comments.body (defense in depth with app validation).

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'comments_body_max_length'
      and conrelid = 'public.comments'::regclass
  ) then
    alter table public.comments
      add constraint comments_body_max_length
      check (char_length(body) <= 250);
  end if;
end
$$;
