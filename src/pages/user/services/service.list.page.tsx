import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Empty, Input, Radio, Row, Spin, Tag } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { serviceService } from '@/services/service.service'
import { SERVICE_TYPE_LABELS, type ServiceDTO } from '@/types/service.types'
import { useAuthStore } from '@/store/useAuthStore'
import { getApiErrorMessage } from '@/utils/apiError'

const ServiceListPage: React.FC = () => {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const type = params.get('type') ?? 'all'
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [items, setItems] = useState<ServiceDTO[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    serviceService.fetchActive()
      .then(setItems)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const kw = keyword.trim().toLowerCase()
  const shown = useMemo(() => items.filter((s) =>
    (type === 'all' || s.serviceType === type) &&
    (!kw || s.name.toLowerCase().includes(kw) || (s.description ?? '').toLowerCase().includes(kw))), [items, type, kw])

  return (
    <div className="page-container">
      <h1>Our services</h1>
      {!isAuthenticated && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }}
          message={<>Sign in to book a service. <a onClick={() => navigate('/login')}>Sign in</a></>} />
      )}
      <Input.Search placeholder="Search by name or description" allowClear style={{ maxWidth: 420, marginBottom: 16 }}
        onSearch={setKeyword} onChange={(e) => !e.target.value && setKeyword('')} />
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={type}
          optionType="button"
          onChange={(e) => setParams(e.target.value === 'all' ? {} : { type: e.target.value })}
          options={[{ label: 'All', value: 'all' }, ...Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => ({ label, value }))]}
        />
      </div>
      {error && <Alert type="error" showIcon message={error} />}
      <Spin spinning={loading}>
        {!loading && !error && shown.length === 0 && <Empty description="No matching services" />}
        <Row gutter={[16, 16]}>
          {shown.map((s) => (
            <Col key={s.id} xs={24} md={12} lg={8}>
              <Card
                title={s.name}
                extra={<Tag color="green">{SERVICE_TYPE_LABELS[s.serviceType] ?? s.serviceType}</Tag>}
                actions={[<Button key="view" type="link" onClick={() => navigate(`/services/${s.id}`)}>View details</Button>]}
              >
                {s.description || 'No description.'}
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>
    </div>
  )
}

export default ServiceListPage
