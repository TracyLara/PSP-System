import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import api from '../../api';

export default function AdminSettings() {
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/admin/settings')
      .then((res) => setForm(res.data))
      .catch(() => setMsg({ type: 'error', text: 'Could not load settings.' }));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      await api.put('/admin/settings', form);
      setMsg({ type: 'success', text: 'Application period saved.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not save.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Admin</span>
        <h1>Settings</h1>
      </div>

      <div className="card form-card" style={{ maxWidth: 480 }}>
        <h2 style={{ fontSize: 20 }}>Application period</h2>
        <p className="note" style={{ marginBottom: 16 }}>
          Students can upload and submit only between these dates (both days included).
        </p>
        <div aria-live="polite">
          {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
        </div>
        {form && (
          <form onSubmit={save}>
            <label className="field">
              Start date
              <input type="date" name="application_start" value={form.application_start} onChange={handleChange} required />
            </label>
            <label className="field">
              End date
              <input type="date" name="application_end" value={form.application_end} onChange={handleChange} required />
            </label>
            <button className="btn" type="submit" disabled={busy}>
              <Save size={16} /> {busy ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}