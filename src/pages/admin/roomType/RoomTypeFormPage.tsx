import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ImageUpload from '@/components/common/ImageUpload';
import { roomTypeService } from '@/services/roomType.service';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';

const AdminRoomTypeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const baseRoomTypePath = location.pathname.startsWith('/staff') ? '/staff/room-types' : '/admin/room-types';
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.ROOM_MANAGE);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!id) return;
    roomTypeService.fetchById(id)
      .then((res) => {
        if (res.isSuccess && res.result) {
          setName(res.result.name);
          setDescription(res.result.description || '');
          setImageUrl(res.result.imageUrl || '');
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
          imageUrl: imageUrl.trim() || undefined,
        });
      } else {
        await roomTypeService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        });
      }
      navigate(baseRoomTypePath);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <section className="page" style={{ maxWidth: '840px' }}>
        <p className="msg error" role="alert">
          You do not have permission to manage room types.
        </p>
        <Link to={baseRoomTypePath} className="btn btn-secondary">
          ← Back to room types
        </Link>
      </section>
    );
  }

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
        <Link to={baseRoomTypePath} className="btn btn-secondary">
          ← Back to room types
        </Link>
      </div>

      {loading && <p>Loading room type details...</p>}

      <form onSubmit={onSubmit} className="form" hidden={loading} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Compact row: Image + Name */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <ImageUpload
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
            folder="room-types"
            shape="square"
            width={110}
            height={74}
            title="Room Photo"
            helperText="Max 5MB"
            disabled={saving}
          />
          <div style={{ flex: 1 }}>
            <label style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>
              Room Type Name <span style={{ color: 'var(--danger)' }}>*</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Room, VIP Suite, Cat Condo"
                required
                style={{ marginTop: '4px', width: '100%', padding: '0.45rem', borderRadius: '4px' }}
              />
            </label>
          </div>
        </div>

        <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>
          Description
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of what this room type offers..."
            style={{ width: '100%', padding: '0.45rem', marginTop: '4px', borderRadius: '4px', resize: 'vertical' }}
          />
        </label>

        {error && <p className="msg error" role="alert" style={{ margin: 0, padding: '0.5rem 0.75rem' }}>{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving changes...' : editing ? 'Save changes' : 'Create room type'}
          </button>
          <Link to={baseRoomTypePath} className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
};

export default AdminRoomTypeFormPage;
