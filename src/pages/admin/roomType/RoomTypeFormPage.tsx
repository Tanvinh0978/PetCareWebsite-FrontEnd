import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { roomTypeService } from '@/services/roomType.service';
import { getApiErrorMessage } from '@/utils/apiError';

const AdminRoomTypeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) {
      loadRoomType(id);
    }
  }, [id, isEditMode]);

  const loadRoomType = async (roomId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await roomTypeService.fetchById(roomId);
      if (res.isSuccess && res.result) {
        setName(res.result.name);
        setDescription(res.result.description || '');
      } else {
        setError(res.message || 'Failed to load room type details');
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Room Type Name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditMode) {
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
    } catch (err: any) {
      setError(getApiErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <section className="page max-w-2xl">
      <div className="page-head">
        <div>
          <Link to="/admin/room-types" className="back-link">
            &larr; Back to room types
          </Link>
          <h1>{isEditMode ? 'Edit Room Type' : 'Create New Room Type'}</h1>
          <p className="page-subtitle">
            {isEditMode
              ? 'Update the details of the selected room type.'
              : 'Add a new category of rooms for pet boarding.'}
          </p>
        </div>
      </div>

      <div className="card form-card">
        {error && (
          <div className="msg error" role="alert" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="app-form">
          <div className="form-group">
            <label htmlFor="name">
              Room Type Name <span className="text-danger">*</span>
            </label>
            <input
              id="name"
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Room, VIP Suite, Cat Condo"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="form-control"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of what this room type offers..."
            />
          </div>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <Link to="/admin/room-types" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEditMode ? 'Update Room Type' : 'Create Room Type'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AdminRoomTypeFormPage;
