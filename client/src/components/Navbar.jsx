import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, LogOut } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const nav = useNavigate();
  useLocation(); // re-renders the navbar on every page change so login state stays fresh

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const home = !token ? '/login' : user.role === 'admin' ? '/admin' : '/dashboard';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    nav('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to={home} className="brand">
          <Logo />
        </Link>

        <nav className="nav-links" aria-label="Main">
          {token && (
            <NavLink to={home}>{user.role === 'admin' ? 'Admin' : 'My Application'}</NavLink>
          )}
          <NavLink to="/contact">Contact</NavLink>
          <ThemeToggle />
          {token ? (
            <button className="btn btn-outline" onClick={logout}>
              <LogOut size={16} /> Log out
            </button>
          ) : (
            <NavLink to="/login">
              <LogIn size={16} /> Log in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}