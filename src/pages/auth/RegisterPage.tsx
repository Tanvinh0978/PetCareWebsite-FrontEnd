import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Typography, message } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { registerCustomer } from "@/api/authApi";
import { getErrorMessage } from "@/api/client";
import "./auth.css";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await registerCustomer({
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        fullName: values.fullName,
        phoneNumber: values.phone,
      });
      message.success(res.message || "Account created! Check your email for the OTP code.");
      navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`);
    } catch (error: any) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* ══ LEFT PANEL ══ */}
      <div className="auth-left">
        <div className="auth-left-bg-image"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80")' }}
        />
        <div className="auth-left-overlay" />

        <div className="auth-left-content">
          <div className="auth-left-logo">
            🐾 PetCare
          </div>
          <p className="auth-left-sub">
            Join us today to book grooming, boarding, and veterinary services for your furry friends.
          </p>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <Title level={2} className="auth-form-title">✨ Create Account</Title>
            <Text className="auth-form-subtitle">
              Sign up to get started
            </Text>
          </div>

          <Form name="register" onFinish={onFinish} layout="vertical" requiredMark={false} scrollToFirstError>
            <Form.Item name="fullName" label="Full name"
              rules={[{ required: true, message: 'Full name is required', whitespace: true }]}
            >
              <Input className="auth-input"
                prefix={<UserOutlined className="auth-input-icon" />}
                placeholder="Nguyen Van A"
              />
            </Form.Item>

            <Form.Item name="email" label="Email address"
              rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Invalid email format' }]}
            >
              <Input className="auth-input"
                prefix={<MailOutlined className="auth-input-icon" />}
                placeholder="you@example.com"
              />
            </Form.Item>

            <Form.Item name="phone" label="Phone number"
              rules={[{ required: true, message: 'Phone number is required' }]}
            >
              <Input className="auth-input"
                prefix={<PhoneOutlined className="auth-input-icon" />}
                placeholder="0901 234 567"
              />
            </Form.Item>

            <Form.Item name="password" label="Password"
              rules={[{ required: true, message: 'Password is required' }, { min: 6, message: 'At least 6 characters' }]}
            >
              <Input.Password className="auth-input"
                prefix={<LockOutlined className="auth-input-icon" />}
                placeholder="Create a strong password"
                iconRender={v => v ? <EyeTwoTone twoToneColor="#059669" /> : <EyeInvisibleOutlined style={{ color: '#9ca3af' }} />}
              />
            </Form.Item>

            <Form.Item name="confirmPassword" label="Confirm password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password className="auth-input"
                prefix={<LockOutlined className="auth-input-icon" />}
                placeholder="Repeat your password"
                iconRender={v => v ? <EyeTwoTone twoToneColor="#059669" /> : <EyeInvisibleOutlined style={{ color: '#9ca3af' }} />}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" className="auth-btn-primary" loading={loading} block style={{ marginTop: 8 }}>
              Sign Up
            </Button>
          </Form>

          <div className="auth-footer">
            <Text className="auth-footer-text">Already have an account? </Text>
            <Link to="/login" className="auth-link-bold">Sign in here</Link>
          </div>
          <div className="auth-footer" style={{ marginTop: 12 }}>
            <Link to="/" className="auth-back-link">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
