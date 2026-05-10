-- 007: Security triggers (profile role escalation)
-- Run after 001_rls_profiles.sql so public.profiles exists.
-- Uses SECURITY DEFINER to read profiles for the acting user without RLS recursion issues.

create or replace function public.profiles_enforce_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean;
begin
  -- No JWT (SQL Editor / postgres role, service_role DB session, maintenance): allow role changes for bootstrap.
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(trim(coalesce(p.role::text, ''))) = 'admin'
  )
  into actor_is_admin;

  if tg_op = 'INSERT' then
    if lower(trim(coalesce(new.role::text, ''))) = 'admin' and not coalesce(actor_is_admin, false) then
      raise exception 'Only admins may create profiles with admin role';
    end if;
  end if;

  if tg_op = 'UPDATE' and (old.role is distinct from new.role) then
    if not coalesce(actor_is_admin, false) then
      raise exception 'Only admins may change profile role';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_role_change_trg on public.profiles;
create trigger profiles_enforce_role_change_trg
  before insert or update on public.profiles
  for each row
  execute procedure public.profiles_enforce_role_change();
