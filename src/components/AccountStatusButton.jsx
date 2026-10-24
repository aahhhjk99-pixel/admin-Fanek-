import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth.jsx';

// إيقاف/تفعيل حساب عبر دالة قاعدة البيانات admin_set_account_status (موجودة في database/EXTRA_FUNCTIONS.sql).
export default function AccountStatusButton({ row, onDone, permission = 'users.manage' }) {
  const { can, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!can(permission) || row.id === profile?.id) return <span>—</span>;

  const active = row.account_status === 'active';
  const next = active ? 'suspended' : 'active';

  async function change() {
    const reason = window.prompt(active ? 'سبب إيقاف الحساب (إلزامي):' : 'سبب إعادة تفعيل الحساب (إلزامي):');
    if (!reason || reason.trim().length < 4) return;
    setBusy(true);
    const { error } = await supabase.rpc('admin_set_account_status', {
      p_user_id: row.id,
      p_status: next,
      p_reason: reason.trim(),
    });
    setBusy(false);
    if (error) {
      window.alert(error.message);
      return;
    }
    onDone?.();
  }

  return (
    <button className={`btn btn-sm ${active ? 'btn-danger' : 'btn-ghost'}`} disabled={busy} onClick={change}>
      {busy ? '…' : active ? 'إيقاف' : 'تفعيل'}
    </button>
  );
}
