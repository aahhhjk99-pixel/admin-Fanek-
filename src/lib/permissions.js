export const PERMISSIONS = [
  ['dashboard.read', 'لوحة المؤشرات'],
  ['users.manage', 'إدارة الزبائن والفنيين'],
  ['orders.read', 'عرض الطلبات'],
  ['orders.delete', 'حذف الطلبات'],
  ['finance.read', 'عرض المالية'],
  ['finance.wallet_adjust', 'تعديل أرصدة المحافظ'],
  ['disputes.manage', 'إدارة الشكاوى والنزاعات'],
  ['services.manage', 'إدارة الخدمات'],
  ['staff.manage', 'إدارة الموظفين والصلاحيات'],
  ['settings.manage', 'إعدادات المنصة'],
  ['audit.read', 'سجل التدقيق'],
  ['guarantee.manage', 'ضمان فنّيك'],
  ['levels.manage', 'مستويات الفنيين'],
  ['agents.manage', 'الوكلاء'],
  ['notifications.manage', 'الإشعارات'],
];

export function can(profile, permissions, permission) {
  return (
    profile?.role === 'admin' &&
    (permissions?.is_super_admin === true ||
      (Array.isArray(permissions?.permissions) && permissions.permissions.includes(permission)))
  );
}

// الصفحة تظهر إذا كان لدى الموظف واحدة على الأقل من الصلاحيات المذكورة. القائمة الفارغة = مفتوحة لكل موظف إدارة.
// ملاحظة: هذا تحسين لتجربة الاستخدام فقط. الحماية الحقيقية في سياسات RLS ودوال قاعدة البيانات.
export const ROUTE_PERMISSIONS = {
  '/': [],
  '/account': [],
  '/customers': ['users.manage'],
  '/technicians': ['users.manage'],
  '/disputes': ['disputes.manage', 'guarantee.manage'],
  '/finance': ['finance.read', 'finance.wallet_adjust'],
  '/agents': ['agents.manage'],
  '/levels': ['levels.manage'],
  '/services': ['services.manage'],
  '/notifications': ['notifications.manage'],
  '/staff': ['staff.manage'],
  '/audit': ['audit.read'],
  '/settings': ['settings.manage'],
  '/support': ['orders.read'],
};

export function canAccess(profile, permissions, path) {
  if (profile?.role !== 'admin') return false;
  const need = ROUTE_PERMISSIONS[path];
  if (!need || need.length === 0) return true;
  return need.some((p) => can(profile, permissions, p));
}
