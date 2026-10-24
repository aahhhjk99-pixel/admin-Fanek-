import { Bell, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function Header({ title, profile, onMenu, onSignOut }) {
  const navigate = useNavigate();
  const { can } = useAuth();
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="icon-button menu-button" onClick={onMenu} aria-label="القائمة">
          <Menu size={20} />
        </button>
        <div>
          <h1>{title}</h1>
          <p>إدارة منصة فنّيك للخدمات المنزلية</p>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="status-chip">
          <span /> النظام متصل
        </div>
        {can('notifications.manage') && (
          <button className="icon-button" title="الإشعارات" onClick={() => navigate('/notifications')}>
            <Bell size={18} />
          </button>
        )}
        <button className="topbar-user" title="حسابي وتغيير كلمة المرور" onClick={() => navigate('/account')}>
          <div className="avatar">{(profile?.full_name || 'م').slice(0, 1)}</div>
          <span>{profile?.full_name || 'المدير'}</span>
        </button>
        <button className="icon-button logout" onClick={onSignOut} title="تسجيل الخروج" aria-label="تسجيل الخروج">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
