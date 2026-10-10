import React, { useEffect, useState, type FormEvent } from 'react'
import { App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { voucherService } from '@/services/voucher.service'
import type { VoucherDTO } from '@/types/voucher.types'
import { DiscountType, DISCOUNT_TYPE_LABEL, DISCOUNT_TYPE_SHORT } from '@/types/voucher.types'
import { getApiErrorMessage } from '@/utils/apiError'

/* ── helpers ── */
const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch {
    return iso
  }
}

const formatValue = (v: VoucherDTO) => {
  if (v.discountType === DiscountType.Percentage) {
    return `${v.discountValue}%`
  }
  return `${v.discountValue.toLocaleString('vi-VN')} ₫`
}

/* ── component ── */
const VoucherListPage: React.FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()

  // Filter / pagination state
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [validFilter, setValidFilter] = useState<'all' | 'valid' | 'invalid'>('all')
  const [discountTypeFilter, setDiscountTypeFilter] = useState<'all' | DiscountType>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reload, setReload] = useState(0)

  const [data, setData] = useState<IPagedResult<VoucherDTO> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Detail modal
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherDTO | null>(null)

  // Delete confirmation modal
  const [voucherToDelete, setVoucherToDelete] = useState<VoucherDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* ── data fetching ── */
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const hasFilters = keyword || validFilter !== 'all'

    const fetchFn = hasFilters
      ? voucherService.search({
          keyword: keyword || undefined,
          isValidOnly: validFilter === 'valid' ? true : validFilter === 'invalid' ? false : undefined,
          pageIndex: page,
          pageSize,
        })
      : voucherService.fetchWithPagination({ pageIndex: page, pageSize })

    fetchFn
      .then((res: any) => {
        if (!cancelled) {
          // GET /api/Vouchers returns PagedResult directly, search wraps in IBackendRes
          const pagedResult: IPagedResult<VoucherDTO> = res?.result ?? res
          // Client-side filter by discountType if needed
          if (discountTypeFilter !== 'all' && pagedResult?.items) {
            const filtered = pagedResult.items.filter(
              (v) => v.discountType === discountTypeFilter
            )
            setData({ ...pagedResult, items: filtered, totalCount: filtered.length })
          } else {
            setData(pagedResult)
          }
          setError('')
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [page, pageSize, keyword, validFilter, discountTypeFilter, reload])

  /* ── event handlers ── */
  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  const clearSearch = () => {
    setKeywordInput('')
    setKeyword('')
    setPage(1)
  }

  const resetAllFilters = () => {
    setKeywordInput('')
    setKeyword('')
    setValidFilter('all')
    setDiscountTypeFilter('all')
    setPage(1)
  }

  const hasActiveFilters = Boolean(keyword || validFilter !== 'all' || discountTypeFilter !== 'all')

  async function handleConfirmDelete() {
    if (!voucherToDelete) return
    setDeleting(true)
    try {
      await voucherService.remove(voucherToDelete.id)
      message.success(`Voucher "${voucherToDelete.code}" deleted successfully.`)
      setVoucherToDelete(null)
      setReload((n) => n + 1)
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  /* ── pagination ── */
  const totalCount = data?.totalCount ?? 0
  const startEntry = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endEntry = Math.min(page * pageSize, totalCount)
  const totalPages = data?.totalPages ?? 1

  const getPageNumbers = () => {
    const pages: number[] = []
    const maxButtons = 5
    let startPage = Math.max(1, page - Math.floor(maxButtons / 2))
    let endPage = startPage + maxButtons - 1
    if (endPage > totalPages) {
      endPage = totalPages
      startPage = Math.max(1, endPage - maxButtons + 1)
    }
    for (let p = startPage; p <= endPage; p++) pages.push(p)
    return pages
  }

  /* ── validity badge ── */
  const getValidityBadge = (v: VoucherDTO) => {
    const now = new Date()
    const end = new Date(v.endDate)
    const start = new Date(v.startDate)
    const isExpired = end < now
    const notStarted = start > now
    const maxReached = v.maxUsage !== null && v.currentUsage >= v.maxUsage

    if (isExpired) return { label: 'Expired', cls: 'inactive', tip: 'Past end date' }
    if (notStarted) return { label: 'Scheduled', cls: 'view', tip: 'Not started yet' }
    if (maxReached) return { label: 'Exhausted', cls: 'inactive', tip: 'Usage limit reached' }
    return { label: 'Active', cls: 'active', tip: 'Currently valid' }
  }

  const getDiscountTypeBadge = (discountType: DiscountType | string) => {
    if (discountType === DiscountType.Percentage) {
      return { bg: '#e0f2fe', color: '#0369a1', label: 'Percentage' }
    }
    return { bg: '#f3e8ff', color: '#7e22ce', label: 'Fixed Amount' }
  }

  /* ── render ── */
  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <h1>Vouchers Management</h1>
          <p className="page-subtitle">Create, search, and manage discount vouchers.</p>
        </div>
        <button type="button" className="btn" onClick={() => navigate('/admin/vouchers/new')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add voucher
        </button>
      </div>

      {/* Toolbar */}
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
              placeholder="Search voucher by code..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search vouchers"
            />
            {keywordInput && (
              <button type="button" className="search-clear-btn" onClick={clearSearch} title="Clear search">✕</button>
            )}
          </form>

          <div className="filter-dropdowns">
            <select
              value={validFilter}
              onChange={(e) => { setPage(1); setValidFilter(e.target.value as typeof validFilter) }}
              aria-label="Filter by validity"
            >
              <option value="all">All statuses</option>
              <option value="valid">Valid only</option>
              <option value="invalid">Expired / exhausted</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)) }}
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

        {/* Discount type chips */}
        <div className="type-chips-row">
          <span className="type-chips-label">Type:</span>
          {(['all', DiscountType.Percentage, DiscountType.Fixed_Amount] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={discountTypeFilter === t ? 'chip on' : 'chip'}
              onClick={() => { setPage(1); setDiscountTypeFilter(t) }}
            >
              {t === 'all' ? 'All types' : DISCOUNT_TYPE_LABEL[t as DiscountType]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="msg error" role="alert">{error}</p>}

      {/* Table */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th>CODE</th>
                <th>TYPE</th>
                <th style={{ textAlign: 'right' }}>DISCOUNT</th>
                <th>START DATE</th>
                <th>END DATE</th>
                <th style={{ textAlign: 'center' }}>USAGE</th>
                <th className="col-status">STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ margin: 0, color: '#557268' }}>Loading vouchers...</p>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="table-empty-box">
                      <h3>No matching vouchers found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query or filters.'
                          : 'No vouchers exist in the system yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn" onClick={resetAllFilters}>Clear filters</button>
                      ) : (
                        <button type="button" className="btn" onClick={() => navigate('/admin/vouchers/new')}>
                          + Add first voucher
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((v, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1
                  const validity = getValidityBadge(v)
                  const dtBadge = getDiscountTypeBadge(v.discountType)
                  const usageText = v.maxUsage !== null
                    ? `${v.currentUsage} / ${v.maxUsage}`
                    : `${v.currentUsage} / ∞`

                  return (
                    <tr key={v.id}>
                      <td className="col-idx">{rowNumber}</td>
                      <td>
                        <strong style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{v.code}</strong>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          background: dtBadge.bg,
                          color: dtBadge.color,
                        }}>
                          {dtBadge.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatValue(v)}
                      </td>
                      <td>{formatDate(v.startDate)}</td>
                      <td>{formatDate(v.endDate)}</td>
                      <td style={{ textAlign: 'center' }}>{usageText}</td>
                      <td className="col-status">
                        <span className={`status-pill ${validity.cls}`} title={validity.tip}>
                          <span className="status-dot"></span>
                          {validity.label}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <button
                            type="button"
                            className="btn-action view"
                            title="View details"
                            onClick={() => setSelectedVoucher(v)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View
                          </button>
                          <button
                            type="button"
                            className="btn-action edit"
                            title="Edit voucher"
                            onClick={() => navigate(`/admin/vouchers/${v.id}/edit`)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-action danger"
                            title="Delete voucher"
                            onClick={() => setVoucherToDelete(v)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                              <path d="M10 11v6"></path>
                              <path d="M14 11v6"></path>
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {data && totalCount > 0 && (
          <div className="table-footer">
            <div>
              Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of <strong>{totalCount}</strong> vouchers
            </div>
            {totalPages > 1 && (
              <div className="table-pagination-nav">
                <button type="button" className="page-btn" disabled={!data.hasPreviousPage} onClick={() => setPage(page - 1)} title="Previous page">‹</button>
                {getPageNumbers().map((p) => (
                  <button key={p} type="button" className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button type="button" className="page-btn" disabled={!data.hasNextPage} onClick={() => setPage(page + 1)} title="Next page">›</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedVoucher && (
        <div className="modal-overlay" onClick={() => setSelectedVoucher(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>🎟️ Voucher Details</h2>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedVoucher(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Code', value: <code style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.08em', fontWeight: 700 }}>{selectedVoucher.code}</code> },
                { label: 'Discount Type', value: DISCOUNT_TYPE_LABEL[selectedVoucher.discountType as DiscountType] ?? selectedVoucher.discountType },
                { label: 'Discount Value', value: formatValue(selectedVoucher) },
                { label: 'Start Date', value: formatDate(selectedVoucher.startDate) },
                { label: 'End Date', value: formatDate(selectedVoucher.endDate) },
                {
                  label: 'Usage',
                  value: selectedVoucher.maxUsage !== null
                    ? `${selectedVoucher.currentUsage} used / ${selectedVoucher.maxUsage} max`
                    : `${selectedVoucher.currentUsage} used / Unlimited`
                },
                {
                  label: 'Status',
                  value: (() => {
                    const b = getValidityBadge(selectedVoucher)
                    return <span className={`status-pill ${b.cls}`}><span className="status-dot"></span>{b.label}</span>
                  })()
                },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" className="chip" onClick={() => setSelectedVoucher(null)}>Close</button>
              <button type="button" className="btn-action edit" style={{ padding: '0.5rem 1rem' }} onClick={() => { setSelectedVoucher(null); navigate(`/admin/vouchers/${selectedVoucher.id}/edit`) }}>
                Edit voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {voucherToDelete && (
        <div className="modal-overlay" onClick={() => !deleting && setVoucherToDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>Delete Voucher</h2>
              <button type="button" className="modal-close-btn" onClick={() => setVoucherToDelete(null)} disabled={deleting}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete voucher <strong>"{voucherToDelete.code}"</strong>?
              </p>
              {voucherToDelete.currentUsage > 0 ? (
                <p style={{ margin: 0, color: '#b45309', fontSize: '0.9rem' }}>
                  ⚠️ This voucher has been used {voucherToDelete.currentUsage} time(s). It may be soft-deleted rather than permanently removed.
                </p>
              ) : (
                <p style={{ margin: 0, color: '#ef4444', fontSize: '0.9rem' }}>
                  This voucher has never been used and will be permanently deleted.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="chip" onClick={() => setVoucherToDelete(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="btn-action danger" style={{ padding: '0.6rem 1.2rem', fontSize: '0.95rem' }} onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default VoucherListPage
