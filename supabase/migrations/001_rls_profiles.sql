-- 001: Row Level Security for public.profiles
-- Run after public.profiles exists (id = auth.users.id, role, email, username, created_at).
-- Role escalation is blocked in 007_security_triggers.sql (run after this file).

alter table public.profiles enable row level security;

-- Full row only for self or admins (email/role must not leak via anon API — use profiles_public view)
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

-- First-time profile row (OAuth / signup flows)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- Users update only their row; admins may update any row (role changes still guarded by trigger in 007)
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles
  for update
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  )
  with check (
    id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

-- No broad DELETE for users; use service role or SQL if you must remove accounts.
