import React, { useEffect, useState, type FormEvent } from 'react'
import { App } from 'antd'
import { customerService } from '@/services/customer.service'
import type { CustomerDTO, CustomerDetailDTO } from '@/types/customer.types'
import { getApiErrorMessage } from '@/utils/apiError'
import CustomerFormModal from '@/pages/admin/customer/components/customer.form.modal'

const CustomerManagement: React.FC = () => {
  const { message } = App.useApp()
  const [modal, setModal] = useState<{ open: boolean; customer: CustomerDetailDTO | null }>({ open: false, customer: null })

  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reload, setReload] = useState(0)

  const [data, setData] = useState<IPagedResult<CustomerDTO> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [customerToToggle, setCustomerToToggle] = useState<CustomerDTO | null>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    customerService.fetchWithPagination({
      pageNumber: page,
      pageSize,
      searchTerm: keyword || undefined,
      isActive: status === 'all' ? undefined : status === 'active'
    })
      .then((res) => {
        if (!cancelled) {
          setData(res.result)
          setError('')
        }
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page, pageSize, keyword, status, reload])

  const openEdit = async (id: string) => {
    try {
      const res = await customerService.fetchById(id)
      setModal({ open: true, customer: res.result })
    } catch (e) {
      message.error(getApiErrorMessage(e))
    }
  }

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
    setStatus('all')
    setPage(1)
  }

  const hasActiveFilters = Boolean(keyword || status !== 'all')

  async function handleConfirmToggle() {
    if (!customerToToggle) return
    setToggling(true)
    try {
      await customerService.toggleStatus(customerToToggle.id)
      message.success(customerToToggle.isActive ? 'Customer deactivated' : 'Customer activated')
      setCustomerToToggle(null)
      setReload((n) => n + 1)
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setToggling(false)
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
    for (let p = startPage; p <= endPage; p++) {
      pages.push(p)
    }
    return pages
  }

  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <h1>Customers Management</h1>
          <p className="page-subtitle">View, search, and manage customers in table format.</p>
        </div>
        <button type="button" className="btn" onClick={() => setModal({ open: true, customer: null })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add customer
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
              placeholder="Search customers by name or email..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search customers"
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
                setPage(1)
                setStatus(e.target.value as typeof status)
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
              <button type="button" className="chip" onClick={resetAllFilters} title="Reset all filters">
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ margin: 0, color: '#557268' }}>Loading customers...</p>
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
                      ) : (
                        <button type="button" className="btn" onClick={() => setModal({ open: true, customer: null })}>
                          + Add first customer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((c, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={c.id} className={c.isActive ? '' : 'row-inactive'}>
                      <td className="col-idx">{rowNumber}</td>
                      <td className="col-name">{c.fullName}</td>
                      <td style={{ textTransform: 'none' }}>{c.email}</td>
                      <td>{c.phoneNumber}</td>
                      <td style={{ textAlign: 'center' }}>{c.totalPets}</td>
                      <td className="col-status">
                        <span className={`status-pill ${c.isActive ? 'active' : 'inactive'}`}>
                          <span className="status-dot"></span>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <button
                            type="button"
                            className="btn-action edit"
                            title="Edit customer"
                            onClick={() => openEdit(c.id)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`btn-action ${c.isActive ? 'danger' : 'view'}`}
                            onClick={() => setCustomerToToggle(c)}
                            title={c.isActive ? 'Deactivate customer' : 'Activate customer'}
                          >
                            {c.isActive ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                                </svg>
                                Deactivate
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Activate
                              </>
                            )}
                          </button>
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
              Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of <strong>{totalCount}</strong> customers
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

      {/* Confirmation Modal for Toggling Status */}
      {customerToToggle && (
        <div className="modal-overlay" onClick={() => !toggling && setCustomerToToggle(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>{customerToToggle.isActive ? 'Deactivate' : 'Activate'} Customer</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setCustomerToToggle(null)}
                disabled={toggling}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to {customerToToggle.isActive ? 'deactivate' : 'activate'} <strong>"{customerToToggle.fullName}"</strong>?
              </p>
              {customerToToggle.isActive && (
                <p style={{ margin: 0, color: '#688279', fontSize: '0.9rem' }}>
                  This customer will be marked as inactive and won't be able to log in. You can reactivate them anytime.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="chip"
                onClick={() => setCustomerToToggle(null)}
                disabled={toggling}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn-action ${customerToToggle.isActive ? 'danger' : 'view'}`}
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.95rem' }}
                onClick={handleConfirmToggle}
                disabled={toggling}
              >
                {toggling ? 'Processing...' : (customerToToggle.isActive ? 'Confirm Deactivate' : 'Confirm Activate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.open && (
        <CustomerFormModal
          open={modal.open}
          customer={modal.customer}
          onClose={() => setModal({ open: false, customer: null })}
          onSuccess={() => { setModal({ open: false, customer: null }); setReload(r => r + 1) }}
        />
      )}
    </section>
  )
}

export default CustomerManagement
