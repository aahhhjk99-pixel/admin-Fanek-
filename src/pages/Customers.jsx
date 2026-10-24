import DataTable from '../components/DataTable.jsx';
import AccountStatusButton from '../components/AccountStatusButton.jsx';

export default function Customers() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">الحسابات</span>
          <h2>الزبائن</h2>
          <p>عرض حسابات الزبائن المسجلة وإيقاف أو تفعيل الحساب مع تسجيل السبب.</p>
        </div>
      </div>
      <DataTable
        table="profiles"
        title="قائمة الزبائن"
        select="id,full_name,phone,account_status,created_at"
        columns={[
          { key: 'full_name', label: 'الاسم' },
          { key: 'phone', label: 'رقم الهاتف' },
          { key: 'account_status', label: 'الحالة' },
          { key: 'created_at', label: 'تاريخ التسجيل' },
        ]}
        filters={(q) => q.eq('role', 'customer')}
        actions={(row, reload) => <AccountStatusButton row={row} onDone={reload} />}
      />
    </>
  );
}
