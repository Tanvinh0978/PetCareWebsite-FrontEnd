
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_BASE, ROLE_LABEL, type Role } from "@/auth/roles";
import { NAV } from "@/routes/nav";

export default function Layout({ role }: { role: Role }) {
  const { signOut } = useAuth();
  const base = ROLE_BASE[role];
  const isAdminOrStaff = role === "admin" || role === "staff";

  // Admin & Staff: Left Sidebar navigation layout
  if (isAdminOrStaff) {
    return (
      <div className="shell">
        <aside className="sidebar">
          <Link to={base || "/"} className="brand">
            <span>🐾</span> PetCare <span style={{ fontSize: '0.75rem', background: '#334155', color: '#94a3b8', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>{role}</span>
          </Link>
          <nav aria-label="Admin and Staff menu">
            <NavLink to={base || "/"} end>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
              <span>Dashboard</span>
            </NavLink>
            {NAV[role].map((n) => (
              <NavLink key={n.to} to={base + "/" + n.to}>
                {n.to === 'customers' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                ) : n.to === 'room-types' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                )}
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#334155', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {role[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>Logged User</p>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{ROLE_LABEL[role]} Role</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-action danger"
              style={{ width: '100%', justifyContent: 'center', padding: '0.45rem', fontSize: '0.85rem' }}
              onClick={signOut}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign out
            </button>
          </div>
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  // Customer & Guest: Top Header navigation bar layout with Footer
  return (
    <div className="customer-shell">
      <header className="customer-header">
        <div className="customer-header-inner">
          <Link to={base || "/"} className="brand-logo">
            🐾 <span>PetCare</span>
          </Link>

          <nav className="customer-nav" aria-label="Customer main menu">
            <NavLink to={base || "/"} end>
              Home
            </NavLink>
            <NavLink to={(base ? base : "") + "/services"}>
              Services
            </NavLink>
            {NAV[role]
              .filter((n) => n.to !== "services")
              .map((n) => (
                <NavLink key={n.to} to={(base ? base : "") + "/" + n.to}>
                  {n.label}
                </NavLink>
              ))}
          </nav>

          <div className="customer-header-actions">
            {role === "guest" ? (
              <Link to="/login" className="btn btn-sm">
                Sign in
              </Link>
            ) : (
              <div className="customer-auth-status">
                <span className="customer-role-badge">👤 Customer</span>
                <button
                  type="button"
                  className="btn-action danger"
                  style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
                  onClick={signOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="customer-main">
        <Outlet />
      </main>

      <footer className="customer-footer">
        <div className="customer-footer-inner">
          <div className="footer-col">
            <div className="footer-brand">🐾 PetCare</div>
            <p>
              Your trusted partner in professional pet grooming, 24/7 supervised boarding, personalized nutritional diets, and dedicated veterinary wellness.
            </p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <Link to={base || "/"}>Home</Link>
              </li>
              <li>
                <Link to={(base ? base : "") + "/services"}>Services Catalog</Link>
              </li>
              {role === "guest" && (
                <li>
                  <Link to="/login">Sign in</Link>
                </li>
              )}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Opening Hours</h4>
            <p>Mon - Fri: 7:30 AM - 8:00 PM</p>
            <p>Sat - Sun: 8:00 AM - 9:00 PM</p>
            <p>Emergency Boarding: 24/7 on call</p>
          </div>
          <div className="footer-col">
            <h4>Contact Info</h4>
            <p>📍 123 Pet Paradise Way, Suite 100</p>
            <p>📞 Hotline: (028) 3939-PETS</p>
            <p>✉️ hello@petcare.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PetCare Center. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
