import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { message } from 'antd';
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
<<<<<<< HEAD
      .then((pet) => {
        setName(pet.name);
        setSpecies(pet.species as string);
        setBreed(pet.breed || '');
        setAge(pet.age?.toString() || '');
        setWeight(pet.weight?.toString() || '');
        setNotes(pet.healthNotes || '');
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
=======
      .then((res: any) => {
        const result = res.result || res.data || res;
        if (result) {
          setName(result.name);
          setSpecies(result.species === 1 ? 'Cat' : 'Dog');
          setBreed(result.breed || '');
          // setGender(res.result.gender); // Backend doesn't support gender right now
          setAge(result.age?.toString() || '');
          setWeight(result.weight?.toString() || '');
          setNotes(result.healthNotes || '');
        } else {
          setError(res.message || 'Failed to load pet details');
        }
      })
      .catch((err: any) => setError(getApiErrorMessage(err)))
>>>>>>> 7a051f070450d5b66165a573dc72d5ec2c731c02
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
        healthNotes: notes.trim()
      };

      if (editing) {
<<<<<<< HEAD
        await petService.update(id!, payload);
        message.success('Pet updated successfully!');
      } else {
        await petService.create(payload);
=======
        await petService.update(id!, payload as any);
        message.success('Pet updated successfully!');
      } else {
        await petService.create(payload as any);
>>>>>>> 7a051f070450d5b66165a573dc72d5ec2c731c02
        message.success('Pet added successfully!');
      }

      navigate('/customer/pets');
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
