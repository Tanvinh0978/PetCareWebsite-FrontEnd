import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Tabs,
  Avatar,
  message,
  Spin,
  Row,
  Col,
  Tag,
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
  IdcardOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { staffService } from '@/services/staff.service';
import { useAuthStore } from '@/store/useAuthStore';
import { ImageUpload } from '@/components/common/ImageUpload';
import type { StaffDTO } from '@/types/staff.types';

const { Title, Text } = Typography;

const StaffProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'password' ? 'password' : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [staffData, setStaffData] = useState<StaffDTO | null>(null);

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
      const data = await staffService.getProfile();
      if (data) {
        setStaffData(data);
        profileForm.setFieldsValue({
          fullName: data.fullName || user?.name || '',
          email: data.email || user?.email || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          avatarUrl: data.avatarUrl || user?.avatarUrl || '',
          yearsOfExperience: data.yearsOfExperience ?? 0,
        });

        if (data.avatarUrl && accessToken && user && user.avatarUrl !== data.avatarUrl) {
          setAuth(accessToken, {
            ...user,
            avatarUrl: data.avatarUrl,
          });
        }
      }
    } catch (error: any) {
      console.warn('Failed to load staff profile:', error);
      profileForm.setFieldsValue({
        fullName: user?.name || '',
        email: user?.email || user?.login || '',
        phoneNumber: '',
        address: '',
        avatarUrl: user?.avatarUrl || '',
        yearsOfExperience: 0,
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
      await staffService.updateProfile({
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        address: values.address?.trim() || '',
        avatarUrl: values.avatarUrl?.trim() || '',
        yearsOfExperience: Number(values.yearsOfExperience) || 0,
      });

      message.success('Staff profile updated successfully! 🎉');

      // Update local state and auth store
      setStaffData((prev) =>
        prev
          ? {
              ...prev,
              fullName: values.fullName.trim(),
              phoneNumber: values.phoneNumber.trim(),
              address: values.address?.trim() || '',
              avatarUrl: values.avatarUrl?.trim() || '',
              yearsOfExperience: Number(values.yearsOfExperience) || 0,
            }
          : null
      );

      if (accessToken && user) {
        setAuth(accessToken, {
          ...user,
          name: values.fullName.trim(),
          avatarUrl: values.avatarUrl?.trim() || '',
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
      await staffService.changePassword({
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

  const watchedAvatarUrl = Form.useWatch('avatarUrl', profileForm);

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
          Staff Profile
        </Title>
        <Text type="secondary">
          Manage your personal information, profile photo, and security settings
        </Text>
      </div>

      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
        }}
        bodyStyle={{ padding: '24px 32px' }}
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
                <div style={{ paddingTop: 12 }}>
                  {/* Top user summary bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 24,
                      padding: '16px 20px',
                      background: '#f8fafc',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      marginBottom: 24,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Avatar
                      size={76}
                      src={watchedAvatarUrl || staffData?.avatarUrl || user?.avatarUrl}
                      style={{
                        backgroundColor: '#0284c7',
                        fontSize: 28,
                        border: '2px solid #38bdf8',
                        flexShrink: 0,
                      }}
                      icon={<UserOutlined />}
                    >
                      {(staffData?.fullName || user?.name || 'S').charAt(0).toUpperCase()}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                          {staffData?.fullName || user?.name || 'Staff Member'}
                        </Title>
                        <Tag color="cyan" icon={<IdcardOutlined />}>
                          {staffData?.roles?.join(', ') || 'Staff'}
                        </Tag>
                        <Tag color="green">
                          {staffData?.status || 'Active'}
                        </Tag>
                      </div>
                      <div style={{ marginTop: 4, color: '#64748b', fontSize: '0.9rem' }}>
                        <MailOutlined style={{ marginRight: 6 }} />
                        {staffData?.email || user?.email || user?.login}
                      </div>
                      {staffData?.yearsOfExperience !== undefined && (
                        <div style={{ marginTop: 4, color: '#64748b', fontSize: '0.85rem' }}>
                          <TrophyOutlined style={{ marginRight: 6, color: '#eab308' }} />
                          {staffData.yearsOfExperience} {staffData.yearsOfExperience === 1 ? 'year' : 'years'} of experience
                        </div>
                      )}
                    </div>
                  </div>

                  <Divider style={{ margin: '16px 0 24px' }} />

                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    requiredMark={false}
                  >
                    <Row gutter={24}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="avatarUrl"
                          label="Avatar Picture"
                          help="Upload your avatar (JPG, PNG, WEBP max 5MB)"
                        >
                          <ImageUpload
                            folder="avatars"
                            shape="circle"
                            width={130}
                            height={130}
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
                                placeholder="e.g. Tran Van A"
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
                                placeholder="e.g. 0901234567"
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
                                suffix={<SafetyCertificateOutlined style={{ color: '#0284c7' }} />}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="yearsOfExperience"
                              label="Years of Experience"
                              rules={[{ required: true, message: 'Please enter years of experience' }]}
                            >
                              <InputNumber
                                min={0}
                                max={50}
                                style={{ width: '100%', borderRadius: 8 }}
                                size="large"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24}>
                            <Form.Item name="address" label="Address">
                              <Input
                                prefix={<HomeOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="e.g. 456 Nguyen Trai, District 5"
                                size="large"
                                style={{ borderRadius: 8 }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Col>
                    </Row>

                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={savingProfile}
                        icon={<SaveOutlined />}
                        style={{ backgroundColor: '#0284c7', borderRadius: 8, padding: '0 28px' }}
                      >
                        Save Profile Changes
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
                    Keep your account secure by using a strong password with at least 6 characters.
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
                        style={{ backgroundColor: '#0284c7', borderRadius: 8, padding: '0 28px' }}
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
  );
};

export default StaffProfilePage;
