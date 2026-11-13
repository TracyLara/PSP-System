import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <>
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