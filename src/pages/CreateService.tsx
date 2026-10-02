import { useState, type FormEvent } from 'react';
import { createService } from '../api/services';
import { getErrorMessage } from '../api/client';
import {
  PRICING_UNIT_LABEL, SERVICE_TYPE_LABEL,
  type PricingUnit, type ServiceType,
} from '../types';

interface PriceRow { minWeight: string; maxWeight: string; price: string; pricingUnit: PricingUnit }
const emptyRow = (): PriceRow => ({ minWeight: '', maxWeight: '', price: '', pricingUnit: 'Per_Turn' });
const num = (v: string) => (v.trim() === '' ? null : Number(v));

// Cùng luật với CreateServiceCommandValidator ở backend.
function validate(name: string, rows: PriceRow[]): string {
  if (!name.trim()) return 'Hãy nhập tên dịch vụ.';
  if (name.length > 150) return 'Tên dịch vụ tối đa 150 ký tự.';
  for (const [i, r] of rows.entries()) {
    const n = `Mức giá ${i + 1}`;
    const min = num(r.minWeight), max = num(r.maxWeight);
    if (r.price.trim() === '' || Number(r.price) < 0) return `${n}: giá phải từ 0 trở lên.`;
    if (min !== null && min < 0) return `${n}: cân nặng tối thiểu phải từ 0 trở lên.`;
    if (max !== null && max <= 0) return `${n}: cân nặng tối đa phải lớn hơn 0.`;
    if (min !== null && max !== null && max <= min) return `${n}: cân nặng tối đa phải lớn hơn tối thiểu.`;
  }
  return '';
}

export default function CreateService() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Grooming');
  const [rows, setRows] = useState<PriceRow[]>([emptyRow()]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const setRow = (i: number, patch: Partial<PriceRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess('');
    const problem = validate(name, rows);
    setError(problem);
    if (problem) return;
    setSaving(true);
    try {
      const id = await createService({
        name: name.trim(), description, serviceType,
        prices: rows.map((r) => ({ minWeight: num(r.minWeight), maxWeight: num(r.maxWeight), price: Number(r.price), pricingUnit: r.pricingUnit })),
      });
      setSuccess(`Đã tạo dịch vụ. Mã: ${id}`);
      setName(''); setDescription(''); setRows([emptyRow()]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page narrow">
      <h1>Thêm dịch vụ</h1>
      <form onSubmit={onSubmit} className="form">
        <label>Tên dịch vụ
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
        </label>
        <label>Nhóm dịch vụ
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)}>
            {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => <option key={t} value={t}>{SERVICE_TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label>Mô tả
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <fieldset>
          <legend>Bảng giá</legend>
          {rows.map((r, i) => (
            <div key={i} className="price-row">
              <input type="number" min="0" step="0.1" placeholder="Từ (kg)" aria-label="Cân nặng tối thiểu" value={r.minWeight} onChange={(e) => setRow(i, { minWeight: e.target.value })} />
              <input type="number" min="0" step="0.1" placeholder="Đến (kg)" aria-label="Cân nặng tối đa" value={r.maxWeight} onChange={(e) => setRow(i, { maxWeight: e.target.value })} />
              <input type="number" min="0" placeholder="Giá (VND)" aria-label="Giá" value={r.price} onChange={(e) => setRow(i, { price: e.target.value })} />
              <select aria-label="Đơn vị tính" value={r.pricingUnit} onChange={(e) => setRow(i, { pricingUnit: e.target.value as PricingUnit })}>
                {(Object.keys(PRICING_UNIT_LABEL) as PricingUnit[]).map((u) => <option key={u} value={u}>/ {PRICING_UNIT_LABEL[u]}</option>)}
              </select>
              <button type="button" className="link" onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}>Xóa</button>
            </div>
          ))}
          <button type="button" className="link" onClick={() => setRows((rs) => [...rs, emptyRow()])}>Thêm mức giá</button>
        </fieldset>

        {error && <p className="msg error" role="alert">{error}</p>}
        {success && <p className="msg ok" role="status">{success}</p>}
        <button className="btn" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu dịch vụ'}</button>
      </form>
    </section>
  );
}
