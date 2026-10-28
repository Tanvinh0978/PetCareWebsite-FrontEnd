import React, { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { DogIcon, CatIcon } from '@/components/common/PetIcons'
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { petService } from '@/services/pet.service'
import { isCat } from '@/types/pet.types'
import type { PetDTO } from '@/types/pet.types'
import { getApiErrorMessage } from '@/utils/apiError'

const MyPetsPage: React.FC = () => {
  const [pets, setPets] = useState<PetDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [petToDelete, setPetToDelete] = useState<PetDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const fetchPets = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await petService.fetchMyPets(true)
      const list = Array.isArray(res) ? res : ((res as any)?.items || [])
      setPets(list.filter((p: any) => p.isActive !== false && !p.isDeleted))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPets()
  }, [])

  const handleDelete = (pet: PetDTO) => {
    setPetToDelete(pet)
  }

  const confirmDelete = async () => {
    if (!petToDelete) return
    setDeleting(true)
    try {
      await petService.delete(petToDelete.id)
      setPets((prev) => prev.filter((p) => p.id !== petToDelete.id))
      showToast(`"${petToDelete.name}" removed successfully.`)
      setPetToDelete(null)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="page wide">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: '#3d2d23',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: 10,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(38,24,15,0.20)',
            zIndex: 9999,
            fontSize: '0.9rem',
          }}
        >
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="page-head">
        <div>
          <h1>My Pets</h1>
          <p className="page-subtitle">Manage your furry family members.</p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => navigate('/customer/pets/new')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add New Pet
        </button>
      </div>

      {error && <p className="msg error" role="alert">{error}</p>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          Loading your pets...
        </div>
      ) : pets.length === 0 ? (
        <div className="table-empty-box" style={{ marginTop: '2rem' }}>
          <DogIcon size={48} style={{ color: "var(--primary)" }} />
          <h3>No pets yet</h3>
          <p>You haven't added any pets to your account yet.</p>
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/customer/pets/new')}
          >
            + Add your first pet
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginTop: '1rem',
          }}
        >
          {pets.map((pet) => {
            const isPetCat = isCat(pet.species)
            const speciesLabel = isPetCat ? 'Cat' : 'Dog'
            const speciesIcon = isPetCat ? <CatIcon size={16} /> : <DogIcon size={16} />

            return (
              <div
                key={pet.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)')}
              >
                {/* Card Image */}
                <div
                  style={{
                    height: 150,
                    background: isPetCat
                      ? 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)'
                      : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {pet.imageUrl ? (
                    <img
                      src={pet.imageUrl}
                      alt={pet.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ color: isPetCat ? '#7e22ce' : '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isPetCat ? <CatIcon size={56} /> : <DogIcon size={56} />}
                    </div>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: isPetCat ? '#7e22ce' : '#0369a1',
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 20,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {speciesLabel}
                  </span>
                </div>

                {/* Card Body */}
                <div style={{ padding: '14px 16px', flex: 1 }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    <Link to={`/customer/pets/${pet.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {pet.name}
                    </Link>
                  </h3>
                  <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#64748b' }}>
                    <strong>Breed:</strong> {pet.breed || 'N/A'}
                  </p>
                  <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#64748b' }}>
                    <strong>Weight:</strong> {pet.weight} kg
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    <strong>Age:</strong> {pet.age !== undefined && pet.age !== null ? `${pet.age} yr` : 'N/A'}
                  </p>
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <Link
                    to={`/customer/pets/${pet.id}`}
                    className="btn-action view"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    title="View Details"
                  >
                    <EyeOutlined /> View
                  </Link>
                  <Link
                    to={`/customer/pets/${pet.id}/edit`}
                    className="btn-action edit"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    title="Edit"
                  >
                    <EditOutlined /> Edit
                  </Link>
                  <button
                    type="button"
                    className="btn-action danger"
                    onClick={() => handleDelete(pet)}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    title="Delete"
                  >
                    <DeleteOutlined /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(petToDelete)}
        onCancel={() => setPetToDelete(null)}
        footer={null}
        centered
        width={420}
        destroyOnClose
        className="luxury-modal"
      >
        <div style={{ textAlign: 'center', padding: '16px 8px 8px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              margin: '0 auto 16px',
              border: '1px solid #fecaca',
            }}
          >
            <DeleteOutlined />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700, color: '#3d2d23' }}>
            Remove Pet?
          </h3>
          <p style={{ margin: '0 0 24px', color: '#6b5a4e', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Are you sure you want to remove <strong>"{petToDelete?.name}"</strong> from your account?
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={deleting}
              onClick={() => setPetToDelete(null)}
              style={{
                flex: 1,
                padding: '0.6rem 1.2rem',
                borderRadius: 8,
                backgroundColor: 'var(--paper, #fdf9f3)',
                borderColor: '#e8ded6',
                color: '#3d2d23',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              disabled={deleting}
              onClick={confirmDelete}
              style={{
                flex: 1,
                padding: '0.6rem 1.2rem',
                borderRadius: 8,
                backgroundColor: '#dc2626',
                borderColor: '#dc2626',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(220,38,38,0.25)',
              }}
            >
              {deleting ? 'Removing...' : 'Yes, Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default MyPetsPage
