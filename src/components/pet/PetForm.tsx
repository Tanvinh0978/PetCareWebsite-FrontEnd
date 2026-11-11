import React, { useEffect, useState, useRef, useMemo, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Select } from 'antd'
import ImageUpload from '@/components/common/ImageUpload'
import { DogIcon, CatIcon, PawIcon } from '@/components/common/PetIcons'
import { POPULAR_DOG_BREEDS, POPULAR_CAT_BREEDS } from '@/pages/customer/PetFormPage'
import { petService } from '@/services/pet.service'
import { customerService } from '@/services/customer.service'
import type { CustomerDTO } from '@/types/customer.types'
import { PetSpecies, isCat } from '@/types/pet.types'
import { getApiErrorMessage } from '@/utils/apiError'

interface PetFormProps {
  backPath: string
  fixedCustomerId?: string
}

export const PetForm: React.FC<PetFormProps> = ({ backPath, fixedCustomerId }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [customerId, setCustomerId] = useState(fixedCustomerId || '')
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [species, setSpecies] = useState<number>(PetSpecies.Dog)
  const [selectedBreed, setSelectedBreed] = useState('')
  const [customBreed, setCustomBreed] = useState('')
  const [weight, setWeight] = useState<number | string>('')
  const [age, setAge] = useState<number | string>('')
  const [healthNotes, setHealthNotes] = useState('')
  const [ownerName, setOwnerName] = useState('')

  const [customers, setCustomers] = useState<CustomerDTO[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isCurrentCat = isCat(species)

  const breedList = useMemo(() => {
    return isCurrentCat ? POPULAR_CAT_BREEDS : POPULAR_DOG_BREEDS
  }, [isCurrentCat])

  const breedOptions = useMemo(() => {
    return breedList.map((b) => ({ value: b, label: b }))
  }, [breedList])

  const handleSpeciesChange = (newSpecies: number) => {
    setSpecies(newSpecies)
    const list = isCat(newSpecies) ? POPULAR_CAT_BREEDS : POPULAR_DOG_BREEDS
    if (selectedBreed && selectedBreed !== 'Other' && !list.includes(selectedBreed)) {
      setSelectedBreed('')
      setCustomBreed('')
    }
  }

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
        if (!editing && !customerId && items.length > 0 && !searchQuery) {
          setCustomerId(items[0].id)
          setCustomerSearch(items[0].fullName)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCustomers(false))
  }

  useEffect(() => {
    if (!fixedCustomerId) {
      fetchCustomerOptions()
    }
  }, [fixedCustomerId])

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

  useEffect(() => {
    if (!id) return
    setLoading(true)
    petService
      .fetchById(id)
      .then((pet) => {
        setName(pet.name)
        setImageUrl(pet.imageUrl || '')
        const sp = isCat(pet.species) ? PetSpecies.Cat : PetSpecies.Dog
        setSpecies(sp)

        const list = sp === PetSpecies.Cat ? POPULAR_CAT_BREEDS : POPULAR_DOG_BREEDS
        const currentBreed = pet.breed || ''
        if (list.includes(currentBreed)) {
          setSelectedBreed(currentBreed)
          setCustomBreed('')
        } else if (currentBreed) {
          setSelectedBreed('Other')
          setCustomBreed(currentBreed)
        } else {
          setSelectedBreed('')
          setCustomBreed('')
        }

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
    const finalBreed = selectedBreed === 'Other' ? (customBreed.trim() || 'Other') : (selectedBreed.trim() || undefined)

    setSaving(true)
    try {
      if (editing) {
        await petService.update(id as string, {
          name: cleanName,
          species: speciesValue,
          breed: finalBreed,
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
          breed: finalBreed,
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
    <section className="page" style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{editing ? 'Edit Pet' : 'Add New Pet'}</h1>
          <p className="page-subtitle">
            {editing
              ? 'Update pet health details, breed, and weight.'
              : 'Add a new dog or cat to the sanctuary database.'}
          </p>
        </div>
        <Link to={backPath} className="btn btn-secondary">
          ← Back
        </Link>
      </div>

      {loading && <p>Loading pet details...</p>}

      <form onSubmit={onSubmit} hidden={loading}>
        {error && (
          <p className="msg error" role="alert" style={{ margin: '0 0 1.25rem 0' }}>
            {error}
          </p>
        )}

        {/* 2-Column Balanced Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '270px 1fr',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT COLUMN: Dedicated Pet Profile & Photo Card */}
          <div
            style={{
              background: '#fdf9f3',
              border: '1px solid #eeddc8',
              borderRadius: '16px',
              padding: '24px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '14px',
            }}
          >
            <ImageUpload
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
              folder="pets"
              shape="circle"
              width={112}
              height={112}
              title="Upload Photo"
              helperText="PNG, JPG under 5MB"
              disabled={saving}
            />

            {/* Live Identity Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: isCurrentCat ? '#faf5ff' : '#eff6ff',
                color: isCurrentCat ? '#7e22ce' : '#1d4ed8',
                border: `1px solid ${isCurrentCat ? '#e9d5ff' : '#bfdbfe'}`,
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {isCurrentCat ? <CatIcon size={16} /> : <DogIcon size={16} />}
              <span>{isCurrentCat ? 'Cat' : 'Dog'}</span>
              {name.trim() && <span>• {name.trim()}</span>}
            </div>

            {/* Caregiver Tip Box */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #eeddc8',
                padding: '12px 14px',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: '#785839',
                lineHeight: 1.5,
                width: '100%',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  color: '#3d2d23',
                  marginBottom: '4px',
                }}
              >
                <PawIcon size={14} style={{ color: '#c69f7b' }} />
                <span>Sanctuary Tip</span>
              </div>
              <span>
                A clear profile photo allows staff and groomers to quickly recognize the pet upon arrival.
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Structured Form Information Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #eeddc8',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: '0 4px 20px rgba(61, 45, 35, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* 1. Owner (Customer) - admin / staff only */}
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
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23' }}>
                    Owner (Customer) <span style={{ color: 'var(--danger)' }}>*</span>
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#785839' }}>
                    Type name, email, or phone to search
                  </span>
                </div>

                {editing ? (
                  <input
                    type="text"
                    value={ownerName ? `${ownerName} (ID: ${customerId})` : customerId}
                    disabled
                    style={{
                      backgroundColor: '#fdf9f3',
                      color: '#3d2d23',
                      fontWeight: 600,
                      cursor: 'not-allowed',
                      border: '1px solid #eeddc8',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      width: '100%',
                    }}
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
                      style={{
                        border: '1.5px solid #eeddc8',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        width: '100%',
                      }}
                    />
                    {showDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#fff',
                          border: '1px solid #eeddc8',
                          borderRadius: 8,
                          boxShadow: '0 8px 24px rgba(61, 45, 35, 0.12)',
                          zIndex: 1000,
                          maxHeight: 220,
                          overflowY: 'auto',
                        }}
                      >
                        {loadingCustomers ? (
                          <div style={{ padding: '12px 16px', color: '#785839', fontSize: '0.9rem' }}>
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
                                borderBottom: '1px solid #f8fafc',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#fdf9f3')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <span style={{ fontWeight: 600, color: '#3d2d23' }}>{c.fullName}</span>
                              <span style={{ color: '#785839', fontSize: '0.82rem' }}>
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

            {/* 2. Pet Name & Species in 1 Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1rem', alignItems: 'start' }}>
              <div>
                <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                  Pet Name <span style={{ color: 'var(--danger)' }}>*</span>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bella, Max, Luna"
                  required
                  style={{
                    border: '1.5px solid #eeddc8',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    width: '100%',
                  }}
                />
              </div>

              <div>
                <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                  Species <span style={{ color: 'var(--danger)' }}>*</span>
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleSpeciesChange(PetSpecies.Dog)}
                    style={{
                      flex: 1,
                      padding: '0.62rem 0.75rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${!isCurrentCat ? '#3d2d23' : '#eeddc8'}`,
                      background: !isCurrentCat ? '#3d2d23' : '#fdf9f3',
                      color: !isCurrentCat ? '#ffffff' : '#785839',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <DogIcon size={16} />
                    <span>Dog</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeciesChange(PetSpecies.Cat)}
                    style={{
                      flex: 1,
                      padding: '0.62rem 0.75rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${isCurrentCat ? '#3d2d23' : '#eeddc8'}`,
                      background: isCurrentCat ? '#3d2d23' : '#fdf9f3',
                      color: isCurrentCat ? '#ffffff' : '#785839',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <CatIcon size={16} />
                    <span>Cat</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Breed (Dynamic by Species + Search), Age, Weight */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: selectedBreed === 'Other' ? '1fr 1fr' : '1.35fr 1fr 1fr',
                  gap: '0.85rem',
                  alignItems: 'start',
                }}
              >
                <div>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                    Breed ({isCurrentCat ? 'Cat' : 'Dog'})
                  </span>
                  <Select
                    showSearch
                    size="large"
                    value={selectedBreed || undefined}
                    onChange={(val) => {
                      setSelectedBreed(val)
                      if (val !== 'Other') {
                        setCustomBreed('')
                      }
                    }}
                    placeholder={`Select popular ${isCurrentCat ? 'cat' : 'dog'} breed...`}
                    style={{ width: '100%' }}
                    options={breedOptions}
                    filterOption={(input, option) =>
                      ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>

                {selectedBreed === 'Other' && (
                  <div>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                      Specify Breed Name <span style={{ color: 'var(--danger)' }}>*</span>
                    </span>
                    <input
                      type="text"
                      value={customBreed}
                      onChange={(e) => setCustomBreed(e.target.value)}
                      placeholder="e.g. Cavapoo, Maltipoo..."
                      required
                      style={{
                        border: '1.5px solid #eeddc8',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        width: '100%',
                      }}
                    />
                  </div>
                )}

                {selectedBreed !== 'Other' && (
                  <>
                    <div>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                        Age (years)
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="1"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 2"
                        style={{
                          border: '1.5px solid #eeddc8',
                          borderRadius: '8px',
                          padding: '0.65rem 0.85rem',
                          width: '100%',
                        }}
                      />
                    </div>

                    <div>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                        Weight (kg) <span style={{ color: 'var(--danger)' }}>*</span>
                      </span>
                      <input
                        type="number"
                        min="0.1"
                        max="150"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g. 8.5"
                        required
                        style={{
                          border: '1.5px solid #eeddc8',
                          borderRadius: '8px',
                          padding: '0.65rem 0.85rem',
                          width: '100%',
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Sub-row for Age & Weight when 'Other' breed is selected */}
              {selectedBreed === 'Other' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                      Age (years)
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 2"
                      style={{
                        border: '1.5px solid #eeddc8',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        width: '100%',
                      }}
                    />
                  </div>

                  <div>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                      Weight (kg) <span style={{ color: 'var(--danger)' }}>*</span>
                    </span>
                    <input
                      type="number"
                      min="0.1"
                      max="150"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 8.5"
                      required
                      style={{
                        border: '1.5px solid #eeddc8',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Health & Special Care Notes */}
            <div>
              <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                Health &amp; Special Care Notes
              </span>
              <textarea
                rows={3}
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                placeholder="Allergies, vaccination status, dietary preferences, or behavioral notes..."
                style={{
                  border: '1.5px solid #eeddc8',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  width: '100%',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '0.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f1ece5',
              }}
            >
              <button
                type="submit"
                className="btn"
                disabled={saving}
                style={{
                  padding: '0.65rem 1.6rem',
                  backgroundColor: '#3d2d23',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(61, 45, 35, 0.15)',
                }}
              >
                {saving ? 'Saving...' : editing ? 'Update Pet' : 'Add Pet'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => navigate(backPath)}
                style={{
                  padding: '0.65rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  )
}

export default PetForm
