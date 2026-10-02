import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getServices } from '../api';
import { getErrorMessage } from '../../../shared/api/client';
import { PRICING_UNIT_LABEL, SERVICE_TYPE_LABEL, type Service, type ServiceType } from '../types';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function priceLabel(s: Service) {
  if (s.prices.length === 0) return 'Liên hệ';
  const lowest = s.prices.reduce((a, b) => (b.price < a.price ? b : a));
  return `Từ ${vnd.format(lowest.price)} / ${PRICING_UNIT_LABEL[lowest.pricingUnit]}`;
}

export default function ServiceListPage() {
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
      <h1>Dịch vụ</h1>
      <div className="filters">
        <button className={!type ? 'chip on' : 'chip'} onClick={() => setParams({})}>Tất cả</button>
        {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
          <button key={t} className={type === t ? 'chip on' : 'chip'} onClick={() => setParams({ loai: t })}>
            {SERVICE_TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      {loading && <p>Đang tải dịch vụ...</p>}
      {error && <p className="msg error">{error}</p>}
      {!loading && !error && shown.length === 0 && (
        <p>Chưa có dịch vụ nào trong nhóm này. <Link to="/quan-ly/dich-vu/moi">Thêm dịch vụ đầu tiên</Link>.</p>
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
