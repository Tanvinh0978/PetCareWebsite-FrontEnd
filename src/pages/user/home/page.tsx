import { Card, Col, Row, Typography, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TYPE_LABELS } from '@/types/service.types'

const blurbs: Record<string, string> = {
  Grooming: 'Bathing, drying and styling for every breed.',
  Boarding: 'A private room and someone watching all day.',
  Diet: 'Meals matched to weight and health.',
  Care: 'Daily monitoring with reports for you.',
}

const HomePage = () => {
  const navigate = useNavigate()
  return (
    <div className="page-container">
      <section className="hero">
        <Typography.Title>Away all day? We will look after your pet.</Typography.Title>
        <Typography.Paragraph>
          Pick a service, pick a time, bring your pet in. They get cleaned up, fed on schedule,
          and you receive photos and notes after every visit.
        </Typography.Paragraph>
        <Button type="primary" size="large" onClick={() => navigate('/services')}>Browse services</Button>
      </section>
      <Row gutter={[16, 16]}>
        {Object.keys(SERVICE_TYPE_LABELS).map((type) => (
          <Col key={type} xs={24} sm={12} lg={6}>
            <Card hoverable title={SERVICE_TYPE_LABELS[type]} onClick={() => navigate(`/services?type=${type}`)}>
              {blurbs[type]}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default HomePage
