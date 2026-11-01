import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Select, Pagination, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { deleteService, searchServices } from '@/api/serviceApi';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';
import {
  SERVICE_TYPE_LABEL,
  SERVICE_TYPE_BADGE_CONFIG,
  type PagedResult,
  type ServiceListItem,
  type ServiceType,
} from '@/types/service';

export default function ServiceListPage() {
  const location = useLocation();
  const baseServicePath = location.pathname.startsWith('/staff') ? '/staff/services' : '/admin/services';
  const [params, setParams] = useSearchParams();
  const type = params.get('type') as ServiceType | null;
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<PagedResult<ServiceListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Confirmation modal state for deactivating a service
  const [serviceToDeactivate, setServiceToDeactivate] = useState<ServiceListItem | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.SERVICE_MANAGE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchServices({
      keyword: keyword || undefined,
      serviceType: type ?? undefined,
      isActive: status === 'all' ? undefined : status === 'active',
      pageNumber: page,
      pageSize,
    })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError('');
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
  }, [keyword, type, status, page, pageSize, reload]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setKeyword(keywordInput.trim());
  };

  const clearSearch = () => {
    setKeywordInput('');
    setKeyword('');
    setPage(1);
  };

  const pickType = (t: ServiceType | null) => {
    setPage(1);
    setParams(t ? { type: t } : {});
  };

  const resetAllFilters = () => {
    setKeywordInput('');
    setKeyword('');
    setStatus('all');
    pickType(null);
    setPage(1);
  };

  const hasActiveFilters = Boolean(keyword || type || status !== 'all');

  async function handleConfirmDeactivate() {
    if (!serviceToDeactivate) return;
    setDeactivating(true);
    try {
      await deleteService(serviceToDeactivate.id);
      message.success(`Service "${serviceToDeactivate.name}" deactivated.`);
      setServiceToDeactivate(null);
      setReload((n) => n + 1);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setDeactivating(false);
    }
  }

  // Calculate pagination boundaries
  const totalCount = data?.totalCount ?? 0;
  const startEntry = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalCount);

  return (
    <section className="page wide">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.1rem',
              color: '#3d2d23',
              fontWeight: 700,
            }}
          >
            Services Management
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            {canManage
              ? 'View, search, filter, and manage pet care services, categories, and tier rates.'
              : 'Explore sanctuary pet care packages, treatments, and pricing tiers.'}
          </p>
        </div>
        {canManage && (
          <Link
            to={`${baseServicePath}/new`}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.55rem 1.4rem',
              borderRadius: 999,
              backgroundColor: '#3d2d23',
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(61,45,35,0.18)',
              textDecoration: 'none',
            }}
          >
            <PlusOutlined style={{ fontSize: 13 }} />
            <span>Add Service</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="admin-toolbar-panel">
        <div className="admin-toolbar-row">
          <form className="search-wrapper" onSubmit={onSearch}>
            <span className="search-icon-prefix" aria-hidden="true">
              <SearchOutlined style={{ color: '#8c735f' }} />
            </span>
            <input
              type="text"
              placeholder="Search services by name or description..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search services"
            />
            {keywordInput && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={clearSearch}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </form>

          <div className="filter-dropdowns" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Category Dropdown */}
            <Select
              value={type || ''}
              onChange={(val) => pickType(val ? (val as ServiceType) : null)}
              style={{ minWidth: 155, height: 40 }}
              options={[
                { value: '', label: 'All Categories' },
                ...(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => ({
                  value: t,
                  label: SERVICE_TYPE_LABEL[t],
                })),
              ]}
            />

            {/* Status Dropdown */}
            <Select
              value={status}
              onChange={(val) => {
                setPage(1);
                setStatus(val);
              }}
              style={{ minWidth: 140, height: 40 }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active only' },
                { value: 'inactive', label: 'Inactive only' },
              ]}
            />

            {/* Page Size Dropdown */}
            <Select
              value={pageSize}
              onChange={(val) => {
                setPage(1);
                setPageSize(val);
              }}
              style={{ minWidth: 130, height: 40 }}
              options={[
                { value: 10, label: '10 per page' },
                { value: 25, label: '25 per page' },
                { value: 50, label: '50 per page' },
              ]}
            />

            {hasActiveFilters && (
              <button
                type="button"
                className="chip"
                onClick={resetAllFilters}
                title="Reset all filters"
                style={{
                  height: 40,
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 10,
                  border: '1.5px solid #eeddc8',
                  background: '#ffffff',
                  color: '#785839',
                  fontWeight: 600,
                  padding: '0 14px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="msg error" role="alert">{error}</p>}

      {/* Main Data Table */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th style={{ width: 64 }}>PHOTO</th>
                <th className="col-name">SERVICE NAME</th>
                <th className="col-type">CATEGORY</th>
                <th className="col-status">STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <p style={{ margin: 0, color: '#785839', fontWeight: 600 }}>Loading sanctuary services...</p>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty-box">
                      <h3>No matching services found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query or filters to find what you are looking for.'
                          : 'No pet services configured in the system yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn" onClick={resetAllFilters}>
                          Clear filters
                        </button>
                      ) : canManage ? (
                        <Link to={`${baseServicePath}/new`} className="btn">
                          + Add first service
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((s, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1;
                  const badgeConfig = SERVICE_TYPE_BADGE_CONFIG[s.serviceType] || {
                    label: SERVICE_TYPE_LABEL[s.serviceType] || s.serviceType,
                    bg: '#faf6f0',
                    color: '#785839',
                    border: '#eeddc8',
                  };

                  return (
                    <tr key={s.id} className={s.isActive ? '' : 'row-inactive'}>
                      <td className="col-idx">{rowNumber}</td>
                      <td>
                        {s.imageUrl ? (
                          <img
                            src={s.imageUrl}
                            alt={s.name}
                            style={{
                              width: 48,
                              height: 38,
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1.5px solid #eeddc8',
                              display: 'block',
                              backgroundColor: '#faf6f0',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 48,
                              height: 38,
                              borderRadius: '8px',
                              backgroundColor: '#faf6f0',
                              border: '1.5px solid #eeddc8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                            }}
                          >
                            🐾
                          </div>
                        )}
                      </td>
                      <td className="col-name">
                        <Link
                          to={`${baseServicePath}/${s.id}`}
                          title="View service details"
                          style={{
                            color: '#3d2d23',
                            fontWeight: 700,
                            textDecoration: 'none',
                            fontSize: '0.94rem',
                          }}
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td className="col-type">
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: badgeConfig.bg,
                            color: badgeConfig.color,
                            border: `1px solid ${badgeConfig.border}`,
                          }}
                        >
                          {badgeConfig.label}
                        </span>
                      </td>
                      <td className="col-status">
                        {s.isActive ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 12px',
                              borderRadius: 999,
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 12px',
                              borderRadius: 999,
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <Link
                            to={`${baseServicePath}/${s.id}`}
                            className="btn-action view"
                            title="View service details"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: '0.82rem',
                            }}
                          >
                            <EyeOutlined style={{ fontSize: 12 }} />
                            <span>View</span>
                          </Link>
                          {canManage && (
                            <>
                              <Link
                                to={`${baseServicePath}/${s.id}/edit`}
                                className="btn-action edit"
                                title="Edit service & pricing"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  fontSize: '0.82rem',
                                }}
                              >
                                <EditOutlined style={{ fontSize: 12 }} />
                                <span>Edit</span>
                              </Link>
                              {s.isActive && (
                                <button
                                  type="button"
                                  className="btn-action danger"
                                  onClick={() => setServiceToDeactivate(s)}
                                  title="Deactivate service"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: '0.82rem',
                                  }}
                                >
                                  <DeleteOutlined style={{ fontSize: 12 }} />
                                  <span>Deactivate</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        {data && totalCount > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #eeddc8',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <span style={{ fontSize: '0.88rem', color: '#785839', fontWeight: 600 }}>
              Showing {startEntry} to {endEntry} of {totalCount} services
            </span>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={totalCount}
              onChange={(newPage) => setPage(newPage)}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deactivating */}
      {serviceToDeactivate && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div className="confirm-icon danger">⚠️</div>
            <h3>Deactivate Service?</h3>
            <p>
              Are you sure you want to deactivate <strong>"{serviceToDeactivate.name}"</strong>?
              <br />
              This service will be marked as inactive and hidden from customer booking. You can reactivate it anytime by editing the service.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deactivating}
                onClick={() => setServiceToDeactivate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-action danger"
                disabled={deactivating}
                onClick={handleConfirmDeactivate}
                style={{ padding: '0.65rem 1.4rem', color: '#fff' }}
              >
                {deactivating ? 'Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
