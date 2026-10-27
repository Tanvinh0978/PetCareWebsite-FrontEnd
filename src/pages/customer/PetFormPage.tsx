import React, { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ImageUpload from '@/components/common/ImageUpload'
import { getApiErrorMessage } from '@/utils/apiError'
import { petService } from '@/services/pet.service'

const PetFormPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const editing = Boolean(id)

  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [species, setSpecies] = useState('Dog')
  const [breed, setBreed] = useState('')
  const [gender, setGender] = useState('Unknown')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    petService
      .fetchById(id)
      .then((pet: any) => {
        const result = pet?.result || pet?.data || pet
        if (result) {
          setName(result.name || '')
          setImageUrl(result.imageUrl || '')
          setSpecies(result.species === 1 || result.species === 'Cat' ? 'Cat' : 'Dog')
          setBreed(result.breed || '')
          setAge(result.age?.toString() || '')
          setWeight(result.weight?.toString() || '')
          setNotes(result.healthNotes || '')
        } else {
          setError('Failed to load pet details')
        }
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedAge = Number(age)
    const parsedWeight = Number(weight)

    if (!name.trim()) {
      setError('Pet name is required.')
      return
    }
    if (age.trim() === '' || weight.trim() === '') {
      setError('Age and weight are required.')
      return
    }
    if (isNaN(parsedAge) || isNaN(parsedWeight)) {
      setError('Age and Weight must be valid numbers.')
      return
    }
    if (parsedAge < 0 || parsedWeight < 0) {
      setError('Age and Weight cannot be negative.')
      return
    }

    // PetSpecies: Dog = 0, Cat = 1
    const speciesEnum = species === 'Cat' ? 1 : 0

    const payload: any = {
      name: name.trim(),
      species: speciesEnum,
      breed: breed.trim(),
      age: parsedAge,
      weight: parsedWeight,
      healthNotes: notes.trim(),
      imageUrl: imageUrl.trim() || undefined,
    }

    // Get customerId from localStorage (set by auth on login)
    const customerId = localStorage.getItem('petcare.customerId')
    if (!editing && customerId) {
      payload.customerId = customerId
    }

    setSaving(true)
    try {
      if (editing) {
        await petService.update(id!, payload as any)
      } else {
        await petService.create(payload as any)
      }
      navigate('/customer/pets')
    } catch (err) {
      setError(getApiErrorMessage(err))
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    marginTop: '4px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    background: '#ffffff',
    boxSizing: 'border-box',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#334155',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <section className="page" style={{ maxWidth: '840px', margin: '0 auto', padding: '1.25rem 1.5rem' }}>
      <div className="page-head" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            {editing ? 'Edit Pet Details' : 'Add New Pet'}
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            {editing
              ? 'Update the details of your furry friend.'
              : 'Add a new pet to your account.'}
          </p>
        </div>
        <Link to="/customer/pets" className="btn btn-secondary">
          ← Back to my pets
        </Link>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Loading pet details...</p>}

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px 28px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
        hidden={loading}
      >
        <form onSubmit={onSubmit} className="form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Row 1: Pet Photo + Name + Species */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
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
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
              <label style={labelStyle}>
                <span>Pet Name <span style={{ color: '#e11d48' }}>*</span></span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bella"
                  style={inputStyle}
                  required
                />
              </label>

              <label style={labelStyle}>
                <span>Species <span style={{ color: '#e11d48' }}>*</span></span>
                <select value={species} onChange={(e) => setSpecies(e.target.value)} style={inputStyle}>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </label>
            </div>
          </div>

          {/* Row 2: Breed, Gender, Age, Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '1rem' }}>
            <label style={labelStyle}>
              <span>Breed</span>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Corgi"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span>Gender</span>
              <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unknown">Unknown</option>
              </select>
            </label>

            <label style={labelStyle}>
              <span>Age (yr) <span style={{ color: '#e11d48' }}>*</span></span>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 2"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span>Weight (kg) <span style={{ color: '#e11d48' }}>*</span></span>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 5.5"
                style={inputStyle}
              />
            </label>
          </div>

          {/* Row 3: Special Notes */}
          <label style={labelStyle}>
            <span>Special Notes (Optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, behaviors, or any special care instructions..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </label>

          {error && (
            <p className="msg error" role="alert" style={{ margin: 0 }}>
              {error}
            </p>
          )}

          <div className="form-actions" style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Add pet'}
            </button>
            <Link to="/customer/pets" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}

export default PetFormPage
