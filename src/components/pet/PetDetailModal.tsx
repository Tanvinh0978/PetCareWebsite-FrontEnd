import React from 'react'
import { Modal, Tag, Descriptions, Typography, Divider } from 'antd'
import type { PetDTO } from '@/types/pet.types'
import { isCat, getPetSpeciesLabel, getPetSpeciesIcon } from '@/types/pet.types'

const { Title, Text } = Typography

interface PetDetailModalProps {
  pet: PetDTO | null
  open: boolean
  onClose: () => void
}

export const PetDetailModal: React.FC<PetDetailModalProps> = ({ pet, open, onClose }) => {
  if (!pet) return null

  const isPetCat = isCat(pet.species)
  const speciesLabel = getPetSpeciesLabel(pet.species)
  const speciesIcon = getPetSpeciesIcon(pet.species)

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>{speciesIcon}</span>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {pet.name}
            </Title>
            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
              Pet Details & Health Info
            </Text>
          </div>
        </div>
      }
      width={560}
      centered
    >
      <Divider style={{ margin: '12px 0 16px' }} />

      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Pet ID">
          <Text copyable style={{ fontSize: '0.85rem' }}>{pet.id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Species">
          <Tag color={isPetCat ? 'purple' : 'blue'}>
            {speciesIcon} {speciesLabel}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Breed">
          {pet.breed || <Text type="secondary">Not specified</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Weight">
          <Text strong>{pet.weight} kg</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Age">
          {pet.age !== undefined && pet.age !== null ? (
            `${pet.age} year(s) old`
          ) : (
            <Text type="secondary">Not specified</Text>
          )}
        </Descriptions.Item>
        {pet.ownerName && (
          <Descriptions.Item label="Owner (Customer)">
            <Text strong>{pet.ownerName}</Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Status">
          <Tag color={pet.isActive ? 'success' : 'default'}>
            {pet.isActive ? 'Active' : 'Inactive'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Health & Diet Notes">
          {pet.healthNotes ? (
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                whiteSpace: 'pre-line',
              }}
            >
              {pet.healthNotes}
            </div>
          ) : (
            <Text type="secondary">No health notes recorded</Text>
          )}
        </Descriptions.Item>
        {pet.createdAt && (
          <Descriptions.Item label="Registered Date">
            {new Date(pet.createdAt).toLocaleDateString()}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  )
}

export default PetDetailModal
