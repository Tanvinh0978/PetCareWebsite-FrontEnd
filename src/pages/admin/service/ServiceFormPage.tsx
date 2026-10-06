import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createService, getServiceById, updateService } from '@/api/serviceApi';
import { getErrorMessage } from '@/api/client';
import {
  PRICING_UNIT_LABEL, SERVICE_TYPE_LABEL,
  type PricingUnit, type ServiceType,
} from '@/types/service';

interface PriceRow {
  minWeight: string;
  maxWeight: string;
  price: string;
  pricingUnit: PricingUnit;
}

const emptyRow = (): PriceRow => ({ minWeight: '', maxWeight: '', price: '', pricingUnit: 'Per_Turn' });
const num = (v: string) => (v.trim() === '' ? null : Number(v));

// Cùng luật với CreateServiceCommandValidator ở backend.
function validate(name: string, rows: PriceRow[]): string {
  if (!name.trim()) return 'Enter a service name.';
  if (name.length > 150) return 'Service name must be at most 150 characters.';
  for (const [i, r] of rows.entries()) {
    const n = `Price tier ${i + 1}`;
    const min = num(r.minWeight);
    const max = num(r.maxWeight);
    if (r.price.trim() === '' || Number(r.price) < 0) return `${n}: price must be 0 or more.`;
    if (min !== null && min < 0) return `${n}: minimum weight must be 0 or more.`;
    if (max !== null && max <= 0) return `${n}: maximum weight must be greater than 0.`;
    if (min !== null && max !== null && max <= min) return `${n}: maximum weight must be greater than minimum weight.`;
  }
  return '';
}

export default function ServiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(editing);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Grooming');
  const [rows, setRows] = useState<PriceRow[]>([emptyRow()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getServiceById(id)
      .then((s) => {
        setName(s.name);
        setDescription(s.description ?? '');
        setServiceType(s.serviceType);
        setIsActive(s.isActive);
        setRows(
          s.prices.length
            ? s.prices.map((p) => ({
                minWeight: p.minWeight === null ? '' : String(p.minWeight),
                maxWeight: p.maxWeight === null ? '' : String(p.maxWeight),
                price: String(p.price),
                pricingUnit: p.pricingUnit,
              }))
            : [emptyRow()]
        );
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const setRow = (i: number, patch: Partial<PriceRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = validate(name, rows);
    setError(problem);
    if (problem) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description,
        serviceType,
        prices: rows.map((r) => ({
          minWeight: num(r.minWeight),
          maxWeight: num(r.maxWeight),
          price: Number(r.price),
          pricingUnit: r.pricingUnit,
        })),
      };
      if (id) await updateService(id, { ...payload, isActive });
      else await createService(payload);
      navigate('/admin/services'); // Quay về danh sách sau khi lưu
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page" style={{ maxWidth: '840px' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{editing ? 'Edit Service' : 'Add New Service'}</h1>
          <p className="page-subtitle">
            {editing
              ? 'Update service specifications, active availability, and pricing tiers.'
              : 'Create a new pet care service with custom weight-bracket pricing.'}
          </p>
        </div>
        <Link to="/admin/services" className="btn btn-secondary">
          ← Back to services
        </Link>
      </div>

      {loading && <p>Loading service details...</p>}

      <form onSubmit={onSubmit} className="form" hidden={loading}>
        <label>
          Service Name <span style={{ color: 'var(--danger)' }}>*</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={150}
            placeholder="e.g. Full Grooming & Bathing Package"
            required
          />
        </label>

        <label>
          Service Category <span style={{ color: 'var(--danger)' }}>*</span>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as ServiceType)}
          >
            {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
              <option key={t} value={t}>
                {SERVICE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what is included in this service (procedures, benefits, products used)..."
          />
        </label>

        {editing && (
          <label className="check" style={{ cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>
              <strong>Active Service</strong> (Visible to customers in public service catalog)
            </span>
          </label>
        )}

        {/* Pricing Tiers Section */}
        <fieldset style={{ marginTop: '0.5rem', background: '#fff' }}>
          <legend style={{ fontSize: '1.05rem', color: 'var(--pine)' }}>Pricing Tiers</legend>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', color: '#557268' }}>
            Configure prices based on pet weight. Leave Min or Max empty for "Any weight" or open-ended weight brackets.
          </p>

          <div className="price-table-card">
            <div className="price-table-scroll">
              <table className="price-input-table">
                <thead>
                  <tr>
                    <th>Min Weight (kg)</th>
                    <th>Max Weight (kg)</th>
                    <th>Price (VND) *</th>
                    <th>Pricing Unit</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 0"
                          aria-label="Minimum weight"
                          value={r.minWeight}
                          onChange={(e) => setRow(i, { minWeight: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 10"
                          aria-label="Maximum weight"
                          value={r.maxWeight}
                          onChange={(e) => setRow(i, { maxWeight: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="e.g. 150000"
                          aria-label="Price in VND"
                          value={r.price}
                          onChange={(e) => setRow(i, { price: e.target.value })}
                          required
                        />
                      </td>
                      <td>
                        <select
                          aria-label="Pricing unit"
                          value={r.pricingUnit}
                          onChange={(e) => setRow(i, { pricingUnit: e.target.value as PricingUnit })}
                        >
                          {(Object.keys(PRICING_UNIT_LABEL) as PricingUnit[]).map((u) => (
                            <option key={u} value={u}>
                              / {PRICING_UNIT_LABEL[u]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-action danger"
                          onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                          title="Remove this price tier"
                        >
                          ✕ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setRows((rs) => [...rs, emptyRow()])}
            >
              + Add price tier
            </button>
          </div>
        </fieldset>

        {error && <p className="msg error" role="alert">{error}</p>}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving changes...' : editing ? 'Save changes' : 'Create service'}
          </button>
          <Link to="/admin/services" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
