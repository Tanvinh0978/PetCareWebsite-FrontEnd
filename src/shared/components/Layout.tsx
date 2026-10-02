import { Link, NavLink, Outlet } from 'react-router-dom';
import { featureNav } from '../../features';

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">PetCare</Link>
        <nav>
          <NavLink to="/" end>Trang chủ</NavLink>
          {featureNav.map((n) => (
            <NavLink key={n.to} to={n.to}>{n.label}</NavLink>
          ))}
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">PetCare Booking. Đặt lịch spa, lưu trú và chăm sóc cho thú cưng.</footer>
    </>
  );
}
