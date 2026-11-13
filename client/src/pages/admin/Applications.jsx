import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import api from '../../api';
import { STATUS_LABELS, statusClass, formatDate } from '../../constants';

export default function Applications() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/applications', { params: { status, q } });
      setRows(data);
      setError('');
    } catch {
      setError('Could not load applications.');
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const search = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Admin</span>
        <h1>Applications</h1>
        <p className="note">Oldest submissions are listed first.</p>
      </div>

      <div className="toolbar">
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setParams(e.target.value === 'all' ? {} : { status: e.target.value })}
        >
          <option value="all">All submitted</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <form onSubmit={search}>
          <input
            type="text"
            aria-label="Search by name, student number or reference"
            placeholder="Search name, student no. or reference"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn" type="submit">
            <Search size={16} /> Search
          </button>
        </form>
      </div>

      {error && <div className="msg error" role="alert">{error}</div>}
      {!rows && !error && <p className="center">Loading…</p>}
      {rows && rows.length === 0 && <div className="card">No applications found.</div>}

      {rows && rows.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Documents</th>
                <th>Submitted</th>
                <th><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.full_name}</strong>
                    <div className="note">{r.student_no}</div>
                  </td>
                  <td>{r.reference_no || '—'}</td>
                  <td>
                    <span className={`badge ${statusClass(r.status)}`}>{STATUS_LABELS[r.status]}</span>
                  </td>
                  <td>{r.docs_approved} of {r.docs_uploaded} approved</td>
                  <td>{formatDate(r.submitted_at)}</td>
                  <td>
                    <Link className="btn btn-outline btn-sm" to={`/admin/applications/${r.id}`}>
                      Open <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}