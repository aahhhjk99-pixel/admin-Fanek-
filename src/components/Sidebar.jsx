import { NavLink } from 'react-router-dom';
import {
  Activity, BadgeCheck, Banknote, Bell, CircleHelp, Crown, HandCoins,
  LayoutDashboard, Medal, Settings, ShieldCheck, Users, Wrench, X,
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { canAccess } from '../lib/permissions';

const items = [
  ['/', 'الرئيسية', LayoutDashboard],
  ['/customers', 'الزبائن', Users],
  ['/technicians', 'الفنيون', Wrench],
  ['/disputes', 'النزاعات والضمان', ShieldCheck],
  ['/finance', 'المالية والمحافظ', Banknote],
  ['/agents', 'الوكلاء', HandCoins],
  ['/levels', 'مستويات الفنيين', Medal],
  ['/services', 'الخدمات', BadgeCheck],
  ['/notifications', 'الإشعارات', Bell],
  ['/staff', 'الموظفون والصلاحيات', Crown],
  ['/audit', 'سجل التدقيق', Activity],
  ['/settings', 'الإعدادات', Settings],
  ['/support', 'الدعم', CircleHelp],
];

export default function Sidebar({ open, onClose, profile }) {
  const { permissions } = useAuth();
  const visible = items.filter(([to]) => canAccess(profile, permissions, to));
  return (
    <>
      <div className={`sidebar-backdrop ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">ف</div>
          <div>
            <strong>فنّيك</strong>
            <small>لوحة الإدارة</small>
          </div>
          <button className="icon-button mobile-close" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <div className="side-label">مساحة العمل</div>
        <nav>
          {visible.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-footer">
          <div className="avatar">{(profile?.full_name || 'م').slice(0, 1)}</div>
          <div className="side-user">
            <b>{profile?.full_name || 'مدير فنّيك'}</b>
            <small>{profile?.phone || 'حساب إدارة'}</small>
          </div>
        </div>
      </aside>
    </>
  );
}
