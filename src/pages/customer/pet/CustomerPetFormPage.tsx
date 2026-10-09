import React, { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { App } from 'antd'
import { petService } from '@/services/pet.service'
import { customerService } from '@/services/customer.service'
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
  const [species, setSpecies] = useState<number>(PetSpecies.Dog)
  const [breed, setBreed] = useState('')
  const [weight, setWeight] = useState<number | string>('')
  const [age, setAge] = useState<number | string>('')
  const [healthNotes, setHealthNotes] = useState('')

  // Resolve customer ID
  useEffect(() => {
    const resolveCustId = async () => {
      const stored = localStorage.getItem('petcare.customerId')
      if (stored) {
        setCustomerId(stored)
        return
      }
      const user = useAuthStore.getState().user
      if (user?.id) {
        setCustomerId(String(user.id))
        return
      }
      try {
        const custRes = await customerService.fetchWithPagination({ pageSize: 1, isActive: true })
        if (custRes?.result?.items?.length) {
          const firstId = custRes.result.items[0].id
          setCustomerId(firstId)
          localStorage.setItem('petcare.customerId', firstId)
        }
      } catch {}
    }

    if (!editing) {
      resolveCustId()
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
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        hidden={loading}
      >
        <form onSubmit={onSubmit} className="form">
          {error && (
            <p className="msg error" role="alert" style={{ margin: '0 0 1.25rem 0' }}>
              {error}
            </p>
          )}

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
                🐶 Dog
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
