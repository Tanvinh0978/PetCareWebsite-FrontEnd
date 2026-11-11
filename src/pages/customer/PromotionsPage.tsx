import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Spin, Empty, Tag, Button } from 'antd';
import {
  GiftOutlined,
  CopyOutlined,
  CalendarOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { voucherService } from '@/services/voucher.service';
import type { VoucherDTO } from '@/types/voucher.types';
import { DiscountType } from '@/types/voucher.types';
import { formatDateOnly, parseUtcDate } from '@/utils/format';
import { useAuthStore } from '@/store/useAuthStore';

const PromotionsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [vouchers, setVouchers] = useState<VoucherDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'PERCENT' | 'FIXED'>('ALL');

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res: any = await voucherService.search({
        isValidOnly: true,
        pageSize: 50,
      });
      const data = res?.result ?? res?.data ?? res;
      const items: VoucherDTO[] = data?.items ?? (Array.isArray(data) ? data : []);
      const now = new Date();
      const active = items.filter((v) => {
        const start = parseUtcDate(v.startDate);
        const end = parseUtcDate(v.endDate);
        const usageLimitOk = v.maxUsage === null || v.maxUsage === undefined || v.currentUsage < v.maxUsage;
        return v.isValid && start <= now && end >= now && usageLimitOk;
      });
      setVouchers(active);
    } catch {
      message.error('Could not load promotional vouchers.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    message.success(`Voucher code "${code}" copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleUseVoucher = (code: string) => {
    if (!user) {
      navigate(`/login?redirect=/customer/booking?voucher=${encodeURIComponent(code)}`);
      return;
    }
    navigate(`/customer/booking?voucher=${encodeURIComponent(code)}`);
  };

  const filteredVouchers = vouchers.filter((v) => {
    const isPercent =
      String(v.discountType).toLowerCase() === 'percentage' || String(v.discountType) === '0';
    if (filterType === 'PERCENT') return isPercent;
    if (filterType === 'FIXED') return !isPercent;
    return true;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3d2d23 0%, #5a4234 100%)',
          borderRadius: 24,
          padding: '40px 36px',
          color: '#ffffff',
          marginBottom: 36,
          boxShadow: '0 12px 30px rgba(61,45,35,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 650 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              backgroundColor: 'rgba(238, 221, 200, 0.2)',
              border: '1px solid rgba(238, 221, 200, 0.3)',
              color: '#eeddc8',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <GiftOutlined /> Exclusive Guest Privileges
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.5rem',
              color: '#ffffff',
              fontWeight: 700,
              margin: '0 0 12px',
              lineHeight: 1.2,
            }}
          >
            Promotions & Special Offers
          </h1>
          <p
            style={{
              color: '#f0e6dc',
              fontSize: '1rem',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Enjoy special discounts and privileged seasonal offers on luxury grooming spa and
            comfort boarding stays for your beloved pets.
          </p>
        </div>

        {/* Decorative background element */}
        <div
          style={{
            position: 'absolute',
            right: -20,
            bottom: -30,
            fontSize: 220,
            color: 'rgba(255, 255, 255, 0.04)',
            pointerEvents: 'none',
            lineHeight: 1,
          }}
        >
          🎁
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: `All Offers (${vouchers.length})` },
            {
              key: 'PERCENT',
              label: `Percentage Discounts (%)`,
            },
            {
              key: 'FIXED',
              label: `Fixed Amount (₫)`,
            },
          ].map((tab) => {
            const active = filterType === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterType(tab.key as any)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  border: active ? '1.5px solid #3d2d23' : '1.5px solid #eeddc8',
                  backgroundColor: active ? '#3d2d23' : '#ffffff',
                  color: active ? '#ffffff' : '#785839',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 3px 10px rgba(61,45,35,0.15)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: '0.88rem', color: '#8c735f', fontWeight: 500 }}>
          {filteredVouchers.length} active promotion{filteredVouchers.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {/* Vouchers Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: '#785839', fontWeight: 600 }}>
            Loading available promotions...
          </p>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            border: '1.5px solid #eeddc8',
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <Empty
            description={
              <span style={{ color: '#8c735f', fontSize: '1rem' }}>
                There are currently no active promotional vouchers in this category.
                <br />
                Please check back soon for seasonal campaigns!
              </span>
            }
          />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24,
          }}
        >
          {filteredVouchers.map((v) => {
            const isPercent =
              String(v.discountType).toLowerCase() === 'percentage' ||
              String(v.discountType) === '0';
            const discountLabel = isPercent
              ? `${v.discountValue}% OFF`
              : `${Number(v.discountValue).toLocaleString('vi-VN')} ₫ OFF`;
            const isCopied = copiedCode === v.code;

            return (
              <div
                key={v.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 18,
                  border: '1.5px solid #eeddc8',
                  boxShadow: '0 4px 16px rgba(61,45,35,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Voucher Top Strip */}
                <div
                  style={{
                    backgroundColor: '#faf6f0',
                    borderBottom: '1.5px dashed #eeddc8',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: '#ebd9cb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#785839',
                        fontSize: 18,
                      }}
                    >
                      <GiftOutlined />
                    </div>
                    <div>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#8c735f',
                          letterSpacing: 0.5,
                        }}
                      >
                        Special Privilege
                      </span>
                      <strong
                        style={{
                          fontSize: '1.25rem',
                          color: '#26180f',
                          fontFamily: "'Playfair Display', Georgia, serif",
                        }}
                      >
                        {discountLabel}
                      </strong>
                    </div>
                  </div>

                  <Tag
                    color={isPercent ? 'cyan' : 'purple'}
                    style={{
                      borderRadius: 999,
                      padding: '2px 10px',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {isPercent ? 'Percentage' : 'Fixed Amount'}
                  </Tag>
                </div>

                {/* Voucher Content */}
                <div
                  style={{
                    padding: '20px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  {/* Coupon Code Box */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 10,
                        backgroundColor: '#fbf8f4',
                        border: '1.5px dashed #d4c2b2',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '0.72rem',
                            color: '#8c735f',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          Voucher Code
                        </span>
                        <span
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: '#3d2d23',
                            letterSpacing: '0.08em',
                            fontFamily: 'monospace',
                          }}
                        >
                          {v.code}
                        </span>
                      </div>
                      <Button
                        type="text"
                        onClick={() => handleCopy(v.code)}
                        icon={isCopied ? <CheckOutlined style={{ color: '#059669' }} /> : <CopyOutlined />}
                        style={{
                          color: isCopied ? '#059669' : '#785839',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          padding: '4px 10px',
                          borderRadius: 6,
                          backgroundColor: '#ffffff',
                          border: '1px solid #eeddc8',
                        }}
                      >
                        {isCopied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>

                    {/* Metadata details */}
                    <div style={{ marginTop: 14, fontSize: '0.83rem', color: '#7a6b61' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <CalendarOutlined style={{ color: '#8c735f' }} />
                        <span>
                          Valid until: <strong>{formatDateOnly(v.endDate)}</strong>
                        </span>
                      </div>
                      {v.maxUsage !== null && v.maxUsage !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ThunderboltOutlined style={{ color: '#8c735f' }} />
                          <span>
                            Remaining redemptions:{' '}
                            <strong>{Math.max(0, v.maxUsage - v.currentUsage)}</strong> / {v.maxUsage}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    type="primary"
                    block
                    onClick={() => handleUseVoucher(v.code)}
                    icon={<ArrowRightOutlined />}
                    style={{
                      height: 42,
                      borderRadius: 10,
                      backgroundColor: '#3d2d23',
                      borderColor: '#3d2d23',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Use in Booking
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PromotionsPage;

