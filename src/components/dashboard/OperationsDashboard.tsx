import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Button,
  Table,
  Spin,
  Alert,
  Typography,
  Space,
  Tooltip,
} from 'antd'
import {
  DollarOutlined,
  CalendarOutlined,
  ShopOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseCircleOutlined,
  ToolOutlined,
  LoginOutlined,
  LogoutOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ScissorOutlined,
  HomeOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { dashboardService } from '@/services/dashboard.service'
import type { DashboardStatsResponse, RecentBookingItem } from '@/types/dashboard.types'
import BookingDetailModal from '@/components/admin/BookingDetailModal'
import CheckoutBookingModal from '@/components/admin/CheckoutBookingModal'

const { Title, Text } = Typography
const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

interface OperationsDashboardProps {
  role: 'admin' | 'staff'
  headerActions?: React.ReactNode
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({ role, headerActions }) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Modals
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

  // Calculate highest revenue for chart scaling
  const maxRevenue = Math.max(
    ...(stats?.revenueTrend?.map((item) => Number(item.revenue)) || [1]),
    1000000
  )

  const getStatusBadge = (status: number | string) => {
    const s = Number(status)
    if (s === 0 || status === 'Pending') {
      return (
        <Tag icon={<ClockCircleOutlined />} color="warning">
          Pending
        </Tag>
      )
    }
    if (s === 1 || status === 'Confirmed') {
      return (
        <Tag icon={<CheckCircleOutlined />} color="blue">
          Confirmed
        </Tag>
      )
    }
    if (s === 2 || status === 'Completed') {
      return (
        <Tag icon={<CheckCircleFilled />} color="success">
          Completed
        </Tag>
      )
    }
    if (s === 3 || status === 'Cancelled') {
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          Cancelled
        </Tag>
      )
    }
    return <Tag>{status}</Tag>
  }

  const recentBookingColumns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_: any, record: RecentBookingItem) => (
        <div>
          <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
            {record.customerName || 'Guest'}
          </Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            <a href={`tel:${record.customerPhone}`} style={{ color: '#059669' }}>
              {record.customerPhone}
            </a>
          </div>
        </div>
      ),
    },
    {
      title: 'Pets',
      dataIndex: 'petNames',
      key: 'petNames',
      render: (pets: string[]) => (
        <Space size={4} wrap>
          {pets && pets.length > 0 ? (
            pets.map((p, idx) => (
              <Tag key={idx} color="purple" style={{ margin: 0, fontSize: 11 }}>
                {p}
              </Tag>
            ))
          ) : (
            <span style={{ color: '#94a3b8' }}>—</span>
          )}
        </Space>
      ),
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      align: 'right' as const,
      render: (price: number) => <Text strong style={{ color: '#059669' }}>{vnd.format(price)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st: any) => getStatusBadge(st),
    },
    {
      title: 'Booked At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dateStr: string) => (
        <span style={{ fontSize: 11, color: '#64748b' }}>
          {dateStr ? dayjs(dateStr).format('DD/MM HH:mm') : '—'}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: RecentBookingItem) => {
        const isConfirmed = Number(record.status) === 1 || record.status === 'Confirmed'
        return (
          <Space size={4}>
            {isConfirmed && (
              <Button
                type="primary"
                size="small"
                onClick={() => setCheckoutBookingId(String(record.id))}
                style={{
                  backgroundColor: '#059669',
                  borderColor: '#059669',
                  fontSize: 11,
                  borderRadius: 6,
                }}
              >
                Check-out
              </Button>
            )}
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDetailBookingId(String(record.id))}
              style={{ fontSize: 11, borderRadius: 6 }}
            >
              View
            </Button>
          </Space>
        )
      },
    },
  ]

  const bookingsPath = role === 'admin' ? '/admin/bookings' : '/staff/bookings'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header bar */}
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#0f172a' }}>
            {role === 'admin' ? 'Executive Dashboard' : 'Front Desk & Operations Dashboard'}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Real-time business performance, salon & hotel operations, and recent booking appointments.
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button icon={<ReloadOutlined />} onClick={fetchStats} loading={loading} style={{ borderRadius: 8 }}>
            Refresh
          </Button>
          {headerActions}
        </div>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} showIcon closable onClose={() => setErrorMsg(null)} />}

      <Spin spinning={loading}>
        {stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Row 1: Primary Metrics Cards */}
            <Row gutter={[16, 16]}>
              {/* Revenue Card */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #059669',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '1.25rem' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                      TODAY'S REVENUE
                    </Text>
                    <DollarOutlined style={{ fontSize: 20, color: '#059669' }} />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', margin: '6px 0' }}>
                    {vnd.format(stats.revenue.todayRevenue)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, color: '#64748b' }}>
                    <div>
                      This Month: <Text strong>{vnd.format(stats.revenue.thisMonthRevenue)}</Text>
                    </div>
                    <div>
                      Total Revenue: <Text strong>{vnd.format(stats.revenue.totalRevenue)}</Text>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Bookings Card */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #2563eb',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '1.25rem' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                      BOOKING APPOINTMENTS
                    </Text>
                    <CalendarOutlined style={{ fontSize: 20, color: '#2563eb' }} />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b', margin: '6px 0' }}>
                    {stats.bookings.todayBookings}{' '}
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>
                      today ({stats.bookings.totalBookings} total)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    <Tag color="warning" style={{ margin: 0, fontSize: 11 }}>
                      Pending: {stats.bookings.pendingBookings}
                    </Tag>
                    <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                      Confirmed: {stats.bookings.confirmedBookings}
                    </Tag>
                    <Tag color="success" style={{ margin: 0, fontSize: 11 }}>
                      Done: {stats.bookings.completedBookings}
                    </Tag>
                  </div>
                </Card>
              </Col>

              {/* Hotel Occupancy Card */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #d97706',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '1.25rem' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                      HOTEL OCCUPANCY
                    </Text>
                    <HomeOutlined style={{ fontSize: 20, color: '#d97706' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '6px 0' }}>
                    <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d97706' }}>
                      {stats.rooms.occupancyRate.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      ({stats.rooms.occupiedRooms} / {stats.rooms.totalRooms} rooms)
                    </span>
                  </div>
                  <Progress
                    percent={Math.min(100, Math.round(stats.rooms.occupancyRate))}
                    showInfo={false}
                    strokeColor="#d97706"
                    trailColor="#fde68a"
                    size="small"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 6 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span> {stats.rooms.availableRooms} Available</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ToolOutlined style={{ color: "#d97706" }} /> {stats.rooms.maintenanceRooms} Maintenance</span>
                  </div>
                </Card>
              </Col>

              {/* Today's Salon & Hotel Operations */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #7c3aed',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '1.25rem' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                      TODAY'S OPERATIONS
                    </Text>
                    <ShopOutlined style={{ fontSize: 20, color: '#7c3aed' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '10px 0 6px' }}>
                    <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Check-ins</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                        <LoginOutlined style={{ marginRight: 4, color: "#059669" }} />{stats.operations.todayCheckIns}
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Check-outs</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>
                        <LogoutOutlined style={{ marginRight: 4, color: "#2563eb" }} />{stats.operations.todayCheckOuts}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Boarding guests now:{' '}
                    <Text strong style={{ color: '#7c3aed' }}>
                      {stats.operations.activeBoardingGuests} pets
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Row 2: Grooming Workflow Status & Demographics */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <Card
                  style={{
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ScissorOutlined style={{ color: '#059669' }} />
                      <span>Today's Grooming Salon Progress</span>
                    </div>
                  }
                  extra={
                    <Link to={role === 'admin' ? '/admin/grooming-tasks' : '/staff/grooming-tasks'} style={{ fontSize: 13, fontWeight: 600 }}>
                      View Tasks Board →
                    </Link>
                  }
                  styles={{ body: { padding: '16px 20px' } }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                    <div
                      style={{
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: 10,
                        padding: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>
                        ⏳ Pending Start
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#92400e', marginTop: 4 }}>
                        {stats.operations.todayGroomingPending}
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        borderRadius: 10,
                        padding: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 600 }}>
                        <ScissorOutlined style={{ marginRight: 4 }} /> In Progress
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#075985', marginTop: 4 }}>
                        {stats.operations.todayGroomingInProgress}
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: 10,
                        padding: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>
                        <CheckCircleOutlined style={{ marginRight: 4 }} /> Completed Tasks
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46', marginTop: 4 }}>
                        {stats.operations.todayGroomingCompleted}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card
                  style={{
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserOutlined style={{ color: '#2563eb' }} />
                      <span>Clients & Pets Database</span>
                    </div>
                  }
                  styles={{ body: { padding: '16px 20px' } }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, color: '#475569' }}>Registered Customers</span>
                      <Text strong style={{ fontSize: 18, color: '#0f172a' }}>
                        <TeamOutlined style={{ marginRight: 6, color: "#2563eb" }} />{stats.customers.totalCustomers}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, color: '#475569' }}>Active Registered Pets</span>
                      <Text strong style={{ fontSize: 18, color: '#059669' }}>
                        <span style={{ fontWeight: 700 }}>{stats.customers.totalPets}</span>
                      </Text>
                    </div>
                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 8, fontSize: 12, color: '#64748b' }}>
                      Managed via PawStay Pet Care System
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Row 3: 7-Day Revenue Trend Chart */}
            <Card
              style={{
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarOutlined style={{ color: '#059669' }} />
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
                      borderBottom: '2px solid #e2e8f0',
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
                          {/* Tooltip text on top */}
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#059669', marginBottom: 6 }}>
                            {revenueNum > 0 ? (revenueNum >= 1000000 ? `${(revenueNum / 1000000).toFixed(1)}M` : `${Math.round(revenueNum / 1000)}k`) : '0'}
                          </div>

                          {/* Bar */}
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
                                background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                                borderRadius: '6px 6px 0 0',
                                transition: 'height 0.3s ease',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                paddingTop: 4,
                              }}
                            >
                              {day.bookingCount > 0 && (
                                <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>
                                  {day.bookingCount}
                                </span>
                              )}
                            </div>
                          </Tooltip>

                          {/* Date Label */}
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 8 }}>
                            {day.dateLabel || day.date}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12, color: '#64748b' }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, background: '#059669', borderRadius: 2 }}></span>
                        Daily Revenue (VND)
                      </span>
                      <span>Number badge indicates daily booking volume</span>
                    </div>
                    <div>Max peak: {vnd.format(maxRevenue)}</div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No revenue history recorded in the last 7 days.
                </div>
              )}
            </Card>

            {/* Row 4: Top 5 Recent Bookings Table */}
            <Card
              style={{
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShopOutlined style={{ color: '#059669' }} />
                    <span>Recent Bookings & Appointments</span>
                  </div>
                  <Link to={bookingsPath} style={{ fontSize: 13, fontWeight: 600 }}>
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
              />
            </Card>
          </div>
        )}
      </Spin>

      {/* Detail Modal */}
      <BookingDetailModal
        open={Boolean(detailBookingId)}
        bookingId={detailBookingId}
        onClose={() => setDetailBookingId(null)}
        onOpenCheckout={(id) => setCheckoutBookingId(id)}
      />

      {/* Check-out Modal */}
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
