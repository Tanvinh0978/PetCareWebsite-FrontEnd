import React, { useState, useEffect } from 'react'
import {
  Modal,
  Spin,
  Descriptions,
  Table,
  Tag,
  Button,
  Typography,
  Divider,
  Alert,
  Image,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  ShopOutlined,
  ScissorOutlined,
} from '@ant-design/icons'
import { bookingService, type BookingDetail, type BookingDetailItem } from '@/services/booking.service'

const { Title, Text, Paragraph } = Typography
const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

interface BookingDetailModalProps {
  open: boolean
  bookingId: string | null
  onClose: () => void
  onOpenCheckout?: (bookingId: string) => void
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  open,
  bookingId,
  onClose,
  onOpenCheckout,
}) => {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (open && bookingId) {
      setLoading(true)
      setErrorMsg(null)
      bookingService
        .fetchById(bookingId)
        .then((data) => setDetail(data))
        .catch((err: any) => {
          const msg = err?.response?.data?.message || err?.message || 'Failed to load booking detail.'
          setErrorMsg(msg)
        })
        .finally(() => setLoading(false))
    } else {
      setDetail(null)
    }
  }, [open, bookingId])

  const getItemStatusTag = (status: number | string) => {
    const s = String(status).toLowerCase()
    if (s === '0' || s === 'pending') return <Tag color="default">Pending</Tag>
    if (s === '1' || s === 'confirmed') return <Tag color="blue">Confirmed</Tag>
    if (s === '2' || s === 'checked_in' || s === 'checkedin') return <Tag color="warning">Checked In</Tag>
    if (s === '3' || s === 'in_progress' || s === 'inprogress') return <Tag color="processing">In Progress</Tag>
    if (s === '4' || s === 'completed') return <Tag color="success">Completed</Tag>
    if (s === '5' || s === 'cancelled') return <Tag color="error">Cancelled</Tag>
    return <Tag>{status}</Tag>
  }

  const columns = [
    {
      title: 'Pet',
      dataIndex: 'petName',
      key: 'petName',
      render: (text: string, r: BookingDetailItem) => (
        <div>
          <Text strong>{r.petSpecies === 0 ? '🐶' : '🐱'} {text}</Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.petWeight} kg</div>
        </div>
      ),
    },
    {
      title: 'Service / Facility',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (text: string, r: BookingDetailItem) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          {r.roomName && (
            <Tag color="cyan" style={{ fontSize: 11, marginTop: 2 }}>
              <ShopOutlined /> {r.roomName}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Assigned Staff',
      dataIndex: 'staffName',
      key: 'staffName',
      render: (text: string) => text || 'Unassigned',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st: any) => getItemStatusTag(st),
    },
    {
      title: 'Price',
      dataIndex: 'assignedPrice',
      key: 'assignedPrice',
      align: 'right' as const,
      render: (p: number) => <Text strong>{vnd.format(p)}</Text>,
    },
  ]

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Close
          </Button>
          {onOpenCheckout && bookingId && detail && detail.status !== 3 && detail.status !== 'Cancelled' && (
            <Button
              type="primary"
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
          )}
        </div>
      }
      width={780}
      destroyOnClose
      centered
      title={
        <div>
          <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
            Booking Details & Services Breakdown
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Booking ID: #{bookingId?.slice(0, 8)}
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
                  {detail.customerPhone}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {new Date(detail.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag
                  color={
                    detail.status === 2 || detail.status === 'Completed'
                      ? 'success'
                      : detail.status === 1 || detail.status === 'Confirmed'
                      ? 'blue'
                      : detail.status === 3 || detail.status === 'Cancelled'
                      ? 'error'
                      : 'warning'
                  }
                  style={{ fontWeight: 600 }}
                >
                  {String(detail.status)}
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

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>
                Items & Service Schedule ({detail.bookingItems?.length || 0})
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
  )
}

export default BookingDetailModal
