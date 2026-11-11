import React, { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { message, Select } from 'antd';
import {
  ScissorOutlined,
  HomeOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { createService, getServiceById, updateService } from '@/api/serviceApi';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';
import ImageUpload from '@/components/common/ImageUpload';
import { roomTypeService, type RoomTypeDTO } from '@/services/roomType.service';
import {
  PRICING_UNIT_LABEL,
  SERVICE_TYPE_LABEL,
  type PricingUnit,
  type ServiceType,
} from '@/types/service';

interface PriceRow {
  minWeight: string;
  maxWeight: string;
  price: string;
  pricingUnit: PricingUnit;
}

const emptyRow = (): PriceRow => ({ minWeight: '', maxWeight: '', price: '', pricingUnit: 'Per_Turn' });
const num = (v: string) => (v.trim() === '' ? null : Number(v));

function validate(name: string, rows: PriceRow[]): string {
  if (!name.trim()) return 'Enter a service name.';
  if (name.length > 150) return 'Service name must be at most 150 characters.';
  for (const [i, r] of rows.entries()) {
    const n = `Price tier ${i + 1}`;
    const min = num(r.minWeight);
    const max = num(r.maxWeight);
    if (r.price.trim() === '' || Number(r.price) < 0) return `${n}: price must be 0 or more.`;
    if (min !== null && min < 0) return `${n}: minimum weight must be 0 or more.`;
    if (max !== null && max <= 0) return `${n}: maximum weight must be greater than 0.`;
    if (min !== null && max !== null && max <= min) return `${n}: maximum weight must be greater than minimum weight.`;
  }
  return '';
}

export default function ServiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const baseServicePath = location.pathname.startsWith('/staff') ? '/staff/services' : '/admin/services';
  const editing = Boolean(id);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.SERVICE_MANAGE);

  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(editing);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Grooming');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>([]);
  const [roomTypesLoading, setRoomTypesLoading] = useState(false);
  const [rows, setRows] = useState<PriceRow[]>([emptyRow()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (serviceType !== 'Boarding') return;

    let active = true;
    setRoomTypesLoading(true);
    roomTypeService.fetchAll()
      .then((res) => {
        if (!active) return;
        if (res.isSuccess && res.result) {
          setRoomTypes(res.result);
        } else {
          setError(res.message || 'Failed to load room types.');
        }
      })
      .catch((e) => {
        if (active) setError(getErrorMessage(e));
      })
      .finally(() => {
        if (active) setRoomTypesLoading(false);
      });

    return () => { active = false; };
  }, [serviceType]);

  useEffect(() => {
    if (!id) return;
    getServiceById(id)
      .then((s) => {
        setName(s.name);
        setImageUrl(s.imageUrl ?? '');
        setDescription(s.description ?? '');
        setServiceType(s.serviceType);
        setRoomTypeId(s.roomTypeId ?? '');
        setIsActive(s.isActive);
        setRows(
          s.prices.length
            ? s.prices.map((p) => ({
                minWeight: p.minWeight === null ? '' : String(p.minWeight),
                maxWeight: p.maxWeight === null ? '' : String(p.maxWeight),
                price: String(p.price),
                pricingUnit: p.pricingUnit,
              }))
            : [emptyRow()]
        );
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const setRow = (i: number, patch: Partial<PriceRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = validate(name, rows);
    const validationError = serviceType === 'Boarding' && !roomTypeId
      ? 'Please select an associated room type for boarding services.'
      : problem;
    setError(validationError);
    if (validationError) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        serviceType,
        imageUrl: imageUrl.trim() || undefined,
        roomTypeId: serviceType === 'Boarding' ? roomTypeId : undefined,
        prices: rows.map((r) => ({
          minWeight: num(r.minWeight),
          maxWeight: num(r.maxWeight),
          price: Number(r.price),
          pricingUnit: r.pricingUnit,
        })),
      };
      if (id) {
        await updateService(id, { ...payload, isActive });
        message.success(`Service "${name.trim()}" updated successfully.`);
      } else {
        await createService(payload);
        message.success(`Service "${name.trim()}" created successfully.`);
      }
      navigate(baseServicePath);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const getCategoryIcon = (type: ServiceType) => {
    switch (type) {
      case 'Grooming':
        return <ScissorOutlined style={{ fontSize: '15px' }} />;
      case 'Boarding':
        return <HomeOutlined style={{ fontSize: '15px' }} />;
      case 'Diet':
        return <HeartOutlined style={{ fontSize: '15px' }} />;
      case 'Care':
        return <MedicineBoxOutlined style={{ fontSize: '15px' }} />;
      default:
        return null;
    }
  };

  if (!canManage) {
    return (
      <section className="page" style={{ maxWidth: '820px', margin: '0 auto' }}>
        <p className="msg error" role="alert">
          You do not have permission to manage services.
        </p>
        <Link to={baseServicePath} className="btn btn-secondary">
          ← Back to services
        </Link>
      </section>
    );
  }

  return (
    <section className="page" style={{ maxWidth: '820px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div
        className="page-head"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.1rem',
              fontWeight: 700,
              color: '#3d2d23',
              margin: '0 0 0.35rem 0',
            }}
          >
            {editing ? 'Edit Service' : 'Add New Service'}
          </h1>
          <p className="page-subtitle" style={{ color: '#785839', fontSize: '0.92rem', margin: 0 }}>
            {editing
              ? 'Update service specifications, active availability, and custom weight tiers.'
              : 'Create a new pet care service with custom weight-bracket pricing.'}
          </p>
        </div>
        <Link
          to={baseServicePath}
          style={{
            padding: '0.45rem 1.1rem',
            borderRadius: '20px',
            border: '1px solid #eeddc8',
            background: '#ffffff',
            color: '#785839',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(61, 45, 35, 0.05)',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: '12px' }} />
          <span>Back to services</span>
        </Link>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#785839' }}>
          Loading service details...
        </div>
      )}

      <form onSubmit={onSubmit} hidden={loading}>
        {error && (
          <p
            className="msg error"
            role="alert"
            style={{
              margin: '0 0 1.25rem 0',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
            }}
          >
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
            gap: '1.35rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '210px 1fr',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            <div
              style={{
                background: '#fdfbf7',
                border: '1.5px solid #eeddc8',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                width: '100%',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#3d2d23',
                  marginBottom: '0.75rem',
                }}
              >
                Service Photo
              </span>
              <ImageUpload
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                folder="services"
                shape="square"
                width={150}
                height={120}
                align="center"
                title="Select Image"
                helperText="PNG, JPG, WEBP up to 5MB"
                disabled={saving}
              />

              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: '#fcf8f2',
                  border: '1px solid #f0e6dc',
                  fontSize: '0.76rem',
                  color: '#785839',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <InfoCircleOutlined style={{ fontSize: '13px', marginTop: '2px', color: '#c69f7b', flexShrink: 0 }} />
                <span>Clear photos help pet parents choose the right package.</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#3d2d23',
                    marginBottom: '0.4rem',
                  }}
                >
                  Service Name <span style={{ color: 'var(--danger)' }}>*</span>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                  placeholder="e.g. Full Grooming & Bathing Package"
                  required
                  style={{
                    border: '1.5px solid #eeddc8',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    width: '100%',
                    fontSize: '0.92rem',
                    color: '#3d2d23',
                    backgroundColor: '#ffffff',
                    transition: 'border-color 0.15s ease',
                  }}
                />
              </div>

              <div>
                <span
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#3d2d23',
                    marginBottom: '0.4rem',
                  }}
                >
                  Service Category <span style={{ color: 'var(--danger)' }}>*</span>
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => {
                    const selected = serviceType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setServiceType(t)}
                        style={{
                          padding: '0.65rem 0.5rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${selected ? '#3d2d23' : '#eeddc8'}`,
                          background: selected ? '#3d2d23' : '#fdf9f3',
                          color: selected ? '#ffffff' : '#785839',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                          boxShadow: selected ? '0 2px 6px rgba(61, 45, 35, 0.2)' : 'none',
                        }}
                      >
                        {getCategoryIcon(t)}
                        <span>{SERVICE_TYPE_LABEL[t]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {serviceType === 'Boarding' && (
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: '#3d2d23',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Associated Room Type (Room Category) <span style={{ color: 'var(--danger)' }}>*</span>
                  </span>
                  <select
                    value={roomTypeId}
                    onChange={(e) => setRoomTypeId(e.target.value)}
                    disabled={roomTypesLoading || saving}
                    required
                    style={{
                      border: '1.5px solid #eeddc8',
                      borderRadius: '8px',
                      padding: '0.65rem 2.2rem 0.65rem 0.85rem',
                      width: '100%',
                      fontSize: '0.9rem',
                      color: '#3d2d23',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="" disabled>
                      {roomTypesLoading ? 'Loading room types...' : 'Select a room type category...'}
                    </option>
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name}
                      </option>
                    ))}
                  </select>
                  {!roomTypesLoading && roomTypes.length === 0 && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.82rem', display: 'block', marginTop: '0.35rem' }}>
                      No room types found. Please create a room type before saving this boarding service.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <span
              style={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#3d2d23',
                marginBottom: '0.4rem',
              }}
            >
              Description (Optional)
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is included in this service (procedures, benefits, products used, caregiver notes)..."
              style={{
                border: '1.5px solid #eeddc8',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                width: '100%',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                color: '#3d2d23',
                backgroundColor: '#ffffff',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {editing && (
            <div
              style={{
                background: isActive ? '#f7fdf9' : '#faf6f0',
                border: `1.5px solid ${isActive ? '#bbf7d0' : '#eeddc8'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3d2d23' }}
                />
                <span style={{ fontSize: '0.88rem', color: '#3d2d23', fontWeight: 600 }}>
                  Active Service (Publicly visible in customer booking catalog)
                </span>
              </label>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor: isActive ? '#dcfce7' : '#f1ece5',
                  color: isActive ? '#15803d' : '#785839',
                }}
              >
                {isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          )}

          <div
            style={{
              background: '#fdfbf7',
              border: '1.5px solid #eeddc8',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '0.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#3d2d23',
                  }}
                >
                  Pricing Tiers
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#785839' }}>
                  Configure prices based on pet weight. Leave Min or Max empty for open-ended brackets (e.g. Under 5kg or Over 20kg).
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: '0.85rem',
                border: '1px solid #eeddc8',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(61, 45, 35, 0.04)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#fcf8f2', borderBottom: '1.5px solid #eeddc8' }}>
                    <th style={{ width: '110px', padding: '10px 14px', fontSize: '0.78rem', fontWeight: 700, color: '#785839', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Min Weight (kg)
                    </th>
                    <th style={{ width: '110px', padding: '10px 14px', fontSize: '0.78rem', fontWeight: 700, color: '#785839', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Max Weight (kg)
                    </th>
                    <th style={{ minWidth: '150px', padding: '10px 14px', fontSize: '0.78rem', fontWeight: 700, color: '#785839', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Price (VND) <span style={{ color: 'var(--danger)' }}>*</span>
                    </th>
                    <th style={{ width: '150px', minWidth: '145px', padding: '10px 14px', fontSize: '0.78rem', fontWeight: 700, color: '#785839', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Pricing Unit
                    </th>
                    <th style={{ width: '95px', padding: '10px 14px', fontSize: '0.78rem', fontWeight: 700, color: '#785839', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i < rows.length - 1 ? '1px solid #f5ede4' : 'none',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 0"
                          aria-label="Minimum weight"
                          value={r.minWeight}
                          onChange={(e) => setRow(i, { minWeight: e.target.value })}
                          style={{
                            border: '1px solid #eeddc8',
                            borderRadius: '6px',
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.88rem',
                            width: '100%',
                            backgroundColor: '#ffffff',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 10"
                          aria-label="Maximum weight"
                          value={r.maxWeight}
                          onChange={(e) => setRow(i, { maxWeight: e.target.value })}
                          style={{
                            border: '1px solid #eeddc8',
                            borderRadius: '6px',
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.88rem',
                            width: '100%',
                            backgroundColor: '#ffffff',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="e.g. 150000"
                          aria-label="Price in VND"
                          value={r.price}
                          onChange={(e) => setRow(i, { price: e.target.value })}
                          required
                          style={{
                            border: '1px solid #eeddc8',
                            borderRadius: '6px',
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.88rem',
                            width: '100%',
                            fontWeight: 600,
                            color: '#3d2d23',
                            backgroundColor: '#ffffff',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px', width: '150px', minWidth: '145px' }}>
                        <Select
                          aria-label="Pricing unit"
                          value={r.pricingUnit}
                          onChange={(val) => setRow(i, { pricingUnit: val as PricingUnit })}
                          style={{ width: '100%' }}
                          options={[
                            { value: 'Per_Turn', label: '/ session' },
                            { value: 'Per_Day', label: '/ day' },
                            { value: 'Item', label: '/ item' },
                          ]}
                        />
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {rows.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                            title="Remove this price tier"
                            style={{
                              background: '#fff1f0',
                              border: '1px solid #ffccc7',
                              color: '#cf1322',
                              borderRadius: '6px',
                              padding: '0.4rem 0.65rem',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <DeleteOutlined style={{ fontSize: '12px' }} />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#b59f8c' }}>Required</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setRows((rs) => [...rs, emptyRow()])}
                style={{
                  border: '1.5px dashed #c69f7b',
                  background: '#ffffff',
                  color: '#785839',
                  borderRadius: '8px',
                  padding: '0.55rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fdf9f3';
                  e.currentTarget.style.borderColor = '#3d2d23';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#c69f7b';
                }}
              >
                <PlusOutlined style={{ fontSize: '12px' }} />
                <span>Add price tier</span>
              </button>
            </div>
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
                padding: '0.65rem 1.8rem',
                backgroundColor: '#3d2d23',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(61, 45, 35, 0.15)',
                transition: 'all 0.15s ease',
              }}
            >
              {saving ? 'Saving changes...' : editing ? 'Update Service' : 'Create Service'}
            </button>
            <Link
              to={baseServicePath}
              className="btn btn-secondary"
              style={{
                padding: '0.65rem 1.4rem',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.92rem',
                border: '1.5px solid #eeddc8',
                color: '#785839',
                background: '#ffffff',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </section>
  );
}
