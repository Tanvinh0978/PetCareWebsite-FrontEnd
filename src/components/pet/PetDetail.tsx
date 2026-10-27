import { DogIcon, CatIcon } from '@/components/common/PetIcons'
import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { petService } from '@/services/pet.service'
import { customerService } from '@/services/customer.service'
import type { PetDTO } from '@/types/pet.types'
import { isCat, getPetSpeciesIcon, getPetSpeciesLabel } from '@/types/pet.types'
import { getApiErrorMessage } from '@/utils/apiError'

interface PetDetailProps {
  backTo?: string
  editTo?: (id: string) => string
}

export default function PetDetail({ backTo, editTo }: PetDetailProps) {
  const { id = '' } = useParams()
  const location = useLocation()
  const isStaff = location.pathname.startsWith('/staff')
  const isCustomer = location.pathname.startsWith('/customer')
  const defaultBackTo = isCustomer ? '/customer/pets' : isStaff ? '/staff/pets' : '/admin/pets'
  const resolvedBackTo = backTo || defaultBackTo
  const resolvedEditTo = editTo || ((pid: string) => `${defaultBackTo}/${pid}/edit`)

  const [pet, setPet] = useState<PetDTO | null>(null)
  const [ownerInfo, setOwnerInfo] = useState<{ id?: string; name?: string; phone?: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    petService
      .fetchById(id)
      .then(async (res: any) => {
        if (cancelled) return
        const petData: PetDTO = res?.result ?? res
        setPet(petData)

        // Try resolving owner details if customerId is present
        if (petData?.customerId) {
          try {
            const custRes = await customerService.fetchById(petData.customerId)
            const cust = (custRes as any)?.result ?? custRes
            if (!cancelled && cust) {
              setOwnerInfo({
                id: cust.id,
                name: cust.fullName || petData.ownerName,
                phone: cust.phoneNumber,
                email: cust.email,
              })
            }
          } catch {
            if (!cancelled && petData.ownerName) {
              setOwnerInfo({ name: petData.ownerName })
            }
          }
        } else if (petData?.ownerName) {
          setOwnerInfo({ name: petData.ownerName })
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
  }, [id])

  if (loading) {
    return (
      <section className="page narrow">
        <p style={{ color: '#557268', padding: '2rem 0' }}>Loading pet details...</p>
      </section>
    )
  }

  if (error || !pet) {
    return (
      <section className="page narrow">
        <p className="msg error" role="alert">{error || 'Pet not found.'}</p>
        <Link to={resolvedBackTo} className="btn btn-secondary">
          ← Back to pets
        </Link>
      </section>
    )
  }

  const isPetCat = isCat(pet.species)
  const speciesIcon = isPetCat ? <CatIcon size={16} /> : <DogIcon size={16} />
  const speciesLabel = getPetSpeciesLabel(pet.species)
  const customerBase = isStaff ? '/staff/customers' : '/admin/customers'

  return (
    <section className="page narrow">
      <div className="page-head">
        <div>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '0.2rem 0.75rem',
              borderRadius: '999px',
              border: '1px solid',
              background: isPetCat ? '#f3e8ff' : '#e0f2fe',
              color: isPetCat ? '#7e22ce' : '#0369a1',
              borderColor: isPetCat ? '#e9d5ff' : '#bae6fd',
            }}
          >
            {speciesLabel} Profile
          </span>
          <h1 style={{ marginTop: '0.5rem' }}>{pet.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {resolvedEditTo && (
            <Link to={resolvedEditTo(pet.id)} className="btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Pet
            </Link>
          )}
        </div>
      </div>

      {/* Hero / Overview Card */}
      <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.75rem', marginBottom: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.25rem' }}>
          {pet.imageUrl ? (
            <img
              src={pet.imageUrl}
              alt={pet.name}
              style={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #785839',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          ) : (
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                background: isPetCat ? '#f3e8ff' : '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.75rem',
                border: '2px solid #cbd5e1',
              }}
            >
              {speciesIcon}
            </div>
          )}

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>{pet.name}</h2>
              <span className={`status-pill ${pet.isActive ? 'active' : 'inactive'}`}>
                <span className="status-dot"></span>
                {pet.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.92rem' }}>
              {speciesLabel} • {pet.breed || 'Mixed Breed'}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Species</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', marginTop: '0.2rem' }}>
              {speciesIcon} {speciesLabel}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Breed</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
              {pet.breed || 'Not specified'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Weight</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', marginTop: '0.2rem' }}>
              {pet.weight ? `${pet.weight} kg` : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Age</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
              {pet.age !== undefined && pet.age !== null ? `${pet.age} year(s) old` : 'Not specified'}
            </div>
          </div>

          {/* Owner details */}
          {ownerInfo && (
            <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                Owner Information
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{ownerInfo.name || 'Customer'}</span>
                  {ownerInfo.phone && <span style={{ marginLeft: '12px', color: '#64748b', fontSize: '0.9rem' }}>Phone: {ownerInfo.phone}</span>}
                  {ownerInfo.email && <span style={{ marginLeft: '12px', color: '#64748b', fontSize: '0.9rem' }}>Email: {ownerInfo.email}</span>}
                </div>
                {ownerInfo.id && !isCustomer && (
                  <Link to={`${customerBase}/${ownerInfo.id}`} className="btn-action view" style={{ textDecoration: 'none' }}>
                    View Owner Profile →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Health Notes Card */}
      <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.75rem', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem' }}>🩺 Health Notes & Special Care Instructions</h3>
        {pet.healthNotes ? (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem 1.25rem', color: '#92400e', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {pet.healthNotes}
          </div>
        ) : (
          <p style={{ color: '#64748b', margin: 0, fontStyle: 'italic' }}>No special health notes or dietary instructions recorded for this pet.</p>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link to={resolvedBackTo} className="btn btn-secondary">
          ← Back to pets
        </Link>
      </div>
    </section>
  )
}
