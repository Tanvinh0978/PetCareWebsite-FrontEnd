import React, { useEffect, useState, useRef, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Select, Spin } from 'antd'
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
  const [species, setSpecies] = useState<number>(PetSpecies.Dog)
  const [breed, setBreed] = useState('')
  const [weight, setWeight] = useState<number | string>('')
  const [age, setAge] = useState<number | string>('')
  const [healthNotes, setHealthNotes] = useState('')
  const [ownerName, setOwnerName] = useState('')

  // Customer options for Admin & Staff
  const [customers, setCustomers] = useState<CustomerDTO[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const searchTimeoutRef = useRef<any>(null)

  const fetchCustomerOptions = (searchQuery = '') => {
    setLoadingCustomers(true)
    customerService
      .fetchWithPagination({
        searchTerm: searchQuery.trim() || undefined,
        pageSize: 50,
        isActive: true,
      })
      .then((res) => {
        if (res?.result?.items) {
          setCustomers(res.result.items)
          // Pre-select first customer only on initial load if none selected
          if (!editing && !customerId && res.result.items.length > 0 && !searchQuery) {
            setCustomerId(res.result.items[0].id)
          }
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

  const handleSearchCustomers = (val: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchCustomerOptions(val)
    }, 300)
  }

  // Load existing pet when editing
  useEffect(() => {
    if (!id) return
    setLoading(true)
    petService
      .fetchById(id)
      .then((pet) => {
        setName(pet.name)
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
              <Select
                showSearch
                value={customerId || undefined}
                placeholder="Search owner by name, email, or phone number..."
                notFoundContent={
                  loadingCustomers ? (
                    <div style={{ padding: '8px', textAlign: 'center' }}>
                      <Spin size="small" /> Searching customers...
                    </div>
                  ) : (
                    'No matching customers found'
                  )
                }
                loading={loadingCustomers}
                filterOption={false}
                onSearch={handleSearchCustomers}
                onChange={(val) => setCustomerId(val || '')}
                style={{ width: '100%' }}
                size="large"
                allowClear
                options={customers.map((c) => ({
                  value: c.id,
                  label: (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {c.fullName}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
                        {[c.email, c.phoneNumber].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                  ),
                }))}
              />
            )}
          </div>
        )}

        {/* Pet Name */}
        <label>
          Pet Name <span style={{ color: 'var(--danger)' }}>*</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bella, Max, Luna"
            required
          />
        </label>

        {/* Species */}
        <label>
          Species <span style={{ color: 'var(--danger)' }}>*</span>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <input
                type="radio"
                name="species"
                value={PetSpecies.Dog}
                checked={!isCat(species)}
                onChange={() => setSpecies(PetSpecies.Dog)}
              />
              🐶 Dog
            </label>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <input
                type="radio"
                name="species"
                value={PetSpecies.Cat}
                checked={isCat(species)}
                onChange={() => setSpecies(PetSpecies.Cat)}
              />
              🐱 Cat
            </label>
          </div>
        </label>

        {/* Breed & Age */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label>
            Breed
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="e.g. Golden Retriever, British Shorthair"
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
        </div>

        {/* Weight */}
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

        {/* Health Notes */}
        <label>
          Health & Special Care Notes
          <textarea
            rows={4}
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
