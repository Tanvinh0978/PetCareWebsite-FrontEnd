import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { roomTypeService, type RoomTypeDetailDTO } from '@/services/roomType.service';
import { getApiErrorMessage } from '@/utils/apiError';

interface RoomTypeDetailProps {
  backTo: string;
  guest?: boolean;
}

export default function RoomTypeDetail({ backTo, guest }: RoomTypeDetailProps) {
  const { id = '' } = useParams();
  const [roomType, setRoomType] = useState<RoomTypeDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    roomTypeService
      .fetchById(id)
      .then((res) => {
        if (res.isSuccess && res.result) {
          setRoomType(res.result);
        } else {
          setError(res.message || 'Failed to load room type details');
        }
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <section className="page narrow">
        <p style={{ color: '#557268', padding: '2rem 0' }}>Loading room type details...</p>
      </section>
    );
  }

  if (error || !roomType) {
    return (
      <section className="page narrow">
        <p className="msg error" role="alert">{error || 'Room type not found.'}</p>
        <Link to={backTo} className="btn btn-secondary">
          ← Back to room types
        </Link>
      </section>
    );
  }

  return (
    <section className="page narrow">
      <div className="page-head">
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#b45309', background: '#fef3c7', padding: '0.2rem 0.75rem', borderRadius: '999px', border: '1px solid #fde68a' }}>
            🏨 Pet Hotel Suite
          </span>
          <h1 style={{ marginTop: '0.5rem' }}>{roomType.name}</h1>
        </div>
        <Link
          to={guest ? '/login' : '/customer/booking'}
          className="btn"
          style={{ padding: '0.65rem 1.4rem' }}
        >
          Book this Room
        </Link>
      </div>

      {roomType.imageUrl && (
        <div
          style={{
            marginBottom: '1.75rem',
            borderRadius: '14px',
            overflow: 'hidden',
            maxHeight: '380px',
            border: '1px solid var(--slate-200)',
            backgroundColor: '#f8fafc',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <img
            src={roomType.imageUrl}
            alt={roomType.name}
            style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.75rem', marginBottom: '1.75rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem' }}>Description & Amenities</h3>
        <p style={{ color: 'var(--slate-700)', lineHeight: '1.7', margin: 0, fontSize: '0.97rem' }}>
          {roomType.description || 'This room type provides exceptional hygiene, climate control, soft bedding, and constant surveillance to ensure your pet is completely safe and happy during their stay.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sanitized & Safe</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Daily UV & disinfection</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.3rem' }}>❄️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Climate Controlled</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Optimal temperature 24/7</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.3rem' }}>📷</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>CCTV Monitoring</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Daily photo/video updates</div>
            </div>
          </div>
        </div>
      </div>

      <h2>Available Rooms ({roomType.totalRooms})</h2>
      {(!roomType.rooms || roomType.rooms.length === 0) ? (
        <p style={{ color: '#64748b' }}>No individual rooms listed under this type currently.</p>
      ) : (
        <div className="table-card" style={{ marginBottom: '2rem' }}>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Room Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {roomType.rooms.map((room, idx) => (
                  <tr key={room.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{room.name}</strong></td>
                    <td>
                      <span
                        className={`status-pill ${
                          String(room.status).toLowerCase() === 'available' ? 'active' : 'inactive'
                        }`}
                      >
                        <span className="status-dot"></span>
                        {room.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CTA Box */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
          border: '1.5px solid #a7f3d0',
          borderRadius: '14px',
          padding: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 0.35rem', color: '#065f46' }}>Reserve a suite for your furry friend</h3>
          <p style={{ margin: 0, color: '#047857', fontSize: '0.93rem' }}>
            Select dates, check-in time, and nutrition diets easily via our online booking system.
          </p>
        </div>
        <Link
          to={guest ? '/login' : '/customer/booking'}
          className="btn"
          style={{ whiteSpace: 'nowrap' }}
        >
          Book Now →
        </Link>
      </div>

      <div>
        <Link to={backTo} className="btn btn-secondary">
          ← Back to room types
        </Link>
      </div>
    </section>
  );
}
