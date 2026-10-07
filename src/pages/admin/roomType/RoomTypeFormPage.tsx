import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { roomTypeService } from '@/services/roomType.service';
import { getApiErrorMessage } from '@/utils/apiError';

const AdminRoomTypeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!id) return;
    roomTypeService.fetchById(id)
      .then((res) => {
        if (res.isSuccess && res.result) {
          setName(res.result.name);
          setDescription(res.result.description || '');
        } else {
          setError(res.message || 'Failed to load room type details');
        }
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Room Type Name is required.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await roomTypeService.update(id!, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
      } else {
        await roomTypeService.create({
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }
      navigate('/admin/room-types');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page" style={{ maxWidth: '840px' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{editing ? 'Edit Room Type' : 'Add New Room Type'}</h1>
          <p className="page-subtitle">
            {editing
              ? 'Update the details of the selected room type.'
              : 'Add a new category of rooms for pet boarding.'}
          </p>
        </div>
        <Link to="/admin/room-types" className="btn btn-secondary">
          ← Back to room types
        </Link>
      </div>

      {loading && <p>Loading room type details...</p>}

      <form onSubmit={onSubmit} className="form" hidden={loading}>
        <label>
          Room Type Name <span style={{ color: 'var(--danger)' }}>*</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Room, VIP Suite, Cat Condo"
            required
          />
        </label>

        <label>
          Description
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of what this room type offers..."
          />
        </label>

        {error && <p className="msg error" role="alert">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving changes...' : editing ? 'Save changes' : 'Create room type'}
          </button>
          <Link to="/admin/room-types" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
};

export default AdminRoomTypeFormPage;
