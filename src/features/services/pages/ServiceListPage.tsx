import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { deleteService, searchServices } from '../api';
import { getErrorMessage } from '../../../shared/api/client';
import { SERVICE_TYPE_LABEL, type PagedResult, type ServiceListItem, type ServiceType } from '../types';

const PAGE_SIZE = 9;

export default function ServiceListPage() {
  const [params, setParams] = useSearchParams();
  const type = params.get('loai') as ServiceType | null;
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
  const pickType = (t: ServiceType | null) => { setPage(1); setParams(t ? { loai: t } : {}); };

  async function onDelete(s: ServiceListItem) {
    if (!window.confirm('Ngừng hoạt động dịch vụ "' + s.name + '"?')) return;
    try { await deleteService(s.id); setReload((n) => n + 1); } catch (e) { setError(getErrorMessage(e)); }
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>Quản lý dịch vụ</h1>
        <Link to="/dich-vu/moi" className="btn">Thêm dịch vụ</Link>
      </div>

      <form className="toolbar" onSubmit={onSearch}>
        <input placeholder="Tìm theo tên hoặc mô tả" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} aria-label="Từ khóa" />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as typeof status); }} aria-label="Trạng thái">
          <option value="all">Mọi trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Ngừng hoạt động</option>
        </select>
        <button className="btn">Tìm</button>
      </form>

      <div className="filters">
        <button className={!type ? 'chip on' : 'chip'} onClick={() => pickType(null)}>Tất cả</button>
        {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
          <button key={t} className={type === t ? 'chip on' : 'chip'} onClick={() => pickType(t)}>{SERVICE_TYPE_LABEL[t]}</button>
        ))}
      </div>

      {loading && <p>Đang tải dịch vụ...</p>}
      {error && <p className="msg error">{error}</p>}
      {!loading && !error && data?.items.length === 0 && <p>Không có dịch vụ nào phù hợp.</p>}

      <div className="grid">
        {data?.items.map((s) => (
          <article key={s.id} className={s.isActive ? 'card' : 'card off'}>
            <div>
              <span className="tag">{SERVICE_TYPE_LABEL[s.serviceType]}</span>
              {!s.isActive && <span className="tag off-tag">Ngừng hoạt động</span>}
            </div>
            <h2>{s.name}</h2>
            <p>{s.description}</p>
            <div className="actions">
              <Link to={'/dich-vu/' + s.id}>Xem</Link>
              <Link to={'/dich-vu/' + s.id + '/sua'}>Sửa</Link>
              {s.isActive && <button className="link" onClick={() => onDelete(s)}>Xóa</button>}
            </div>
          </article>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="pager">
          <button className="chip" disabled={!data.hasPreviousPage} onClick={() => setPage(page - 1)}>Trang trước</button>
          <span>Trang {data.pageNumber} / {data.totalPages}</span>
          <button className="chip" disabled={!data.hasNextPage} onClick={() => setPage(page + 1)}>Trang sau</button>
        </div>
      )}
    </section>
  );
}
