import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Select, message } from 'antd';
import {
  ArrowLeftOutlined,
  HomeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { roomService } from '@/services/room.service';
import { roomTypeService, type RoomTypeDTO } from '@/services/roomType.service';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';

const AdminRoomFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const baseRoomPath = location.pathname.startsWith('/staff') ? '/staff/rooms' : '/admin/rooms';
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.ROOM_MANAGE);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [roomName, setRoomName] = useState('');
  const [roomTypeId, setRoomTypeId] = useState<string>('');
  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);

  useEffect(() => {
    setLoadingRoomTypes(true);
    roomTypeService
      .fetchAll()
      .then((res) => {
        if (res.isSuccess && res.result) {
          setRoomTypes(res.result);
          if (!editing && res.result.length > 0 && !roomTypeId) {
            setRoomTypeId(res.result[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load room types:', err))
      .finally(() => setLoadingRoomTypes(false));

    if (!id) return;

    roomService
      .fetchById(id)
      .then((res) => {
        if (res.isSuccess && res.result) {
          setRoomName(res.result.roomName);
          setRoomTypeId(res.result.roomTypeId);
        } else {
          setError(res.message || 'Failed to load room details');
        }
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanRoomName = roomName.trim();
    if (!cleanRoomName) {
      setError('Room name is required.');
      return;
    }
    if (!roomTypeId) {
      setError('Please select a room category.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await roomService.update(id!, {
          roomName: cleanRoomName,
          roomTypeId: roomTypeId,
        });
        message.success(`Room "${cleanRoomName}" updated successfully.`);
      } else {
        await roomService.create({
          roomName: cleanRoomName,
          roomTypeId: roomTypeId,
        });
        message.success(`Room "${cleanRoomName}" created successfully.`);
      }
      navigate(baseRoomPath);
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
          You do not have permission to manage rooms.
        </div>
        <Link
          to={baseRoomPath}
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
          <ArrowLeftOutlined /> Back to rooms
        </Link>
      </section>
    );
  }

  return (
    <section className="page" style={{ maxWidth: '780px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
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
            {editing ? 'Edit Room' : 'Add New Room'}
          </h1>
          <p style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            {editing
              ? 'Update the details and category assignment of this physical suite unit.'
              : 'Add a new physical boarding room or suite unit to a specific category.'}
          </p>
        </div>
        <Link
          to={baseRoomPath}
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
          <span>Back to rooms</span>
        </Link>
      </div>

      {loading ? (
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #eeddc8',
            borderRadius: '20px',
            padding: '48px 36px',
            textAlign: 'center',
            color: '#785839',
            fontWeight: 600,
          }}
        >
          Loading room details...
        </div>
      ) : (
        <form onSubmit={onSubmit}>
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
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 18px',
                backgroundColor: '#fdfbf7',
                border: '1.5px solid #eeddc8',
                borderRadius: '12px',
              }}
            >
              <HomeOutlined style={{ fontSize: 18, color: '#785839', marginTop: 2 }} />
              <div style={{ fontSize: '0.86rem', color: '#785839', lineHeight: 1.5 }}>
                <strong>Physical Suite Unit:</strong> Each room represents a specific boarding space (e.g., <em>Suite P-01</em>, <em>Cat Villa 102</em>). Make sure to link it with its designated room category for correct pricing and amenities.
              </div>
            </div>

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
                Room Name <span style={{ color: '#dc2626' }}>*</span>
              </span>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Suite P-01, Room 102, Cat Haven A3"
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
              <span style={{ display: 'block', fontSize: '0.78rem', color: '#8c735f', marginTop: 6 }}>
                The identifiable unit name or number visible to guests and staff.
              </span>
            </div>

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
                Room Category (Type) <span style={{ color: '#dc2626' }}>*</span>
              </span>
              <Select
                value={roomTypeId || undefined}
                onChange={(val) => setRoomTypeId(val)}
                loading={loadingRoomTypes}
                placeholder="Select a suite category..."
                style={{ width: '100%', height: 44 }}
                options={roomTypes.map((rt) => ({
                  value: rt.id,
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HomeOutlined style={{ color: '#785839' }} />
                      <span style={{ fontWeight: 600, color: '#3d2d23' }}>{rt.name}</span>
                    </div>
                  ),
                }))}
              />
              <span style={{ display: 'block', fontSize: '0.78rem', color: '#8c735f', marginTop: 6 }}>
                Associates this physical unit with amenities, size tier, and daily boarding rates.
              </span>
            </div>

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
                disabled={saving || !roomName.trim() || !roomTypeId}
                style={{
                  padding: '0.65rem 1.8rem',
                  backgroundColor: '#3d2d23',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: saving || !roomName.trim() || !roomTypeId ? 'not-allowed' : 'pointer',
                  opacity: saving || !roomName.trim() || !roomTypeId ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(61, 45, 35, 0.18)',
                  transition: 'all 0.2s ease',
                }}
              >
                {saving ? 'Saving...' : editing ? 'Update Room' : 'Create Room'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => navigate(baseRoomPath)}
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
      )}
    </section>
  );
};

export default AdminRoomFormPage;
