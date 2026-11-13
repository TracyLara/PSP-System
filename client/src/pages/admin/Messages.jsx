import { useEffect, useState } from 'react';
import { Mail, MailOpen, Reply } from 'lucide-react';
import api from '../../api';
import { formatDateTime } from '../../constants';

export default function Messages() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/messages');
      setRows(data);
    } catch {
      setError('Could not load messages.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (m) => {
    try {
      await api.patch(`/admin/messages/${m.id}`, { is_read: !m.is_read });
      load();
    } catch {
      setError('Could not update the message.');
    }
  };

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Admin</span>
        <h1>Messages</h1>
        <p className="note">Sent from the Contact Us page. Latest first.</p>
      </div>

      {error && <div className="msg error" role="alert">{error}</div>}
      {!rows && !error && <p className="center">Loading…</p>}
      {rows && rows.length === 0 && <div className="card">No messages yet.</div>}

      {rows &&
        rows.map((m) => (
          <div className="card" key={m.id}>
            <div className="row">
              <strong>{m.subject}</strong>
              {!m.is_read && <span className="badge pending">New</span>}
            </div>
            <p className="note">
              {m.name} · {m.email} · {formatDateTime(m.created_at)}
            </p>
            <p className="msg-body">{m.message}</p>
            <div className="req-actions" style={{ marginTop: 12 }}>
              <a
                className="btn btn-sm"
                href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`}
              >
                <Reply size={15} /> Reply
              </a>
              <button className="btn btn-outline btn-sm" onClick={() => toggle(m)}>
                {m.is_read ? <Mail size={15} /> : <MailOpen size={15} />}
                {m.is_read ? 'Mark as unread' : 'Mark as read'}
              </button>
            </div>
          </div>
        ))}
    </>
  );
}