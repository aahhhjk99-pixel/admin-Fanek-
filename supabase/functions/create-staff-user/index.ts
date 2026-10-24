import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });

const PERMISSIONS = [
  'dashboard.read', 'users.manage', 'orders.read', 'orders.delete', 'finance.read', 'finance.wallet_adjust',
  'disputes.manage', 'services.manage', 'staff.manage', 'settings.manage', 'audit.read', 'guarantee.manage',
  'levels.manage', 'agents.manage', 'notifications.manage',
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function phoneToEmail(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('218') ? `+${digits}` : digits.startsWith('0') ? `+218${digits.slice(1)}` : `+218${digits}`;
  if (!/^\+218\d{9,10}$/.test(normalized)) throw new Error('رقم الهاتف الليبي غير صحيح.');
  return `${normalized}@services.ly`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'يلزم تسجيل الدخول.' }, 401);

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) return json({ error: 'جلسة غير صالحة.' }, 401);

    const { data: callerProfile } = await adminClient.from('profiles').select('id,role,account_status').eq('id', user.id).maybeSingle();
    const { data: callerPermissions } = await adminClient.from('admin_permissions').select('is_super_admin').eq('user_id', user.id).maybeSingle();
    if (callerProfile?.role !== 'admin' || callerProfile.account_status !== 'active' || callerPermissions?.is_super_admin !== true) {
      return json({ error: 'إنشاء حسابات الموظفين متاح للمالك الأساسي فقط.' }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new Error('البيانات المرسلة غير صالحة.');
    }

    const full_name = String(body.full_name || '').trim();
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');
    const role = String(body.role || 'admin');
    const permissions = Array.isArray(body.permissions)
      ? [...new Set((body.permissions as unknown[]).filter((p): p is string => typeof p === 'string' && PERMISSIONS.includes(p)))]
      : [];

    if (full_name.length < 2) throw new Error('اكتب اسم الموظف بشكل صحيح.');
    if (password.length < 12) throw new Error('كلمة المرور لازم تكون 12 خانة على الأقل.');
    if (!['admin', 'agent'].includes(role)) throw new Error('نوع الحساب غير مسموح.');
    const email = phoneToEmail(phone);

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, provisioned_by: user.id },
    });
    if (createError) {
      if (/already|registered|exists/i.test(createError.message)) throw new Error('هذا الرقم مسجل مسبقًا في النظام.');
      throw createError;
    }
    if (!created.user) throw new Error('تعذر إنشاء المستخدم في نظام الدخول.');
    const newUserId = created.user.id;

    const rollback = async () => {
      await adminClient.auth.admin.deleteUser(newUserId);
    };

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({ id: newUserId, full_name, phone, role, account_status: 'active', must_change_password: true }, { onConflict: 'id' });
    if (profileError) {
      await rollback();
      throw profileError;
    }

    if (role === 'admin') {
      const { error: permissionError } = await adminClient
        .from('admin_permissions')
        .upsert(
          { user_id: newUserId, permissions, is_super_admin: false, granted_by: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
      if (permissionError) {
        await rollback();
        throw permissionError;
      }
    }

    // تسجيل العملية في سجل التدقيق (لا نفشل الطلب إذا تعذر التسجيل).
    try {
      await adminClient.from('audit_logs').insert({
        actor_id: user.id,
        action: 'staff_account_created',
        target_type: 'profile',
        target_id: newUserId,
        reason: 'إنشاء حساب من لوحة الإدارة',
        after_data: { role, permissions },
      });
    } catch {
      /* ignore */
    }

    return json({ success: true, user_id: newUserId, email, role, must_change_password: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'حدث خطأ غير متوقع.' }, 400);
  }
});
