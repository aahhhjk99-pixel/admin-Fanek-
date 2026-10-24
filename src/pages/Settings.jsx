import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const labels = {
  guarantee: 'ضمان فنّيك',
  technician_levels: 'مستويات الفنيين',
  agent_recharge: 'الشحن عبر الوكلاء',
  price_changes: 'تغييرات الأسعار',
  inspection_fees: 'رسوم المعاينة',
  push_notifications: 'الإشعارات الفورية',
};

const pretty = (v) => JSON.stringify(v, null, 2);

export default function Settings() {
  // كل إعداد: { key, value, text, error, dirty } — النص المكتوب منفصل عن القيمة المحلَّلة حتى تستطيع الكتابة بحرية.
  const [settings, setSettings] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setMessage('');
    const { data, error } = await supabase.from('app_settings').select('*').order('key');
    if (error) setMessage(error.message);
    else setSettings((data || []).map((s) => ({ ...s, text: pretty(s.value), error: '', dirty: false })));
  }

  useEffect(() => {
    if (supabase) load();
  }, []);

  function edit(key, text) {
    setSettings((old) =>
      old.map((s) => {
        if (s.key !== key) return s;
        try {
          return { ...s, text, value: JSON.parse(text), error: '', dirty: true };
        } catch {
          return { ...s, text, error: 'JSON غير صالح — لن يُحفظ حتى تصححه.', dirty: true };
        }
      })
    );
  }

  const hasError = settings.some((s) => s.error);
  const dirtyCount = settings.filter((s) => s.dirty).length;

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      if (hasError) throw new Error('يوجد إعداد بصيغة JSON غير صالحة. صحّحه أولًا.');
      const changed = settings.filter((s) => s.dirty);
      if (changed.length === 0) throw new Error('لا توجد تغييرات للحفظ.');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const saved = [];
      for (const s of changed) {
        const { data, error } = await supabase
          .from('app_settings')
          .update({ value: s.value, updated_by: user?.id, updated_at: new Date().toISOString() })
          .eq('key', s.key)
          .select('key');
        if (error) throw error;
        if (!data || data.length === 0) throw new Error(`لم يُحدَّث الإعداد ${s.key}. تحقق من صلاحياتك (settings.manage).`);
        saved.push(s.key);
      }
      setSettings((old) => old.map((s) => (saved.includes(s.key) ? { ...s, dirty: false } : s)));
      setMessage(`تم حفظ ${saved.length} إعداد.`);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">تهيئة المنصة</span>
          <h2>الإعدادات</h2>
          <p>تعديلات القيم محفوظة في قاعدة البيانات. اترك الميزة معطلة حتى يكتمل اختبار منطقها.</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={busy || hasError || dirtyCount === 0}>
          {busy ? 'جارٍ الحفظ…' : dirtyCount ? `حفظ الإعدادات (${dirtyCount})` : 'حفظ الإعدادات'}
        </button>
      </div>
      {message && <div className="notice">{message}</div>}
      <div className="settings-grid">
        {settings.map((s) => (
          <section className={`panel setting-card ${s.dirty ? 'dirty' : ''}`} key={s.key}>
            <div className="panel-kicker">{labels[s.key] || s.key}</div>
            <h3>{s.key}</h3>
            <textarea rows="6" value={s.text} onChange={(e) => edit(s.key, e.target.value)} spellCheck={false} />
            <small className={s.error ? 'text-danger' : ''}>
              {s.error || (s.dirty ? 'تعديل غير محفوظ.' : 'صيغة JSON صالحة.')}
            </small>
          </section>
        ))}
      </div>
    </>
  );
}
