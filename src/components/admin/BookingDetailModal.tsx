import React, { useState, useEffect } from 'react'
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
} from 'antd'
import {
  CheckCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  ShopOutlined,
  SaveOutlined,
  DollarCircleOutlined,
  PrinterOutlined,
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
  const [receiptOpen, setReceiptOpen] = useState(false)

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

  const isConfirmed = detail?.status === 1 || String(detail?.status).toLowerCase() === 'confirmed'
  const isCompleted = detail?.status === 2 || String(detail?.status).toLowerCase() === 'completed'
  const isCancelled = detail?.status === 3 || String(detail?.status).toLowerCase() === 'cancelled'
  const isPending = detail?.status === 0 || String(detail?.status).toLowerCase() === 'pending'
  const isReadOnly = isCompleted || isCancelled

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
    if (s === '6' || s === 'no_show' || s === 'noshow') return <Tag color="default">No Show</Tag>
    return <Tag>{status}</Tag>
  }

  const columns = [
    {
      title: 'Pet',
      dataIndex: 'petName',
      key: 'petName',
      width: 140,
      render: (text: string, r: BookingDetailItem) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.petWeight} kg</div>
        </div>
      ),
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
                  disabled={isReadOnly}
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

        return (
          <div>
            <Select
              size="small"
              placeholder="Select staff"
              style={{ width: '100%' }}
              disabled={isReadOnly}
              value={currentStaffId}
              onChange={(val) => handleAssignmentChange(r.id, 'staffId', val)}
              allowClear
              options={staffList.map((s) => ({
                value: s.id,
                label: `${s.fullName} (${s.roles?.join(', ') || 'Staff'})`,
              }))}
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

        return (
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            loading={savingItemId === r.id}
            disabled={!hasChanged}
            onClick={() => handleSaveAssignment(r)}
            style={{
              borderRadius: 6,
              backgroundColor: hasChanged ? '#059669' : undefined,
              borderColor: hasChanged ? '#059669' : undefined,
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
          <div>
            {isConfirmed && hasEligibleCheckInItems && (
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
                  Check-in Pet at Front Desk
                </Button>
              ) : (
                <Tooltip title="Vui lòng phân công nhân viên và xếp phòng đầy đủ trước khi Check-in.">
                  <Button disabled style={{ borderRadius: 8 }}>
                    Check-in Pet at Front Desk
                  </Button>
                </Tooltip>
              )
            )}
          </div>
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
                  Check-out at Counter
                </Button>
              ) : (
                <Tooltip title="All service items must be completed by staff before check-out.">
                  <Button disabled style={{ borderRadius: 8 }}>
                    Check-out at Counter
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
                In Hóa đơn / Biên lai
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
              <Descriptions.Item label="Created At">
                {new Date(detail.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Booking Status">
                <Tag
                  color={
                    isCompleted
                      ? 'success'
                      : isConfirmed
                      ? 'blue'
                      : isCancelled
                      ? 'error'
                      : 'warning'
                  }
                  style={{ fontWeight: 600 }}
                >
                  {isCompleted ? 'Completed' : isConfirmed ? 'Confirmed' : isCancelled ? 'Cancelled' : 'Pending'}
                </Tag>
              </Descriptions.Item>
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

            {/* Read-only Alert when completed or cancelled */}
            {isCompleted && (
              <Alert
                type="success"
                showIcon
                message="Đơn đặt lịch đã hoàn tất (Check-out)"
                description="Đơn đặt lịch này đã bàn giao thú cưng và thanh toán hoàn tất. Các phân công nhân viên và phòng đã được khóa cố định."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {isCancelled && (
              <Alert
                type="error"
                showIcon
                message="Đơn đặt lịch đã bị hủy"
                description="Đơn đặt lịch này đã bị hủy. Không thể chỉnh sửa hoặc phân công lại."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {/* Assignment warning before Check-in */}
            {isConfirmed && !isFullyAssigned && hasEligibleCheckInItems && (
              <Alert
                type="warning"
                showIcon
                message="Cần phân công trước khi Check-in"
                description="Vui lòng chọn nhân viên và xếp phòng đầy đủ cho tất cả dịch vụ trước khi bấm Check-in tiếp đón thú cưng."
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
    </>
  )
}

export default BookingDetailModal
