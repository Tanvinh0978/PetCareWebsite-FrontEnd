import React, { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { App, Checkbox, Spin } from 'antd'
import { staffService } from '@/services/staff.service'
import { roleService } from '@/services/role.service'
import type { RoleDTO } from '@/types/role.types'
import { getApiErrorMessage } from '@/utils/apiError'

const AdminStaffFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const editing = Boolean(id)

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
  const [status, setStatus] = useState<number>(0) // 0: Active, 1: Inactive

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
            { id: 'A0000000-0000-0000-0000-000000000001', roleName: 'Admin', totalPermissions: 24 },
            { id: 'A0000000-0000-0000-0000-000000000002', roleName: 'Receptionist', totalPermissions: 14 },
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

  // Sync roleIds when roles finish loading if editing and roleIds wasn't available directly
  useEffect(() => {
    if (editing && roles.length > 0 && selectedRoleIds.length === 0 && id) {
      staffService.fetchById(id).then((st) => {
        if (st.roles && st.roles.length > 0) {
          const matchedIds = roles
            .filter((r) => st.roles.includes(r.roleName))
            .map((r) => r.id)
          if (matchedIds.length > 0) {
            setSelectedRoleIds(matchedIds)
          }
        }
      }).catch(() => {})
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
        message.success(`Staff "${cleanName}" updated successfully.`)
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
      navigate('/admin/staff')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page" style={{ maxWidth: '820px' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{editing ? 'Edit Staff Member' : 'Add New Staff Member'}</h1>
          <p className="page-subtitle">
            {editing
              ? 'Update profile details, contact information, and role assignments.'
              : 'Register a staff account and grant access roles according to job functions.'}
          </p>
        </div>
        <Link to="/admin/staff" className="btn btn-secondary">
          ← Back to staff list
        </Link>
      </div>

      {loading && <p>Loading staff details...</p>}

      <form onSubmit={onSubmit} className="form" hidden={loading}>
        {error && (
          <p className="msg error" role="alert" style={{ margin: '0 0 1.25rem 0' }}>
            {error}
          </p>
        )}

        {/* Full Name */}
        <label>
          Full Name <span style={{ color: 'var(--danger)' }}>*</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            required
          />
        </label>

        {/* Email & Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label>
            Email Address <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. staff@petcare.com"
              disabled={editing}
              style={editing ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              required
            />
          </label>

          <label>
            Phone Number <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 0901 000 002"
              required
            />
          </label>
        </div>

        {/* Address */}
        <label>
          Address (Optional)
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Nguyen Trai, District 1, HCMC"
          />
        </label>

        {/* Password (for new staff) */}
        {!editing && (
          <label>
            Initial Password <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters (e.g. Admin@123)"
              required
            />
          </label>
        )}

        {/* Roles Assignment */}
        <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#0f172a' }}>
            Assigned Roles <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          {loadingRoles ? (
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <Spin size="small" /> Loading available roles...
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '0.75rem',
                padding: '1rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              {roles.map((r) => {
                const isChecked = selectedRoleIds.includes(r.id)
                return (
                  <label
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: isChecked ? '#ecfdf5' : '#ffffff',
                      border: `1px solid ${isChecked ? '#059669' : '#cbd5e1'}`,
                      transition: 'all 0.15s ease',
                      fontWeight: isChecked ? 600 : 400,
                      color: isChecked ? '#047857' : '#334155',
                      margin: 0,
                    }}
                  >
                    <Checkbox
                      checked={isChecked}
                      onChange={() => toggleRole(r.id)}
                    />
                    <span>{r.roleName}</span>
                  </label>
                )
              })}
            </div>
          )}
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
            A staff member can have multiple roles (e.g. Receptionist + Boarding Staff).
          </span>
        </div>

        {/* Experience & Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label>
            Years of Experience <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="number"
              min="0"
              max="50"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              placeholder="e.g. 2"
              required
            />
          </label>

          {editing ? (
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
              >
                <option value={0}>Active (Account enabled)</option>
                <option value={1}>Inactive (Account suspended)</option>
              </select>
            </label>
          ) : (
            <div />
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update Staff Member' : 'Register Staff Member'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving}
            onClick={() => navigate('/admin/staff')}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminStaffFormPage
