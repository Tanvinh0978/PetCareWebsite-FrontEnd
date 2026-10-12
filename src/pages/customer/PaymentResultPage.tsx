import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Result, Button, Card, Descriptions, Spin, Typography, message, Tag, Space } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  HomeOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { bookingService } from '@/services/booking.service';

const { Title, Text } = Typography;

interface PaymentVerifyResult {
  isSuccess: boolean;
  bookingId?: string;
  amount?: number;
  transactionNo?: string;
  bankCode?: string;
  responseCode?: string;
  payDate?: string;
}

const formatPayDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  // VNPay compact format: YYYYMMDDHHmmss
  if (dateStr.length === 14 && /^\d+$/.test(dateStr)) {
    const formatted = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}T${dateStr.substring(8, 10)}:${dateStr.substring(10, 12)}:${dateStr.substring(12, 14)}`;
    const parsed = dayjs(formatted);
    return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm:ss') : dateStr;
  }
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm:ss') : dateStr;
};

const PaymentResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'verifying' | 'success' | 'error' | 'empty'>('verifying');
  const [verifyMessage, setVerifyMessage] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentVerifyResult | null>(null);

  const hasCalledApi = useRef(false);

  useEffect(() => {
    // Only call once in React 18 strict mode
    if (hasCalledApi.current) return;
    hasCalledApi.current = true;

    const queryString = window.location.search || location.search;
    if (!queryString || queryString === '?') {
      setVerifyStatus('empty');
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        setLoading(true);
        const res: any = await bookingService.verifyVnpayPayment(queryString);
        
        // Backend format:
        // { isSuccess: true, statusCode: 200, message: "...", result: { isSuccess: true, bookingId: "...", amount: 500000, ... } }
        const result: PaymentVerifyResult = res?.result || res?.data || {};
        const searchParams = new URLSearchParams(queryString);

        const responseCode = result.responseCode || searchParams.get('vnp_ResponseCode') || '';
        const isSuccessFlag = res?.isSuccess === true && result?.isSuccess !== false && responseCode === '00';

        const mergedData: PaymentVerifyResult = {
          isSuccess: isSuccessFlag,
          bookingId: result.bookingId || searchParams.get('vnp_TxnRef') || undefined,
          amount: result.amount !== undefined ? result.amount : (Number(searchParams.get('vnp_Amount')) ? Number(searchParams.get('vnp_Amount')) / 100 : undefined),
          transactionNo: result.transactionNo || searchParams.get('vnp_TransactionNo') || undefined,
          bankCode: result.bankCode || searchParams.get('vnp_BankCode') || undefined,
          responseCode,
          payDate: result.payDate || searchParams.get('vnp_PayDate') || dayjs().toISOString(),
        };

        setPaymentData(mergedData);
        setVerifyMessage(res?.message || '');

        if (isSuccessFlag) {
          setVerifyStatus('success');
        } else {
          setVerifyStatus('error');
        }
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error?.message || 'Không thể xác thực giao dịch thanh toán.';
        setVerifyMessage(errorMsg);
        
        const searchParams = new URLSearchParams(queryString);
        setPaymentData({
          isSuccess: false,
          bookingId: searchParams.get('vnp_TxnRef') || undefined,
          amount: Number(searchParams.get('vnp_Amount')) ? Number(searchParams.get('vnp_Amount')) / 100 : undefined,
          transactionNo: searchParams.get('vnp_TransactionNo') || undefined,
          bankCode: searchParams.get('vnp_BankCode') || undefined,
          responseCode: searchParams.get('vnp_ResponseCode') || 'error',
          payDate: dayjs().toISOString(),
        });
        setVerifyStatus('error');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location.search]);

  // Handler retry payment for failed transactions
  const handleRetryPayment = async () => {
    const bookingId = paymentData?.bookingId;
    if (!bookingId) {
      message.error('Không tìm thấy mã đơn hàng để tạo lại liên kết thanh toán.');
      return;
    }

    try {
      setRetrying(true);
      message.loading({ content: 'Đang tạo liên kết thanh toán mới...', key: 'vnpay-retry' });
      const res: any = await bookingService.createVnpayUrl(bookingId);
      const newPaymentUrl = res?.result?.paymentUrl || res?.data?.paymentUrl || res?.paymentUrl || (typeof res?.result === 'string' ? res.result : null);
      
      if (newPaymentUrl) {
        message.success({ content: 'Chuyển hướng đến cổng thanh toán VNPay...', key: 'vnpay-retry' });
        window.location.href = newPaymentUrl;
      } else {
        message.error({ content: 'Không nhận được liên kết thanh toán VNPay. Vui lòng thử lại sau.', key: 'vnpay-retry' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo liên kết thanh toán.';
      message.error({ content: msg, key: 'vnpay-retry' });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 16px',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span>🐾</span> PetCare
          </div>
        </Link>
        <Text type="secondary" style={{ fontSize: '14px' }}>Cổng thông tin thanh toán dịch vụ thú cưng</Text>
      </div>

      <Card
        style={{
          width: '100%',
          maxWidth: 680,
          borderRadius: 16,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: '32px 24px' }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 24 }}>
              <Title level={4} style={{ color: '#1e293b', marginBottom: 8 }}>
                Đang kiểm tra kết quả thanh toán...
              </Title>
              <Text type="secondary">
                Vui lòng không đóng trình duyệt, hệ thống đang xác thực chữ ký bảo mật từ VNPay.
              </Text>
            </div>
          </div>
        ) : verifyStatus === 'success' ? (
          <Result
            status="success"
            icon={<CheckCircleFilled style={{ color: '#10b981' }} />}
            title="Thanh toán thành công!"
            subTitle={
              verifyMessage ||
              'Giao dịch thanh toán trực tuyến qua VNPay đã được xác nhận thành công.'
            }
            extra={[
              <Button
                type="primary"
                key="my-bookings"
                icon={<HistoryOutlined />}
                size="large"
                style={{ backgroundColor: '#059669', borderRadius: 8, padding: '0 24px' }}
                onClick={() => navigate('/customer/bookings')}
              >
                Xem đơn đặt của tôi
              </Button>,
              <Button
                key="home"
                icon={<HomeOutlined />}
                size="large"
                style={{ borderRadius: 8, padding: '0 24px' }}
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </Button>,
            ]}
          >
            {paymentData && (
              <div
                style={{
                  background: '#f8fafc',
                  padding: 20,
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  marginTop: 16,
                  textAlign: 'left',
                }}
              >
                <Title level={5} style={{ marginBottom: 16, color: '#0f172a' }}>
                  Thông tin giao dịch
                </Title>
                <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
                  <Descriptions.Item label="Mã giao dịch">
                    <Text strong style={{ fontFamily: 'monospace' }}>
                      {paymentData.transactionNo || 'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã đơn đặt">
                    <Text strong style={{ fontFamily: 'monospace', color: '#059669' }}>
                      {paymentData.bookingId ? `#${paymentData.bookingId.slice(0, 8).toUpperCase()}` : 'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tiền đã thanh toán">
                    <Text strong style={{ color: '#059669', fontSize: 16 }}>
                      {paymentData.amount !== undefined ? `${paymentData.amount.toLocaleString()} VND` : 'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngân hàng">
                    <Tag color="blue">{paymentData.bankCode || 'VNPay'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian thanh toán" span={2}>
                    {formatPayDate(paymentData.payDate)}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Result>
        ) : verifyStatus === 'error' ? (
          <Result
            status="error"
            icon={<CloseCircleFilled style={{ color: '#ef4444' }} />}
            title="Thanh toán thất bại"
            subTitle={
              verifyMessage ||
              'Giao dịch bị hủy hoặc xảy ra lỗi trong quá trình thanh toán qua VNPay.'
            }
            extra={[
              <Space key="actions" wrap style={{ justifyContent: 'center', width: '100%' }}>
                {paymentData?.bookingId && (
                  <Button
                    type="primary"
                    key="retry"
                    danger
                    icon={<ReloadOutlined />}
                    size="large"
                    loading={retrying}
                    style={{ borderRadius: 8, padding: '0 24px' }}
                    onClick={handleRetryPayment}
                  >
                    Thử thanh toán lại
                  </Button>
                )}
                <Button
                  key="my-bookings"
                  icon={<HistoryOutlined />}
                  size="large"
                  style={{ borderRadius: 8, padding: '0 24px' }}
                  onClick={() => navigate('/customer/bookings')}
                >
                  Về danh sách đơn
                </Button>
                <Button
                  key="home"
                  icon={<HomeOutlined />}
                  size="large"
                  style={{ borderRadius: 8, padding: '0 20px' }}
                  onClick={() => navigate('/')}
                >
                  Về trang chủ
                </Button>
              </Space>,
            ]}
          >
            {paymentData && (
              <div
                style={{
                  background: '#fef2f2',
                  padding: 20,
                  borderRadius: 12,
                  border: '1px solid #fee2e2',
                  marginTop: 16,
                  textAlign: 'left',
                }}
              >
                <Title level={5} style={{ marginBottom: 16, color: '#991b1b' }}>
                  Chi tiết kết quả
                </Title>
                <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
                  {paymentData.bookingId && (
                    <Descriptions.Item label="Mã đơn đặt">
                      <Text strong style={{ fontFamily: 'monospace' }}>
                        #{paymentData.bookingId.slice(0, 8).toUpperCase()}
                      </Text>
                    </Descriptions.Item>
                  )}
                  {paymentData.responseCode && (
                    <Descriptions.Item label="Mã phản hồi">
                      <Tag color="red">{paymentData.responseCode}</Tag>
                    </Descriptions.Item>
                  )}
                  {paymentData.amount !== undefined && (
                    <Descriptions.Item label="Số tiền yêu cầu">
                      {paymentData.amount.toLocaleString()} VND
                    </Descriptions.Item>
                  )}
                  {paymentData.bankCode && (
                    <Descriptions.Item label="Ngân hàng">
                      {paymentData.bankCode}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}
          </Result>
        ) : (
          <Result
            status="warning"
            title="Không tìm thấy thông tin giao dịch"
            subTitle="Trang này được sử dụng để hiển thị kết quả sau khi hoàn tất giao dịch thanh toán VNPay."
            extra={[
              <Button
                type="primary"
                key="home"
                icon={<HomeOutlined />}
                size="large"
                style={{ backgroundColor: '#059669', borderRadius: 8 }}
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </Button>,
              <Button
                key="my-bookings"
                icon={<HistoryOutlined />}
                size="large"
                style={{ borderRadius: 8 }}
                onClick={() => navigate('/customer/bookings')}
              >
                Xem danh sách đơn
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default PaymentResultPage;
