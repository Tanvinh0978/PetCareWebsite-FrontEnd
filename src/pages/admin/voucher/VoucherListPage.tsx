import React, { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Select, Pagination, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { voucherService } from '@/services/voucher.service';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';
import type { VoucherDTO } from '@/types/voucher.types';
import { DiscountType, DISCOUNT_TYPE_LABEL } from '@/types/voucher.types';
import { getApiErrorMessage } from '@/utils/apiError';

/* ── helpers ── */
const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatValue = (v: VoucherDTO) => {
  if (v.discountType === DiscountType.Percentage) {
    return `${v.discountValue}%`;
  }
  return `${v.discountValue.toLocaleString('vi-VN')} ₫`;
};

const VoucherListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const baseVoucherPath = location.pathname.startsWith('/staff') ? '/staff/vouchers' : '/admin/vouchers';

  // Filter / pagination state
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [validFilter, setValidFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<'all' | DiscountType>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reload, setReload] = useState(0);

  const [data, setData] = useState<IPagedResult<VoucherDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete confirmation modal
  const [voucherToDelete, setVoucherToDelete] = useState<VoucherDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.VOUCHER_MANAGE);

  /* ── data fetching ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const hasFilters = keyword || validFilter !== 'all';

    const fetchFn = hasFilters
      ? voucherService.search({
          keyword: keyword || undefined,
          isValidOnly: validFilter === 'valid' ? true : validFilter === 'invalid' ? false : undefined,
          pageIndex: page,
          pageSize,
        })
      : voucherService.fetchWithPagination({ pageIndex: page, pageSize });

    fetchFn
      .then((res: any) => {
        if (!cancelled) {
          const pagedResult: IPagedResult<VoucherDTO> = res?.result ?? res;
          // Client-side filter by discountType if needed
          if (discountTypeFilter !== 'all' && pagedResult?.items) {
            const filtered = pagedResult.items.filter(
              (v) => v.discountType === discountTypeFilter
            );
            setData({ ...pagedResult, items: filtered, totalCount: filtered.length });
          } else {
            setData(pagedResult);
          }
          setError('');
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, keyword, validFilter, discountTypeFilter, reload]);

  /* ── event handlers ── */
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
    setValidFilter('all');
    setDiscountTypeFilter('all');
    setPage(1);
  };

  const hasActiveFilters = Boolean(keyword || validFilter !== 'all' || discountTypeFilter !== 'all');

  async function handleConfirmDelete() {
    if (!voucherToDelete) return;
    setDeleting(true);
    try {
      await voucherService.remove(voucherToDelete.id);
      message.success(`Voucher "${voucherToDelete.code}" deleted successfully.`);
      setVoucherToDelete(null);
      setReload((n) => n + 1);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  /* ── pagination ── */
  const totalCount = data?.totalCount ?? 0;
  const startEntry = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalCount);

  /* ── validity badge ── */
  const getValidityBadge = (v: VoucherDTO) => {
    const now = new Date();
    const end = new Date(v.endDate);
    const start = new Date(v.startDate);
    const isExpired = end < now;
    const notStarted = start > now;
    const maxReached = v.maxUsage !== null && v.currentUsage >= v.maxUsage;

    if (isExpired) {
      return {
        label: 'Expired',
        bg: '#fef2f2',
        color: '#dc2626',
        border: '#fecaca',
        dot: '#ef4444',
      };
    }
    if (notStarted) {
      return {
        label: 'Scheduled',
        bg: '#f0f9ff',
        color: '#0369a1',
        border: '#bae6fd',
        dot: '#0284c7',
      };
    }
    if (maxReached) {
      return {
        label: 'Exhausted',
        bg: '#fffbeb',
        color: '#b45309',
        border: '#fde68a',
        dot: '#f59e0b',
      };
    }
    return {
      label: 'Active',
      bg: '#ecfdf5',
      color: '#047857',
      border: '#a7f3d0',
      dot: '#10b981',
    };
  };

  const getDiscountTypeBadge = (discountType: DiscountType | string) => {
    if (discountType === DiscountType.Percentage) {
      return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: 'Percentage' };
    }
    return { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff', label: 'Fixed Amount' };
  };

  /* ── render ── */
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
            Vouchers Management
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            {canManage
              ? 'Create, configure, schedule, and manage promotional discount vouchers and usage quotas.'
              : 'View available promotional vouchers and active discount campaigns.'}
          </p>
        </div>
        {canManage && (
          <Link
            to={`${baseVoucherPath}/new`}
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
            <span>Add Voucher</span>
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
              placeholder="Search voucher by code..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search vouchers"
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
            {/* Discount Type Dropdown */}
            <Select
              value={discountTypeFilter}
              onChange={(val) => {
                setPage(1);
                setDiscountTypeFilter(val);
              }}
              style={{ minWidth: 155, height: 40 }}
              options={[
                { value: 'all', label: 'All Types' },
                { value: DiscountType.Percentage, label: 'Percentage (%)' },
                { value: DiscountType.Fixed_Amount, label: 'Fixed Amount (₫)' },
              ]}
            />

            {/* Validity Dropdown */}
            <Select
              value={validFilter}
              onChange={(val) => {
                setPage(1);
                setValidFilter(val);
              }}
              style={{ minWidth: 145, height: 40 }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'valid', label: 'Valid only' },
                { value: 'invalid', label: 'Expired / Exhausted' },
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
                <th>VOUCHER CODE</th>
                <th>TYPE</th>
                <th style={{ textAlign: 'right' }}>DISCOUNT</th>
                <th>VALID PERIOD</th>
                <th style={{ textAlign: 'center' }}>USAGE</th>
                <th className="col-status">STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <p style={{ margin: 0, color: '#785839', fontWeight: 600 }}>Loading vouchers...</p>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="table-empty-box">
                      <h3>No matching vouchers found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query or filters.'
                          : 'No vouchers exist in the sanctuary system yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn" onClick={resetAllFilters}>
                          Clear filters
                        </button>
                      ) : canManage ? (
                        <Link to={`${baseVoucherPath}/new`} className="btn">
                          + Add first voucher
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((v, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1;
                  const validity = getValidityBadge(v);
                  const dtBadge = getDiscountTypeBadge(v.discountType);
                  const usageText =
                    v.maxUsage !== null
                      ? `${v.currentUsage} / ${v.maxUsage}`
                      : `${v.currentUsage} / ∞`;

                  return (
                    <tr key={v.id}>
                      <td className="col-idx">{rowNumber}</td>
                      <td>
                        <Link
                          to={`${baseVoucherPath}/${v.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            fontFamily: 'monospace',
                            letterSpacing: '0.06em',
                            fontWeight: 700,
                            color: '#3d2d23',
                            fontSize: '0.94rem',
                            textDecoration: 'none',
                          }}
                          title="View voucher details"
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              backgroundColor: '#faf6f0',
                              border: '1px solid #eeddc8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#785839',
                              fontSize: '0.85rem',
                            }}
                          >
                            <TagOutlined />
                          </div>
                          <span>{v.code}</span>
                        </Link>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: dtBadge.bg,
                            color: dtBadge.color,
                            border: `1px solid ${dtBadge.border}`,
                          }}
                        >
                          {dtBadge.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#3d2d23', fontSize: '0.94rem' }}>
                        {formatValue(v)}
                      </td>
                      <td>
                        <div style={{ color: '#554236', fontSize: '0.86rem' }}>
                          <span>{formatDate(v.startDate)}</span>
                          <span style={{ color: '#8c735f', margin: '0 6px' }}>→</span>
                          <span>{formatDate(v.endDate)}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '3px 10px',
                            borderRadius: 999,
                            backgroundColor: '#faf6f0',
                            border: '1px solid #eeddc8',
                            color: '#785839',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                          }}
                        >
                          {usageText}
                        </span>
                      </td>
                      <td className="col-status">
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '3px 12px',
                            borderRadius: 999,
                            backgroundColor: validity.bg,
                            color: validity.color,
                            border: `1px solid ${validity.border}`,
                            fontSize: '0.82rem',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: validity.dot }} />
                          {validity.label}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <Link
                            to={`${baseVoucherPath}/${v.id}`}
                            className="btn-action view"
                            title="View voucher details"
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
                                to={`${baseVoucherPath}/${v.id}/edit`}
                                className="btn-action edit"
                                title="Edit voucher"
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
                                className="btn-action danger"
                                title="Delete voucher"
                                onClick={() => setVoucherToDelete(v)}
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
                                <span>Delete</span>
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

        {/* Pagination footer */}
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
              Showing {startEntry} to {endEntry} of {totalCount} vouchers
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

      {/* Delete confirmation modal */}
      {voucherToDelete && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div className="confirm-icon danger">⚠️</div>
            <h3>Delete Voucher?</h3>
            <p>
              Are you sure you want to delete voucher <strong>"{voucherToDelete.code}"</strong>?
              <br />
              {voucherToDelete.currentUsage > 0
                ? `This voucher has been redeemed ${voucherToDelete.currentUsage} time(s). It will be deactivated and marked as removed.`
                : 'This voucher has not been redeemed and will be permanently removed from the system.'}
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleting}
                onClick={() => setVoucherToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-action danger"
                disabled={deleting}
                onClick={handleConfirmDelete}
                style={{ padding: '0.65rem 1.4rem', color: '#fff' }}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VoucherListPage;
