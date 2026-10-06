import React, { useCallback, useEffect, useState } from 'react'
import { Alert, App, Button, Card, Descriptions, Space, Spin, Tag } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { serviceService } from '@/services/service.service'
import ServicePriceTable from '@/components/service.price.table'
import ServiceFormModal from '@/pages/admin/service/components/service.form.modal'
import { SERVICE_TYPE_LABELS, type ServiceDetailDTO } from '@/types/service.types'
import { getApiErrorMessage } from '@/utils/apiError'

const AdminServiceDetail: React.FC = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [service, setService] = useState<ServiceDetailDTO | null>(null)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)

  const load = useCallback(() => {
    serviceService.fetchById(id).then((res) => setService(res.result)).catch((e) => { setError(getApiErrorMessage(e)); message.error(getApiErrorMessage(e)) })
  }, [id, message])

  useEffect(() => { load() }, [load])

  return (
    <Card
      title={service?.name ?? 'Service'}
      extra={
        <Space>
          <Button onClick={() => navigate('/admin/services')}>Back</Button>
          <Button type="primary" disabled={!service} onClick={() => setEditOpen(true)}>Edit</Button>
        </Space>
      }
    >
      {error && <Alert type="error" showIcon message={error} />}
      {!service && !error && <Spin />}
      {service && (
        <>
          <Descriptions column={1} bordered style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Type"><Tag color="green">{SERVICE_TYPE_LABELS[service.serviceType] ?? service.serviceType}</Tag></Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={service.isActive ? 'green' : 'default'}>{service.isActive ? 'Active' : 'Inactive'}</Tag></Descriptions.Item>
            <Descriptions.Item label="Description">{service.description || 'No description.'}</Descriptions.Item>
          </Descriptions>
          <ServicePriceTable prices={service.prices} />
        </>
      )}
      <ServiceFormModal
        open={editOpen}
        service={service}
        onClose={() => setEditOpen(false)}
        onSuccess={() => { setEditOpen(false); load() }}
      />
    </Card>
  )
}

export default AdminServiceDetail
