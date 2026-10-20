import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { voucherService } from '@/services/voucher.service'
import type { VoucherDTO } from '@/types/voucher.types'
import { DiscountType, DISCOUNT_TYPE_LABEL } from '@/types/voucher.types'
import { getApiErrorMessage } from '@/utils/apiError'

interface VoucherDetailProps {
  backTo?: string
  editTo?: (id: string) => string
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch {
    return iso
  }
}

const formatValue = (v: VoucherDTO) => {
  if (v.discountType === DiscountType.Percentage) {
    return `${v.discountValue}%`
  }
  return `${v.discountValue.toLocaleString('vi-VN')} ₫`
}

function getValidityBadge(v: VoucherDTO): { label: string; cls: string } {
  const now = new Date()
  const start = new Date(v.startDate)
  const end = new Date(v.endDate)

  if (v.maxUsage !== null && v.currentUsage >= v.maxUsage) {
    return { label: 'Depleted', cls: 'inactive' }
  }
  if (now < start) {
    return { label: 'Upcoming', cls: 'pending' }
  }
  if (now > end) {
    return { label: 'Expired', cls: 'inactive' }
  }
  return { label: 'Active', cls: 'active' }
}

export default function VoucherDetail({ backTo, editTo }: VoucherDetailProps) {
  const { id = '' } = useParams()
  const location = useLocation()
  const isStaff = location.pathname.startsWith('/staff')
  const defaultBackTo = isStaff ? '/staff/vouchers' : '/admin/vouchers'
  const resolvedBackTo = backTo || defaultBackTo
  const resolvedEditTo = editTo || ((vid: string) => `${defaultBackTo}/${vid}/edit`)

  const [voucher, setVoucher] = useState<VoucherDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    voucherService
      .fetchById(id)
      .then((res: any) => {
        if (!cancelled) {
          const v = res?.result ?? res
          setVoucher(v)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <section className="page narrow">
        <p style={{ color: '#557268', padding: '2rem 0' }}>Loading voucher details...</p>
      </section>
    )
  }

  if (error || !voucher) {
    return (
      <section className="page narrow">
        <p className="msg error" role="alert">{error || 'Voucher not found.'}</p>
        <Link to={resolvedBackTo} className="btn btn-secondary">
          ← Back to vouchers
        </Link>
      </section>
    )
  }

  const badge = getValidityBadge(voucher)

  return (
    <section className="page narrow">
      <div className="page-head">
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#785839', background: '#fdf9f3', padding: '0.2rem 0.75rem', borderRadius: '999px', border: '1px solid #e8ded6' }}>
            🎟️ Promotion Voucher
          </span>
          <h1 style={{ marginTop: '0.5rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{voucher.code}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {resolvedEditTo && (
            <Link to={resolvedEditTo(voucher.id)} className="btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Voucher
            </Link>
          )}
        </div>
      </div>

      {/* Main Voucher Card */}
      <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.75rem', marginBottom: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #fde68a' }}>
              🎟️
            </div>
            <div>
              <code style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {voucher.code}
              </code>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {DISCOUNT_TYPE_LABEL[voucher.discountType as DiscountType] ?? voucher.discountType}
              </div>
            </div>
          </div>
          <span className={`status-pill ${badge.cls}`}>
            <span className="status-dot"></span>
            {badge.label}
          </span>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Discount Value</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
              {formatValue(voucher)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Discount Type</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
              {DISCOUNT_TYPE_LABEL[voucher.discountType as DiscountType] ?? voucher.discountType}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Start Date</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
              {formatDate(voucher.startDate)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>End Date</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem' }}>
              {formatDate(voucher.endDate)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Usage Quota</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', marginTop: '0.2rem' }}>
              {voucher.maxUsage !== null
                ? `${voucher.currentUsage} used / ${voucher.maxUsage} max`
                : `${voucher.currentUsage} used / Unlimited`}
            </div>
          </div>
          {voucher.id && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Voucher ID</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                {voucher.id}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link to={resolvedBackTo} className="btn btn-secondary">
          ← Back to vouchers
        </Link>
      </div>
    </section>
  )
}
