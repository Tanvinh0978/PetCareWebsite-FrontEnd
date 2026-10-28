import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  Tag,
  Button,
  Descriptions,
  Spin,
  Alert,
  Modal,
  Input,
  message,
  Image,
  Tooltip,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  CameraOutlined,
  StarFilled,
  EyeOutlined,
  UserOutlined,
  HomeOutlined,
  ScissorOutlined,
  CheckCircleFilled,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  bookingService,
  hasRememberedVnpayChoice,
  type BookingDetail,
  type BookingDetailItem,
} from '@/services/booking.service';
import { reviewService } from '@/services/review.service';
import CreateReviewModal from '@/components/review/CreateReviewModal';
import CareRecordTimelineModal from '@/components/staff/boarding/CareRecordTimelineModal';
import { DogIcon, CatIcon, PawIcon } from '@/components/common/PetIcons';
import { isCat } from '@/types/pet.types';
import { getApiErrorMessage } from '@/utils/apiError';

const { TextArea } = Input;

export const getBookingStatusConfig = (status: any) => {
  const s = String(status ?? '').toLowerCase();
  if (s === '0' || s === 'pending') {
    return { label: 'Pending', color: 'gold', icon: <ClockCircleOutlined /> };
  }
  if (s === '1' || s === 'confirmed' || s === 'partially_completed' || s === 'inprogress' || s === 'in progress') {
    return { label: 'Confirmed', color: 'blue', icon: <CheckCircleOutlined style={{ color: '#1677ff' }} /> };
  }
  if (s === '2' || s === 'completed') {
    return { label: 'Completed', color: 'green', icon: <CheckCircleOutlined /> };
  }
  if (s === '3' || s === 'cancelled' || s === 'canceled') {
    return { label: 'Cancelled', color: 'red', icon: <CloseCircleOutlined /> };
  }
  if (s === '4' || s === 'no_show' || s === 'noshow') {
    return { label: 'No Show', color: 'purple', icon: <CloseCircleOutlined style={{ color: '#7c3aed' }} /> };
  }
  return { label: String(status || 'Unknown'), color: 'default', icon: null };
};

export const getItemStatusConfig = (status: any) => {
  const s = String(status ?? '').toLowerCase();
  if (s === '0' || s === 'pending') return { label: 'Pending', color: 'gold' };
  if (s === '1' || s === 'confirmed') return { label: 'Confirmed', color: 'blue' };
  if (s === '2' || s === 'checked_in' || s === 'checkedin') return { label: 'Checked In', color: 'blue' };
  if (s === '3' || s === 'in_progress' || s === 'inprogress') return { label: 'In Progress', color: 'processing' };
  if (s === '4' || s === 'completed') return { label: 'Completed', color: 'green' };
  if (s === '5' || s === 'cancelled' || s === 'canceled') return { label: 'Cancelled', color: 'red' };
  if (s === '6' || s === 'no_show' || s === 'noshow') return { label: 'No Show', color: 'purple' };
  return { label: String(status || 'Unknown'), color: 'default' };
};

export const isPending = (status: any) => {
  const s = String(status ?? '').toLowerCase();
  return s === '0' || s === 'pending';
};

const getPaymentChoice = (booking: { paymentChoice?: string }) => String(booking.paymentChoice ?? '').trim().toUpperCase();
const isVnpayBooking = (booking: { id?: string; paymentChoice?: string }) =>
  getPaymentChoice(booking) === 'VNPAY' || Boolean(booking.id && hasRememberedVnpayChoice(booking.id));
const isCounterPaymentBooking = (booking: { paymentChoice?: string }) => getPaymentChoice(booking) === 'PAY_AT_COUNTER';

interface PetGroup {
  petId: string;
  petName: string;
  petSpecies: number | string;
  petWeight: number;
  items: BookingDetailItem[];
}

export default function CustomerBookingDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment state
  const [paying, setPaying] = useState(false);

  // Cancel Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancelling, setCancelling] = useState(false);

  // Review states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<{
    id: string;
    serviceName: string;
    petName: string;
  } | null>(null);

  const [reviewedItemIds, setReviewedItemIds] = useState<Set<string>>(() => {
    try {
      const cached = localStorage.getItem('petcare_reviewed_items');
      return cached ? new Set(JSON.parse(cached)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [viewingReview, setViewingReview] = useState<{
    serviceName: string;
    petName: string;
    rating: number;
    comment: string;
    createdAt?: string;
  } | null>(null);

  // Boarding Care History Modal
  const [careHistoryItem, setCareHistoryItem] = useState<{ id: string; petName: string } | null>(null);

  // Comparison Photos Modal
  const [beforeAfterItem, setBeforeAfterItem] = useState<BookingDetailItem | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const detail = await bookingService.fetchById(id);
      // Ensure payment choice detection
      const hasBoardingItem = detail?.bookingItems?.some((item) =>
        String(item.serviceType).trim().toLowerCase() === 'boarding' || String(item.serviceType) === '1'
      );
      if (!detail.paymentChoice && (hasBoardingItem || hasRememberedVnpayChoice(id))) {
        detail.paymentChoice = 'VNPAY';
      }
      setBooking(detail);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to load booking details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Group services by pet
  const petGroups = useMemo<PetGroup[]>(() => {
    if (!booking || !booking.bookingItems) return [];
    const map = new Map<string, PetGroup>();

    for (const item of booking.bookingItems) {
      const key = item.petId || item.petName || 'general';
      if (!map.has(key)) {
        map.set(key, {
          petId: item.petId,
          petName: item.petName || 'Unknown Pet',
          petSpecies: item.petSpecies,
          petWeight: item.petWeight,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }

    return Array.from(map.values());
  }, [booking]);

  // Extract the unified schedule from the booking items (rendered ONCE at top)
  const unifiedSchedule = useMemo(() => {
    if (!booking?.bookingItems?.length) return null;
    const firstItem = booking.bookingItems[0];
    const isBoarding = booking.bookingItems.some(
      (item) => String(item.serviceType) === '1' || String(item.serviceType).toLowerCase() === 'boarding'
    );

    const startAt = firstItem.scheduledStartAt;
    const endAt = firstItem.scheduledEndAt;

    return {
      isBoarding,
      startFormatted: startAt ? dayjs(startAt).format('dddd, DD/MM/YYYY [at] HH:mm') : 'N/A',
      endFormatted: endAt ? dayjs(endAt).format('dddd, DD/MM/YYYY [at] HH:mm') : null,
      rawStart: startAt,
      rawEnd: endAt,
    };
  }, [booking]);

  const handlePayVnpay = async () => {
    if (!booking) return;
    try {
      setPaying(true);
      message.loading({ content: 'Creating VNPay payment link...', key: 'vnpay-pay' });
      const res: any = await bookingService.createVnpayUrl(booking.id);
      const paymentUrl =
        res?.result?.paymentUrl || res?.data?.paymentUrl || res?.paymentUrl || (typeof res?.result === 'string' ? res.result : null);
      if (paymentUrl) {
        message.success({ content: 'Redirecting to VNPay...', key: 'vnpay-pay' });
        window.location.href = paymentUrl;
      } else {
        message.error({ content: 'VNPay payment link was not found.', key: 'vnpay-pay' });
      }
    } catch (err: any) {
      message.error({ content: getApiErrorMessage(err, 'Unable to create payment link'), key: 'vnpay-pay' });
    } finally {
      setPaying(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      await bookingService.cancelBooking(booking.id, cancelReason || 'Customer requested cancellation');
      message.success('Booking cancelled successfully');
      setCancelModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      message.error(getApiErrorMessage(err, 'Failed to cancel booking'));
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenReview = (item: BookingDetailItem) => {
    const isBookingCompleted =
      String(booking?.status).toLowerCase() === '2' || String(booking?.status).toLowerCase() === 'completed';

    if (!isBookingCompleted) {
      message.warning('You can only review services once your booking has been completed (after check-out)!');
      return;
    }

    if ((item as any).isReviewed || reviewedItemIds.has(item.id)) {
      message.info('This service has already been reviewed.');
      handleViewReview(item);
      return;
    }

    setReviewingItem({
      id: item.id,
      serviceName: item.serviceName,
      petName: item.petName,
    });
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    if (reviewingItem) {
      const updated = new Set(reviewedItemIds);
      updated.add(reviewingItem.id);
      setReviewedItemIds(updated);
      try {
        localStorage.setItem('petcare_reviewed_items', JSON.stringify([...updated]));
      } catch {}
    }
    setReviewModalOpen(false);
    setReviewingItem(null);
    message.success('Thank you! Your review has been submitted.');
  };

  const handleViewReview = async (item: BookingDetailItem) => {
    try {
      const res = await reviewService.getReviews({ serviceId: item.serviceId, pageSize: 50 });
      if (res?.isSuccess && res.result?.items) {
        for (const rItem of res.result.items) {
          try {
            const detailRes = await reviewService.getById(rItem.id);
            if (detailRes?.isSuccess && detailRes.result?.bookingItemId === item.id) {
              setViewingReview({
                serviceName: item.serviceName,
                petName: item.petName,
                rating: detailRes.result.rating,
                comment: detailRes.result.comment || '(No written comment provided)',
                createdAt: detailRes.result.createdAt,
              });
              return;
            }
          } catch {}
        }
      }
    } catch {}

    setViewingReview({
      serviceName: item.serviceName,
      petName: item.petName,
      rating: 5,
      comment: 'Service has been completed and verified.',
      createdAt: dayjs().toISOString(),
    });
  };

  if (loading) {
    return (
      <section className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Spin size="large" tip="Loading booking details..." />
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 12,
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {error || 'Booking not found.'}
        </div>
        <Link to="/customer/bookings" className="btn-action view" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeftOutlined /> Back to My Bookings
        </Link>
      </section>
    );
  }

  const statusConfig = getBookingStatusConfig(booking.status);
  const isBookingCompleted = String(booking.status).toLowerCase() === '2' || String(booking.status).toLowerCase() === 'completed';
  const canCancel = isPending(booking.status);
  const canPayOnline = isPending(booking.status) && isVnpayBooking(booking);

  return (
    <section className="page" style={{ maxWidth: 980, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Top Header / Breadcrumb & Actions Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Link
          to="/customer/bookings"
          className="btn-action view"
          style={{
            padding: '0.45rem 1.1rem',
            borderRadius: 8,
            backgroundColor: 'var(--paper, #fdf9f3)',
            borderColor: '#e8ded6',
            color: '#3d2d23',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 12 }} />
          <span>Back to My Bookings</span>
        </Link>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {canPayOnline && (
            <Button
              type="primary"
              icon={<CreditCardOutlined />}
              loading={paying}
              onClick={handlePayVnpay}
              style={{
                backgroundColor: '#ca8a04',
                borderColor: '#ca8a04',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: 8,
                padding: '0 18px',
                height: 38,
                boxShadow: '0 2px 8px rgba(202, 138, 4, 0.25)',
              }}
            >
              Pay Now (VNPay)
            </Button>
          )}

          {canCancel && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => setCancelModalOpen(true)}
              style={{
                backgroundColor: '#fff1f2',
                borderColor: '#fecdd3',
                color: '#e11d48',
                fontWeight: 600,
                borderRadius: 8,
                padding: '0 16px',
                height: 38,
              }}
            >
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Main Booking Summary Card */}
      <Card
        style={{
          borderRadius: 20,
          border: '1px solid #e8ded6',
          backgroundColor: 'var(--paper-card, #ffffff)',
          boxShadow: '0 4px 20px -2px rgba(61,45,35,0.06)',
          marginBottom: 24,
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        {/* Header row: Booking Code & Status Pill */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            paddingBottom: 20,
            borderBottom: '1px solid #f1ece7',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Sanctuary Reservation Dossier
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.9rem',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 700,
                  color: '#3d2d23',
                }}
              >
                Booking #{booking.id.slice(0, 8).toUpperCase()}
              </h1>
              <Tag
                color={statusConfig.color}
                icon={statusConfig.icon}
                style={{
                  borderRadius: 999,
                  padding: '4px 14px',
                  fontWeight: 600,
                  fontSize: 13,
                  margin: 0,
                }}
              >
                {statusConfig.label}
              </Tag>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#8c7662' }}>Created On</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#3d2d23' }}>
              {dayjs(booking.createdAt).format('DD/MM/YYYY [at] HH:mm')}
            </div>
          </div>
        </div>

        {/* Unified Schedule Banner - DISPLAYED PROMINENTLY ONCE */}
        {unifiedSchedule && (
          <div
            style={{
              marginTop: 20,
              background: 'linear-gradient(135deg, #fdf6ee 0%, #faf1e4 100%)',
              border: '1px solid #ebd9c8',
              borderRadius: 14,
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: '#3d2d23',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              <CalendarOutlined />
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {unifiedSchedule.isBoarding ? 'Boarding Stay Schedule' : 'Appointment Time (Unified Schedule)'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#3d2d23', marginTop: 2 }}>
                {unifiedSchedule.isBoarding ? (
                  <span>
                    Check-in: <strong>{unifiedSchedule.startFormatted}</strong>
                    {unifiedSchedule.endFormatted && (
                      <span> → Check-out: <strong>{unifiedSchedule.endFormatted}</strong></span>
                    )}
                  </span>
                ) : (
                  <span>{unifiedSchedule.startFormatted}</span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: '#785839', marginTop: 2 }}>
                {unifiedSchedule.isBoarding
                  ? 'All suites and boarding care activities adhere to this check-in / check-out timeframe.'
                  : 'All booked care services for your companions take place during this dedicated sanctuary time slot.'}
              </div>
            </div>
          </div>
        )}

        {/* Payment Warning / Counter badge */}
        {canPayOnline && (
          <Alert
            type="warning"
            showIcon
            message="Payment Required"
            description="Please complete your payment to guarantee room reservation and specialist assignment."
            style={{ marginTop: 16, borderRadius: 10 }}
          />
        )}
        {isPending(booking.status) && isCounterPaymentBooking(booking) && (
          <div style={{ marginTop: 16 }}>
            <Tag color="blue" style={{ borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
              Payment Method: Pay at Counter upon arrival
            </Tag>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div style={{ marginTop: 24 }}>
          <Row gutter={[20, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div style={{ background: 'var(--paper, #fdf9f3)', border: '1px solid #e8ded6', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#3d2d23', marginTop: 3 }}>{booking.customerName}</div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>{booking.customerPhone || 'N/A'}</div>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ background: 'var(--paper, #fdf9f3)', border: '1px solid #e8ded6', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Companions</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#3d2d23', marginTop: 3 }}>
                  {petGroups.length} Pet{petGroups.length > 1 ? 's' : ''} Registered
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>
                  {petGroups.map((p) => p.petName).join(', ')}
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ background: 'var(--paper, #fdf9f3)', border: '1px solid #e8ded6', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Services</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#3d2d23', marginTop: 3 }}>
                  {booking.bookingItems?.length || 0} Service{booking.bookingItems?.length > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>Across all companions</div>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ background: 'var(--paper, #fdf9f3)', border: '1px solid #e8ded6', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8c7662', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#785839', marginTop: 3 }}>
                  {booking.totalPrice.toLocaleString()} VND
                </div>
                {booking.voucherCode ? (
                  <div style={{ fontSize: 12, color: '#7c3aed' }}>
                    Voucher: {booking.voucherCode} (-{booking.discountAmount?.toLocaleString()} VND)
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>Standard Sanctuary Rate</div>
                )}
              </div>
            </Col>
          </Row>
        </div>

        {booking.cancellationReason && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', fontSize: 13.5 }}>
            <strong>Cancellation Reason:</strong> {booking.cancellationReason}
          </div>
        )}
      </Card>

      {/* Services Grouped by Pet Section */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontFamily: "'Playfair Display', Georgia, serif", color: '#3d2d23' }}>
          Services by Companion ({booking.bookingItems?.length || 0})
        </h2>
        <p style={{ margin: 0, color: '#8c7662', fontSize: 14 }}>
          Care services, specialists, and boarding suites organized individually for each of your furry family members.
        </p>
      </div>

      {petGroups.length === 0 ? (
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ color: '#64748b', margin: 0 }}>No services recorded for this booking.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {petGroups.map((group) => {
            const isPetCatSpecies = isCat(group.petSpecies);

            return (
              <Card
                key={group.petId || group.petName}
                style={{
                  borderRadius: 18,
                  border: '1px solid #e8ded6',
                  backgroundColor: 'var(--paper-card, #ffffff)',
                  boxShadow: '0 4px 16px -2px rgba(61,45,35,0.05)',
                  overflow: 'hidden',
                }}
                bodyStyle={{ padding: 0 }}
              >
                {/* Pet Group Header Bar */}
                <div
                  style={{
                    padding: '16px 24px',
                    background: 'var(--paper, #fdf9f3)',
                    borderBottom: '1px solid #e8ded6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: isPetCatSpecies ? '#faf5ff' : '#eff6ff',
                        color: isPetCatSpecies ? '#7e22ce' : '#1d4ed8',
                        border: `2px solid ${isPetCatSpecies ? '#e9d5ff' : '#bfdbfe'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isPetCatSpecies ? <CatIcon size={22} /> : <DogIcon size={22} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3d2d23' }}>
                          {group.petName}
                        </span>
                        {group.petId && (
                          <Link
                            to={`/customer/pets/${group.petId}`}
                            style={{ fontSize: 12, color: '#785839', textDecoration: 'underline' }}
                          >
                            View Pet Dossier →
                          </Link>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: '#8c7662' }}>
                        {isPetCatSpecies ? 'Feline Guest' : 'Canine Guest'} • Weight: <strong>{group.petWeight} kg</strong>
                      </div>
                    </div>
                  </div>

                  <Tag
                    style={{
                      borderRadius: 999,
                      padding: '3px 12px',
                      background: '#ffffff',
                      borderColor: '#e8ded6',
                      color: '#785839',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {group.items.length} service{group.items.length > 1 ? 's' : ''} for {group.petName}
                  </Tag>
                </div>

                {/* List of Services for this Pet */}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {group.items.map((item, idx) => {
                    const itemStatus = getItemStatusConfig(item.status);
                    const isBoarding = String(item.serviceType) === '1' || String(item.serviceType).toLowerCase() === 'boarding';
                    const hasPhotos = Boolean(item.beforeImageUrl || item.resultImageUrl);

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #eef2f6',
                          borderRadius: 14,
                          padding: '18px 20px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        }}
                      >
                        {/* Service Item Header & Price */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 260 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                {item.serviceName}
                              </span>

                              <Tag color={isBoarding ? 'geekblue' : 'cyan'} style={{ borderRadius: 6, fontWeight: 600 }}>
                                {isBoarding ? 'Boarding Suite' : 'Grooming & Spa'}
                              </Tag>

                              <Tag color={itemStatus.color} style={{ borderRadius: 6, fontWeight: 600 }}>
                                {itemStatus.label}
                              </Tag>
                            </div>

                            {/* Service Assignments (Staff / Room) - Notice Schedule is NOT repeated here! */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, fontSize: 13, color: '#64748b' }}>
                              {item.staffName ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <ScissorOutlined style={{ color: '#c69f7b' }} />
                                  <span>Assigned Specialist: <strong style={{ color: '#334155' }}>{item.staffName}</strong></span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <UserOutlined style={{ color: '#94a3b8' }} />
                                  <span>Care Specialist: <span style={{ color: '#94a3b8' }}>Dedicated Haven & Hound Caregiver</span></span>
                                </div>
                              )}

                              {item.roomName && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <HomeOutlined style={{ color: '#c69f7b' }} />
                                  <span>Assigned Suite: <strong style={{ color: '#334155' }}>{item.roomName}</strong></span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Price & Action Column */}
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#785839' }}>
                                {item.assignedPrice?.toLocaleString()} VND
                              </div>
                              {item.quantity > 1 && (
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                  Qty: {item.quantity} × {item.unitPrice?.toLocaleString()} VND
                                </div>
                              )}
                            </div>

                            {/* Care History (Boarding) */}
                            {isBoarding && (
                              <Button
                                type="link"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => setCareHistoryItem({ id: item.id, petName: item.petName })}
                                style={{ padding: 0, fontWeight: 600, color: '#0d9488' }}
                              >
                                View Care History
                              </Button>
                            )}

                            {/* Review Button Logic */}
                            {!isBookingCompleted ? (
                              <Tooltip title="Reviews can only be submitted after check-out and pet handover are complete.">
                                <Tag style={{ fontSize: 11, color: '#94a3b8', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', cursor: 'help' }}>
                                  Review available after Check-out
                                </Tag>
                              </Tooltip>
                            ) : itemStatus.label === 'Completed' ? (
                              ((item as any).isReviewed || reviewedItemIds.has(item.id)) ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Tag
                                    color="success"
                                    icon={<CheckCircleFilled style={{ color: '#785839' }} />}
                                    style={{
                                      borderRadius: 6,
                                      padding: '3px 8px',
                                      fontWeight: 600,
                                      background: '#fdf6ee',
                                      borderColor: '#e8ded6',
                                      color: '#785839',
                                      fontSize: 12,
                                      marginRight: 0,
                                    }}
                                  >
                                    Reviewed
                                  </Tag>
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<EyeOutlined />}
                                    style={{ color: '#0ea5e9', padding: '0 4px', fontWeight: 600, fontSize: 12 }}
                                    onClick={() => handleViewReview(item)}
                                  >
                                    View Review
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<StarFilled style={{ color: '#fff' }} />}
                                  style={{
                                    backgroundColor: '#f59e0b',
                                    borderColor: '#f59e0b',
                                    color: '#fff',
                                    borderRadius: 6,
                                    fontWeight: 600,
                                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
                                  }}
                                  onClick={() => handleOpenReview(item)}
                                >
                                  ⭐ Review Service
                                </Button>
                              )
                            ) : (
                              <Tag style={{ fontSize: 11, color: '#94a3b8', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                                Review available after completion
                              </Tag>
                            )}
                          </div>
                        </div>

                        {/* Care Results & Before / After Photos Section */}
                        {(hasPhotos || item.resultNote) && (
                          <div
                            style={{
                              marginTop: 14,
                              padding: '14px 16px',
                              background: 'var(--paper, #fdf9f3)',
                              border: '1px solid #ebd9c8',
                              borderRadius: 10,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10,
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CameraOutlined style={{ color: '#0d9488', fontSize: 16 }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>
                                  Care Outcome & Styling Photos
                                </span>
                              </div>
                              {hasPhotos && (
                                <Button
                                  type="link"
                                  size="small"
                                  style={{ color: '#0284c7', padding: 0, fontSize: 12, fontWeight: 600 }}
                                  onClick={() => setBeforeAfterItem(item)}
                                >
                                  View Comparison Modal →
                                </Button>
                              )}
                            </div>

                            {hasPhotos && (
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 16,
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  marginBottom: item.resultNote ? 12 : 0,
                                }}
                              >
                                <Image.PreviewGroup>
                                  {item.beforeImageUrl && (
                                    <div style={{ textAlign: 'center' }}>
                                      <Image
                                        src={item.beforeImageUrl}
                                        alt="Before Service"
                                        width={94}
                                        height={94}
                                        style={{
                                          objectFit: 'cover',
                                          borderRadius: 8,
                                          border: '2px solid #cbd5e1',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        }}
                                      />
                                      <div style={{ marginTop: 4 }}>
                                        <Tag color="default" style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, margin: 0 }}>
                                          Before
                                        </Tag>
                                      </div>
                                    </div>
                                  )}
                                  {item.resultImageUrl && (
                                    <div style={{ textAlign: 'center' }}>
                                      <Image
                                        src={item.resultImageUrl}
                                        alt="After Service"
                                        width={94}
                                        height={94}
                                        style={{
                                          objectFit: 'cover',
                                          borderRadius: 8,
                                          border: '2px solid #c69f7b',
                                          boxShadow: '0 2px 8px rgba(198,159,123,0.25)',
                                        }}
                                      />
                                      <div style={{ marginTop: 4 }}>
                                        <Tag color="success" style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, margin: 0 }}>
                                          After
                                        </Tag>
                                      </div>
                                    </div>
                                  )}
                                </Image.PreviewGroup>
                              </div>
                            )}

                            {item.resultNote && (
                              <div
                                style={{
                                  padding: '8px 12px',
                                  background: '#ffffff',
                                  borderLeft: '3px solid #0d9488',
                                  borderRadius: '0 6px 6px 0',
                                  fontSize: 13,
                                  color: '#334155',
                                }}
                              >
                                <span style={{ fontWeight: 600, color: '#0f766e' }}>
                                  Stylist / Caregiver notes {item.staffName ? `(${item.staffName})` : ''}:
                                </span>{' '}
                                <span>{item.resultNote}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Service Modal */}
      {reviewingItem && (
        <CreateReviewModal
          open={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setReviewingItem(null);
          }}
          onSuccess={handleReviewSuccess}
          bookingItemId={reviewingItem.id}
          serviceName={reviewingItem.serviceName}
          petName={reviewingItem.petName}
        />
      )}

      {/* View Submitted Review Modal */}
      <Modal
        open={Boolean(viewingReview)}
        onCancel={() => setViewingReview(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewingReview(null)} style={{ borderRadius: 8 }}>
            Close
          </Button>,
        ]}
        width={480}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarFilled style={{ color: '#f59e0b', fontSize: 18 }} />
            <span>Customer Review</span>
          </div>
        }
      >
        {viewingReview && (
          <div style={{ padding: '12px 0' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{viewingReview.serviceName}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Companion: {viewingReview.petName}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20, color: '#f59e0b' }}>{'★'.repeat(viewingReview.rating)}{'☆'.repeat(5 - viewingReview.rating)}</span>
              <Tag color="gold" style={{ fontWeight: 700 }}>{viewingReview.rating} / 5 Stars</Tag>
            </div>

            <div style={{ background: 'var(--paper, #fdf9f3)', border: '1px solid #e8ded6', borderRadius: 8, padding: '12px 14px', fontSize: 13.5, color: '#334155', fontStyle: 'italic', marginBottom: 12 }}>
              "{viewingReview.comment}"
            </div>

            {viewingReview.createdAt && (
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
                Reviewed on {dayjs(viewingReview.createdAt).format('DD/MM/YYYY [at] HH:mm')}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Boarding Care History Modal */}
      {careHistoryItem && (
        <CareRecordTimelineModal
          open={Boolean(careHistoryItem)}
          bookingItemId={careHistoryItem.id}
          petName={careHistoryItem.petName}
          onClose={() => setCareHistoryItem(null)}
        />
      )}

      {/* Comparison Photos Modal */}
      <Modal
        open={Boolean(beforeAfterItem)}
        onCancel={() => setBeforeAfterItem(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setBeforeAfterItem(null)} style={{ borderRadius: 8, backgroundColor: '#3d2d23', borderColor: '#3d2d23' }}>
            Close
          </Button>,
        ]}
        width={720}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CameraOutlined style={{ fontSize: 18, color: '#0d9488' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Before & After Service Showcase
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b' }}>
                {beforeAfterItem?.petName} • {beforeAfterItem?.serviceName}
              </div>
            </div>
          </div>
        }
      >
        {beforeAfterItem && (
          <div style={{ padding: '12px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 16 }}>
              {beforeAfterItem.beforeImageUrl && (
                <div style={{ textAlign: 'center' }}>
                  <Image
                    src={beforeAfterItem.beforeImageUrl}
                    alt="Before Service"
                    style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, border: '2px solid #cbd5e1' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Tag color="default" style={{ fontSize: 12, fontWeight: 600, borderRadius: 6 }}>
                      Before Service
                    </Tag>
                  </div>
                </div>
              )}
              {beforeAfterItem.resultImageUrl && (
                <div style={{ textAlign: 'center' }}>
                  <Image
                    src={beforeAfterItem.resultImageUrl}
                    alt="After Service"
                    style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, border: '2px solid #c69f7b' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Tag color="success" style={{ fontSize: 12, fontWeight: 600, borderRadius: 6 }}>
                      After Service (Completed)
                    </Tag>
                  </div>
                </div>
              )}
            </div>

            {beforeAfterItem.resultNote && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f766e', marginBottom: 4 }}>
                  Care Specialist Notes {beforeAfterItem.staffName ? `(${beforeAfterItem.staffName})` : ''}:
                </div>
                <div style={{ fontSize: 13.5, color: '#334155' }}>{beforeAfterItem.resultNote}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setCancelModalOpen(false)} style={{ borderRadius: 8 }}>
            Keep Booking
          </Button>,
          <Button
            key="submit"
            danger
            type="primary"
            loading={cancelling}
            onClick={handleConfirmCancel}
            style={{ borderRadius: 8 }}
          >
            Confirm Cancellation
          </Button>,
        ]}
        width={460}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626' }}>
            <ExclamationCircleOutlined />
            <span>Cancel Sanctuary Booking</span>
          </div>
        }
      >
        <p style={{ color: '#475569', fontSize: 14 }}>
          Are you sure you want to cancel booking <strong>#{booking.id.slice(0, 8).toUpperCase()}</strong>?
        </p>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
            Reason for Cancellation:
          </label>
          <TextArea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please let us know why you need to cancel..."
            style={{ borderRadius: 8 }}
          />
        </div>
      </Modal>
    </section>
  );
}

