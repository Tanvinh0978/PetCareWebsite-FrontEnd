import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { CalendarOutlined, ScissorOutlined, PlusOutlined } from '@ant-design/icons'
import OperationsDashboard from '@/components/dashboard/OperationsDashboard'

export default function StaffDashboardPage() {
  return (
    <section className="page wide">
      <OperationsDashboard
        role="staff"
        headerActions={
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link to="/staff/bookings">
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                style={{
                  backgroundColor: '#059669',
                  borderColor: '#059669',
                  borderRadius: 8,
                  fontWeight: 600,
                }}
              >
                Front Desk Bookings
              </Button>
            </Link>
            <Link to="/staff/grooming-tasks">
              <Button
                icon={<ScissorOutlined />}
                style={{
                  borderRadius: 8,
                  borderColor: '#059669',
                  color: '#059669',
                  fontWeight: 600,
                }}
              >
                Grooming Board
              </Button>
            </Link>
            <Link to="/staff/pets/new">
              <Button icon={<PlusOutlined />} style={{ borderRadius: 8 }}>
                Intake Pet
              </Button>
            </Link>
          </div>
        }
      />
    </section>
  )
}
