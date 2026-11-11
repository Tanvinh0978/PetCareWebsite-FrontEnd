import React, { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { App, Select, Spin } from 'antd'
import {
  ArrowLeftOutlined,
  CrownOutlined,
  HomeOutlined,
  PhoneOutlined,
  ScissorOutlined,
  UserOutlined,
  CheckOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { staffService } from '@/services/staff.service'
import { roleService } from '@/services/role.service'
import type { RoleDTO } from '@/types/role.types'
import { getApiErrorMessage } from '@/utils/apiError'

const getRoleIcon = (roleName: string) => {
  const lower = roleName.toLowerCase()
  if (lower.includes('admin')) return <CrownOutlined />
  if (lower.includes('receptionist')) return <PhoneOutlined />
  if (lower.includes('boarding')) return <HomeOutlined />
  if (lower.includes('grooming')) return <ScissorOutlined />
  return <UserOutlined />
}

const AdminStaffFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const editing = Boolean(id)
  const baseStaffPath = location.pathname.startsWith('/staff') ? '/staff/staff' : '/admin/staff'

  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [yearsOfExperience, setYearsOfExperience] = useState<number | string>(1)
  const [status, setStatus] = useState<number>(0)

  const [roles, setRoles] = useState<RoleDTO[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoadingRoles(true)
    roleService
      .getRoles()
      .then((data) => {
        if (!cancelled) {
          setRoles(data)
        }
      })
      .catch((err) => {
        console.warn('Could not fetch roles from API, using default roles:', err)
        if (!cancelled) {
          setRoles([
            { id: 'A0000000-0000-0000-0000-000000000001', roleName: 'Admin', totalPermissions: 27 },
            { id: 'A0000000-0000-0000-0000-000000000002', roleName: 'Receptionist', totalPermissions: 16 },
            { id: 'A0000000-0000-0000-0000-000000000003', roleName: 'Boarding Staff', totalPermissions: 9 },
            { id: 'A0000000-0000-0000-0000-000000000004', roleName: 'Grooming Staff', totalPermissions: 4 },
          ])
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRoles(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    staffService
      .fetchById(id)
      .then((st) => {
        setFullName(st.fullName)
        setEmail(st.email)
        setPhoneNumber(st.phoneNumber)
        setAddress(st.address || '')
        setYearsOfExperience(st.yearsOfExperience)
        setStatus(st.status === 'Active' ? 0 : 1)
        if (st.roleIds && st.roleIds.length > 0) {
          setSelectedRoleIds(st.roleIds)
        }
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (editing && roles.length > 0 && selectedRoleIds.length === 0 && id) {
      staffService
        .fetchById(id)
        .then((st) => {
          if (st.roles && st.roles.length > 0) {
            const matchedIds = roles
              .filter((r) => st.roles.includes(r.roleName))
              .map((r) => r.id)
            if (matchedIds.length > 0) {
              setSelectedRoleIds(matchedIds)
            }
          }
        })
        .catch(() => {})
    }
  }, [editing, roles, id, selectedRoleIds.length])

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId],
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanName = fullName.trim()
    if (!cleanName) {
      setError('Full name is required.')
      return
    }

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setError('Email address is required.')
      return
    }

    const cleanPhone = phoneNumber.trim()
    if (!cleanPhone) {
      setError('Phone number is required.')
      return
    }

    if (!editing && !password) {
      setError('Password is required for a new staff account (minimum 6 characters).')
      return
    }

    if (selectedRoleIds.length === 0) {
      setError('Please assign at least one role to this staff member.')
      return
    }

    const numExp = Number(yearsOfExperience)
    if (isNaN(numExp) || numExp < 0) {
      setError('Years of experience must be 0 or greater.')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await staffService.update(id as string, {
          fullName: cleanName,
          phoneNumber: cleanPhone,
          address: address.trim() || undefined,
          yearsOfExperience: numExp,
          status,
          roleIds: selectedRoleIds,
        })
        message.success(`Staff member "${cleanName}" updated successfully.`)
      } else {
        await staffService.create({
          fullName: cleanName,
          email: cleanEmail,
          phoneNumber: cleanPhone,
          address: address.trim() || undefined,
          password,
          yearsOfExperience: numExp,
          roleIds: selectedRoleIds,
        })
        message.success(`Staff member "${cleanName}" created successfully.`)
      }
      navigate(baseStaffPath)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page" style={{ maxWidth: '780px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.1rem',
              color: '#3d2d23',
              fontWeight: 700,
            }}
          >
            {editing ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h1>
          <p style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            {editing
              ? 'Update profile details, contact information, and role assignments.'
              : 'Fill out the form below to register a new sanctuary staff account.'}
          </p>
        </div>
        <Link
          to={baseStaffPath}
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
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <Spin size="large" tip="Loading staff details..." />
        </div>
      )}

      <form onSubmit={onSubmit} hidden={loading}>
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.9rem',
            }}
          >
            <InfoCircleOutlined style={{ fontSize: 16 }} />
            <span>{error}</span>
          </div>
        )}

        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #eeddc8',
            borderRadius: '20px',
            padding: '32px 36px',
            boxShadow: '0 4px 20px rgba(61, 45, 35, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.35rem',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#3d2d23',
                marginBottom: '0.45rem',
              }}
            >
              Full Name <span style={{ color: '#dc2626' }}>*</span>
            </span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
              style={{
                border: '1.5px solid #eeddc8',
                borderRadius: '10px',
                padding: '0.7rem 0.95rem',
                width: '100%',
                fontSize: '0.92rem',
                color: '#3d2d23',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <span
                style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#3d2d23',
                  marginBottom: '0.45rem',
                }}
              >
                Email Address <span style={{ color: '#dc2626' }}>*</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex.morgan@havenhound.com"
                disabled={editing}
                required
                style={{
                  border: '1.5px solid #eeddc8',
                  borderRadius: '10px',
                  padding: '0.7rem 0.95rem',
                  width: '100%',
                  fontSize: '0.92rem',
                  backgroundColor: editing ? '#fdf9f3' : '#ffffff',
                  color: editing ? '#785839' : '#3d2d23',
                  cursor: editing ? 'not-allowed' : 'text',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {editing && (
                <span style={{ fontSize: '0.78rem', color: '#8c735f', display: 'block', marginTop: '0.35rem' }}>
                  Official login email address cannot be changed.
                </span>
              )}
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#3d2d23',
                  marginBottom: '0.45rem',
                }}
              >
                Phone Number <span style={{ color: '#dc2626' }}>*</span>
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0901 000 002"
                required
                style={{
                  border: '1.5px solid #eeddc8',
                  borderRadius: '10px',
                  padding: '0.7rem 0.95rem',
                  width: '100%',
                  fontSize: '0.92rem',
                  color: '#3d2d23',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {!editing && (
            <div>
              <span
                style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#3d2d23',
                  marginBottom: '0.45rem',
                }}
              >
                Initial Password <span style={{ color: '#dc2626' }}>*</span>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters (e.g. Staff@Haven2026)"
                required
                style={{
                  border: '1.5px solid #eeddc8',
                  borderRadius: '10px',
                  padding: '0.7rem 0.95rem',
                  width: '100%',
                  fontSize: '0.92rem',
                  color: '#3d2d23',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div>
            <span
              style={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#3d2d23',
                marginBottom: '0.45rem',
              }}
            >
              Residential Address (Optional)
            </span>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Nguyen Trai, District 1, HCMC"
              style={{
                border: '1.5px solid #eeddc8',
                borderRadius: '10px',
                padding: '0.7rem 0.95rem',
                width: '100%',
                fontSize: '0.92rem',
                color: '#3d2d23',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23' }}>
                Assigned Sanctuary Roles <span style={{ color: '#dc2626' }}>*</span>
              </span>
              <span style={{ fontSize: '0.8rem', color: '#8c735f' }}>
                A staff member can have multiple functional roles
              </span>
            </div>

            {loadingRoles ? (
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: '#fdfbf7',
                  borderRadius: 12,
                  border: '1px dashed #eeddc8',
                }}
              >
                <Spin size="small" /> <span style={{ marginLeft: 8, color: '#785839' }}>Loading roles...</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                {roles.map((r) => {
                  const isChecked = selectedRoleIds.includes(r.id)
                  const icon = getRoleIcon(r.roleName)
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleRole(r.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isChecked ? '#fdf9f3' : '#ffffff',
                        border: `2px solid ${isChecked ? '#3d2d23' : '#eeddc8'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.18s ease',
                        boxShadow: isChecked ? '0 2px 8px rgba(61,45,35,0.08)' : 'none',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 9,
                            backgroundColor: isChecked ? '#3d2d23' : '#faf5ee',
                            color: isChecked ? '#ffffff' : '#785839',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            transition: 'all 0.18s ease',
                            flexShrink: 0,
                          }}
                        >
                          {icon}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: isChecked ? '#3d2d23' : '#554236',
                              lineHeight: 1.25,
                            }}
                          >
                            {r.roleName}
                          </div>
                          {r.totalPermissions !== undefined && (
                            <div style={{ fontSize: '0.74rem', color: '#8c735f', marginTop: 2 }}>
                              {r.totalPermissions} permissions
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: `2px solid ${isChecked ? '#3d2d23' : '#eeddc8'}`,
                          backgroundColor: isChecked ? '#3d2d23' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: 11,
                          flexShrink: 0,
                        }}
                      >
                        {isChecked && <CheckOutlined />}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: editing ? '1fr 1fr' : '1fr', gap: '1rem' }}>
            <div>
              <span
                style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#3d2d23',
                  marginBottom: '0.45rem',
                }}
              >
                Years of Experience <span style={{ color: '#dc2626' }}>*</span>
              </span>
              <input
                type="number"
                min="0"
                max="50"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                placeholder="e.g. 3"
                required
                style={{
                  border: '1.5px solid #eeddc8',
                  borderRadius: '10px',
                  padding: '0.7rem 0.95rem',
                  width: '100%',
                  fontSize: '0.92rem',
                  color: '#3d2d23',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {editing && (
              <div>
                <span
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#3d2d23',
                    marginBottom: '0.45rem',
                  }}
                >
                  Account Status
                </span>
                <Select
                  value={status}
                  onChange={(val) => setStatus(val)}
                  style={{ width: '100%', height: 42 }}
                  options={[
                    { value: 0, label: 'Active (Full Access Granted)' },
                    { value: 1, label: 'Inactive (Account Suspended)' },
                  ]}
                />
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.85rem',
              marginTop: '0.75rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #f1ece5',
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.65rem 1.8rem',
                backgroundColor: '#3d2d23',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(61, 45, 35, 0.18)',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Saving...' : editing ? 'Update Staff Member' : 'Add Staff Member'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => navigate(baseStaffPath)}
              style={{
                padding: '0.65rem 1.5rem',
                backgroundColor: '#ffffff',
                color: '#785839',
                border: '1.5px solid #eeddc8',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

export default AdminStaffFormPage
