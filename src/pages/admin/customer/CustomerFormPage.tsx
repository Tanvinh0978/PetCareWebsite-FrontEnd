import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { customerService } from '@/services/customer.service';
import { getApiErrorMessage } from '@/utils/apiError';

export default function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    customerService.fetchById(id)
      .then((res) => {
        const c = res.result;
        setFullName(c.fullName);
        setEmail(c.email);
        setPhoneNumber(c.phoneNumber);
        setAddress(c.address || '');
        setIsActive(c.isActive);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) {
      setError('Please fill out all required fields.');
      return;
    }
    if (!editing && (!email.trim() || !password)) {
      setError('Email and Password are required for new customers.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editing) {
        await customerService.update(id!, {
          id: id!,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
        });
        // Note: isActive toggling is handled separately in the list view or could be added here if backend supports it.
        // Assuming update payload doesn't take isActive based on types.
      } else {
        await customerService.create({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
        });
      }
      navigate('/admin/customers');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page" style={{ maxWidth: '640px' }}>
      <div className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{editing ? 'Edit Customer' : 'Add New Customer'}</h1>
          <p className="page-subtitle">
            {editing
              ? 'Update customer details and contact information.'
              : 'Create a new customer account.'}
          </p>
        </div>
        <Link to="/admin/customers" className="btn btn-secondary">
          Back to customers
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
            required={!editing}
          />
        </label>

        {!editing && (
          <label>
            Password <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a secure password"
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
            placeholder="e.g. 0912345678"
            required
          />
        </label>

        <label>
          Address
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Customer's physical address..."
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
  );
}
