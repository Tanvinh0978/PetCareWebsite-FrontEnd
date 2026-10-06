import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { deleteService, searchServices } from '@/api/serviceApi';
import { getErrorMessage } from '@/api/client';
import { SERVICE_TYPE_LABEL, type PagedResult, type ServiceListItem, type ServiceType } from '@/types/service';

export default function ServiceListPage() {
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

  // Generate visible page numbers
  const totalPages = data?.totalPages ?? 1;
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    for (let p = startPage; p <= endPage; p++) {
      pages.push(p);
    }
    return pages;
  };

  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <h1>Services Management</h1>
          <p className="page-subtitle">View, search, and manage pet care services in table format.</p>
        </div>
        <Link to="/admin/services/new" className="btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add service
        </Link>
      </div>

      {/* Filter and Search Panel */}
      <div className="admin-toolbar-panel">
        <div className="admin-toolbar-row">
          <form className="search-wrapper" onSubmit={onSearch}>
            <span className="search-icon-prefix" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search services by name or description..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search services"
            />
            {keywordInput && (
              <button type="button" className="search-clear-btn" onClick={clearSearch} title="Clear search">
                ✕
              </button>
            )}
          </form>

          <div className="filter-dropdowns">
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as typeof status);
              }}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              aria-label="Items per page"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            {hasActiveFilters && (
              <button type="button" className="chip" onClick={resetAllFilters} title="Reset all filters">
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Type Category Chips */}
        <div className="type-chips-row">
          <span className="type-chips-label">Category:</span>
          <button
            type="button"
            className={!type ? 'chip on' : 'chip'}
            onClick={() => pickType(null)}
          >
            All
          </button>
          {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={type === t ? 'chip on' : 'chip'}
              onClick={() => pickType(t)}
            >
              {SERVICE_TYPE_LABEL[t]}
            </button>
          ))}
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ margin: 0, color: '#557268' }}>Loading services...</p>
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
                          : 'No services exist in the system yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn" onClick={resetAllFilters}>
                          Clear filters
                        </button>
                      ) : (
                        <Link to="/admin/services/new" className="btn">
                          + Add first service
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((s, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={s.id} className={s.isActive ? '' : 'row-inactive'}>
                      <td className="col-idx">{rowNumber}</td>
                      <td className="col-name">
                        <Link to={`/admin/services/${s.id}`} title="View details">
                          {s.name}
                        </Link>
                      </td>
                      <td className="col-type">
                        <span className={`type-badge type-${s.serviceType}`}>
                          {SERVICE_TYPE_LABEL[s.serviceType]}
                        </span>
                      </td>
                      <td className="col-desc" title={s.description || 'No description'}>
                        <div className="desc-clamp">
                          {s.description || <span style={{ color: '#9fb5ac' }}>—</span>}
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
                          <Link
                            to={`/admin/services/${s.id}`}
                            className="btn-action view"
                            title="View service details"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View
                          </Link>
                          <Link
                            to={`/admin/services/${s.id}/edit`}
                            className="btn-action edit"
                            title="Edit service & pricing"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </Link>
                          {s.isActive && (
                            <button
                              type="button"
                              className="btn-action danger"
                              onClick={() => setServiceToDeactivate(s)}
                              title="Deactivate service"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                              </svg>
                              Deactivate
                            </button>
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
          <div className="table-footer">
            <div>
              Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of <strong>{totalCount}</strong> services
            </div>
            {totalPages > 1 && (
              <div className="table-pagination-nav">
                <button
                  type="button"
                  className="page-btn"
                  disabled={!data.hasPreviousPage}
                  onClick={() => setPage(page - 1)}
                  title="Previous page"
                >
                  ‹
                </button>
                {getPageNumbers().map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="page-btn"
                  disabled={!data.hasNextPage}
                  onClick={() => setPage(page + 1)}
                  title="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deactivating */}
      {serviceToDeactivate && (
        <div className="modal-overlay" onClick={() => !deactivating && setServiceToDeactivate(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>Deactivate Service</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setServiceToDeactivate(null)}
                disabled={deactivating}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to deactivate <strong>"{serviceToDeactivate.name}"</strong>?
              </p>
              <p style={{ margin: 0, color: '#688279', fontSize: '0.9rem' }}>
                This service will be marked as inactive and hidden from customer booking. You can reactivate it anytime by editing the service.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="chip"
                onClick={() => setServiceToDeactivate(null)}
                disabled={deactivating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-action danger"
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.95rem' }}
                onClick={handleConfirmDeactivate}
                disabled={deactivating}
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
