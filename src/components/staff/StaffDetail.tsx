import React, { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  CrownOutlined,
  ScissorOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { staffService } from '@/services/staff.service'
import type { StaffDTO } from '@/types/staff.types'
import { getApiErrorMessage } from '@/utils/apiError'

interface StaffDetailProps {
  backTo?: string
  editTo?: (id: string) => string
}

const getRoleConfig = (roleName: string) => {
  const lower = roleName.toLowerCase()
  if (lower.includes('admin')) {
    return {
      bg: '#fef2f2',
      text: '#991b1b',
      border: '#fecaca',
      icon: <CrownOutlined />,
      desc: 'Full administrative access across sanctuary operations, users, and system settings.',
    }
  }
  if (lower.includes('receptionist')) {
    return {
      bg: '#eff6ff',
      text: '#1d4ed8',
      border: '#bfdbfe',
      icon: <PhoneOutlined />,
      desc: 'Front desk guest intake, appointment coordination, check-ins, and invoices.',
    }
  }
  if (lower.includes('boarding')) {
    return {
      bg: '#f0fdf4',
      text: '#15803d',
      border: '#bbf7d0',
      icon: <HomeOutlined />,
      desc: 'Suite accommodations supervision, feeding routines, and daily care record logs.',
    }
  }
  if (lower.includes('grooming')) {
    return {
      bg: '#faf5ff',
      text: '#7e22ce',
      border: '#e9d5ff',
      icon: <ScissorOutlined />,
      desc: 'Luxury spa bathing, styling procedures, hygiene maintenance, and task updates.',
    }
  }
  return {
    bg: '#faf6f0',
    text: '#785839',
    border: '#eeddc8',
    icon: <UserOutlined />,
    desc: 'Sanctuary operations team member.',
  }
}

export default function StaffDetail({ backTo, editTo }: StaffDetailProps) {
  const { id = '' } = useParams()
  const location = useLocation()
  const isStaff = location.pathname.startsWith('/staff')
  const defaultBackTo = isStaff ? '/staff/staff' : '/admin/staff'
  const resolvedBackTo = backTo || defaultBackTo
  const resolvedEditTo = editTo || ((sid: string) => `${defaultBackTo}/${sid}/edit`)

  const [staff, setStaff] = useState<StaffDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    staffService
      .fetchById(id)
      .then((data) => {
        if (!cancelled) setStaff(data)
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <section className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Spin size="large" tip="Loading staff dossier..." />
      </section>
    )
  }

  if (error || !staff) {
    return (
      <section className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 12,
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {error || 'Staff member not found.'}
        </div>
        <Link
          to={resolvedBackTo}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.45rem 1.1rem',
            borderRadius: 8,
            backgroundColor: '#ffffff',
            border: '1px solid #e8ded6',
            color: '#3d2d23',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeftOutlined /> Back to staff list
        </Link>
      </section>
    )
  }

  return (
    <section className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Link
          to={resolvedBackTo}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0.45rem 1.15rem',
            borderRadius: 999,
            backgroundColor: '#ffffff',
            border: '1.5px solid #eeddc8',
            color: '#785839',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(61,45,35,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 12 }} />
          <span>Back to staff list</span>
        </Link>

        {resolvedEditTo && (
          <Link
            to={resolvedEditTo(staff.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '0.45rem 1.35rem',
              borderRadius: 999,
              backgroundColor: '#3d2d23',
              border: '1px solid #3d2d23',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(61,45,35,0.18)',
            }}
          >
            <EditOutlined style={{ fontSize: 13 }} />
            <span>Edit Staff Profile</span>
          </Link>
        )}
      </div>

      <div
        style={{
          borderRadius: 20,
          border: '1.5px solid #eeddc8',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px -2px rgba(61,45,35,0.06)',
          padding: '32px 36px',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            flexWrap: 'wrap',
            paddingBottom: 24,
            borderBottom: '1px solid #f1ece7',
          }}
        >
          <div style={{ position: 'relative' }}>
            {staff.avatarUrl ? (
              <img
                src={staff.avatarUrl}
                alt={staff.fullName}
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #c69f7b',
                  boxShadow: '0 4px 14px rgba(120,88,57,0.18)',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: '50%',
                  backgroundColor: '#faf5ee',
                  border: '3px solid #c69f7b',
                  color: '#3d2d23',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '2.5rem',
                  boxShadow: '0 4px 14px rgba(120,88,57,0.18)',
                }}
              >
                {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'S'}
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                background: '#3d2d23',
                color: '#ffffff',
                borderRadius: '50%',
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                fontSize: 13,
              }}
              title="Staff Specialist"
            >
              <SafetyCertificateOutlined />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.85rem',
                  borderRadius: 999,
                  backgroundColor: '#faf6f0',
                  color: '#785839',
                  border: '1px solid #eeddc8',
                }}
              >
                💼 Sanctuary Specialist
              </span>

              {staff.status === 'Active' ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    padding: '0.3rem 0.85rem',
                    borderRadius: 999,
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  <CheckCircleOutlined /> Active Account
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    padding: '0.3rem 0.85rem',
                    borderRadius: 999,
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                  }}
                >
                  <CloseCircleOutlined /> Suspended
                </span>
              )}

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.3rem 0.85rem',
                  borderRadius: 999,
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                }}
              >
                <CalendarOutlined />
                <span>{staff.yearsOfExperience} {staff.yearsOfExperience === 1 ? 'Year' : 'Years'} Experience</span>
              </span>
            </div>

            <h1
              style={{
                margin: '6px 0 8px',
                fontSize: '2.25rem',
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#3d2d23',
                lineHeight: 1.25,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              {staff.fullName}
            </h1>

            <div style={{ color: '#8c735f', fontSize: '0.85rem' }}>
              Staff ID: <code style={{ backgroundColor: '#faf6f0', padding: '2px 6px', borderRadius: 6, color: '#5c4230' }}>{staff.id}</code>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 20 }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#a88a6d',
              letterSpacing: '0.05em',
              marginBottom: 10,
            }}
          >
            Assigned Job Roles
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {staff.roles && staff.roles.length > 0 ? (
              staff.roles.map((r) => {
                const conf = getRoleConfig(r)
                return (
                  <span
                    key={r}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '0.4rem 1rem',
                      borderRadius: 999,
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      backgroundColor: conf.bg,
                      color: conf.text,
                      border: `1.5px solid ${conf.border}`,
                    }}
                  >
                    {conf.icon}
                    <span>{r}</span>
                  </span>
                )
              })
            ) : (
              <span style={{ color: '#998373', fontSize: '0.9rem', fontStyle: 'italic' }}>
                No specific roles assigned.
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: 20,
          border: '1.5px solid #eeddc8',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px -2px rgba(61,45,35,0.06)',
          padding: '28px 32px',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '1px solid #f1ece7',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.35rem',
              color: '#3d2d23',
              fontWeight: 700,
            }}
          >
            Contact & Employment Dossier
          </h2>
          <p style={{ margin: '4px 0 0', color: '#8c735f', fontSize: '0.875rem' }}>
            Verified communication channels and sanctuary assignment records.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
          }}
        >
          <div
            style={{
              padding: '16px 18px',
              backgroundColor: '#faf6f0',
              borderRadius: 14,
              border: '1px solid #eeddc8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#785839', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              <MailOutlined style={{ fontSize: 14, color: '#c69f7b' }} />
              <span>Email Address</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3d2d23', wordBreak: 'break-all' }}>
              <a href={`mailto:${staff.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {staff.email}
              </a>
            </div>
          </div>

          <div
            style={{
              padding: '16px 18px',
              backgroundColor: '#faf6f0',
              borderRadius: 14,
              border: '1px solid #eeddc8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#785839', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              <PhoneOutlined style={{ fontSize: 14, color: '#c69f7b' }} />
              <span>Phone Number</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3d2d23' }}>
              <a href={`tel:${staff.phoneNumber}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {staff.phoneNumber || '—'}
              </a>
            </div>
          </div>

          <div
            style={{
              padding: '16px 18px',
              backgroundColor: '#faf6f0',
              borderRadius: 14,
              border: '1px solid #eeddc8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#785839', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              <CalendarOutlined style={{ fontSize: 14, color: '#c69f7b' }} />
              <span>Sanctuary Experience</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3d2d23' }}>
              {staff.yearsOfExperience} {staff.yearsOfExperience === 1 ? 'Year' : 'Years'}
            </div>
          </div>

          <div
            style={{
              padding: '16px 18px',
              backgroundColor: '#faf6f0',
              borderRadius: 14,
              border: '1px solid #eeddc8',
              gridColumn: staff.address ? '1 / -1' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#785839', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              <HomeOutlined style={{ fontSize: 14, color: '#c69f7b' }} />
              <span>Residential Address</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#3d2d23' }}>
              {staff.address || 'No residential address on file.'}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
