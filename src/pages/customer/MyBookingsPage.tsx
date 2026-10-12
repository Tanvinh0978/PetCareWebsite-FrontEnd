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
} from 'antd';
import {
  CalendarOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  bookingService,
  type BookingListItem,
  type BookingDetail,
} from '@/services/booking.service';

const { Title, Text } = Typography;

export const getBookingStatusConfig = (status: any) => {
  const s = String(status ?? '').toLowerCase();
  if (s === '0' || s === 'pending') {
    return { label: 'Pending', color: 'gold', icon: <ClockCircleOutlined /> };
  }
  if (s === '1' || s === 'partially_completed' || s === 'inprogress' || s === 'in progress') {
    return { label: 'In Progress', color: 'blue', icon: <ClockCircleOutlined style={{ color: '#1677ff' }} /> };
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
  return s === '0' || s === 'pending' || s === '1' || s === 'partially_completed';
};

export const getItemStatusConfig = (status: any) => {
  const s = String(status ?? '').toLowerCase();
  if (s === '0' || s === 'pending') return { label: 'Pending', color: 'gold' };
  if (s === '1' || s === 'confirmed') return { label: 'Confirmed', color: 'cyan' };
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

  // VNPay payment state
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  const navigate = useNavigate();

  const handlePayVnpay = async (bookingId: string) => {
    try {
      setPayingBookingId(bookingId);
      message.loading({ content: 'Đang tạo liên kết thanh toán VNPay...', key: 'vnpay-pay' });
      const res: any = await bookingService.createVnpayUrl(bookingId);
      const paymentUrl = res?.result?.paymentUrl || res?.data?.paymentUrl || res?.paymentUrl || (typeof res?.result === 'string' ? res.result : null);
      if (paymentUrl) {
        message.success({ content: 'Chuyển hướng đến VNPay...', key: 'vnpay-pay' });
        window.location.href = paymentUrl;
      } else {
        message.error({ content: 'Không tìm thấy liên kết thanh toán VNPay.', key: 'vnpay-pay' });
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Không thể tạo liên kết thanh toán';
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
              Thanh toán VNPay
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
                  <Badge status="processing" /> In Progress
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
              Thanh toán VNPay
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
      </div>
    </div>
  );
};

export default MyBookingsPage;
