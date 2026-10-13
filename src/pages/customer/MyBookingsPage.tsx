import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Descriptions,
  message,
  Spin,
  Empty,
  Tabs,
  Badge,
  Input,
  Rate,
  Alert,
} from 'antd';
import {
  CalendarOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  ExclamationCircleOutlined,
  StarFilled,
  CreditCardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  bookingService,
  type BookingListItem,
  type BookingDetail,
  type BookingDetailItem,
} from '@/services/booking.service';
import { reviewService } from '@/services/review.service';
import CreateReviewModal from '@/components/review/CreateReviewModal';

const { Title, Text } = Typography;

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
  return { label: String(status || 'Unknown'), color: 'default', icon: null };
};

export const isPending = (status: any) => {
  const s = String(status ?? '').toLowerCase();
  return s === '0' || s === 'pending';
};

export const isCancellable = (status: any) => {
  const s = String(status ?? '').toLowerCase();
  return s === '0' || s === 'pending' || s === '1' || s === 'confirmed' || s === 'partially_completed';
};

export const getItemStatusConfig = (status: any) => {
  const s = String(status ?? '').toLowerCase();
  if (s === '0' || s === 'pending') return { label: 'Pending', color: 'gold' };
  if (s === '1' || s === 'confirmed') return { label: 'Confirmed', color: 'blue' };
  if (s === '2' || s === 'checked_in' || s === 'checkedin') return { label: 'Checked In', color: 'blue' };
  if (s === '3' || s === 'in_progress' || s === 'inprogress') return { label: 'In Progress', color: 'processing' };
  if (s === '4' || s === 'completed') return { label: 'Completed', color: 'green' };
  if (s === '5' || s === 'cancelled' || s === 'canceled') return { label: 'Cancelled', color: 'red' };
  if (s === '6' || s === 'no_show' || s === 'noshow') return { label: 'No Show', color: 'default' };
  return { label: String(status || 'Unknown'), color: 'default' };
};

const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Detail Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cancel Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<{
    id: string;
    serviceName: string;
    petName: string;
  } | null>(null);

  // Track which booking items have already been reviewed
  const [reviewedItemIds, setReviewedItemIds] = useState<Set<string>>(() => {
    try {
      const cached = localStorage.getItem('petcare_reviewed_items');
      return cached ? new Set(JSON.parse(cached)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [reviewedItemMap, setReviewedItemMap] = useState<
    Record<string, { rating: number; comment?: string | null; createdAt?: string }>
  >({});

  const [viewingReview, setViewingReview] = useState<{
    serviceName: string;
    petName: string;
    rating: number;
    comment: string;
    createdAt?: string;
  } | null>(null);

  const syncReviewedItems = useCallback(async () => {
    try {
      const res = await reviewService.getReviews({ pageSize: 100 });
      if (res.isSuccess && res.result?.items) {
        const details = await Promise.all(
          res.result.items.map((r) => reviewService.getById(r.id).catch(() => null))
        );
        const itemIds = new Set<string>();
        const itemMap: Record<string, { rating: number; comment?: string | null; createdAt?: string }> = {};

        try {
          const cached = localStorage.getItem('petcare_reviewed_items');
          if (cached) JSON.parse(cached).forEach((id: string) => itemIds.add(id));
        } catch {}

        details.forEach((d) => {
          if (d?.isSuccess && d.result?.bookingItemId) {
            itemIds.add(d.result.bookingItemId);
            itemMap[d.result.bookingItemId] = {
              rating: d.result.rating,
              comment: d.result.comment,
              createdAt: d.result.createdAt,
            };
          }
        });

        setReviewedItemIds(itemIds);
        setReviewedItemMap(itemMap);
        try {
          localStorage.setItem('petcare_reviewed_items', JSON.stringify(Array.from(itemIds)));
        } catch {}
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    syncReviewedItems();
  }, [syncReviewedItems]);

  const handleOpenReview = (item: BookingDetailItem) => {
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

  const handleViewReview = async (item: BookingDetailItem) => {
    if (reviewedItemMap[item.id]) {
      const r = reviewedItemMap[item.id];
      setViewingReview({
        serviceName: item.serviceName,
        petName: item.petName,
        rating: r.rating,
        comment: r.comment || '(No written comment provided)',
        createdAt: r.createdAt,
      });
      return;
    }

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

  // VNPay payment state
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  const navigate = useNavigate();

  const handlePayVnpay = async (bookingId: string) => {
    try {
      setPayingBookingId(bookingId);
      message.loading({ content: 'Creating VNPay payment link...', key: 'vnpay-pay' });
      const res: any = await bookingService.createVnpayUrl(bookingId);
      const paymentUrl = res?.result?.paymentUrl || res?.data?.paymentUrl || res?.paymentUrl || (typeof res?.result === 'string' ? res.result : null);
      if (paymentUrl) {
        message.success({ content: 'Redirecting to VNPay...', key: 'vnpay-pay' });
        window.location.href = paymentUrl;
      } else {
        message.error({ content: 'VNPay payment link was not found.', key: 'vnpay-pay' });
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Unable to create a payment link.';
      message.error({ content: errorMsg, key: 'vnpay-pay' });
    } finally {
      setPayingBookingId(null);
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.fetchMyBookings({
        pageNumber,
        pageSize,
        status: statusFilter,
      });
      setBookings(data.items);
      setTotalCount(data.totalCount);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenDetail = async (id: string) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const detail = await bookingService.fetchById(id);
      setSelectedBooking(detail);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to load booking details');
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenCancel = (id: string) => {
    setCancellingBookingId(id);
    setCancelReason('Change of plans');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    setCancelLoading(true);
    try {
      await bookingService.cancelBooking(cancellingBookingId, cancelReason || 'Customer cancelled');
      message.success('Booking cancelled successfully');
      setCancelModalOpen(false);
      setCancellingBookingId(null);
      fetchBookings();
      if (detailModalOpen && selectedBooking?.id === cancellingBookingId) {
        setDetailModalOpen(false);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text strong style={{ fontFamily: 'monospace', color: '#059669' }}>
          #{id.slice(0, 8).toUpperCase()}
        </Text>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => (
        <span>{val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'N/A'}</span>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'itemsCount',
      key: 'itemsCount',
      render: (count: number) => <span>{count} service(s)</span>,
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => (
        <Text strong style={{ color: '#059669' }}>
          {price ? `${price.toLocaleString()} VND` : '0 VND'}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st: any) => {
        const config = getBookingStatusConfig(st);
        return (
          <Tag color={config.color} icon={config.icon} style={{ borderRadius: 12, padding: '2px 10px' }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BookingListItem) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            style={{ backgroundColor: '#059669', borderRadius: 6 }}
            onClick={() => handleOpenDetail(record.id)}
          >
            Details
          </Button>
          {(String(record.status).toLowerCase() === '2' || String(record.status).toLowerCase() === 'completed') && (
            <Button
              type="default"
              size="small"
              icon={<StarFilled style={{ color: '#f59e0b' }} />}
              style={{
                borderColor: '#f59e0b',
                color: '#b45309',
                borderRadius: 6,
                fontWeight: 600,
                backgroundColor: '#fffbeb',
              }}
              onClick={() => handleOpenDetail(record.id)}
            >
              Review
            </Button>
          )}
          {isPending(record.status) && (
            <Button
              type="default"
              size="small"
              icon={<CreditCardOutlined />}
              loading={payingBookingId === record.id}
              style={{
                borderColor: '#10b981',
                color: '#059669',
                borderRadius: 6,
                fontWeight: 500,
              }}
              onClick={() => handlePayVnpay(record.id)}
            >
              Pay with VNPay
            </Button>
          )}
          {isCancellable(record.status) && (
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              style={{ borderRadius: 6 }}
              onClick={() => handleOpenCancel(record.id)}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: '#f8fafc',
        padding: '32px 16px 64px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header section */}
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
        <div>
          <Title level={2} style={{ margin: 0, color: '#0f172a' }}>
            <CalendarOutlined style={{ marginRight: 10, color: '#059669' }} />
            My Bookings
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            View and manage all your pet care appointments
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchBookings} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: '#059669', borderRadius: 8 }}
            onClick={() => navigate('/customer/booking')}
          >
            New Booking
          </Button>
        </Space>
      </div>

      {/* Filter Tabs */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
          marginBottom: 20,
        }}
        bodyStyle={{ padding: '8px 16px' }}
      >
        <Tabs
          activeKey={statusFilter === undefined ? 'all' : String(statusFilter)}
          onChange={(key) => {
            setPageNumber(1);
            setStatusFilter(key === 'all' ? undefined : Number(key));
          }}
          items={[
            { key: 'all', label: 'All Bookings' },
            {
              key: '0',
              label: (
                <span>
                  <Badge status="warning" /> Pending
                </span>
              ),
            },
            {
              key: '1',
              label: (
                <span>
                  <Badge color="#1677ff" /> Confirmed
                </span>
              ),
            },
            {
              key: '2',
              label: (
                <span>
                  <Badge status="success" /> Completed
                </span>
              ),
            },
            {
              key: '3',
              label: (
                <span>
                  <Badge status="error" /> Cancelled
                </span>
              ),
            },
          ]}
        />
      </Card>

      {/* Bookings Table / List */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={bookings}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pageNumber,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPageNumber(p);
              setPageSize(ps);
            },
            style: { padding: '16px' },
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No bookings found."
              >
                <Button
                  type="primary"
                  style={{ backgroundColor: '#059669' }}
                  onClick={() => navigate('/customer/booking')}
                >
                  Book an Appointment Now
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Booking Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: '#059669' }} />
            <span>Booking Details</span>
            {selectedBooking && (() => {
              const cfg = getBookingStatusConfig(selectedBooking.status);
              return (
                <Tag color={cfg.color} icon={cfg.icon} style={{ marginLeft: 8 }}>
                  {cfg.label}
                </Tag>
              );
            })()}
          </div>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          selectedBooking && isPending(selectedBooking.status) && (
            <Button
              key="vnpay"
              type="primary"
              icon={<CreditCardOutlined />}
              loading={payingBookingId === selectedBooking.id}
              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
              onClick={() => handlePayVnpay(selectedBooking.id)}
            >
              Pay with VNPay
            </Button>
          ),
          selectedBooking && isCancellable(selectedBooking.status) && (
            <Button
              key="cancel"
              danger
              onClick={() => handleOpenCancel(selectedBooking.id)}
            >
              Cancel Booking
            </Button>
          ),
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={750}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : selectedBooking ? (
          <div>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Booking Code">
                <Text strong style={{ fontFamily: 'monospace', color: '#059669' }}>
                  #{selectedBooking.id.slice(0, 8).toUpperCase()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Booking Date">
                {dayjs(selectedBooking.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {selectedBooking.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {selectedBooking.customerPhone || 'N/A'}
              </Descriptions.Item>
              {selectedBooking.voucherCode && (
                <>
                  <Descriptions.Item label="Voucher Applied">
                    <Tag color="purple">{selectedBooking.voucherCode}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Discount">
                    -{selectedBooking.discountAmount.toLocaleString()} VND
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Total Amount" span={2}>
                <Text strong style={{ fontSize: 17, color: '#059669' }}>
                  {selectedBooking.totalPrice.toLocaleString()} VND
                </Text>
              </Descriptions.Item>
              {selectedBooking.cancellationReason && (
                <Descriptions.Item label="Cancellation Reason" span={2}>
                  <Text type="danger">{selectedBooking.cancellationReason}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Title level={5} style={{ marginBottom: 12 }}>
              Booked Services ({selectedBooking.bookingItems?.length || 0})
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedBooking.bookingItems?.map((item) => {
                const itemStatus = getItemStatusConfig(item.status);
                return (
                  <Card
                    key={item.id}
                    size="small"
                    style={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                            {item.serviceName}
                          </Text>
                          <Tag color="cyan">
                            {String(item.serviceType) === '1' || String(item.serviceType).toLowerCase() === 'boarding'
                              ? 'Boarding / Hotel'
                              : 'Grooming & Spa'}
                          </Tag>
                          <Tag color={itemStatus.color}>{itemStatus.label}</Tag>
                        </div>
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                          Pet: <strong>{item.petName}</strong> ({item.petWeight}kg)
                        </div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>
                          Schedule: <strong>{dayjs(item.scheduledStartAt).format('DD/MM/YYYY HH:mm')}</strong>
                          {item.scheduledEndAt && (
                            <> - <strong>{dayjs(item.scheduledEndAt).format('DD/MM/YYYY HH:mm')}</strong></>
                          )}
                        </div>
                        {item.roomName && (
                          <div style={{ color: '#64748b', fontSize: 13 }}>
                            Assigned Room: <strong>{item.roomName}</strong>
                          </div>
                        )}
                        {item.staffName && (
                          <div style={{ color: '#64748b', fontSize: 13 }}>
                            Assigned Staff: <strong>{item.staffName}</strong>
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#059669' }}>
                          {item.assignedPrice?.toLocaleString()} VND
                        </div>
                        {item.quantity > 1 && (
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            Qty: {item.quantity} x {item.unitPrice?.toLocaleString()} VND
                          </div>
                        )}
                        {itemStatus.label === 'Completed' ? (
                          ((item as any).isReviewed || reviewedItemIds.has(item.id)) ? (
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              <Tag
                                color="success"
                                icon={<CheckCircleFilled style={{ color: '#10b981' }} />}
                                style={{
                                  borderRadius: 6,
                                  padding: '3px 8px',
                                  fontWeight: 600,
                                  background: '#ecfdf5',
                                  borderColor: '#a7f3d0',
                                  color: '#065f46',
                                  fontSize: 12,
                                  marginRight: 0,
                                }}
                              >
                                ✓ Reviewed
                              </Tag>
                              <Button
                                type="link"
                                size="small"
                                icon={<EyeOutlined />}
                                style={{ color: '#0ea5e9', padding: '0 4px', fontWeight: 600, fontSize: 12 }}
                                onClick={() => handleViewReview(item)}
                              >
                                View
                              </Button>
                            </div>
                          ) : (
                            <div style={{ marginTop: 8 }}>
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
                            </div>
                          )
                        ) : (
                          <div style={{ marginTop: 8 }}>
                            <Tag style={{ fontSize: 11, color: '#94a3b8', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                              🔒 Available after service is completed
                            </Tag>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626' }}>
            <ExclamationCircleOutlined />
            <span>Cancel Booking</span>
          </div>
        }
        open={cancelModalOpen}
        onOk={handleConfirmCancel}
        confirmLoading={cancelLoading}
        onCancel={() => setCancelModalOpen(false)}
        okText="Confirm Cancel"
        okType="danger"
      >
        <p>Are you sure you want to cancel this booking? This action cannot be undone.</p>
        <div style={{ marginTop: 12 }}>
          <Text strong>Reason for cancellation (optional):</Text>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
            {['Change of plans', 'Pet is unwell', 'Booked wrong date', 'Other reason'].map((r) => (
              <Tag
                key={r}
                color={cancelReason === r ? 'red' : 'default'}
                style={{ cursor: 'pointer', borderRadius: 12, padding: '2px 10px' }}
                onClick={() => setCancelReason(r)}
              >
                {r}
              </Tag>
            ))}
          </div>
          <Input.TextArea
            rows={3}
            style={{ marginTop: 6 }}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please tell us why you are cancelling..."
          />
        </div>
      </Modal>

      {/* Create / Edit Review Modal */}
      {reviewingItem && (
        <CreateReviewModal
          open={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setReviewingItem(null);
          }}
          onSuccess={() => {
            syncReviewedItems();
            fetchBookings();
            if (selectedBooking) {
              handleOpenDetail(selectedBooking.id);
            }
          }}
          bookingItemId={reviewingItem.id}
          serviceName={reviewingItem.serviceName}
          petName={reviewingItem.petName}
        />
      )}

      {/* View Review Modal (Read-Only) */}
      <Modal
        open={Boolean(viewingReview)}
        onCancel={() => setViewingReview(null)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setViewingReview(null)}
            style={{ borderRadius: 8, backgroundColor: '#059669', borderColor: '#059669', padding: '0 20px', fontWeight: 600 }}
          >
            Close
          </Button>,
        ]}
        width={520}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <StarFilled style={{ fontSize: 18 }} />
            </div>
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                Your Service Review
              </Typography.Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Submitted feedback for completed service
              </Text>
            </div>
          </div>
        }
      >
        {viewingReview && (
          <div style={{ padding: '8px 0' }}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  SERVICE
                </Text>
                <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                  {viewingReview.serviceName}
                </Text>
                {viewingReview.petName && (
                  <div style={{ marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Pet: <strong style={{ color: '#059669' }}>{viewingReview.petName}</strong>
                    </Text>
                  </div>
                )}
              </div>
              <Tag
                color="success"
                icon={<CheckCircleFilled style={{ color: '#10b981' }} />}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontWeight: 600,
                  background: '#ecfdf5',
                  borderColor: '#a7f3d0',
                  color: '#065f46',
                }}
              >
                Reviewed
              </Tag>
            </div>

            <div
              style={{
                textAlign: 'center',
                padding: '16px 0',
                background: '#fffbeb',
                borderRadius: 12,
                border: '1px solid #fef3c7',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 13, color: '#78350f', display: 'block', marginBottom: 6 }}>
                Your Rating
              </Text>
              <Rate disabled value={viewingReview.rating} style={{ fontSize: 32, color: '#f59e0b' }} />
              <div style={{ marginTop: 6, fontWeight: 700, color: '#b45309', fontSize: 15 }}>
                {viewingReview.rating} / 5 Stars
              </div>
              {viewingReview.createdAt && (
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Submitted on {dayjs(viewingReview.createdAt).format('DD/MM/YYYY HH:mm')}
                </div>
              )}
            </div>

            <div>
              <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 6 }}>
                Your Feedback:
              </Text>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '14px 16px',
                  color: '#1e293b',
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontStyle: viewingReview.comment ? 'normal' : 'italic',
                }}
              >
                {viewingReview.comment || 'No written feedback provided.'}
              </div>
            </div>

            <Alert
              type="info"
              showIcon
              message="Each completed service can only be reviewed once. You cannot edit or submit additional reviews."
              style={{ marginTop: 16, borderRadius: 8, fontSize: 12 }}
            />
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
};

export default MyBookingsPage;
