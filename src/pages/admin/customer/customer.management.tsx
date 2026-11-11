import React, { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Select, Pagination, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { customerService } from '@/services/customer.service';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';
import type { CustomerDTO } from '@/types/customer.types';
import { getApiErrorMessage } from '@/utils/apiError';

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const baseCustomerPath = location.pathname.startsWith('/staff') ? '/staff/customers' : '/admin/customers';

  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reload, setReload] = useState(0);

  const [data, setData] = useState<IPagedResult<CustomerDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [customerToToggle, setCustomerToToggle] = useState<CustomerDTO | null>(null);
  const [toggling, setToggling] = useState(false);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.CUSTOMER_MANAGE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    customerService
      .fetchWithPagination({
        pageNumber: page,
        pageSize,
        searchTerm: keyword || undefined,
        isActive: status === 'all' ? undefined : status === 'active',
      })
      .then((res) => {
        if (!cancelled) {
          setData(res.result);
          setError('');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, keyword, status, reload]);

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

  const resetAllFilters = () => {
    setKeywordInput('');
    setKeyword('');
    setStatus('all');
    setPage(1);
  };

  const hasActiveFilters = Boolean(keyword || status !== 'all');

  async function handleConfirmToggle() {
    if (!customerToToggle) return;
    setToggling(true);
    try {
      await customerService.toggleStatus(customerToToggle.id);
      message.success(
        customerToToggle.isActive
          ? `Customer "${customerToToggle.fullName}" deactivated.`
          : `Customer "${customerToToggle.fullName}" activated.`
      );
      setCustomerToToggle(null);
      setReload((n) => n + 1);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setToggling(false);
    }
  }

  const totalCount = data?.totalCount ?? 0;
  const startEntry = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalCount);

  return (
    <section className="page wide">
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
            Customers Management
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            {canManage
              ? 'View, search, and manage registered sanctuary customer accounts and contact dossiers.'
              : 'Explore customer profiles, contact info, and registered pets.'}
          </p>
        </div>
        {canManage && (
          <Link
            to={`${baseCustomerPath}/new`}
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
            <span>Add Customer</span>
          </Link>
        )}
      </div>

      <div className="admin-toolbar-panel">
        <div className="admin-toolbar-row">
          <form className="search-wrapper" onSubmit={onSearch}>
            <span className="search-icon-prefix" aria-hidden="true">
              <SearchOutlined style={{ color: '#8c735f' }} />
            </span>
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search customers"
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

      <div className="table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th className="col-name">FULL NAME</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th style={{ textAlign: 'center' }}>TOTAL PETS</th>
                <th className="col-status">STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <p style={{ margin: 0, color: '#785839', fontWeight: 600 }}>Loading sanctuary customers...</p>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty-box">
                      <h3>No matching customers found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query or filters to find what you are looking for.'
                          : 'No customers exist in the system yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn" onClick={resetAllFilters}>
                          Clear filters
                        </button>
                      ) : canManage ? (
                        <Link to={`${baseCustomerPath}/new`} className="btn">
                          + Add first customer
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((c, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={c.id} className={c.isActive ? '' : 'row-inactive'}>
                      <td className="col-idx">{rowNumber}</td>
                      <td className="col-name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              backgroundColor: '#faf6f0',
                              border: '1.5px solid #eeddc8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#785839',
                              fontSize: '0.88rem',
                              flexShrink: 0,
                            }}
                          >
                            {c.fullName ? c.fullName.charAt(0).toUpperCase() : <UserOutlined />}
                          </div>
                          <div>
                            <Link
                              to={`${baseCustomerPath}/${c.id}`}
                              style={{
                                color: '#3d2d23',
                                fontWeight: 700,
                                textDecoration: 'none',
                                fontSize: '0.94rem',
                              }}
                            >
                              {c.fullName}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td style={{ textTransform: 'none', color: '#554236', fontSize: '0.88rem' }}>
                        {c.email}
                      </td>
                      <td style={{ color: '#554236', fontSize: '0.88rem' }}>
                        {c.phoneNumber || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 12px',
                            borderRadius: 999,
                            backgroundColor: '#faf6f0',
                            color: '#785839',
                            border: '1.5px solid #eeddc8',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                          }}
                        >
                          <span>{c.totalPets} Pets</span>
                        </span>
                      </td>
                      <td className="col-status">
                        {c.isActive ? (
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
                            to={`${baseCustomerPath}/${c.id}`}
                            className="btn-action view"
                            title="View customer details"
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
                                to={`${baseCustomerPath}/${c.id}/edit`}
                                className="btn-action edit"
                                title="Edit customer"
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
                              <button
                                type="button"
                                className={`btn-action ${c.isActive ? 'danger' : 'view'}`}
                                onClick={() => setCustomerToToggle(c)}
                                title={c.isActive ? 'Deactivate customer' : 'Activate customer'}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  fontSize: '0.82rem',
                                }}
                              >
                                {c.isActive ? (
                                  <>
                                    <StopOutlined style={{ fontSize: 12 }} />
                                    <span>Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircleOutlined style={{ fontSize: 12 }} />
                                    <span>Activate</span>
                                  </>
                                )}
                              </button>
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
              Showing {startEntry} to {endEntry} of {totalCount} customers
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

      {customerToToggle && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div
              className={`confirm-icon ${customerToToggle.isActive ? 'danger' : ''}`}
              style={
                !customerToToggle.isActive
                  ? { backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }
                  : undefined
              }
            >
              {customerToToggle.isActive ? '⚠️' : '✓'}
            </div>
            <h3>{customerToToggle.isActive ? 'Deactivate' : 'Activate'} Customer?</h3>
            <p>
              Are you sure you want to {customerToToggle.isActive ? 'deactivate' : 'activate'}{' '}
              <strong>"{customerToToggle.fullName}"</strong>?
              <br />
              {customerToToggle.isActive
                ? "This customer will be marked as inactive and won't be able to log in. You can reactivate them anytime."
                : 'This customer account will be restored to active status.'}
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={toggling}
                onClick={() => setCustomerToToggle(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-action ${customerToToggle.isActive ? 'danger' : ''}`}
                disabled={toggling}
                onClick={handleConfirmToggle}
                style={{
                  padding: '0.65rem 1.4rem',
                  color: '#ffffff',
                  backgroundColor: customerToToggle.isActive ? undefined : '#3d2d23',
                }}
              >
                {toggling
                  ? 'Processing...'
                  : customerToToggle.isActive
                  ? 'Confirm Deactivate'
                  : 'Confirm Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CustomerManagement;
