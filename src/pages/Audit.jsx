
import DataTable from '../components/DataTable.jsx';
export default function Audit(){return <><div className="page-heading"><div><span className="eyebrow">الأمان والمراجعة</span><h2>سجل التدقيق</h2><p>سجل العمليات الحساسة والقرارات الإدارية.</p></div></div><DataTable table="audit_logs" title="سجل التدقيق" columns={[{key:'actor_id',label:'المنفذ'},{key:'action'
