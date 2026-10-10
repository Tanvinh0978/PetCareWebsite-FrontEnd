import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Typography, message, Checkbox } from "antd";
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_BASE } from "@/auth/roles";
import { loginCustomer } from "@/api/authApi";
import { getErrorMessage } from "@/api/client";
import "./auth.css";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await loginCustomer({ email: values.email, password: values.password });
      if (res.result?.customerId) {
        localStorage.setItem('petcare.customerId', res.result.customerId);
      }
      signIn("customer");
      const userName = res.result?.fullName || "there";
      message.success(`Hello, ${userName}! Welcome back.`);
      navigate(ROLE_BASE["customer"] || "/");
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
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80")' }}
        />
        <div className="auth-left-overlay" />

        <div className="auth-left-content">
          <div className="auth-left-logo">
            🐾 PetCare
          </div>
          <p className="auth-left-sub">
            Your trusted partner in professional pet grooming, boarding, and wellness.
          </p>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <Title level={2} className="auth-form-title">🐾 Welcome Back</Title>
            <Text className="auth-form-subtitle">
              Please enter your details to sign in.
            </Text>
          </div>

          <Form name="login" onFinish={onFinish} layout="vertical" requiredMark={false}>
            <Form.Item name="email" label="Email address"
              rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Invalid email' }]}
            >
              <Input className="auth-input"
                prefix={<MailOutlined className="auth-input-icon" />}
                placeholder="you@example.com"
              />
            </Form.Item>

            <Form.Item name="password" label="Password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password className="auth-input"
                prefix={<LockOutlined className="auth-input-icon" />}
                placeholder="Enter your password"
                iconRender={v => v ? <EyeTwoTone twoToneColor="#059669" /> : <EyeInvisibleOutlined style={{ color: '#9ca3af' }} />}
              />
            </Form.Item>

            <div className="auth-row">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <Link to="#" className="auth-link">Forgot password?</Link>
            </div>

            <Button type="primary" htmlType="submit" className="auth-btn-primary" loading={loading} block>
              Sign In
            </Button>
          </Form>

          <div className="auth-footer">
            <Text className="auth-footer-text">Don't have an account? </Text>
            <Link to="/register" className="auth-link-bold">Sign up now</Link>
          </div>

          <div className="auth-footer" style={{ marginTop: 12 }}>
            <Link to="/" className="auth-back-link">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
