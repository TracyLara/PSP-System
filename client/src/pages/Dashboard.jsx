import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, ClipboardCheck, GraduationCap, Landmark, ShieldCheck,
  Upload, Eye, RefreshCw, Send, Check,
  CircleCheck, CircleX, Clock, CircleDashed,
} from 'lucide-react';
import api from '../api';

const REQUIREMENTS = [
  {
    type: 'letter',
    Icon: FileText,
    title: "1. Applicant's Personal Letter",
    note: 'Addressed to Gov. Francisco Gabriel "Abeng" Remulla. Handwritten (scanned) or typed, as one PDF.',
  },
  {
    type: 'cor',
    Icon: ClipboardCheck,
    title: '2. Certificate of Registration (COR)',
    note: 'Current semester (1st sem AY 2026-2027), officially issued by CvSU.',
  },
  {
    type: 'cog',
    Icon: GraduationCap,
    title: '3. Certificate of Grades (COG) / G12 Report Card',
    note: 'Old students: COG from the Bacoor City Campus Registrar (purpose: Educational Assistance or Scholarship, dry seal). Freshmen: G12 Report Card.',
  },
  {
    type: 'barangay',
    Icon: Landmark,
    title: '4. Barangay Clearance or Certificate of Indigency',
    note: 'Purpose: "Educational Assistance" or "Scholarship". Signed by the Punong Barangay, with dry seal.',
  },
  {
    type: 'id_signature',
    Icon: ShieldCheck,
    title: '5. ID Photocopy with Signature',
    note: 'School ID or valid government ID, plus three (3) specimen signatures, all in one PDF.',
  },
];

const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  needs_correction: 'Needs Correction',
  complete: 'Complete',
  form_released: 'Form Released',
  submitted_to_governor: "Submitted to Governor's Office",
  approved: 'Approved',
  denied: 'Denied',
};

const STATUS_HINT = {
  draft: 'Upload all 5 requirements, then submit your application.',
  pending_review: 'Your documents are being reviewed. The result will appear here.',
  needs_correction:
    'Some documents need to be replaced. Check the remarks below, upload new PDFs, then submit again.',
  complete: 'All your documents are approved. Your application form will be released soon.',
  form_released: 'Your application form has been released.',
  submitted_to_governor: "Your application was submitted to the Governor's Office.",
  approved: 'Congratulations! Your scholarship was approved.',
  denied: 'Your application was not approved this time.',
};

const STEPS = ['Upload', 'Review', 'Form', 'Governor', 'Result'];
const STEP_OF = {
  draft: 0,
  needs_correction: 0,
  pending_review: 1,
  complete: 2,
  form_released: 2,
  submitted_to_governor: 3,
  approved: 4,
  denied: 4,
};

function Stepper({ status }) {
  const current = STEP_OF[status] ?? 0;
  const finished = status === 'approved';
  return (
    <ol className="stepper" aria-label="Application progress">
      {STEPS.map((label, i) => {
        const state = finished || i < current ? 'done' : i === current ? 'current' : '';
        return (
          <li
            key={label}
            className={`step ${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="dot">{state === 'done' ? <Check size={16} /> : i + 1}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function DocBadge({ status }) {
  const map = {
    approved: { Icon: CircleCheck, label: 'Approved' },
    rejected: { Icon: CircleX, label: 'Rejected' },
    pending: { Icon: Clock, label: 'Pending review' },
  };
  const item = map[status];
  if (!item) {
    return (
      <span className="badge">
        <CircleDashed size={14} /> Not uploaded
      </span>
    );
  }
  const { Icon, label } = item;
  return (
    <span className={`badge ${status}`}>
      <Icon size={14} /> {label}
    </span>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    nav('/login');
  };

  const load = async () => {
    try {
      const res = await api.get('/application/me');
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 401) logout();
      else setMsg({ type: 'error', text: 'Could not load your application.' });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (type, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      return setMsg({ type: 'error', text: 'Only PDF files are allowed.' });
    }
    if (file.size > 5 * 1024 * 1024) {
      return setMsg({ type: 'error', text: 'File is too large (max 5 MB).' });
    }
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(`/documents/${type}`, form);
      await load();
      setMsg({ type: 'success', text: 'File uploaded.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Upload failed.' });
    } finally {
      setBusy(false);
    }
  };

  const view = async (id) => {
    try {
      const res = await api.get(`/documents/${id}/file`, { responseType: 'blob' });
      window.open(URL.createObjectURL(res.data), '_blank');
    } catch {
      setMsg({ type: 'error', text: 'Could not open the file.' });
    }
  };

  const submitApplication = async () => {
    if (!window.confirm('Submit your application? You cannot change files while it is under review.')) return;
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await api.post('/application/submit');
      await load();
      setMsg({ type: 'success', text: `Submitted! Your reference number is ${res.data.reference_no}.` });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submit failed.' });
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <p className="center">Loading…</p>;

  const { application, documents, period } = data;
  const docOf = (type) => documents.find((d) => d.type === type);
  const editable = ['draft', 'needs_correction'].includes(application.status) && period.is_open;
  const uploadedCount = REQUIREMENTS.filter((r) => docOf(r.type)).length;
  const allUploaded = uploadedCount === REQUIREMENTS.length;
  const hasRejected = documents.some((d) => d.status === 'rejected');
  const canSubmit = editable && allUploaded && !hasRejected;

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">AY 2026-2027</span>
        <h1>Hello, {user.full_name}</h1>
        <p className="note">
          Application period: {period.application_start} to {period.application_end}
        </p>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 18 }}>
          <div>
            <strong>Status: </strong>
            <span className="badge">{STATUS_LABELS[application.status]}</span>
          </div>
          {application.reference_no && (
            <span className="note">Ref. no. {application.reference_no}</span>
          )}
        </div>
        <Stepper status={application.status} />
        <p className="note" style={{ marginTop: 14 }}>{STATUS_HINT[application.status]}</p>
      </div>

      <div className="card">
        <div className="row">
          <strong>Documents uploaded</strong>
          <span className="note">{uploadedCount} of {REQUIREMENTS.length}</span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label="Documents uploaded"
          aria-valuemin={0}
          aria-valuemax={REQUIREMENTS.length}
          aria-valuenow={uploadedCount}
        >
          <span style={{ width: `${(uploadedCount / REQUIREMENTS.length) * 100}%` }} />
        </div>
      </div>

      <div aria-live="polite">
        {!period.is_open && (
          <div className="msg error">The application period is currently closed.</div>
        )}
        {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
      </div>

      <h2 style={{ marginTop: 22 }}>Requirements</h2>
      {REQUIREMENTS.map(({ type, Icon, title, note }) => {
        const doc = docOf(type);
        const locked = !editable || doc?.status === 'approved';
        return (
          <div className="card" key={type}>
            <div className="req">
              <span className="req-icon"><Icon size={22} /></span>
              <div className="req-body">
                <h3>{title}</h3>
                <p className="note">{note}</p>
                {doc?.status === 'rejected' && doc.admin_remark && (
                  <p className="remark">Admin remark: {doc.admin_remark}</p>
                )}
              </div>
              <div className="req-actions">
                <DocBadge status={doc?.status} />
                {doc && (
                  <button className="btn btn-outline" onClick={() => view(doc.id)}>
                    <Eye size={16} /> View
                  </button>
                )}
                {!locked && (
                  <label className="btn">
                    {doc ? <RefreshCw size={16} /> : <Upload size={16} />}
                    {doc ? 'Replace' : 'Upload'}
                    <input
                      className="file-input"
                      type="file"
                      accept="application/pdf"
                      disabled={busy}
                      onChange={(e) => {
                        upload(type, e.target.files[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {editable && (
        <button className="btn btn-block" disabled={!canSubmit || busy} onClick={submitApplication}>
          <Send size={18} /> Submit application
        </button>
      )}
    </div>
  );
}