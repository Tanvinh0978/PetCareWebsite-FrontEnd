import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Button, Spin, Tag, Card, Row, Col } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CalendarOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { DogIcon, CatIcon, PawIcon } from '@/components/common/PetIcons';
import { petService } from '@/services/pet.service';
import { customerService } from '@/services/customer.service';
import type { PetDTO } from '@/types/pet.types';
import { isCat, getPetSpeciesLabel } from '@/types/pet.types';
import { getApiErrorMessage } from '@/utils/apiError';

interface PetDetailProps {
  backTo?: string;
  editTo?: (id: string) => string;
}

export default function PetDetail({ backTo, editTo }: PetDetailProps) {
  const { id = '' } = useParams();
  const location = useLocation();
  const isStaff = location.pathname.startsWith('/staff');
  const isCustomer = location.pathname.startsWith('/customer');
  const defaultBackTo = isCustomer ? '/customer/pets' : isStaff ? '/staff/pets' : '/admin/pets';
  const resolvedBackTo = backTo || defaultBackTo;
  const resolvedEditTo = editTo || ((pid: string) => `${defaultBackTo}/${pid}/edit`);

  const [pet, setPet] = useState<PetDTO | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<{ id?: string; name?: string; phone?: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    petService
      .fetchById(id)
      .then(async (res: any) => {
        if (cancelled) return;
        const petData: PetDTO = res?.result ?? res;
        setPet(petData);

        // Try resolving owner details if customerId is present (for Staff / Admin view)
        if (petData?.customerId) {
          try {
            const custRes = await customerService.fetchById(petData.customerId);
            const cust = (custRes as any)?.result ?? custRes;
            if (!cancelled && cust) {
              setOwnerInfo({
                id: cust.id,
                name: cust.fullName || petData.ownerName,
                phone: cust.phoneNumber,
                email: cust.email,
              });
            }
          } catch {
            if (!cancelled && petData.ownerName) {
              setOwnerInfo({ name: petData.ownerName });
            }
          }
        } else if (petData?.ownerName) {
          setOwnerInfo({ name: petData.ownerName });
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
        <Spin size="large" tip="Loading pet dossier..." />
      </section>
    );
  }

  if (error || !pet) {
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
          {error || 'Pet not found.'}
        </div>
        <Link to={resolvedBackTo} className="btn-action view" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeftOutlined /> Back to Pets
        </Link>
      </section>
    );
  }

  const isPetCat = isCat(pet.species);
  const speciesLabel = getPetSpeciesLabel(pet.species);
  const customerBase = isStaff ? '/staff/customers' : '/admin/customers';

  // Life stage deduction
  const getLifeStage = (ageVal?: number) => {
    if (ageVal === undefined || ageVal === null) return 'Companion';
    if (ageVal < 1) return isPetCat ? 'Kitten' : 'Puppy';
    if (ageVal <= 7) return 'Adult Companion';
    return 'Senior Member';
  };

  // Weight tier deduction
  const getWeightTier = (w?: number) => {
    if (!w) return 'Standard';
    if (w < 5) return 'Toy / Small (< 5kg)';
    if (w <= 15) return 'Medium (5 - 15kg)';
    return 'Large (> 15kg)';
  };

  return (
    <section className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Top Header / Breadcrumbs Bar */}
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
          className="btn-action view"
          style={{
            padding: '0.45rem 1.1rem',
            borderRadius: 8,
            backgroundColor: 'var(--paper, #fdf9f3)',
            borderColor: '#e8ded6',
            color: '#3d2d23',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 12 }} />
          <span>{isCustomer ? 'Back to My Pets' : 'Back to Pet List'}</span>
        </Link>

        {/* Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isCustomer && (
            <Link
              to={`/customer/booking?petId=${pet.id}`}
              className="btn-primary"
              style={{
                backgroundColor: '#3d2d23',
                borderColor: '#3d2d23',
                color: '#ffffff',
                padding: '0.45rem 1.25rem',
                borderRadius: 8,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(61,45,35,0.15)',
              }}
            >
              <CalendarOutlined style={{ fontSize: 13 }} />
              <span>Book Sanctuary Experience</span>
            </Link>
          )}

          {resolvedEditTo && (
            <Link
              to={resolvedEditTo(pet.id)}
              className="btn-action edit"
              style={{
                padding: '0.45rem 1.1rem',
                borderRadius: 8,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
              }}
            >
              <EditOutlined style={{ fontSize: 13 }} />
              <span>Edit Profile</span>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Showcase Card */}
      <Card
        style={{
          borderRadius: 20,
          border: '1px solid #e8ded6',
          backgroundColor: 'var(--paper-card, #ffffff)',
          boxShadow: '0 4px 20px -2px rgba(61,45,35,0.06)',
          marginBottom: 24,
        }}
        bodyStyle={{ padding: '32px 36px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            flexWrap: 'wrap',
            paddingBottom: 28,
            borderBottom: '1px solid #f1ece7',
          }}
        >
          {/* Pet Avatar with double ring */}
          <div style={{ position: 'relative' }}>
            {pet.imageUrl ? (
              <img
                src={pet.imageUrl}
                alt={pet.name}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #c69f7b',
                  boxShadow: '0 4px 12px rgba(120,88,57,0.18)',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  background: isPetCat ? '#faf5ff' : '#eff6ff',
                  border: `3px solid ${isPetCat ? '#c084fc' : '#93c5fd'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
              >
                {isPetCat ? <CatIcon size={52} /> : <DogIcon size={52} />}
              </div>
            )}

            {/* Micro Species Tag on avatar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#3d2d23',
                color: '#ffffff',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
              title={speciesLabel}
            >
              {isPetCat ? <CatIcon size={16} /> : <DogIcon size={16} />}
            </div>
          </div>

          {/* Core Identity Info */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '2.1rem',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 700,
                  color: '#3d2d23',
                  letterSpacing: '-0.02em',
                }}
              >
                {pet.name}
              </h1>

              {/* Status Pill */}
              <Tag
                style={{
                  borderRadius: 999,
                  padding: '3px 12px',
                  fontWeight: 600,
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  margin: 0,
                  border: pet.isActive ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  backgroundColor: pet.isActive ? '#f0fdf4' : '#fef2f2',
                  color: pet.isActive ? '#15803d' : '#b91c1c',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: pet.isActive ? '#22c55e' : '#ef4444',
                    display: 'inline-block',
                  }}
                />
                {pet.isActive ? 'Active Sanctuary Guest' : 'Inactive'}
              </Tag>
            </div>

            {/* Badges row: Species, Breed, Gender */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 12px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  background: isPetCat ? '#faf5ff' : '#eff6ff',
                  color: isPetCat ? '#7e22ce' : '#1d4ed8',
                  border: `1px solid ${isPetCat ? '#e9d5ff' : '#bfdbfe'}`,
                }}
              >
                {isPetCat ? <CatIcon size={14} /> : <DogIcon size={14} />}
                <span>{speciesLabel}</span>
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 12px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#fdf9f3',
                  color: '#785839',
                  border: '1px solid #e8ded6',
                }}
              >
                <PawIcon size={13} style={{ color: '#c69f7b' }} />
                <span>{pet.breed || 'Mixed Breed'}</span>
              </span>

              {(pet as any).gender && (pet as any).gender !== 'Unknown' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {(pet as any).gender === 'Male' ? 'Male ♂' : 'Female ♀'}
                </span>
              )}
            </div>

            {/* Subtitle / Sanctuary Dossier ID */}
            <div style={{ fontSize: 13, color: '#8c7662', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Haven & Hound Registered Companion</span>
              {pet.id && <span>· ID: #{pet.id.slice(0, 8)}</span>}
            </div>
          </div>
        </div>

        {/* 4 Metric Highlight Tiles */}
        <div style={{ paddingTop: 28 }}>
          <Row gutter={[20, 20]}>
            {/* Tile 1: Species */}
            <Col xs={12} sm={6}>
              <div
                style={{
                  background: 'var(--paper, #fdf9f3)',
                  border: '1px solid #e8ded6',
                  borderRadius: 14,
                  padding: '16px 18px',
                  height: '100%',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Species Type
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#3d2d23', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  {isPetCat ? <CatIcon size={16} /> : <DogIcon size={16} />}
                  <span>{speciesLabel}</span>
                </div>
                <div style={{ fontSize: 12, color: '#9c826b' }}>
                  {isPetCat ? 'Feline Guest' : 'Canine Guest'}
                </div>
              </div>
            </Col>

            {/* Tile 2: Breed Lineage */}
            <Col xs={12} sm={6}>
              <div
                style={{
                  background: 'var(--paper, #fdf9f3)',
                  border: '1px solid #e8ded6',
                  borderRadius: 14,
                  padding: '16px 18px',
                  height: '100%',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Breed Lineage
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#3d2d23',
                    marginBottom: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={pet.breed || 'Mixed Breed'}
                >
                  {pet.breed || 'Mixed Breed'}
                </div>
                <div style={{ fontSize: 12, color: '#9c826b' }}>
                  Coat & styling profile
                </div>
              </div>
            </Col>

            {/* Tile 3: Weight */}
            <Col xs={12} sm={6}>
              <div
                style={{
                  background: 'var(--paper, #fdf9f3)',
                  border: '1px solid #e8ded6',
                  borderRadius: 14,
                  padding: '16px 18px',
                  height: '100%',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Body Weight
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#3d2d23', marginBottom: 2 }}>
                  {pet.weight ? `${pet.weight} kg` : '—'}
                </div>
                <div style={{ fontSize: 12, color: '#9c826b' }}>
                  {getWeightTier(pet.weight)}
                </div>
              </div>
            </Col>

            {/* Tile 4: Age */}
            <Col xs={12} sm={6}>
              <div
                style={{
                  background: 'var(--paper, #fdf9f3)',
                  border: '1px solid #e8ded6',
                  borderRadius: 14,
                  padding: '16px 18px',
                  height: '100%',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Age & Stage
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#3d2d23', marginBottom: 2 }}>
                  {pet.age !== undefined && pet.age !== null ? `${pet.age} yr${pet.age > 1 ? 's' : ''}` : '—'}
                </div>
                <div style={{ fontSize: 12, color: '#9c826b' }}>
                  {getLifeStage(pet.age)}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Health Notes & Sanctuary Care Instructions */}
      <Card
        style={{
          borderRadius: 20,
          border: '1px solid #e8ded6',
          backgroundColor: 'var(--paper-card, #ffffff)',
          boxShadow: '0 4px 20px -2px rgba(61,45,35,0.06)',
          marginBottom: 24,
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            🩺
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#3d2d23' }}>
              Health Notes & Special Care Protocols
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: '#8c7662' }}>
              Customized instructions for grooming stylists, hotel room concierges, and dietary handlers.
            </p>
          </div>
        </div>

        {pet.healthNotes ? (
          <div
            style={{
              background: '#fffbf5',
              border: '1px solid #fed7aa',
              borderRadius: 12,
              padding: '16px 20px',
              color: '#78350f',
              lineHeight: 1.6,
              fontSize: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
              <InfoCircleOutlined style={{ color: '#d97706' }} />
              <span>Special Care Instructions Provided:</span>
            </div>
            <div>{pet.healthNotes}</div>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--paper, #fdf9f3)',
              border: '1px solid #e8ded6',
              borderRadius: 12,
              padding: '16px 20px',
              color: '#785839',
              lineHeight: 1.5,
              fontSize: 13.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 18, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#3d2d23', marginBottom: 2 }}>
                Standard Sanctuary Protocol
              </div>
              <div style={{ color: '#8c7662' }}>
                No dietary restrictions, allergies, or special physical handling requirements on record.
                Our certified caregivers will apply Haven & Hound standard hypoallergenic and low-stress care practices.
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Staff & Admin Only: Owner Information Card */}
      {!isCustomer && ownerInfo && (
        <Card
          style={{
            borderRadius: 20,
            border: '1px solid #e8ded6',
            backgroundColor: 'var(--paper-card, #ffffff)',
            boxShadow: '0 4px 20px -2px rgba(61,45,35,0.06)',
            marginBottom: 24,
          }}
          bodyStyle={{ padding: '24px 30px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Owner & Primary Contact
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#3d2d23', marginBottom: 4 }}>
                <UserOutlined style={{ color: '#c69f7b' }} />
                <span>{ownerInfo.name || 'Customer'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#64748b' }}>
                {ownerInfo.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <PhoneOutlined /> {ownerInfo.phone}
                  </span>
                )}
                {ownerInfo.email && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <MailOutlined /> {ownerInfo.email}
                  </span>
                )}
              </div>
            </div>

            {ownerInfo.id && (
              <Link
                to={`${customerBase}/${ownerInfo.id}`}
                className="btn-action view"
                style={{ padding: '0.45rem 1.1rem', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}
              >
                View Owner Profile →
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Bottom Reservation Callout Banner (For Customers) */}
      {isCustomer && (
        <div
          style={{
            background: 'linear-gradient(135deg, #3d2d23 0%, #231a14 100%)',
            borderRadius: 20,
            padding: '28px 36px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            boxShadow: '0 8px 24px rgba(61,45,35,0.25)',
          }}
        >
          <div style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c69f7b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              <HeartOutlined />
              <span>Tailored Sanctuary Hospitality</span>
            </div>
            <h3 style={{ margin: '0 0 6px', color: '#ffffff', fontSize: '1.35rem', fontFamily: "'Playfair Display', Georgia, serif" }}>
              Ready to pamper {pet.name}?
            </h3>
            <p style={{ margin: 0, color: '#e8ded6', fontSize: 13.5, lineHeight: 1.5 }}>
              Choose between botanical spa grooming treatments or reserve a climate-controlled hotel suite with 24/7 dedicated caregiver attention.
            </p>
          </div>

          <Link
            to={`/customer/booking?petId=${pet.id}`}
            className="btn"
            style={{
              backgroundColor: '#c69f7b',
              borderColor: '#c69f7b',
              color: '#19120e',
              padding: '0.65rem 1.5rem',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(198,159,123,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>Book Visit for {pet.name}</span>
            <span>→</span>
          </Link>
        </div>
      )}
    </section>
  );
}
