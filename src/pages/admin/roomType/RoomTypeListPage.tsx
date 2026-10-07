import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { roomTypeService, type RoomTypeDTO } from '@/services/roomType.service'
import { getApiErrorMessage } from '@/utils/apiError'

const AdminRoomTypeListPage: React.FC = () => {
  const [data, setData] = useState<RoomTypeDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [keywordInput, setKeywordInput] = useState('')

  const fetchRoomTypes = async (search?: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await roomTypeService.fetchAll(search)
      if (res.isSuccess && res.result) {
        setData(res.result)
      } else {
        setError(res.message || 'Failed to fetch room types')
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoomTypes(searchTerm)
  }, [searchTerm])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchTerm(keywordInput)
  }

  const clearSearch = () => {
    setKeywordInput('')
    setSearchTerm('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete room type "${name}"? This cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      const res = await roomTypeService.delete(id)
      if (res.isSuccess) {
        fetchRoomTypes(searchTerm) // Refresh list
      } else {
        setError(res.message || 'Failed to delete room type')
        setLoading(false)
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err))
      setLoading(false)
    }
  }

  const hasActiveFilters = Boolean(searchTerm)

  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <h1>Room Types Management</h1>
          <p className="page-subtitle">View, search, and manage room categories in table format.</p>
        </div>
        <Link to="/admin/room-types/new" className="btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Room Type
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
              placeholder="Search room types by name..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search room types"
            />
            {keywordInput && (
              <button type="button" className="search-clear-btn" onClick={clearSearch} title="Clear search">
                ✕
              </button>
            )}
          </form>
          <div className="filter-dropdowns">
             {hasActiveFilters && (
              <button type="button" className="chip" onClick={clearSearch} title="Reset all filters">
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
                <th className="col-name">ROOM TYPE NAME</th>
                <th>DESCRIPTION</th>
                <th style={{ textAlign: 'center' }}>TOTAL ROOMS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ margin: 0, color: '#557268' }}>Loading room types...</p>
                  </td>
                </tr>
              ) : !data || data.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-empty-box">
                      <h3>No matching room types found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query to find what you are looking for.'
                          : 'No room types exist in the system yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn" onClick={clearSearch}>
                          Clear filters
                        </button>
                      ) : (
                        <Link to="/admin/room-types/new" className="btn">
                          + Add first room type
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((c, idx) => (
                    <tr key={c.id}>
                      <td className="col-idx">{idx + 1}</td>
                      <td className="col-name">{c.name}</td>
                      <td>{c.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description</span>}</td>
                      <td style={{ textAlign: 'center' }}>
                         <span className="status-pill active">{c.totalRooms} Rooms</span>
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <Link
                            to={`/admin/room-types/${c.id}/edit`}
                            className="btn-action edit"
                            title="Edit room type"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </Link>
                          
                          <button
                            type="button"
                            className="btn-action danger"
                            title="Delete room type"
                            onClick={() => handleDelete(c.id, c.name)}
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
      </div>
    </section>
  )
}

export default AdminRoomTypeListPage
