-- ============================================================
-- ESTINAD Control — bootstrap the first platform admin
-- Run in the Supabase SQL editor of the `rms` project.
-- 1. Create the user in Authentication → Users → Add user.
-- 2. Replace the email below, then run this script.
-- ============================================================

insert into public.platform_admins (user_id, email, name, role, last_login_at)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'name', u.email),
  'super_admin',           -- first admin: super_admin. Later admins can be admin|support.
  now()
from auth.users u
where u.email = 'ameur.gh.intj@gmail.com'
on conflict do nothing;

-- Optional: additional admins with lower privilege
-- update public.platform_admins set role = 'support' where email = 'support@estinad.com';

-- Verify
select email, role from public.platform_admins order by created_at;
