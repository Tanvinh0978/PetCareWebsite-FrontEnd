
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getServices } from '../api/services';
import { getErrorMessage } from '../api/client';
import { PRICING_UNIT_LABEL, SERVICE_TYPE_LABEL, type Service, type ServiceType } from '../types';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function priceLabel(s: Service) {
  if (s.prices.length === 0) return 'Contact us';
  const lowest = s.prices.reduce((a, b) => (b.price < a.price ? b : a));
  return `From ${vnd.format(lowest.price)} / ${PRICING_UNIT_LABEL[lowest.pricingUnit]}`;
}

export default function Services() {
  const [params, setParams] = useSearchParams();
  const type = params.get('loai') as ServiceType | null;
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getServices().then(setItems).catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false));
  }, []);

  const shown = type ? items.filter((s) => s.serviceType === type) : items;

  return (
    <section className="page">
      <h1>Services</h1>
      <div className="filters">
        <button className={!type ? 'chip on' : 'chip'} onClick={() => setParams({})}>All</button>
        {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
          <button key={t} className={type === t ? 'chip on' : 'chip'} onClick={() => setParams({ loai: t })}>
            {SERVICE_TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      {loading && <p>Loading services...</p>}
      {error && <p className="msg error">{error}</p>}
      {!loading && !error && shown.length === 0 && (
        <p>No services found in this category. <Link to="/admin/services/new">Add the first service</Link>.</p>
      )}
      <div className="grid">
        {shown.map((s) => (
          <article key={s.id} className="card">
            <span className="tag">{SERVICE_TYPE_LABEL[s.serviceType]}</span>
            <h2>{s.name}</h2>
            <p>{s.description}</p>
            <strong>{priceLabel(s)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
