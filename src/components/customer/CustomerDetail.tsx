import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { customerService } from '@/services/customer.service'
import { petService } from '@/services/pet.service'
import type { CustomerDetailDTO } from '@/types/customer.types'
import type { PetDTO } from '@/types/pet.types'
import { isCat, getPetSpeciesIcon, getPetSpeciesLabel } from '@/types/pet.types'
import { getApiErrorMessage } from '@/utils/apiError'

interface CustomerDetailProps {
  backTo?: string
  editTo?: (id: string) => string
}

export default function CustomerDetail({ backTo, editTo }: CustomerDetailProps) {
  const { id = '' } = useParams()
  const location = useLocation()
  const isStaff = location.pathname.startsWith('/staff')
  const defaultBackTo = isStaff ? '/staff/customers' : '/admin/customers'
  const resolvedBackTo = backTo || defaultBackTo
  const resolvedEditTo = editTo || ((cid: string) => `${isStaff ? '/staff/customers' : '/admin/customers'}/${cid}/edit`)

  const [customer, setCustomer] = useState<CustomerDetailDTO | null>(null)
  const [pets, setPets] = useState<PetDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      customerService.fetchById(id),
      petService.fetchByCustomerId(id).catch(() => [] as PetDTO[]),
    ])
      .then(([res, petsList]) => {
        if (!cancelled) {
          const custData = (res as any)?.result ?? res
          setCustomer(custData)
          setPets(petsList || [])
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
        <p style={{ color: '#557268', padding: '2rem 0' }}>Loading customer details...</p>
      </section>
    )
  }

  if (error || !customer) {
    return (
      <section className="page narrow">
        <p className="msg error" role="alert">{error || 'Customer not found.'}</p>
        <Link to={resolvedBackTo} className="btn btn-secondary">
          ← Back to customers
        </Link>
      </section>
    )
  }

  const petBase = isStaff ? '/staff/pets' : '/admin/pets'

  return (
    <section className="page narrow">
      <div className="page-head">
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0369a1', background: '#e0f2fe', padding: '0.2rem 0.75rem', borderRadius: '999px', border: '1px solid #bae6fd' }}>
            👤 Customer Profile
          </span>
          <h1 style={{ marginTop: '0.5rem' }}>{customer.fullName}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {resolvedEditTo && (
            <Link to={resolvedEditTo(customer.id)} className="btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Customer
            </Link>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.75rem', marginBottom: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#785839', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem' }}>
              {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{customer.fullName}</div>
              <div style={{ fontSize: '0.88rem', color: '#64748b' }}>Customer ID: {customer.id}</div>
            </div>
          </div>
          <span className={`status-pill ${customer.isActive ? 'active' : 'inactive'}`}>
            <span className="status-dot"></span>
            {customer.isActive ? 'Active Account' : 'Inactive Account'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
              <a href={`mailto:${customer.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{customer.email}</a>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
              <a href={`tel:${customer.phoneNumber}`} style={{ color: 'inherit', textDecoration: 'none' }}>{customer.phoneNumber || '—'}</a>
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address</div>
            <div style={{ fontSize: '0.98rem', color: '#334155', marginTop: '0.2rem' }}>{customer.address || 'No address provided'}</div>
          </div>
          {customer.createdAt && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registered Date</div>
              <div style={{ fontSize: '0.95rem', color: '#334155', marginTop: '0.2rem' }}>
                {new Date(customer.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer's Pets Section */}
      <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.75rem', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Registered Pets</h3>
            <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              {pets.length} pet(s) registered under this customer account.
            </p>
          </div>
        </div>

        {pets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
            <p style={{ margin: 0, color: '#64748b' }}>No pets registered for this customer yet.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pet Name</th>
                  <th>Species</th>
                  <th>Breed</th>
                  <th>Weight</th>
                  <th>Age</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pets.map((p) => {
                  const isPetCat = isCat(p.species)
                  const speciesIcon = getPetSpeciesIcon(p.species)
                  const speciesLabel = getPetSpeciesLabel(p.species)

                  return (
                    <tr key={p.id}>
                      <td>
                        <Link
                          to={`${petBase}/${p.id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <span>{speciesIcon}</span>
                          )}
                          <span>{p.name}</span>
                        </Link>
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: isPetCat ? '#f3e8ff' : '#e0f2fe',
                          color: isPetCat ? '#7e22ce' : '#0369a1',
                        }}>
                          {speciesIcon} {speciesLabel}
                        </span>
                      </td>
                      <td>{p.breed || '—'}</td>
                      <td>{p.weight ? `${p.weight} kg` : '—'}</td>
                      <td>{p.age !== undefined && p.age !== null ? `${p.age} yr` : '—'}</td>
                      <td className="col-actions">
                        <Link to={`${petBase}/${p.id}`} className="btn-action view" title="View pet details">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link to={resolvedBackTo} className="btn btn-secondary">
          ← Back to customers
        </Link>
      </div>
    </section>
  )
}
