import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Mail, Settings } from 'lucide-react';

const TABS = [
  { to: '/admin', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/admin/applications', label: 'Applications', Icon: Users },
  { to: '/admin/messages', label: 'Messages', Icon: Mail },
  { to: '/admin/settings', label: 'Settings', Icon: Settings },
];

export default function AdminLayout() {
  return (
    <div className="page page-wide">
      <nav className="subnav" aria-label="Admin sections">
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="subnav-link">
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}