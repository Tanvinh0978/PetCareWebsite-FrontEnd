import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getServiceById } from '../api';
import { getErrorMessage } from '../../../shared/api/client';
import { PRICING_UNIT_LABEL, SERVICE_TYPE_LABEL, type ServiceDetail } from '../types';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function weightLabel(min: number | null, max: number | null) {
  if (min === null && max === null) return 'Mọi cân nặng';
  if (max === null) return 'Từ ' + min + ' kg';
  if (min === null) return 'Đến ' + max + ' kg';
  return min + ' đến ' + max + ' kg';
}

export default function ServiceDetailPage() {
  const { id = '' } = useParams();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getServiceById(id).then(setService).catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  if (error) return <section className="page"><p className="msg error">{error}</p><Link to="/dich-vu">Quay lại danh sách</Link></section>;
  if (!service) return <section className="page"><p>Đang tải...</p></section>;

  return (
    <section className="page narrow">
      <div className="page-head">
        <h1>{service.name}</h1>
        <Link to={'/dich-vu/' + service.id + '/sua'} className="btn">Sửa</Link>
      </div>
      <p>
        <span className="tag">{SERVICE_TYPE_LABEL[service.serviceType]}</span>
        {!service.isActive && <span className="tag off-tag">Ngừng hoạt động</span>}
      </p>
      <p>{service.description || 'Chưa có mô tả.'}</p>
      <h2>Bảng giá</h2>
      {service.prices.length === 0 ? <p>Chưa có mức giá.</p> : (
        <table className="table">
          <thead><tr><th>Cân nặng</th><th>Giá</th></tr></thead>
          <tbody>
            {service.prices.map((p) => (
              <tr key={p.id}><td>{weightLabel(p.minWeight, p.maxWeight)}</td><td>{vnd.format(p.price)} / {PRICING_UNIT_LABEL[p.pricingUnit]}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <p><Link to="/dich-vu">Quay lại danh sách</Link></p>
    </section>
  );
}
