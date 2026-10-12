import React from 'react'
import type { PetDTO } from '@/types/pet.types'
import { isCat, getPetSpeciesLabel, getPetSpeciesIcon } from '@/types/pet.types'

interface PetDetailModalProps {
  pet: PetDTO | null
  open: boolean
  onClose: () => void
}

export const PetDetailModal: React.FC<PetDetailModalProps> = ({ pet, open, onClose }) => {
  if (!open || !pet) return null

  const isPetCat = isCat(pet.species)
  const speciesLabel = getPetSpeciesLabel(pet.species)
  const speciesIcon = getPetSpeciesIcon(pet.species)

  return (
    <div
      className="confirm-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Pet details for ${pet.name}`}
    >
      <div
        className="confirm-dialog"
        style={{ maxWidth: 520, width: '95vw', textAlign: 'left', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '18px 22px',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0f9ff 100%)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {pet.imageUrl ? (
            <img
              src={pet.imageUrl}
              alt={pet.name}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #a7f3d0',
                flexShrink: 0,
              }}
            />
          ) : (
            <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>{speciesIcon}</span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              {pet.name}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Pet Details &amp; Health Info
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '1.3rem',
              color: '#94a3b8',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <tbody>
              {[
                {
                  label: 'Species',
                  value: (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: isPetCat ? '#f3e8ff' : '#e0f2fe',
                        color: isPetCat ? '#7e22ce' : '#0369a1',
                      }}
                    >
                      {speciesIcon} {speciesLabel}
                    </span>
                  ),
                },
                { label: 'Breed', value: pet.breed || <span style={{ color: '#94a3b8' }}>Not specified</span> },
                { label: 'Weight', value: <strong>{pet.weight} kg</strong> },
                {
                  label: 'Age',
                  value: pet.age !== undefined && pet.age !== null
                    ? `${pet.age} year(s) old`
                    : <span style={{ color: '#94a3b8' }}>Not specified</span>,
                },
                ...(pet.ownerName
                  ? [{ label: 'Owner', value: <strong>{pet.ownerName}</strong> }]
                  : []),
                {
                  label: 'Status',
                  value: (
                    <span className={`status-pill ${pet.isActive ? 'active' : 'inactive'}`}>
                      <span className="status-dot" />
                      {pet.isActive ? 'Active' : 'Inactive'}
                    </span>
                  ),
                },
                ...(pet.createdAt
                  ? [{ label: 'Registered', value: new Date(pet.createdAt).toLocaleDateString() }]
                  : []),
              ].map(({ label, value }) => (
                <tr key={label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td
                    style={{
                      padding: '9px 12px 9px 0',
                      color: '#64748b',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'top',
                      width: 120,
                    }}
                  >
                    {label}
                  </td>
                  <td style={{ padding: '9px 0', color: '#0f172a' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Health Notes */}
          {pet.healthNotes && (
            <div style={{ marginTop: 14 }}>
              <p
                style={{
                  margin: '0 0 6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  color: '#64748b',
                }}
              >
                Health &amp; Diet Notes
              </p>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  whiteSpace: 'pre-line',
                  fontSize: '0.9rem',
                  color: '#334155',
                  lineHeight: 1.6,
                }}
              >
                {pet.healthNotes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PetDetailModal
