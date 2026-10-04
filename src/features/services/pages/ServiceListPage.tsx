import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { deleteService, searchServices } from '../api';
import { getErrorMessage } from '../../../shared/api/client';
import { SERVICE_TYPE_LABEL, type PagedResult, type ServiceListItem, type ServiceType } from '../types';

const PAGE_SIZE = 9;

export default function ServiceListPage() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') as ServiceType | null;
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<PagedResult<ServiceListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchServices({
      keyword: keyword || undefined,
      serviceType: type ?? undefined,
      isActive: status === 'all' ? undefined : status === 'active',
      pageNumber: page,
      pageSize: PAGE_SIZE,
    })
      .then((d) => { if (!cancelled) { setData(d); setError(''); } })
      .catch((e) => { if (!cancelled) setError(getErrorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [keyword, type, status, page, reload]);

  const onSearch = (e: FormEvent) => { e.preventDefault(); setPage(1); setKeyword(keywordInput.trim()); };
  const pickType = (t: ServiceType | null) => { setPage(1); setParams(t ? { type: t } : {}); };

  async function onDelete(s: ServiceListItem) {
    if (!window.confirm('Deactivate service "' + s.name + '"?')) return;
    try { await deleteService(s.id); setReload((n) => n + 1); } catch (e) { setError(getErrorMessage(e)); }
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>Services</h1>
        <Link to="/services/moi" className="btn">Add service</Link>
      </div>

      <form className="toolbar" onSubmit={onSearch}>
        <input placeholder="Search by name or description" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} aria-label="Keyword" />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as typeof status); }} aria-label="Status">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="btn">Search</button>
      </form>

      <div className="filters">
        <button className={!type ? 'chip on' : 'chip'} onClick={() => pickType(null)}>All</button>
        {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
          <button key={t} className={type === t ? 'chip on' : 'chip'} onClick={() => pickType(t)}>{SERVICE_TYPE_LABEL[t]}</button>
        ))}
      </div>

      {loading && <p>Loading services...</p>}
      {error && <p className="msg error">{error}</p>}
      {!loading && !error && data?.items.length === 0 && <p>No matching services.</p>}

      <div className="grid">
        {data?.items.map((s) => (
          <article key={s.id} className={s.isActive ? 'card' : 'card off'}>
            <div>
              <span className="tag">{SERVICE_TYPE_LABEL[s.serviceType]}</span>
              {!s.isActive && <span className="tag off-tag">Inactive</span>}
            </div>
            <h2>{s.name}</h2>
            <p>{s.description}</p>
            <div className="actions">
              <Link to={'/services/' + s.id}>View</Link>
              <Link to={'/services/' + s.id + '/sua'}>Edit</Link>
              {s.isActive && <button className="link" onClick={() => onDelete(s)}>Delete</button>}
            </div>
          </article>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="pager">
          <button className="chip" disabled={!data.hasPreviousPage} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {data.pageNumber} / {data.totalPages}</span>
          <button className="chip" disabled={!data.hasNextPage} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </section>
  );
}
