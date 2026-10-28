import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Table,
  Tag,
  Button,
  Input,
  DatePicker,
  Radio,
  Space,
  Card,
  Popconfirm,
  message,
  Typography,
  Modal,
} from 'antd'
import {
  SearchOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  DollarCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  StopOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { bookingService, type BookingListItem } from '@/services/booking.service'
import CheckoutBookingModal from '@/components/admin/CheckoutBookingModal'
import { BookingStatusBadge, ServiceTypeBadge } from '@/components/common/PetIcons'
import { useAuthStore } from '@/store/useAuthStore'
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper'

const { Text } = Typography
const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export default function BookingManagementPage() {
  const location = useLocation()
  const isStaff = location.pathname.startsWith('/staff')
  const createBookingPath = isStaff ? '/staff/bookings/new' : '/admin/bookings/new'

  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
  const [serviceDate, setServiceDate] = useState<string | undefined>(dayjs().format('YYYY-MM-DD'))

  // Modals
  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const currentUser = useAuthStore((s) => s.user)
  const canCreate = hasPermission(currentUser, PERMISSIONS.BOOKING_CREATE)
  const canCheckInPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_CHECKIN)
  const canCancelPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_CANCEL)

  // Cancel Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await bookingService.searchBookings({
        keyword: searchTerm.trim() || undefined,
        status: statusFilter,
        serviceDate: serviceDate || undefined,
        pageNumber,
        pageSize,
      })
      setBookings(res.items || [])
      setTotalCount(res.totalCount || 0)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load bookings'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, serviceDate, pageNumber, pageSize])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleConfirmBooking = async (bookingId: string) => {
    setActionLoadingId(bookingId)
    try {
      await bookingService.updateBookingStatus(bookingId, { status: 1 }) // 1: Confirmed
      message.success('Booking confirmed successfully!')
      fetchBookings()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to confirm booking'
      message.error(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  const openCancelModal = (bookingId: string) => {
    setCancellingBookingId(bookingId)
    setCancellationReason('Customer requested cancellation')
    setCancelModalOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return
    setCancelLoading(true)
    try {
      await bookingService.cancelBooking(cancellingBookingId, cancellationReason.trim() || 'Customer requested cancellation')
      message.success('Booking has been successfully cancelled.')
      setCancelModalOpen(false)
      setCancellingBookingId(null)
      setCancellationReason('')
      fetchBookings()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to cancel booking.'
      message.error(msg)
    } finally {
      setCancelLoading(false)
    }
  }

  const handleMarkNoShow = async (bookingId: string) => {
    setActionLoadingId(bookingId)
    try {
      await bookingService.markNoShow(bookingId)
      message.success('Marked as No-Show. Scheduled room and staff resources released.')
      fetchBookings()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to mark as No-Show.'
      message.error(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCheckInBooking = async (bookingId: string) => {
    setActionLoadingId(bookingId)
    try {
      await bookingService.checkIn(bookingId)
      message.success('Pet checked in successfully! Tasks are now active for staff.')
      fetchBookings()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to check in pet'
      message.error(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  const getStatusBadge = (status: number | string, record?: BookingListItem) => {
    return (
      <BookingStatusBadge
        status={status}
        reason={record?.cancellationReason}
        isNoShow={record?.isNoShow}
      />
    )
  }

  const columns = [
    {
      title: 'BOOKING ID',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4338ca' }}>
          #{id ? id.slice(0, 8).toUpperCase() : '—'}
        </span>
      ),
    },
    {
      title: 'CUSTOMER',
      key: 'customer',
      width: 200,
      render: (_: any, record: BookingListItem) => (
        <div>
          <Link
            to={`${isStaff ? '/staff/bookings' : '/admin/bookings'}/${record.id}`}
            style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-900)', textDecoration: 'none', display: 'block' }}
          >
            {record.customerName || 'Guest'}
          </Link>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            Booked: {record.createdAt ? dayjs(record.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'SCHEDULED TIME',
      key: 'scheduledTime',
      width: 210,
      render: (_: any, record: BookingListItem) => {
        const isBoarding =
          record.bookingType === 'Boarding' ||
          (record.serviceNames && record.serviceNames.some((s) => s.toLowerCase().includes('boarding')));

        if (isBoarding) {
          const startStr = record.scheduledStartAt ? dayjs(record.scheduledStartAt).format('DD/MM/YYYY HH:mm') : '—';
          const endStr = record.scheduledEndAt ? dayjs(record.scheduledEndAt).format('DD/MM/YYYY HH:mm') : '—';
          return (
            <div>
              <div style={{ fontWeight: 600, color: 'var(--slate-800)', fontSize: 13 }}>
                <CalendarOutlined style={{ marginRight: 6, color: 'var(--secondary)' }} />
                {startStr}
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>
                → Out: {endStr}
              </div>
              <ServiceTypeBadge type="Boarding" style={{ marginTop: 4 }} />
            </div>
          );
        }

        const apptStr = record.scheduledStartAt ? dayjs(record.scheduledStartAt).format('DD/MM/YYYY HH:mm') : '—';
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--slate-800)', fontSize: 13 }}>
              <CalendarOutlined style={{ marginRight: 6, color: 'var(--secondary)' }} />
              {apptStr}
            </div>
            <ServiceTypeBadge type="Grooming" style={{ marginTop: 4 }} />
          </div>
        );
      },
    },
    {
      title: 'SERVICES',
      dataIndex: 'itemsCount',
      key: 'itemsCount',
      width: 180,
      render: (count: number, record: BookingListItem) => {
        const names = record.serviceNames && record.serviceNames.length > 0
          ? record.serviceNames.join(', ')
          : `${count || 1} Service Item(s)`;
        return (
          <div>
            <div style={{ fontWeight: 500, color: 'var(--slate-800)', fontSize: 13, lineHeight: 1.3 }}>
              {names}
            </div>
            <Tag color="blue" style={{ fontSize: 11, marginTop: 4, borderRadius: 6 }}>
              {count || 1} Item(s)
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'TOTAL PRICE',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 160,
      render: (price: number) => (
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--secondary)' }}>
          {vnd.format(price)}
        </span>
      ),
    },
    {
      title: 'STATUS',
      key: 'status',
      width: 190,
      render: (_: any, record: BookingListItem) => getStatusBadge(record.status, record),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 250,
      render: (_: any, record: BookingListItem) => {
        const isPending = Number(record.status) === 0 || record.status === 'Pending'
        const isConfirmed = Number(record.status) === 1 || record.status === 'Confirmed'
        const isLoading = actionLoadingId === record.id

        return (
          <Space size={6} wrap>
            {/* Standard "View" button matching Customers/Pets Management */}
            <Link
              to={`${isStaff ? '/staff/bookings' : '/admin/bookings'}/${record.id}`}
              className="btn-action view"
              title="View booking details"
              style={{ textDecoration: 'none' }}
            >
              <EyeOutlined style={{ fontSize: 13 }} />
              View
            </Link>

            {/* Pending actions: Confirm or Cancel */}
            {isPending && (
              <>
                <Popconfirm
                  title="Confirm this booking?"
                  description="Acknowledge appointment and assign salon resources."
                  okText="Confirm"
                  cancelText="Dismiss"
                  onConfirm={() => handleConfirmBooking(record.id)}
                >
                  <button
                    type="button"
                    className="btn-action edit"
                    disabled={isLoading}
                    title="Confirm booking"
                  >
                    <CheckOutlined style={{ fontSize: 12 }} />
                    Confirm
                  </button>
                </Popconfirm>

                {canCancelPerm && (
                  <button
                    type="button"
                    className="btn-action danger"
                    disabled={isLoading}
                    onClick={() => openCancelModal(record.id)}
                    title="Cancel booking"
                  >
                    <CloseOutlined style={{ fontSize: 12 }} />
                    Cancel
                  </button>
                )}
              </>
            )}

            {/* Confirmed actions: Check-in, Check-out, Cancel, or No-Show */}
            {isConfirmed && (
              <>
                {record.canCheckIn && canCheckInPerm && (
                  <Popconfirm
                    title="Check in pet at salon?"
                    description="Customer has arrived with pet. Tasks will become available for staff."
                    okText="Check-in"
                    cancelText="Dismiss"
                    onConfirm={() => handleCheckInBooking(record.id)}
                  >
                    <button
                      type="button"
                      className="btn-action"
                      disabled={isLoading}
                      style={{
                        background: '#fef3c7',
                        borderColor: '#fde68a',
                        color: '#b45309',
                      }}
                      title="Check in pet"
                    >
                      <CheckCircleOutlined style={{ fontSize: 12 }} />
                      Check-in
                    </button>
                  </Popconfirm>
                )}

                {!record.hasInServiceItems && !record.canCheckout && canCancelPerm && (
                  <>
                    <button
                      type="button"
                      className="btn-action danger"
                      disabled={isLoading}
                      onClick={() => openCancelModal(record.id)}
                      title="Cancel booking"
                    >
                      <CloseOutlined style={{ fontSize: 12 }} />
                      Cancel
                    </button>

                    {(record.canMarkNoShow ?? true) && (
                      <Popconfirm
                        title="Mark customer as No-Show?"
                        description="Customer missed the appointment. Room and staff assignments will be released."
                        okText="Mark No-Show"
                        cancelText="Dismiss"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleMarkNoShow(record.id)}
                      >
                        <button
                          type="button"
                          className="btn-action"
                          disabled={isLoading}
                          style={{
                            borderRadius: 6,
                            color: '#7c3aed',
                            borderColor: '#c4b5fd',
                            backgroundColor: '#f5f3ff',
                          }}
                          title="Mark as No-Show"
                        >
                          <StopOutlined style={{ fontSize: 12 }} />
                          No-Show
                        </button>
                      </Popconfirm>
                    )}
                  </>
                )}

                {record.canCheckout && (
                  <button
                    type="button"
                    className="btn-action"
                    style={{
                      background: '#e0f2fe',
                      borderColor: '#bae6fd',
                      color: '#0369a1',
                    }}
                    onClick={() => setCheckoutBookingId(record.id)}
                    title="Check out"
                  >
                    <DollarCircleOutlined style={{ fontSize: 12 }} />
                    Check-out
                  </button>
                )}
              </>
            )}
          </Space>
        )
      },
    },
  ]

  const todayStr = dayjs().format('YYYY-MM-DD')
  const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD')

  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <h1>Bookings Management</h1>
          <p className="page-subtitle">View, search, and manage bookings in table format.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {canCreate && (
            <Link to={createBookingPath} className="btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add booking
            </Link>
          )}
          <button
            type="button"
            className="btn-action view"
            onClick={() => fetchBookings()}
            disabled={loading}
            style={{ height: 42, padding: '0 1.1rem', borderRadius: 999 }}
          >
            <ReloadOutlined spin={loading} style={{ fontSize: 13 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card
        style={{
          marginBottom: 18,
          borderRadius: 14,
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)',
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top row: Search input + Service Date Picker + Quick date buttons + Filter Button */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', flex: 1 }}>
              <Input
                placeholder="Search customer name, phone number..."
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={() => {
                  setPageNumber(1)
                  fetchBookings()
                }}
                allowClear
                style={{ width: 280, borderRadius: 8 }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarOutlined style={{ color: 'var(--secondary)', fontSize: 16 }} />
                <Text strong style={{ fontSize: 13, color: 'var(--slate-700)' }}>
                  Service Date:
                </Text>
                <DatePicker
                  value={serviceDate ? dayjs(serviceDate, 'YYYY-MM-DD') : null}
                  onChange={(date: Dayjs | null) => {
                    setServiceDate(date ? date.format('YYYY-MM-DD') : undefined)
                    setPageNumber(1)
                  }}
                  format="YYYY-MM-DD"
                  placeholder="Select service date"
                  allowClear
                  style={{ width: 150, borderRadius: 8 }}
                />
              </div>

              {/* Quick Date Switchers */}
              <Space size={6}>
                <button
                  type="button"
                  className="btn-action"
                  onClick={() => {
                    setServiceDate(todayStr)
                    setPageNumber(1)
                  }}
                  style={{
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '0.4rem 0.85rem',
                    ...(serviceDate === todayStr
                      ? { backgroundColor: '#3d2d23', borderColor: '#3d2d23', color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: 'var(--slate-200)', color: 'var(--slate-700)' }),
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="btn-action"
                  onClick={() => {
                    setServiceDate(tomorrowStr)
                    setPageNumber(1)
                  }}
                  style={{
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '0.4rem 0.85rem',
                    ...(serviceDate === tomorrowStr
                      ? { backgroundColor: '#3d2d23', borderColor: '#3d2d23', color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: 'var(--slate-200)', color: 'var(--slate-700)' }),
                  }}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  className="btn-action"
                  onClick={() => {
                    setServiceDate(undefined)
                    setPageNumber(1)
                  }}
                  style={{
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '0.4rem 0.85rem',
                    ...(!serviceDate
                      ? { backgroundColor: '#3d2d23', borderColor: '#3d2d23', color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: 'var(--slate-200)', color: 'var(--slate-700)' }),
                  }}
                >
                  All Dates
                </button>
              </Space>
            </div>

            <button
              type="button"
              className="btn"
              onClick={() => {
                setPageNumber(1)
                fetchBookings()
              }}
              style={{
                height: 38,
                padding: '0 1.35rem',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Filter
            </button>
          </div>

          {/* Bottom row: Status filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              Status:
            </Text>
            <Radio.Group
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPageNumber(1)
              }}
              buttonStyle="solid"
              size="middle"
            >
              <Radio.Button value={undefined}>All</Radio.Button>
              <Radio.Button value={0}>
                <ClockCircleOutlined style={{ marginRight: 6 }} />
                Pending
              </Radio.Button>
              <Radio.Button value={1}>
                <CheckCircleOutlined style={{ marginRight: 6 }} />
                Confirmed
              </Radio.Button>
              <Radio.Button value={2}>
                <CheckOutlined style={{ marginRight: 6 }} />
                Completed
              </Radio.Button>
              <Radio.Button value={3}>
                <CloseCircleOutlined style={{ marginRight: 6 }} />
                Cancelled
              </Radio.Button>
              <Radio.Button value={4}>
                <StopOutlined style={{ marginRight: 6 }} />
                No-Show
              </Radio.Button>
            </Radio.Group>

            {serviceDate && (
              <span style={{ fontSize: 12, color: 'var(--secondary)', fontWeight: 600, marginLeft: 8 }}>
                Showing appointments for {serviceDate === todayStr ? 'Today' : serviceDate}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card
        style={{
          borderRadius: 14,
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)',
        }}
        styles={{ body: { padding: '16px' } }}
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
            pageSizeOptions: ['10', '20', '50'],
            onChange: (p, ps) => {
              setPageNumber(p)
              setPageSize(ps)
            },
            showTotal: (total) => `Total ${total} bookings`,
          }}
          scroll={{ x: 960 }}
        />
      </Card>

      {/* Front Desk Check-out Modal */}
      <CheckoutBookingModal
        open={Boolean(checkoutBookingId)}
        bookingId={checkoutBookingId}
        onClose={() => setCheckoutBookingId(null)}
        onSuccess={() => {
          fetchBookings()
        }}
      />

      {/* Cancel Booking Reason Modal */}
      <Modal
        title="Cancel Booking"
        open={cancelModalOpen}
        onCancel={() => {
          setCancelModalOpen(false)
          setCancellingBookingId(null)
          setCancellationReason('')
        }}
        onOk={handleConfirmCancel}
        confirmLoading={cancelLoading}
        okText="Confirm Cancel"
        okButtonProps={{ danger: true }}
        cancelText="Dismiss"
        centered
      >
        <p style={{ color: 'var(--slate-600)', fontSize: 13, marginBottom: 12 }}>
          Receptionist is cancelling this booking per customer request or unexpected circumstances. Please provide a cancellation reason:
        </p>
        <Input.TextArea
          rows={3}
          value={cancellationReason}
          onChange={(e) => setCancellationReason(e.target.value)}
          placeholder="e.g. Customer called to cancel / Pet is unwell..."
        />
      </Modal>
    </section>
  )
}
