import React, { useEffect, useState, type FormEvent } from 'react'
import { App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { petService } from '@/services/pet.service'
import type { PetDTO } from '@/types/pet.types'
import {
  PetSpecies,
  isCat,
  getPetSpeciesLabel,
  getPetSpeciesIcon,
} from '@/types/pet.types'
import { getApiErrorMessage } from '@/utils/apiError'
import PetDetailModal from './PetDetailModal'

interface PetManagementTableProps {
  basePath: string // e.g. '/admin/pets' or '/staff/pets'
  title?: string
  subtitle?: string
}

export const PetManagementTable: React.FC<PetManagementTableProps> = ({
  basePath,
  title = 'Pet Management',
  subtitle = 'List and manage pets registered in the system.',
}) => {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [species, setSpecies] = useState<'all' | 'dog' | 'cat'>('all')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reload, setReload] = useState(0)

  const [data, setData] = useState<IPagedResult<PetDTO> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedPet, setSelectedPet] = useState<PetDTO | null>(null)
  const [petToDelete, setPetToDelete] = useState<PetDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const speciesParam =
      species === 'dog' ? PetSpecies.Dog : species === 'cat' ? PetSpecies.Cat : undefined
    const activeParam =
      status === 'all' ? undefined : status === 'active'

    petService
      .fetchWithPagination({
        keyword: keyword || undefined,
        species: speciesParam,
        pageIndex: page,
        pageSize,
        isActive: activeParam,
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
  }, [page, pageSize, keyword, species, status, reload])

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
    setSpecies('all')
    setStatus('all')
    setPage(1)
  }

  const hasActiveFilters = Boolean(keyword || species !== 'all' || status !== 'all')

  const handleConfirmDelete = async () => {
    if (!petToDelete) return
    setDeleting(true)
    try {
      await petService.delete(petToDelete.id)
      message.success(`Pet "${petToDelete.name}" deactivated successfully.`)
      setPetToDelete(null)
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
          <h1>{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => navigate(`${basePath}/new`)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add pet
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
              placeholder="Search pets by name..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search pets by name"
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

        {/* Species Filter Chips like Service category chips */}
        <div className="type-chips-row">
          <span className="type-chips-label">Species:</span>
          <button
            type="button"
            className={species === 'all' ? 'chip on' : 'chip'}
            onClick={() => {
              setPage(1)
              setSpecies('all')
            }}
          >
            All
          </button>
          <button
            type="button"
            className={species === 'dog' ? 'chip on' : 'chip'}
            onClick={() => {
              setPage(1)
              setSpecies('dog')
            }}
          >
            🐶 Dogs
          </button>
          <button
            type="button"
            className={species === 'cat' ? 'chip on' : 'chip'}
            onClick={() => {
              setPage(1)
              setSpecies('cat')
            }}
          >
            🐱 Cats
          </button>
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
                <th>PET NAME</th>
                <th>SPECIES</th>
                <th>BREED</th>
                <th>WEIGHT</th>
                <th>AGE</th>
                <th className="col-status">STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: 'center', padding: '3rem 1rem' }}
                  >
                    <p style={{ margin: 0, color: '#557268' }}>
                      Loading pets...
                    </p>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="table-empty-box">
                      <h3>No matching pets found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query or filters.'
                          : 'No pets have been registered yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          className="btn"
                          onClick={resetAllFilters}
                        >
                          Clear filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => navigate(`${basePath}/new`)}
                        >
                          + Add first pet
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((pet, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1
                  const isPetCat = isCat(pet.species)
                  const speciesLabel = isPetCat ? 'Cat' : 'Dog'
                  const speciesIcon = isPetCat ? '🐱' : '🐶'

                  return (
                    <tr
                      key={pet.id}
                      className={pet.isActive ? '' : 'row-inactive'}
                    >
                      <td className="col-idx">{rowNumber}</td>
                      <td>
                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span>{speciesIcon}</span> {pet.name}
                        </strong>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: isPetCat ? '#f3e8ff' : '#e0f2fe',
                            color: isPetCat ? '#7e22ce' : '#0369a1',
                          }}
                        >
                          {speciesLabel}
                        </span>
                      </td>
                      <td>{pet.breed || '—'}</td>
                      <td>{pet.weight ? `${pet.weight} kg` : '—'}</td>
                      <td>{pet.age !== undefined && pet.age !== null ? `${pet.age} yr` : '—'}</td>
                      <td className="col-status">
                        <span
                          className={`status-pill ${
                            pet.isActive ? 'active' : 'inactive'
                          }`}
                        >
                          <span className="status-dot"></span>
                          {pet.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <button
                            type="button"
                            className="btn-action view"
                            onClick={() => setSelectedPet(pet)}
                            title="View pet details"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn-action edit"
                            onClick={() => navigate(`${basePath}/${pet.id}/edit`)}
                            title="Edit pet"
                          >
                            Edit
                          </button>
                          {pet.isActive && (
                            <button
                              type="button"
                              className="btn-action danger"
                              onClick={() => setPetToDelete(pet)}
                              title="Deactivate pet"
                            >
                              Delete
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
              Showing {startEntry} to {endEntry} of {totalCount} pets
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

      {/* Pet Detail Modal */}
      <PetDetailModal
        pet={selectedPet}
        open={Boolean(selectedPet)}
        onClose={() => setSelectedPet(null)}
      />

      {/* Delete / Deactivate Confirmation Dialog */}
      {petToDelete && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div className="confirm-icon danger">⚠️</div>
            <h3>Deactivate Pet?</h3>
            <p>
              Are you sure you want to deactivate{' '}
              <strong>"{petToDelete.name}"</strong>?
              <br />
              The pet record will be marked as inactive.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleting}
                onClick={() => setPetToDelete(null)}
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
                {deleting ? 'Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PetManagementTable
