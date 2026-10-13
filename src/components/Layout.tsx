import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Dropdown, type MenuProps } from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  HeartOutlined,
  LockOutlined,
  LogoutOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/auth/AuthContext";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_BASE, ROLE_LABEL, type Role } from "@/auth/roles";
import { NAV } from "@/routes/nav";
import { getStaffNavItems, syncUserPermissions } from "@/auth/permissionHelper";

export default function Layout({ role }: { role: Role }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const base = ROLE_BASE[role];
  const isAdminOrStaff = role === "admin" || role === "staff";

  useEffect(() => {
    if (role === "staff") {
      syncUserPermissions();
    }
  }, [role, user?.id]);

  const navItems = role === "staff" ? getStaffNavItems(user) : NAV[role];

  const displayName = user?.name || user?.login || "Customer";

  const handleSignOut = () => {
    signOut();
    useAuthStore.getState().logout();
    try {
      localStorage.removeItem('petcare.customerId');
    } catch {}
    navigate("/login");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      disabled: true,
      label: (
        <div style={{ padding: "4px 0" }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>{displayName}</div>
          {user?.email && <div style={{ fontSize: "12px", color: "#64748b" }}>{user.email}</div>}
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "my-pets",
      icon: <HeartOutlined style={{ color: "#059669" }} />,
      label: "My Pets",
      onClick: () => navigate("/customer/pets"),
    },
    {
      key: "my-bookings",
      icon: <CalendarOutlined style={{ color: "#059669" }} />,
      label: "My Bookings",
      onClick: () => navigate("/customer/bookings"),
    },
    {
      key: "profile",
      icon: <UserOutlined style={{ color: "#059669" }} />,
      label: "My Profile",
      onClick: () => navigate("/customer/profile"),
    },
    { type: "divider" },
    {
      key: "sign-out",
      icon: <LogoutOutlined />,
      danger: true,
      label: "Sign out",
      onClick: handleSignOut,
    },
  ];

  const staffAccountItems: MenuProps["items"] = [
    {
      key: "staff-profile",
      icon: <UserOutlined style={{ color: "#059669" }} />,
      label: "My Profile",
      onClick: () => navigate("/staff/profile"),
    },
  ];

  // Admin & Staff: Left Sidebar navigation layout
  if (isAdminOrStaff) {
    return (
      <div className="shell">
        <aside className="sidebar">
          <Link to={base || "/"} className="brand">
            <span>🐾</span> PetCare <span style={{ fontSize: '0.75rem', background: '#334155', color: '#94a3b8', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>{role === 'staff' && user?.roles?.[0] ? user.roles[0] : role}</span>
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
            {navItems.map((n) => (
              <NavLink key={n.to} to={base + "/" + n.to}>
                {n.to === 'pets' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="15" r="4"></circle>
                    <circle cx="6.5" cy="10.5" r="2.5"></circle>
                    <circle cx="17.5" cy="10.5" r="2.5"></circle>
                    <circle cx="8" cy="5.5" r="2"></circle>
                    <circle cx="16" cy="5.5" r="2"></circle>
                  </svg>
                ) : n.to === 'services' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                ) : n.to === 'vouchers' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                ) : n.to === 'customers' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                ) : n.to === 'staff' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <polyline points="16 11 18 13 22 9"></polyline>
                  </svg>
                ) : n.to === 'roles' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                ) : n.to === 'room-types' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                ) : n.to === 'rooms' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                ) : n.to === 'profile' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                ) : n.to === 'grooming-tasks' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="3"></circle>
                    <circle cx="6" cy="18" r="3"></circle>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                    <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                    <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                  </svg>
                ) : n.to === 'reviews' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
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
            <Dropdown menu={{ items: staffAccountItems }} trigger={["click"]} placement="topRight" disabled={role !== 'staff'}>
            <button
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', width: '100%', padding: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: role === 'staff' ? 'pointer' : 'default' }}
              title={role === 'staff' ? 'Account options' : undefined}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #38bdf8', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#334155', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                  {(user?.name || role)[0].toUpperCase()}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || user?.email || 'Logged User'}
                </p>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {user?.roles?.[0] ? `${user.roles[0]} Role` : `${ROLE_LABEL[role]} Role`}
                </span>
              </div>
              {role === 'staff' && <DownOutlined style={{ color: '#94a3b8', fontSize: 10, marginLeft: 'auto' }} />}
            </button>
            </Dropdown>
            <button
              type="button"
              className="btn-action danger"
              style={{ width: '100%', justifyContent: 'center', padding: '0.45rem', fontSize: '0.85rem' }}
              onClick={handleSignOut}
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/login" className="btn btn-sm" style={{ background: 'transparent', color: '#059669', border: '1px solid #059669' }}>
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-sm">
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="customer-auth-status">
                <Dropdown menu={{ items: userMenuItems }} trigger={['hover', 'click']} placement="bottomRight">
                  <div
                    className="customer-role-badge"
                    style={{
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      userSelect: 'none',
                      transition: 'all 0.2s',
                    }}
                    title="Account options"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <UserOutlined style={{ color: '#059669' }} />
                    )}
                    <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </span>
                    <DownOutlined style={{ fontSize: '10px', color: '#059669' }} />
                  </div>
                </Dropdown>

                <button
                  type="button"
                  className="btn-action danger"
                  style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
                  onClick={handleSignOut}
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
