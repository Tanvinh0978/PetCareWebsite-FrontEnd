import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchServices } from '@/api/serviceApi';
import { getErrorMessage } from '@/api/client';
import { SERVICE_TYPE_LABEL, type ServiceListItem } from '@/types/service';

export default function DashboardPage() {
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // Fetch overview of services
    searchServices({ pageNumber: 1, pageSize: 100 })
      .then((res) => {
        if (!cancelled) {
          const items = res.items;
          setServices(items.slice(0, 5)); // Show 5 most recent
          setTotalCount(res.totalCount);
          setActiveCount(items.filter((s) => s.isActive).length);
          setInactiveCount(items.filter((s) => !s.isActive).length);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(getErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="page-subtitle">Overview of services, activities, and quick management links.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/admin/services/new" className="btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add service
          </Link>
          <Link to="/admin/services" className="btn btn-secondary">
            Manage services →
          </Link>
        </div>
      </div>

      {error && <p className="msg error" role="alert">{error}</p>}

      {/* Metrics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Total Services</span>
            <span style={{ fontSize: '1.25rem' }}>📦</span>
          </div>
          <span className="stat-val">{loading ? '...' : totalCount}</span>
        </div>
        <div className="stat-card accent-active">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Active Services</span>
            <span style={{ fontSize: '1.25rem' }}>🟢</span>
          </div>
          <span className="stat-val" style={{ color: 'var(--primary)' }}>
            {loading ? '...' : activeCount}
          </span>
        </div>
        <div className="stat-card accent-inactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Inactive Services</span>
            <span style={{ fontSize: '1.25rem' }}>⚪</span>
          </div>
          <span className="stat-val" style={{ color: 'var(--danger)' }}>
            {loading ? '...' : inactiveCount}
          </span>
        </div>
        <div className="stat-card accent-types">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Service Categories</span>
            <span style={{ fontSize: '1.25rem' }}>🏷️</span>
          </div>
          <span className="stat-val" style={{ color: '#2563eb' }}>
            {Object.keys(SERVICE_TYPE_LABEL).length}
          </span>
        </div>
      </div>

      {/* Recent Services Table */}
      <div style={{ marginTop: '2.5rem' }}>
        <div className="page-head" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Recent Services Overview</h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--slate-500)', fontSize: '0.9rem' }}>Latest active and inactive service offerings</p>
          </div>
          <Link to="/admin/services" className="link" style={{ fontWeight: 700 }}>
            View all services ({totalCount}) →
          </Link>
        </div>

        <div className="table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="col-idx">#</th>
                  <th className="col-name">Service Name</th>
                  <th className="col-type">Category</th>
                  <th className="col-desc">Description</th>
                  <th className="col-status">Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                      <p style={{ margin: 0, color: 'var(--slate-500)' }}>Loading services overview...</p>
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="table-empty-box">
                        <h3>No services found</h3>
                        <p>Get started by creating your first service.</p>
                        <Link to="/admin/services/new" className="btn">
                          + Add service
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  services.map((s, idx) => (
                    <tr key={s.id} className={s.isActive ? '' : 'row-inactive'}>
                      <td className="col-idx">{idx + 1}</td>
                      <td className="col-name">
                        <Link to={`/admin/services/${s.id}`}>{s.name}</Link>
                      </td>
                      <td className="col-type">
                        <span className={`type-badge type-${s.serviceType}`}>
                          {SERVICE_TYPE_LABEL[s.serviceType]}
                        </span>
                      </td>
                      <td className="col-desc" title={s.description || 'No description'}>
                        <div className="desc-clamp">
                          {s.description || <span style={{ color: '#94a3b8' }}>—</span>}
                        </div>
                      </td>
                      <td className="col-status">
                        <span className={`status-pill ${s.isActive ? 'active' : 'inactive'}`}>
                          <span className="status-dot"></span>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <Link to={`/admin/services/${s.id}`} className="btn-action view">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View
                          </Link>
                          <Link to={`/admin/services/${s.id}/edit`} className="btn-action edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
