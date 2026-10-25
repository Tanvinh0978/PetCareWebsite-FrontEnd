import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Modal,
  Spin,
  Descriptions,
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
} from 'antd'
import {
  CheckCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  ShopOutlined,
  SaveOutlined,
  DollarCircleOutlined,
  PrinterOutlined,
  StopOutlined,
  CloseOutlined,
  CameraOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import {
  bookingService,
  type BookingDetail,
  type BookingDetailItem,
} from '@/services/booking.service'
import { staffService } from '@/services/staff.service'
import type { StaffDTO } from '@/types/staff.types'
import { roomService, type RoomDTO } from '@/services/room.service'
import { ReceiptModal } from './ReceiptModal'
import { useAuthStore } from '@/store/useAuthStore'
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper'

const { Title, Text } = Typography
const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

interface BookingDetailModalProps {
  open: boolean
  bookingId: string | null
  onClose: () => void
  onOpenCheckout?: (bookingId: string) => void
  onUpdated?: () => void
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  open,
  bookingId,
  onClose,
  onOpenCheckout,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Staff and Room options for assignment
  const [staffList, setStaffList] = useState<StaffDTO[]>([])
  const [roomList, setRoomList] = useState<RoomDTO[]>([])

  // Local assignment state per item: itemId -> { staffId?: string; roomId?: string }
  const [assignments, setAssignments] = useState<
    Record<string, { staffId?: string; roomId?: string }>
  >({})
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [noShowLoading, setNoShowLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const currentUser = useAuthStore((s) => s.user)
  const canCheckInPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_CHECKIN)
  const canCancelPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_CANCEL)
  const canAssignPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_ASSIGN_STAFF)

  // Load booking details & staff/room options
  const loadData = async (id: string) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const [bookingData, staffRes, roomRes] = await Promise.all([
        bookingService.fetchById(id),
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
  }

  useEffect(() => {
    if (open && bookingId) {
      void loadData(bookingId)
    } else {
      setDetail(null)
      setAssignments({})
    }
  }, [open, bookingId])

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
    if (!bookingId) return
    const currentAssignment = assignments[item.id]
    if (!currentAssignment) return

    setSavingItemId(item.id)
    try {
      await bookingService.assignItem(bookingId, item.id, {
        staffId: currentAssignment.staffId,
        roomId: currentAssignment.roomId,
      })
      message.success(`Updated assignment for ${item.serviceName} successfully!`)
      if (onUpdated) onUpdated()
      await loadData(bookingId)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to assign staff/room.'
      message.error(msg)
    } finally {
      setSavingItemId(null)
    }
  }

  const handleConfirmBooking = async () => {
    if (!bookingId) return
    setConfirmLoading(true)
    try {
      await bookingService.updateBookingStatus(bookingId, { status: 1 })
      message.success('Booking confirmed successfully! You can now assign staff and rooms.')
      if (onUpdated) onUpdated()
      await loadData(bookingId)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to confirm booking.'
      message.error(msg)
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!bookingId) return
    setCheckInLoading(true)
    try {
      await bookingService.checkIn(bookingId)
      message.success('Pet checked in successfully! Tasks are now active for staff.')
      if (onUpdated) onUpdated()
      await loadData(bookingId)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to check in pet.'
      message.error(msg)
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleNoShow = async () => {
    if (!bookingId) return
    setNoShowLoading(true)
    try {
      await bookingService.markNoShow(bookingId)
      message.success('Marked as No-Show. Scheduled room and staff resources released.')
      if (onUpdated) onUpdated()
      await loadData(bookingId)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to mark as No-Show.'
      message.error(msg)
    } finally {
      setNoShowLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!bookingId) return
    setCancelLoading(true)
    try {
      await bookingService.cancelBooking(bookingId, cancellationReason.trim() || 'Customer requested cancellation')
      message.success('Booking has been successfully cancelled.')
      setCancelModalOpen(false)
      setCancellationReason('')
      if (onUpdated) onUpdated()
      await loadData(bookingId)
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
    if (s === '0' || s === 'pending') return <Tag color="warning">Pending</Tag>
    if (s === '1' || s === 'confirmed') return <Tag color="blue">Confirmed</Tag>
    if (s === '2' || s === 'checked_in' || s === 'checkedin') return <Tag color="orange">Checked In</Tag>
    if (s === '3' || s === 'in_progress' || s === 'inprogress') return <Tag color="processing">In Progress</Tag>
    if (s === '4' || s === 'completed') return <Tag color="success">Completed</Tag>
    if (s === '5' || s === 'cancelled') return <Tag color="error">Cancelled</Tag>
    if (s === '6' || s === 'no_show' || s === 'noshow') return <Tag color="purple">No Show</Tag>
    return <Tag>{status}</Tag>
  }

  const columns = [
    {
      title: 'Pet',
      dataIndex: 'petName',
      key: 'petName',
      width: 130,
      render: (text: string, r: BookingDetailItem) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.petWeight} kg</div>
        </div>
      ),
    },
    {
      title: 'Scheduled Time',
      key: 'itemScheduledTime',
      width: 170,
      render: (_: any, r: BookingDetailItem) => {
        const start = r.scheduledStartAt ? dayjs(r.scheduledStartAt).format('DD/MM/YYYY HH:mm') : '—';
        const end = r.scheduledEndAt ? dayjs(r.scheduledEndAt).format('DD/MM/YYYY HH:mm') : null;
        return (
          <div style={{ fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>
              <CalendarOutlined style={{ marginRight: 4, color: '#6366f1' }} />
              {start}
            </div>
            {end && (
              <div style={{ color: '#64748b', marginTop: 2 }}>
                To: {end}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Service & Room Assignment',
      key: 'serviceAndRoom',
      width: 250,
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
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.serviceName}</div>

            {isBoarding && (
              <div style={{ marginTop: 6 }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  <ShopOutlined /> Assigned Room:
                </Text>
                <Select
                  size="small"
                  placeholder="Select room for boarding"
                  style={{ width: '100%' }}
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
              <Tag color="cyan" style={{ fontSize: 11, marginTop: 4 }}>
                <ShopOutlined /> Shared with Boarding Room
              </Tag>
            )}

            {!isBoarding && !isDiet && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Facility: Salon Grooming Station
              </Text>
            )}
          </div>
        )
      },
    },
    {
      title: 'Assigned Staff',
      key: 'staffAssignment',
      width: 220,
      render: (_: any, r: BookingDetailItem) => {
        const isDiet =
          r.serviceType === 2 ||
          String(r.serviceType).toLowerCase() === 'diet' ||
          (r.serviceName && r.serviceName.toLowerCase().includes('diet'))

        if (isDiet) {
          return (
            <Tag color="blue" style={{ fontSize: 11 }}>
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
              style={{ width: '100%' }}
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (st: any) => getItemStatusTag(st),
    },
    {
      title: 'Price',
      dataIndex: 'assignedPrice',
      key: 'assignedPrice',
      width: 110,
      align: 'right' as const,
      render: (p: number) => <Text strong>{vnd.format(p)}</Text>,
    },
    {
      title: 'Action',
      key: 'itemAction',
      width: 90,
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
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            loading={savingItemId === r.id}
            disabled={!canSave || !canAssignPerm}
            onClick={() => handleSaveAssignment(r)}
            style={{
              borderRadius: 6,
              backgroundColor: canSave ? '#059669' : undefined,
              borderColor: canSave ? '#059669' : undefined,
              fontSize: 12,
            }}
          >
            Save
          </Button>
        )
      },
    },
  ]

  return (
    <>
      <Modal
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {isPending && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={confirmLoading}
                  onClick={handleConfirmBooking}
                  style={{
                    borderRadius: 8,
                    backgroundColor: '#2563eb',
                    borderColor: '#2563eb',
                    fontWeight: 600,
                  }}
                >
                  Confirm
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setCancellationReason('Customer requested cancellation')
                    setCancelModalOpen(true)
                  }}
                  style={{ borderRadius: 8 }}
                >
                  Cancel
                </Button>
              </>
            )}

            {isConfirmed && hasEligibleCheckInItems && (
              <>
                {canCheckInPerm ? (
                  canCheckIn ? (
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={checkInLoading}
                      onClick={handleCheckIn}
                      style={{
                        borderRadius: 8,
                        backgroundColor: '#f59e0b',
                        borderColor: '#f59e0b',
                        fontWeight: 600,
                      }}
                    >
                      Check-in
                    </Button>
                  ) : (
                    <Tooltip title="Please assign staff and room for all services before Check-in.">
                      <Button disabled style={{ borderRadius: 8 }}>
                        Check-in
                      </Button>
                    </Tooltip>
                  )
                ) : (
                  <Tooltip title="You do not have permission to Check-in (Requires BOOKING_CHECKIN).">
                    <Button disabled style={{ borderRadius: 8 }}>
                      Check-in
                    </Button>
                  </Tooltip>
                )}

                {canCancelPerm && (
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setCancellationReason('Customer requested cancellation')
                      setCancelModalOpen(true)
                    }}
                    style={{ borderRadius: 8 }}
                  >
                    Cancel
                  </Button>
                )}

                {canCancelPerm && (
                  <Popconfirm
                    title="Mark customer as No-Show?"
                    description="Customer missed the appointment. Room and staff assignments will be released."
                    okText="Mark No-Show"
                    cancelText="Dismiss"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleNoShow}
                  >
                    <Button
                      icon={<StopOutlined />}
                      loading={noShowLoading}
                      style={{
                        borderRadius: 8,
                        color: '#7c3aed',
                        borderColor: '#c4b5fd',
                        backgroundColor: '#f5f3ff',
                        fontWeight: 600,
                      }}
                    >
                      No-Show
                    </Button>
                  </Popconfirm>
                )}
              </>
            )}
          </Space>
          <Space>
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Close
            </Button>

            {onOpenCheckout && bookingId && !isReadOnly && (
              allItemsCompleted ? (
                <Button
                  type="primary"
                  icon={<DollarCircleOutlined />}
                  onClick={() => {
                    onClose()
                    onOpenCheckout(bookingId)
                  }}
                  style={{
                    borderRadius: 8,
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    fontWeight: 600,
                  }}
                >
                  Check-out
                </Button>
              ) : (
                <Tooltip title="All service items must be completed by staff before check-out.">
                  <Button disabled style={{ borderRadius: 8 }}>
                    Check-out
                  </Button>
                </Tooltip>
              )
            )}

            {isCompleted && (
              <Button
                icon={<PrinterOutlined />}
                onClick={() => setReceiptOpen(true)}
                style={{
                  borderRadius: 8,
                  borderColor: '#059669',
                  color: '#059669',
                  fontWeight: 600,
                }}
              >
                Print Receipt
              </Button>
            )}
          </Space>
        </div>
      }
      width={920}
      destroyOnClose
      centered
      title={
        <div>
          <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
            Booking Details & Resource Assignment
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Booking ID: #{bookingId ? bookingId.slice(0, 8).toUpperCase() : '—'}
          </Text>
        </div>
      }
    >
      <Spin spinning={loading}>
        {errorMsg && <Alert type="error" message={errorMsg} showIcon style={{ marginBottom: 16 }} />}

        {detail && (
          <div>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Customer Name">
                <Text strong>{detail.customerName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Phone Number">
                <a href={`tel:${detail.customerPhone}`} style={{ color: '#059669', fontWeight: 600 }}>
                  <PhoneOutlined style={{ marginRight: 4 }} />
                  {detail.customerPhone}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Scheduled Time">
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  <CalendarOutlined style={{ marginRight: 6, color: '#6366f1' }} />
                  {detail.bookingItems && detail.bookingItems.length > 0 && detail.bookingItems[0].scheduledStartAt
                    ? dayjs(detail.bookingItems[0].scheduledStartAt).format('DD/MM/YYYY HH:mm')
                    : '—'}
                  {detail.bookingItems && detail.bookingItems.length > 0 && detail.bookingItems[0].scheduledEndAt ? (
                    <span style={{ color: '#64748b', fontWeight: 400 }}>
                      {' '}→ Out: {dayjs(detail.bookingItems[0].scheduledEndAt).format('DD/MM/YYYY HH:mm')}
                    </span>
                  ) : null}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                <span style={{ color: '#64748b' }}>
                  {dayjs(detail.createdAt).format('DD/MM/YYYY HH:mm')}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Booking Status">
                <Tag
                  color={
                    isCompleted
                      ? 'success'
                      : isNoShow
                      ? 'purple'
                      : isConfirmed
                      ? 'blue'
                      : isCancelled
                      ? 'error'
                      : 'warning'
                  }
                  style={{ fontWeight: 600 }}
                >
                  {isCompleted ? 'Completed' : isNoShow ? 'No-Show' : isConfirmed ? 'Confirmed' : isCancelled ? 'Cancelled' : 'Pending'}
                </Tag>
              </Descriptions.Item>
              {detail.cancellationReason && (
                <Descriptions.Item label={isNoShow ? 'No-Show Note' : 'Cancellation Reason'}>
                  <Text type="danger">{detail.cancellationReason}</Text>
                </Descriptions.Item>
              )}
              {detail.voucherCode && (
                <Descriptions.Item label="Voucher Applied">
                  <Tag color="purple">{detail.voucherCode}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    (-{vnd.format(detail.discountAmount)})
                  </Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Total Price">
                <Text strong style={{ color: '#059669', fontSize: 15 }}>
                  {vnd.format(detail.totalPrice)}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Pending Alert */}
            {isPending && (
              <Alert
                type="warning"
                showIcon
                message="Booking Pending Confirmation"
                description="Staff assignment is available after confirming the booking. Click 'Confirm' below to approve this reservation."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {/* Read-only Alert when completed or cancelled */}
            {isCompleted && (
              <Alert
                type="success"
                showIcon
                message="Booking Completed (Checked-out)"
                description="This booking has been completed, pet returned, and fully settled. Resource assignments are locked."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {isCancelled && (
              <Alert
                type="error"
                showIcon
                message="Booking Cancelled"
                description="This booking was cancelled. Resource assignments cannot be modified."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {/* Assignment warning before Check-in */}
            {isConfirmed && !isFullyAssigned && hasEligibleCheckInItems && (
              <Alert
                type="warning"
                showIcon
                message="Assignment Required Before Check-in"
                description="Please assign staff and rooms for all services before checking in the pet."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {!isReadOnly && isFullyAssigned && (
              <Alert
                type="info"
                showIcon
                message="Staff & Room Assignment"
                description="Receptionist can assign Grooming Staff to grooming services, and assign both Room and Staff for Boarding stays. Diet services automatically inherit the boarding room and staff."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>
                Items & Resource Assignment ({detail.bookingItems?.length || 0})
              </Text>
              <Table
                dataSource={detail.bookingItems}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
                style={{ border: '1px solid #f1f5f9', borderRadius: 8 }}
                expandable={{
                  rowExpandable: (record) => Boolean(record.beforeImageUrl || record.resultImageUrl || record.resultNote),
                  expandedRowRender: (record) => (
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <Text strong style={{ fontSize: 13, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <CameraOutlined /> Service Photos (Before & After) & Service Results:
                      </Text>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Image.PreviewGroup>
                          {record.beforeImageUrl && (
                            <div style={{ textAlign: 'center' }}>
                              <Image
                                src={record.beforeImageUrl}
                                alt="Before"
                                width={80}
                                height={80}
                                style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1' }}
                              />
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Before</div>
                            </div>
                          )}
                          {record.resultImageUrl && (
                            <div style={{ textAlign: 'center' }}>
                              <Image
                                src={record.resultImageUrl}
                                alt="After"
                                width={80}
                                height={80}
                                style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #10b981' }}
                              />
                              <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>After ⭐</div>
                            </div>
                          )}
                        </Image.PreviewGroup>
                        {record.resultNote && (
                          <div style={{ fontSize: 13, color: '#334155', background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', flex: 1, minWidth: 200 }}>
                            <span style={{ fontWeight: 600, color: '#0f766e' }}>Staff Note:</span> "{record.resultNote}"
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                }}
              />
            </div>
          </div>
        )}
      </Spin>
    </Modal>

    <ReceiptModal
      bookingId={bookingId}
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
      <p style={{ color: '#475569', fontSize: 13, marginBottom: 12 }}>
        Receptionist is cancelling this booking per customer request or unexpected circumstances. Please provide a cancellation reason:
      </p>
      <Input.TextArea
        rows={3}
        value={cancellationReason}
        onChange={(e) => setCancellationReason(e.target.value)}
        placeholder="e.g. Customer called to cancel / Pet is unwell..."
      />
    </Modal>
    </>
  )
}

export default BookingDetailModal
