
import { Link, NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">PetCare</Link>
        <nav>
          <NavLink to="/" end>Trang chủ</NavLink>
          <NavLink to="/dich-vu">Dịch vụ</NavLink>
          <NavLink to="/quan-ly/dich-vu/moi">Thêm dịch vụ</NavLink>
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">PetCare Booking. Đặt lịch spa, lưu trú và chăm sóc cho thú cưng.</footer>
    </>
  );
}
