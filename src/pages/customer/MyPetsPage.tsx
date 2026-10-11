import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Row, Typography, Space, Modal, message, Spin, Empty, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { petService } from '@/services/pet.service';
import { useAuthStore } from '@/store/useAuthStore';
import PetDetailModal from '@/components/pet/PetDetailModal';

const { Title, Text } = Typography;

const MyPetsPage: React.FC = () => {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any | null>(null);
  const navigate = useNavigate();

  const fetchPets = async () => {
    try {
      setLoading(true);
      const res = await petService.fetchMyPets(true);
      const list = Array.isArray(res) ? res : ((res as any)?.items || []);
      const activePets = list.filter((p: any) => p.isActive !== false && !p.isDeleted);
      setPets(activePets);
    } catch (error) {
      message.error('Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this pet?',
      content: 'This pet will be removed from your list.',
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await petService.delete(id);
          setPets(prev => prev.filter(p => p.id !== id));
          message.success('Pet deleted successfully');
        } catch (error) {
          message.error('Failed to delete pet');
        }
      }
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>My Pets</Title>
        <Button type="primary" style={{ backgroundColor: '#059669' }} icon={<PlusOutlined />} onClick={() => navigate('/customer/pets/new')}>
          Add New Pet
        </Button>
      </div>

      {pets.length === 0 ? (
        <Empty description="You haven't added any pets yet." />
      ) : (
        <Row gutter={[16, 16]}>
          {pets.map(pet => (
            <Col xs={24} sm={12} md={8} lg={6} key={pet.id}>
              <Card
                hoverable
                onClick={() => setSelectedPet(pet)}
                style={{ cursor: 'pointer' }}
                cover={
                  pet.imageUrl ? (
                    <div style={{ height: 160, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                      <img
                        alt={pet.name}
                        src={pet.imageUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : undefined
                }
                actions={[
                  <EyeOutlined key="view" onClick={(e) => { e.stopPropagation(); setSelectedPet(pet); }} style={{ color: '#059669' }} title="View Details" />,
                  <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); navigate(`/customer/pets/${pet.id}/edit`); }} title="Edit" />,
                  <DeleteOutlined key="delete" onClick={(e) => { e.stopPropagation(); handleDelete(pet.id); }} style={{ color: 'red' }} title="Delete" />
                ]}
              >
                <Card.Meta
                  title={
                    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                      <span>{pet.name}</span>
                      <Tag color="blue">{pet.species === 1 || pet.species === 'Cat' ? 'Cat' : 'Dog'}</Tag>
                    </Space>
                  }
                  description={
                    <div style={{ marginTop: '10px' }}>
                      <p><strong>Breed:</strong> {pet.breed || 'N/A'}</p>
                      <p><strong>Weight:</strong> {pet.weight} kg</p>
                      <p><strong>Age:</strong> {pet.age ? pet.age + ' years' : 'N/A'}</p>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <PetDetailModal
        pet={selectedPet}
        open={Boolean(selectedPet)}
        onClose={() => setSelectedPet(null)}
      />
    </div>
  );
};

export default MyPetsPage;
