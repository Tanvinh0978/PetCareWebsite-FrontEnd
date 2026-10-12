import React, { useEffect, useState, type FormEvent } from 'react'
import { App } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { reviewService } from '@/services/review.service'
import { serviceService } from '@/services/service.service'
import type { ReviewDetail, ReviewListItem } from '@/types/review.types'
import type { ServiceDTO } from '@/types/service.types'
import { getApiErrorMessage } from '@/utils/apiError'

dayjs.extend(relativeTime)

export default function ReviewManagementPage() {
  const { message } = App.useApp()

  // State
  const [reviews, setReviews] = useState<ReviewListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [services, setServices] = useState<ServiceDTO[]>([])

  // Filters & Pagination
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined)
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reload, setReload] = useState(0)

  // Modals state
  const [reviewToView, setReviewToView] = useState<ReviewDetail | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<ReviewListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch Services for dropdown
  useEffect(() => {
    serviceService
      .fetchAllForAdmin()
      .then((items) => setServices(items))
      .catch((err) => console.error('Failed to load services:', err))
  }, [])

  // Fetch Reviews
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    reviewService
      .getReviews({
        serviceId: selectedServiceId,
        rating: selectedRating,
        pageNumber: page,
        pageSize,
      })
      .then((res) => {
        if (!cancelled) {
          if (res.isSuccess) {
            setReviews(res.result.items || [])
            setTotalCount(res.result.totalCount || 0)
            setError('')
          } else {
            setError(res.message || 'Failed to load reviews.')
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedServiceId, selectedRating, page, pageSize, reload])

  // Search actions
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
    setSelectedServiceId(undefined)
    setSelectedRating(undefined)
    setPage(1)
  }

  const hasActiveFilters = Boolean(keyword || selectedServiceId || selectedRating !== undefined)

  // Open Detail Modal
  const handleOpenDetail = async (id: string) => {
    setViewLoading(true)
    try {
      const res = await reviewService.getById(id)
      if (res.isSuccess) {
        setReviewToView(res.result)
      } else {
        message.error(res.message || 'Cannot load review details.')
      }
    } catch (err) {
      message.error(getApiErrorMessage(err))
    } finally {
      setViewLoading(false)
    }
  }

  // Confirm Delete Review
  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return
    setDeleting(true)
    try {
      const res = await reviewService.delete(reviewToDelete.id)
      if (res.isSuccess) {
        message.success('Review deleted successfully.')
        setReviewToDelete(null)
        if (reviews.length === 1 && page > 1) {
          setPage((p) => p - 1)
        } else {
          setReload((n) => n + 1)
        }
      } else {
        message.error(res.message || 'Failed to delete review.')
      }
    } catch (err) {
      message.error(getApiErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  // Filter client-side by keyword if search input has text
  const filteredReviews = reviews.filter((r) => {
    if (!keyword.trim()) return true
    const kw = keyword.toLowerCase()
    return (
      r.customerName?.toLowerCase().includes(kw) ||
      r.serviceName?.toLowerCase().includes(kw) ||
      r.comment?.toLowerCase().includes(kw)
    )
  })

  // Metrics
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
      : '5.0'
  const positiveCount = reviews.filter((r) => r.rating >= 4).length
  const positivePercent =
    reviews.length > 0 ? Math.round((positiveCount / reviews.length) * 100) : 100
  const lowRateCount = reviews.filter((r) => r.rating <= 2).length

  // Pagination bounds
  const startEntry = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endEntry = Math.min(page * pageSize, totalCount)
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const renderStars = (rating: number) => {
    return (
      <span style={{ color: '#f59e0b', fontSize: '0.95rem', letterSpacing: '2px' }} title={`${rating}/5 stars`}>
        {'★'.repeat(rating)}
        <span style={{ color: '#cbd5e1' }}>{'★'.repeat(5 - rating)}</span>
      </span>
    )
  }

  return (
    <section className="page wide">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Reviews Management</h1>
          <p className="page-subtitle">
            View, moderate, and manage customer reviews across all services.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setReload((n) => n + 1)}
          disabled={loading}
          title="Refresh reviews"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Refresh
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card accent-types">
          <div className="stat-val">{totalCount}</div>
          <div className="stat-label">Total Reviews</div>
        </div>
        <div className="stat-card accent-active">
          <div className="stat-val" style={{ color: '#d97706' }}>
            {averageRating} <span style={{ fontSize: '1.15rem', color: '#94a3b8', fontWeight: 500 }}>/ 5.0</span>
          </div>
          <div className="stat-label">Average Rating</div>
        </div>
        <div className="stat-card accent-active">
          <div className="stat-val" style={{ color: '#059669' }}>
            {positivePercent}%
          </div>
          <div className="stat-label">Positive (4★ - 5★)</div>
        </div>
        <div className="stat-card accent-inactive">
          <div className="stat-val" style={{ color: lowRateCount > 0 ? '#e11d48' : '#64748b' }}>
            {lowRateCount}
          </div>
          <div className="stat-label">Needs Attention (1★ - 2★)</div>
        </div>
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
              placeholder="Search by customer name, service, or comment..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search reviews"
            />
            {keywordInput && (
              <button type="button" className="search-clear-btn" onClick={clearSearch} title="Clear search">
                ✕
              </button>
            )}
          </form>

          <div className="filter-dropdowns">
            <select
              value={selectedServiceId || ''}
              onChange={(e) => {
                setPage(1)
                setSelectedServiceId(e.target.value || undefined)
              }}
              aria-label="Filter by service"
            >
              <option value="">All Services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1)
                setPageSize(Number(e.target.value))
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

        {/* Rating Category Chips */}
        <div className="type-chips-row">
          <span className="type-chips-label">Rating:</span>
          <button
            type="button"
            className={selectedRating === undefined ? 'chip on' : 'chip'}
            onClick={() => {
              setPage(1)
              setSelectedRating(undefined)
            }}
          >
            All Stars
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              className={selectedRating === star ? 'chip on' : 'chip'}
              onClick={() => {
                setPage(1)
                setSelectedRating(selectedRating === star ? undefined : star)
              }}
            >
              {'★'.repeat(star)} ({star} Star)
            </button>
          ))}
        </div>
      </div>

      {error && <p className="msg error" role="alert">{error}</p>}

      {/* Main Admin Data Table */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th style={{ minWidth: 200 }}>Customer</th>
                <th style={{ minWidth: 180 }}>Service</th>
                <th style={{ width: 140 }}>Rating</th>
                <th style={{ minWidth: 280 }}>Comment</th>
                <th style={{ width: 160 }}>Date Submitted</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--slate-500)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="spin-inline" style={{ width: 20, height: 20, border: '2px solid var(--slate-300)', borderTopColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                      Loading reviews...
                    </div>
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty-box">
                      <h3>No reviews found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query or filters to find what you are looking for.'
                          : 'No reviews exist in the system yet.'}
                      </p>
                      {hasActiveFilters && (
                        <button type="button" className="btn btn-secondary" onClick={resetAllFilters}>
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r, idx) => {
                  const seq = startEntry + idx
                  return (
                    <tr key={r.id}>
                      <td className="col-idx">{seq}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {r.customerAvatarUrl ? (
                            <img
                              src={r.customerAvatarUrl}
                              alt={r.customerName}
                              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--slate-200)' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                backgroundColor: 'var(--primary-light)',
                                color: 'var(--primary-hover)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {r.customerName ? r.customerName.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                              {r.customerName || 'Customer'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', fontFamily: 'monospace' }}>
                              ID: {r.customerId.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="type-badge type-Care" style={{ fontWeight: 600 }}>
                          {r.serviceName}
                        </span>
                      </td>
                      <td>
                        <div>
                          {renderStars(r.rating)}
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', marginTop: 2 }}>
                            {r.rating} / 5 stars
                          </div>
                        </div>
                      </td>
                      <td className="col-desc">
                        {r.comment ? (
                          <div className="desc-clamp" style={{ color: 'var(--slate-700)', fontStyle: 'italic' }}>
                            "{r.comment}"
                          </div>
                        ) : (
                          <span style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>
                            (No comment provided)
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.88rem', color: 'var(--slate-800)', fontWeight: 500 }}>
                          {dayjs(r.createdAt).format('DD/MM/YYYY HH:mm')}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                          {dayjs(r.createdAt).fromNow()}
                        </div>
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <button
                            type="button"
                            className="btn-action view"
                            onClick={() => handleOpenDetail(r.id)}
                            title="View review details"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View
                          </button>
                          <button
                            type="button"
                            className="btn-action danger"
                            onClick={() => setReviewToDelete(r)}
                            title="Delete review"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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

        {/* Table Footer with Pagination */}
        {totalCount > 0 && (
          <div className="table-footer">
            <div>
              Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of <strong>{totalCount}</strong> reviews
            </div>
            {totalPages > 1 && (
              <div className="table-pagination-nav">
                <button
                  type="button"
                  className="page-btn"
                  disabled={page <= 1}
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
                  disabled={page >= totalPages}
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

      {/* View Detail Modal */}
      {(reviewToView || viewLoading) && (
        <div className="modal-overlay" onClick={() => !viewLoading && setReviewToView(null)}>
          <div className="modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>Review Details</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setReviewToView(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {viewLoading ? (
                <p>Loading review details...</p>
              ) : reviewToView ? (
                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--slate-200)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--slate-900)' }}>
                        {reviewToView.customerName}
                      </div>
                      <div style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                        {reviewToView.customerEmail}
                      </div>
                    </div>
                    <div>{renderStars(reviewToView.rating)}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Service
                    </span>
                    <div style={{ marginTop: '0.2rem' }}>
                      <span className="type-badge type-Care">{reviewToView.serviceName}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Booking Item ID
                    </span>
                    <div style={{ marginTop: '0.2rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--slate-700)' }}>
                      {reviewToView.bookingItemId}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Customer Comment
                    </span>
                    <div
                      style={{
                        marginTop: '0.35rem',
                        padding: '0.85rem 1rem',
                        backgroundColor: 'var(--slate-50)',
                        border: '1px solid var(--slate-200)',
                        borderRadius: '10px',
                        color: 'var(--slate-800)',
                        fontStyle: 'italic',
                        lineHeight: 1.6,
                      }}
                    >
                      {reviewToView.comment ? `"${reviewToView.comment}"` : '(No written comment)'}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-400)', marginTop: '0.5rem' }}>
                    Submitted on {dayjs(reviewToView.createdAt).format('DD/MM/YYYY HH:mm:ss')} ({dayjs(reviewToView.createdAt).fromNow()})
                  </div>
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setReviewToView(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reviewToDelete && (
        <div className="modal-overlay" onClick={() => !deleting && setReviewToDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>Delete Review</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setReviewToDelete(null)}
                disabled={deleting}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete this review by <strong>"{reviewToDelete.customerName || 'Customer'}"</strong>?
              </p>
              <p style={{ margin: 0, color: 'var(--slate-500)', fontSize: '0.9rem' }}>
                This action will permanently remove the review from the system and cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setReviewToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
