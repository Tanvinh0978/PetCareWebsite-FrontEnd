import React, { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { App } from 'antd'
import { staffService } from '@/services/staff.service'
import { STAFF_ROLES } from '@/types/staff.types'
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
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>(STAFF_ROLES[0])
  const [yearsOfExperience, setYearsOfExperience] = useState<number | string>(1)
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    staffService
      .fetchById(id)
      .then((st) => {
        setFullName(st.fullName)
        setEmail(st.email)
        setPhoneNumber(st.phoneNumber)
        setRole(st.role || STAFF_ROLES[0])
        setYearsOfExperience(st.yearsOfExperience)
        setStatus(st.status)
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [id])

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
      setError('Temporary initial password is required for new staff account.')
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
          role,
          yearsOfExperience: numExp,
          status,
        })
        message.success(`Staff "${cleanName}" updated successfully.`)
      } else {
        await staffService.create({
          fullName: cleanName,
          email: cleanEmail,
          phoneNumber: cleanPhone,
          password,
          role,
          yearsOfExperience: numExp,
          status,
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
    <section className="page" style={{ maxWidth: '780px' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{editing ? 'Edit Staff Member' : 'Add New Staff Member'}</h1>
          <p className="page-subtitle">
            {editing
              ? 'Update contact details, job title, and experience.'
              : 'Register a new employee for veterinary, grooming, or care operations.'}
          </p>
        </div>
        <Link to="/admin/staff" className="btn btn-secondary">
          ← Back to staff
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
            placeholder="e.g. Dr. Nguyen Thu Thao"
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
              placeholder="e.g. thao.nguyen@petcare.com"
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
              placeholder="e.g. 0903 123 456"
              required
            />
          </label>
        </div>

        {/* Initial Password when creating */}
        {!editing && (
          <label>
            Initial Account Password <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </label>
        )}

        {/* Role & Experience */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label>
            Role / Position <span style={{ color: 'var(--danger)' }}>*</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label>
            Years of Experience <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="number"
              min="0"
              max="50"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              placeholder="e.g. 3"
              required
            />
          </label>
        </div>

        {/* Status */}
        <label>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
          >
            <option value="Active">Active (Available for booking tasks)</option>
            <option value="Inactive">Inactive (On leave / deactivated)</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
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
