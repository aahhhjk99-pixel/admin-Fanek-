import { useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DataTable({
  table, title, columns, select = '*', orderBy = 'created_at', actions, limit = 100, filters, permissionNote,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      if (!supabase) throw new Error('إعدادات Supabase غير موجودة.');
      const build = (ordered) => {
        let q = supabase.from(table).select(select);
        if (ordered) q = q.order(orderBy, { ascending: false, nullsFirst: false });
        q = q.limit(limit);
        return filters ? filters(q) : q;
      };
      let { data, error: err } = await build(true);
      // إذا لم يوجد عمود الترتيب في الجدول نعيد المحاولة بدون ترتيب بدل إظهار خطأ.
      if (err && (err.code === '42703' || /column .* does not exist/i.test(err.message || ''))) {
        ({ data, error: err } = await build(false));
      }
      if (err) throw err;
      setRows(data || []);
    } catch (e) {
      setError(e.message || 'تعذر تحميل البيانات.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const term = search.trim().toLowerCase();
  const visible = term ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(term)) : rows;

  return (
    <section className="panel">
      <div className="panel-toolbar">
        <div>
          <h2>{title}</h2>
          <p>
            {rows.length} سجل{rows.length >= limit ? ` (أحدث ${limit} سجل فقط)` : ''}
          </p>
        </div>
        <div className="toolbar-actions">
          <label className="searchbox">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في النتائج…" />
          </label>
          <button className="btn btn-ghost" onClick={load}>
            <RefreshCw size={15} /> تحديث
          </button>
        </div>
      </div>
      {permissionNote && <div className="notice">{permissionNote}</div>}
      {error && (
        <div className="error-box">
          {error}
          <small> تأكد من صلاحيات حساب الإدارة وسياسات RLS.</small>
        </div>
      )}
      {loading ? (
        <div className="empty">
          <div className="spinner" /> جارٍ التحميل…
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">لا توجد سجلات مطابقة.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                {actions && <th>إجراء</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr key={row.id || row.user_id || i}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(row[c.key], row) : format(row[c.key])}</td>
                  ))}
                  {actions && <td>{actions(row, load)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function format(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
