import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { ROLE_BASE } from '@/auth/roles';
import { SERVICE_TYPE_LABEL, type ServiceType } from '@/types/service';

interface ServiceMeta {
  icon: string;
  tagline: string;
  description: string;
  highlights: string[];
}

const SERVICE_META: Record<ServiceType, ServiceMeta> = {
  Grooming: {
    icon: '🛁',
    tagline: 'Pampering Spa & Styling',
    description: 'Gentle bathing, warm blow-drying, breed-standard haircuts, nail clipping, and ear care.',
    highlights: ['Hypoallergenic shampoos', 'Stress-free handling', 'Full styling'],
  },
  Boarding: {
    icon: '🏡',
    tagline: 'Cozy Hotel & Daycare',
    description: 'Climate-controlled private rooms, regular outdoor playtime, soft bedding, and constant companionship.',
    highlights: ['24/7 CCTV surveillance', 'Daily exercise & playtime', 'Comfort suites'],
  },
  Diet: {
    icon: '🥗',
    tagline: 'Customized Nutrition',
    description: 'Vet-formulated meal plans prepared specifically according to your pet\'s weight, breed, and health requirements.',
    highlights: ['Fresh & wholesome ingredients', 'Weight management', 'Allergy-safe recipes'],
  },
  Care: {
    icon: '🩺',
    tagline: 'Daily Health & Wellness',
    description: 'Health examinations, medication administration, post-treatment recovery monitoring, and wellness checkups.',
    highlights: ['Certified veterinary nurses', 'Detailed visit logs', 'Emergency readiness'],
  },
};

export default function HomePage() {
  const { role } = useAuth();
  const base = ROLE_BASE[role];
  const servicesUrl = (base ? base : '') + '/services';

  return (
    <div>
      {/* Hero Section */}
      <section className="home-hero-wrap">
        <div className="home-hero-content">
          <div className="hero-pill-badge">
            🐾 <span>#1 Rated Pet Care & Wellness Center</span>
          </div>
          <h1>Loving, Professional Care for Your Precious Pets</h1>
          <p>
            Whether you need a relaxing grooming spa, safe overnight boarding, vet-approved diet plans, or attentive daily health checks — we treat your furry companions like family.
          </p>
          <div className="hero-cta-buttons">
            <Link to={servicesUrl} className="btn">
              Browse Services
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
              How It Works ↓
            </a>
          </div>

          <div className="hero-trust-row">
            <span>✨ 5,000+ Happy Pets Served</span>
            <span>🩺 Certified Care Specialists</span>
            <span>📷 Daily Photo & Video Updates</span>
            <span>🛡️ 100% Sanitized & Safe Suites</span>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="home-section" id="services">
        <div className="section-header">
          <h2>Specialized Pet Services</h2>
          <p>Select a care package tailored to your dog or cat’s breed, size, and lifestyle.</p>
        </div>

        <div className="services-cat-grid">
          {(Object.keys(SERVICE_META) as ServiceType[]).map((type) => {
            const meta = SERVICE_META[type];
            return (
              <Link
                key={type}
                to={`${servicesUrl}?type=${type}`}
                className="service-cat-card"
              >
                <span className="cat-card-icon">{meta.icon}</span>
                <h3>{SERVICE_TYPE_LABEL[type]}</h3>
                <p style={{ color: '#2f7d5b', fontWeight: 600, fontSize: '0.88rem', margin: '0 0 0.5rem' }}>
                  {meta.tagline}
                </p>
                <p>{meta.description}</p>
                <span className="cat-card-link">
                  View {SERVICE_TYPE_LABEL[type]} services →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="home-section">
        <div className="section-header">
          <h2>Why Pet Parents Trust Us</h2>
          <p>We combine compassionate handling with top-tier healthcare standards.</p>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-box-icon">❤️</div>
            <h3>Passionate Caretakers</h3>
            <p>Every member of our team is CPR-certified and trained in fear-free animal behavior and handling.</p>
          </div>
          <div className="feature-box">
            <div className="feature-box-icon">📱</div>
            <h3>Daily Digital Updates</h3>
            <p>Receive heartwarming photos, feeding milestones, and activity logs straight to your phone throughout their stay.</p>
          </div>
          <div className="feature-box">
            <div className="feature-box-icon">🧼</div>
            <h3>Hospital-Grade Hygiene</h3>
            <p>Air filtration systems, UV sanitation, and individual sanitized play areas prevent cross-contamination.</p>
          </div>
          <div className="feature-box">
            <div className="feature-box-icon">⚖️</div>
            <h3>Transparent Pricing</h3>
            <p>Clear pricing tiers determined by weight bracket with zero hidden fees or unexpected surcharges.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="home-section" id="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Booking the perfect care for your pet takes only a few simple steps.</p>
        </div>

        <div className="steps-grid">
          <div className="step-item">
            <div className="step-badge">1</div>
            <h3>Explore Services</h3>
            <p>Browse our catalog of grooming, luxury boarding suites, nutrition diets, and health checks.</p>
          </div>
          <div className="step-item">
            <div className="step-badge">2</div>
            <h3>Schedule a Date</h3>
            <p>Select your desired date, package options, and any special dietary or handling instructions.</p>
          </div>
          <div className="step-item">
            <div className="step-badge">3</div>
            <h3>Drop Off & Relax</h3>
            <p>Bring your pet to our center. Our friendly staff welcomes them warmly and gets them settled in.</p>
          </div>
          <div className="step-item">
            <div className="step-badge">4</div>
            <h3>Happy Reunion</h3>
            <p>Pick up your refreshed, well-groomed, and happy pet alongside a complete visit summary report.</p>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <div className="cta-banner">
        <h2>Ready to Pamper Your Furry Companion?</h2>
        <p>
          Join thousands of delighted pet owners. Explore our range of professional care services and give your pet the best experience today.
        </p>
        <Link to={servicesUrl} className="btn" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
          Explore Services Now
        </Link>
      </div>
    </div>
  );
}
