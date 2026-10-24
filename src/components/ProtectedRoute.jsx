import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ session, profile, loading, onSignOut, children }) {
  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p>جارٍ التحقق من الجلسة…</p>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!profile || profile.role !== 'admin' || profile.account_status !== 'active') {
    return (
      <div className="center-screen">
        <h2>الوصول مرفوض</h2>
        <p>حسابك ليس حساب إدارة نشطًا. تواصل مع المسؤول الرئيسي.</p>
        {onSignOut && (
          <button className="btn btn-ghost" onClick={onSignOut}>
            تسجيل الخروج
          </button>
        )}
      </div>
    );
  }
  return children;
}
