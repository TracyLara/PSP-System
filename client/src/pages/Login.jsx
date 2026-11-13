import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import api from '../api';
import AuthShell from '../components/AuthShell';

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot reach the server');
    }
  };

  return (
    <AuthShell>
      <div className="card auth-card">
        <h2>Welcome back</h2>
        <p className="note" style={{ marginBottom: 16 }}>Log in to continue your application.</p>
        {error && <div className="msg error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="field">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
          <button className="btn btn-block" type="submit">
            <LogIn size={18} /> Log in
          </button>
        </form>
        <p className="note" style={{ marginTop: 14 }}>
          No account yet? <Link to="/register">Register here</Link>
        </p>
      </div>
    </AuthShell>
  );
}