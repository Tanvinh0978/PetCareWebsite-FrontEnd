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
import { ImageUpload } from '@/components/common/ImageUpload';

const { Title, Text } = Typography;

const CustomerProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'password' ? 'password' : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
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
        setProfileData(data);
        profileForm.setFieldsValue({
          fullName: data.fullName || user?.name || '',
          email: data.email || user?.email || user?.login || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          avatarUrl: data.avatarUrl || user?.avatarUrl || '',
        });
        if (accessToken && user && (data.avatarUrl !== user.avatarUrl || (data.fullName && data.fullName !== user.name))) {
          setAuth(accessToken, {
            ...user,
            avatarUrl: data.avatarUrl || user.avatarUrl,
            name: data.fullName || user.name,
          });
        }
      }
    } catch (error: any) {
      console.warn('Failed to load customer profile from API, using store fallback:', error);
      const fallback = {
        fullName: user?.name || '',
        email: user?.email || user?.login || '',
        phoneNumber: '',
        address: '',
        avatarUrl: user?.avatarUrl || '',
      };
      setProfileData(fallback);
      profileForm.setFieldsValue(fallback);
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

      const updated = {
        ...(profileData || {}),
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        address: values.address?.trim() || '',
        avatarUrl: values.avatarUrl?.trim() || '',
      };
      setProfileData(updated);

      // Update local auth store so user name and avatar change immediately across headers
      if (accessToken && user) {
        setAuth(accessToken, {
          ...user,
          name: values.fullName.trim(),
          avatarUrl: values.avatarUrl?.trim() || '',
        });
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update profile';
      message.error(msg);
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
      const msg = error?.response?.data?.message || error?.message || 'Failed to change password';
      message.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: 'var(--paper)',
        padding: '36px 16px 64px',
      }}
    >
      <div style={{ maxWidth: 850, margin: '0 auto' }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <Title level={2} style={{ margin: 0, color: 'var(--slate-900, #0f172a)' }}>
            Account Settings
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Manage your personal profile and account security
          </Text>
        </div>

        <Card
          style={{
            borderRadius: 16,
            boxShadow: 'var(--shadow-md)',
            border: '1px solid #e8ded6',
            backgroundColor: 'var(--paper-card, #ffffff)',
          }}
          bodyStyle={{ padding: '28px 36px' }}
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
              children: (
                <Spin spinning={loading} tip="Loading profile details...">
                  <div style={{ paddingTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                      <Avatar
                        size={80}
                        src={Form.useWatch('avatarUrl', profileForm) || profileData?.avatarUrl || user?.avatarUrl}
                        style={{ backgroundColor: '#3d2d23', fontSize: 32, border: '2px solid #c69f7b', flexShrink: 0 }}
                        icon={<UserOutlined />}
                      >
                        {(profileData?.fullName || user?.name || 'C').charAt(0)?.toUpperCase()}
                      </Avatar>
                      <div>
                        <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                          {profileData?.fullName || user?.name || 'Customer'}
                        </Title>
                        <Text type="secondary">{profileData?.email || user?.email || user?.login}</Text>
                      </div>
                    </div>

                    <Divider style={{ margin: '16px 0 24px' }} />

                    <Form
                      form={profileForm}
                      layout="vertical"
                      initialValues={{
                        fullName: user?.name || '',
                        email: user?.email || user?.login || '',
                        phoneNumber: '',
                        address: '',
                        avatarUrl: user?.avatarUrl || '',
                      }}
                      onFinish={handleUpdateProfile}
                    requiredMark={false}
                  >
                    <Row gutter={24}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="avatarUrl"
                          label="Profile Avatar"
                          help="Upload a photo (PNG, JPG under 5MB)"
                        >
                          <ImageUpload
                            folder="avatars"
                            shape="circle"
                            width={120}
                            height={120}
                            title="Upload Avatar"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={16}>
                        <Row gutter={16}>
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
                                style={{ borderRadius: 8, backgroundColor: 'var(--paper, #fdf9f3)' }}
                                suffix={<SafetyCertificateOutlined style={{ color: '#c69f7b' }} />}
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
                      </Col>
                    </Row>

                    <div style={{ marginTop: 12, textAlign: 'right' }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={savingProfile}
                        icon={<SaveOutlined />}
                        style={{ backgroundColor: '#3d2d23', borderColor: '#3d2d23', borderRadius: 8, padding: '0 28px' }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </Form>
                </div>
              </Spin>
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
                        style={{ backgroundColor: '#3d2d23', borderColor: '#3d2d23', borderRadius: 8, padding: '0 28px' }}
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
