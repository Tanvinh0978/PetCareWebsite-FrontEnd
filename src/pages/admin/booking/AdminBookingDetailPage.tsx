import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  Spin,
  Table,
  Tag,
  Button,
  Typography,
  Alert,
  Select,
  Space,
  Tooltip,
  message,
  Popconfirm,
  Input,
  Image,
  Modal,
} from 'antd'
import {
  CheckCircleOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  SyncOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ShopOutlined,
  SaveOutlined,
  DollarCircleOutlined,
  PrinterOutlined,
  StopOutlined,
  CloseOutlined,
  CloseCircleOutlined,
  CameraOutlined,
  CalendarOutlined,
  LeftOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import {
  bookingService,
  type BookingDetail,
  type BookingDetailItem,
} from '@/services/booking.service'
import { staffService } from '@/services/staff.service'
import type { StaffDTO } from '@/types/staff.types'
import { roomService, type RoomDTO } from '@/services/room.service'
import { ReceiptModal } from '@/components/admin/ReceiptModal'
import CheckoutBookingModal from '@/components/admin/CheckoutBookingModal'
import { BookingStatusBadge } from '@/components/common/PetIcons'
import { useAuthStore } from '@/store/useAuthStore'
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper'

const { Title, Text } = Typography
const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

interface AdminBookingDetailPageProps {
  backTo?: string
}

export const AdminBookingDetailPage: React.FC<AdminBookingDetailPageProps> = ({ backTo }) => {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isStaff = location.pathname.startsWith('/staff')
  const resolvedBackTo = backTo || (isStaff ? '/staff/bookings' : '/admin/bookings')

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Staff and Room options for assignment
  const [staffList, setStaffList] = useState<StaffDTO[]>([])
  const [roomList, setRoomList] = useState<RoomDTO[]>([])

  // Local assignment state per item: itemId -> { staffId?: string; roomId?: string }
  const [assignments, setAssignments] = useState<Record<string, { staffId?: string; roomId?: string }>>({})
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [noShowLoading, setNoShowLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  const currentUser = useAuthStore((s) => s.user)
  const canCheckInPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_CHECKIN)
  const canCancelPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_CANCEL)
  const canAssignPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_ASSIGN_STAFF)

  // Load booking details & staff/room options
  const loadData = useCallback(async (bookingId: string) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const [bookingData, staffRes, roomRes] = await Promise.all([
        bookingService.fetchById(bookingId),
        staffService.fetchWithPagination({ pageSize: 100 }).catch(() => ({ items: [] })),
        roomService.fetchWithPagination({ pageSize: 100 }).catch(() => ({ result: { items: [] } })),
      ])

      setDetail(bookingData)

      // Initialize assignments from existing booking items
      const initialMap: Record<string, { staffId?: string; roomId?: string }> = {}
      if (bookingData?.bookingItems) {
        for (const item of bookingData.bookingItems) {
          initialMap[item.id] = {
            staffId: item.staffId || undefined,
            roomId: item.roomId || undefined,
          }
        }
      }
      setAssignments(initialMap)

      // Unpack staff list
      const staffs = staffRes?.items || []
      setStaffList(staffs)

      // Unpack room list
      const rawRoom: any = roomRes
      const rooms: RoomDTO[] = rawRoom?.result?.items || rawRoom?.data?.items || rawRoom?.items || []
      setRoomList(rooms)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load booking details.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (id) {
      void loadData(id)
    }
  }, [id, loadData])

  const handleAssignmentChange = (
    itemId: string,
    field: 'staffId' | 'roomId',
    value?: string
  ) => {
    setAssignments((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }))
  }

  const handleSaveAssignment = async (item: BookingDetailItem) => {
    if (!id) return
    const currentAssignment = assignments[item.id]
    if (!currentAssignment) return

    setSavingItemId(item.id)
    try {
      await bookingService.assignItem(id, item.id, {
        staffId: currentAssignment.staffId,
        roomId: currentAssignment.roomId,
      })
      message.success(`Updated assignment for ${item.serviceName} successfully!`)
      await loadData(id)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to assign staff/room.'
      message.error(msg)
    } finally {
      setSavingItemId(null)
    }
  }

  const handleConfirmBooking = async () => {
    if (!id) return
    setConfirmLoading(true)
    try {
      await bookingService.updateBookingStatus(id, { status: 1 })
      message.success('Booking confirmed successfully! You can now assign staff and rooms.')
      await loadData(id)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to confirm booking.'
      message.error(msg)
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!id) return
    setCheckInLoading(true)
    try {
      await bookingService.checkIn(id)
      message.success('Pet checked in successfully! Tasks are now active for staff.')
      await loadData(id)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to check in pet.'
      message.error(msg)
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleNoShow = async () => {
    if (!id) return
    setNoShowLoading(true)
    try {
      await bookingService.markNoShow(id)
      message.success('Marked as No-Show. Scheduled room and staff resources released.')
      await loadData(id)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to mark as No-Show.'
      message.error(msg)
    } finally {
      setNoShowLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!id) return
    setCancelLoading(true)
    try {
      await bookingService.cancelBooking(id, cancellationReason.trim() || 'Customer requested cancellation')
      message.success('Booking has been successfully cancelled.')
      setCancelModalOpen(false)
      setCancellationReason('')
      await loadData(id)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to cancel booking.'
      message.error(msg)
    } finally {
      setCancelLoading(false)
    }
  }

  // Filter staff: Exclude Admin, must match service department (Boarding vs Grooming)
  const getFilteredStaffOptions = (item: BookingDetailItem) => {
    const isBoarding =
      item.serviceType === 1 ||
      String(item.serviceType).toLowerCase() === 'boarding' ||
      (item.serviceName && item.serviceName.toLowerCase().includes('boarding'))

    const targetRoleKeyword = isBoarding ? 'boarding' : 'grooming'

    const eligibleStaffs = staffList.filter((s) => {
      const roles = s.roles || []
      const isAdmin = roles.some((r) => r.toLowerCase() === 'admin')
      if (isAdmin) return false

      const hasMatchingRole = roles.some((r) => r.toLowerCase().includes(targetRoleKeyword))
      const isActive = s.status === 'Active' || (s.status as any) === 0

      return isActive && hasMatchingRole
    })

    const currentStaffId =
      assignments[item.id]?.staffId !== undefined ? assignments[item.id].staffId : item.staffId || undefined

    if (currentStaffId && !eligibleStaffs.some((s) => s.id === currentStaffId)) {
      const existingStaff = staffList.find((s) => s.id === currentStaffId)
      if (existingStaff) {
        eligibleStaffs.unshift(existingStaff)
      }
    }

    return eligibleStaffs.map((s) => ({
      value: s.id,
      label: `${s.fullName} (${s.roles?.join(', ') || (isBoarding ? 'Boarding Staff' : 'Grooming Staff')})`,
    }))
  }

  const isConfirmed = detail?.status === 1 || String(detail?.status).toLowerCase() === 'confirmed'
  const isCompleted = detail?.status === 2 || String(detail?.status).toLowerCase() === 'completed'
  const isCancelled = detail?.status === 3 || String(detail?.status).toLowerCase() === 'cancelled'
  const isNoShow = Boolean(
    detail?.status === 4 ||
    String(detail?.status).toLowerCase() === 'no_show' ||
    String(detail?.status).toLowerCase() === 'no-show' ||
    (detail?.cancellationReason && detail.cancellationReason.toLowerCase().includes('no-show'))
  )
  const isPending = detail?.status === 0 || String(detail?.status).toLowerCase() === 'pending'
  const isReadOnly = Boolean(isCompleted || isCancelled || isNoShow)

  // Check if all active items are completed
  const allItemsCompleted =
    Boolean(detail?.bookingItems &&
    detail.bookingItems.length > 0 &&
    detail.bookingItems.every((bi) => {
      const s = String(bi.status).toLowerCase()
      return s === '4' || s === 'completed' || s === '5' || s === 'cancelled' || s === '6' || s === 'no_show'
    }))

  // Check if all items are fully assigned
  const isFullyAssigned = Boolean(
    detail?.bookingItems &&
    detail.bookingItems.length > 0 &&
    detail.bookingItems.every((item) => {
      const isBoarding =
        item.serviceType === 1 ||
        String(item.serviceType).toLowerCase() === 'boarding' ||
        (item.serviceName && item.serviceName.toLowerCase().includes('boarding'))
      const isDiet =
        item.serviceType === 2 ||
        String(item.serviceType).toLowerCase() === 'diet' ||
        (item.serviceName && item.serviceName.toLowerCase().includes('diet'))
      if (isDiet) return true
      if (isBoarding) return Boolean(item.staffId) && Boolean(item.roomId)
      return Boolean(item.staffId)
    })
  )

  // Check if there are items eligible to check in
  const hasEligibleCheckInItems = Boolean(
    detail?.bookingItems?.some((bi) => {
      const s = String(bi.status).toLowerCase()
      return s === '0' || s === 'pending' || s === '1' || s === 'confirmed'
    })
  )

  // Check-in requires Confirmed status AND full assignment
  const canCheckIn = isConfirmed && isFullyAssigned && hasEligibleCheckInItems

  const getItemStatusTag = (status: number | string) => {
    const s = String(status).toLowerCase()
    if (s === '0' || s === 'pending') {
      return (
        <span className="status-pill inactive" style={{ fontSize: '12px', padding: '3px 10px' }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} /> Pending
        </span>
      )
    }
    if (s === '1' || s === 'confirmed') {
      return (
        <span className="status-pill active" style={{ fontSize: '12px', padding: '3px 10px', background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
          <CheckCircleOutlined style={{ marginRight: 4 }} /> Confirmed
        </span>
      )
    }
    if (s === '2' || s === 'checked_in' || s === 'checkedin') {
      return (
        <span className="status-pill" style={{ fontSize: '12px', padding: '3px 10px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
          <CheckCircleOutlined style={{ marginRight: 4 }} /> Checked In
        </span>
      )
    }
    if (s === '3' || s === 'in_progress' || s === 'inprogress') {
      return (
        <span className="status-pill" style={{ fontSize: '12px', padding: '3px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
          <SyncOutlined spin style={{ marginRight: 4 }} /> In Progress
        </span>
      )
    }
    if (s === '4' || s === 'completed') {
      return (
        <span className="status-pill active" style={{ fontSize: '12px', padding: '3px 10px' }}>
          <CheckCircleFilled style={{ marginRight: 4 }} /> Completed
        </span>
      )
    }
    if (s === '5' || s === 'cancelled') {
      return (
        <span className="status-pill" style={{ fontSize: '12px', padding: '3px 10px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          <CloseCircleOutlined style={{ marginRight: 4 }} /> Cancelled
        </span>
      )
    }
    if (s === '6' || s === 'no_show' || s === 'noshow') {
      return (
        <span className="status-pill" style={{ fontSize: '12px', padding: '3px 10px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
          <StopOutlined style={{ marginRight: 4 }} /> No-Show
        </span>
      )
    }
    return <Tag>{status}</Tag>
  }

  const columns = [
    {
      title: 'PET',
      dataIndex: 'petName',
      key: 'petName',
      width: 150,
      render: (text: string, r: BookingDetailItem) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '14px' }}>{text}</div>
          <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: 2 }}>{r.petWeight} kg</div>
        </div>
      ),
    },
    {
      title: 'SCHEDULED TIME',
      key: 'itemScheduledTime',
      width: 200,
      render: (_: any, r: BookingDetailItem) => {
        const start = r.scheduledStartAt ? dayjs(r.scheduledStartAt).format('DD/MM/YYYY HH:mm') : '—';
        const end = r.scheduledEndAt ? dayjs(r.scheduledEndAt).format('DD/MM/YYYY HH:mm') : null;
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--slate-800)', fontSize: '13px' }}>
              <CalendarOutlined style={{ marginRight: 6, color: 'var(--secondary)' }} />
              {start}
            </div>
            {end && (
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: 2 }}>
                → Out: {end}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'SERVICE & ROOM ASSIGNMENT',
      key: 'serviceAndRoom',
      width: 280,
      render: (_: any, r: BookingDetailItem) => {
        const isBoarding =
          r.serviceType === 1 ||
          String(r.serviceType).toLowerCase() === 'boarding' ||
          (r.serviceName && r.serviceName.toLowerCase().includes('boarding'))
        const isDiet =
          r.serviceType === 2 ||
          String(r.serviceType).toLowerCase() === 'diet' ||
          (r.serviceName && r.serviceName.toLowerCase().includes('diet'))

        const currentRoomId =
          assignments[r.id]?.roomId !== undefined ? assignments[r.id].roomId : r.roomId || undefined

        return (
          <div>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '13.5px' }}>{r.serviceName}</div>

            {isBoarding && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>
                  <ShopOutlined /> Assigned Room:
                </div>
                <Select
                  size="small"
                  placeholder="Select room for boarding"
                  style={{ width: '100%', borderRadius: 6 }}
                  disabled={isReadOnly || !canAssignPerm}
                  value={currentRoomId}
                  onChange={(val) => handleAssignmentChange(r.id, 'roomId', val)}
                  allowClear
                  options={roomList.map((room) => ({
                    value: room.id,
                    label: `${room.roomName} (${room.roomTypeName || room.status})`,
                  }))}
                />
              </div>
            )}

            {isDiet && (
              <Tag color="cyan" style={{ fontSize: 11, marginTop: 6, borderRadius: 6 }}>
                <ShopOutlined /> Shared with Boarding Room
              </Tag>
            )}

            {!isBoarding && !isDiet && (
              <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: 4 }}>
                Facility: Salon Grooming Station
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: 'ASSIGNED STAFF',
      key: 'staffAssignment',
      width: 250,
      render: (_: any, r: BookingDetailItem) => {
        const isDiet =
          r.serviceType === 2 ||
          String(r.serviceType).toLowerCase() === 'diet' ||
          (r.serviceName && r.serviceName.toLowerCase().includes('diet'))

        if (isDiet) {
          return (
            <Tag color="blue" style={{ fontSize: 11, borderRadius: 6 }}>
              <UserOutlined /> Sync with Boarding Staff
            </Tag>
          )
        }

        const currentStaffId =
          assignments[r.id]?.staffId !== undefined ? assignments[r.id].staffId : r.staffId || undefined

        const isBoarding =
          r.serviceType === 1 ||
          String(r.serviceType).toLowerCase() === 'boarding' ||
          (r.serviceName && r.serviceName.toLowerCase().includes('boarding'))

        const isStaffDisabled = isReadOnly || !isConfirmed
        const filteredOptions = getFilteredStaffOptions(r)
        const placeholder = !isConfirmed
          ? 'Available after Confirmation'
          : (isBoarding ? 'Select Boarding Staff' : 'Select Grooming Staff')

        return (
          <div>
            <Select
              size="small"
              placeholder={placeholder}
              style={{ width: '100%', borderRadius: 6 }}
              disabled={isStaffDisabled || !canAssignPerm}
              value={currentStaffId}
              onChange={(val) => handleAssignmentChange(r.id, 'staffId', val)}
              allowClear
              options={filteredOptions}
            />
          </div>
        )
      },
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (st: any) => getItemStatusTag(st),
    },
    {
      title: 'PRICE',
      dataIndex: 'assignedPrice',
      key: 'assignedPrice',
      width: 130,
      align: 'right' as const,
      render: (p: number) => (
        <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '14px' }}>
          {vnd.format(p)}
        </span>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'itemAction',
      width: 100,
      align: 'center' as const,
      render: (_: any, r: BookingDetailItem) => {
        const isDiet =
          r.serviceType === 2 ||
          String(r.serviceType).toLowerCase() === 'diet' ||
          (r.serviceName && r.serviceName.toLowerCase().includes('diet'))

        if (isDiet || isReadOnly) return null

        const current = assignments[r.id]
        const hasChanged =
          current &&
          (current.staffId !== (r.staffId || undefined) || current.roomId !== (r.roomId || undefined))

        const canSave = hasChanged && isConfirmed

        return (
          <button
            type="button"
            className="btn-action edit"
            disabled={!canSave || !canAssignPerm || savingItemId === r.id}
            onClick={() => handleSaveAssignment(r)}
            style={{
              opacity: canSave && canAssignPerm ? 1 : 0.45,
              cursor: canSave && canAssignPerm ? 'pointer' : 'not-allowed',
              padding: '0.35rem 0.75rem',
            }}
            title="Save staff/room assignment"
          >
            <SaveOutlined style={{ fontSize: 13 }} />
            {savingItemId === r.id ? 'Saving...' : 'Save'}
          </button>
        )
      },
    },
  ]

  if (loading) {
    return (
      <section className="page wide">
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Spin size="large" />
          <p style={{ marginTop: '1rem', color: 'var(--slate-600)', fontWeight: 500 }}>
            Loading booking details...
          </p>
        </div>
      </section>
    )
  }

  if (errorMsg || !detail) {
    return (
      <section className="page wide">
        <div style={{ padding: '2rem 0' }}>
          <p className="msg error" role="alert">{errorMsg || 'Booking not found.'}</p>
          <Link to={resolvedBackTo} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            ← Back to bookings
          </Link>
        </div>
      </section>
    )
  }

  const firstItem = detail.bookingItems?.[0]
  const scheduledStart = firstItem?.scheduledStartAt
  const scheduledEnd = firstItem?.scheduledEndAt
  const isBoardingBooking = Boolean(
    detail.bookingItems?.some(
      (i) =>
        i.serviceType === 1 ||
        String(i.serviceType).toLowerCase() === 'boarding' ||
        (i.serviceName && i.serviceName.toLowerCase().includes('boarding'))
    )
  )
  const bookingTypeStr = isBoardingBooking ? 'Boarding Stay' : 'Grooming Appointment'

  return (
    <section className="page wide">
      {/* Page Header */}
      <div className="page-head" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ marginBottom: '0.5rem' }}>
            <Link
              to={resolvedBackTo}
              className="btn-action view"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LeftOutlined style={{ fontSize: 11 }} /> Back to bookings
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>
              Booking #{detail.id.slice(0, 8).toUpperCase()}
            </h1>
            <BookingStatusBadge
              status={detail.status}
              reason={detail.cancellationReason}
              isNoShow={isNoShow}
            />
          </div>
          <p className="page-subtitle" style={{ margin: '0.35rem 0 0 0' }}>
            Customer: <strong style={{ color: 'var(--slate-900)' }}>{detail.customerName}</strong> • Reserved on {dayjs(detail.createdAt).format('DD/MM/YYYY HH:mm')}
          </p>
        </div>

        {/* Action Buttons Top Bar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isPending && (
            <>
              <button
                type="button"
                className="btn-action edit"
                onClick={handleConfirmBooking}
                disabled={confirmLoading}
                style={{ padding: '0.5rem 1.1rem', fontWeight: 600 }}
              >
                <CheckOutlined /> {confirmLoading ? 'Confirming...' : 'Confirm Booking'}
              </button>
              {canCancelPerm && (
                <button
                  type="button"
                  className="btn-action danger"
                  onClick={() => {
                    setCancellationReason('Customer requested cancellation')
                    setCancelModalOpen(true)
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <CloseOutlined /> Cancel
                </button>
              )}
            </>
          )}

          {isConfirmed && hasEligibleCheckInItems && (
            <>
              {canCheckInPerm ? (
                canCheckIn ? (
                  <button
                    type="button"
                    className="btn-action"
                    onClick={handleCheckIn}
                    disabled={checkInLoading}
                    style={{
                      background: '#fef3c7',
                      borderColor: '#fcd34d',
                      color: '#b45309',
                      padding: '0.5rem 1.2rem',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircleOutlined /> {checkInLoading ? 'Checking in...' : 'Check-in'}
                  </button>
                ) : (
                  <Tooltip title="Please assign staff and rooms for all services before Check-in.">
                    <button
                      type="button"
                      className="btn-action"
                      disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed', padding: '0.5rem 1.2rem' }}
                    >
                      <CheckCircleOutlined /> Check-in
                    </button>
                  </Tooltip>
                )
              ) : null}

              {canCancelPerm && (
                <>
                  <button
                    type="button"
                    className="btn-action danger"
                    onClick={() => {
                      setCancellationReason('Customer requested cancellation')
                      setCancelModalOpen(true)
                    }}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    <CloseOutlined /> Cancel
                  </button>

                  <Popconfirm
                    title="Mark customer as No-Show?"
                    description="Customer missed the appointment. Room and staff assignments will be released."
                    okText="Mark No-Show"
                    cancelText="Dismiss"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleNoShow}
                  >
                    <button
                      type="button"
                      className="btn-action"
                      disabled={noShowLoading}
                      style={{
                        borderRadius: 8,
                        color: '#7c3aed',
                        borderColor: '#c4b5fd',
                        backgroundColor: '#f5f3ff',
                        fontWeight: 600,
                        padding: '0.5rem 1rem',
                      }}
                    >
                      <StopOutlined /> No-Show
                    </button>
                  </Popconfirm>
                </>
              )}
            </>
          )}

          {!isReadOnly && (
            allItemsCompleted ? (
              <button
                type="button"
                className="btn-action"
                onClick={() => setCheckoutModalOpen(true)}
                style={{
                  background: '#e0f2fe',
                  borderColor: '#7dd3fc',
                  color: '#0369a1',
                  padding: '0.5rem 1.2rem',
                  fontWeight: 600,
                }}
              >
                <DollarCircleOutlined /> Check-out
              </button>
            ) : (
              <Tooltip title="All service items must be completed by staff before check-out.">
                <button
                  type="button"
                  className="btn-action"
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed', padding: '0.5rem 1.2rem' }}
                >
                  <DollarCircleOutlined /> Check-out
                </button>
              </Tooltip>
            )
          )}

          {isCompleted && (
            <button
              type="button"
              className="btn-action"
              onClick={() => setReceiptOpen(true)}
              style={{
                background: '#faf2e9',
                borderColor: '#eeddc8',
                color: '#785839',
                padding: '0.5rem 1.1rem',
                fontWeight: 600,
              }}
            >
              <PrinterOutlined /> Print Receipt
            </button>
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {isPending && (
        <Alert
          type="warning"
          showIcon
          message="Booking Pending Confirmation"
          description="Staff assignment is available after confirming the booking. Click 'Confirm Booking' above to approve this reservation."
          style={{ marginBottom: 18, borderRadius: 10 }}
        />
      )}

      {isCompleted && (
        <Alert
          type="success"
          showIcon
          message="Booking Completed (Checked-out)"
          description="This booking has been completed, pet returned, and fully settled. Resource assignments are locked."
          style={{ marginBottom: 18, borderRadius: 10 }}
        />
      )}

      {isCancelled && (
        <Alert
          type="error"
          showIcon
          message="Booking Cancelled"
          description={`This booking was cancelled. Reason: ${detail.cancellationReason || 'Per customer request.'}`}
          style={{ marginBottom: 18, borderRadius: 10 }}
        />
      )}

      {isConfirmed && !isFullyAssigned && hasEligibleCheckInItems && (
        <Alert
          type="warning"
          showIcon
          message="Assignment Required Before Check-in"
          description="Please assign staff and rooms for all services in the table below, then click 'Save' on each row before checking in the pet."
          style={{ marginBottom: 18, borderRadius: 10 }}
        />
      )}

      {/* Top 3-Card Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Customer Card */}
        <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '18px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            Customer Information
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', border: '1.5px solid var(--primary-border)' }}>
              {detail.customerName ? detail.customerName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--slate-900)' }}>{detail.customerName}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--slate-500)' }}>
                <PhoneOutlined style={{ marginRight: 5, color: 'var(--secondary)' }} />
                {detail.customerPhone || 'No phone provided'}
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Timing Card */}
        <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '18px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            Scheduled Timing
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarOutlined style={{ color: 'var(--secondary)' }} />
              {scheduledStart ? dayjs(scheduledStart).format('DD/MM/YYYY - HH:mm') : '—'}
            </div>
            {scheduledEnd && (
              <div style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginTop: 4 }}>
                Estimated Out: {dayjs(scheduledEnd).format('DD/MM/YYYY - HH:mm')}
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: 6 }}>
              Booked Type: <strong>{bookingTypeStr}</strong>
            </div>
          </div>
        </div>

        {/* Financials Card */}
        <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '18px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            Financial Settlement
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '13px', color: 'var(--slate-600)' }}>Total Amount:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {vnd.format(detail.totalPrice)}
            </span>
          </div>
          {detail.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--slate-500)' }}>
              <span>Voucher ({detail.voucherCode}):</span>
              <span style={{ color: '#0284c7' }}>-{vnd.format(detail.discountAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: '12.5px' }}>
            <span style={{ color: 'var(--slate-600)' }}>Payment Status:</span>
            <span style={{ fontWeight: 600, color: isCompleted ? '#15803d' : '#b45309' }}>
              {isCompleted ? 'Settled (Paid)' : 'Pending Settlement'}
            </span>
          </div>
        </div>
      </div>

      {/* Items & Resource Assignment Table Card */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'var(--slate-900)' }}>
              Booked Services & Resource Assignments ({detail.bookingItems?.length || 0})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--slate-500)' }}>
              Assign specialist groomers, boarding rooms, and manage completion tasks
            </p>
          </div>
        </div>

        <div className="table-scroll">
          <Table
            dataSource={detail.bookingItems}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="middle"
            expandable={{
              rowExpandable: (record) => Boolean(record.beforeImageUrl || record.resultImageUrl || record.resultNote),
              expandedRowRender: (record) => (
                <div style={{ padding: '14px 18px', background: 'var(--paper-card)', borderRadius: 10, border: '1px solid var(--slate-200)', margin: '8px 0' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <CameraOutlined /> Service Photos (Before & After) & Grooming Notes:
                  </div>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Image.PreviewGroup>
                      {record.beforeImageUrl && (
                        <div style={{ textAlign: 'center' }}>
                          <Image
                            src={record.beforeImageUrl}
                            alt="Before Service"
                            width={88}
                            height={88}
                            style={{ objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--slate-300)' }}
                          />
                          <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 4, fontWeight: 600 }}>Before</div>
                        </div>
                      )}
                      {record.resultImageUrl && (
                        <div style={{ textAlign: 'center' }}>
                          <Image
                            src={record.resultImageUrl}
                            alt="After Service"
                            width={88}
                            height={88}
                            style={{ objectFit: 'cover', borderRadius: 8, border: '1.5px solid #10b981' }}
                          />
                          <div style={{ fontSize: 11, color: '#15803d', fontWeight: 700, marginTop: 4 }}>After Service</div>
                        </div>
                      )}
                    </Image.PreviewGroup>
                    {record.resultNote && (
                      <div style={{ fontSize: '13px', color: 'var(--slate-800)', background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--slate-200)', flex: 1, minWidth: 220 }}>
                        <strong style={{ color: 'var(--secondary)' }}>Staff Note:</strong> "{record.resultNote}"
                      </div>
                    )}
                  </div>
                </div>
              ),
            }}
          />
        </div>
      </div>

      {/* Front Desk Check-out Modal */}
      <CheckoutBookingModal
        open={checkoutModalOpen}
        bookingId={id}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={() => {
          setCheckoutModalOpen(false)
          void loadData(id)
        }}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        bookingId={id}
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />

      {/* Cancel Booking Reason Modal */}
      <Modal
        title="Cancel Booking"
        open={cancelModalOpen}
        onCancel={() => {
          setCancelModalOpen(false)
          setCancellationReason('')
        }}
        onOk={handleCancelBooking}
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

export default AdminBookingDetailPage
