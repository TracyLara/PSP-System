import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import api from '../api';

// Replace these placeholders with the real contact details
const INFO = [
  { Icon: Mail, label: 'Email', value: 'tracylara06@gmail.com (sample email)' },
  { Icon: Phone, label: 'Phone', value: '09762459671 (sample number' },
  { Icon: MapPin, label: 'Office', value: 'Bacoor City Hall, Floor #2' },
  { Icon: Clock, label: 'Office hours', value: 'Monday to Friday, 8:00 AM to 5:00 PM' },
];

const EMPTY = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      await api.post('/contact', form);
      setMsg({ type: 'success', text: 'Thank you! Your message has been sent.' });
      setForm(EMPTY);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Cannot reach the server' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">We're here to help</span>
        <h1>Contact Us</h1>
        <p className="note">Questions about the requirements or your application? Send us a message.</p>
      </div>

      <div className="contact-grid">
        <div className="card">
          {INFO.map(({ Icon, label, value }) => (
            <div className="info-item" key={label}>
              <div className="info-icon"><Icon size={20} /></div>
              <div>
                <strong>{label}</strong>
                <p className="note">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card form-card">
          <div aria-live="polite">
            {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
          </div>
          <form onSubmit={handleSubmit}>
            <label className="field">
              Your name
              <input type="text" name="name" autoComplete="name" value={form.name} onChange={handleChange} maxLength={100} required />
            </label>
            <label className="field">
              Email
              <input type="email" name="email" autoComplete="email" value={form.email} onChange={handleChange} maxLength={100} required />
            </label>
            <label className="field">
              Subject
              <input type="text" name="subject" value={form.subject} onChange={handleChange} maxLength={150} required />
            </label>
            <label className="field">
              Message
              <textarea name="message" value={form.message} onChange={handleChange} maxLength={2000} required />
            </label>
            <button className="btn btn-block" type="submit" disabled={busy}>
              <Send size={18} /> {busy ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}