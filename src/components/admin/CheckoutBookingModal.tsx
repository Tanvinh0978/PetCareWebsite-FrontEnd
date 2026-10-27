import React, { useState, useEffect } from 'react'
import {
  Modal,
  Spin,
  Alert,
  Descriptions,
  Table,
  Tag,
  Radio,
  Input,
  InputNumber,
  Button,
  Typography,
  Space,
  Divider,
  message,
} from 'antd'
import {
  CheckCircleFilled,
  CreditCardOutlined,
  DollarCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  BankOutlined,
  UserOutlined,
  PhoneOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { bookingService } from '@/services/booking.service'
import type { CheckoutSummaryDTO, CheckoutItemSummaryDTO } from '@/types/bookingManagement.types'

const { Title, Text } = Typography
const { TextArea } = Input

interface CheckoutBookingModalProps {
  open: boolean
  bookingId: string | null
  onClose: () => void
  onSuccess: () => void
}

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export const CheckoutBookingModal: React.FC<CheckoutBookingModalProps> = ({
  open,
  bookingId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<CheckoutSummaryDTO | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form states
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
  const [amountToPay, setAmountToPay] = useState<number>(0)
  const [transactionCode, setTransactionCode] = useState<string>('')
  const [note, setNote] = useState<string>('')

  useEffect(() => {
    if (open && bookingId) {
      setErrorMsg(null)
      setLoading(true)
      bookingService
        .getCheckoutSummary(bookingId)
        .then((data: CheckoutSummaryDTO) => {
          setSummary(data)
          setAmountToPay(data.remainingAmount > 0 ? data.remainingAmount : 0)
          setPaymentMethod(data.remainingAmount <= 0 ? 'VNPAY' : 'CASH')
          setTransactionCode('')
          setNote('')
        })
        .catch((err: any) => {
          const msg =
            err?.response?.data?.message || err?.message || 'Failed to load checkout summary.'
          setErrorMsg(msg)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setSummary(null)
    }
  }, [open, bookingId])

  const handleCheckout = async () => {
    if (!bookingId) return
    setSubmitting(true)
    setErrorMsg(null)
    try {
      await bookingService.checkoutBooking(bookingId, {
        paymentMethod: summary && summary.remainingAmount <= 0 ? 'VNPAY' : paymentMethod,
        amount: amountToPay,
        transactionCode: transactionCode?.trim() || undefined,
        note: note?.trim() || undefined,
      })
      message.success('Check-out completed and rooms released successfully!')
      onSuccess()
      onClose()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Checkout failed. Please check payment.'
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const isFullyPaid = summary ? summary.remainingAmount <= 0 : false

  const itemColumns = [
    {
      title: 'Pet',
      dataIndex: 'petName',
      key: 'petName',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Service / Room',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (_: any, record: CheckoutItemSummaryDTO) => (
        <div>
          <div>{record.serviceName}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
            {record.roomName && (
              <Tag color="cyan" style={{ fontSize: 11, margin: 0 }}>
                <ShopOutlined /> {record.roomName}
              </Tag>
            )}
            {record.resultNote && (
              <Tag color="orange" icon={<InfoCircleOutlined />} style={{ fontSize: 11, margin: 0, borderRadius: 4 }}>
                {record.resultNote}
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Staff',
      dataIndex: 'staffName',
      key: 'staffName',
      render: (text: string) => text || '—',
    },
    {
      title: 'Price',
      dataIndex: 'assignedPrice',
      key: 'assignedPrice',
      align: 'right' as const,
      render: (price: number) => <Text strong>{vnd.format(price)}</Text>,
    },
  ]

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              fontSize: 18,
            }}
          >
            <CheckCircleFilled />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
              Front Desk Check-out & Pet Handover
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Verify payments, hand over pets to owners, and finalize booking
            </Text>
          </div>
        </div>
      }
    >
      <Spin spinning={loading}>
        {errorMsg && (
          <Alert
            type="error"
            message={errorMsg}
            showIcon
            closable
            onClose={() => setErrorMsg(null)}
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        {summary && (
          <div style={{ padding: '8px 0' }}>
            {/* Customer Overview */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <Text strong style={{ fontSize: 15, color: '#1e293b' }}>
                    <UserOutlined style={{ marginRight: 6, color: '#6366f1' }} />
                    {summary.customerName}
                  </Text>
                  <span style={{ color: '#64748b', fontSize: 13, marginLeft: 12 }}>
                    <PhoneOutlined style={{ marginRight: 4 }} />
                    {summary.customerPhone}
                  </span>
                </div>
                <div>
                  {isFullyPaid ? (
                    <Tag color="success" style={{ fontWeight: 600, padding: '2px 8px' }}>
                      PAID IN FULL
                    </Tag>
                  ) : summary.totalPaid > 0 ? (
                    <Tag color="warning" style={{ fontWeight: 600, padding: '2px 8px' }}>
                      PARTIALLY PAID
                    </Tag>
                  ) : (
                    <Tag color="error" style={{ fontWeight: 600, padding: '2px 8px' }}>
                      UNPAID
                    </Tag>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>
                Items & Services in Booking ({summary.items.length})
              </Text>
              <Table
                dataSource={summary.items}
                columns={itemColumns}
                rowKey="itemId"
                pagination={false}
                size="small"
                style={{ border: '1px solid #f1f5f9', borderRadius: 8 }}
              />
            </div>

            {Boolean(summary.lateFee && summary.lateFee > 0) && (
              <Alert
                type="warning"
                showIcon
                message={
                  <span style={{ fontWeight: 600 }}>
                    Late Checkout Detected ({summary.lateHours}h overdue) — Surcharge: +{vnd.format(summary.lateFee!)}
                  </span>
                }
                description={
                  <div>
                    <div>{summary.lateFeeReason}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: '#78350f' }}>
                      Late checkout surcharge has been automatically added to the remaining balance due.
                    </div>
                  </div>
                }
                style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #fde68a', background: '#fffbeb' }}
              />
            )}

            {/* Financial Summary Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px',
                marginBottom: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <Text type="secondary">Subtotal:</Text>
                <Text>{vnd.format(summary.subTotal)}</Text>
              </div>

              {summary.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <Text type="secondary">
                    Voucher Discount {summary.voucherCode ? `(${summary.voucherCode})` : ''}:
                  </Text>
                  <Text style={{ color: '#059669', fontWeight: 600 }}>
                    -{vnd.format(summary.discountAmount)}
                  </Text>
                </div>
              )}

              {Boolean(summary.lateFee && summary.lateFee > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <Text type="secondary" style={{ color: '#d97706', fontWeight: 600 }}>
                    Late Checkout Surcharge:
                  </Text>
                  <Text style={{ color: '#d97706', fontWeight: 600 }}>
                    +{vnd.format(summary.lateFee!)}
                  </Text>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                <Text strong>Total Booking Amount:</Text>
                <Text strong style={{ fontSize: 15 }}>{vnd.format(summary.totalPrice)}</Text>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <Text type="secondary">Already Paid (Online / Deposit):</Text>
                <Text style={{ color: '#2563eb', fontWeight: 600 }}>{vnd.format(summary.totalPaid)}</Text>
              </div>

              <Divider style={{ margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                  Remaining Amount to Collect:
                </Text>
                <Text
                  strong
                  style={{
                    fontSize: 20,
                    color: isFullyPaid ? '#059669' : '#dc2626',
                  }}
                >
                  {vnd.format(summary.remainingAmount)}
                </Text>
              </div>
            </div>

            {/* Condition Banner */}
            {isFullyPaid ? (
              <Alert
                type="success"
                showIcon
                message="Invoice fully paid"
                description="The customer has settled 100% of the bill online via VNPay. You can verify pet condition, return belongings, and complete check-out."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            ) : (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  padding: '14px',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 10, fontSize: 14 }}>
                  <DollarCircleOutlined style={{ marginRight: 6 }} />Payment Collection Options
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                    Select Payment Method:
                  </Text>
                  <Radio.Group
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="CASH">
                      <DollarCircleOutlined style={{ marginRight: 4 }} /> Cash
                    </Radio.Button>
                    <Radio.Button value="BANK_TRANSFER">
                      <BankOutlined style={{ marginRight: 4 }} /> Bank Transfer
                    </Radio.Button>
                    <Radio.Button value="CARD">
                      <CreditCardOutlined style={{ marginRight: 4 }} /> POS / Card
                    </Radio.Button>
                  </Radio.Group>
                </div>

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Bank Reference / Transaction Code (Optional):
                    </Text>
                    <Input
                      placeholder="e.g. FT2610134882"
                      value={transactionCode}
                      onChange={(e) => setTransactionCode(e.target.value)}
                      style={{ borderRadius: 6 }}
                    />
                  </div>
                )}

                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Front Desk Note (Optional):
                  </Text>
                  <TextArea
                    placeholder="e.g. Collected cash at counter, gave change..."
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{ borderRadius: 6 }}
                  />
                </div>
              </div>
            )}

            {summary.canCheckout === false && (
              <Alert
                type="warning"
                showIcon
                message="Cannot Check-out Yet"
                description={
                  summary.restrictionReason ||
                  'All active service items in this booking must be completed by staff before front desk check-out.'
                }
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <Button onClick={onClose} disabled={submitting} style={{ borderRadius: 8 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={submitting}
                disabled={submitting || summary.canCheckout === false}
                onClick={handleCheckout}
                style={{
                  borderRadius: 8,
                  backgroundColor: summary.canCheckout === false ? '#94a3b8' : '#059669',
                  borderColor: summary.canCheckout === false ? '#94a3b8' : '#059669',
                  fontWeight: 600,
                  height: 38,
                  padding: '0 24px',
                }}
              >
                {isFullyPaid
                  ? 'Check-out'
                  : `Collect ${vnd.format(summary.remainingAmount)} & Check-out`}
              </Button>
            </div>
          </div>
        )}
      </Spin>
    </Modal>
  )
}

export default CheckoutBookingModal
