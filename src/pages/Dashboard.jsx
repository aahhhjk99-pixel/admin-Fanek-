import { useEffect, useState } from 'react';
import { Activity, ClipboardList, HandCoins, ShieldAlert, Users, Wrench, Wallet } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import { supabase } from '../lib/supabase';

async function count(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: c, error } = await q;
  return error ? null : c ?? 0;
}

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const [total, orders, disputes, wallets, tech, customers] = await Promise.all([
        count('profiles'),
        count('orders'),
        count('disputes'),
        count('wallets'),
        count('profiles', (q) => q.eq('role', 'technician')),
        count('profiles', (q) => q.eq('role', 'customer')),
      ]);
      if (alive) {
        setStats({ total, orders, disputes, wallets, tech, customers });
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const show = (v) => (loading ? '…' : v ?? '—');
  const connected = Object.values(stats).some((v) => v !== null && v !== undefined);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">نظرة عامة</span>
          <h2>أهلاً بك في فنّيك</h2>
          <p>هذه المؤشرات تُقرأ مباشرة من قاعدة البيانات، وتخضع لصلاحيات حسابك. الرمز — يعني تعذر القراءة.</p>
        </div>
        <div className="live-pill">
          <span /> بيانات مباشرة
        </div>
      </div>
      <div className="stats-grid">
        <StatCard label="إجمالي الحسابات" value={show(stats.total)} detail="الزبائن والفنيون والإدارة" icon={Users} />
        <StatCard label="الفنيون" value={show(stats.tech)} detail="حسابات الفنيين" icon={Wrench} />
        <StatCard label="الزبائن" value={show(stats.customers)} detail="حسابات الزبائن" icon={Users} />
        <StatCard label="الطلبات" value={show(stats.orders)} detail="جميع الطلبات المرئية لحسابك" icon={ClipboardList} />
        <StatCard label="النزاعات" value={show(stats.disputes)} detail="حسب سياسات الوصول" icon={ShieldAlert} />
        <StatCard label="المحافظ" value={show(stats.wallets)} detail="عدد محافظ الفنيين" icon={Wallet} />
      </div>
      <div className="dashboard-columns">
        <section className="panel welcome-panel">
          <div className="panel-kicker">
            <Activity size={17} /> حالة النظام
          </div>
          <h3>{loading ? 'جارٍ فحص الاتصال…' : connected ? 'قاعدة بيانات فنّيك متصلة' : 'تعذر قراءة المؤشرات'}</h3>
          <p>
            {connected || loading
              ? 'بعض العمليات تحتاج وظائف خادم وإعداد أسرار الإشعارات قبل تشغيلها في الإنتاج.'
              : 'تأكد من إعدادات .env ومن سياسات RLS لحساب الإدارة، ثم حدّث الصفحة.'}
          </p>
          <small>ملاحظة: لا يتم عرض أرقام تجريبية في هذه اللوحة.</small>
        </section>
        <section className="panel">
          <div className="panel-toolbar">
            <div>
              <h2>قبل الإطلاق</h2>
              <p>خطوات التحقق النهائية</p>
            </div>
            <HandCoins size={20} className="gold-icon" />
          </div>
          <ul className="check-list">
            <li>تعيين حساب المالك كمدير رئيسي من داخل قاعدة البيانات.</li>
            <li>تشغيل database/EXTRA_FUNCTIONS.sql ونشر وظيفة create-staff-user.</li>
            <li>تجربة تسجيل دخول الإدارة وسياسات RLS.</li>
            <li>إضافة أسرار FCM في بيئة الخادم، وليس في المتصفح.</li>
            <li>اختبار الشحن والتعويضات على بيانات تجريبية قبل الإنتاج.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
