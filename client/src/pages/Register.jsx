import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import api from '../api';
import AuthShell from '../components/AuthShell';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ student_no: '', full_name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot reach the server');
    }
  };

  return (
    <AuthShell>
      <div className="card auth-card">
        <h2>Create your account</h2>
        <p className="note" style={{ marginBottom: 16 }}>One account per student.</p>
        {error && <div className="msg error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="field">
            Student number
            <input type="text" name="student_no" value={form.student_no} onChange={handleChange} required />
          </label>
          <label className="field">
            Full name
            <input type="text" name="full_name" autoComplete="name" value={form.full_name} onChange={handleChange} required />
          </label>
          <label className="field">
            Email
            <input type="email" name="email" autoComplete="email" value={form.email} onChange={handleChange} required />
          </label>
          <label className="field">
            Password (8+ characters)
            <input type="password" name="password" autoComplete="new-password" value={form.password} onChange={handleChange} required />
          </label>
          <button className="btn btn-block" type="submit">
            <UserPlus size={18} /> Create account
          </button>
        </form>
        <p className="note" style={{ marginTop: 14 }}>
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </AuthShell>
  );
}