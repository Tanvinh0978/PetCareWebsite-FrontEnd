import React, { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { App } from 'antd'
import { voucherService } from '@/services/voucher.service'
import { DiscountType, DISCOUNT_TYPE_LABEL } from '@/types/voucher.types'
import { getApiErrorMessage } from '@/utils/apiError'

const BACK = '/admin/vouchers'

// Convert a local datetime-local string to ISO 8601 UTC string
const localToISO = (local: string): string => {
  if (!local) return ''
  return new Date(local).toISOString()
}

// Convert ISO 8601 UTC string → datetime-local input value (YYYY-MM-DDTHH:mm)
const isoToLocal = (iso: string): string => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    // Format: YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

const AdminVoucherFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const editing = Boolean(id)

  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>(DiscountType.Percentage)
  const [discountValue, setDiscountValue] = useState<number | string>('')
  const [startDate, setStartDate] = useState('')  // datetime-local string
  const [endDate, setEndDate] = useState('')      // datetime-local string
  const [maxUsage, setMaxUsage] = useState<number | string>('')
  const [hasMaxUsage, setHasMaxUsage] = useState(false)

  // Load existing voucher when editing
  useEffect(() => {
    if (!id) return
    setLoading(true)
    voucherService
      .fetchById(id)
      .then((res) => {
        const v = res.result
        setCode(v.code)
        setDiscountType((v.discountType as DiscountType) ?? DiscountType.Percentage)
        setDiscountValue(v.discountValue)
        setStartDate(isoToLocal(v.startDate))
        setEndDate(isoToLocal(v.endDate))
        if (v.maxUsage !== null && v.maxUsage !== undefined) {
          setHasMaxUsage(true)
          setMaxUsage(v.maxUsage)
        } else {
          setHasMaxUsage(false)
          setMaxUsage('')
        }
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [id])

  const validate = (): string | null => {
    const cleanCode = code.trim()
    if (!cleanCode) return 'Voucher code is required.'
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanCode)) return 'Voucher code can only contain letters, digits, hyphens, and underscores.'
    if (cleanCode.length > 50) return 'Voucher code must not exceed 50 characters.'

    const numVal = Number(discountValue)
    if (isNaN(numVal) || numVal <= 0) return 'Discount value must be greater than 0.'
    if (discountType === DiscountType.Percentage && numVal > 100) return 'Percentage discount cannot exceed 100%.'

    if (!startDate) return 'Start date is required.'
    if (!endDate) return 'End date is required.'
    if (new Date(endDate) <= new Date(startDate)) return 'End date must be after start date.'

    if (hasMaxUsage) {
      const numMax = Number(maxUsage)
      if (isNaN(numMax) || numMax <= 0 || !Number.isInteger(numMax)) return 'Max usage must be a positive integer.'
    }

    return null
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      startDate: localToISO(startDate),
      endDate: localToISO(endDate),
      maxUsage: hasMaxUsage && maxUsage !== '' ? Number(maxUsage) : null,
    }

    setSaving(true)
    try {
      if (editing) {
        await voucherService.update(id as string, payload)
        message.success('Voucher updated successfully!')
      } else {
        await voucherService.create(payload)
        message.success('Voucher created successfully!')
      }
      navigate(BACK)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page" style={{ maxWidth: '680px' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{editing ? 'Edit Voucher' : 'Create New Voucher'}</h1>
          <p className="page-subtitle">
            {editing ? 'Update voucher code, discount, and validity dates.' : 'Add a new discount voucher to the system.'}
          </p>
        </div>
        <Link to={BACK} className="btn btn-secondary">← Back</Link>
      </div>

      {loading && <p>Loading voucher details...</p>}

      <form onSubmit={onSubmit} className="form" hidden={loading}>
        {error && (
          <p className="msg error" role="alert" style={{ margin: '0 0 1rem 0' }}>{error}</p>
        )}

        {/* Voucher Code */}
        <label>
          Voucher Code <span style={{ color: 'var(--danger)' }}>*</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SUMMER2026, NEWUSER-50"
            maxLength={50}
            style={{ fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          />
          <small style={{ color: '#64748b' }}>Letters, digits, hyphens (-) and underscores (_) only. Max 50 characters.</small>
        </label>

        
{/* Discount Type */}
<label>
  Discount Type <span style={{ color: 'var(--danger)' }}>*</span>

  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginTop: '0.5rem'
  }}>
    {([DiscountType.Percentage, DiscountType.Fixed_Amount] as const).map((dt) => (
      <label
        key={dt}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          fontWeight: 600,
          padding: '10px 16px',
          borderRadius: '10px',
          background: discountType === dt ? '#e0f2fe' : '#f8fafc',
          border: `2px solid ${
            discountType === dt ? '#0ea5e9' : '#e2e8f0'
          }`,
          transition: 'all 0.2s ease'
        }}
      >
        <input
          type="radio"
          name="discountType"
          value={dt}
          checked={discountType === dt}
          onChange={() => {
            setDiscountType(dt);
            setDiscountValue('');
          }}
          style={{
            accentColor: '#0284c7',
            margin: 0
          }}
        />
        {dt === DiscountType.Percentage
          ? '% Percentage'
          : '₫ Fixed Amount'}
      </label>
    ))}
  </div>
</label>

{/* Discount Value */}
<label style={{
  display: 'block',
  marginTop: '1rem'
}}>
  Discount Value <span style={{ color: 'var(--danger)' }}>*</span>

  <div style={{
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.5rem'
  }}>
    <input
      type="number"
      value={discountValue}
      onChange={(e) => {
        const value = e.target.value;

        if (value === '') {
          setDiscountValue('');
          return;
        }

        const number = Number(value);

        if (
          number < 0 ||
          (discountType === DiscountType.Percentage && number > 100)
        ) {
          return;
        }

        setDiscountValue(value);
      }}
      placeholder={
        discountType === DiscountType.Percentage
          ? 'Enter percentage (1–100)'
          : 'e.g. 50000'
      }
      min={discountType === DiscountType.Percentage ? 1 : 0.01}
      max={
        discountType === DiscountType.Percentage
          ? 100
          : undefined
      }
      step={discountType === DiscountType.Percentage ? 1 : 1000}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '10px 42px 10px 12px',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none'
      }}
    />

    <span style={{
      position: 'absolute',
      right: '12px',
      color: '#64748b',
      fontWeight: 600,
      pointerEvents: 'none'
    }}>
      {discountType === DiscountType.Percentage ? '%' : '₫'}
    </span>
  </div>

  <small style={{
    display: 'block',
    marginTop: '6px',
    color: '#64748b',
    fontSize: '12px'
  }}>
    {discountType === DiscountType.Percentage
      ? 'Enter a whole number between 1 and 100.'
      : 'Enter the fixed discount amount in VND.'}
  </small>
</label>


        {/* Start & End Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label>
            Start Date <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            End Date <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="datetime-local"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        {/* Max Usage */}
        
        <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '16px'
}}>
  <label style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#374151',
    marginBottom: 0
  }}>
    <span>Limit maximum usage</span>

    <input
      type="checkbox"
      checked={hasMaxUsage}
      onChange={(e) => {
        setHasMaxUsage(e.target.checked);
        if (!e.target.checked) setMaxUsage('');
      }}
      style={{
        width: '16px',
        height: '16px',
        margin: 0,
        cursor: 'pointer',
        accentColor: '#2563eb',
        flexShrink: 0
      }}
    />
  </label>

  {hasMaxUsage && (
    <input
      type="number"
      value={maxUsage}
      onChange={(e) => setMaxUsage(e.target.value)}
      placeholder="Enter maximum usage"
      min="1"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '10px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none'
      }}
    />
  )}
</div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? (editing ? 'Saving...' : 'Creating...') : (editing ? 'Save Changes' : 'Create Voucher')}
          </button>
          <Link to={BACK} className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </section>
  )
}

export default AdminVoucherFormPage
