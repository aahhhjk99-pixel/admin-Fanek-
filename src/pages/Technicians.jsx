import DataTable from '../components/DataTable.jsx';
import AccountStatusButton from '../components/AccountStatusButton.jsx';

export default function Technicians() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">الشبكة</span>
          <h2>الفنيون</h2>
          <p>حالة الحساب والتوثيق والتخصص والعمولة، مع إيقاف أو تفعيل الحساب.</p>
        </div>
      </div>
      <DataTable
        table="profiles"
        title="قائمة الفنيين"
        select="id,full_name,phone,specialty,verification_status,technician_status,commission_rate,account_status,created_at"
        columns={[
          { key: 'full_name', label: 'الفني' },
          { key: 'phone', label: 'الهاتف' },
          { key: 'specialty', label: 'التخصص' },
          { key: 'verification_status', label: 'التوثيق' },
          { key: 'technician_status', label: 'التوفر' },
          { key: 'commission_rate', label: 'العمولة %' },
          { key: 'account_status', label: 'الحساب' },
        ]}
        filters={(q) => q.eq('role', 'technician')}
        actions={(row, reload) => <AccountStatusButton row={row} onDone={reload} />}
      />
    </>
  );
}
