import React, { useEffect, useState } from 'react';
import { Modal, Button, Spin, Alert, Typography, Divider, Table, Tag, Space } from 'antd';
import { PrinterOutlined, CheckCircleFilled, PhoneOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import { bookingService } from '../../services/booking.service';

const { Title, Text } = Typography;
const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

interface ReceiptModalProps {
  bookingId: string | null;
  open: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ bookingId, open, onClose }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open && bookingId) {
      void loadReceipt(bookingId);
    } else {
      setReceipt(null);
      setErrorMsg(null);
    }
  }, [open, bookingId]);

  const loadReceipt = async (id: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await bookingService.getBookingReceipt(id);
      setReceipt(data);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể tải thông tin biên lai.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            .printable-receipt-container,
            .printable-receipt-container * {
              visibility: visible !important;
            }
            .printable-receipt-container {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 24px !important;
              background: #ffffff !important;
              font-family: Arial, sans-serif !important;
            }
            .ant-modal-mask,
            .ant-modal-footer,
            .ant-modal-close,
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <Modal
        open={open}
        onCancel={onClose}
        width={750}
        centered
        destroyOnClose
        title={
          <Space>
            <PrinterOutlined style={{ color: '#059669', fontSize: 18 }} />
            <span>Biên lai thanh toán & Hóa đơn dịch vụ</span>
          </Space>
        }
        footer={[
          <Button key="close" onClick={onClose}>
            Đóng
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            disabled={!receipt}
            style={{ background: '#059669', borderColor: '#059669', fontWeight: 600 }}
          >
            In Biên Lai (Ctrl + P)
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
          {errorMsg && <Alert type="error" message={errorMsg} showIcon style={{ marginBottom: 16 }} />}

          {receipt && (
            <div
              className="printable-receipt-container"
              style={{
                background: '#ffffff',
                padding: '20px 24px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                color: '#1e293b',
              }}
            >
              {/* Header: Store Branding */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {receipt.store?.storeName || 'PET CARE & BOARDING SPA'}
                </Title>
                <Text style={{ fontSize: 13, color: '#64748b', display: 'block' }}>
                  <HomeOutlined style={{ marginRight: 4 }} />
                  {receipt.store?.address}
                </Text>
                <Text style={{ fontSize: 13, color: '#64748b', display: 'block' }}>
                  <PhoneOutlined style={{ marginRight: 4 }} />
                  Hotline: {receipt.store?.phone} | <MailOutlined style={{ marginRight: 4, marginLeft: 6 }} />
                  {receipt.store?.email}
                </Text>
                <div style={{ marginTop: 8, display: 'inline-block' }}>
                  <Tag color="cyan" style={{ fontSize: 11 }}>
                    MST: {receipt.store?.taxCode || '0312345678'}
                  </Tag>
                  <Tag color="green" style={{ fontSize: 11 }}>
                    Website: {receipt.store?.website}
                  </Tag>
                </div>
              </div>

              <Divider style={{ margin: '12px 0', borderColor: '#cbd5e1' }} />

              {/* Title & Metadata */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, color: '#059669', textTransform: 'uppercase' }}>
                  PHIẾU THANH TOÁN / CHECK-OUT RECEIPT
                </Title>
                <Text strong style={{ fontSize: 13, color: '#334155' }}>
                  Mã biên lai: {receipt.receiptNo}
                </Text>
              </div>

              {/* Meta details grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px 16px',
                  background: '#f8fafc',
                  padding: 12,
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 16,
                  border: '1px solid #f1f5f9',
                }}
              >
                <div>
                  <Text type="secondary">Khách hàng: </Text>
                  <Text strong>{receipt.customer?.fullName}</Text>
                </div>
                <div>
                  <Text type="secondary">Số điện thoại: </Text>
                  <Text strong>{receipt.customer?.phoneNumber}</Text>
                </div>
                <div>
                  <Text type="secondary">Ngày đặt hẹn: </Text>
                  <Text>{new Date(receipt.bookingCreatedAt).toLocaleString('vi-VN')}</Text>
                </div>
                <div>
                  <Text type="secondary">Thời gian in: </Text>
                  <Text>{new Date(receipt.printedAt).toLocaleString('vi-VN')}</Text>
                </div>
                <div>
                  <Text type="secondary">Thu ngân / Lễ tân: </Text>
                  <Text strong>{receipt.cashierName}</Text>
                </div>
                <div>
                  <Text type="secondary">Trạng thái đơn: </Text>
                  <Tag color={receipt.bookingStatus === 'Completed' ? 'success' : 'processing'} style={{ fontWeight: 600 }}>
                    {receipt.bookingStatus === 'Completed' ? 'Đã hoàn tất & Trả pet' : receipt.bookingStatus}
                  </Tag>
                </div>
              </div>

              {/* Pets info */}
              {receipt.pets?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <Text strong style={{ fontSize: 13, color: '#475569' }}>
                    Thú cưng thực hiện:
                  </Text>{' '}
                  {receipt.pets.map((p: any, idx: number) => (
                    <Tag key={p.petId || idx} color="blue" style={{ fontSize: 12 }}>
                      🐾 {p.name} ({p.species === 'Dog' ? 'Chó' : 'Mèo'} - {p.weight} kg)
                    </Tag>
                  ))}
                </div>
              )}

              {/* Line items table */}
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                  Chi tiết dịch vụ sử dụng:
                </Text>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: 36 }}>#</th>
                      <th style={{ padding: '8px 8px' }}>Dịch vụ & Thú cưng</th>
                      <th style={{ padding: '8px 8px' }}>Phòng / KTV phụ trách</th>
                      <th style={{ padding: '8px 8px', textAlign: 'center' }}>Số lượng</th>
                      <th style={{ padding: '8px 8px', textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ padding: '8px 8px', textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items?.map((item: any, idx: number) => (
                      <tr key={item.itemId || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 8px' }}>
                          <Text strong style={{ display: 'block', color: '#0f172a' }}>
                            {item.serviceName}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Bé: {item.petName} | Loại: {item.serviceType}
                          </Text>
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <div>{item.roomInfo ? `Phòng: ${item.roomInfo}` : '—'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {item.staffName ? `KTV: ${item.staffName}` : '—'}
                          </div>
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right' }}>{vnd.format(item.unitPrice)}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 600 }}>
                          {vnd.format(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: 16,
                }}
              >
                <div style={{ width: 320, fontSize: 13, background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">Tổng tiền dịch vụ:</Text>
                    <Text>{vnd.format(receipt.subTotal)}</Text>
                  </div>

                  {receipt.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#7c3aed' }}>
                      <span>Giảm giá Voucher ({receipt.voucherCode}):</span>
                      <span>-{vnd.format(receipt.discountAmount)}</span>
                    </div>
                  )}

                  <Divider style={{ margin: '6px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 14 }}>Tổng thanh toán:</Text>
                    <Text strong style={{ fontSize: 15, color: '#059669' }}>
                      {vnd.format(receipt.totalPrice)}
                    </Text>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">Đã thanh toán:</Text>
                    <Text strong>{vnd.format(receipt.totalPaid)}</Text>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">Còn lại cần trả:</Text>
                    <Text strong style={{ color: receipt.remainingBalance > 0 ? '#dc2626' : '#059669' }}>
                      {vnd.format(receipt.remainingBalance)}
                    </Text>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text type="secondary">Hình thức:</Text>
                    <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                      {receipt.primaryPaymentMethod}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* Payment transactions history */}
              {receipt.paymentHistory?.length > 0 && (
                <div style={{ marginBottom: 16, fontSize: 12 }}>
                  <Text strong style={{ color: '#475569', display: 'block', marginBottom: 4 }}>
                    Lịch sử các đợt giao dịch:
                  </Text>
                  {receipt.paymentHistory.map((p: any, idx: number) => (
                    <div
                      key={p.transactionId || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: '#f1f5f9',
                        borderRadius: 4,
                        marginBottom: 4,
                        color: '#334155',
                      }}
                    >
                      <span>
                        <CheckCircleFilled style={{ color: '#059669', marginRight: 4 }} />
                        {p.transactionCode || 'Giao dịch'} ({p.paymentMethod}) - {p.note || 'Thanh toán'}
                      </span>
                      <span style={{ fontWeight: 600 }}>{vnd.format(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <Divider style={{ margin: '14px 0', borderColor: '#cbd5e1' }} />

              {/* Signatures & Footer Note */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  textAlign: 'center',
                  marginTop: 20,
                  marginBottom: 30,
                  fontSize: 13,
                }}
              >
                <div>
                  <Text strong>Khách hàng</Text>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>(Ký và ghi rõ họ tên)</div>
                  <div style={{ height: 48 }} />
                  <Text>{receipt.customer?.fullName}</Text>
                </div>
                <div>
                  <Text strong>Nhân viên thu ngân</Text>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>(Ký và đóng dấu)</div>
                  <div style={{ height: 48 }} />
                  <Text>{receipt.cashierName}</Text>
                </div>
              </div>

              <div style={{ textAlign: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: 10 }}>
                <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic', display: 'block' }}>
                  {receipt.footerNote}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Tổng đài hỗ trợ 24/7: {receipt.hotlineSupport}
                </Text>
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </>
  );
};

