import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Table,
  Spin,
  Alert,
  Tooltip,
} from 'antd'
import {
  DollarOutlined,
  CalendarOutlined,
  ShopOutlined,
  UserOutlined,
  ToolOutlined,
  LoginOutlined,
  LogoutOutlined,
  TeamOutlined,
  ScissorOutlined,
  HomeOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { dashboardService } from '@/services/dashboard.service'
import type { DashboardStatsResponse, RecentBookingItem } from '@/types/dashboard.types'
import BookingDetailModal from '@/components/admin/BookingDetailModal'
import CheckoutBookingModal from '@/components/admin/CheckoutBookingModal'
import { BookingStatusBadge } from '@/components/common/PetIcons'

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

interface OperationsDashboardProps {
  role: 'admin' | 'staff'
  headerActions?: React.ReactNode
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({ role, headerActions }) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [detailBookingId, setDetailBookingId] = useState<string | null>(null)
  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await dashboardService.getStats()
      setStats(data)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load dashboard metrics.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const maxRevenue = Math.max(
    ...(stats?.revenueTrend?.map((item) => Number(item.revenue)) || [1]),
    1000000
  )

  const bookingsPath = role === 'admin' ? '/admin/bookings' : '/staff/bookings'

  const recentBookingColumns = [
    {
      title: 'BOOKING ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#785839', fontSize: 13 }}>
          #{id ? id.slice(0, 8).toUpperCase() : '—'}
        </span>
      ),
    },
    {
      title: 'CUSTOMER',
      key: 'customer',
      width: 220,
      render: (_: any, record: RecentBookingItem) => (
        <div>
          <Link
            to={`${bookingsPath}/${record.id}`}
            style={{ fontWeight: 700, fontSize: 13, color: '#3d2d23', textDecoration: 'none' }}
          >
            {record.customerName || 'Guest'}
          </Link>
          <div style={{ fontSize: 12, color: '#8c735f', marginTop: 2 }}>
            <a href={`tel:${record.customerPhone}`} style={{ color: '#785839', textDecoration: 'none' }}>
              {record.customerPhone}
            </a>
          </div>
        </div>
      ),
    },
    {
      title: 'PETS',
      dataIndex: 'petNames',
      key: 'petNames',
      width: 180,
      render: (pets: string[]) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {pets && pets.length > 0 ? (
            pets.map((p, idx) => (
              <Tag
                key={idx}
                style={{
                  margin: 0,
                  fontSize: 11,
                  backgroundColor: '#faf6f0',
                  border: '1px solid #eeddc8',
                  color: '#785839',
                  borderRadius: 999,
                }}
              >
                {p}
              </Tag>
            ))
          ) : (
            <span style={{ color: '#8c735f' }}>—</span>
          )}
        </div>
      ),
    },
    {
      title: 'TOTAL PRICE',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      align: 'right' as const,
      width: 150,
      render: (price: number) => (
        <span style={{ fontWeight: 700, color: '#785839', fontSize: 14 }}>
          {vnd.format(price)}
        </span>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (st: any) => <BookingStatusBadge status={st} />,
    },
    {
      title: 'BOOKED AT',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (dateStr: string) => (
        <span style={{ fontSize: 12, color: '#8c735f' }}>
          {dateStr ? dayjs(dateStr).format('DD/MM HH:mm') : '—'}
        </span>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'action',
      align: 'right' as const,
      width: 160,
      render: (_: any, record: RecentBookingItem) => {
        const isConfirmed = Number(record.status) === 1 || record.status === 'Confirmed'
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
            {isConfirmed && (
              <button
                type="button"
                className="btn-action"
                onClick={() => setCheckoutBookingId(String(record.id))}
                style={{
                  background: '#e0f2fe',
                  borderColor: '#bae6fd',
                  color: '#0369a1',
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title="Check-out pet"
              >
                Check-out
              </button>
            )}
            <Link
              to={`${bookingsPath}/${record.id}`}
              className="btn-action view"
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="View details"
            >
              <EyeOutlined style={{ fontSize: 11 }} />
              View
            </Link>
          </div>
        )
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-head" style={{ marginBottom: 0 }}>
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
            {role === 'admin' ? 'Executive Dashboard' : 'Front Desk & Operations Dashboard'}
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            Real-time business performance, salon & hotel operations, and recent booking appointments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {headerActions}
          <button
            type="button"
            className="btn-action view"
            onClick={fetchStats}
            disabled={loading}
            title="Refresh dashboard"
            style={{
              width: 42,
              height: 42,
              padding: 0,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #eeddc8',
              backgroundColor: '#ffffff',
              color: '#785839',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ReloadOutlined spin={loading} style={{ fontSize: 14 }} />
          </button>
        </div>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} showIcon closable onClose={() => setErrorMsg(null)} />}

      <Spin spinning={loading}>
        {stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #eeddc8',
                    boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
                    height: '100%',
                    transition: 'all 0.2s ease',
                  }}
                  styles={{ body: { padding: '20px 22px' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8c735f' }}>
                      TODAY'S REVENUE
                    </div>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        backgroundColor: '#faf6f0',
                        border: '1px solid #eeddc8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#785839',
                        fontSize: 16,
                      }}
                    >
                      <DollarOutlined />
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '1.85rem',
                      fontWeight: 700,
                      color: '#3d2d23',
                      margin: '8px 0 6px',
                      lineHeight: 1.2,
                    }}
                  >
                    {vnd.format(stats.revenue.todayRevenue)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#8c735f', borderTop: '1px dashed #eeddc8', paddingTop: 8, marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>This Month:</span>
                      <strong style={{ color: '#3d2d23' }}>{vnd.format(stats.revenue.thisMonthRevenue)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Revenue:</span>
                      <strong style={{ color: '#3d2d23' }}>{vnd.format(stats.revenue.totalRevenue)}</strong>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #eeddc8',
                    boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
                    height: '100%',
                    transition: 'all 0.2s ease',
                  }}
                  styles={{ body: { padding: '20px 22px' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8c735f' }}>
                      BOOKING APPOINTMENTS
                    </div>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        backgroundColor: '#faf6f0',
                        border: '1px solid #eeddc8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#785839',
                        fontSize: 16,
                      }}
                    >
                      <CalendarOutlined />
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '1.85rem',
                      fontWeight: 700,
                      color: '#3d2d23',
                      margin: '8px 0 6px',
                      lineHeight: 1.2,
                    }}
                  >
                    {stats.bookings.todayBookings}{' '}
                    <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)', color: '#8c735f' }}>
                      today ({stats.bookings.totalBookings} total)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, borderTop: '1px dashed #eeddc8', paddingTop: 8 }}>
                    <span
                      style={{
                        padding: '2px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                      }}
                    >
                      Pending: {stats.bookings.pendingBookings}
                    </span>
                    <span
                      style={{
                        padding: '2px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: '#f0f9ff',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                      }}
                    >
                      Confirmed: {stats.bookings.confirmedBookings}
                    </span>
                    <span
                      style={{
                        padding: '2px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                      }}
                    >
                      Done: {stats.bookings.completedBookings}
                    </span>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #eeddc8',
                    boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
                    height: '100%',
                    transition: 'all 0.2s ease',
                  }}
                  styles={{ body: { padding: '20px 22px' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8c735f' }}>
                      HOTEL OCCUPANCY
                    </div>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        backgroundColor: '#faf6f0',
                        border: '1px solid #eeddc8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#785839',
                        fontSize: 16,
                      }}
                    >
                      <HomeOutlined />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 6px' }}>
                    <span
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '1.85rem',
                        fontWeight: 700,
                        color: '#3d2d23',
                        lineHeight: 1.2,
                      }}
                    >
                      {stats.rooms.occupancyRate.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: 12, color: '#8c735f' }}>
                      ({stats.rooms.occupiedRooms} / {stats.rooms.totalRooms} rooms)
                    </span>
                  </div>
                  <Progress
                    percent={Math.min(100, Math.round(stats.rooms.occupancyRate))}
                    showInfo={false}
                    strokeColor="#785839"
                    trailColor="#f5ede3"
                    size="small"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8c735f', marginTop: 10, borderTop: '1px dashed #eeddc8', paddingTop: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                      {stats.rooms.availableRooms} Available
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <ToolOutlined style={{ color: '#d97706' }} />
                      {stats.rooms.maintenanceRooms} Maintenance
                    </span>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #eeddc8',
                    boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
                    height: '100%',
                    transition: 'all 0.2s ease',
                  }}
                  styles={{ body: { padding: '20px 22px' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8c735f' }}>
                      TODAY'S OPERATIONS
                    </div>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        backgroundColor: '#faf6f0',
                        border: '1px solid #eeddc8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#785839',
                        fontSize: 16,
                      }}
                    >
                      <ShopOutlined />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '8px 0 6px' }}>
                    <div style={{ background: '#faf6f0', border: '1px solid #eeddc8', padding: '6px 10px', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#8c735f', fontWeight: 600 }}>Check-ins</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#3d2d23', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <LoginOutlined style={{ color: '#047857' }} />{stats.operations.todayCheckIns}
                      </div>
                    </div>
                    <div style={{ background: '#faf6f0', border: '1px solid #eeddc8', padding: '6px 10px', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#8c735f', fontWeight: 600 }}>Check-outs</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#3d2d23', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <LogoutOutlined style={{ color: '#0369a1' }} />{stats.operations.todayCheckOuts}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#8c735f', borderTop: '1px dashed #eeddc8', paddingTop: 8, marginTop: 6 }}>
                    Boarding guests now:{' '}
                    <strong style={{ color: '#785839' }}>
                      {stats.operations.activeBoardingGuests} pets
                    </strong>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <Card
                  style={{
                    borderRadius: 16,
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #eeddc8',
                    boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
                  }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3d2d23', fontWeight: 700 }}>
                      <ScissorOutlined style={{ color: '#785839' }} />
                      <span>Today's Grooming Salon Progress</span>
                    </div>
                  }
                  extra={
                    <Link
                      to={role === 'admin' ? '/admin/grooming-tasks' : '/staff/grooming-tasks'}
                      style={{ fontSize: 13, fontWeight: 600, color: '#785839' }}
                    >
                      View Tasks Board →
                    </Link>
                  }
                  styles={{ body: { padding: '16px 20px' } }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                    <div
                      style={{
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: 12,
                        padding: '14px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#b45309', fontWeight: 700 }}>
                        ⏳ Pending Start
                      </div>
                      <div
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: 26,
                          fontWeight: 700,
                          color: '#92400e',
                          marginTop: 4,
                        }}
                      >
                        {stats.operations.todayGroomingPending}
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#faf6f0',
                        border: '1.5px solid #eeddc8',
                        borderRadius: 12,
                        padding: '14px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#785839', fontWeight: 700 }}>
                        <ScissorOutlined style={{ marginRight: 4 }} /> In Progress
                      </div>
                      <div
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: 26,
                          fontWeight: 700,
                          color: '#3d2d23',
                          marginTop: 4,
                        }}
                      >
                        {stats.operations.todayGroomingInProgress}
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: 12,
                        padding: '14px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#047857', fontWeight: 700 }}>
                        <CheckCircleOutlined style={{ marginRight: 4 }} /> Completed Tasks
                      </div>
                      <div
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: 26,
                          fontWeight: 700,
                          color: '#065f46',
                          marginTop: 4,
                        }}
                      >
                        {stats.operations.todayGroomingCompleted}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card
                  style={{
                    borderRadius: 16,
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #eeddc8',
                    boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
                  }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3d2d23', fontWeight: 700 }}>
                      <UserOutlined style={{ color: '#785839' }} />
                      <span>Clients & Pets Database</span>
                    </div>
                  }
                  styles={{ body: { padding: '16px 20px' } }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, color: '#6b5a4e' }}>Registered Customers</span>
                      <span
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#3d2d23',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <TeamOutlined style={{ color: '#785839', fontSize: 18 }} />
                        {stats.customers.totalCustomers}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, color: '#6b5a4e' }}>Active Registered Pets</span>
                      <span
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#785839',
                        }}
                      >
                        {stats.customers.totalPets}
                      </span>
                    </div>
                    <div style={{ borderTop: '1px dashed #eeddc8', paddingTop: 8, fontSize: 12, color: '#8c735f' }}>
                      Managed via PetCare Booking & Sanctuary System
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card
              style={{
                borderRadius: 16,
                backgroundColor: '#ffffff',
                border: '1.5px solid #eeddc8',
                boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3d2d23', fontWeight: 700 }}>
                  <DollarOutlined style={{ color: '#785839' }} />
                  <span>7-Day Revenue & Appointments Trend</span>
                </div>
              }
              styles={{ body: { padding: '20px 24px' } }}
            >
              {stats.revenueTrend && stats.revenueTrend.length > 0 ? (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${stats.revenueTrend.length}, 1fr)`,
                      gap: 16,
                      alignItems: 'flex-end',
                      height: 200,
                      paddingBottom: 24,
                      borderBottom: '2px solid #eeddc8',
                    }}
                  >
                    {stats.revenueTrend.map((day, idx) => {
                      const revenueNum = Number(day.revenue) || 0
                      const heightPercent = Math.max(8, Math.round((revenueNum / maxRevenue) * 100))

                      return (
                        <div
                          key={day.date || idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#785839', marginBottom: 6 }}>
                            {revenueNum > 0 ? (revenueNum >= 1000000 ? `${(revenueNum / 1000000).toFixed(1)}M` : `${Math.round(revenueNum / 1000)}k`) : '0'}
                          </div>

                          <Tooltip
                            title={
                              <div>
                                <div><strong>Date:</strong> {day.date}</div>
                                <div><strong>Revenue:</strong> {vnd.format(revenueNum)}</div>
                                <div><strong>Bookings:</strong> {day.bookingCount} orders</div>
                              </div>
                            }
                          >
                            <div
                              style={{
                                width: '100%',
                                maxWidth: 44,
                                height: `${heightPercent}%`,
                                background: 'linear-gradient(180deg, #c69f7b 0%, #785839 100%)',
                                borderRadius: '6px 6px 0 0',
                                transition: 'height 0.3s ease',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                paddingTop: 4,
                                boxShadow: '0 2px 6px rgba(120,88,57,0.18)',
                              }}
                            >
                              {day.bookingCount > 0 && (
                                <span style={{ color: '#ffffff', fontSize: 10, fontWeight: 700 }}>
                                  {day.bookingCount}
                                </span>
                              )}
                            </div>
                          </Tooltip>

                          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b5a4e', marginTop: 8 }}>
                            {day.dateLabel || day.date}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 12, color: '#8c735f' }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, background: 'linear-gradient(180deg, #c69f7b 0%, #785839 100%)', borderRadius: 3 }}></span>
                        Daily Revenue (VND)
                      </span>
                      <span>Number badge indicates daily booking volume</span>
                    </div>
                    <div>Max peak: <strong style={{ color: '#3d2d23' }}>{vnd.format(maxRevenue)}</strong></div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#8c735f' }}>
                  No revenue history recorded in the last 7 days.
                </div>
              )}
            </Card>

            <Card
              style={{
                borderRadius: 16,
                backgroundColor: '#ffffff',
                border: '1.5px solid #eeddc8',
                boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3d2d23', fontWeight: 700 }}>
                    <ShopOutlined style={{ color: '#785839' }} />
                    <span>Recent Bookings & Appointments</span>
                  </div>
                  <Link to={bookingsPath} style={{ fontSize: 13, fontWeight: 600, color: '#785839' }}>
                    Manage all bookings →
                  </Link>
                </div>
              }
              styles={{ body: { padding: '0' } }}
            >
              <Table
                dataSource={stats.recentBookings || []}
                columns={recentBookingColumns}
                rowKey="id"
                pagination={false}
                size="middle"
                scroll={{ x: 800 }}
              />
            </Card>
          </div>
        )}
      </Spin>

      <BookingDetailModal
        open={Boolean(detailBookingId)}
        bookingId={detailBookingId}
        onClose={() => setDetailBookingId(null)}
        onOpenCheckout={(id) => setCheckoutBookingId(id)}
      />

      <CheckoutBookingModal
        open={Boolean(checkoutBookingId)}
        bookingId={checkoutBookingId}
        onClose={() => setCheckoutBookingId(null)}
        onSuccess={() => fetchStats()}
      />
    </div>
  )
}

export default OperationsDashboard
