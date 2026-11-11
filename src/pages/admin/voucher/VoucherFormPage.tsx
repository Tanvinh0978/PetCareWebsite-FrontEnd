import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { message } from 'antd';
import {
  ArrowLeftOutlined,
  TagOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { voucherService } from '@/services/voucher.service';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';
import { DiscountType, DISCOUNT_TYPE_LABEL } from '@/types/voucher.types';
import { getApiErrorMessage } from '@/utils/apiError';
import { isoToLocalInput, localInputToISO } from '@/utils/format';

const AdminVoucherFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.pathname.startsWith('/staff') ? '/staff/vouchers' : '/admin/vouchers';
  const editing = Boolean(id);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.VOUCHER_MANAGE);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>(DiscountType.Percentage);
  const [discountValue, setDiscountValue] = useState<number | string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxUsage, setMaxUsage] = useState<number | string>('');
  const [hasMaxUsage, setHasMaxUsage] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    voucherService
      .fetchById(id)
      .then((res) => {
        const v = res.result;
        setCode(v.code);
        setDiscountType((v.discountType as DiscountType) ?? DiscountType.Percentage);
        setDiscountValue(v.discountValue);
        setStartDate(isoToLocalInput(v.startDate));
        setEndDate(isoToLocalInput(v.endDate));
        if (v.maxUsage !== null && v.maxUsage !== undefined) {
          setHasMaxUsage(true);
          setMaxUsage(v.maxUsage);
        } else {
          setHasMaxUsage(false);
          setMaxUsage('');
        }
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const validate = (): string | null => {
    const cleanCode = code.trim();
    if (!cleanCode) return 'Voucher code is required.';
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanCode)) {
      return 'Voucher code can only contain uppercase letters, digits, hyphens, and underscores.';
    }
    if (cleanCode.length > 50) return 'Voucher code must not exceed 50 characters.';

    const numVal = Number(discountValue);
    if (isNaN(numVal) || numVal <= 0) return 'Discount value must be greater than 0.';
    if (discountType === DiscountType.Percentage && numVal > 100) {
      return 'Percentage discount cannot exceed 100%.';
    }
    if (discountType === DiscountType.Fixed_Amount && numVal < 1000) {
      return 'Fixed discount amount must be at least 1,000 ₫.';
    }

    if (!startDate) return 'Start date is required.';
    if (!endDate) return 'End date is required.';
    if (new Date(endDate) <= new Date(startDate)) return 'End date must be after start date.';

    if (hasMaxUsage) {
      const numMax = Number(maxUsage);
      if (isNaN(numMax) || numMax <= 0 || !Number.isInteger(numMax)) {
        return 'Max usage must be a positive integer.';
      }
    }

    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      startDate: localInputToISO(startDate),
      endDate: localInputToISO(endDate),
      maxUsage: hasMaxUsage && maxUsage !== '' ? Number(maxUsage) : null,
    };

    setSaving(true);
    try {
      if (editing) {
        await voucherService.update(id as string, payload);
        message.success('Voucher updated successfully!');
      } else {
        await voucherService.create(payload);
        message.success('Voucher created successfully!');
      }
      navigate(backPath);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <section className="page" style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.5rem' }}>
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
          You do not have permission to manage vouchers.
        </div>
        <Link
          to={backPath}
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

  return (
    <section className="page" style={{ maxWidth: '780px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.1rem',
              color: '#3d2d23',
              fontWeight: 700,
            }}
          >
            {editing ? 'Edit Voucher' : 'Create New Voucher'}
          </h1>
          <p style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            {editing
              ? 'Update promotional voucher code, discount rate, and validity schedule.'
              : 'Add a new promotional discount voucher to the sanctuary booking system.'}
          </p>
        </div>
        <Link
          to={backPath}
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
      </div>

      {loading ? (
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #eeddc8',
            borderRadius: '20px',
            padding: '48px 36px',
            textAlign: 'center',
            color: '#785839',
            fontWeight: 600,
          }}
        >
          Loading voucher details...
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.9rem',
              }}
            >
              <InfoCircleOutlined style={{ fontSize: 16 }} />
              <span>{error}</span>
            </div>
          )}

          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #eeddc8',
              borderRadius: '20px',
              padding: '32px 36px',
              boxShadow: '0 4px 20px rgba(61, 45, 35, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 18px',
                backgroundColor: '#fdfbf7',
                border: '1.5px solid #eeddc8',
                borderRadius: '12px',
              }}
            >
              <TagOutlined style={{ fontSize: 18, color: '#785839', marginTop: 2 }} />
              <div style={{ fontSize: '0.86rem', color: '#785839', lineHeight: 1.5 }}>
                <strong>Promotional Campaign:</strong> Vouchers can apply percentage discounts or fixed deductions to guest bookings. Configure the schedule and redemption limits accurately to match your marketing campaign.
              </div>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#3d2d23',
                  marginBottom: '0.45rem',
                }}
              >
                Voucher Code <span style={{ color: '#dc2626' }}>*</span>
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER2026, VIPGUEST50"
                maxLength={50}
                required
                style={{
                  border: '1.5px solid #eeddc8',
                  borderRadius: '10px',
                  padding: '0.7rem 0.95rem',
                  width: '100%',
                  fontSize: '0.95rem',
                  color: '#3d2d23',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              />
              <span style={{ display: 'block', fontSize: '0.78rem', color: '#8c735f', marginTop: 6 }}>
                Uppercase letters, numbers, hyphens (-) and underscores (_) only. Max 50 characters.
              </span>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#3d2d23',
                  marginBottom: '0.45rem',
                }}
              >
                Discount Type <span style={{ color: '#dc2626' }}>*</span>
              </span>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
                {([DiscountType.Percentage, DiscountType.Fixed_Amount] as const).map((dt) => {
                  const isChecked = discountType === dt;
                  return (
                    <label
                      key={dt}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        padding: '10px 18px',
                        borderRadius: '10px',
                        backgroundColor: isChecked ? '#fcf9f5' : '#ffffff',
                        border: isChecked ? '2px solid #785839' : '1.5px solid #eeddc8',
                        color: isChecked ? '#3d2d23' : '#785839',
                        boxShadow: isChecked ? '0 2px 8px rgba(120,88,57,0.1)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="discountType"
                        value={dt}
                        checked={isChecked}
                        onChange={() => {
                          setDiscountType(dt);
                          setDiscountValue('');
                        }}
                        style={{
                          accentColor: '#3d2d23',
                          margin: 0,
                        }}
                      />
                      <span>
                        {dt === DiscountType.Percentage
                          ? '% Percentage Discount'
                          : '₫ Fixed Amount Discount'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#3d2d23',
                  marginBottom: '0.45rem',
                }}
              >
                Discount Value <span style={{ color: '#dc2626' }}>*</span>
              </span>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setDiscountValue('');
                      return;
                    }
                    const num = Number(value);
                    if (num < 0 || (discountType === DiscountType.Percentage && num > 100)) {
                      return;
                    }
                    setDiscountValue(value);
                  }}
                  placeholder={
                    discountType === DiscountType.Percentage
                      ? 'Enter percentage (1–100)'
                      : 'e.g. 50000'
                  }
                  min={discountType === DiscountType.Percentage ? 1 : 1000}
                  max={discountType === DiscountType.Percentage ? 100 : undefined}
                  step={discountType === DiscountType.Percentage ? 1 : 'any'}
                  required
                  style={{
                    border: '1.5px solid #eeddc8',
                    borderRadius: '10px',
                    padding: '0.7rem 42px 0.7rem 0.95rem',
                    width: '100%',
                    fontSize: '0.95rem',
                    color: '#3d2d23',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '14px',
                    color: '#785839',
                    fontWeight: 700,
                    pointerEvents: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  {discountType === DiscountType.Percentage ? '%' : '₫'}
                </span>
              </div>
              <span style={{ display: 'block', fontSize: '0.78rem', color: '#8c735f', marginTop: 6 }}>
                {discountType === DiscountType.Percentage
                  ? 'Enter a whole number between 1 and 100.'
                  : 'Enter the fixed discount amount in VND (e.g., 50,000 ₫).'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: '#3d2d23',
                    }}
                  >
                    Start Date & Time <span style={{ color: '#dc2626' }}>*</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStartDate(isoToLocalInput(new Date().toISOString()))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#785839',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Set to now
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  style={{
                    border: '1.5px solid #eeddc8',
                    borderRadius: '10px',
                    padding: '0.7rem 0.95rem',
                    width: '100%',
                    fontSize: '0.92rem',
                    color: '#3d2d23',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <span
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#3d2d23',
                    marginBottom: '0.45rem',
                  }}
                >
                  End Date & Time <span style={{ color: '#dc2626' }}>*</span>
                </span>
                <input
                  type="datetime-local"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  style={{
                    border: '1.5px solid #eeddc8',
                    borderRadius: '10px',
                    padding: '0.7rem 0.95rem',
                    width: '100%',
                    fontSize: '0.92rem',
                    color: '#3d2d23',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#fdfbf7',
                border: '1.5px solid #eeddc8',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#3d2d23',
                  fontSize: '0.9rem',
                  marginBottom: 0,
                }}
              >
                <span>Limit Maximum Redemptions</span>
                <input
                  type="checkbox"
                  checked={hasMaxUsage}
                  onChange={(e) => {
                    setHasMaxUsage(e.target.checked);
                    if (!e.target.checked) setMaxUsage('');
                  }}
                  style={{
                    width: '18px',
                    height: '18px',
                    margin: 0,
                    cursor: 'pointer',
                    accentColor: '#3d2d23',
                    flexShrink: 0,
                  }}
                />
              </label>

              {hasMaxUsage && (
                <div>
                  <input
                    type="number"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(e.target.value)}
                    placeholder="e.g. 100 (leave blank for unlimited)"
                    min="1"
                    style={{
                      border: '1.5px solid #eeddc8',
                      borderRadius: '8px',
                      padding: '0.65rem 0.95rem',
                      width: '100%',
                      fontSize: '0.92rem',
                      color: '#3d2d23',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ display: 'block', fontSize: '0.78rem', color: '#8c735f', marginTop: 4 }}>
                    Total number of times this voucher can be redeemed before expiring.
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.85rem',
                marginTop: '0.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #f1ece5',
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.65rem 1.8rem',
                  backgroundColor: '#3d2d23',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(61, 45, 35, 0.18)',
                  transition: 'all 0.2s ease',
                }}
              >
                {saving
                  ? 'Saving...'
                  : editing
                  ? 'Update Voucher'
                  : 'Create Voucher'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => navigate(backPath)}
                style={{
                  padding: '0.65rem 1.5rem',
                  backgroundColor: '#ffffff',
                  color: '#785839',
                  border: '1.5px solid #eeddc8',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
};

export default AdminVoucherFormPage;
