import { PawIcon } from '@/components/common/PetIcons'
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
import { bookingService, forgetVnpayBooking } from '@/services/booking.service';

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
          forgetVnpayBooking(mergedData.bookingId);
          setVerifyStatus('success');
        } else {
          setVerifyStatus('error');
        }
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error?.message || 'Unable to verify the payment transaction.';
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
      message.error('Booking ID was not found. Unable to create a new payment link.');
      return;
    }

    try {
      setRetrying(true);
      message.loading({ content: 'Creating a new payment link...', key: 'vnpay-retry' });
      const res: any = await bookingService.createVnpayUrl(bookingId);
      const newPaymentUrl = res?.result?.paymentUrl || res?.data?.paymentUrl || res?.paymentUrl || (typeof res?.result === 'string' ? res.result : null);
      
      if (newPaymentUrl) {
        message.success({ content: 'Redirecting to VNPay...', key: 'vnpay-retry' });
        window.location.href = newPaymentUrl;
      } else {
        message.error({ content: 'VNPay did not return a payment link. Please try again later.', key: 'vnpay-retry' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'An error occurred while creating the payment link.';
      message.error({ content: msg, key: 'vnpay-retry' });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '85vh',
        backgroundColor: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 16px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '30px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--slate-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <PawIcon size={18} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--primary)' }} /> Haven &amp; Hound <small style={{ fontSize: '13px', fontWeight: 600, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>PetCare</small>
          </div>
        </Link>
        <Text type="secondary" style={{ fontSize: '15px', color: 'var(--slate-600)' }}>Sanctuary Service Payment Status</Text>
      </div>

      <Card
        style={{
          width: '100%',
          maxWidth: 680,
          borderRadius: 20,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--slate-200)',
          backgroundColor: 'var(--paper-card)',
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: '36px 28px' }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 24 }}>
              <Title level={4} style={{ color: 'var(--slate-900)', fontFamily: 'var(--font-heading)', marginBottom: 8 }}>
                Verifying payment signature...
              </Title>
              <Text type="secondary" style={{ color: 'var(--slate-600)' }}>
                Please keep this page open while we verify VNPay's secure signature.
              </Text>
            </div>
          </div>
        ) : verifyStatus === 'success' ? (
          <Result
            status="success"
            icon={<CheckCircleFilled style={{ color: '#4a634e' }} />}
            title={<span style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', color: 'var(--slate-900)' }}>Payment Successful!</span>}
            subTitle={
              <span style={{ fontSize: '15px', color: 'var(--slate-600)' }}>
                {verifyMessage || 'Your online payment through VNPay has been confirmed and your booking is reserved.'}
              </span>
            }
            extra={[
              <Button
                type="primary"
                key="my-bookings"
                icon={<HistoryOutlined />}
                size="large"
                style={{ background: 'linear-gradient(135deg, #3d2d23 0%, #26180f 100%)', borderRadius: 999, padding: '0 28px', border: 'none', fontWeight: 600 }}
                onClick={() => navigate('/customer/bookings')}
              >
                View My Bookings
              </Button>,
              <Button
                key="home"
                icon={<HomeOutlined />}
                size="large"
                style={{ borderRadius: 999, padding: '0 28px', border: '1px solid var(--slate-300)', color: 'var(--slate-700)', fontWeight: 600 }}
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>,
            ]}
          >
            {paymentData && (
              <div
                style={{
                  background: 'var(--slate-50)',
                  padding: 24,
                  borderRadius: 14,
                  border: '1px solid var(--slate-200)',
                  marginTop: 20,
                  textAlign: 'left',
                }}
              >
                <Title level={5} style={{ marginBottom: 16, color: 'var(--slate-900)', fontFamily: 'var(--font-heading)', fontSize: '18px' }}>
                  Transaction Information
                </Title>
                <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
                  <Descriptions.Item label="Transaction ID">
                    <Text strong style={{ fontFamily: 'monospace' }}>
                      {paymentData.transactionNo || 'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Booking ID">
                    <Text strong style={{ fontFamily: 'monospace', color: 'var(--secondary)' }}>
                      {paymentData.bookingId ? `#${paymentData.bookingId.slice(0, 8).toUpperCase()}` : 'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Amount Paid">
                    <Text strong style={{ color: 'var(--secondary)', fontSize: 16 }}>
                      {paymentData.amount !== undefined ? `${paymentData.amount.toLocaleString()} VND` : 'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Bank">
                    <Tag style={{ background: 'var(--primary-light)', color: 'var(--secondary)', border: '1px solid var(--slate-200)', borderRadius: '999px', fontWeight: 600 }}>{paymentData.bankCode || 'VNPay'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Time" span={2}>
                    {formatPayDate(paymentData.payDate)}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Result>
        ) : verifyStatus === 'error' ? (
          <Result
            status="error"
            icon={<CloseCircleFilled style={{ color: 'var(--danger)' }} />}
            title={<span style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', color: 'var(--slate-900)' }}>Payment Failed</span>}
            subTitle={
              <span style={{ fontSize: '15px', color: 'var(--slate-600)' }}>
                {verifyMessage || 'The transaction was cancelled or an error occurred during VNPay payment.'}
              </span>
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
                    style={{ borderRadius: 999, padding: '0 28px', fontWeight: 600 }}
                    onClick={handleRetryPayment}
                  >
                    Try payment again
                  </Button>
                )}
                <Button
                  key="my-bookings"
                  icon={<HistoryOutlined />}
                  size="large"
                  style={{ borderRadius: 999, padding: '0 28px', border: '1px solid var(--slate-300)', color: 'var(--slate-700)', fontWeight: 600 }}
                  onClick={() => navigate('/customer/bookings')}
                >
                  Back to Bookings
                </Button>
                <Button
                  key="home"
                  icon={<HomeOutlined />}
                  size="large"
                  style={{ borderRadius: 999, padding: '0 24px', border: '1px solid var(--slate-300)', color: 'var(--slate-700)', fontWeight: 600 }}
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
              </Space>,
            ]}
          >
            {paymentData && (
              <div
                style={{
                  background: 'var(--danger-light)',
                  padding: 24,
                  borderRadius: 14,
                  border: '1px solid var(--danger-border)',
                  marginTop: 20,
                  textAlign: 'left',
                }}
              >
                <Title level={5} style={{ marginBottom: 16, color: 'var(--danger)', fontFamily: 'var(--font-heading)' }}>
                  Result Details
                </Title>
                <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
                  {paymentData.bookingId && (
                    <Descriptions.Item label="Booking ID">
                      <Text strong style={{ fontFamily: 'monospace' }}>
                        #{paymentData.bookingId.slice(0, 8).toUpperCase()}
                      </Text>
                    </Descriptions.Item>
                  )}
                  {paymentData.responseCode && (
                    <Descriptions.Item label="Response Code">
                      <Tag color="red">{paymentData.responseCode}</Tag>
                    </Descriptions.Item>
                  )}
                  {paymentData.amount !== undefined && (
                    <Descriptions.Item label="Requested Amount">
                      {paymentData.amount.toLocaleString()} VND
                    </Descriptions.Item>
                  )}
                  {paymentData.bankCode && (
                    <Descriptions.Item label="Bank">
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
            title={<span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--slate-900)' }}>Transaction Information Not Found</span>}
            subTitle="This page displays the result after a VNPay payment transaction is completed."
            extra={[
              <Button
                type="primary"
                key="home"
                icon={<HomeOutlined />}
                size="large"
                style={{ background: 'linear-gradient(135deg, #3d2d23 0%, #26180f 100%)', borderRadius: 999, padding: '0 28px', border: 'none', fontWeight: 600 }}
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>,
              <Button
                key="my-bookings"
                icon={<HistoryOutlined />}
                size="large"
                style={{ borderRadius: 999, padding: '0 28px', border: '1px solid var(--slate-300)', color: 'var(--slate-700)', fontWeight: 600 }}
                onClick={() => navigate('/customer/bookings')}
              >
                View My Bookings
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default PaymentResultPage;
