import React, { useEffect, useState } from 'react'
import { DogIcon, CatIcon, PawIcon } from '@/components/common/PetIcons'
import { Link, useNavigate } from 'react-router-dom'
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { App, Modal } from 'antd'
import { petService } from '@/services/pet.service'
import type { PetDTO } from '@/types/pet.types'
import { isCat } from '@/types/pet.types'
import { getApiErrorMessage } from '@/utils/apiError'

const CustomerPetListPage: React.FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [pets, setPets] = useState<PetDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [petToDelete, setPetToDelete] = useState<PetDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadCustomerPets = async () => {
    setLoading(true)
    setError('')
    try {
      // Sử dụng endpoint /api/Pets/my-pets — backend đọc customerId từ JWT token
      const myPets = await petService.fetchMyPets(true)
      setPets(myPets.filter((p: any) => p.isActive !== false && !p.isDeleted))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomerPets()
  }, [])

  const handleConfirmDelete = async () => {
    if (!petToDelete) return
    setDeleting(true)
    try {
      await petService.delete(petToDelete.id)
      message.success(`Pet "${petToDelete.name}" removed successfully.`)
      setPetToDelete(null)
      loadCustomerPets()
    } catch (err) {
      message.error(getApiErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#faf2e9',
              color: '#785839',
              border: '1px solid #eeddc8',
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              marginBottom: '0.5rem',
            }}
          >
            My Pet Family
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', color: '#0f172a' }}>
            My Pets
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Manage profiles and health information for your dogs and cats.
          </p>
        </div>

        <Link
          to="/customer/pets/new"
          className="btn"
          style={{
            padding: '0.75rem 1.4rem',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>+</span> Register New Pet
        </Link>
      </div>

      {error && (
        <p className="msg error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </p>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          <p style={{ fontSize: '1.1rem' }}>Loading your pets...</p>
        </div>
      ) : pets.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
            padding: '4rem 2rem',
            textAlign: 'center',
            maxWidth: '560px',
            margin: '2rem auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1rem', color: '#6366f1' }}><DogIcon size={48} /><CatIcon size={48} /></div>
          <h2 style={{ fontSize: '1.35rem', color: '#1e293b', marginBottom: '0.5rem' }}>
            No Pets Registered Yet
          </h2>
          <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Add your beloved furry companions to easily book grooming appointments, hotel stays, and personalized nutrition diets.
          </p>
          <Link to="/customer/pets/new" className="btn">
            + Register Your First Pet
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
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
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '12px',
                          background: isPetCat ? '#faf5ff' : '#faf2e9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.8rem',
                        }}
                      >
                        {speciesIcon}
                      </div>
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            color: '#0f172a',
                            fontWeight: 700,
                          }}
                        >
                          {pet.name}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: '#64748b',
                            fontWeight: 500,
                          }}
                        >
                          {pet.breed || `${speciesLabel} breed`}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: isPetCat ? '#f3e8ff' : '#e0f2fe',
                        color: isPetCat ? '#7e22ce' : '#0369a1',
                      }}
                    >
                      {speciesLabel}
                    </span>
                  </div>

                  {/* Attributes Badges */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #f1f5f9',
                        fontSize: '0.85rem',
                      }}
                    >
                      Weight: <strong>{pet.weight}</strong> kg
                    </div>

                    {pet.age !== undefined && pet.age !== null && (
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid #f1f5f9',
                          fontSize: '0.85rem',
                        }}
                      >
                        Age: <strong>{pet.age}</strong> years old
                      </div>
                    )}
                  </div>

                  {/* Health notes snippet */}
                  {pet.healthNotes && (
                    <div
                      style={{
                        background: '#fefce8',
                        color: '#713f12',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        marginBottom: '1rem',
                        border: '1px solid #fef08a',
                      }}
                    >
                      <strong>🩺 Care notes:</strong> {pet.healthNotes}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '1rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <Link
                    to={`/customer/pets/${pet.id}`}
                    className="btn-action view"
                    style={{ flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <EyeOutlined /> View
                  </Link>
                  <Link
                    to={`/customer/pets/${pet.id}/edit`}
                    className="btn-action edit"
                    style={{ flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <EditOutlined /> Edit
                  </Link>
                  <button
                    type="button"
                    className="btn-action danger"
                    style={{ flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setPetToDelete(pet)}
                    title="Delete pet"
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
      {petToDelete && (
        <Modal
          open={Boolean(petToDelete)}
          title={`Remove "${petToDelete.name}"?`}
          okText="Remove Pet"
          okType="danger"
          confirmLoading={deleting}
          onOk={handleConfirmDelete}
          onCancel={() => setPetToDelete(null)}
        >
          <p>
            Are you sure you want to remove <strong>{petToDelete.name}</strong> from your registered pets?
          </p>
        </Modal>
      )}
    </div>
  )
}

export default CustomerPetListPage
