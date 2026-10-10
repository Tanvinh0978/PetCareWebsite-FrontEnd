import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { petService } from '@/services/pet.service'
import type { PetDTO } from '@/types/pet.types'
import { PetSpecies, PetSpeciesText, PetSpeciesIcon, isCat } from '@/types/pet.types'
import PetDetailModal from '@/components/pet/PetDetailModal'

export default function StaffDashboardPage() {
  const [pets, setPets] = useState<PetDTO[]>([])
  const [totalPets, setTotalPets] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedPet, setSelectedPet] = useState<PetDTO | null>(null)

  useEffect(() => {
    let cancelled = false
    petService
      .fetchWithPagination({ pageSize: 5, isActive: true })
      .then((res) => {
        if (!cancelled) {
          setPets(res.items.slice(0, 5))
          setTotalPets(res.totalCount)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <h1>Staff Workspace</h1>
          <p className="page-subtitle">Daily operations, pet intake, and care records overview.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/staff/pets/new" className="btn">
            + Register Intake Pet
          </Link>
          <Link to="/staff/pets" className="btn btn-secondary">
            Manage Pets →
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Total Active Pets</span>
            <span style={{ fontSize: '1.25rem' }}>🐾</span>
          </div>
          <span className="stat-val">{loading ? '...' : totalPets}</span>
        </div>

        <div className="stat-card accent-active">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Quick Intake</span>
            <span style={{ fontSize: '1.25rem' }}>📋</span>
          </div>
          <span className="stat-val" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
            <Link to="/staff/pets/new" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              Add New Pet
            </Link>
          </span>
        </div>

        <div className="stat-card accent-types">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Pet Directory</span>
            <span style={{ fontSize: '1.25rem' }}>🔍</span>
          </div>
          <span className="stat-val" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
            <Link to="/staff/pets" style={{ color: '#2563eb', textDecoration: 'underline' }}>
              Search Directory
            </Link>
          </span>
        </div>
      </div>

      {/* Recent Pets In Care */}
      <div>
        <div className="page-head" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Recent Registered Pets</h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--slate-500)', fontSize: '0.9rem' }}>
              Latest dogs and cats checked into our care
            </p>
          </div>
          <Link to="/staff/pets" className="link" style={{ fontWeight: 700 }}>
            View all pets ({totalPets}) →
          </Link>
        </div>

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
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                      <p style={{ margin: 0, color: 'var(--slate-500)' }}>Loading pets...</p>
                    </td>
                  </tr>
                ) : pets.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="table-empty-box">
                        <h3>No pets found</h3>
                        <p>No pet intake records registered yet.</p>
                        <Link to="/staff/pets/new" className="btn">
                          + Register pet
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pets.map((pet, idx) => {
                    const isPetCat = isCat(pet.species)
                    const speciesLabel = isPetCat ? 'Cat' : 'Dog'
                    const speciesIcon = isPetCat ? '🐱' : '🐶'

                    return (
                      <tr key={pet.id}>
                        <td className="col-idx">{idx + 1}</td>
                        <td>
                          <strong>
                            {speciesIcon} {pet.name}
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
                          <span className={`status-pill ${pet.isActive ? 'active' : 'inactive'}`}>
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
                            >
                              View
                            </button>
                            <Link to={`/staff/pets/${pet.id}/edit`} className="btn-action edit">
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PetDetailModal
        pet={selectedPet}
        open={Boolean(selectedPet)}
        onClose={() => setSelectedPet(null)}
      />
    </section>
  )
}
