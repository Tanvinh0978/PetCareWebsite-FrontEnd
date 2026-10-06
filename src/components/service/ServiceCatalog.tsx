import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listActiveServices } from '@/api/serviceApi';
import { getErrorMessage } from '@/api/client';
import { SERVICE_TYPE_LABEL, type ServiceListItem, type ServiceType } from '@/types/service';

// Danh sách dịch vụ đang hoạt động, dùng chung cho guest và customer.
export default function ServiceCatalog({ detailBase, showSignInHint }: { detailBase: string; showSignInHint?: boolean }) {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') as ServiceType | null;
  const [items, setItems] = useState<ServiceListItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listActiveServices().then(setItems).catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false));
  }, []);

  const kw = keyword.trim().toLowerCase();
  const shown = useMemo(() => items.filter((s) =>
    (!type || s.serviceType === type) &&
    (!kw || s.name.toLowerCase().includes(kw) || (s.description ?? '').toLowerCase().includes(kw))), [items, type, kw]);

  return (
    <section className="page">
      <h1>Our services</h1>
      {showSignInHint && <p className="msg ok"><Link to="/login">Sign in</Link> to book a service.</p>}
      <div className="toolbar">
        <input placeholder="Search by name or description" value={keyword} onChange={(e) => setKeyword(e.target.value)} aria-label="Keyword" />
      </div>
      <div className="filters">
        <button className={!type ? 'chip on' : 'chip'} onClick={() => setParams({})}>All</button>
        {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
          <button key={t} className={type === t ? 'chip on' : 'chip'} onClick={() => setParams({ type: t })}>{SERVICE_TYPE_LABEL[t]}</button>
        ))}
      </div>
      {loading && <p>Loading services...</p>}
      {error && <p className="msg error">{error}</p>}
      {!loading && !error && shown.length === 0 && <p>No matching services.</p>}
      <div className="grid">
        {shown.map((s) => (
          <article key={s.id} className="card">
            <div><span className="tag">{SERVICE_TYPE_LABEL[s.serviceType]}</span></div>
            <h2>{s.name}</h2>
            <p>{s.description}</p>
            <div className="actions" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
              <Link to={detailBase + '/' + s.id} className="btn-action view" style={{ padding: '0.45rem 0.95rem' }}>
                View details →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
