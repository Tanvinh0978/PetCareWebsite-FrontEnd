import React, { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { customerService } from '@/services/customer.service'
import { getApiErrorMessage } from '@/utils/apiError'

const AdminCustomerFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const baseCustomerPath = location.pathname.startsWith('/staff') ? '/staff/customers' : '/admin/customers'
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
      navigate(baseCustomerPath)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{editing ? 'Edit Customer' : 'Add New Customer'}</h1>
          <p className="page-subtitle">
            {editing
              ? 'Update existing customer details, phone number, and address.'
              : 'Fill out the form below to register a new customer account.'}
          </p>
        </div>
        <Link to={baseCustomerPath} className="btn btn-secondary">
          ← Back to customers
        </Link>
      </div>

      {loading && <p>Loading customer details...</p>}

      <form onSubmit={onSubmit} hidden={loading}>
        {error && (
          <p className="msg error" role="alert" style={{ margin: '0 0 1.25rem 0' }}>
            {error}
          </p>
        )}

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #eeddc8',
            borderRadius: '16px',
            padding: '28px 32px',
            boxShadow: '0 4px 20px rgba(61, 45, 35, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div>
            <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
              Full Name <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              style={{
                border: '1.5px solid #eeddc8',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                Email Address <span style={{ color: 'var(--danger)' }}>*</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                disabled={editing}
                required
                style={{
                  border: '1.5px solid #eeddc8',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  width: '100%',
                  backgroundColor: editing ? '#fdf9f3' : '#ffffff',
                  cursor: editing ? 'not-allowed' : 'text',
                  color: editing ? '#785839' : '#0f172a',
                }}
              />
              {editing && (
                <span style={{ fontSize: '0.78rem', color: '#785839', display: 'block', marginTop: '0.25rem' }}>
                  Email address cannot be changed.
                </span>
              )}
            </div>

            <div>
              <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                Phone Number <span style={{ color: 'var(--danger)' }}>*</span>
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0901 000 001"
                required
                style={{
                  border: '1.5px solid #eeddc8',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  width: '100%',
                }}
              />
            </div>
          </div>

          {!editing && (
            <div>
              <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
                Initial Password <span style={{ color: 'var(--danger)' }}>*</span>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters (e.g. Cust@123)"
                required
                style={{
                  border: '1.5px solid #eeddc8',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  width: '100%',
                }}
              />
            </div>
          )}

          <div>
            <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#3d2d23', marginBottom: '0.4rem' }}>
              Address (Optional)
            </span>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Nguyen Trai, District 1, HCMC"
              style={{
                border: '1.5px solid #eeddc8',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                width: '100%',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #f1ece5',
            }}
          >
            <button
              type="submit"
              className="btn"
              disabled={saving}
              style={{
                padding: '0.65rem 1.6rem',
                backgroundColor: '#3d2d23',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(61, 45, 35, 0.15)',
              }}
            >
              {saving ? 'Saving...' : editing ? 'Update Customer' : 'Add Customer'}
            </button>
            <Link
              to={baseCustomerPath}
              className="btn btn-secondary"
              style={{
                padding: '0.65rem 1.4rem',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.92rem',
              }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </section>
  )
}

export default AdminCustomerFormPage
