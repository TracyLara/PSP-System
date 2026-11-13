import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CircleX, CircleCheck, FileText, Send, BadgeCheck, Ban, Users, Mail,
} from 'lucide-react';
import api from '../../api';

const CARDS = [
  { key: 'pending_review', label: 'Awaiting review', Icon: Clock },
  { key: 'needs_correction', label: 'Needs correction', Icon: CircleX },
  { key: 'complete', label: 'Ready for form', Icon: CircleCheck },
  { key: 'form_released', label: 'Form released', Icon: FileText },
  { key: 'submitted_to_governor', label: "With Governor's Office", Icon: Send },
  { key: 'approved', label: 'Approved', Icon: BadgeCheck },
  { key: 'denied', label: 'Denied', Icon: Ban },
];

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load the overview.'));
  }, []);

  if (error) return <div className="msg error">{error}</div>;
  if (!stats) return <p className="center">Loading…</p>;

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Admin</span>
        <h1>Overview</h1>
        <p className="note">Click a card to see those applications.</p>
      </div>

      <div className="stat-grid">
        {CARDS.map(({ key, label, Icon }) => (
          <Link key={key} to={`/admin/applications?status=${key}`} className="card stat-card">
            <span className="stat-icon"><Icon size={22} /></span>
            <div>
              <div className="stat-number">{stats.byStatus[key] || 0}</div>
              <div className="stat-label">{label}</div>
            </div>
          </Link>
        ))}
        <Link to="/admin/applications" className="card stat-card">
          <span className="stat-icon"><Users size={22} /></span>
          <div>
            <div className="stat-number">{stats.students}</div>
            <div className="stat-label">Registered students</div>
          </div>
        </Link>
        <Link to="/admin/messages" className="card stat-card">
          <span className="stat-icon"><Mail size={22} /></span>
          <div>
            <div className="stat-number">{stats.unreadMessages}</div>
            <div className="stat-label">Unread messages</div>
          </div>
        </Link>
      </div>
    </>
  );
}