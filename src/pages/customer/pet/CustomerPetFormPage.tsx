import React, { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { App } from 'antd'
import ImageUpload from '@/components/common/ImageUpload'
import { petService } from '@/services/pet.service'
import { useAuthStore } from '@/store/useAuthStore'
import { PetSpecies, isCat } from '@/types/pet.types'
import { getApiErrorMessage } from '@/utils/apiError'

const CustomerPetFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const editing = Boolean(id)

  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [customerId, setCustomerId] = useState<string>('')
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [species, setSpecies] = useState<number>(PetSpecies.Dog)
  const [breed, setBreed] = useState('')
  const [weight, setWeight] = useState<number | string>('')
  const [age, setAge] = useState<number | string>('')
  const [healthNotes, setHealthNotes] = useState('')

  // Resolve customer ID from JWT user (stored in authStore)
  useEffect(() => {
    if (editing) return
    const user = useAuthStore.getState().user
    if (user?.id) {
      setCustomerId(String(user.id))
    }
  }, [editing])

  // Load existing pet data when editing
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
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [id])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanName = name.trim()
    if (!cleanName) {
      setError('Please enter your pet\'s name.')
      return
    }

    if (!editing && !customerId) {
      setError('Could not identify your customer account. Please ensure you are logged in.')
      return
    }

    const numWeight = Number(weight)
    if (isNaN(numWeight) || numWeight <= 0) {
      setError('Please enter a valid weight in kg (greater than 0).')
      return
    }

    const numAge = age === '' ? undefined : Number(age)
    if (numAge !== undefined && (isNaN(numAge) || numAge < 0)) {
      setError('Please enter a valid age in years.')
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
        message.success('Pet information updated successfully!')
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
        message.success('New pet registered successfully!')
      }
      navigate('/customer/pets')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to="/customer/pets"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#059669',
            fontWeight: 600,
            fontSize: '0.9rem',
            marginBottom: '0.75rem',
          }}
        >
          ← Back to My Pets
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.85rem', color: '#0f172a' }}>
          {editing ? 'Edit Pet Profile' : 'Register a New Pet'}
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>
          {editing
            ? 'Update your pet\'s details, weight, and health requirements.'
            : 'Provide information about your furry companion to get started.'}
        </p>
      </div>

      {loading && <p>Loading pet details...</p>}

      <div
        className="paw-bg-card"
        style={{
          backgroundColor: '#ffffff',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23f1f5f9' fill-opacity='0.6' d='M25 45c-8 0-15-10-10-20 4-8 17-9 22 0 4 9-4 20-12 20zm25-15c-9 0-14-14-6-20 8-7 19 0 14 11-4 6-4 9-8 9zm25 15c-8 0-16-11-12-20 5-9 18-8 22 0 5 10-2 20-10 20zM50 85c-27 0-30-28-12-35 9-4 15-4 24 0 18 7 15 35-12 35z'/%3E%3C/svg%3E")`,
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px 28px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
        hidden={loading}
      >
        <form onSubmit={onSubmit} className="form">
          {error && (
            <p className="msg error" role="alert" style={{ margin: '0 0 1.25rem 0' }}>
              {error}
            </p>
          )}

          {/* Pet Photo / Avatar */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#0f172a' }}>
              Pet Photo
            </label>
            <ImageUpload
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
              folder="pets"
              shape="circle"
              width={120}
              height={120}
              title="Upload Photo"
              helperText="Upload your pet's avatar (PNG, JPG, WEBP up to 5MB)"
              disabled={saving}
            />
          </div>

          {/* Pet Name */}
          <label>
            Pet Name <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Milo, Cooper, Luna"
              required
            />
          </label>

          {/* Species Selection */}
          <label>
            Species <span style={{ color: 'var(--danger)' }}>*</span>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.4rem' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  background: !isCat(species) ? '#ecfdf5' : '#f8fafc',
                  border: `2px solid ${!isCat(species) ? '#059669' : '#e2e8f0'}`,
                  padding: '8px 16px',
                  borderRadius: '10px',
                }}
              >
                <input
                  type="radio"
                  name="species"
                  value={PetSpecies.Dog}
                  checked={!isCat(species)}
                  onChange={() => setSpecies(PetSpecies.Dog)}
                />
                Dog
              </label>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  background: isCat(species) ? '#f3e8ff' : '#f8fafc',
                  border: `2px solid ${isCat(species) ? '#9333ea' : '#e2e8f0'}`,
                  padding: '8px 16px',
                  borderRadius: '10px',
                }}
              >
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
          </label>

          {/* Breed & Age */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              Breed
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Corgi, Poodle, British Shorthair"
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
                placeholder="e.g. 3"
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
              placeholder="e.g. 10.5"
              required
            />
          </label>

          {/* Health & Special Care Notes */}
          <label>
            Health & Dietary Instructions
            <textarea
              rows={4}
              value={healthNotes}
              onChange={(e) => setHealthNotes(e.target.value)}
              placeholder="Tell us about special diets, food allergies, vaccine records, or personality habits..."
            />
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Register Pet'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving}
              onClick={() => navigate('/customer/pets')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerPetFormPage
