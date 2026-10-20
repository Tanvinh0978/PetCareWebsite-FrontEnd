import React, { useEffect, useState, type FormEvent } from 'react'
import { App } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { staffService } from '@/services/staff.service'
import type { StaffDTO } from '@/types/staff.types'
import { getApiErrorMessage } from '@/utils/apiError'

const getRoleBadgeStyle = (roleName: string) => {
  const lower = roleName.toLowerCase()
  if (lower.includes('admin')) {
    return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' }
  }
  if (lower.includes('receptionist')) {
    return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }
  }
  if (lower.includes('boarding')) {
    return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
  }
  if (lower.includes('grooming')) {
    return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' }
  }
  return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' }
}

const AdminStaffListPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const baseStaffPath = location.pathname.startsWith('/staff') ? '/staff/staff' : '/admin/staff'
  const { message } = App.useApp()

  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reload, setReload] = useState(0)

  const [data, setData] = useState<IPagedResult<StaffDTO> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [staffToDeactivate, setStaffToDeactivate] = useState<StaffDTO | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    staffService
      .fetchWithPagination({
        searchTerm: keyword || undefined,
        status: statusFilter,
        pageNumber: page,
        pageSize,
      })
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setError('')
        }
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, pageSize, keyword, statusFilter, reload])

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
    setStatusFilter('all')
    setPage(1)
  }

  const hasActiveFilters = Boolean(keyword || statusFilter !== 'all')

  const handleConfirmDeactivate = async () => {
    if (!staffToDeactivate) return
    setDeactivating(true)
    try {
      await staffService.delete(staffToDeactivate.id)
      message.success(`Deactivated staff account "${staffToDeactivate.fullName}".`)
      setStaffToDeactivate(null)
      setReload((n) => n + 1)
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setDeactivating(false)
    }
  }

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
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <section className="page wide">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Staff Management</h1>
          <p className="page-subtitle">
            Manage system administrators, receptionists, boarding caregivers, and grooming specialists.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/roles')}
          >
            🛡️ Manage Roles & Permissions
          </button>
          <Link
            to={`${baseStaffPath}/new`}
            className="btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add staff
          </Link>
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
              placeholder="Search staff by name, email, phone, or role..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search staff"
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

          <div className="filter-dropdowns">
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value as typeof statusFilter)
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
              <button
                type="button"
                className="chip"
                onClick={resetAllFilters}
                title="Reset all filters"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="msg error" role="alert">
          {error}
        </p>
      )}

      {/* Main Data Table */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th>STAFF MEMBER</th>
                <th>CONTACT INFO</th>
                <th>ASSIGNED ROLES</th>
                <th style={{ textAlign: 'center' }}>EXPERIENCE</th>
                <th className="col-status">STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ margin: 0, color: '#557268' }}>Loading staff members from server...</p>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty-box">
                      <h3>No matching staff found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query or filters.'
                          : 'No staff profiles recorded in the database yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn" onClick={resetAllFilters}>
                          Clear filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => navigate('/admin/staff/new')}
                        >
                          + Add first staff member
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((st, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1

                  return (
                    <tr
                      key={st.id}
                      className={st.status === 'Active' ? '' : 'row-inactive'}
                    >
                      <td className="col-idx">{rowNumber}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.95rem',
                              border: '1px solid #a7f3d0'
                            }}
                          >
                            {st.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              to={`${baseStaffPath}/${st.id}`}
                              style={{ display: 'block', color: '#0f172a', fontWeight: 700, textDecoration: 'none' }}
                            >
                              {st.fullName}
                            </Link>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              ID: {st.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{st.email}</div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            {st.phoneNumber}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {st.roles && st.roles.length > 0 ? (
                            st.roles.map((r) => {
                              const badge = getRoleBadgeStyle(r)
                              return (
                                <span
                                  key={r}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    background: badge.bg,
                                    color: badge.text,
                                    border: `1px solid ${badge.border}`,
                                  }}
                                >
                                  {r}
                                </span>
                              )
                            })
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No roles</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {st.yearsOfExperience} yr{st.yearsOfExperience !== 1 ? 's' : ''}
                      </td>
                      <td className="col-status">
                        <span
                          className={`status-pill ${
                            st.status === 'Active' ? 'active' : 'inactive'
                          }`}
                        >
                          <span className="status-dot"></span>
                          {st.status}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <Link
                            to={`${baseStaffPath}/${st.id}`}
                            className="btn-action view"
                            title="View details"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View
                          </Link>
                          <Link
                            to={`${baseStaffPath}/${st.id}/edit`}
                            className="btn-action edit"
                            title="Edit staff"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </Link>
                          {st.status === 'Active' && (
                            <button
                              type="button"
                              className="btn-action danger"
                              onClick={() => setStaffToDeactivate(st)}
                              title="Deactivate staff"
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalCount > 0 && (
          <div className="table-pagination">
            <span className="table-pagination-info">
              Showing {startEntry} to {endEntry} of {totalCount} staff members
            </span>
            <div className="table-pagination-nav">
              <button
                type="button"
                className="btn-page"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {getPageNumbers().map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  className={`btn-page ${pNum === page ? 'active' : ''}`}
                  disabled={loading}
                  onClick={() => setPage(pNum)}
                >
                  {pNum}
                </button>
              ))}
              <button
                type="button"
                className="btn-page"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate Staff Confirmation Dialog */}
      {staffToDeactivate && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div className="confirm-icon danger">
              ⚠️
            </div>
            <h3>Deactivate Staff Account?</h3>
            <p>
              Are you sure you want to deactivate{' '}
              <strong>"{staffToDeactivate.fullName}"</strong>?
              <br />
              Their login access will be suspended and they will not be assigned to upcoming booking shifts.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deactivating}
                onClick={() => setStaffToDeactivate(null)}
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
                {deactivating ? 'Processing...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminStaffListPage
