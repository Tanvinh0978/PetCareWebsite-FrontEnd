import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  EditOutlined,
  TagOutlined,
  CalendarOutlined,
  BarChartOutlined,
  DollarOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { voucherService } from '@/services/voucher.service';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';
import type { VoucherDTO } from '@/types/voucher.types';
import { DiscountType, DISCOUNT_TYPE_LABEL } from '@/types/voucher.types';
import { getApiErrorMessage } from '@/utils/apiError';
import { parseUtcDate, formatDateTime } from '@/utils/format';

interface VoucherDetailProps {
  backTo?: string;
  editTo?: (id: string) => string;
}

const formatDate = (iso: string) => formatDateTime(iso);

const formatValue = (v: VoucherDTO) => {
  if (v.discountType === DiscountType.Percentage) {
    return `${v.discountValue}%`;
  }
  return `${v.discountValue.toLocaleString('vi-VN')} ₫`;
};

function getValidityBadge(v: VoucherDTO) {
  const now = new Date();
  const start = parseUtcDate(v.startDate);
  const end = parseUtcDate(v.endDate);
  const maxReached = v.maxUsage !== null && v.currentUsage >= v.maxUsage;

  if (maxReached) {
    return {
      label: 'Exhausted',
      bg: '#fffbeb',
      color: '#b45309',
      border: '#fde68a',
      dot: '#f59e0b',
    };
  }
  if (now < start) {
    return {
      label: 'Scheduled',
      bg: '#f0f9ff',
      color: '#0369a1',
      border: '#bae6fd',
      dot: '#0284c7',
    };
  }
  if (now > end) {
    return {
      label: 'Expired',
      bg: '#fef2f2',
      color: '#dc2626',
      border: '#fecaca',
      dot: '#ef4444',
    };
  }
  return {
    label: 'Active',
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
    dot: '#10b981',
  };
}

export default function VoucherDetail({ backTo, editTo }: VoucherDetailProps) {
  const { id = '' } = useParams();
  const location = useLocation();
  const isStaff = location.pathname.startsWith('/staff');
  const defaultBackTo = isStaff ? '/staff/vouchers' : '/admin/vouchers';
  const resolvedBackTo = backTo || defaultBackTo;
  const resolvedEditTo = editTo || ((vid: string) => `${defaultBackTo}/${vid}/edit`);

  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.VOUCHER_MANAGE);

  const [voucher, setVoucher] = useState<VoucherDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    voucherService
      .fetchById(id)
      .then((res: any) => {
        if (!cancelled) {
          const v = res?.result ?? res;
          setVoucher(v);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="page" style={{ maxWidth: '820px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <p style={{ color: '#785839', textAlign: 'center', fontWeight: 600 }}>Loading voucher details...</p>
      </section>
    );
  }

  if (error || !voucher) {
    return (
      <section className="page" style={{ maxWidth: '820px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 12,
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {error || 'Voucher not found.'}
        </div>
        <Link
          to={resolvedBackTo}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.45rem 1.1rem',
            borderRadius: 8,
            backgroundColor: '#ffffff',
            border: '1px solid #e8ded6',
            color: '#3d2d23',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeftOutlined /> Back to vouchers
        </Link>
      </section>
    );
  }

  const badge = getValidityBadge(voucher);

  return (
    <section className="page" style={{ maxWidth: '820px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Top Navigation Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Link
          to={resolvedBackTo}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0.45rem 1.15rem',
            borderRadius: 999,
            backgroundColor: '#ffffff',
            border: '1.5px solid #eeddc8',
            color: '#785839',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(61,45,35,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 12 }} />
          <span>Back to vouchers</span>
        </Link>

        {canManage && resolvedEditTo && (
          <Link
            to={resolvedEditTo(voucher.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.55rem 1.35rem',
              borderRadius: 999,
              backgroundColor: '#3d2d23',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(61,45,35,0.18)',
              transition: 'all 0.2s ease',
            }}
          >
            <EditOutlined style={{ fontSize: 13 }} />
            <span>Edit Voucher</span>
          </Link>
        )}
      </div>

      {/* Main Voucher Card Container */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1.5px solid #eeddc8',
          borderRadius: '20px',
          padding: '32px 36px',
          boxShadow: '0 4px 20px rgba(61,45,35,0.04)',
          marginBottom: '1.75rem',
        }}
      >
        {/* Card Header with Icon, Code, and Validity Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #f1ece5',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '14px',
                backgroundColor: '#faf6f0',
                border: '1.5px solid #eeddc8',
                color: '#785839',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}
            >
              <TagOutlined />
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#3d2d23',
                  fontFamily: 'monospace',
                  letterSpacing: '0.06em',
                }}
              >
                {voucher.code}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#8c735f', marginTop: 2 }}>
                Promotion Campaign •{' '}
                {DISCOUNT_TYPE_LABEL[voucher.discountType as DiscountType] ?? voucher.discountType}
              </div>
            </div>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 999,
              backgroundColor: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`,
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: badge.dot }} />
            {badge.label}
          </span>
        </div>

        {/* Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Discount Value */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#fdfbf7',
              borderRadius: '12px',
              border: '1px solid #eeddc8',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#8c735f',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <DollarOutlined />
              <span>Discount Benefit</span>
            </div>
            <div
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#3d2d23',
                marginTop: '0.4rem',
              }}
            >
              {formatValue(voucher)}
            </div>
          </div>

          {/* Discount Type */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#fdfbf7',
              borderRadius: '12px',
              border: '1px solid #eeddc8',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#8c735f',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <TagOutlined />
              <span>Discount Type</span>
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#3d2d23',
                marginTop: '0.4rem',
              }}
            >
              {DISCOUNT_TYPE_LABEL[voucher.discountType as DiscountType] ?? voucher.discountType}
            </div>
          </div>

          {/* Start Date */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#fdfbf7',
              borderRadius: '12px',
              border: '1px solid #eeddc8',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#8c735f',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CalendarOutlined />
              <span>Valid From</span>
            </div>
            <div
              style={{
                fontSize: '0.96rem',
                fontWeight: 700,
                color: '#3d2d23',
                marginTop: '0.4rem',
              }}
            >
              {formatDate(voucher.startDate)}
            </div>
          </div>

          {/* End Date */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#fdfbf7',
              borderRadius: '12px',
              border: '1px solid #eeddc8',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#8c735f',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CalendarOutlined />
              <span>Valid Until</span>
            </div>
            <div
              style={{
                fontSize: '0.96rem',
                fontWeight: 700,
                color: '#3d2d23',
                marginTop: '0.4rem',
              }}
            >
              {formatDate(voucher.endDate)}
            </div>
          </div>

          {/* Usage Quota */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#fdfbf7',
              borderRadius: '12px',
              border: '1px solid #eeddc8',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#8c735f',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <BarChartOutlined />
              <span>Redemption Quota</span>
            </div>
            <div
              style={{
                fontSize: '0.96rem',
                fontWeight: 700,
                color: '#3d2d23',
                marginTop: '0.4rem',
              }}
            >
              {voucher.maxUsage !== null
                ? `${voucher.currentUsage} redeemed / ${voucher.maxUsage} limit`
                : `${voucher.currentUsage} redeemed / Unlimited`}
            </div>
          </div>

          {/* Identifier */}
          {voucher.id && (
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: '#fdfbf7',
                borderRadius: '12px',
                border: '1px solid #eeddc8',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#8c735f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <KeyOutlined />
                <span>System Identifier</span>
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: '#8c735f',
                  marginTop: '0.4rem',
                  fontFamily: 'monospace',
                }}
              >
                {voucher.id}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
