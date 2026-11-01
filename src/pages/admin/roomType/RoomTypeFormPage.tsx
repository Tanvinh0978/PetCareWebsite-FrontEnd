import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
    roomTypeService
      .fetchById(id)
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
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Room type name is required.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await roomTypeService.update(id!, {
          name: cleanName,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        });
      } else {
        await roomTypeService.create({
          name: cleanName,
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
      <section className="page" style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 12,
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          You do not have permission to manage room types.
        </div>
        <Link
          to={baseRoomTypePath}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.45rem 1.1rem',
            borderRadius: 8,
            backgroundColor: '#ffffff',
            border: '1px solid #e8ded6',
            color: '#3d2d23',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeftOutlined /> Back to room types
        </Link>
      </section>
    );
  }

  return (
    <section className="page" style={{ maxWidth: '780px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.1rem',
              color: '#3d2d23',
              fontWeight: 700,
            }}
          >
            {editing ? 'Edit Room Type' : 'Add New Room Type'}
          </h1>
          <p style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            {editing
              ? 'Update the details, specifications, and photography of this suite category.'
              : 'Create a new luxury boarding suite category for dogs and cats.'}
          </p>
        </div>
        <Link
          to={baseRoomTypePath}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0.45rem 1.15rem',
            borderRadius: 999,
            backgroundColor: '#ffffff',
            border: '1.5px solid #eeddc8',
            color: '#785839',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(61,45,35,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 12 }} />
          <span>Back to room types</span>
        </Link>
      </div>

      <form onSubmit={onSubmit} hidden={loading}>
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.9rem',
            }}
          >
            <InfoCircleOutlined style={{ fontSize: 16 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Luxury Card Container */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #eeddc8',
            borderRadius: '20px',
            padding: '32px 36px',
            boxShadow: '0 4px 20px rgba(61, 45, 35, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Suite Image Upload with luxury border & centering */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#fdfbf7',
              borderRadius: '16px',
              border: '1.5px dashed #eeddc8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#3d2d23',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              Suite Photography
            </div>
            <ImageUpload
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
              folder="room-types"
              shape="square"
              width={260}
              height={170}
              title="Suite Photo"
              helperText="PNG, JPG, WEBP up to 5MB"
              disabled={saving}
              align="center"
            />
            <div style={{ fontSize: '0.8rem', color: '#8c735f', marginTop: 10, textAlign: 'center' }}>
              Clear photos highlight the suite space, bedding, and ventilation for pet owners.
            </div>
          </div>

          {/* Room Type Name */}
          <div>
            <span
              style={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#3d2d23',
                marginBottom: '0.45rem',
              }}
            >
              Room Type Name <span style={{ color: '#dc2626' }}>*</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Presidential Penthouse Suite, Deluxe Garden Villa, Cat Condo"
              required
              style={{
                border: '1.5px solid #eeddc8',
                borderRadius: '10px',
                padding: '0.7rem 0.95rem',
                width: '100%',
                fontSize: '0.92rem',
                color: '#3d2d23',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <span
              style={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#3d2d23',
                marginBottom: '0.45rem',
              }}
            >
              Suite Description & Amenities (Optional)
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe square footage, bed type, climate control, surveillance camera, play routines, etc."
              style={{
                border: '1.5px solid #eeddc8',
                borderRadius: '10px',
                padding: '0.7rem 0.95rem',
                width: '100%',
                fontSize: '0.92rem',
                color: '#3d2d23',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.85rem',
              marginTop: '0.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #f1ece5',
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.65rem 1.8rem',
                backgroundColor: '#3d2d23',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(61, 45, 35, 0.18)',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Saving...' : editing ? 'Update Room Type' : 'Create Room Type'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => navigate(baseRoomTypePath)}
              style={{
                padding: '0.65rem 1.5rem',
                backgroundColor: '#ffffff',
                color: '#785839',
                border: '1.5px solid #eeddc8',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default AdminRoomTypeFormPage;
