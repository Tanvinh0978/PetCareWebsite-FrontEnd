import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Tabs,
  Avatar,
  message,
  Spin,
  Row,
  Col,
  Space,
  Divider,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  HomeOutlined,
  MailOutlined,
  SaveOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { customerService } from '@/services/customer.service';
import { useAuthStore } from '@/store/useAuthStore';

const { Title, Text } = Typography;

const CustomerProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'password' ? 'password' : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'password') {
      setActiveTab('password');
    }
  }, [searchParams]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await customerService.getProfile();
      if (data) {
        profileForm.setFieldsValue({
          fullName: data.fullName || user?.name || '',
          email: data.email || user?.email || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          avatarUrl: data.avatarUrl || '',
        });
      }
    } catch (error: any) {
      // Fallback to store data if api has an issue
      profileForm.setFieldsValue({
        fullName: user?.name || '',
        email: user?.email || user?.login || '',
        phoneNumber: '',
        address: '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (values: any) => {
    setSavingProfile(true);
    try {
      await customerService.updateProfile({
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        address: values.address?.trim() || '',
        avatarUrl: values.avatarUrl?.trim() || '',
      });
      message.success('Profile updated successfully! 🎉');

      // Update local auth store so user name changes immediately across headers
      if (accessToken && user) {
        setAuth(accessToken, {
          ...user,
          name: values.fullName.trim(),
        });
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    setSavingPassword(true);
    try {
      await customerService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });
      message.success('Password changed successfully! 🔒');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const pawBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23244c3c' fill-opacity='0.05' d='M12,2C10.5,2 9,3 9,4.5C9,5 9,6.5 12,9C15,6.5 15,5 15,4.5C15,3 13.5,2 12,2M6,6C4.5,6 3,7 3,8.5C3,9 3,10.5 6,13C9,10.5 9,9 9,8.5C9,7 7.5,6 6,6M18,6C16.5,6 15,7 15,8.5C15,9 15,10.5 18,13C21,10.5 21,9 21,8.5C21,7 19.5,6 18,6M12,11.5C9,11.5 5,14.5 5,19C5,21.5 8.5,22 12,22C15.5,22 19,21.5 19,19C19,14.5 15,11.5 12,11.5Z'/%3E%3C/svg%3E")`;

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: '#f8fafc',
        padding: '36px 16px 64px',
      }}
    >
      <div style={{ maxWidth: 850, margin: '0 auto' }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <Title level={2} style={{ margin: 0, color: '#0f172a' }}>
            Account Settings
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Manage your personal profile and account security
          </Text>
        </div>

        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            backgroundImage: pawBg,
            backgroundSize: '48px 48px',
          }}
          bodyStyle={{ padding: '28px 36px', background: 'transparent' }}
        >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setSearchParams(key === 'password' ? { tab: 'password' } : {});
          }}
          items={[
            {
              key: 'profile',
              label: (
                <span style={{ fontSize: 15 }}>
                  <UserOutlined /> Personal Profile
                </span>
              ),
              children: loading ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <div style={{ paddingTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                    <Avatar
                      size={72}
                      style={{ backgroundColor: '#059669', fontSize: 28 }}
                      icon={<UserOutlined />}
                    >
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div>
                      <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                        {user?.name || 'Customer'}
                      </Title>
                      <Text type="secondary">{user?.email || user?.login}</Text>
                    </div>
                  </div>

                  <Divider style={{ margin: '16px 0 24px' }} />

                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    requiredMark={false}
                  >
                    <Row gutter={20}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="fullName"
                          label="Full Name"
                          rules={[{ required: true, message: 'Please enter your full name' }]}
                        >
                          <Input
                            prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="e.g. John Doe"
                            size="large"
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="phoneNumber"
                          label="Phone Number"
                          rules={[
                            { required: true, message: 'Please enter your phone number' },
                            { pattern: /^[0-9+ ]{8,15}$/, message: 'Please enter a valid phone number' },
                          ]}
                        >
                          <Input
                            prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="e.g. 0912345678"
                            size="large"
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item name="email" label="Email Address">
                          <Input
                            prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                            disabled
                            size="large"
                            style={{ borderRadius: 8, backgroundColor: '#f1f5f9' }}
                            suffix={<SafetyCertificateOutlined style={{ color: '#059669' }} />}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item name="address" label="Address">
                          <Input
                            prefix={<HomeOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="e.g. 123 Nguyen Hue, District 1"
                            size="large"
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <div style={{ marginTop: 12, textAlign: 'right' }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={savingProfile}
                        icon={<SaveOutlined />}
                        style={{ backgroundColor: '#059669', borderRadius: 8, padding: '0 28px' }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </Form>
                </div>
              ),
            },
            {
              key: 'password',
              label: (
                <span style={{ fontSize: 15 }}>
                  <LockOutlined /> Change Password
                </span>
              ),
              children: (
                <div style={{ paddingTop: 16, maxWidth: 500 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                    Ensure your account is using a secure password with at least 6 characters.
                  </Text>

                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                  >
                    <Form.Item
                      name="currentPassword"
                      label="Current Password"
                      rules={[{ required: true, message: 'Please enter your current password' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                        placeholder="Enter current password"
                        size="large"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="newPassword"
                      label="New Password"
                      rules={[
                        { required: true, message: 'Please enter a new password' },
                        { min: 6, message: 'Password must be at least 6 characters' },
                      ]}
                    >
                      <Input.Password
                        prefix={<KeyOutlined style={{ color: '#94a3b8' }} />}
                        placeholder="Enter new password (min. 6 characters)"
                        size="large"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirmNewPassword"
                      label="Confirm New Password"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Please confirm your new password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('The two passwords do not match!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<KeyOutlined style={{ color: '#94a3b8' }} />}
                        placeholder="Re-enter new password"
                        size="large"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <div style={{ marginTop: 24 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={savingPassword}
                        icon={<SaveOutlined />}
                        style={{ backgroundColor: '#059669', borderRadius: 8, padding: '0 28px' }}
                      >
                        Update Password
                      </Button>
                    </div>
                  </Form>
                </div>
              ),
            },
          ]}
        />
      </Card>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
