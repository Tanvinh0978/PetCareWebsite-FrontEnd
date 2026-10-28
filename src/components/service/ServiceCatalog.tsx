import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { PawIcon } from '@/components/common/PetIcons';
import { listActiveServices } from '@/api/serviceApi';
import { getErrorMessage } from '@/api/client';
import {
  SERVICE_TYPE_LABEL,
  SERVICE_TYPE_BADGE_CONFIG,
  type ServiceListItem,
  type ServiceType,
} from '@/types/service';

// Danh sách dịch vụ đang hoạt động, dùng chung cho guest và customer.
export default function ServiceCatalog({
  detailBase,
  showSignInHint,
}: {
  detailBase: string;
  showSignInHint?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') as ServiceType | null;
  const [items, setItems] = useState<ServiceListItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listActiveServices()
      .then(setItems)
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const kw = keyword.trim().toLowerCase();
  const shown = useMemo(
    () =>
      items.filter(
        (s) =>
          (!type || s.serviceType === type) &&
          (!kw ||
            s.name.toLowerCase().includes(kw) ||
            (s.description ?? '').toLowerCase().includes(kw))
      ),
    [items, type, kw]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    (Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).forEach((t) => {
      counts[t] = items.filter((s) => s.serviceType === t).length;
    });
    return counts;
  }, [items]);

  return (
    <section className="page">
      {/* Header section */}
      <div className="page-head" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)', color: 'var(--slate-900)' }}>
            Curated Services &amp; Treatments
          </h1>
          <p className="page-subtitle" style={{ margin: '0.35rem 0 0', color: 'var(--slate-500)', fontSize: '0.95rem' }}>
            Explore our specialized wellness routines, botanical spa therapies, and nutrition plans for dogs and cats.
          </p>
        </div>
        {!showSignInHint && (
          <Link to="/customer/booking" className="btn" style={{ padding: '0.65rem 1.4rem' }}>
            Book an Appointment
          </Link>
        )}
      </div>

      {showSignInHint && (
        <div style={{ marginBottom: '1.5rem', padding: '12px 18px', background: '#fef3c7', borderRadius: 10, border: '1px solid #fde68a', color: '#92400e', fontSize: '0.92rem' }}>
          <Link to="/login" style={{ fontWeight: 700, textDecoration: 'underline', color: '#78350f' }}>Sign in</Link> to reserve personalized appointments and hotel stays for your pets.
        </div>
      )}

      {/* Unified Search & Category Filter Bar */}
      <div
        style={{
          background: 'var(--paper-card, #ffffff)',
          border: '1px solid #e8ded6',
          borderRadius: 16,
          padding: '16px 20px',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Search input with icon */}
        <div>
          <Input
            prefix={<SearchOutlined style={{ color: '#8c7b6f', fontSize: 16, marginRight: 4 }} />}
            placeholder="Search services by name, keywords, or description..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            size="large"
            style={{
              borderRadius: 10,
              borderColor: '#e8ded6',
              backgroundColor: 'var(--paper, #fdf9f3)',
              fontSize: '0.95rem',
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#8c7b6f', marginRight: 4 }}>
            Filter by:
          </span>

          <button
            type="button"
            onClick={() => setParams({})}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '999px',
              fontSize: '0.88rem',
              fontWeight: !type ? 700 : 500,
              cursor: 'pointer',
              border: !type ? '1px solid #3d2d23' : '1px solid #e8ded6',
              backgroundColor: !type ? '#3d2d23' : 'var(--paper, #fdf9f3)',
              color: !type ? '#ffffff' : '#6b5e54',
              boxShadow: !type ? '0 2px 6px rgba(61,45,35,0.2)' : 'none',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            All Services
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                backgroundColor: !type ? 'rgba(255,255,255,0.2)' : '#e8ded6',
                color: !type ? '#ffffff' : '#785839',
              }}
            >
              {categoryCounts.all ?? items.length}
            </span>
          </button>

          {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => {
            const isSelected = type === t;
            const badge = SERVICE_TYPE_BADGE_CONFIG[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setParams({ type: t })}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '999px',
                  fontSize: '0.88rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #3d2d23' : '1px solid #e8ded6',
                  backgroundColor: isSelected ? '#3d2d23' : 'var(--paper, #fdf9f3)',
                  color: isSelected ? '#ffffff' : '#6b5e54',
                  boxShadow: isSelected ? '0 2px 6px rgba(61,45,35,0.2)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {badge?.label || SERVICE_TYPE_LABEL[t]}
                {categoryCounts[t] !== undefined && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '999px',
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#e8ded6',
                      color: isSelected ? '#ffffff' : '#785839',
                    }}
                  >
                    {categoryCounts[t]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <p style={{ color: '#8c7b6f', padding: '2rem 0', textAlign: 'center' }}>Loading curated services...</p>}
      {error && <p className="msg error">{error}</p>}
      {!loading && !error && shown.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#fff', borderRadius: '16px', border: '1px solid #e8ded6', margin: '1.5rem 0' }}>
          <PawIcon size={40} style={{ color: '#c69f7b', opacity: 0.7, marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#26180f' }}>No matching services found</h3>
          <p style={{ color: '#8c7b6f', margin: 0 }}>Try clearing your search keyword or selecting a different category.</p>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid">
        {shown.map((s) => {
          const badge = SERVICE_TYPE_BADGE_CONFIG[s.serviceType] || {
            label: SERVICE_TYPE_LABEL[s.serviceType] || s.serviceType,
            bg: '#f8fafc',
            color: '#475569',
            border: '#e2e8f0',
          };

          return (
            <article
              key={s.id}
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                border: '1px solid #e8ded6',
                boxShadow: 'var(--shadow-sm)',
                backgroundColor: 'var(--paper-card, #ffffff)',
                transition: 'all 0.25s ease',
              }}
            >
              {s.imageUrl ? (
                <div style={{ height: 180, width: '100%', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                  <img
                    src={s.imageUrl}
                    alt={s.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: 160,
                    width: '100%',
                    backgroundColor: 'var(--paper, #fdf9f3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #e8ded6',
                  }}
                >
                  <PawIcon size={36} style={{ color: '#c69f7b', opacity: 0.8 }} />
                </div>
              )}

              <div style={{ padding: '1.25rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.65rem' }}>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '0.22rem 0.75rem',
                      borderRadius: '999px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.25rem', margin: '0.15rem 0 0', color: 'var(--slate-900)' }}>
                  {s.name}
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: '1.55', flex: 1 }}>
                  {s.description}
                </p>

                <div className="actions" style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to={detailBase + '/' + s.id}
                    className="btn-action view"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      padding: '0.5rem 0.95rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--paper, #fdf9f3)',
                      borderColor: '#e8ded6',
                      color: '#3d2d23',
                      fontWeight: 600,
                    }}
                  >
                    View details →
                  </Link>
                  {!showSignInHint && (
                    <Link
                      to="/customer/booking"
                      className="btn"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.88rem',
                        borderRadius: '8px',
                        backgroundColor: '#3d2d23',
                        borderColor: '#3d2d23',
                        color: '#ffffff',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Book now
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
