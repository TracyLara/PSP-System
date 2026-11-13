import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Check, X, ClipboardCheck } from 'lucide-react';
import api from '../../api';
import DocBadge from '../../components/DocBadge';
import { STATUS_LABELS, statusClass, formatDate } from '../../constants';

const DOC_LABELS = {
  letter: "Applicant's Personal Letter",
  cor: 'Certificate of Registration (COR)',
  cog: 'Certificate of Grades / G12 Report Card',
  barangay: 'Barangay Clearance / Certificate of Indigency',
  id_signature: 'ID Photocopy with Signature',
};
const DOC_ORDER = Object.keys(DOC_LABELS);

const NEXT_ACTIONS = {
  complete: [{ status: 'form_released', label: 'Release application form' }],
  form_released: [{ status: 'submitted_to_governor', label: "Mark as submitted to Governor's Office" }],
  submitted_to_governor: [
    { status: 'approved', label: 'Mark as approved' },
    { status: 'denied', label: 'Mark as denied', danger: true },
  ],
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(null); // id of the document being rejected
  const [remark, setRemark] = useState('');

  const load = async () => {
    try {
      const res = await api.get(`/admin/applications/${id}`);
      setData(res.data);
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.status === 404 ? 'Application not found.' : 'Could not load this application.',
      });
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // runs an action, then reloads the page data
  const run = async (fn, successText) => {
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      await fn();
      await load();
      if (successText) setMsg({ type: 'success', text: successText });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  const view = async (docId) => {
    try {
      const res = await api.get(`/documents/${docId}/file`, { responseType: 'blob' });
      window.open(URL.createObjectURL(res.data), '_blank');
    } catch {
      setMsg({ type: 'error', text: 'Could not open the file.' });
    }
  };

  const review = (docId, status, text = '') =>
    run(async () => {
      await api.patch(`/admin/documents/${docId}`, { status, remark: text });
      setRejecting(null);
      setRemark('');
    });

  const finalize = () => {
    if (!window.confirm('Finish the review? The student will see the result right away.')) return;
    run(() => api.post(`/admin/applications/${id}/finalize`), 'Review finished.');
  };

  const changeStatus = (status, label) => {
    if (!window.confirm(`${label}?`)) return;
    run(() => api.post(`/admin/applications/${id}/status`, { status }), 'Status updated.');
  };

  if (!data) {
    return (
      <>
        <Link to="/admin/applications" className="btn btn-outline btn-sm">
          <ArrowLeft size={14} /> Back
        </Link>
        {msg.text ? (
          <div className="msg error" style={{ marginTop: 14 }}>{msg.text}</div>
        ) : (
          <p className="center">Loading…</p>
        )}
      </>
    );
  }

  const { application, documents } = data;
  const reviewable = application.status === 'pending_review';
  const pendingCount = documents.filter((d) => d.status === 'pending').length;
  const rejectedCount = documents.filter((d) => d.status === 'rejected').length;
  const actions = NEXT_ACTIONS[application.status];

  return (
    <>
      <Link to="/admin/applications" className="btn btn-outline btn-sm">
        <ArrowLeft size={14} /> Back to applications
      </Link>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontSize: 26 }}>{application.full_name}</h1>
          <span className={`badge ${statusClass(application.status)}`}>
            {STATUS_LABELS[application.status]}
          </span>
        </div>
        <div className="detail-grid">
          <div><span>Student number</span>{application.student_no}</div>
          <div><span>Email</span>{application.email}</div>
          <div><span>Reference</span>{application.reference_no || '—'}</div>
          <div><span>Submitted</span>{formatDate(application.submitted_at)}</div>
        </div>
      </div>

      <div aria-live="polite">
        {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
      </div>

      {application.status === 'needs_correction' && (
        <div className="msg error">
          Waiting for the student to replace the rejected documents and submit again.
        </div>
      )}

      <h2 style={{ marginTop: 22 }}>Documents</h2>
      {DOC_ORDER.map((type) => {
        const doc = documents.find((d) => d.type === type);
        return (
          <div className="card" key={type}>
            <div className="row">
              <div style={{ flex: 1, minWidth: 200 }}>
                <strong>{DOC_LABELS[type]}</strong>
                {doc?.status === 'rejected' && doc.admin_remark && (
                  <p className="remark">Remark: {doc.admin_remark}</p>
                )}
              </div>
              <div className="req-actions">
                <DocBadge status={doc?.status} />
                {doc && (
                  <button className="btn btn-outline btn-sm" onClick={() => view(doc.id)}>
                    <Eye size={15} /> View
                  </button>
                )}
                {doc && reviewable && (
                  <>
                    <button
                      className="btn btn-sm"
                      disabled={busy || doc.status === 'approved'}
                      onClick={() => review(doc.id, 'approved')}
                    >
                      <Check size={15} /> Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={busy}
                      onClick={() => {
                        setRejecting(doc.id);
                        setRemark(doc.admin_remark || '');
                      }}
                    >
                      <X size={15} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            {doc && rejecting === doc.id && (
              <div className="review-box">
                <label className="field" style={{ marginBottom: 10 }}>
                  Remark for the student (required)
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    maxLength={255}
                    placeholder="e.g. Dry seal is missing on the barangay clearance"
                  />
                </label>
                <div className="req-actions">
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={busy || !remark.trim()}
                    onClick={() => review(doc.id, 'rejected', remark)}
                  >
                    Save rejection
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setRejecting(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {reviewable && (
        <div className="card">
          <div className="row">
            <div>
              <strong>Finish review</strong>
              <p className="note">
                {pendingCount > 0
                  ? `${pendingCount} document(s) still need a decision.`
                  : rejectedCount > 0
                  ? 'The student will be asked to replace the rejected documents.'
                  : 'All documents are approved. The application will be marked Complete.'}
              </p>
            </div>
            <button
              className="btn"
              disabled={busy || pendingCount > 0 || documents.length < DOC_ORDER.length}
              onClick={finalize}
            >
              <ClipboardCheck size={16} />
              {rejectedCount > 0 ? 'Send back for correction' : 'Mark as complete'}
            </button>
          </div>
        </div>
      )}

      {actions && (
        <div className="card">
          <strong>Next step</strong>
          <div className="req-actions" style={{ marginTop: 10 }}>
            {actions.map((a) => (
              <button
                key={a.status}
                className={`btn ${a.danger ? 'btn-danger' : ''}`}
                disabled={busy}
                onClick={() => changeStatus(a.status, a.label)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}