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
  const lower = role.toLowerCase()
  if (lower.includes('admin')) return 'red'
  if (lower.includes('receptionist')) return 'blue'
  if (lower.includes('boarding')) return 'green'
  if (lower.includes('grooming')) return 'purple'
  return 'default'
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
        <Descriptions.Item label="Assigned Roles">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {staff.roles && staff.roles.length > 0 ? (
              staff.roles.map((r) => (
                <Tag key={r} color={getRoleColor(r)} style={{ fontSize: '0.85rem', padding: '2px 8px' }}>
                  {r}
                </Tag>
              ))
            ) : (
              <Text type="secondary">No roles assigned</Text>
            )}
          </div>
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
        {staff.address && (
          <Descriptions.Item label="Address">
            <Text>{staff.address}</Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Experience">
          <Text strong>{staff.yearsOfExperience} year(s)</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={staff.status === 'Active' ? 'success' : 'default'}>
            {staff.status}
          </Tag>
        </Descriptions.Item>
        {staff.createdAt && (
          <Descriptions.Item label="Created At">
            <Text>{new Date(staff.createdAt).toLocaleDateString()}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  )
}

export default StaffDetailModal
