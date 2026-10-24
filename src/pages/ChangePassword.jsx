import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChangePassword({ forced = false, onDone, onSignOut }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setOk(false);
    if (password.length < 12) return setMessage('كلمة المرور يجب ألا تقل عن 12 خانة.');
    if (password !== confirm) return setMessage('كلمتا المرور غير متطابقتين.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { error: flagError } = await supabase.rpc('clear_must_change_password');
      if (flagError) {
        throw new Error(
          'تم تغيير كلمة المرور لكن تعذر تحديث حالة الحساب. شغّل ملف database/EXTRA_FUNCTIONS.sql في Supabase. التفاصيل: ' +
            flagError.message
        );
      }
      setPassword('');
      setConfirm('');
      setOk(true);
      setMessage('تم تغيير كلمة المرور بنجاح.');
      await onDone?.();
    } catch (err) {
      setMessage(err.message || 'تعذر تغيير كلمة المرور.');
    } finally {
      setBusy(false);
    }
  }

  const fields = (
    <>
      <label>
        كلمة المرور الجديدة
        <input
          required
          minLength={12}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="12 خانة على الأقل"
        />
      </label>
      <label>
        تأكيد كلمة المرور
        <input
          required
          minLength={12}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>
      {message && <div className={ok ? 'notice success' : 'error-box'}>{message}</div>}
      <button className="btn btn-primary" disabled={busy}>
        <KeyRound size={16} /> {busy ? 'جارٍ الحفظ…' : 'حفظ كلمة المرور'}
      </button>
    </>
  );

  if (forced) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="login-shield">
            <KeyRound size={26} />
          </div>
          <h1>تغيير كلمة المرور</h1>
          <p className="muted">حسابك يستخدم كلمة مرور مؤقتة. اختر كلمة مرور جديدة قبل المتابعة.</p>
          <form onSubmit={submit}>{fields}</form>
          <button className="btn btn-ghost full" onClick={onSignOut} type="button">
            تسجيل الخروج
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">الأمان</span>
          <h2>حسابي</h2>
          <p>غيّر كلمة المرور بشكل دوري ولا تشاركها مع أحد.</p>
        </div>
      </div>
      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          {fields}
        </form>
      </section>
    </>
  );
}
