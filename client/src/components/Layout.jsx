import { Outlet } from 'react-router-dom';
import { Info } from 'lucide-react';
import Navbar from './Navbar';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export default function Layout() {
  return (
    <>
      {DEMO && (
        <div className="demo-banner" role="note">
          <Info size={16} />
          <span>
            Portfolio demo: please use fake information only. Data and uploaded files may be
            reset at any time, and the first load can take up to a minute.
          </span>
        </div>
      )}
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        © 2026 PSP Portal · Provincial Scholarship Program, CvSU
      </footer>
    </>
  );
}