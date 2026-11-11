import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  HomeOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { roomTypeService, type RoomTypeDetailDTO } from '@/services/roomType.service';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';

interface RoomTypeDetailProps {
  backTo?: string;
  editTo?: (id: string) => string;
  guest?: boolean;
}

export default function RoomTypeDetail({ backTo, editTo, guest }: RoomTypeDetailProps) {
  const { id = '' } = useParams();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.ROOM_MANAGE);
  const isStaff = location.pathname.startsWith('/staff');
  const isAdmin = location.pathname.startsWith('/admin');
  const isCustomer = !isAdmin && !isStaff;

  const defaultBackTo = isCustomer ? '/room-types' : isStaff ? '/staff/room-types' : '/admin/room-types';
  const resolvedBackTo = backTo || defaultBackTo;
  const resolvedEditTo = editTo || (canManage ? (rid: string) => `${defaultBackTo}/${rid}/edit` : undefined);

  const [roomType, setRoomType] = useState<RoomTypeDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    roomTypeService
      .fetchById(id)
      .then((res) => {
        if (cancelled) return;
        if (res.isSuccess && res.result) {
          setRoomType(res.result);
        } else {
          setError(res.message || 'Failed to load room type details');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Spin size="large" tip="Loading sanctuary suite dossier..." />
      </section>
    );
  }

  if (error || !roomType) {
    return (
      <section className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 12,
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {error || 'Room type not found.'}
        </div>
        <Link
          to={resolvedBackTo}
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
    <section className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Link
          to={resolvedBackTo}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {canManage && resolvedEditTo && (
            <Link
              to={resolvedEditTo(roomType.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '0.45rem 1.35rem',
                borderRadius: 999,
                backgroundColor: '#3d2d23',
                border: '1px solid #3d2d23',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(61,45,35,0.18)',
              }}
            >
              <EditOutlined style={{ fontSize: 13 }} />
              <span>Edit Room Type</span>
            </Link>
          )}

          {(isCustomer || guest) && (
            <Link
              to={guest ? '/login' : '/customer/booking'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '0.45rem 1.35rem',
                borderRadius: 999,
                backgroundColor: '#3d2d23',
                border: '1px solid #3d2d23',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(61,45,35,0.18)',
              }}
            >
              <CalendarOutlined style={{ fontSize: 13 }} />
              <span>Book This Suite</span>
            </Link>
          )}
        </div>
      </div>

      <div
        style={{
          borderRadius: 20,
          border: '1.5px solid #eeddc8',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px -2px rgba(61,45,35,0.06)',
          padding: '32px 36px',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 28,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 280,
              maxWidth: '100%',
              height: 220,
              borderRadius: 16,
              overflow: 'hidden',
              border: '2px solid #eeddc8',
              boxShadow: '0 4px 14px rgba(61,45,35,0.08)',
              backgroundColor: '#fbf7f2',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {roomType.imageUrl ? (
              <img
                src={roomType.imageUrl}
                alt={roomType.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  color: '#a88a6d',
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1.5px solid #eeddc8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    color: '#785839',
                    boxShadow: '0 2px 6px rgba(61,45,35,0.05)',
                  }}
                >
                  <HomeOutlined />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#785839' }}>Haven & Hound Sanctuary</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.95rem',
                  borderRadius: 999,
                  backgroundColor: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                }}
              >
                <HomeOutlined />
                <span>Pet Hotel Suite</span>
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.95rem',
                  borderRadius: 999,
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                }}
              >
                <CheckCircleOutlined />
                <span>{roomType.totalRooms} Rooms Configured</span>
              </span>
            </div>

            <h1
              style={{
                margin: '8px 0 12px',
                fontSize: '2.25rem',
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#3d2d23',
                lineHeight: 1.25,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              {roomType.name}
            </h1>

            <div
              style={{
                backgroundColor: 'var(--paper, #fdfbf7)',
                border: '1px solid #eeddc8',
                borderRadius: 12,
                padding: '16px 20px',
                color: '#554236',
                fontSize: '0.95rem',
                lineHeight: 1.6,
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#a88a6d',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}
              >
                Suite Amenities & Accommodations
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                {roomType.description ||
                  'This premium sanctuary room type provides exceptional hygiene, climate control, soft hypoallergenic bedding, and continuous surveillance to ensure your pet companion enjoys a peaceful, luxurious stay.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            padding: '20px 22px',
            backgroundColor: '#faf6f0',
            border: '1.5px solid #eeddc8',
            borderRadius: 16,
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#ffffff',
              border: '1px solid #eeddc8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#785839',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            <SafetyCertificateOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#3d2d23', fontSize: '0.92rem', marginBottom: 3 }}>
              Sanitized & Hypoallergenic
            </div>
            <div style={{ color: '#785839', fontSize: '0.82rem', lineHeight: 1.45 }}>
              Medical-grade sanitization between guests with premium orthopedic bedding.
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '20px 22px',
            backgroundColor: '#faf6f0',
            border: '1.5px solid #eeddc8',
            borderRadius: 16,
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#ffffff',
              border: '1px solid #eeddc8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#785839',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            <HomeOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#3d2d23', fontSize: '0.92rem', marginBottom: 3 }}>
              Climate-Controlled Comfort
            </div>
            <div style={{ color: '#785839', fontSize: '0.82rem', lineHeight: 1.45 }}>
              Ventilated, whisper-quiet temperature regulation tailored for all dog & cat breeds.
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '20px 22px',
            backgroundColor: '#faf6f0',
            border: '1.5px solid #eeddc8',
            borderRadius: 16,
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#ffffff',
              border: '1px solid #eeddc8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#785839',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            <CalendarOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#3d2d23', fontSize: '0.92rem', marginBottom: 3 }}>
              Daily Care Logging
            </div>
            <div style={{ color: '#785839', fontSize: '0.82rem', lineHeight: 1.45 }}>
              Caregivers log meals, bathroom habits, and moods accessible to pet parents in real time.
            </div>
          </div>
        </div>
      </div>

      {roomType.rooms && roomType.rooms.length > 0 && (
        <div
          style={{
            borderRadius: 20,
            border: '1.5px solid #eeddc8',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px -2px rgba(61,45,35,0.06)',
            padding: '28px 32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid #f1ece7',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.35rem',
                  color: '#3d2d23',
                  fontWeight: 700,
                }}
              >
                Physical Suite Units
              </h2>
              <p style={{ margin: '4px 0 0', color: '#8c735f', fontSize: '0.875rem' }}>
                Active suites belonging to this category in the sanctuary facility.
              </p>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.35rem 0.85rem',
                borderRadius: 999,
                backgroundColor: '#faf6f0',
                border: '1px solid #eeddc8',
                color: '#785839',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              <AppstoreOutlined />
              <span>{roomType.rooms.length} Suites Configured</span>
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {roomType.rooms.map((r) => {
              const statusStr = (r.status || '').toLowerCase();
              const isAvailable = statusStr === 'available';
              const isMaintenance = statusStr === 'maintenance' || statusStr === 'under_maintenance';
              const displayName = r.roomName || r.name || 'Suite Unit';

              return (
                <div
                  key={r.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 14,
                    border: '1.5px solid #eeddc8',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 14,
                    boxShadow: '0 2px 8px rgba(61,45,35,0.03)',
                    boxSizing: 'border-box',
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        backgroundColor: '#faf6f0',
                        border: '1.5px solid #eeddc8',
                        color: '#785839',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      <HomeOutlined />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: '#3d2d23',
                          fontSize: '1.05rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={displayName}
                      >
                        {displayName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#8c735f', marginTop: 2 }}>
                        Sanctuary Suite Unit
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.35rem 0.85rem',
                      borderRadius: 999,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: isAvailable ? '#ecfdf5' : isMaintenance ? '#fef2f2' : '#eff6ff',
                      color: isAvailable ? '#047857' : isMaintenance ? '#b91c1c' : '#1d4ed8',
                      border: `1.5px solid ${isAvailable ? '#a7f3d0' : isMaintenance ? '#fecaca' : '#bfdbfe'}`,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: isAvailable ? '#10b981' : isMaintenance ? '#ef4444' : '#3b82f6',
                      }}
                    />
                    {r.status || 'Available'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
