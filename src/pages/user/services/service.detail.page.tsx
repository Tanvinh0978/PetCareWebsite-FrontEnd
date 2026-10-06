import React, { useEffect, useState } from 'react'
import { Alert, Button, Descriptions, Spin, Tag, Typography } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { serviceService } from '@/services/service.service'
import ServicePriceTable from '@/components/service.price.table'
import { SERVICE_TYPE_LABELS, type ServiceDetailDTO } from '@/types/service.types'
import { getApiErrorMessage } from '@/utils/apiError'

const ServiceDetailPage: React.FC = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState<ServiceDetailDTO | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    serviceService.fetchById(id).then((res) => setService(res.result)).catch((e) => setError(getApiErrorMessage(e)))
  }, [id])

  return (
    <div className="page-container">
      <Button onClick={() => navigate('/services')} style={{ marginBottom: 16 }}>Back to services</Button>
      {error && <Alert type="error" showIcon message={error} />}
      {!service && !error && <Spin />}
      {service && (
        <>
          <Typography.Title>{service.name}</Typography.Title>
          <Descriptions column={1} bordered style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Type"><Tag color="green">{SERVICE_TYPE_LABELS[service.serviceType] ?? service.serviceType}</Tag></Descriptions.Item>
            <Descriptions.Item label="Description">{service.description || 'No description.'}</Descriptions.Item>
          </Descriptions>
          <Typography.Title level={4}>Pricing</Typography.Title>
          <ServicePriceTable prices={service.prices} />
        </>
      )}
    </div>
  )
}

export default ServiceDetailPage
