import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { SafetyOutlined } from "@ant-design/icons";
import { verifyOtp, resendOtp } from "@/api/authApi";
import { getErrorMessage } from "@/api/client";

const { Title, Text } = Typography;

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onFinish = async (values: any) => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await verifyOtp({ email, otpCode: values.otpCode });
      message.success(res.message || "Account activated successfully! You can now sign in.");
      navigate("/login");
    } catch (error: any) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await resendOtp({ email });
      message.success(res.message || "A new OTP has been sent to your email.");
      setCountdown(60); // 60 seconds cooldown
    } catch (error: any) {
      message.error(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      
      {/* Left side: Image and Branding */}
      <div style={{ 
        flex: 1, 
        background: '#059669', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        color: 'white', 
        padding: '40px',
      }} className="register-banner">
        <Title level={1} style={{ margin: 0, color: 'white', fontWeight: 'bold', fontSize: '3rem' }}>
          🐾 PetCare
        </Title>
        <p style={{ fontSize: '1.2rem', marginTop: 16, textAlign: 'center', maxWidth: '400px', opacity: 0.9 }}>
          Just one more step to activate your account and start booking services.
        </p>
        <img 
          src="https://images.unsplash.com/photo-1592194996308-7b43878e84a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
          alt="Cute Cat" 
          style={{ 
            marginTop: 40, 
            borderRadius: 16, 
            width: '100%', 
            maxWidth: 400,
            aspectRatio: '4/3',
            objectFit: 'cover', 
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' 
          }} 
        />
      </div>

      {/* Right side: Form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
        <Card style={{ width: '100%', maxWidth: 450, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', borderRadius: 12, border: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0, color: '#1e293b' }}>
              Verify Your Email
            </Title>
            <Text type="secondary">We've sent an OTP to <strong>{email}</strong></Text>
          </div>

          <Form
            name="verify-otp"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="otpCode"
              rules={[
                { required: true, message: 'Please input the OTP code!' },
                { len: 6, message: 'OTP code must be exactly 6 digits!' }
              ]}
            >
              <Input prefix={<SafetyOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="6-digit OTP Code" maxLength={6} style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' }} />
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 16 }}>
              <Button type="primary" htmlType="submit" style={{ width: '100%', background: '#059669', borderColor: '#059669', height: '48px', fontSize: '16px', fontWeight: 600 }} loading={loading}>
                Verify & Activate
              </Button>
            </Form.Item>
          </Form>
          
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">Didn't receive the code? </Text>
            <Button 
              type="link" 
              onClick={handleResendOtp} 
              disabled={countdown > 0 || resending}
              style={{ padding: 0, color: '#059669', fontWeight: 600 }}
              loading={resending}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </Button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/login" style={{ color: '#64748b', fontSize: 14 }}>&larr; Back to Login</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
