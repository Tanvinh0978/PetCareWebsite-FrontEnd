import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getServiceById } from '@/api/serviceApi';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';
import { PRICING_UNIT_LABEL, SERVICE_TYPE_LABEL, type ServiceDetail as Detail } from '@/types/service';
import ServiceReviewsSection from '@/components/review/ServiceReviewsSection';

const vnd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' });

function weightLabel(min: number | null, max: number | null) {
  if (min === null && max === null) return 'Any weight';
  if (max === null) return 'From ' + min + ' kg';
  if (min === null) return 'Up to ' + max + ' kg';
  return min + ' to ' + max + ' kg';
}

// Dùng chung cho mọi vai trò. Chỉ truyền editTo cho vai trò được sửa (admin).
export default function ServiceDetail({ backTo, editTo }: { backTo: string; editTo?: (id: string) => string }) {
  const { id = '' } = useParams();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.SERVICE_MANAGE);
  const [service, setService] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getServiceById(id).then(setService).catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  if (error) return <section className="page"><p className="msg error">{error}</p><Link to={backTo}>Back to list</Link></section>;
  if (!service) return <section className="page"><p>Loading...</p></section>;

  return (
    <section className="page narrow">
      <div className="page-head">
        <h1>{service.name}</h1>
        {canManage && editTo && <Link to={editTo(service.id)} className="btn">Edit</Link>}
      </div>
      {service.imageUrl && (
        <div style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden', maxHeight: '320px', border: '1px solid var(--slate-200)', backgroundColor: '#f8fafc' }}>
          <img
            src={service.imageUrl}
            alt={service.name}
            style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
      <p>
        <span className="tag">{SERVICE_TYPE_LABEL[service.serviceType]}</span>
        {!service.isActive && <span className="tag off-tag">Inactive</span>}
      </p>
      <p>{service.description || 'No description.'}</p>
      <h2>Pricing</h2>
      {service.prices.length === 0 ? <p>No prices yet.</p> : (
        <div className="table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>Weight</th><th>Price</th></tr></thead>
              <tbody>
                {service.prices.map((p) => (
                  <tr key={p.id}>
                    <td>{weightLabel(p.minWeight, p.maxWeight)}</td>
                    <td><strong>{vnd.format(p.price)}</strong> / {PRICING_UNIT_LABEL[p.pricingUnit]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Reviews Section */}
      <ServiceReviewsSection serviceId={service.id} serviceName={service.name} />

      <div style={{ marginTop: '2rem' }}>
        <Link to={backTo} className="btn btn-secondary">
          ← Back to list
        </Link>
      </div>
    </section>
  );
}
