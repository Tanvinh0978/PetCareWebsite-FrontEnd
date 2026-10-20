import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { staffService } from '@/services/staff.service'
import type { StaffDTO } from '@/types/staff.types'
import { getApiErrorMessage } from '@/utils/apiError'

interface StaffDetailProps {
  backTo?: string
  editTo?: (id: string) => string
}

const getRoleBadgeStyle = (roleName: string) => {
  const lower = roleName.toLowerCase()
  if (lower.includes('admin')) {
    return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' }
  }
  if (lower.includes('receptionist')) {
    return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }
  }
  if (lower.includes('boarding')) {
    return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
  }
  if (lower.includes('grooming')) {
    return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' }
  }
  return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' }
}

export default function StaffDetail({ backTo, editTo }: StaffDetailProps) {
  const { id = '' } = useParams()
  const location = useLocation()
  const isStaff = location.pathname.startsWith('/staff')
  const defaultBackTo = isStaff ? '/staff/staff' : '/admin/staff'
  const resolvedBackTo = backTo || defaultBackTo
  const resolvedEditTo = editTo || ((sid: string) => `${defaultBackTo}/${sid}/edit`)

  const [staff, setStaff] = useState<StaffDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    staffService
      .fetchById(id)
      .then((data) => {
        if (!cancelled) setStaff(data)
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
        <p style={{ color: '#557268', padding: '2rem 0' }}>Loading staff member details...</p>
      </section>
    )
  }

  if (error || !staff) {
    return (
      <section className="page narrow">
        <p className="msg error" role="alert">{error || 'Staff member not found.'}</p>
        <Link to={resolvedBackTo} className="btn btn-secondary">
          ← Back to staff list
        </Link>
      </section>
    )
  }

  return (
    <section className="page narrow">
      <div className="page-head">
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#047857', background: '#ecfdf5', padding: '0.2rem 0.75rem', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
            💼 Staff Member Profile
          </span>
          <h1 style={{ marginTop: '0.5rem' }}>{staff.fullName}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {resolvedEditTo && (
            <Link to={resolvedEditTo(staff.id)} className="btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Staff
            </Link>
          )}
        </div>
      </div>

      {/* Main Staff Profile Card */}
      <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.75rem', marginBottom: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.35rem' }}>
              {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>{staff.fullName}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Staff ID: {staff.id}</div>
            </div>
          </div>
          <span className={`status-pill ${staff.status === 'Active' ? 'active' : 'inactive'}`}>
            <span className="status-dot"></span>
            {staff.status}
          </span>
        </div>

        {/* Roles Badges */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            Assigned Roles
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {staff.roles && staff.roles.length > 0 ? (
              staff.roles.map((r) => {
                const style = getRoleBadgeStyle(r)
                return (
                  <span
                    key={r}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: style.bg,
                      color: style.text,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {r}
                  </span>
                )
              })
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No roles assigned</span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
              <a href={`mailto:${staff.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{staff.email}</a>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
              <a href={`tel:${staff.phoneNumber}`} style={{ color: 'inherit', textDecoration: 'none' }}>{staff.phoneNumber || '—'}</a>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Experience</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', marginTop: '0.2rem' }}>
              {staff.yearsOfExperience} year(s)
            </div>
          </div>
          {staff.address && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address</div>
              <div style={{ fontSize: '0.98rem', color: '#334155', marginTop: '0.2rem' }}>{staff.address}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link to={resolvedBackTo} className="btn btn-secondary">
          ← Back to staff list
        </Link>
      </div>
    </section>
  )
}
