import React, { useEffect, useState, useMemo, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Input,
  Select,
  Button,
  Row,
  Col,
  Divider,
  Alert,
  Spin,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { DogIcon, CatIcon, PawIcon } from '@/components/common/PetIcons';
import { ImageUpload } from '@/components/common/ImageUpload';
import { getApiErrorMessage } from '@/utils/apiError';
import { petService } from '@/services/pet.service';

const { Title, Text } = Typography;

export const POPULAR_DOG_BREEDS = [
  'Golden Retriever',
  'Poodle',
  'Corgi',
  'French Bulldog',
  'Labrador Retriever',
  'Pomeranian',
  'Pug',
  'Shiba Inu',
  'Siberian Husky',
  'Samoyed',
  'German Shepherd',
  'Beagle',
  'Chihuahua',
  'Yorkshire Terrier',
  'Dachshund',
  'Bichon Frise',
  'Maltese',
  'Shih Tzu',
  'Alaskan Malamute',
  'Border Collie',
  'Doberman',
  'Rottweiler',
  'Mixed Breed',
  'Other',
];

export const POPULAR_CAT_BREEDS = [
  'British Shorthair',
  'British Longhair',
  'Persian',
  'Ragdoll',
  'Maine Coon',
  'Scottish Fold',
  'Siamese',
  'Sphynx',
  'Bengal',
  'American Shorthair',
  'Russian Blue',
  'Munchkin',
  'Exotic Shorthair',
  'Birman',
  'Devon Rex',
  'Domestic Shorthair',
  'Mixed Breed',
  'Other',
];

const PetFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [species, setSpecies] = useState<'Dog' | 'Cat'>('Dog');
  const [selectedBreed, setSelectedBreed] = useState<string>('');
  const [customBreed, setCustomBreed] = useState('');
  const [gender, setGender] = useState('Unknown');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  // Dynamic breed options based on species
  const breedOptions = useMemo(() => {
    const list = species === 'Cat' ? POPULAR_CAT_BREEDS : POPULAR_DOG_BREEDS;
    return list.map((b) => ({ value: b, label: b }));
  }, [species]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    petService
      .fetchById(id)
      .then((pet: any) => {
        const result = pet?.result || pet?.data || pet;
        if (result) {
          setName(result.name || '');
          setImageUrl(result.imageUrl || '');
          const sp: 'Dog' | 'Cat' = result.species === 1 || result.species === 'Cat' ? 'Cat' : 'Dog';
          setSpecies(sp);

          const list = sp === 'Cat' ? POPULAR_CAT_BREEDS : POPULAR_DOG_BREEDS;
          const currentBreed = result.breed || '';
          if (list.includes(currentBreed)) {
            setSelectedBreed(currentBreed);
            setCustomBreed('');
          } else if (currentBreed) {
            setSelectedBreed('Other');
            setCustomBreed(currentBreed);
          } else {
            setSelectedBreed('');
            setCustomBreed('');
          }

          setGender(result.gender || 'Unknown');
          setAge(result.age?.toString() || '');
          setWeight(result.weight?.toString() || '');
          setNotes(result.healthNotes || '');
        } else {
          setError('Failed to load pet details');
        }
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSpeciesChange = (newSpecies: 'Dog' | 'Cat') => {
    setSpecies(newSpecies);
    const list = newSpecies === 'Cat' ? POPULAR_CAT_BREEDS : POPULAR_DOG_BREEDS;
    if (selectedBreed && selectedBreed !== 'Other' && !list.includes(selectedBreed)) {
      setSelectedBreed('');
      setCustomBreed('');
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAge = Number(age);
    const parsedWeight = Number(weight);

    if (!name.trim()) {
      setError('Pet name is required.');
      return;
    }
    if (age.trim() === '' || weight.trim() === '') {
      setError('Age and weight are required for booking.');
      return;
    }
    if (isNaN(parsedAge) || isNaN(parsedWeight)) {
      setError('Age and Weight must be valid numbers.');
      return;
    }
    if (parsedAge < 0 || parsedWeight <= 0) {
      setError('Age cannot be negative and Weight must be greater than 0.');
      return;
    }

    const speciesEnum = species === 'Cat' ? 1 : 0;
    const finalBreed = selectedBreed === 'Other' ? (customBreed.trim() || 'Other') : (selectedBreed.trim() || 'Mixed Breed');

    const payload: any = {
      name: name.trim(),
      species: speciesEnum,
      breed: finalBreed,
      age: parsedAge,
      weight: parsedWeight,
      healthNotes: notes.trim(),
      imageUrl: imageUrl.trim() || undefined,
    };

    // Get customerId from localStorage (set by auth on login)
    const customerId = localStorage.getItem('petcare.customerId');
    if (!editing && customerId) {
      payload.customerId = customerId;
    }

    setSaving(true);
    try {
      if (editing) {
        await petService.update(id!, payload as any);
      } else {
        await petService.create(payload as any);
      }
      navigate('/customer/pets');
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSaving(false);
    }
  };

  const isPetCat = species === 'Cat';

  return (
    <section className="page" style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Header section */}
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
        <div>
          <Title level={2} style={{ margin: 0, color: 'var(--slate-900, #0f172a)' }}>
            {editing ? 'Edit Pet Profile' : 'Add New Pet'}
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            {editing
              ? 'Update medical records, body weight, and special care instructions.'
              : 'Register your furry companion to book tailored spa treatments and luxury suites.'}
          </Text>
        </div>

        <Link
          to="/customer/pets"
          className="btn-action view"
          style={{
            padding: '0.45rem 1.1rem',
            borderRadius: 8,
            backgroundColor: 'var(--paper, #fdf9f3)',
            borderColor: '#e8ded6',
            color: '#3d2d23',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 12 }} /> Back to My Pets
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Spin size="large" tip="Loading pet profile..." />
        </div>
      ) : (
        <Card
          style={{
            borderRadius: 20,
            border: '1px solid #e8ded6',
            backgroundColor: 'var(--paper-card, #ffffff)',
            boxShadow: 'var(--shadow-md)',
          }}
          bodyStyle={{ padding: '32px 36px' }}
        >
          <form onSubmit={onSubmit}>
            <Row gutter={[36, 24]}>
              {/* Left Column: Dedicated Photo Profile Section */}
              <Col xs={24} md={8}>
                <div
                  style={{
                    background: 'var(--paper, #fdf9f3)',
                    border: '1px solid #e8ded6',
                    borderRadius: 16,
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <ImageUpload
                      value={imageUrl}
                      onChange={(url) => setImageUrl(url)}
                      folder="pets"
                      shape="circle"
                      width={120}
                      height={120}
                      title="Upload Photo"
                      helperText="PNG, JPG, WEBP under 5MB"
                      disabled={saving}
                    />
                  </div>

                  {/* Species & Name Pill Preview */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 14px',
                      borderRadius: 999,
                      background: isPetCat ? '#faf5ff' : '#eff6ff',
                      color: isPetCat ? '#7e22ce' : '#1d4ed8',
                      border: `1px solid ${isPetCat ? '#e9d5ff' : '#bfdbfe'}`,
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 14,
                    }}
                  >
                    {isPetCat ? <CatIcon size={15} /> : <DogIcon size={15} />}
                    <span>{species}</span>
                    {name && <span>· {name}</span>}
                  </div>

                  {/* Caregiver Tip */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: 12,
                      border: '1px solid #e8ded6',
                      padding: '12px 14px',
                      textAlign: 'left',
                      fontSize: '0.82rem',
                      color: '#785839',
                      lineHeight: 1.5,
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                      <PawIcon size={13} style={{ color: '#c69f7b' }} />
                      <span>Caregiver Tip</span>
                    </div>
                    <span>
                      A clear profile photo allows our concierge and groomers to recognize your pet immediately upon check-in.
                    </span>
                  </div>
                </div>
              </Col>

              {/* Right Column: Structured Information */}
              <Col xs={24} md={16}>
                {/* Section 1: Basic Identity */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#3d2d23',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <PawIcon size={14} style={{ color: '#c69f7b' }} />
                    <span>Basic Information</span>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={14}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#334155' }}>
                        Pet Name <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <Input
                        size="large"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Milo, Bella..."
                        style={{ borderRadius: 10, borderColor: '#e8ded6' }}
                        required
                      />
                    </Col>

                    <Col xs={24} sm={10}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#334155' }}>
                        Species <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <Select
                        size="large"
                        className="luxury-select"
                        value={species}
                        onChange={handleSpeciesChange}
                        style={{ width: '100%' }}
                        options={[
                          {
                            value: 'Dog',
                            label: (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <DogIcon size={16} /> Dog
                              </span>
                            ),
                          },
                          {
                            value: 'Cat',
                            label: (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <CatIcon size={16} /> Cat
                              </span>
                            ),
                          },
                        ]}
                      />
                    </Col>

                    {/* Breed Select with search & 'Other' custom input */}
                    <Col xs={24} sm={selectedBreed === 'Other' ? 12 : 14}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#334155' }}>
                        Breed
                      </label>
                      <Select
                        showSearch
                        size="large"
                        className="luxury-select"
                        value={selectedBreed || undefined}
                        onChange={(val) => {
                          setSelectedBreed(val);
                          if (val !== 'Other') {
                            setCustomBreed('');
                          }
                        }}
                        placeholder="Search or select breed"
                        style={{ width: '100%' }}
                        options={breedOptions}
                        filterOption={(input, option) =>
                          (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Col>

                    {selectedBreed === 'Other' && (
                      <Col xs={24} sm={12}>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#334155' }}>
                          Specify Breed Name <span style={{ color: '#e11d48' }}>*</span>
                        </label>
                        <Input
                          size="large"
                          value={customBreed}
                          onChange={(e) => setCustomBreed(e.target.value)}
                          placeholder="e.g. Cavapoo, Maltipoo..."
                          style={{ borderRadius: 10, borderColor: '#e8ded6' }}
                          required
                        />
                      </Col>
                    )}

                    <Col xs={24} sm={selectedBreed === 'Other' ? 24 : 10}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#334155' }}>
                        Gender
                      </label>
                      <Select
                        size="large"
                        className="luxury-select"
                        value={gender}
                        onChange={setGender}
                        style={{ width: '100%' }}
                        options={[
                          { value: 'Male', label: 'Male ♂' },
                          { value: 'Female', label: 'Female ♀' },
                          { value: 'Unknown', label: 'Unknown' },
                        ]}
                      />
                    </Col>
                  </Row>
                </div>

                <Divider style={{ margin: '20px 0', borderColor: '#e8ded6' }} />

                {/* Section 2: Physical & Health Metrics */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#3d2d23',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <InfoCircleOutlined style={{ color: '#c69f7b', fontSize: 14 }} />
                    <span>Physical Attributes</span>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#334155' }}>
                        Weight (kg) <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <Input
                        size="large"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        suffix={<span style={{ color: '#8c7b6f', fontWeight: 600 }}>kg</span>}
                        placeholder="e.g. 5.5"
                        style={{ borderRadius: 10, borderColor: '#e8ded6' }}
                        required
                      />
                      <span style={{ fontSize: '0.76rem', color: '#8c7b6f', marginTop: 4, display: 'block' }}>
                        *Used for tailored grooming rates &amp; room tier sizing.
                      </span>
                    </Col>

                    <Col xs={24} sm={12}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#334155' }}>
                        Age (years) <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <Input
                        size="large"
                        type="number"
                        step="0.5"
                        min="0"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        suffix={<span style={{ color: '#8c7b6f', fontWeight: 600 }}>years</span>}
                        placeholder="e.g. 2"
                        style={{ borderRadius: 10, borderColor: '#e8ded6' }}
                        required
                      />
                    </Col>
                  </Row>
                </div>

                <Divider style={{ margin: '20px 0', borderColor: '#e8ded6' }} />

                {/* Section 3: Care Instructions & Special Notes */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#3d2d23',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <FileTextOutlined style={{ color: '#c69f7b', fontSize: 14 }} />
                    <span>Special Notes &amp; Medical Instructions (Optional)</span>
                  </div>

                  <Input.TextArea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Allergies, chronic conditions, behavioral traits, favorite treats, or special handling instructions..."
                    style={{ borderRadius: 10, borderColor: '#e8ded6', fontSize: '0.92rem' }}
                  />
                </div>

                {error && (
                  <Alert
                    type="error"
                    showIcon
                    message={error}
                    style={{ marginBottom: 20, borderRadius: 10 }}
                  />
                )}

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 24 }}>
                  <Button
                    size="large"
                    onClick={() => navigate('/customer/pets')}
                    style={{
                      borderRadius: 10,
                      padding: '0 24px',
                      borderColor: '#e8ded6',
                      color: '#6b5e54',
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={saving}
                    icon={<SaveOutlined />}
                    style={{
                      backgroundColor: '#3d2d23',
                      borderColor: '#3d2d23',
                      borderRadius: 10,
                      padding: '0 32px',
                      fontWeight: 600,
                    }}
                  >
                    {saving ? 'Saving...' : editing ? 'Save Changes' : 'Register Pet'}
                  </Button>
                </div>
              </Col>
            </Row>
          </form>
        </Card>
      )}
    </section>
  );
};

export default PetFormPage;
