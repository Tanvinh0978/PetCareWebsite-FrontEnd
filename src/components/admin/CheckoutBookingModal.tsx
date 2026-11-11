import React, { useState, useEffect } from 'react'
import {
  Modal,
  Spin,
  Alert,
  Table,
  Input,
  Button,
  Typography,
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
  WarningOutlined,
} from '@ant-design/icons'
import { bookingService } from '@/services/booking.service'
import type { CheckoutSummaryDTO, CheckoutItemSummaryDTO } from '@/types/bookingManagement.types'

const { Text } = Typography
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
      width: 120,
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: '#3d2d23' }}>{text}</span>
      ),
    },
    {
      title: 'Service / Room',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (_: any, record: CheckoutItemSummaryDTO) => (
        <div>
          <div style={{ fontWeight: 600, color: '#3d2d23', fontSize: 13 }}>{record.serviceName}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {record.roomName && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: '#faf6f0',
                  border: '1px solid #eeddc8',
                  color: '#785839',
                  borderRadius: 999,
                  padding: '2px 8px',
                }}
              >
                <ShopOutlined /> {record.roomName}
              </span>
            )}
            {record.resultNote && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  borderRadius: 999,
                  padding: '2px 8px',
                }}
              >
                <InfoCircleOutlined /> {record.resultNote}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Staff',
      dataIndex: 'staffName',
      key: 'staffName',
      width: 160,
      render: (text: string) => (
        <span style={{ color: '#5c4033', fontSize: 13 }}>{text || '—'}</span>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'assignedPrice',
      key: 'assignedPrice',
      width: 120,
      align: 'right' as const,
      render: (price: number) => (
        <span style={{ fontWeight: 700, color: '#3d2d23', fontSize: 13 }}>{vnd.format(price)}</span>
      ),
    },
  ]

  return (
    <>
      <style>{`
        .haven-checkout-modal .ant-modal-content {
          border-radius: 20px !important;
          border: 1.5px solid #eeddc8 !important;
          background-color: #ffffff !important;
          box-shadow: 0 20px 48px rgba(61, 45, 35, 0.16) !important;
          padding: 24px 28px !important;
        }
        .haven-checkout-modal .ant-modal-header {
          margin-bottom: 20px !important;
          padding-bottom: 16px !important;
          border-bottom: 1px solid #eeddc8 !important;
          background: transparent !important;
        }
        .haven-checkout-modal .ant-modal-close {
          top: 22px !important;
          right: 22px !important;
          color: #8c735f !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
        }
        .haven-checkout-modal .ant-modal-close:hover {
          background-color: #faf6f0 !important;
          color: #3d2d23 !important;
        }
        .haven-checkout-table .ant-table {
          background: transparent !important;
        }
        .haven-checkout-table .ant-table-container {
          border-radius: 12px !important;
          overflow: hidden !important;
        }
        .haven-checkout-table .ant-table-thead > tr > th {
          background: #faf6f0 !important;
          color: #785839 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1.5px solid #eeddc8 !important;
          padding: 10px 14px !important;
        }
        .haven-checkout-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f4ebe1 !important;
          padding: 11px 14px !important;
          color: #3d2d23 !important;
        }
        .haven-checkout-table .ant-table-tbody > tr:hover > td {
          background: #fdfbf7 !important;
        }
      `}</style>

      <Modal
        wrapClassName="haven-checkout-modal"
        open={open}
        onCancel={onClose}
        footer={null}
        width={740}
        destroyOnClose
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#faf6f0',
                border: '1.5px solid #eeddc8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#785839',
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              <CheckCircleOutlined />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#3d2d23',
                  lineHeight: 1.3,
                }}
              >
                Front Desk Check-out & Pet Handover
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#8c735f', fontWeight: 400 }}>
                Verify payments, hand over pets to owners, and finalize booking
              </p>
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
              style={{
                marginBottom: 16,
                borderRadius: 12,
                border: '1.5px solid #fecaca',
                background: '#fef2f2',
                color: '#991b1b',
              }}
            />
          )}

          {summary && (
            <div style={{ padding: '4px 0' }}>
              <div
                style={{
                  background: '#fdfbf7',
                  border: '1.5px solid #eeddc8',
                  borderRadius: 14,
                  padding: '12px 18px',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#faf6f0',
                          border: '1px solid #eeddc8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#785839',
                          fontSize: 13,
                        }}
                      >
                        <UserOutlined />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#3d2d23' }}>
                        {summary.customerName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8c735f', fontSize: 13 }}>
                      <PhoneOutlined style={{ color: '#785839' }} />
                      <span>{summary.customerPhone}</span>
                    </div>
                  </div>

                  <div>
                    {isFullyPaid ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#047857',
                          borderRadius: 999,
                          padding: '3px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        ● PAID IN FULL
                      </span>
                    ) : summary.totalPaid > 0 ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          color: '#b45309',
                          borderRadius: 999,
                          padding: '3px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        ● PARTIALLY PAID
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#b91c1c',
                          borderRadius: 999,
                          padding: '3px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        ● UNPAID
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#8c735f',
                    marginBottom: 8,
                  }}
                >
                  Items & Services in Booking ({summary.items.length})
                </div>
                <div
                  style={{
                    border: '1.5px solid #eeddc8',
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: '#ffffff',
                  }}
                >
                  <Table
                    className="haven-checkout-table"
                    dataSource={summary.items}
                    columns={itemColumns}
                    rowKey="itemId"
                    pagination={false}
                    size="small"
                  />
                </div>
              </div>

              {Boolean(summary.lateFee && summary.lateFee > 0) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    background: '#fffbeb',
                    border: '1.5px solid #fde68a',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 16,
                  }}
                >
                  <WarningOutlined style={{ color: '#b45309', fontSize: 18, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400e', fontSize: 13 }}>
                      Late Checkout Detected ({summary.lateHours}h overdue) — Surcharge: +{vnd.format(summary.lateFee!)}
                    </div>
                    <div style={{ fontSize: 12, color: '#78350f', marginTop: 2 }}>
                      {summary.lateFeeReason || 'Late checkout surcharge has been automatically added to the remaining balance due.'}
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  background: '#fdfbf7',
                  border: '1.5px solid #eeddc8',
                  borderRadius: 14,
                  padding: '16px 20px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#8c735f' }}>Subtotal:</span>
                  <span style={{ color: '#3d2d23', fontWeight: 600 }}>{vnd.format(summary.subTotal)}</span>
                </div>

                {summary.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: '#8c735f' }}>
                      Voucher Discount {summary.voucherCode ? `(${summary.voucherCode})` : ''}:
                    </span>
                    <span style={{ color: '#15803d', fontWeight: 600 }}>
                      -{vnd.format(summary.discountAmount)}
                    </span>
                  </div>
                )}

                {Boolean(summary.lateFee && summary.lateFee > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: '#b45309', fontWeight: 600 }}>Late Checkout Surcharge:</span>
                    <span style={{ color: '#b45309', fontWeight: 600 }}>
                      +{vnd.format(summary.lateFee!)}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ fontWeight: 700, color: '#3d2d23' }}>Total Booking Amount:</span>
                  <span style={{ fontWeight: 700, color: '#3d2d23', fontSize: 15 }}>
                    {vnd.format(summary.totalPrice)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#8c735f' }}>Already Paid (Online / Deposit):</span>
                  <span style={{ color: '#785839', fontWeight: 600 }}>{vnd.format(summary.totalPaid)}</span>
                </div>

                <div style={{ height: 1, background: '#eeddc8', margin: '12px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#3d2d23' }}>
                      Remaining Amount to Collect:
                    </div>
                    <div style={{ fontSize: 12, color: '#8c735f', marginTop: 1 }}>
                      {isFullyPaid ? 'Invoice fully settled online' : 'Remaining balance due at counter'}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: "'Playfair Display', serif",
                      color: isFullyPaid ? '#047857' : '#991b1b',
                    }}
                  >
                    {vnd.format(summary.remainingAmount)}
                  </div>
                </div>
              </div>

              {isFullyPaid ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    background: '#f4fbf7',
                    border: '1.5px solid #a7f3d0',
                    borderRadius: 14,
                    padding: '14px 18px',
                    marginBottom: 16,
                  }}
                >
                  <CheckCircleFilled style={{ color: '#047857', fontSize: 20, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#065f46', fontSize: 14 }}>
                      Invoice fully settled online
                    </div>
                    <div style={{ fontSize: 13, color: '#047857', marginTop: 2 }}>
                      The customer has settled 100% of the bill online via VNPay. You can verify pet condition, return belongings, and finalize check-out.
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#faf6f0',
                    border: '1.5px solid #eeddc8',
                    borderRadius: 14,
                    padding: '16px 18px',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 700,
                      color: '#3d2d23',
                      marginBottom: 12,
                      fontSize: 14,
                    }}
                  >
                    <DollarCircleOutlined style={{ color: '#785839', fontSize: 16 }} />
                    <span>Payment Collection Options</span>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: '#8c735f', marginBottom: 8, fontWeight: 500 }}>
                      Select Payment Method:
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { key: 'CASH', label: 'Cash', icon: <DollarCircleOutlined /> },
                        { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <BankOutlined /> },
                        { key: 'CARD', label: 'POS / Card', icon: <CreditCardOutlined /> },
                      ].map((item) => {
                        const active = paymentMethod === item.key
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setPaymentMethod(item.key)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 18px',
                              borderRadius: 999,
                              fontSize: 13,
                              fontWeight: active ? 600 : 500,
                              background: active ? '#3d2d23' : '#ffffff',
                              color: active ? '#ffffff' : '#785839',
                              border: active ? '1.5px solid #3d2d23' : '1.5px solid #eeddc8',
                              boxShadow: active ? '0 2px 8px rgba(61,45,35,0.18)' : 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {paymentMethod === 'BANK_TRANSFER' && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#5c4033', fontWeight: 600, marginBottom: 5 }}>
                        Bank Reference / Transaction Code (Optional):
                      </div>
                      <Input
                        placeholder="e.g. FT2610134882"
                        value={transactionCode}
                        onChange={(e) => setTransactionCode(e.target.value)}
                        style={{
                          borderRadius: 10,
                          border: '1.5px solid #eeddc8',
                          padding: '7px 12px',
                          background: '#ffffff',
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 12, color: '#5c4033', fontWeight: 600, marginBottom: 5 }}>
                      Front Desk Note (Optional):
                    </div>
                    <TextArea
                      placeholder="e.g. Collected cash at counter, gave change..."
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      style={{
                        borderRadius: 10,
                        border: '1.5px solid #eeddc8',
                        padding: '8px 12px',
                        background: '#ffffff',
                      }}
                    />
                  </div>
                </div>
              )}

              {summary.canCheckout === false && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    background: '#fffbeb',
                    border: '1.5px solid #fde68a',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 16,
                  }}
                >
                  <WarningOutlined style={{ color: '#b45309', fontSize: 18, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400e', fontSize: 13 }}>
                      Cannot Check-out Yet
                    </div>
                    <div style={{ fontSize: 12, color: '#78350f', marginTop: 2 }}>
                      {summary.restrictionReason ||
                        'All active service items in this booking must be completed by staff before front desk check-out.'}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                <Button
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    borderRadius: 999,
                    border: '1.5px solid #eeddc8',
                    color: '#785839',
                    fontWeight: 600,
                    height: 42,
                    padding: '0 24px',
                    background: '#ffffff',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={submitting}
                  disabled={submitting || summary.canCheckout === false}
                  onClick={handleCheckout}
                  style={{
                    borderRadius: 999,
                    backgroundColor: summary.canCheckout === false ? '#cbd5e1' : '#3d2d23',
                    borderColor: summary.canCheckout === false ? '#cbd5e1' : '#3d2d23',
                    color: '#ffffff',
                    fontWeight: 600,
                    height: 42,
                    padding: '0 28px',
                    boxShadow: summary.canCheckout === false ? 'none' : '0 4px 14px rgba(61,45,35,0.2)',
                  }}
                >
                  {isFullyPaid
                    ? 'Complete Check-out'
                    : `Collect ${vnd.format(summary.remainingAmount)} & Check-out`}
                </Button>
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </>
  )
}

export default CheckoutBookingModal
