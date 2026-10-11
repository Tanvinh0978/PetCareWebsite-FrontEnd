import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { message } from 'antd';
import ImageUpload from '@/components/common/ImageUpload';
import { getApiErrorMessage } from '@/utils/apiError';
import { petService } from '@/services/pet.service';
import { useAuthStore } from '@/store/useAuthStore';

const PetFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);
  const customerId = useAuthStore(state => state.user?.id);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [species, setSpecies] = useState('Dog'); // Assuming Dog=1, Cat=2 etc in backend Enum, but sending string works if backend binds correctly
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('Unknown');
  const [age, setAge] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    petService.fetchById(id)
      .then((pet) => {
        setName(pet.name);
        setImageUrl(pet.imageUrl || '');
        setSpecies(pet.species as string);
        setBreed(pet.breed || '');
        setAge(pet.age?.toString() || '');
        setWeight(pet.weight?.toString() || '');
        setNotes(pet.healthNotes || '');
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    setSaving(true);
    try {
      const parsedAge = Number(age);
      const parsedWeight = Number(weight);

      if (!name.trim()) {
        throw new Error("Pet name is required.");
      }
      if (age.trim() === '' || weight.trim() === '') {
        throw new Error("Age and weight are required.");
      }
      if (isNaN(parsedAge) || isNaN(parsedWeight)) {
        throw new Error("Age and Weight must be valid numbers! You cannot enter text here.");
      }
      if (parsedAge < 0 || parsedWeight < 0) {
        throw new Error("Age and Weight cannot be negative.");
      }
      
      if (!customerId) {
         throw new Error("You must be logged in to add a pet.");
      }

      // Map string species to integer enum for backend
      // PetSpecies: Dog = 0, Cat = 1
      let speciesEnum = 0;
      if (species === 'Cat') speciesEnum = 1;

      const payload = {
        customerId: customerId,
        name: name.trim(),
        species: speciesEnum,
        breed: breed.trim(),
        age: parsedAge,
        weight: parsedWeight,
        healthNotes: notes.trim(),
        imageUrl: imageUrl.trim() || undefined,
      };

      if (editing) {
        await petService.update(id!, payload);
        message.success('Pet updated successfully!');
      } else {
        await petService.create(payload);
        message.success('Pet added successfully!');
      }

      navigate('/customer/pets');
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    marginTop: '4px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    background: '#ffffff',
    boxSizing: 'border-box' as const,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  };
  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#334155',
    display: 'flex',
    flexDirection: 'column' as const,
  };
  const pawPattern = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23f1f5f9' fill-opacity='0.6' d='M25 45c-8 0-15-10-10-20 4-8 17-9 22 0 4 9-4 20-12 20zm25-15c-9 0-14-14-6-20 8-7 19 0 14 11-4 6-4 9-8 9zm25 15c-8 0-16-11-12-20 5-9 18-8 22 0 5 10-2 20-10 20zM50 85c-27 0-30-28-12-35 9-4 15-4 24 0 18 7 15 35-12 35z'/%3E%3C/svg%3E")`;

  return (
    <section className="page" style={{ maxWidth: '840px', margin: '0 auto', padding: '1.25rem 1.5rem' }}>
      <div className="page-head" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>{editing ? 'Edit Pet Details' : 'Add New Pet'}</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            {editing
              ? 'Update the details of your furry friend.'
              : 'Add a new pet to your account.'}
          </p>
        </div>
        <Link to="/customer/pets" className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', textDecoration: 'none', color: '#475569', fontWeight: 500 }}>
          ← Back to my pets
        </Link>
      </div>

      {loading && <p>Loading pet details...</p>}

      <div
        className="paw-bg-card"
        style={{
          backgroundColor: '#ffffff',
          backgroundImage: pawPattern,
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px 28px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
        hidden={loading}
      >
        <form onSubmit={onSubmit} className="form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Row 1: Pet Photo + Name + Species (Single seamless layer, no inner frame) */}
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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bella" style={inputStyle} required />
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

          {/* Row 2: Breed, Gender, Age, Weight (Seamless, no inner frame) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '1rem' }}>
            <label style={labelStyle}>
              <span>Breed</span>
              <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Corgi" style={inputStyle} />
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
              <span>Age (yr)</span>
              <input type="text" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 2" style={inputStyle} />
            </label>

            <label style={labelStyle}>
              <span>Weight (kg)</span>
              <input type="text" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 5.5" style={inputStyle} />
            </label>
          </div>

          {/* Row 3: Special Notes (Seamless, no inner frame) */}
          <label style={labelStyle}>
            <span>Special Notes (Optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, behaviors, or any special care instructions..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </label>

          {error && <p className="msg error" role="alert" style={{ color: '#e11d48', padding: '0.5rem 0.75rem', background: '#fee2e2', borderRadius: '6px', margin: 0, fontSize: '0.875rem' }}>{error}</p>}

          <div className="form-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="submit" className="btn" disabled={saving} style={{ background: '#059669', color: 'white', padding: '0.55rem 1.6rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Add pet'}
            </button>
            <Link to="/customer/pets" className="btn btn-secondary" style={{ background: '#ffffff', color: '#475569', padding: '0.55rem 1.4rem', textDecoration: 'none', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.95rem' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default PetFormPage;
