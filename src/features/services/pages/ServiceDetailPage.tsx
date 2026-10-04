import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getServiceById } from '../api';
import { getErrorMessage } from '../../../shared/api/client';
import { PRICING_UNIT_LABEL, SERVICE_TYPE_LABEL, type ServiceDetail } from '../types';

const vnd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' });

function weightLabel(min: number | null, max: number | null) {
  if (min === null && max === null) return 'Any weight';
  if (max === null) return 'From ' + min + ' kg';
  if (min === null) return 'Up to ' + max + ' kg';
  return min + ' to ' + max + ' kg';
}

export default function ServiceDetailPage() {
  const { id = '' } = useParams();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getServiceById(id).then(setService).catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  if (error) return <section className="page"><p className="msg error">{error}</p><Link to="/dich-vu">Back to list</Link></section>;
  if (!service) return <section className="page"><p>Loading...</p></section>;

  return (
    <section className="page narrow">
      <div className="page-head">
        <h1>{service.name}</h1>
        <Link to={'/services/' + service.id + '/sua'} className="btn">Edit</Link>
      </div>
      <p>
        <span className="tag">{SERVICE_TYPE_LABEL[service.serviceType]}</span>
        {!service.isActive && <span className="tag off-tag">Inactive</span>}
      </p>
      <p>{service.description || 'No description.'}</p>
      <h2>Pricing</h2>
      {service.prices.length === 0 ? <p>No prices yet.</p> : (
        <table className="table">
          <thead><tr><th>Weight</th><th>Price</th></tr></thead>
          <tbody>
            {service.prices.map((p) => (
              <tr key={p.id}><td>{weightLabel(p.minWeight, p.maxWeight)}</td><td>{vnd.format(p.price)} / {PRICING_UNIT_LABEL[p.pricingUnit]}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <p><Link to="/dich-vu">Back to list</Link></p>
    </section>
  );
}
