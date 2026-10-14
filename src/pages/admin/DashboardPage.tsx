import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { PlusOutlined, CalendarOutlined, AppstoreOutlined } from '@ant-design/icons'
import OperationsDashboard from '@/components/dashboard/OperationsDashboard'

export default function AdminDashboardPage() {
  return (
    <section className="page wide">
      <OperationsDashboard
        role="admin"
        headerActions={
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link to="/admin/bookings">
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
            <Link to="/admin/services/new">
              <Button icon={<PlusOutlined />} style={{ borderRadius: 8, fontWeight: 500 }}>
                Add Service
              </Button>
            </Link>
            <Link to="/admin/services">
              <Button icon={<AppstoreOutlined />} style={{ borderRadius: 8 }}>
                Manage Services
              </Button>
            </Link>
          </div>
        }
      />
    </section>
  )
}
