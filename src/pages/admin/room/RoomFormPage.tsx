import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { roomService } from '@/services/room.service';
import { roomTypeService, type RoomTypeDTO } from '@/services/roomType.service';
import { getApiErrorMessage } from '@/utils/apiError';

const AdminRoomFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [roomName, setRoomName] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>([]);

  useEffect(() => {
    // Load room types for the dropdown
    roomTypeService.fetchAll()
      .then(res => {
        if (res.isSuccess && res.result) {
          setRoomTypes(res.result);
          if (!editing && res.result.length > 0) {
             setRoomTypeId(res.result[0].id);
          }
        }
      })
      .catch(console.error);
      
    if (!id) return;
    
    // Load room details if editing
    roomService.fetchById(id)
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
    
    if (!roomName.trim()) {
      setError('Room name is required.');
      return;
    }
    if (!roomTypeId) {
      setError('Please select a room type.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await roomService.update(id!, {
          roomName: roomName.trim(),
          roomTypeId: roomTypeId
        });
      } else {
        await roomService.create({
          roomName: roomName.trim(),
          roomTypeId: roomTypeId
        });
      }
      navigate('/admin/rooms');
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
          <h1>{editing ? 'Edit Room' : 'Add New Room'}</h1>
          <p className="page-subtitle">
            {editing
              ? 'Update the details of the selected room.'
              : 'Add a new physical room to a specific room category.'}
          </p>
        </div>
        <Link to="/admin/rooms" className="btn btn-secondary">
          ← Back to rooms
        </Link>
      </div>

      {loading && <p>Loading room details...</p>}

      <form onSubmit={onSubmit} className="form" hidden={loading}>
        <label>
          Room Name <span style={{ color: 'var(--danger)' }}>*</span>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Room 101, VIP-01"
            required
          />
        </label>

        <label>
          Room Type <span style={{ color: 'var(--danger)' }}>*</span>
          <select
            value={roomTypeId}
            onChange={(e) => setRoomTypeId(e.target.value)}
            required
          >
            <option value="" disabled>Select a room type...</option>
            {roomTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>
        </label>

        {error && <p className="msg error" role="alert">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving changes...' : editing ? 'Save changes' : 'Create room'}
          </button>
          <Link to="/admin/rooms" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
};

export default AdminRoomFormPage;
