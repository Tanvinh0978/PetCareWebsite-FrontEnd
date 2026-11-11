import React, { useEffect, useState } from 'react';
import { Modal, Button, Spin, Alert, Typography, Divider, Tag, Space, Segmented } from 'antd';
import { PrinterOutlined, PhoneOutlined, MailOutlined, HomeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { bookingService } from '../../services/booking.service';

const { Title, Text } = Typography;
const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

interface ReceiptModalProps {
  bookingId: string | null;
  open: boolean;
  onClose: () => void;
}

type PaperSize = 'A5' | 'K80';

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ bookingId, open, onClose }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paperSize, setPaperSize] = useState<PaperSize>('A5');

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
    const printContent = document.getElementById('printable-receipt-content');
    if (!printContent) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const isA5 = paperSize === 'A5';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${receipt?.receiptNo || 'Bien_Lai_Thanh_Toan'}</title>
          <style>
            @page {
              size: ${isA5 ? 'A5 portrait' : '80mm auto'};
              margin: ${isA5 ? '8mm 10mm' : '4mm 4mm'};
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            }
            body {
              background: #ffffff !important;
              padding: ${isA5 ? '6px 8px' : '4px'};
              font-size: ${isA5 ? '12px' : '10px'};
              line-height: 1.35;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background-color: #f3f4f6;
              border-top: 1.5px solid #000;
              border-bottom: 1.5px solid #000;
              padding: 6px 4px;
            }
            td {
              border-bottom: 1px dashed #ccc;
              padding: 6px 4px;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 1500);
    }, 250);
  };

  return (
    <>
      <style>
        {`
          @page {
            size: ${paperSize === 'A5' ? 'A5 portrait' : '80mm auto'};
            margin: ${paperSize === 'A5' ? '8mm 10mm' : '4mm 4mm'};
          }

          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Hide the main website body contents */
            #root {
              display: none !important;
            }

            /* Do not hide ant-modal-wrap or modal content during print */
            .ant-modal-mask,
            .ant-modal-header,
            .ant-modal-footer,
            .ant-modal-close,
            .no-print {
              display: none !important;
            }

            .ant-modal-root,
            .ant-modal-wrap,
            .ant-modal,
            .ant-modal-content,
            .ant-modal-body {
              position: static !important;
              display: block !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
              overflow: visible !important;
            }

            .printable-receipt-container {
              display: block !important;
              width: 100% !important;
              max-width: ${paperSize === 'A5' ? '138mm' : '74mm'} !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              border: none !important;
              box-shadow: none !important;
              color: #000000 !important;
              font-size: ${paperSize === 'A5' ? '10.5pt' : '8.5pt'} !important;
              line-height: 1.35 !important;
            }

            .printable-receipt-container * {
              color: #000000 !important;
              text-shadow: none !important;
              box-shadow: none !important;
            }

            .printable-receipt-container table {
              border-collapse: collapse !important;
            }

            .printable-receipt-container th {
              background: #f3f4f6 !important;
              color: #000000 !important;
              border-top: 1.5px solid #000000 !important;
              border-bottom: 1.5px solid #000000 !important;
            }

            .printable-receipt-container td {
              border-bottom: 1px dashed #cccccc !important;
            }
          }
        `}
      </style>

      <Modal
        open={open}
        onCancel={onClose}
        width={720}
        centered
        destroyOnClose
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
            <Space>
              <PrinterOutlined style={{ color: '#1f2937', fontSize: 18 }} />
              <span style={{ fontWeight: 700, color: '#111827' }}>Biên lai thanh toán & Hóa đơn dịch vụ</span>
            </Space>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Khổ giấy:</Text>
              <Segmented
                size="small"
                value={paperSize}
                onChange={(val) => setPaperSize(val as PaperSize)}
                options={[
                  { label: 'A5 (Tiêu chuẩn)', value: 'A5' },
                  { label: 'K80 (Bill nhiệt)', value: 'K80' },
                ]}
              />
            </div>
          </div>
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
            style={{
              background: '#1f2937',
              borderColor: '#1f2937',
              color: '#ffffff',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            }}
          >
            In Biên Lai {paperSize} (Ctrl + P)
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
          {errorMsg && <Alert type="error" message={errorMsg} showIcon style={{ marginBottom: 16 }} />}

          {receipt && (
            <div
              id="printable-receipt-content"
              className="printable-receipt-container"
              style={{
                background: '#ffffff',
                padding: paperSize === 'A5' ? '24px 28px' : '16px 14px',
                maxWidth: paperSize === 'A5' ? '100%' : '440px',
                margin: '0 auto',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                color: '#111827',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Header: Store Branding (Monochrome Style) */}
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <Title level={3} style={{ margin: 0, color: '#111827', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 800 }}>
                  {receipt.store?.storeName || 'PET CARE & BOARDING SPA'}
                </Title>
                <Text style={{ fontSize: 12, color: '#4b5563', display: 'block', marginTop: 3 }}>
                  <HomeOutlined style={{ marginRight: 4 }} />
                  {receipt.store?.address}
                </Text>
                <Text style={{ fontSize: 12, color: '#4b5563', display: 'block', marginTop: 1 }}>
                  <PhoneOutlined style={{ marginRight: 4 }} />
                  Hotline: {receipt.store?.phone} | <MailOutlined style={{ marginRight: 4, marginLeft: 6 }} />
                  {receipt.store?.email}
                </Text>
                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, border: '1px solid #9ca3af', padding: '1px 8px', borderRadius: 4, color: '#374151' }}>
                    MST: {receipt.store?.taxCode || '0312345678'}
                  </span>
                  <span style={{ fontSize: 11, border: '1px solid #9ca3af', padding: '1px 8px', borderRadius: 4, color: '#374151' }}>
                    Website: {receipt.store?.website || 'petcarebooking.vn'}
                  </span>
                </div>
              </div>

              <Divider style={{ margin: '10px 0 14px 0', borderColor: '#9ca3af', borderWidth: 1 }} />

              {/* Title & Metadata (Black & White) */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  PHIẾU THANH TOÁN / CHECK-OUT RECEIPT
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 2 }}>
                  Mã biên lai: <strong style={{ color: '#111827' }}>{receipt.receiptNo}</strong>
                </div>
              </div>

              {/* Meta details grid (Monochrome) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '6px 16px',
                  background: '#f9fafb',
                  padding: '10px 14px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  marginBottom: 14,
                  border: '1px solid #e5e7eb',
                }}
              >
                <div>
                  <span style={{ color: '#6b7280' }}>Khách hàng: </span>
                  <strong style={{ color: '#111827' }}>{receipt.customer?.fullName}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Số điện thoại: </span>
                  <strong style={{ color: '#111827' }}>{receipt.customer?.phoneNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Ngày đặt hẹn: </span>
                  <span style={{ color: '#111827' }}>{new Date(receipt.bookingCreatedAt).toLocaleString('vi-VN')}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Thời gian in: </span>
                  <span style={{ color: '#111827' }}>{new Date(receipt.printedAt).toLocaleString('vi-VN')}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Thu ngân / Lễ tân: </span>
                  <strong style={{ color: '#111827' }}>{receipt.cashierName}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Trạng thái đơn: </span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>
                    {receipt.bookingStatus === 'Completed' ? 'Đã hoàn tất & Trả pet' : receipt.bookingStatus}
                  </span>
                </div>
              </div>

              {/* Pets info (Monochrome) */}
              {receipt.pets?.length > 0 && (
                <div style={{ marginBottom: 12, fontSize: 12.5 }}>
                  <span style={{ fontWeight: 700, color: '#374151', marginRight: 6 }}>
                    Thú cưng thực hiện:
                  </span>
                  {receipt.pets.map((p: any, idx: number) => (
                    <span
                      key={p.petId || idx}
                      style={{
                        display: 'inline-block',
                        fontSize: 11.5,
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        color: '#111827',
                        padding: '1px 8px',
                        borderRadius: 4,
                        marginRight: 6,
                        fontWeight: 600,
                      }}
                    >
                      {p.name} ({p.species === 'Dog' ? 'Dog' : 'Cat'} - {p.weight} kg)
                    </span>
                  ))}
                </div>
              )}

              {/* Line items table (Monochrome Crisp Print) */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                  Chi tiết dịch vụ sử dụng:
                </div>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderTop: '1.5px solid #111827', borderBottom: '1.5px solid #111827' }}>
                      <th style={{ padding: '6px 4px', textAlign: 'center', width: 32, fontWeight: 700, color: '#111827' }}>#</th>
                      <th style={{ padding: '6px 6px', fontWeight: 700, color: '#111827' }}>Dịch vụ & Thú cưng</th>
                      <th style={{ padding: '6px 6px', fontWeight: 700, color: '#111827' }}>Phòng / KTV phụ trách</th>
                      <th style={{ padding: '6px 6px', textAlign: 'center', fontWeight: 700, color: '#111827' }}>SL</th>
                      <th style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>Đơn giá</th>
                      <th style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items?.map((item: any, idx: number) => (
                      <tr key={item.itemId || idx} style={{ borderBottom: '1px dashed #d1d5db' }}>
                        <td style={{ padding: '7px 4px', textAlign: 'center', color: '#6b7280' }}>{idx + 1}</td>
                        <td style={{ padding: '7px 6px' }}>
                          <div style={{ fontWeight: 700, color: '#111827' }}>
                            {item.serviceName}
                          </div>
                          <div style={{ fontSize: 11, color: '#4b5563' }}>
                            Bé: {item.petName} | Loại: {item.serviceType}
                          </div>
                        </td>
                        <td style={{ padding: '7px 6px' }}>
                          <div style={{ color: '#111827' }}>{item.roomInfo ? `Phòng: ${item.roomInfo}` : '—'}</div>
                          <div style={{ fontSize: 11, color: '#4b5563' }}>
                            {item.staffName ? `KTV: ${item.staffName}` : '—'}
                          </div>
                        </td>
                        <td style={{ padding: '7px 6px', textAlign: 'center', color: '#111827' }}>{item.quantity}</td>
                        <td style={{ padding: '7px 6px', textAlign: 'right', color: '#111827' }}>{vnd.format(item.unitPrice)}</td>
                        <td style={{ padding: '7px 6px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                          {vnd.format(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation (Monochrome Clean Layout) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: 14,
                }}
              >
                <div style={{ width: 310, fontSize: 12.5, background: '#f9fafb', padding: '10px 14px', borderRadius: 6, border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#4b5563' }}>Tổng tiền dịch vụ:</span>
                    <span style={{ color: '#111827' }}>{vnd.format(receipt.subTotal)}</span>
                  </div>

                  {receipt.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#4b5563' }}>Giảm giá Voucher ({receipt.voucherCode}):</span>
                      <strong style={{ color: '#111827' }}>-{vnd.format(receipt.discountAmount)}</strong>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid #9ca3af', margin: '6px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, borderBottom: '2px solid #111827', paddingBottom: 4 }}>
                    <strong style={{ fontSize: 13.5, color: '#111827' }}>Tổng thanh toán:</strong>
                    <strong style={{ fontSize: 15, color: '#111827' }}>
                      {vnd.format(receipt.totalPrice)}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#4b5563' }}>Đã thanh toán:</span>
                    <strong style={{ color: '#111827' }}>{vnd.format(receipt.totalPaid)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#4b5563' }}>Còn lại cần trả:</span>
                    <strong style={{ color: '#111827' }}>
                      {vnd.format(receipt.remainingBalance)}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ color: '#4b5563' }}>Hình thức:</span>
                    <span style={{ border: '1px solid #9ca3af', padding: '0 6px', borderRadius: 3, fontWeight: 700, fontSize: 11.5, color: '#111827' }}>
                      {receipt.primaryPaymentMethod}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment transactions history (Monochrome) */}
              {receipt.paymentHistory?.length > 0 && (
                <div style={{ marginBottom: 14, fontSize: 11.5 }}>
                  <div style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Lịch sử các đợt giao dịch:
                  </div>
                  {receipt.paymentHistory.map((p: any, idx: number) => (
                    <div
                      key={p.transactionId || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 8px',
                        background: '#f3f4f6',
                        borderRadius: 4,
                        marginBottom: 3,
                        color: '#111827',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <span>
                        <CheckCircleOutlined style={{ marginRight: 4, color: '#374151' }} />
                        {p.transactionCode || 'Giao dịch'} ({p.paymentMethod}) - {p.note || 'Thanh toán'}
                      </span>
                      <span style={{ fontWeight: 700 }}>{vnd.format(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <Divider style={{ margin: '12px 0 16px 0', borderColor: '#d1d5db' }} />

              {/* Signatures & Footer Note */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  textAlign: 'center',
                  marginTop: 16,
                  marginBottom: 24,
                  fontSize: 12.5,
                }}
              >
                <div>
                  <strong style={{ color: '#111827' }}>Khách hàng</strong>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>(Ký và ghi rõ họ tên)</div>
                  <div style={{ height: 42 }} />
                  <strong style={{ color: '#111827' }}>{receipt.customer?.fullName}</strong>
                </div>
                <div>
                  <strong style={{ color: '#111827' }}>Nhân viên thu ngân</strong>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>(Ký và đóng dấu)</div>
                  <div style={{ height: 42 }} />
                  <strong style={{ color: '#111827' }}>{receipt.cashierName}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'center', borderTop: '1px dashed #9ca3af', paddingTop: 8 }}>
                <div style={{ fontSize: 11, fontStyle: 'italic', color: '#4b5563', display: 'block' }}>
                  {receipt.footerNote || 'Cảm ơn Quý khách và các bé cưng đã sử dụng dịch vụ tại Pet Care! Quý khách vui lòng kiểm tra hóa đơn và tình trạng của bé trước khi rời quầy.'}
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>
                  Tổng đài hỗ trợ 24/7: {receipt.hotlineSupport || '1900 8888 / 0901 234 567'}
                </div>
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </>
  );
};
