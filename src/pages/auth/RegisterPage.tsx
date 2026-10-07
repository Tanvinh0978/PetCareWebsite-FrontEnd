import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_BASE } from "@/auth/roles";
import { registerCustomer } from "@/api/authApi";
import { getErrorMessage } from "@/api/client";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const { signIn } = useAuth();
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
        phoneNumber: values.phone
      });
      message.success(res.message || "Registration successful! Please check your email for OTP.");
      navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`);
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
      }} className="register-banner">
        <Title level={1} style={{ margin: 0, color: 'white', fontWeight: 'bold', fontSize: '3rem' }}>
          🐾 PetCare
        </Title>
        <p style={{ fontSize: '1.2rem', marginTop: 16, textAlign: 'center', maxWidth: '400px', opacity: 0.9 }}>
          Join us today to book grooming, boarding, and veterinary services for your furry friends.
        </p>
        <img 
          src="https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
          alt="Cute Dog and Cat" 
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
              Create an Account
            </Title>
            <Text type="secondary">Sign up to get started</Text>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            scrollToFirstError
          >
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Please input your full name!', whitespace: true }]}
            >
              <Input prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Full Name" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your Email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input prefix={<MailOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Email address" />
            </Form.Item>
            
            <Form.Item
              name="phone"
              rules={[{ required: true, message: 'Please input your phone number!' }]}
            >
              <Input prefix={<PhoneOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Phone Number" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your Password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your Password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Confirm Password" />
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 16 }}>
              <Button type="primary" htmlType="submit" style={{ width: '100%', background: '#059669', borderColor: '#059669', height: '48px', fontSize: '16px', fontWeight: 600 }} loading={loading}>
                Sign Up
              </Button>
            </Form.Item>
          </Form>
          
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text>Already have an account? </Text>
            <Link to="/login" style={{ color: '#059669', fontWeight: 600 }}>Sign in here</Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/" style={{ color: '#64748b', fontSize: 14 }}>&larr; Back to Home</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
