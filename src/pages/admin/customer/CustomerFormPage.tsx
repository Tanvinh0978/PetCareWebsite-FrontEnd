import React, { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { customerService } from '@/services/customer.service'
import { getApiErrorMessage } from '@/utils/apiError'

const AdminCustomerFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (!id) return
    customerService.fetchById(id)
      .then((res) => {
        setFullName(res.result.fullName)
        setEmail(res.result.email)
        setPhoneNumber(res.result.phoneNumber)
        setAddress(res.result.address || '')
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [id])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (!editing && !password) {
      setError('Password is required.')
      return
    }
    if (!phoneNumber.trim()) {
      setError('Phone number is required.')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await customerService.update(id as string, {
          id: id as string,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim() || undefined,
        })
      } else {
        await customerService.create({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phoneNumber: phoneNumber.trim(),
          address: address.trim() || undefined,
        } as any)
      }
      navigate('/admin/customers')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page" style={{ maxWidth: '840px' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{editing ? 'Edit Customer' : 'Add New Customer'}</h1>
          <p className="page-subtitle">
            {editing
              ? 'Update existing customer details.'
              : 'Fill out the form below to create a new customer.'}
          </p>
        </div>
        <Link to="/admin/customers" className="btn btn-secondary">
          ← Back to customers
        </Link>
      </div>

      {loading && <p>Loading customer details...</p>}

      <form onSubmit={onSubmit} className="form" hidden={loading}>
        <label>
          Full Name <span style={{ color: 'var(--danger)' }}>*</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. John Doe"
            required
          />
        </label>

        <label>
          Email <span style={{ color: 'var(--danger)' }}>*</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. john@example.com"
            disabled={editing}
            required
          />
        </label>

        {!editing && (
          <label>
            Password <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </label>
        )}

        <label>
          Phone Number <span style={{ color: 'var(--danger)' }}>*</span>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. 0123456789"
            required
          />
        </label>

        <label>
          Address
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Detailed address..."
          />
        </label>

        {error && <p className="msg error" role="alert">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving changes...' : editing ? 'Save changes' : 'Create customer'}
          </button>
          <Link to="/admin/customers" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}

export default AdminCustomerFormPage
