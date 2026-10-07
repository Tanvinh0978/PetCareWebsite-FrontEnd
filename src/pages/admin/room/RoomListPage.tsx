import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomService, type RoomDTO } from '@/services/room.service'
import { getApiErrorMessage } from '@/utils/apiError'

const AdminRoomListPage: React.FC = () => {
  const [data, setData] = useState<IPagedResult<RoomDTO> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await roomService.fetchWithPagination({
        pageNumber: page,
        pageSize,
        searchTerm: searchTerm || undefined,
        status: status || undefined,
      })
      if (res.isSuccess && res.result) {
        setData(res.result)
      } else {
        setError(res.message || 'Failed to fetch rooms')
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm, status])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearchTerm(keywordInput)
  }

  const clearSearch = () => {
    setKeywordInput('')
    setSearchTerm('')
    setPage(1)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete room "${name}"? This cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      const res = await roomService.delete(id)
      if (res.isSuccess) {
        fetchRooms() // Refresh list
      } else {
        setError(res.message || 'Failed to delete room')
        setLoading(false)
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err))
      setLoading(false)
    }
  }

  const handleToggleStatus = async (room: RoomDTO) => {
    const newStatus = room.status === 'Available' ? 'Maintenance' : 'Available'
    if (!window.confirm(`Are you sure you want to change room status to ${newStatus}?`)) {
      return
    }
    
    try {
      setLoading(true)
      await roomService.updateStatus(room.id, newStatus)
      fetchRooms()
    } catch (err: any) {
      setError(getApiErrorMessage(err))
      setLoading(false)
    }
  }

  const hasActiveFilters = Boolean(searchTerm || status)

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
          <h1>Rooms Management</h1>
          <p className="page-subtitle">View, search, and manage individual rooms.</p>
        </div>
        <Link to="/admin/rooms/new" className="btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Room
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
              placeholder="Search rooms by name..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search rooms"
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
                setStatus(e.target.value)
              }}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="Available">Available</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Occupied">Occupied</option>
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
              <button type="button" className="chip" onClick={() => { clearSearch(); setStatus(''); }} title="Reset all filters">
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
                <th className="col-name">ROOM NAME</th>
                <th>ROOM TYPE</th>
                <th className="col-status">STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ margin: 0, color: '#557268' }}>Loading rooms...</p>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-empty-box">
                      <h3>No matching rooms found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query or filters to find what you are looking for.'
                          : 'No rooms exist in the system yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn" onClick={() => { clearSearch(); setStatus(''); }}>
                          Clear filters
                        </button>
                      ) : (
                        <Link to="/admin/rooms/new" className="btn">
                          + Add first room
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="col-idx">{(page - 1) * pageSize + idx + 1}</td>
                      <td className="col-name">{r.roomName}</td>
                      <td>{r.roomTypeName}</td>
                      <td className="col-status">
                         <span className={`status-pill ${r.status === 'Available' ? 'active' : r.status === 'Maintenance' ? 'inactive' : ''}`} style={r.status === 'Occupied' ? { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' } : {}}>
                           <span className="status-dot"></span>
                           {r.status}
                         </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <button
                            type="button"
                            className="btn-action view"
                            title="Toggle status"
                            onClick={() => handleToggleStatus(r)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="6" width="20" height="12" rx="6" ry="6"></rect>
                              <circle cx="16" cy="12" r="2"></circle>
                            </svg>
                          </button>
                          
                          <Link
                            to={`/admin/rooms/${r.id}/edit`}
                            className="btn-action edit"
                            title="Edit room"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </Link>
                          
                          <button
                            type="button"
                            className="btn-action danger"
                            title="Delete room"
                            onClick={() => handleDelete(r.id, r.roomName)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        {data && totalCount > 0 && (
          <div className="table-footer">
            <div>
              Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of <strong>{totalCount}</strong> rooms
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
    </section>
  )
}

export default AdminRoomListPage
