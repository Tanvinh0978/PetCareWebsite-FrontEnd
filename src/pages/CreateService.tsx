
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
  if (!name.trim()) return 'Enter a service name.';
  if (name.length > 150) return 'Service name must be at most 150 characters.';
  for (const [i, r] of rows.entries()) {
    const n = `Price tier ${i + 1}`;
    const min = num(r.minWeight), max = num(r.maxWeight);
    if (r.price.trim() === '' || Number(r.price) < 0) return `${n}: price must be 0 or more.`;
    if (min !== null && min < 0) return `${n}: minimum weight must be 0 or more.`;
    if (max !== null && max <= 0) return `${n}: maximum weight must be greater than 0.`;
    if (min !== null && max !== null && max <= min) return `${n}: maximum weight must be greater than minimum weight.`;
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
      setSuccess(`Service created. ID: ${id}`);
      setName(''); setDescription(''); setRows([emptyRow()]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page narrow">
      <h1>Add Service</h1>
      <form onSubmit={onSubmit} className="form">
        <label>Service Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
        </label>
        <label>Service Category
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)}>
            {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => <option key={t} value={t}>{SERVICE_TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label>Description
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <fieldset>
          <legend>Pricing Tiers</legend>
          {rows.map((r, i) => (
            <div key={i} className="price-row">
              <input type="number" min="0" step="0.1" placeholder="From (kg)" aria-label="Minimum weight" value={r.minWeight} onChange={(e) => setRow(i, { minWeight: e.target.value })} />
              <input type="number" min="0" step="0.1" placeholder="To (kg)" aria-label="Maximum weight" value={r.maxWeight} onChange={(e) => setRow(i, { maxWeight: e.target.value })} />
              <input type="number" min="0" placeholder="Price (VND)" aria-label="Price" value={r.price} onChange={(e) => setRow(i, { price: e.target.value })} />
              <select aria-label="Pricing unit" value={r.pricingUnit} onChange={(e) => setRow(i, { pricingUnit: e.target.value as PricingUnit })}>
                {(Object.keys(PRICING_UNIT_LABEL) as PricingUnit[]).map((u) => <option key={u} value={u}>/ {PRICING_UNIT_LABEL[u]}</option>)}
              </select>
              <button type="button" className="link" onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className="link" onClick={() => setRows((rs) => [...rs, emptyRow()])}>Add price tier</button>
        </fieldset>

        {error && <p className="msg error" role="alert">{error}</p>}
        {success && <p className="msg ok" role="status">{success}</p>}
        <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save service'}</button>
      </form>
    </section>
  );
}
