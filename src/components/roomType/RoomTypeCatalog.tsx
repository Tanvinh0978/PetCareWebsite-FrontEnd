import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { PawIcon } from '@/components/common/PetIcons';
import { roomTypeService, type RoomTypeDTO } from '@/services/roomType.service';
import { getApiErrorMessage } from '@/utils/apiError';

interface RoomTypeCatalogProps {
  detailBase: string;
  showSignInHint?: boolean;
}

export default function RoomTypeCatalog({ detailBase, showSignInHint }: RoomTypeCatalogProps) {
  const [items, setItems] = useState<RoomTypeDTO[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    roomTypeService
      .fetchAll()
      .then((res) => {
        if (res.isSuccess && res.result) {
          setItems(res.result);
        } else {
          setError(res.message || 'Failed to load room types');
        }
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const kw = keyword.trim().toLowerCase();
  const shown = useMemo(() => {
    return items.filter(
      (r) =>
        !kw ||
        r.name.toLowerCase().includes(kw) ||
        (r.description ?? '').toLowerCase().includes(kw)
    );
  }, [items, kw]);

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Pet Boarding & Hotel Suites</h1>
          <p className="page-subtitle">
            Explore our safe, comfortable, and climate-controlled boarding room types for dogs and cats.
          </p>
        </div>
        {!showSignInHint && (
          <Link to="/customer/booking" className="btn">
            Book a Stay
          </Link>
        )}
      </div>

      {showSignInHint && (
        <p className="msg ok">
          <Link to="/login" style={{ fontWeight: 700, textDecoration: 'underline' }}>Sign in</Link> to reserve a luxury hotel room for your pet.
        </p>
      )}

      <div
        style={{
          background: 'var(--paper-card, #ffffff)',
          border: '1px solid #e8ded6',
          borderRadius: 14,
          padding: '14px 18px',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: '24px',
        }}
      >
        <Input
          prefix={<SearchOutlined style={{ color: '#8c7b6f', fontSize: 16, marginRight: 4 }} />}
          placeholder="Search room suites by name, features, or amenities..."
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

      {loading && <p style={{ color: '#557268', padding: '2rem 0' }}>Loading room types...</p>}
      {error && <p className="msg error" role="alert">{error}</p>}
      {!loading && !error && shown.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', margin: '1.5rem 0' }}>
          
          <h3>No matching room types found</h3>
          <p style={{ color: '#64748b' }}>Try adjusting your search keyword.</p>
        </div>
      )}

      <div className="grid">
        {shown.map((r) => (
          <article
            key={r.id}
            className="card"
            style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {r.imageUrl ? (
              <div style={{ height: 180, width: '100%', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                <img
                  src={r.imageUrl}
                  alt={r.name}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.22rem 0.75rem',
                    borderRadius: '999px',
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                  }}
                >
                  Pet Hotel Suite
                </span>
              </div>

              <h2 style={{ fontSize: '1.3rem', margin: '0.25rem 0 0' }}>{r.name}</h2>
              <p style={{ color: '#475569', fontSize: '0.93rem', lineHeight: '1.55', flex: 1 }}>
                {r.description || 'Comfortable and clean private boarding room with premium ventilation and soft bedding.'}
              </p>

              <div
                className="actions"
                style={{
                  marginTop: 'auto',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <Link
                  to={detailBase + '/' + r.id}
                  className="btn-action view"
                  style={{ padding: '0.5rem 0.95rem' }}
                >
                  View details →
                </Link>
                <Link
                  to={showSignInHint ? '/login' : '/customer/booking'}
                  className="btn btn-sm"
                  style={{ padding: '0.45rem 1rem' }}
                >
                  Book now
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
