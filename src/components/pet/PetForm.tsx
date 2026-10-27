import React, { useEffect, useState, useRef, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ImageUpload from '@/components/common/ImageUpload'
import { petService } from '@/services/pet.service'
import { customerService } from '@/services/customer.service'
import type { CustomerDTO } from '@/types/customer.types'
import { PetSpecies, isCat } from '@/types/pet.types'
import { getApiErrorMessage } from '@/utils/apiError'

interface PetFormProps {
  backPath: string // e.g. '/admin/pets' or '/staff/pets' or '/customer/pets'
  fixedCustomerId?: string // If provided (e.g. for customer), don't ask to choose customer
}

export const PetForm: React.FC<PetFormProps> = ({ backPath, fixedCustomerId }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [customerId, setCustomerId] = useState(fixedCustomerId || '')
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [species, setSpecies] = useState<number>(PetSpecies.Dog)
  const [breed, setBreed] = useState('')
  const [weight, setWeight] = useState<number | string>('')
  const [age, setAge] = useState<number | string>('')
  const [healthNotes, setHealthNotes] = useState('')
  const [ownerName, setOwnerName] = useState('')

  // Customer options for Admin & Staff
  const [customers, setCustomers] = useState<CustomerDTO[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchCustomerOptions = (searchQuery = '') => {
    setLoadingCustomers(true)
    customerService
      .fetchWithPagination({
        searchTerm: searchQuery.trim() || undefined,
        pageSize: 50,
        isActive: true,
      })
      .then((res: any) => {
        const items = res?.result?.items ?? res?.items ?? []
        setCustomers(items)
        // Pre-select first customer only on initial load if none selected
        if (!editing && !customerId && items.length > 0 && !searchQuery) {
          setCustomerId(items[0].id)
          setCustomerSearch(items[0].fullName)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCustomers(false))
  }

  // Initial fetch for customers
  useEffect(() => {
    if (!fixedCustomerId) {
      fetchCustomerOptions()
    }
  }, [fixedCustomerId])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchCustomers = (val: string) => {
    setCustomerSearch(val)
    setCustomerId('')
    setShowDropdown(true)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      fetchCustomerOptions(val)
    }, 300)
  }

  const selectCustomer = (c: CustomerDTO) => {
    setCustomerId(c.id)
    setCustomerSearch(c.fullName)
    setShowDropdown(false)
  }

  // Load existing pet when editing
  useEffect(() => {
    if (!id) return
    setLoading(true)
    petService
      .fetchById(id)
      .then((pet) => {
        setName(pet.name)
        setImageUrl(pet.imageUrl || '')
        setSpecies(isCat(pet.species) ? PetSpecies.Cat : PetSpecies.Dog)
        setBreed(pet.breed || '')
        setWeight(pet.weight || '')
        setAge(pet.age !== undefined && pet.age !== null ? pet.age : '')
        setHealthNotes(pet.healthNotes || '')
        setCustomerId(pet.customerId || '')
        setOwnerName(pet.ownerName || '')
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [id])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanName = name.trim()
    if (!cleanName) {
      setError('Pet name is required.')
      return
    }

    if (!editing && !customerId) {
      setError('Please select a customer / pet owner.')
      return
    }

    const numWeight = Number(weight)
    if (isNaN(numWeight) || numWeight <= 0) {
      setError('Please enter a valid weight greater than 0 kg.')
      return
    }

    const numAge = age === '' ? undefined : Number(age)
    if (numAge !== undefined && (isNaN(numAge) || numAge < 0)) {
      setError('Please enter a valid age.')
      return
    }

    const speciesValue = isCat(species) ? PetSpecies.Cat : PetSpecies.Dog

    setSaving(true)
    try {
      if (editing) {
        await petService.update(id as string, {
          name: cleanName,
          species: speciesValue,
          breed: breed.trim() || undefined,
          weight: numWeight,
          age: numAge,
          healthNotes: healthNotes.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        })
      } else {
        await petService.create({
          customerId,
          name: cleanName,
          species: speciesValue,
          breed: breed.trim() || undefined,
          weight: numWeight,
          age: numAge,
          healthNotes: healthNotes.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        })
      }
      navigate(backPath)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page" style={{ maxWidth: '780px' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{editing ? 'Edit Pet' : 'Register New Pet'}</h1>
          <p className="page-subtitle">
            {editing
              ? 'Update pet health details, breed, and weight.'
              : 'Add a new dog or cat to the system.'}
          </p>
        </div>
        <Link to={backPath} className="btn btn-secondary">
          ← Back
        </Link>
      </div>

      {loading && <p>Loading pet details...</p>}

      <form onSubmit={onSubmit} className="form" hidden={loading}>
        {error && (
          <p className="msg error" role="alert" style={{ margin: '0 0 1rem 0' }}>
            {error}
          </p>
        )}

        {/* Customer / Owner Selection */}
        {!fixedCustomerId && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem',
              }}
            >
              <label
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: 'var(--slate-800)',
                }}
              >
                Owner (Customer) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Type name, email, or phone to search
              </span>
            </div>

            {editing ? (
              <input
                type="text"
                value={ownerName ? `${ownerName} (ID: ${customerId})` : customerId}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
            ) : (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => handleSearchCustomers(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search owner by name, email, or phone number..."
                  autoComplete="off"
                />
                {showDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      zIndex: 1000,
                      maxHeight: 220,
                      overflowY: 'auto',
                    }}
                  >
                    {loadingCustomers ? (
                      <div style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>
                        Searching customers...
                      </div>
                    ) : customers.length === 0 ? (
                      <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem' }}>
                        No matching customers found
                      </div>
                    ) : (
                      customers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => selectCustomer(c)}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            borderBottom: '1px solid #f1f5f9',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.fullName}</span>
                          <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
                            {[c.email, c.phoneNumber].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Compact row: Avatar + Name + Species */}
        <div className="pet-basic-info" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '10px 14px', borderRadius: '8px' }}>
          <ImageUpload
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
            folder="pets"
            shape="circle"
            width={72}
            height={72}
            title="Photo"
            helperText="Max 5MB"
            disabled={saving}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'var(--slate-800)' }}>
              Pet Name <span style={{ color: 'var(--danger)' }}>*</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bella, Max, Luna"
                required
                style={{ marginTop: '2px', padding: '0.4rem', borderRadius: '4px' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Species:</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                <input
                  type="radio"
                  name="species"
                  value={PetSpecies.Dog}
                  checked={!isCat(species)}
                  onChange={() => setSpecies(PetSpecies.Dog)}
                />
                Dog
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                <input
                  type="radio"
                  name="species"
                  value={PetSpecies.Cat}
                  checked={isCat(species)}
                  onChange={() => setSpecies(PetSpecies.Cat)}
                />
                Cat
              </label>
            </div>
          </div>
        </div>

        {/* Breed, Age, Weight in 1 Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.75rem' }}>
          <label>
            Breed
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="e.g. Golden Retriever"
            />
          </label>

          <label>
            Age (years)
            <input
              type="number"
              min="0"
              max="50"
              step="1"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 2"
            />
          </label>

          <label>
            Weight (kg) <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="number"
              min="0.1"
              max="150"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 8.5"
              required
            />
          </label>
        </div>

        {/* Health Notes */}
        <label>
          Health &amp; Special Care Notes
          <textarea
            rows={2}
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            placeholder="Allergies, vaccination status, dietary preferences, or behavioral notes..."
          />
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update Pet' : 'Register Pet'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving}
            onClick={() => navigate(backPath)}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default PetForm
