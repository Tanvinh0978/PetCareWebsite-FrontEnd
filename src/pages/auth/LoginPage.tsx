import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_BASE } from "@/auth/roles";
import { loginCustomer } from "@/api/authApi";
import { getErrorMessage } from "@/api/client";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await loginCustomer({ email: values.email, password: values.password });
      // Usually you'd store the JWT token here (res.result.token), but our UI is simple
      signIn("customer");
      message.success(res.message || "Welcome back! Logged in as customer");
      navigate(ROLE_BASE["customer"] || "/");
    } catch (error: any) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
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
        '@media (max-width: 768px)': { display: 'none' } // Simple responsive hide, though inline styles don't support media queries easily, we'll just let it flex on desktop.
      }} className="login-banner">
        <Title level={1} style={{ margin: 0, color: 'white', fontWeight: 'bold', fontSize: '3rem' }}>
          🐾 PetCare
        </Title>
        <p style={{ fontSize: '1.2rem', marginTop: 16, textAlign: 'center', maxWidth: '400px', opacity: 0.9 }}>
          Your trusted partner in professional pet grooming, boarding, and wellness.
        </p>
        <img 
          src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
          alt="Cute Dog" 
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
        <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', borderRadius: 12, border: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ margin: 0, color: '#1e293b' }}>
              Sign In
            </Title>
            <Text type="secondary">Welcome back! Please enter your details.</Text>
          </div>

          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Please input your Email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
            >
              <Input prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Email address" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your Password!' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Password" />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <Link to="#" style={{ fontSize: 14, color: '#059669', fontWeight: 500 }}>Forgot password?</Link>
            </div>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%', background: '#059669', borderColor: '#059669', height: '48px', fontSize: '16px', fontWeight: 600 }} loading={loading}>
                Sign In
              </Button>
            </Form.Item>
          </Form>
          
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text>Don't have an account? </Text>
            <Link to="/register" style={{ color: '#059669', fontWeight: 600 }}>Sign up now</Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/" style={{ color: '#64748b', fontSize: 14 }}>&larr; Back to Home</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
