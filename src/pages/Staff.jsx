import { useEffect, useState } from 'react';
import { KeyRound, UserPlus, ShieldCheck, RefreshCw, Wand2 } from 'lucide-react';
import { PERMISSIONS } from '../lib/permissions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth.jsx';
import DataTable from '../components/DataTable.jsx';
import AccountStatusButton from '../components/AccountStatusButton.jsx';

const emptyForm = { full_name: '', phone: '', password: '', role: 'admin' };
const defaultPerms = ['dashboard.read', 'orders.read'];

function generatePassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export default function Staff() {
  const { permissions } = useAuth();
  const isOwner = permissions?.is_super_admin === true;
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState('');
  const [chosen, setChosen] = useState([]);
  const [reason, setReason] = useState('تحديث صلاحيات الموظف');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [createPermissions, setCreatePermissions] = useState(defaultPerms);
  const [newAccount, setNewAccount] = useState(null);

  async function load() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,phone,role,account_status,created_at')
      .in('role', ['admin', 'agent'])
      .order('created_at', { ascending: false });
    if (error) setMessage(error.message);
    else setStaff(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function choose(id) {
    setSelected(id);
    setMessage('');
    setChosen([]);
    if (!id) return;
    const { data, error } = await supabase
      .from('admin_permissions')
      .select('permissions,is_super_admin')
      .eq('user_id', id)
      .maybeSingle();
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data?.is_super_admin) {
      setMessage('حساب المالك الأساسي محمي ولا يمكن تعديل صلاحياته من هنا.');
      return;
    }
    setChosen(data?.permissions || []);
  }

  async function createAccount(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setNewAccount(null);
    try {
      if (!isOwner) throw new Error('إنشاء حسابات الموظفين متاح للمالك الأساسي فقط.');
      const submittedPhone = form.phone;
      const { data, error } = await supabase.functions.invoke('create-staff-user', {
        body: { ...form, permissions: form.role === 'admin' ? createPermissions : [] },
      });
      if (error) {
        // عند أخطاء الوظيفة تكون رسالة الخادم داخل error.context
        let detail = '';
        try {
          detail = (await error.context?.json?.())?.error || '';
        } catch {
          /* ignore */
        }
        throw new Error(detail || data?.error || error.message || 'تعذر إنشاء الحساب.');
      }
      if (data?.error) throw new Error(data.error);
      setNewAccount({ ...data, submitted_phone: submittedPhone });
      setForm(emptyForm);
      setShowPass(false);
      setCreatePermissions(defaultPerms);
      setMessage('تم إنشاء الحساب. أعطِ الموظف بيانات الدخول بشكل آمن، وسيُطلب منه تغيير كلمة المرور عند أول دخول.');
      await load();
    } catch (err) {
      setMessage(err.message || 'حدث خطأ أثناء إنشاء الحساب.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setMessage('');
    setBusy(true);
    try {
      if (!selected) throw new Error('اختر موظفًا أولًا.');
      const { data: target } = await supabase
        .from('admin_permissions')
        .select('is_super_admin')
        .eq('user_id', selected)
        .maybeSingle();
      if (target?.is_super_admin) throw new Error('لا يمكن تعديل صلاحيات المالك الأساسي.');
      const { error } = await supabase.rpc('admin_set_staff_permissions', {
        p_user_id: selected,
        p_permissions: chosen,
        p_is_super_admin: false,
        p_reason: reason,
      });
      if (error) throw error;
      setMessage('تم تحديث الصلاحيات وتسجيل التغيير.');
      await load();
    } catch (err) {
      setMessage(err.message || 'تعذر حفظ الصلاحيات.');
    } finally {
      setBusy(false);
    }
  }

  const toggle = (setter) => (key) => (e) =>
    setter((old) => (e.target.checked ? [...new Set([...old, key])] : old.filter((x) => x !== key)));

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">التحكم الإداري</span>
          <h2>الموظفون والصلاحيات</h2>
          <p>أنشئ حسابات الموظفين من لوحة الموقع، وحدد صلاحياتهم دون الدخول إلى قاعدة البيانات يدويًا.</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>
          <RefreshCw size={16} /> تحديث
        </button>
      </div>

      {isOwner ? (
        <section className="panel">
          <div className="panel-toolbar">
            <div>
              <h2>
                <UserPlus size={19} /> إنشاء حساب موظف جديد
              </h2>
              <p>الحساب ينشأ عبر وظيفة آمنة على الخادم، وليس من المتصفح مباشرة.</p>
            </div>
            <ShieldCheck size={24} />
          </div>
          <form onSubmit={createAccount} className="staff-create-grid">
            <label className="field-label">
              اسم الموظف
              <input
                required
                minLength={2}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="الاسم الكامل"
              />
            </label>
            <label className="field-label">
              رقم الهاتف الليبي
              <input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="09XXXXXXXX"
                inputMode="tel"
              />
            </label>
            <label className="field-label">
              نوع الحساب
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">موظف إدارة</option>
                <option value="agent">وكيل شحن</option>
              </select>
            </label>
            <label className="field-label">
              كلمة المرور المؤقتة
              <div className="pw-row">
                <input
                  required
                  minLength={12}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="12 خانة على الأقل"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  title="توليد كلمة مرور قوية"
                  onClick={() => {
                    setForm({ ...form, password: generatePassword() });
                    setShowPass(true);
                  }}
                >
                  <Wand2 size={14} /> توليد
                </button>
              </div>
              <small>لا تقل عن 12 خانة. لا تستخدم كلمة مرور المالك. انسخها قبل الإنشاء لتسلمها للموظف.</small>
            </label>
            {form.role === 'admin' && (
              <div className="staff-create-permissions">
                <b>صلاحيات الموظف الجديد</b>
                <div className="permission-grid">
                  {PERMISSIONS.map(([key, label]) => (
                    <label className="permission-item" key={key}>
                      <input
                        type="checkbox"
                        checked={createPermissions.includes(key)}
                        onChange={toggle(setCreatePermissions)(key)}
                      />
                      <span>
                        <b>{label}</b>
                        <small>{key}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="staff-create-actions">
              <button className="btn btn-primary" disabled={busy}>
                <KeyRound size={16} />
                {busy ? 'جارٍ إنشاء الحساب…' : 'إنشاء الحساب'}
              </button>
              <small>حسابات الموظفين لا يمكنها منح نفسها صلاحيات المالك.</small>
            </div>
          </form>
          {newAccount && (
            <div className="notice success">
              <b>تم إنشاء الحساب بنجاح</b>
              <p>رقم الدخول: {newAccount.submitted_phone}</p>
              <p>
                معرّف المستخدم: <code>{newAccount.user_id}</code>
              </p>
              <p>سيُطلب من الموظف تغيير كلمة المرور عند أول دخول. سلّمه البيانات بطريقة آمنة.</p>
            </div>
          )}
        </section>
      ) : (
        <section className="panel">
          <h2>إنشاء حساب موظف</h2>
          <p>هذا الإجراء متاح للمالك الأساسي فقط.</p>
        </section>
      )}

      <section className="panel">
        <div className="panel-toolbar">
          <div>
            <h2>إدارة صلاحيات موظف</h2>
            <p>اختر حساب إدارة موجودًا لتعديل صلاحياته.</p>
          </div>
        </div>
        <label className="field-label">
          الموظف
          <select value={selected} onChange={(e) => choose(e.target.value)}>
            <option value="">اختر موظفًا</option>
            {staff
              .filter((s) => s.role === 'admin')
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.phone || s.id} — {s.account_status}
                </option>
              ))}
          </select>
        </label>
        {selected && (
          <>
            <div className="permission-grid">
              {PERMISSIONS.map(([key, label]) => (
                <label className="permission-item" key={key}>
                  <input type="checkbox" checked={chosen.includes(key)} onChange={toggle(setChosen)(key)} />
                  <span>
                    <b>{label}</b>
                    <small>{key}</small>
                  </span>
                </label>
              ))}
            </div>
            <label className="field-label">
              سبب التعديل
              <input value={reason} onChange={(e) => setReason(e.target.value)} required minLength={4} />
            </label>
            <button className="btn btn-primary" onClick={save} disabled={busy}>
              حفظ الصلاحيات
            </button>
          </>
        )}
        {message && <div className="notice">{message}</div>}
      </section>

      <DataTable
        table="profiles"
        title="حسابات الموظفين والوكلاء"
        select="id,full_name,phone,role,account_status,created_at"
        columns={[
          { key: 'full_name', label: 'الاسم' },
          { key: 'phone', label: 'الهاتف' },
          { key: 'role', label: 'النوع' },
          { key: 'account_status', label: 'الحالة' },
          { key: 'created_at', label: 'تاريخ الإنشاء' },
        ]}
        filters={(q) => q.in('role', ['admin', 'agent'])}
        actions={(row, reload) => (
          <AccountStatusButton
            row={row}
            permission="staff.manage"
            onDone={() => {
              reload();
              load();
            }}
          />
        )}
      />

      <DataTable
        table="admin_permissions"
        orderBy="updated_at"
        title="سجل الصلاحيات"
        select="user_id,permissions,is_super_admin,granted_by,updated_at"
        columns={[
          { key: 'user_id', label: 'حساب الموظف' },
          { key: 'permissions', label: 'الصلاحيات' },
          { key: 'is_super_admin', label: 'مدير رئيسي' },
          { key: 'granted_by', label: 'منح بواسطة' },
          { key: 'updated_at', label: 'آخر تحديث' },
        ]}
      />
    </>
  );
}
