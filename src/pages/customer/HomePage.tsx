import { PawIcon } from '@/components/common/PetIcons'
import { HomeOutlined, ScissorOutlined, CoffeeOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { ROLE_BASE } from '@/auth/roles';
import { SERVICE_TYPE_LABEL, type ServiceType } from '@/types/service';
import { roomTypeService, type RoomTypeDTO } from '@/services/roomType.service';
import { reviewService } from '@/services/review.service';
import type { ReviewListItem } from '@/types/review.types';

interface ServiceMeta {
  icon: React.ReactNode;
  tagline: string;
  description: string;
}

const SERVICE_META: Record<ServiceType, ServiceMeta> = {
  Boarding: {
    icon: <HomeOutlined style={{ fontSize: '26px', color: 'var(--secondary)' }} />,
    tagline: 'Sanctuary Suites & Chambers',
    description: 'Comfortable, climate-controlled boarding suites with soft bedding and dedicated care for dogs and cats.',
  },
  Grooming: {
    icon: <ScissorOutlined style={{ fontSize: '26px', color: 'var(--secondary)' }} />,
    tagline: 'Botanical Spa & Styling',
    description: 'Gentle bathing, warm hand-blow drying, breed-specific styling, ear cleaning, and soothing paw treatments.',
  },
  Diet: {
    icon: <CoffeeOutlined style={{ fontSize: '26px', color: 'var(--secondary)' }} />,
    tagline: 'Artisanal Nutrition & Fresh Dining',
    description: 'Fresh, balanced meals and specialized nutrition plans tailored to your companion’s health profile.',
  },
  Care: {
    icon: <MedicineBoxOutlined style={{ fontSize: '26px', color: 'var(--secondary)' }} />,
    tagline: 'Attentive Clinical Wellness',
    description: 'Routine wellness observations, medication administration, health observation, and clinical care logs.',
  },
};

export default function HomePage() {
  const { role } = useAuth();
  const base = ROLE_BASE[role];
  const servicesUrl = (base ? base : '') + '/services';
  const roomTypesUrl = (base ? base : '') + '/room-types';
  const bookingUrl = role === 'customer' ? '/customer/booking' : (role === 'admin' ? '/admin/bookings' : '/login');

  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    roomTypeService
      .fetchAll()
      .then((res) => {
        if (res.isSuccess && res.result) {
          setRoomTypes(res.result.slice(0, 3));
        }
      })
      .catch((err) => console.error('Failed to load room types:', err))
      .finally(() => setLoadingRooms(false));

    reviewService
      .getReviews({ pageSize: 3 })
      .then((res) => {
        if (res.isSuccess && res.result?.items) {
          setReviews(res.result.items);
        }
      })
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => setLoadingReviews(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="home-hero-wrap">
        <div className="home-hero-container">
          {/* Left Text Column */}
          <div className="home-hero-content">
            <div className="hero-pill-badge">
              <PawIcon size={14} style={{ marginRight: 6, color: 'var(--secondary)' }} /> Cotswolds Country Retreat &amp; Luxury Spa
            </div>
            <h1>A Warm Retreat for Your Beloved Pets.</h1>
            <p>
              Where tailored hospitality meets loving care. Thoughtfully designed suites, certified caregivers, and bespoke wellness routines for dogs and cats.
            </p>

            <div className="hero-cta-buttons">
              <Link to={roomTypesUrl} className="btn">
                Explore Hotel Suites
              </Link>
              <Link to={servicesUrl} className="btn btn-secondary">
                Browse Care Services
              </Link>
            </div>

            {/* Social Proof & Rating Badge */}
            <div className="hero-social-proof">
              <div className="avatar-group">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDefO_Ow1wAeKrw4sB7kkQjyUMfwsPbgKeKO8O8wtlpIDKuaqrAkIIdVYH0LWmt-nR6pzrEJ7-gvufft3_PN_VKa_Fep1aAS1d9Si8i7w2HlLSZaqSjMawHKspUZZql5_u3pbkFIEpmCNb-uy1SFbNuPH0QOtxwzCN6T81Iq6V4RsiZICs9okw59v1oXqW9kxouGRj_k1p74TBc0qPUWTPoJ1Ta6T7l8e1i5yC67EJ6VmOfSRl-hFf9"
                  alt="Samoyed"
                />
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRgb_kKgu3Ec1IYNL5JCInYW6PKlNKcfbRWn0l9Qku3osIUjHiC6zmA2d_2t_BM2MK33xHRI610TtrQ9-IQ0xQyGP9oCtEZvp553IYpEuRbo1rLCkXT_zcVQzsitCyaTePniXiiYEZoTmMm-VRMeHvpYCvcsXpxbJ7y4W2PU1eY76DAcD0QDPB8AwLwoR67Gw3q6tsOJ6qs4QwelJTze8VdPCcvV7KWxm_gpq_BSsuCEf8R84PFpL1"
                  alt="British Shorthair"
                />
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuANGX2NUsOcd4APY9zoR-U1XCi6jFRP-GOwM3nHR0qnW8Wr8zRve8zNdIAVwEh_YBlhYRr_xOHFe6VBQ-VkvgJsRZqIy10aypPpwXGdx9ltT3AljHHASAgRQOGjZR5Quve4970o0B2JRCwaWHn7gPmKG7I3Q85r8NBPnHMoM3Og1rVwTZeEFFm620iBWC8_bQGyQRpWCef2wOcNMfuoIzpLR9ZQe4CX2Ok18qkUiOKGfavr9xlO85UP"
                  alt="Golden Puppy"
                />
              </div>
              <div className="hero-rating-text">
                <div>⭐ <strong>Premium Pet Hospitality</strong></div>
                <span>Dedicated Care &amp; Comfortable Boarding</span>
              </div>
            </div>
          </div>

          {/* Right Hero Photography */}
          <div className="home-hero-image-wrap">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu2kxRQOsqJLyTIrW4Y7OpZhRDdJArlfSkk6_sabPBbjbWnjkkZoON0nQEKU2mOyD4bSQFHjPEnoX_dMGNbGnVpJirdItDmVZgLjRonBIiPu56s_NXGIgzNflMfKnM4VaG_br_ecQe5PlATgy7XmuLw2fLEUNlVM422B7M2cR9LnOWqTfULEJO6DHeczusBY7XSd0oHEpAmDwBuw0A68_1Fz_Bt90rJaQs8CQ73Xj7qZdzyKqeW3BM"
              alt="Golden Retriever lounging in luxury pet sanctuary suite"
            />
          </div>
        </div>
      </section>

      {/* Sanctuary Suites & Chambers Showcase (Real RoomTypes from Database) */}
      <section className="home-section" id="suites">
        <div className="section-header">
          <span className="section-tag">Suites &amp; Lodgings</span>
          <h2>Sanctuary Suites &amp; Chambers</h2>
          <p>
            Private, comfortable climate enclosures prioritizing your pet’s relaxation, security, and restful sleep.
          </p>
        </div>

        {loadingRooms ? (
          <p style={{ textAlign: 'center', color: '#785839', padding: '2rem 0' }}>Loading suites...</p>
        ) : roomTypes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '14px', border: '1px solid #e8ded6' }}>
            <p style={{ color: '#64748b', margin: '0 0 1rem' }}>No room types available at the moment.</p>
            <Link to={roomTypesUrl} className="btn btn-sm">Explore Room Catalog</Link>
          </div>
        ) : (
          <div className="suites-grid">
            {roomTypes.map((roomType) => (
              <div key={roomType.id} className="suite-card">
                <div className="suite-image-box">
                  {roomType.imageUrl ? (
                    <img src={roomType.imageUrl} alt={roomType.name} />
                  ) : (
                    <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                      <HomeOutlined style={{ fontSize: '2.5rem', color: 'var(--secondary)' }} />
                    </div>
                  )}
                  
                </div>
                <div className="suite-body">
                  <h3>{roomType.name}</h3>
                  <p>{roomType.description || 'Spacious, clean, and safe boarding accommodation for your companion.'}</p>
                  <div className="suite-footer" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                      <Link to={`${roomTypesUrl}/${roomType.id}`} className="btn-outline btn-sm">
                        Details
                      </Link>
                      <Link to={bookingUrl} className="btn btn-sm">
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Curated Daily Rhythms (4 Pillars Grid) */}
      <section className="home-section" id="services">
        <div className="section-header">
          <span className="section-tag">Care Protocol</span>
          <h2>Curated Daily Rhythms</h2>
          <p>
            Compassionate care rhythms structured to alleviate separation anxiety and foster joyful contentment.
          </p>
        </div>

        <div className="rhythms-grid">
          {(Object.keys(SERVICE_META) as ServiceType[]).map((type) => {
            const meta = SERVICE_META[type];
            const targetUrl = type === 'Boarding' ? roomTypesUrl : `${servicesUrl}?type=${type}`;
            return (
              <Link key={type} to={targetUrl} className="rhythm-card">
                <div className="rhythm-icon-circle">{meta.icon}</div>
                <h3>{SERVICE_TYPE_LABEL[type]}</h3>
                <p style={{ color: '#785839', fontWeight: 600, fontSize: '0.88rem', margin: '0 0 0.5rem' }}>
                  {meta.tagline}
                </p>
                <p>{meta.description}</p>
                <span className="rhythm-link">
                  {type === 'Boarding' ? 'View Hotel Suites →' : `Explore ${SERVICE_TYPE_LABEL[type]} →`}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Real Customer Reviews Section (From Database) */}
      {!loadingReviews && reviews.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <span className="section-tag">Client Love</span>
            <h2>What Pet Parents Say</h2>
            <p>Read genuine reviews from families who trust us with their beloved animal companions.</p>
          </div>

          <div className="testimonials-grid">
            {reviews.map((review) => (
              <div key={review.id} className="testimonial-card">
                <div>
                  <div className="testimonial-stars">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <p className="testimonial-text">
                    “{review.comment || 'Great experience for my pet! Highly recommended.'}”
                  </p>
                </div>
                <div className="testimonial-author">
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: '#e8ded6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#785839',
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {(review.customerName || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="author-info">
                    <h5>{review.customerName || 'Pet Parent'}</h5>
                    <p>{review.serviceName ? `Service: ${review.serviceName}` : 'Verified Client'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call To Action Banner */}
      <div className="cta-banner">
        <h2>Give Your Companion the Stay They Deserve.</h2>
        <p>
          Reserve your companion’s stay today. Bespoke care, comfortable suites, and dedicated staff.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={bookingUrl} className="cta-btn-gold">
            Reserve a Suite Now →
          </Link>
          <Link
            to={servicesUrl}
            className="btn-outline"
            style={{ color: '#fdf9f3', borderColor: 'rgba(232, 222, 214, 0.4)', background: 'transparent', padding: '0.85rem 2rem' }}
          >
            Explore Services
          </Link>
        </div>
      </div>
    </div>
  );
}
