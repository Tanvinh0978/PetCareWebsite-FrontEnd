import { Link, NavLink, Outlet } from 'react-router-dom';
import { featureNav } from '../../features';
import { useAuth } from '../auth/AuthContext';
import { ROLE_BASE, ROLE_LABEL, type Role } from '../auth/roles';

export default function Layout({ role }: { role: Role }) {
  const { signOut } = useAuth();
  const base = ROLE_BASE[role];
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to={base || '/'} className="brand">PetCare</Link>
        <nav aria-label="Main menu">
          <NavLink to={base || '/'} end>{role === 'admin' ? 'Dashboard' : 'Home'}</NavLink>
          {featureNav(role).map((n) => (
            <NavLink key={n.to} to={base + '/' + n.to}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {role === 'guest' ? (
            <Link to="/login" className="btn">Sign in</Link>
          ) : (
            <>
              <p>Signed in as {ROLE_LABEL[role]}</p>
              <button className="link light" onClick={signOut}>Sign out</button>
            </>
          )}
        </div>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}
