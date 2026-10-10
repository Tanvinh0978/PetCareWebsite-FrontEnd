import React from 'react'
import { Modal, Tag, Descriptions, Typography, Divider } from 'antd'
import type { StaffDTO } from '@/types/staff.types'

const { Title, Text } = Typography

interface StaffDetailModalProps {
  staff: StaffDTO | null
  open: boolean
  onClose: () => void
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'Veterinarian':
      return 'cyan'
    case 'Pet Groomer':
      return 'purple'
    case 'Care Specialist':
      return 'green'
    case 'Facility Manager':
      return 'gold'
    case 'Receptionist':
      return 'blue'
    default:
      return 'default'
  }
}

export const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  staff,
  open,
  onClose,
}) => {
  if (!staff) return null

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#059669',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.1rem',
            }}
          >
            {staff.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {staff.fullName}
            </Title>
            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
              Staff Profile & Assignment Details
            </Text>
          </div>
        </div>
      }
      width={560}
      centered
    >
      <Divider style={{ margin: '14px 0 18px' }} />

      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Staff ID">
          <Text copyable style={{ fontSize: '0.85rem' }}>{staff.id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Role / Position">
          <Tag color={getRoleColor(staff.role)} style={{ fontSize: '0.85rem', padding: '2px 8px' }}>
            {staff.role}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          <a href={`mailto:${staff.email}`} style={{ color: 'var(--primary)' }}>
            {staff.email}
          </a>
        </Descriptions.Item>
        <Descriptions.Item label="Phone Number">
          <a href={`tel:${staff.phoneNumber}`} style={{ color: 'var(--primary)' }}>
            {staff.phoneNumber}
          </a>
        </Descriptions.Item>
        <Descriptions.Item label="Experience">
          <Text strong>{staff.yearsOfExperience} year(s)</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={staff.status === 'Active' ? 'success' : 'default'}>
            {staff.status}
          </Tag>
        </Descriptions.Item>
        {staff.createdAt && (
          <Descriptions.Item label="Joined Date">
            {new Date(staff.createdAt).toLocaleDateString()}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  )
}

export default StaffDetailModal
