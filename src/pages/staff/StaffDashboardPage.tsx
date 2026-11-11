import React from 'react'
import { Link } from 'react-router-dom'
import { CalendarOutlined, ScissorOutlined, PlusOutlined } from '@ant-design/icons'
import OperationsDashboard from '@/components/dashboard/OperationsDashboard'

export default function StaffDashboardPage() {
  return (
    <section className="page wide">
      <OperationsDashboard
        role="staff"
        headerActions={
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/staff/bookings"
              className="btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.55rem 1.3rem',
                borderRadius: 999,
                backgroundColor: '#3d2d23',
                color: '#ffffff',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(61,45,35,0.18)',
                textDecoration: 'none',
                fontSize: '0.88rem',
              }}
            >
              <CalendarOutlined style={{ fontSize: 13 }} />
              <span>Front Desk Bookings</span>
            </Link>
            <Link
              to="/staff/grooming-tasks"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.55rem 1.15rem',
                borderRadius: 999,
                backgroundColor: '#ffffff',
                color: '#785839',
                border: '1.5px solid #eeddc8',
                fontWeight: 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(61,45,35,0.04)',
              }}
            >
              <ScissorOutlined style={{ fontSize: 13 }} />
              <span>Grooming Board</span>
            </Link>
            <Link
              to="/staff/pets/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.55rem 1.15rem',
                borderRadius: 999,
                backgroundColor: '#ffffff',
                color: '#785839',
                border: '1.5px solid #eeddc8',
                fontWeight: 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(61,45,35,0.04)',
              }}
            >
              <PlusOutlined style={{ fontSize: 13 }} />
              <span>Intake Pet</span>
            </Link>
          </div>
        }
      />
    </section>
  )
}
