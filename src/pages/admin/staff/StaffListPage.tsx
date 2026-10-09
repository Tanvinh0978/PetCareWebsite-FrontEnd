import React, { useEffect, useState, type FormEvent } from 'react'
import { App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { staffService } from '@/services/staff.service'
import type { StaffDTO } from '@/types/staff.types'
import { STAFF_ROLES } from '@/types/staff.types'
import { getApiErrorMessage } from '@/utils/apiError'
import StaffDetailModal from './components/StaffDetailModal'

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'Veterinarian':
      return { bg: '#e0f2fe', text: '#0369a1' }
    case 'Pet Groomer':
      return { bg: '#f3e8ff', text: '#7e22ce' }
    case 'Care Specialist':
      return { bg: '#ecfdf5', text: '#047857' }
    case 'Facility Manager':
      return { bg: '#fef3c7', text: '#b45309' }
    case 'Receptionist':
      return { bg: '#f1f5f9', text: '#334155' }
    default:
      return { bg: '#f1f5f9', text: '#475569' }
  }
}

const AdminStaffListPage: React.FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reload, setReload] = useState(0)

  const [data, setData] = useState<IPagedResult<StaffDTO> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedStaff, setSelectedStaff] = useState<StaffDTO | null>(null)
  const [staffToToggle, setStaffToToggle] = useState<StaffDTO | null>(null)
  const [toggling, setToggling] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<StaffDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    staffService
      .fetchWithPagination({
        searchTerm: keyword || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
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
  }, [page, pageSize, keyword, roleFilter, statusFilter, reload])

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
    setRoleFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const hasActiveFilters = Boolean(keyword || roleFilter !== 'all' || statusFilter !== 'all')

  const handleConfirmToggle = async () => {
    if (!staffToToggle) return
    setToggling(true)
    try {
      await staffService.toggleStatus(staffToToggle.id)
      message.success(
        staffToToggle.status === 'Active'
          ? `Deactivated staff "${staffToToggle.fullName}".`
          : `Activated staff "${staffToToggle.fullName}".`,
      )
      setStaffToToggle(null)
      setReload((n) => n + 1)
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setToggling(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return
    setDeleting(true)
    try {
      await staffService.delete(staffToDelete.id)
      message.success(`Removed staff "${staffToDelete.fullName}".`)
      setStaffToDelete(null)
      setReload((n) => n + 1)
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setDeleting(false)
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
            Manage veterinarian staff, groomers, care specialists, and facility operations.
          </p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => navigate('/admin/staff/new')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add staff
        </button>
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
              placeholder="Search staff by name, email, or phone..."
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

        {/* Roles Category Chips like Service category chips */}
        <div className="type-chips-row">
          <span className="type-chips-label">Role:</span>
          <button
            type="button"
            className={roleFilter === 'all' ? 'chip on' : 'chip'}
            onClick={() => {
              setPage(1)
              setRoleFilter('all')
            }}
          >
            All
          </button>
          {STAFF_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              className={roleFilter === r ? 'chip on' : 'chip'}
              onClick={() => {
                setPage(1)
                setRoleFilter(r)
              }}
            >
              {r}
            </button>
          ))}
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
                <th>ROLE / POSITION</th>
                <th style={{ textAlign: 'center' }}>EXPERIENCE</th>
                <th className="col-status">STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ margin: 0, color: '#557268' }}>Loading staff members...</p>
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
                          : 'No staff profiles recorded in the system yet.'}
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
                  const badge = getRoleBadgeStyle(st.role)

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
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.9rem',
                            }}
                          >
                            {st.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ display: 'block', color: '#0f172a' }}>
                              {st.fullName}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              ID: {st.id.slice(0, 10)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontSize: '0.88rem' }}>{st.email}</div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            {st.phoneNumber}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.text,
                          }}
                        >
                          {st.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {st.yearsOfExperience} yr{st.yearsOfExperience > 1 ? 's' : ''}
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
                          <button
                            type="button"
                            className="btn-action view"
                            onClick={() => setSelectedStaff(st)}
                            title="View details"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn-action edit"
                            onClick={() => navigate(`/admin/staff/${st.id}/edit`)}
                            title="Edit staff"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`btn-action ${
                              st.status === 'Active' ? 'danger' : 'view'
                            }`}
                            onClick={() => setStaffToToggle(st)}
                            title={
                              st.status === 'Active'
                                ? 'Deactivate staff'
                                : 'Activate staff'
                            }
                          >
                            {st.status === 'Active' ? 'Deactivate' : 'Activate'}
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

      {/* Staff Detail Modal */}
      <StaffDetailModal
        staff={selectedStaff}
        open={Boolean(selectedStaff)}
        onClose={() => setSelectedStaff(null)}
      />

      {/* Toggle Status Confirmation Dialog */}
      {staffToToggle && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div
              className={`confirm-icon ${
                staffToToggle.status === 'Active' ? 'danger' : 'primary'
              }`}
            >
              ⚠️
            </div>
            <h3>
              {staffToToggle.status === 'Active'
                ? 'Deactivate Staff Member?'
                : 'Activate Staff Member?'}
            </h3>
            <p>
              Are you sure you want to{' '}
              {staffToToggle.status === 'Active' ? 'deactivate' : 'activate'}{' '}
              <strong>"{staffToToggle.fullName}"</strong>?
              <br />
              {staffToToggle.status === 'Active'
                ? 'They will no longer be assigned to new pet care bookings.'
                : 'They will be available to take care of bookings and grooming tasks.'}
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={toggling}
                onClick={() => setStaffToToggle(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-action ${
                  staffToToggle.status === 'Active' ? 'danger' : 'view'
                }`}
                disabled={toggling}
                onClick={handleConfirmToggle}
                style={{ padding: '0.65rem 1.4rem', color: '#fff' }}
              >
                {toggling
                  ? 'Processing...'
                  : staffToToggle.status === 'Active'
                  ? 'Confirm Deactivate'
                  : 'Confirm Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminStaffListPage
