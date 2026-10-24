import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { AuthContext } from './lib/auth.jsx';
import { can, canAccess } from './lib/permissions';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import Technicians from './pages/Technicians.jsx';
import Disputes from './pages/Disputes.jsx';
import Finance from './pages/Finance.jsx';
import Agents from './pages/Agents.jsx';
import Levels from './pages/Levels.jsx';
import Services from './pages/Services.jsx';
import Notifications from './pages/Notifications.jsx';
import Staff from './pages/Staff.jsx';
import Audit from './pages/Audit.jsx';
import Settings from './pages/Settings.jsx';
import Support from './pages/Support.jsx';
import ChangePassword from './pages/ChangePassword.jsx';

const routeTitles = {
  '/': 'الرئيسية',
  '/customers': 'الزبائن',
  '/technicians': 'الفنيون',
  '/disputes': 'النزاعات والضمان',
  '/finance': 'المالية والمحافظ',
  '/agents': 'الوكلاء',
  '/levels': 'مستويات الفنيين',
  '/services': 'الخدمات',
  '/notifications': 'الإشعارات',
  '/staff': 'الموظفون والصلاحيات',
  '/audit': 'سجل التدقيق',
  '/settings': 'الإعدادات',
  '/support': 'الدعم الفني',
  '/account': 'حسابي',
};

const pages = [
  ['/', Dashboard],
  ['/customers', Customers],
  ['/technicians', Technicians],
  ['/disputes', Disputes],
  ['/finance', Finance],
  ['/agents', Agents],
  ['/levels', Levels],
  ['/services', Services],
  ['/notifications', Notifications],
  ['/staff', Staff],
  ['/audit', Audit],
  ['/settings', Settings],
  ['/support', Support],
];

function Forbidden() {
  return (
    <section className="panel">
      <h2>ليس لديك صلاحية لهذه الصفحة</h2>
      <p className="muted">اطلب من المالك الأساسي منحك الصلاحية المناسبة من صفحة الموظفون والصلاحيات.</p>
    </section>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(false);
  const userIdRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const loadProfile = useCallback(async (user) => {
    if (!supabase || !user) {
      setProfile(null);
      setPermissions(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(data || null);
    if (data?.role === 'admin') {
      const { data: perms } = await supabase
        .from('admin_permissions')
        .select('permissions,is_super_admin')
        .eq('user_id', user.id)
        .maybeSingle();
      setPermissions(perms || null);
    } else {
      setPermissions(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      const uid = next?.user?.id || null;
      if (uid === userIdRef.current) {
        if (event === 'INITIAL_SESSION' && !uid) setLoading(false);
        return;
      }
      userIdRef.current = uid;
      if (!uid) {
        setProfile(null);
        setPermissions(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      // لا نستدعي Supabase مباشرة داخل المستمع لتفادي التعليق.
      setTimeout(async () => {
        await loadProfile(next.user);
        if (mounted) setLoading(false);
      }, 0);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  useEffect(() => {
    setMenu(false);
  }, [location.pathname]);

  async function signOut() {
    await supabase?.auth.signOut();
    navigate('/login');
  }

  const refresh = useCallback(() => loadProfile(session?.user), [loadProfile, session]);
  const ctx = useMemo(
    () => ({ profile, permissions, refresh, can: (p) => can(profile, permissions, p) }),
    [profile, permissions, refresh]
  );

  if (!supabase) {
    return (
      <div className="center-screen">
        <h2>إعدادات الاتصال ناقصة</h2>
        <p>أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env ثم أعد تشغيل المشروع.</p>
      </div>
    );
  }

  if (location.pathname === '/login') return <Login session={session} />;

  return (
    <AuthContext.Provider value={ctx}>
      <ProtectedRoute session={session} profile={profile} loading={loading} onSignOut={signOut}>
        {profile?.must_change_password === true ? (
          <ChangePassword forced onDone={refresh} onSignOut={signOut} />
        ) : (
          <div className="app-shell">
            <Sidebar open={menu} onClose={() => setMenu(false)} profile={profile} />
            <div className="main-area">
              <Header
                title={routeTitles[location.pathname] || 'لوحة الإدارة'}
                profile={profile}
                onMenu={() => setMenu(true)}
                onSignOut={signOut}
              />
              <main className="page-content">
                <Routes>
                  {pages.map(([path, Page]) => (
                    <Route
                      key={path}
                      path={path}
                      element={canAccess(profile, permissions, path) ? <Page /> : <Forbidden />}
                    />
                  ))}
                  <Route path="/account" element={<ChangePassword onDone={refresh} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <footer className="app-footer">
                <span>فنّيك © {new Date().getFullYear()}</span>
                <span>منصة الخدمات المنزلية — ليبيا</span>
              </footer>
            </div>
          </div>
        )}
      </ProtectedRoute>
    </AuthContext.Provider>
  );
}
