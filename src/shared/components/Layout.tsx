import { Link, NavLink, Outlet } from 'react-router-dom';
import { featureNav } from '../../features';

export default function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand">PetCare</Link>
        <nav aria-label="Main menu">
          <NavLink to="/" end>Overview</NavLink>
          {featureNav.map((n) => (
            <NavLink key={n.to} to={n.to}>{n.label}</NavLink>
          ))}
        </nav>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}
