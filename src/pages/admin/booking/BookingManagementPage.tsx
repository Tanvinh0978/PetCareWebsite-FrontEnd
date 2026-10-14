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
  Tooltip,
  Typography,
} from 'antd'
import {
  SearchOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  DollarCircleOutlined,
  ShopOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { bookingService, type BookingListItem } from '@/services/booking.service'
import BookingDetailModal from '@/components/admin/BookingDetailModal'
import CheckoutBookingModal from '@/components/admin/CheckoutBookingModal'

const { Title, Text } = Typography
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
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null)
  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

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

  const handleCancelBooking = async (bookingId: string) => {
    setActionLoadingId(bookingId)
    try {
      await bookingService.updateBookingStatus(bookingId, { status: 3 }) // 3: Cancelled
      message.success('Booking cancelled.')
      fetchBookings()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to cancel booking'
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

  const getStatusBadge = (status: number | string) => {
    const s = Number(status)
    if (s === 0 || status === 'Pending') {
      return (
        <Tag color="warning" style={{ fontWeight: 600 }}>
          Pending
        </Tag>
      )
    }
    if (s === 1 || status === 'Confirmed') {
      return (
        <Tag color="blue" style={{ fontWeight: 600 }}>
          Confirmed
        </Tag>
      )
    }
    if (s === 2 || status === 'Completed') {
      return (
        <Tag color="success" style={{ fontWeight: 600 }}>
          Completed
        </Tag>
      )
    }
    if (s === 3 || status === 'Cancelled') {
      return (
        <Tag color="error" style={{ fontWeight: 600 }}>
          Cancelled
        </Tag>
      )
    }
    return <Tag>{status}</Tag>
  }

  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6366f1' }}>
          #{id ? id.slice(0, 8).toUpperCase() : '—'}
        </span>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 220,
      render: (_: any, record: BookingListItem) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
            {record.customerName || 'Guest'}
          </Text>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            Booked: {record.createdAt ? dayjs(record.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Services / Items',
      dataIndex: 'itemsCount',
      key: 'itemsCount',
      width: 150,
      render: (count: number, record: BookingListItem) => (
        <div>
          <Tag color="blue" style={{ fontWeight: 600 }}>
            {count || 1} Service Item(s)
          </Tag>
          <div style={{ marginTop: 4 }}>
            <Button
              type="link"
              size="small"
              onClick={() => setDetailBookingId(record.id)}
              style={{ padding: 0, fontSize: 12, height: 'auto', color: '#059669' }}
            >
              View Service Items →
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 160,
      render: (price: number) => (
        <Text strong style={{ fontSize: 15, color: '#059669' }}>
          {vnd.format(price)}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 190,
      render: (_: any, record: BookingListItem) => getStatusBadge(record.status),
    },
    {
      title: 'Front Desk Actions',
      key: 'actions',
      width: 270,
      render: (_: any, record: BookingListItem) => {
        const isPending = Number(record.status) === 0 || record.status === 'Pending'
        const isConfirmed = Number(record.status) === 1 || record.status === 'Confirmed'
        const isLoading = actionLoadingId === record.id

        return (
          <Space size={6} wrap>
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
                  <Button
                    type="primary"
                    size="small"
                    loading={isLoading}
                    icon={<CheckOutlined />}
                    style={{
                      backgroundColor: '#059669',
                      borderColor: '#059669',
                      fontWeight: 600,
                      borderRadius: 6,
                    }}
                  >
                    Confirm
                  </Button>
                </Popconfirm>

                <Popconfirm
                  title="Cancel this booking?"
                  description="Are you sure you want to cancel this booking?"
                  okText="Yes, Cancel"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleCancelBooking(record.id)}
                >
                  <Button
                    danger
                    size="small"
                    loading={isLoading}
                    icon={<CloseOutlined />}
                    style={{ borderRadius: 6 }}
                  >
                    Cancel
                  </Button>
                </Popconfirm>
              </>
            )}

            {/* Confirmed actions: Check-in or Check-out */}
            {isConfirmed && (
              <>
                {record.canCheckIn && (
                  <Popconfirm
                    title="Check in pet at salon?"
                    description="Customer has arrived with pet. Tasks will become available for staff."
                    okText="Check-in"
                    cancelText="Dismiss"
                    onConfirm={() => handleCheckInBooking(record.id)}
                  >
                    <Button
                      type="primary"
                      size="small"
                      loading={isLoading}
                      icon={<CheckCircleOutlined />}
                      style={{
                        backgroundColor: '#f59e0b',
                        borderColor: '#f59e0b',
                        fontWeight: 600,
                        borderRadius: 6,
                      }}
                    >
                      Check-in Pet
                    </Button>
                  </Popconfirm>
                )}

                {record.canCheckout && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<DollarCircleOutlined />}
                    onClick={() => setCheckoutBookingId(record.id)}
                    style={{
                      backgroundColor: '#0284c7',
                      borderColor: '#0284c7',
                      fontWeight: 600,
                      borderRadius: 6,
                    }}
                  >
                    Check-out at Counter
                  </Button>
                )}
              </>
            )}

            {/* Detail modal button */}
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDetailBookingId(record.id)}
              style={{ borderRadius: 6 }}
            >
              Detail & Assign
            </Button>
          </Space>
        )
      },
    },
  ]

  const todayStr = dayjs().format('YYYY-MM-DD')
  const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD')

  return (
    <section className="page wide">
      <div className="page-head" style={{ marginBottom: '1.25rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#0f172a' }}>
            Bookings & Front Desk Management
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Search bookings, filter by scheduled service date, confirm phone reservations, and handle customer check-outs.
          </Text>
        </div>
        <Space size={8}>
          <Link to={createBookingPath}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                backgroundColor: '#059669',
                borderColor: '#059669',
              }}
            >
              + Counter Booking
            </Button>
          </Link>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchBookings()}
            loading={loading}
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Filter Bar */}
      <Card
        style={{
          marginBottom: 18,
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
        styles={{ body: { padding: '16px' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top row: Search input + Service Date Picker + Quick date buttons */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', flex: 1 }}>
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
                <CalendarOutlined style={{ color: '#059669', fontSize: 16 }} />
                <Text strong style={{ fontSize: 13, color: '#475569' }}>
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
                <Button
                  size="small"
                  type={serviceDate === todayStr ? 'primary' : 'default'}
                  onClick={() => {
                    setServiceDate(todayStr)
                    setPageNumber(1)
                  }}
                  style={{
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    ...(serviceDate === todayStr
                      ? { backgroundColor: '#059669', borderColor: '#059669' }
                      : {}),
                  }}
                >
                  Today
                </Button>
                <Button
                  size="small"
                  type={serviceDate === tomorrowStr ? 'primary' : 'default'}
                  onClick={() => {
                    setServiceDate(tomorrowStr)
                    setPageNumber(1)
                  }}
                  style={{
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    ...(serviceDate === tomorrowStr
                      ? { backgroundColor: '#059669', borderColor: '#059669' }
                      : {}),
                  }}
                >
                  Tomorrow
                </Button>
                <Button
                  size="small"
                  type={!serviceDate ? 'primary' : 'default'}
                  onClick={() => {
                    setServiceDate(undefined)
                    setPageNumber(1)
                  }}
                  style={{
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    ...(!serviceDate ? { backgroundColor: '#475569', borderColor: '#475569' } : {}),
                  }}
                >
                  All Dates
                </Button>
              </Space>
            </div>

            <Button
              type="primary"
              onClick={() => {
                setPageNumber(1)
                fetchBookings()
              }}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                backgroundColor: '#059669',
                borderColor: '#059669',
              }}
            >
              Filter
            </Button>
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
              <Radio.Button value={0}>⏳ Pending</Radio.Button>
              <Radio.Button value={1}>🔵 Confirmed</Radio.Button>
              <Radio.Button value={2}>✓ Completed</Radio.Button>
              <Radio.Button value={3}>✕ Cancelled</Radio.Button>
            </Radio.Group>

            {serviceDate && (
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginLeft: 8 }}>
                Showing appointments for {serviceDate === todayStr ? 'Today' : serviceDate}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card
        style={{
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
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

      {/* Booking Details Modal */}
      <BookingDetailModal
        open={Boolean(detailBookingId)}
        bookingId={detailBookingId}
        onClose={() => setDetailBookingId(null)}
        onOpenCheckout={(id) => setCheckoutBookingId(id)}
        onUpdated={fetchBookings}
      />

      {/* Front Desk Check-out Modal */}
      <CheckoutBookingModal
        open={Boolean(checkoutBookingId)}
        bookingId={checkoutBookingId}
        onClose={() => setCheckoutBookingId(null)}
        onSuccess={() => {
          fetchBookings()
        }}
      />
    </section>
  )
}
