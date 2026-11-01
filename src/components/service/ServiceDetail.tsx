import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Spin } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ScissorOutlined,
  HomeOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  DollarCircleOutlined,
  CalendarOutlined,
  TagOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { getServiceById } from '@/api/serviceApi';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';
import {
  PRICING_UNIT_LABEL,
  type PricingUnit,
  type ServiceDetail as Detail,
  type ServiceType,
} from '@/types/service';
import ServiceReviewsSection from '@/components/review/ServiceReviewsSection';

const TYPE_CONFIG: Record<
  ServiceType,
  { label: string; bg: string; color: string; border: string; icon: React.ReactNode }
> = {
  Grooming: {
    label: 'Grooming & Spa',
    bg: '#faf5ff',
    color: '#7e22ce',
    border: '#e9d5ff',
    icon: <ScissorOutlined />,
  },
  Boarding: {
    label: 'Hotel Boarding',
    bg: '#eff6ff',
    color: '#1d4ed8',
    border: '#bfdbfe',
    icon: <HomeOutlined />,
  },
  Diet: {
    label: 'Tailored Diet',
    bg: '#fff7ed',
    color: '#c2410c',
    border: '#fed7aa',
    icon: <HeartOutlined />,
  },
  Care: {
    label: 'Wellness & Care',
    bg: '#f0fdfa',
    color: '#0f766e',
    border: '#99f6e4',
    icon: <MedicineBoxOutlined />,
  },
};

function weightLabel(min: number | null, max: number | null) {
  if (min === null && max === null) return 'Any weight';
  if (max === null) return `From ${min} kg`;
  if (min === null) return `Up to ${max} kg`;
  return `${min} to ${max} kg`;
}

function formatVnd(val: number) {
  return val.toLocaleString('vi-VN') + ' ₫';
}

export default function ServiceDetail({
  backTo,
  editTo,
}: {
  backTo: string;
  editTo?: (id: string) => string;
}) {
  const { id = '' } = useParams();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.SERVICE_MANAGE);
  const isStaff = location.pathname.startsWith('/staff');
  const isAdmin = location.pathname.startsWith('/admin');
  const isCustomer = !isAdmin && !isStaff;

  const [service, setService] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    getServiceById(id)
      .then((data) => {
        if (!cancelled) setService(data);
      })
      .catch((e) => {
        if (!cancelled) setError(getErrorMessage(e));
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
        <Spin size="large" tip="Loading sanctuary service dossier..." />
      </section>
    );
  }

  if (error || !service) {
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
          {error || 'Service not found.'}
        </div>
        <Link
          to={backTo}
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
          <ArrowLeftOutlined /> Back to services
        </Link>
      </section>
    );
  }

  const badgeConfig = TYPE_CONFIG[service.serviceType] || {
    label: service.serviceType,
    bg: '#f8fafc',
    color: '#475569',
    border: '#e2e8f0',
    icon: <HeartOutlined />,
  };

  const prices = service.prices || [];
  const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices.map((p) => p.price)) : null;
  const primaryUnit: PricingUnit = prices.length > 0 ? prices[0].pricingUnit : 'Per_Turn';
  const unitLabel = PRICING_UNIT_LABEL[primaryUnit] || primaryUnit;

  return (
    <section className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Top Breadcrumb & Action Bar */}
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
          to={backTo}
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
          <span>Back to services</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {canManage && editTo && (
            <Link
              to={editTo(service.id)}
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
              <span>Edit Service</span>
            </Link>
          )}

          {isCustomer && (
            <Link
              to={`/customer/booking?serviceId=${service.id}`}
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
              <span>Book Sanctuary Experience</span>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Service Showcase Card */}
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
          {/* Service Image Column */}
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
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={service.name}
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
                    fontSize: 24,
                    color: '#785839',
                    boxShadow: '0 2px 6px rgba(61,45,35,0.05)',
                  }}
                >
                  {badgeConfig.icon}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#785839' }}>Haven & Hound Sanctuary</span>
              </div>
            )}
          </div>

          {/* Service Information Column */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Badges Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              {/* Category Badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.95rem',
                  borderRadius: 999,
                  backgroundColor: badgeConfig.bg,
                  color: badgeConfig.color,
                  border: `1px solid ${badgeConfig.border}`,
                }}
              >
                {badgeConfig.icon}
                <span>{badgeConfig.label}</span>
              </span>

              {/* Status Badge */}
              {service.isActive ? (
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
                  <span>Active Service</span>
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    padding: '0.35rem 0.95rem',
                    borderRadius: 999,
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                  }}
                >
                  <CloseCircleOutlined />
                  <span>Inactive</span>
                </span>
              )}

              {/* Room Type Badge if Boarding */}
              {service.serviceType === 'Boarding' && service.roomTypeName && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '0.35rem 0.95rem',
                    borderRadius: 999,
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <HomeOutlined />
                  <span>Suite: {service.roomTypeName}</span>
                </span>
              )}
            </div>

            {/* Service Name */}
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
              {service.name}
            </h1>

            {/* Pricing Highlights Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              {minPrice !== null && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '0.45rem 1rem',
                    borderRadius: 10,
                    backgroundColor: '#faf6f0',
                    border: '1px solid #eeddc8',
                    color: '#5c4230',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                  }}
                >
                  <DollarCircleOutlined style={{ color: '#c69f7b', fontSize: 16 }} />
                  <span>
                    {minPrice === maxPrice
                      ? `${formatVnd(minPrice)} / ${unitLabel}`
                      : `From ${formatVnd(minPrice)} to ${formatVnd(maxPrice!)} / ${unitLabel}`}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '0.45rem 1rem',
                  borderRadius: 10,
                  backgroundColor: '#faf6f0',
                  border: '1px solid #eeddc8',
                  color: '#785839',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                }}
              >
                <TagOutlined style={{ color: '#c69f7b' }} />
                <span>
                  {prices.length} {prices.length === 1 ? 'Weight Bracket' : 'Weight Brackets'}
                </span>
              </div>
            </div>

            {/* Description Box */}
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
                Service Description
              </div>
              {service.description ? (
                <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{service.description}</p>
              ) : (
                <p style={{ margin: 0, fontStyle: 'italic', color: '#998373' }}>
                  No description provided for this sanctuary service.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weight-Bracket Pricing Tiers Card */}
      <div
        style={{
          borderRadius: 20,
          border: '1.5px solid #eeddc8',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px -2px rgba(61,45,35,0.06)',
          padding: '28px 32px',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
            paddingBottom: 16,
            borderBottom: '1px solid #f1ece7',
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
              Weight-Bracket Pricing Tiers
            </h2>
            <p style={{ margin: '4px 0 0', color: '#8c735f', fontSize: '0.875rem' }}>
              Tailored rates calibrated to your companion's exact weight bracket and care duration.
            </p>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.35rem 0.85rem',
              borderRadius: 999,
              backgroundColor: '#faf6f0',
              border: '1px solid #eeddc8',
              color: '#785839',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            {prices.length} {prices.length === 1 ? 'Tier Configured' : 'Tiers Configured'}
          </span>
        </div>

        {prices.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              backgroundColor: '#fdfbf7',
              borderRadius: 12,
              border: '1px dashed #eeddc8',
            }}
          >
            <InfoCircleOutlined style={{ fontSize: 32, color: '#c69f7b', marginBottom: 12 }} />
            <h4 style={{ margin: '0 0 6px', color: '#3d2d23' }}>No Pricing Tiers Defined</h4>
            <p style={{ margin: 0, color: '#8c735f', fontSize: '0.9rem' }}>
              This service currently does not have any weight-based pricing configured.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1.5px solid #eeddc8' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#faf4ee', borderBottom: '1.5px solid #eeddc8' }}>
                  <th
                    style={{
                      padding: '14px 20px',
                      color: '#785839',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Weight Bracket
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      color: '#785839',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Rate (VND)
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      color: '#785839',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Billing Unit
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      color: '#785839',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p, idx) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: idx === prices.length - 1 ? 'none' : '1px solid #f1ece7',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fdfbf9',
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '0.35rem 0.85rem',
                          borderRadius: 999,
                          backgroundColor: '#f5ede4',
                          color: '#5c4230',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          border: '1px solid #e8ded6',
                        }}
                      >
                        {weightLabel(p.minWeight, p.maxWeight)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3d2d23' }}>
                        {formatVnd(p.price)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#554236',
                          fontWeight: 600,
                        }}
                      >
                        <CalendarOutlined style={{ color: '#c69f7b' }} />
                        <span>/ {PRICING_UNIT_LABEL[p.pricingUnit] || p.pricingUnit}</span>
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          padding: '0.25rem 0.65rem',
                          borderRadius: 999,
                          backgroundColor: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        <CheckCircleOutlined /> Active Tier
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sanctuary Standards & Care Assurance */}
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
              Certified Care Specialists
            </div>
            <div style={{ color: '#785839', fontSize: '0.82rem', lineHeight: 1.45 }}>
              Qualified veterinary & grooming technicians dedicated to gentle, stress-free care.
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
            <HeartOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#3d2d23', fontSize: '0.92rem', marginBottom: 3 }}>
              Weight-Tier Precision
            </div>
            <div style={{ color: '#785839', fontSize: '0.82rem', lineHeight: 1.45 }}>
              Portions, suites, and procedures are customized to your companion's physical size.
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
              Transparent Booking
            </div>
            <div style={{ color: '#785839', fontSize: '0.82rem', lineHeight: 1.45 }}>
              Fixed upfront rates with zero surprise fees. Real-time updates on care progress.
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <ServiceReviewsSection serviceId={service.id} serviceName={service.name} />

      {/* Bottom Navigation Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 36,
          paddingTop: 24,
          borderTop: '1px solid #eeddc8',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Link
          to={backTo}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0.6rem 1.4rem',
            borderRadius: 999,
            backgroundColor: '#ffffff',
            border: '1.5px solid #eeddc8',
            color: '#785839',
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(61,45,35,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 13 }} />
          <span>Back to Services</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {canManage && editTo && (
            <Link
              to={editTo(service.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.6rem 1.5rem',
                borderRadius: 999,
                backgroundColor: '#3d2d23',
                border: '1px solid #3d2d23',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(61,45,35,0.18)',
              }}
            >
              <EditOutlined style={{ fontSize: 13 }} />
              <span>Edit Service</span>
            </Link>
          )}

          {isCustomer && (
            <Link
              to={`/customer/booking?serviceId=${service.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.6rem 1.5rem',
                borderRadius: 999,
                backgroundColor: '#3d2d23',
                border: '1px solid #3d2d23',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(61,45,35,0.18)',
              }}
            >
              <CalendarOutlined style={{ fontSize: 13 }} />
              <span>Book This Service</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
