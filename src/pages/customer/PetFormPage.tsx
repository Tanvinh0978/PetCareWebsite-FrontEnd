import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '@/utils/apiError';
import { IPet } from '@/types/pet.types';

const PetFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('Unknown');
  const [age, setAge] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    // Load from localStorage mock
    setTimeout(() => {
      const stored = localStorage.getItem('mock_pets');
      if (stored) {
        const pets: IPet[] = JSON.parse(stored);
        const pet = pets.find(p => p.id.toString() === id);
        if (pet) {
          setName(pet.name);
          setSpecies(pet.species);
          setBreed(pet.breed);
          setGender(pet.gender);
          setAge(pet.age.toString());
          setWeight(pet.weight.toString());
          setNotes(pet.notes || '');
        }
      }
      setLoading(false);
    }, 300);
  }, [id, editing]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    setSaving(true);
    try {
      // Giả lập backend chặn lỗi khi người dùng cố tình nhập chữ
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

      const payload: IPet = {
        id: editing ? Number(id) : Date.now(),
        name: name.trim(),
        species,
        breed: breed.trim(),
        gender,
        age: parsedAge,
        weight: parsedWeight,
        notes: notes.trim()
      };

      // Save to localStorage mock
      const stored = localStorage.getItem('mock_pets');
      let pets: IPet[] = stored ? JSON.parse(stored) : [];
      
      if (editing) {
        pets = pets.map(p => p.id === payload.id ? payload : p);
      } else {
        pets.push(payload);
      }
      
      localStorage.setItem('mock_pets', JSON.stringify(pets));

      setTimeout(() => {
        navigate('/customer/pets');
      }, 300);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSaving(false);
    }
  };

  const inputStyle = { width: '100%', padding: '0.4rem', marginTop: '2px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.95rem' };
  const labelStyle = { fontSize: '0.85rem', fontWeight: 600, color: '#334155' };

  return (
    <section className="page" style={{ maxWidth: '840px', margin: '0 auto', padding: '2rem' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>{editing ? 'Edit Pet Details' : 'Add New Pet'}</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary, #64748b)' }}>
            {editing
              ? 'Update the details of your furry friend.'
              : 'Add a new pet to your account.'}
          </p>
        </div>
        <Link to="/customer/pets" className="btn btn-secondary">
          ← Back to my pets
        </Link>
      </div>

      {loading && <p>Loading pet details...</p>}

      <form onSubmit={onSubmit} className="form" hidden={loading} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label style={labelStyle}>
            Pet Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bella" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Species
            <select value={species} onChange={(e) => setSpecies(e.target.value)} style={inputStyle}>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label style={labelStyle}>
            Breed
            <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Golden Retriever" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Gender
            <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unknown">Unknown</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label style={labelStyle}>
            Age (years)
            <input type="text" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 2" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Weight (kg)
            <input type="text" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 5.5" style={inputStyle} />
          </label>
        </div>

        <label style={labelStyle}>
          Special Notes (Optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, behaviors, or any special care instructions..." rows={3} style={inputStyle} />
        </label>

        {error && <p className="msg error" role="alert" style={{ color: 'red', padding: '0.75rem', background: '#fee2e2', borderRadius: '4px' }}>{error}</p>}

        <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" className="btn" disabled={saving} style={{ background: '#059669', color: 'white', padding: '0.5rem 1.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {saving ? 'Saving changes...' : editing ? 'Save changes' : 'Add pet'}
          </button>
          <Link to="/customer/pets" className="btn btn-secondary" style={{ background: '#f1f5f9', color: '#334155', padding: '0.5rem 1.5rem', textDecoration: 'none', borderRadius: '4px' }}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
};

export default PetFormPage;
