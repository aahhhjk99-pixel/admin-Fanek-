-- Run ONLY in Supabase SQL Editor as project owner after you create your own account.
-- First copy your UUID from Authentication -> Users and replace the placeholder.
-- Do not run this for employees or any other account.
begin;
update public.profiles
set role = 'admin', account_status = 'active'
where id = 'YOUR_AUTH_USER_UUID'::uuid;
insert into public.admin_permissions(user_id, permissions, is_super_admin)
values ('YOUR_AUTH_USER_UUID'::uuid, '[]'::jsonb, true)
on conflict (user_id) do update set is_super_admin = true, permissions = '[]'::jsonb;
commit;
-- Verify:
select p.id, p.full_name, p.role, p.account_status, ap.is_super_admin
from public.profiles p join public.admin_permissions ap on ap.user_id = p.id
where p.id = 'YOUR_AUTH_USER_UUID'::uuid;
