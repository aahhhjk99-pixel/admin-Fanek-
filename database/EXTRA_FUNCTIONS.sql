-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor (بصلاحية مالك المشروع).
-- يضيف: عمود must_change_password، ودالة تصفير الحالة بعد تغيير كلمة المرور، ودالة إيقاف/تفعيل الحسابات مع تسجيل التدقيق.

alter table public.profiles add column if not exists must_change_password boolean not null default false;

-- 1) المستخدم يصفّر علامة "يجب تغيير كلمة المرور" لحسابه فقط
create or replace function public.clear_must_change_password()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set must_change_password = false where id = auth.uid();
$$;
revoke all on function public.clear_must_change_password() from public, anon;
grant execute on function public.clear_must_change_password() to authenticated;

-- 2) إيقاف/تفعيل حساب (زبون أو فني أو موظف)
--    ملاحظة: إذا كان عندك قيد check على account_status بقيم مختلفة عن ('active','suspended') عدّل القيم هنا وفي الواجهة.
create or replace function public.admin_set_account_status(p_user_id uuid, p_status text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_is_super boolean := false;
  v_has_users boolean := false;
  v_target_role text;
  v_old_status text;
  v_target_super boolean := false;
begin
  if v_caller is null then raise exception 'يلزم تسجيل الدخول'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'حالة غير مسموحة'; end if;
  if p_reason is null or length(trim(p_reason)) < 4 then raise exception 'السبب إلزامي (4 أحرف على الأقل)'; end if;
  if p_user_id = v_caller then raise exception 'لا يمكنك تغيير حالة حسابك'; end if;

  select coalesce(ap.is_super_admin, false), coalesce(ap.permissions ? 'users.manage', false)
    into v_is_super, v_has_users
    from public.profiles p
    join public.admin_permissions ap on ap.user_id = p.id
   where p.id = v_caller and p.role = 'admin' and p.account_status = 'active';
  if not found then raise exception 'غير مصرح'; end if;

  select role, account_status into v_target_role, v_old_status from public.profiles where id = p_user_id;
  if not found then raise exception 'الحساب غير موجود'; end if;

  select coalesce(is_super_admin, false) into v_target_super from public.admin_permissions where user_id = p_user_id;
  if coalesce(v_target_super, false) then raise exception 'حساب المالك الأساسي محمي'; end if;

  if v_target_role in ('admin', 'agent') then
    if not v_is_super then raise exception 'تغيير حالة الموظفين والوكلاء للمالك الأساسي فقط'; end if;
  elsif not (v_is_super or v_has_users) then
    raise exception 'غير مصرح';
  end if;

  update public.profiles set account_status = p_status where id = p_user_id;

  begin
    insert into public.audit_logs (actor_id, action, target_type, target_id, reason, before_data, after_data)
    values (v_caller, 'account_status_changed', 'profile', p_user_id, trim(p_reason),
            jsonb_build_object('account_status', v_old_status),
            jsonb_build_object('account_status', p_status));
  exception when others then
    null; -- لا نفشل العملية إذا اختلف شكل جدول التدقيق
  end;

  return jsonb_build_object('user_id', p_user_id, 'account_status', p_status);
end;
$$;
revoke all on function public.admin_set_account_status(uuid, text, text) from public, anon;
grant execute on function public.admin_set_account_status(uuid, text, text) to authenticated;
